const axios = require('axios');

module.exports.config = {
  name: "wyr",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "biru", 
  description: "give you a would you rather question",
  usePrefix: true,
  commandCategory: "fun",
  usages: "wyr",
  cooldowns: 5,
};

module.exports.run = async function({ api, event }) {
  try {
    const response = await axios.get('https://api.truthordarebot.xyz/api/wyr');
    const { question, translations } = response.data;
    const message = `Would You Rather: ${question}\n\nTagalog Translation: ${translations.tl}`;
    
    api.sendMessage(message, event.threadID, event.messageID);
    
  } catch (error) {
    console.error('Something went wrong:', error);
    api.sendMessage('Try again later mwaa', event.threadID, event.messageID);
  }
};
