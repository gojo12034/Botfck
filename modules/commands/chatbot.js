const axios = require('axios');
let aiEnabled = {}; 
const botUid = '100081287141255'; 

module.exports.config = {
  name: 'chatbot',
  version: '1.1.1',
  hasPermission: 0,
  credits: 'biru', // big thanks to the owner of the API
  description: 'Just an AI',
  commandCategory: 'Ai',
  usePrefix: false,
  usages: 'chatbot on/off',
  cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event }) {
  const text = event.body;
  const threadId = event.threadID;
  const senderUid = event.senderID;

  if (senderUid !== botUid && aiEnabled[threadId]) {
    try {
      const response = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(text)}`);

      if (response.data && response.data.response) {
        api.sendMessage(response.data.response, threadId);
      } else {
        api.sendMessage('No response received from the API.', threadId);
      }
    } catch (error) {
      console.error('Error occurred while making the API request:', error);
      api.sendMessage('An error occurred while processing your request.', threadId);
    }
  }
};

module.exports.run = function({ api, event }) {
  const { threadID, body } = event;

  if (body.toLowerCase() === 'chatbot on') {
    aiEnabled[threadID] = true;
    api.sendMessage('The AI is now enabled in this thread.', threadID);
  } else if (body.toLowerCase() === 'chatbot off') {
    aiEnabled[threadID] = false;
    api.sendMessage('The AI is now disabled in this thread.', threadID);
  }
};
