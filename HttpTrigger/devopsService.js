const azdev = require("azure-devops-node-api");

async function getPRChanges(prDetails, config) {
    const pat = config.DevOpsPAT;
    const orgUrl = config.DevOpsOrgUrl;
    const project = prDetails.repository.project.name;
    const repoId = prDetails.repository.id;
    const prId = prDetails.pullRequestId;

    const authHandler = azdev.getPersonalAccessTokenHandler(pat);
    const connection = new azdev.WebApi(orgUrl, authHandler);
    const gitApi = await connection.getGitApi();

    const iterations = await gitApi.getPullRequestIterations(repoId, prId, project);
    const lastIteration = iterations.length;
    const changes = await gitApi.getPullRequestIterationChanges(repoId, prId, lastIteration, project);

    const MaxLines = parseInt(config.MaxLines || "5000");
    const OnlyNamePaths = (config.OnlyNamePaths || "").split(',').map(p => p.trim());
    const FilesToIgnore = (config.FilesToIgnore || "").split(',').map(f => f.trim());

    let diffSummary = "";
    let filesCount = 0;

    for (const change of changes.changeEntries) {
        const filePath = change.item.path;

        if (FilesToIgnore.some(f => filePath.includes(f))) continue;

        if (filesCount >= MaxLines) break;

        if (OnlyNamePaths.some(p => filePath.includes(p))) {
            diffSummary += `[Metadata Only]: ${filePath}\n`;
        } else {
            diffSummary += `${change.changeType || 'Modified'}: ${filePath}\n`;
        }
        filesCount++;
    }

    return { diffSummary, filesCount, gitApi };
}
module.exports = { getPRChanges, updatePR };