const axios = require('axios');

module.exports.config = {
  name: 'grammar',
  version: '0.0.4',
  hasPermssion: 0,
  credits: 'Biru',
  description: 'Grammar checker',
  commandCategory: 'tool',
  usePrefix: true,
  usages: 'checks your grammar',
  cooldowns: 5,
  dependencies: { axios: '' },
};

module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const { threadID, messageID, messageReply, type } = event;
  let textToCorrect = "";

  if (type === "message_reply" && messageReply) {
    textToCorrect = `"${messageReply.body}"`; // Wraps reply text in quotes
  } else if (args[0]) {
    textToCorrect = `"${args.join(" ")}"`; // Wraps arguments in quotes
  }

  api.setMessageReaction("✍️", messageID, (err) => {}, true);
  api.sendTypingIndicator(threadID, true);

  try {
    if (!textToCorrect) {
      api.sendMessage('Please provide a sentence to correct!', threadID, messageID);
      api.setMessageReaction('❓', messageID, () => {}, true);
      return;
    }

    api.setMessageReaction('⏱️', messageID, () => {}, true);

    // Sending request to the new API
    const apiUrl = `https://vneerapi.onrender.com/chatgpt?q=grammar+check+${encodeURIComponent(textToCorrect)}`;
    const response = await axios.get(apiUrl);

    if (response.data && response.data.message) {
      const correctedMessage = response.data.message;

      api.setMessageReaction("✅", messageID, (err) => {}, true);
      api.sendMessage(correctedMessage, threadID, messageID);
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    console.error("Error correcting grammar:", error);
    api.sendMessage("Unable to correct your grammar. Try again later.", threadID, messageID);
    api.setMessageReaction("❌", messageID, (err) => {}, true);
  }
};
