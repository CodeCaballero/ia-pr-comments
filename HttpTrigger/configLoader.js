const { AppConfigurationClient } = require("@azure/app-configuration");

async function loadAppConfig() {
    const client = new AppConfigurationClient(process.env.AZURE_APP_CONFIG_CONNECTION_STRING);
    const config = {};
    const iterator = client.listConfigurationSettings({ keyFilter: "PRBot:*" });
    
    for await (const setting of iterator) {
        config[setting.key.split(':').pop()] = setting.value;
    }

    const aiSetting = await client.getConfigurationSetting({ key: "PRBot:AI:SummarizerConfig" });
    return { config, aiParams: JSON.parse(aiSetting.value) };
}
module.exports = { loadAppConfig };