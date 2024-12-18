const axios = require('axios');

module.exports.config = {
  name: "barry",
  version: "0.0.4",
  hasPermssion: 0,
  credits: "Biru Aren, updated by AI",
  description: "Just a bot",
  commandCategory: "ai",
  usePrefix: false,
  usages: "ask anything",
  cooldowns: 5,
  dependencies: { axios: "" }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  if (!args.length) {
    return api.sendMessage("I don't accept blank messages!", threadID, messageID);
  }

  const userMessage = args.join(" ");

  console.log("User's Message:", userMessage);

  api.setMessageReaction("👽", messageID, (err) => {}, true);
  api.sendTypingIndicator(threadID, true);

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(userMessage)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    api.setMessageReaction("🤍", messageID, (err) => {}, true);
    api.sendMessage(responseMessage, threadID, (err, info) => {
      if (err) return console.error("Error sending message:", err);

      console.log("Bot's Response:", responseMessage);

      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID, // Original sender
        type: "reply"
      });
    });
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  // Allow replies from anyone in the thread
  console.log("User Reply from:", senderID, "Message:", body);

  api.sendTypingIndicator(threadID, true);

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(body)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    api.sendMessage(responseMessage, threadID, (err, info) => {
      if (err) return console.error("Error sending message:", err);

      console.log("Bot's Response:", responseMessage);

      // Keep track of the conversation, updating handleReply
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID, // Set the replying user's ID
        type: "reply"
      });
    });
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID);
  }
};
