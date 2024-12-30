const axios = require('axios');

module.exports.config = {
  name: "truth",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "biru", 
  description: "give you a truth question",
  usePrefix: true,
  commandCategory: "fun",
  usages: "truth",
  cooldowns: 5,
};

module.exports.run = async function({ api, event }) {
  try {
    const response = await axios.get('https://api.truthordarebot.xyz/v1/truth');
    const { question, translations } = response.data;
    const message = `Truth: ${question}\n\nTagalog Translation: ${translations.tl}`;
    
    api.sendMessage(message, event.threadID, event.messageID);
    
  } catch (error) {
    console.error('Something went wrong:', error);
    api.sendMessage('Try again later mwaa', event.threadID, event.messageID);
  }
};
