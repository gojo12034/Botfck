const axios = require("axios");

module.exports.config = {
  name: "barry",
  version: "0.0.5",
  hasPermssion: 0,
  credits: "Biru Aren",
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

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(userMessage)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);

    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";
    api.sendMessage(responseMessage, threadID, (err, info) => {
      if (err) return console.error("Error sending message:", err);

      console.log("Bot's Response:", responseMessage);

      // Ensure `info` exists before pushing to `global.client.handleReply`
      if (info?.messageID) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "reply"
        });
      }
    });
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body, attachments } = event;

  console.log("User Reply from:", senderID, "Message:", body);

  try {
    // Collect image URLs from attachments
    const imageUrls = (attachments || [])
      .filter(attachment => attachment.type === "photo")
      .map(attachment => attachment.url);

    const promptParts = [body, ...imageUrls].filter(Boolean);
    const apiPrompt = promptParts.join(" ");

    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(apiPrompt)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);

    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";
    api.sendMessage(responseMessage, threadID, (err, info) => {
      if (err) return console.error("Error sending message:", err);

      console.log("Bot's Response:", responseMessage);

      if (info?.messageID) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "reply"
        });
      }
    });
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};
