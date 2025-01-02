const axios = require('axios');

let enabledThreads = {}; // Store the enabled/disabled state for each thread

module.exports.config = {
  name: "chai",
  version: "0.0.7",
  hasPermssion: 0,
  credits: "Biru Aren",
  description: "Character AI",
  commandCategory: "ai",
  usePrefix: false,
  usages: "ask anything",
  cooldowns: 5,
  dependencies: { axios: "" }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (args[0] === "on" || args[0] === "off") {
    // Only allow admin to enable/disable
    if (senderID !== "61566892830295") {
      return api.sendMessage("You don't have permission to enable/disable this command.", threadID, messageID);
    }

    // Handle enabling/disabling
    if (args[0] === "on") {
      enabledThreads[threadID] = true;
      return api.sendMessage("Chai bot has been enabled in this thread.", threadID, messageID);
    } else if (args[0] === "off") {
      enabledThreads[threadID] = false;
      return api.sendMessage("Chai bot has been disabled in this thread.", threadID, messageID);
    }
  }

  // Check if the bot is enabled in the thread
  if (!enabledThreads[threadID]) {
    return api.sendMessage("Chai bot is disabled in this thread. Contact the admin to enable it.", threadID, messageID);
  }

  if (!args.length) {
    return api.sendMessage("I don't accept blank messages!", threadID, messageID);
  }

  const userMessage = args.join(" ");
  console.log("User's Message:", userMessage);

  try {
    const apiUrl = `https://vneerapi.onrender.com/chai?prompt=${encodeURIComponent(userMessage)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    // Send the response and attach it to the original message
    api.sendMessage(
      { body: responseMessage, attachment: null },
      threadID,
      (err, info) => {
        if (err) return console.error("Error sending message:", err);

        console.log("Bot's Response:", responseMessage);

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "reply"
        });
      },
      messageID
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  // Check if the bot is enabled in the thread
  if (!enabledThreads[threadID]) return;

  console.log("User Reply from:", senderID, "Message:", body);

  try {
    const apiUrl = `https://vneerapi.onrender.com/chai?prompt=${encodeURIComponent(body)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    // Send the response and attach it to the user's reply
    api.sendMessage(
      { body: responseMessage, attachment: null },
      threadID,
      (err, info) => {
        if (err) return console.error("Error sending message:", err);

        console.log("Bot's Response:", responseMessage);

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "reply"
        });
      },
      messageID
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};
