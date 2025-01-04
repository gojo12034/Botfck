const axios = require('axios');

module.exports.config = {
  name: "barry",
  version: "0.0.9",
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
  const { threadID, messageID, senderID, attachments } = event;

  let userMessage = args.join(" ");

  // Handle if the user sends an image
  const imageUrls = attachments
    ?.filter((att) => att.type === "photo")
    .map((photo) => photo.url);

  if (imageUrls?.length > 0) {
    userMessage += ` ${imageUrls.join(" ")}`;
  }

  if (!userMessage.trim()) {
    return api.sendMessage("I don't accept blank messages or empty attachments!", threadID, messageID);
  }

  console.log("User's Message:", userMessage);

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(userMessage)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";
    const imgUrls = response.data.img_urls || [];

    const messageOptions = { body: responseMessage.replace(/\[.*?\]\(.*?\)/g, "").trim() };

    // Add images as attachments if available
    if (imgUrls.length > 0) {
      messageOptions.attachment = await Promise.all(
        imgUrls.map((url) =>
          axios
            .get(url, { responseType: 'stream' })
            .then((res) => res.data)
        )
      );
    }

    api.sendMessage(
      messageOptions,
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
      messageID // Reply to the original message
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body, attachments } = event;

  console.log("User Reply from:", senderID, "Message:", body);

  let userReply = body || "";

  // Check if the reply contains images
  const imageUrls = attachments
    ?.filter((att) => att.type === "photo")
    .map((photo) => photo.url);

  if (imageUrls?.length > 0) {
    userReply += ` ${imageUrls.join(" ")}`;
  }

  if (!userReply.trim()) {
    return api.sendMessage("I don't accept empty replies or attachments!", threadID, messageID);
  }

  console.log("User's Reply with Attachments:", userReply);

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(userReply)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";
    const imgUrls = response.data.img_urls || [];

    const messageOptions = { body: responseMessage.replace(/\[.*?\]\(.*?\)/g, "").trim() };

    // Add images as attachments if available
    if (imgUrls.length > 0) {
      messageOptions.attachment = await Promise.all(
        imgUrls.map((url) =>
          axios
            .get(url, { responseType: 'stream' })
            .then((res) => res.data)
        )
      );
    }

    api.sendMessage(
      messageOptions,
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
      messageID // Reply to the original message
    );
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};
