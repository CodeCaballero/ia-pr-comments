const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

async function generateSummary(diffSummary, config, aiParams) {
    const client = new OpenAIClient(config.OpenAIEndpoint, new AzureKeyCredential(config.OpenAIKey));
    
    const messages = [
        ...aiParams.messages,
        { role: "user", content: `Analyze this changes:\n${diffSummary}` }
    ];

    const result = await client.getChatCompletions(config.OpenAIDeployment, messages, {
        max_tokens: aiParams.max_tokens,
        temperature: aiParams.temperature
    });

    return {
        summary: result.choices[0].message.content,
        usage: result.usage
    };
}
module.exports = { generateSummary };