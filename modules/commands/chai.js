const axios = require('axios');

module.exports.config = {
  name: "chai",
  version: "0.0.6",
  hasPermssion: 0,
  credits: "Biru Aren",
  description: "character ai",
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
          author: senderID, // Original sender
          type: "reply"
        });
      },
      messageID // Reply to the original message
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

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
          author: senderID, // Update to replying user's ID
          type: "reply"
        });
      },
      messageID // Reply to the original message
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};
