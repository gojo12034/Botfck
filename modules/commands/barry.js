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

  // Check for images in the message
  const imageUrls = attachments
    ?.filter((att) => att.type === "photo")
    .map((photo) => photo.url);

  // If images are attached but no text message, treat this as Scenario 2
  if (imageUrls?.length > 0 && !userMessage.trim()) {
    try {
      const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=analyze%20image%20${encodeURIComponent(imageUrls.join(" "))}&uid=${senderID}`;
      const response = await axios.get(apiUrl);
      const responseMessage = response.data.message || "Sorry, I couldn't analyze the image.";

      return api.sendMessage(responseMessage, threadID, messageID);
    } catch (error) {
      console.error("Error communicating with the API:", error.message);
      return api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
    }
  }

  // If only text is provided or no images are attached
  if (!userMessage.trim()) {
    return api.sendMessage("I don't accept blank messages or empty attachments!", threadID, messageID);
  }

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(userMessage)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    return api.sendMessage(responseMessage, threadID, messageID);
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    return api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body, attachments } = event;

  let userReply = body || "";

  // Check if the reply contains images
  const imageUrls = attachments
    ?.filter((att) => att.type === "photo")
    .map((photo) => photo.url);

  // If the user replies with a message and references images
  if (imageUrls?.length > 0) {
    userReply += ` ${imageUrls.join(" ")}`;
  }

  if (!userReply.trim()) {
    return api.sendMessage("I don't accept empty replies or attachments!", threadID, messageID);
  }

  try {
    const apiUrl = `https://vneerapi.onrender.com/barry-ai?prompt=${encodeURIComponent(userReply)}&uid=${senderID}`;
    const response = await axios.get(apiUrl);
    const responseMessage = response.data.message || "Sorry, I couldn't understand that.";

    return api.sendMessage(responseMessage, threadID, messageID);
  } catch (error) {
    console.error("Error communicating with the API:", error.message);
    return api.sendMessage("I'm busy right now, try again later.", threadID, messageID);
  }
};
