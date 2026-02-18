const { loadAppConfig } = require("./configLoader");
const { getPRChanges, updatePR } = require("./devopsService");
const { generateSummary } = require("./aiService");
const { applyLabels } = require("./labelService");

module.exports = async function (context, req) {
    try {
        const { config, aiParams } = await loadAppConfig();
        const prDetails = req.body?.resource;
        if (!prDetails) return;

        const changes = await getPRChanges(prDetails, config);
        const { summary, usage } = await generateSummary(changes.diffSummary, config, aiParams);

        await updatePR(prDetails, summary, config.DevOpsPAT);

        await applyLabels(gitApi, prDetails, usage);
            
        context.log(`PR #${prDetails.pullRequestId} processed. 
            Files analyzed: ${changes.filesCount}.`);
        context.log(`PR Token usage: ${usage.totalTokens} 
            tokens (Input: ${usage.promptTokens}
            , Output: ${usage.completionTokens})`);

    } catch (err) {
        context.log.error("Execution error:", err.message);
    }
};