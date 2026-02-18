async function applyLabels(gitApi, prDetails, usage) {
    const project = prDetails.repository.project.name;
    const repoId = prDetails.repository.id;
    const prId = prDetails.pullRequestId;
    
    let labels = [{ name: "AI-Processed" }];

    if (usage.totalTokens > 5000) {
        labels.push({ name: "High-Context-PR" });
    }

    try {
        await gitApi.createPullRequestLabels(labels, repoId, prId, project);
    } catch (err) {
        console.error("Error apply labels:", err.message);
    }
}

module.exports = { applyLabels };