const axios = require('axios');

module.exports.config = {
  name: "riddles",
  version: "1.0.0",
  hasPermssion: 0,
usePrefix: true,
  credits: "Biru",
  description: "Get a random riddle",
  commandCategory: "Fun",
  cooldowns: 5, 
};

const cooldownMap = new Map();

module.exports.run = async function ({ api, event }) {
  const apiUrl = 'https://riddles-api.vercel.app/random';


  if (cooldownMap.has(event.senderID)) {
    const remainingTime = (cooldownMap.get(event.senderID) - Date.now()) / 1000;
    return api.sendMessage(`Please wait ${remainingTime.toFixed(1)} seconds before using this command again.`, event.threadID);
  }

  try {
    
    cooldownMap.set(event.senderID, Date.now() + (this.config.cooldowns * 1000));

    
    const response = await axios.get(apiUrl);
    const { riddle, answer } = response.data;

    
    const riddleMessage = `𝗥𝗶𝗱𝗱𝗹𝗲: ${riddle}`;

    
    api.sendMessage({
      body: riddleMessage,
    }, event.threadID);

    
    setTimeout(() => {
      
      const answerMessage = `𝗔𝗻𝘀𝘄𝗲𝗿: ${answer}`;

      
      api.sendMessage({
        body: answerMessage,
      }, event.threadID);

      
      cooldownMap.delete(event.senderID);
    }, 60000); // 1min
  } catch (error) {
    console.error('Error fetching data from the API:', error);
    api.sendMessage("An error occurred while fetching the riddle.", event.threadID);
  }
};
