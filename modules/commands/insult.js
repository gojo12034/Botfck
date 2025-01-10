const axios = require("axios");

module.exports.config = {
  name: "insult",
  version: "1.0.0",
  hasPermission: 0,
  credits: "August Quinn",
  usePrefix: true,
  description: "Generate insults using the Evil Insult Generator API",
  commandCategory: "Fun",
  usages: "+insult",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const apiEndpoint = "https://evilinsult.com/generate_insult.php?lang=en&type=json";

  try {
    const response = await axios.get(apiEndpoint);
    const insult = response.data.insult;

    api.sendMessage(`${insult}`, event.threadID, event.messageID);
  } catch (error) {
    api.sendMessage("An error occurred while generating an insult. Please try again later.", event.threadID, event.messageID);
    console.error("Evil Insult Generator API Error:", error.message);
  }
};
                                                 
