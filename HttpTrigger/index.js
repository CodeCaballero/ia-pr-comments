const azdev = require("azure-devops-node-api");
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

module.exports = async function (context, req) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureKey = process.env.AZURE_OPENAI_KEY;
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT;
    const pat = process.env.AZURE_DEVOPS_PAT;
    const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;

    const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureKey));
    const prDetails = req.body?.resource;

    if (!prDetails) {
        context.log.error("No Pull Request data received.");
        return;
    }

    const prId = prDetails.pullRequestId;
    const repoId = prDetails.repository.id;
    const project = prDetails.repository.project.name;

    const MAX_LINES = 1000; // Safety limit to prevent excessive token usage
    const PATHS_TO_NAME_ONLY = ['/templates/', '/docs/']; // only provide metadata to save context space
    const FILES_TO_IGNORE = ['package-lock.json', 'yarn.lock', '.gitignore'];

    try {
        let authHandler = azdev.getPersonalAccessTokenHandler(pat);
        let connection = new azdev.WebApi(orgUrl, authHandler);
        let gitApi = await connection.getGitApi();

        const iterations = await gitApi.getPullRequestIterations(repoId, prId, project);
        const changes = await gitApi.getPullRequestIterationChanges(repoId, prId, iterations.length, project);

        let diffSummary = "";
        let filesCount = 0;
        let limitReached = false;

        for (const change of changes.changeEntries) {
            const filePath = change.item.path;

            if (FILES_TO_IGNORE.some(f => filePath.includes(f))) continue;

            if (filesCount >= MAX_LINES) {
                limitReached = true;
                break;
            }

            if (PATHS_TO_NAME_ONLY.some(p => filePath.includes(p))) {
                diffSummary += `[Metadata Only - Template/Doc]: ${filePath}\n`;
            } else {
                diffSummary += `${change.changeType}: ${filePath}\n`;
            }
            
            filesCount++;
        }

        const systemPrompt = `You are a Senior DevOps Engineer. Your task is to summarize this Pull Request.
        
        MANDATORY INSTRUCTION:
        At the very end of your response, add a section starting with "---" and then write:
        "**Files analyzed by AI:** ${filesCount}${limitReached ? ' (Limit of ' + MAX_LINES + ' reached)' : ''}"
        
        Follow this Markdown structure:
        ## Summary
        ## Technical Changes
        ## Quality Checks (Mention if tests were modified)`;

        const result = await client.getChatCompletions(deploymentId, [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze the following changes:\n${diffSummary}` }
        ]);

        const aiDescription = result.choices[0].message.content;

        await gitApi.updatePullRequest({ description: aiDescription }, repoId, prId, project);
        // 5. TEST LABEL LOGIC
        const labelsToAdd = [{ name: "AI-Processed" }];        
        // This is the specific method to add labels in Azure DevOps
        await gitApi.createPullRequestLabels(labelsToAdd, repoId, prId, project);

        
        context.log(`PR #${prId} updated successfully. Files processed: ${filesCount}.`);

    } catch (err) {
        // Log the error in Azure but don't break the webhook flow
        context.log.error("Production execution error:", err.message);
    }
};