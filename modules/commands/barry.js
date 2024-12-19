const axios = require('axios');

module.exports.config = {
  name: "barry",
  version: "0.0.6",
  hasPermssion: 0,
  credits: "Biru Aren",
  description: "Just a bot",
  commandCategory: "ai",
  usePrefix: false,
  usages: "ask anything or reply with images",
  cooldowns: 5,
  dependencies: { axios: "" }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, attachments } = event;

  if (!args.length && (!attachments || attachments.length === 0)) {
    return api.sendMessage("I don't accept blank messages or empty replies!", threadID, messageID);
  }

  let userMessage = args.join(" ") || "";

  // Extract image URLs if attachments exist
  const imageUrls = [];
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.type === "photo") {
        imageUrls.push(attachment.url);
      }
    }
  }

  console.log("User's Message:", userMessage);
  console.log("Image URLs:", imageUrls);

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai`;
    const payload = {
      prompt: userMessage,
      uid: senderID,
      images: imageUrls.length > 0 ? imageUrls : null // Include images if available
    };

    const response = await axios.post(apiUrl, payload); // Changed to POST for payload flexibility
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    // Reply to the user's specific message
    api.sendMessage(
      {
        body: responseMessage,
        replyTo: messageID
      },
      threadID,
      (err, info) => {
        if (err) return console.error("Error sending message:", err);

        console.log("Bot's Response:", responseMessage);

        // Push the conversation state for further replies
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "reply"
        });
      }
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body, attachments } = event;

  console.log("User Reply from:", senderID, "Message:", body);

  let userMessage = body || "";

  // Extract image URLs if attachments exist
  const imageUrls = [];
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.type === "photo") {
        imageUrls.push(attachment.url);
      }
    }
  }

  console.log("Image URLs:", imageUrls);

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai`;
    const payload = {
      prompt: userMessage,
      uid: senderID,
      images: imageUrls.length > 0 ? imageUrls : null // Include images if available
    };

    const response = await axios.post(apiUrl, payload); // Changed to POST for payload flexibility
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    // Reply directly to the user's specific message
    api.sendMessage(
      {
        body: responseMessage,
        replyTo: messageID
      },
      threadID,
      (err, info) => {
        if (err) return console.error("Error sending message:", err);

        console.log("Bot's Response:", responseMessage);

        // Update conversation state for further replies
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "reply"
        });
      }
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID);
  }
};
