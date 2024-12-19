const axios = require('axios');

module.exports.config = {
  name: "ai",
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
    const apiUrl = `https://vneerapi.onrender.com/pinoygpt?prompt=${encodeURIComponent(userMessage)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    // Reply to the user's specific message (using replyTo with messageID)
    api.sendMessage(
      { 
        body: responseMessage,   // The message content
        replyTo: messageID       // Reply directly to the user's message
      },
      threadID                  // The thread ID
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
    const apiUrl = `https://vneerapi.onrender.com/pinoygpt?prompt=${encodeURIComponent(body)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    // Send reply directly to the user's specific message
    api.sendMessage(
      { 
        body: responseMessage,   // The message content
        replyTo: messageID       // Reply directly to the user's message
      },
      threadID                  // The thread ID
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};
