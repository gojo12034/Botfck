const axios = require('axios');

module.exports.config = {
  name: "paranoia",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "biru", 
  description: "give you a paranoia question",
  usePrefix: true,
  commandCategory: "fun",
  usages: "paranoia",
  cooldowns: 5,
};

module.exports.run = async function({ api, event }) {
  try {
    const response = await axios.get('https://api.truthordarebot.xyz/api/paranoia');
    const { question, translations } = response.data;
    const message = `Paranoia: ${question}\n\nTagalog Translation: ${translations.tl}`;
    
    api.sendMessage(message, event.threadID, event.messageID);
  } catch (error) {
    console.error('Something went wrong:', error);
    api.sendMessage('Try again later mwaa', event.threadID, event.messageID);
  }
};
