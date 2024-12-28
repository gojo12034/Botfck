const axios = require('axios');

module.exports.config = {
  name: "rizz",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Biru",
  description: "use it to impress the girls",
  usePrefix: true,
  commandCategory: "fun",
  usages: "rizz @mention",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const mention = Object.keys(event.mentions);

    if (mention.length !== 1) {
      api.sendMessage('Please mention a girl/boy to impress.', event.threadID, event.messageID);
      return;
    }

    const mentionName = event.mentions[mention[0]].replace('@', '');

    const response = await axios.get('https://api.popcat.xyz/pickuplines');

    if (response.status !== 200 || !response.data || !response.data.pickupline) {
      throw new Error('Invalid or missing response from pickup line API');
    }

    const pickupLine = response.data.pickupline.replace('{name}', mentionName); // Fixed variable name here
    const message = `${mentionName}, ${pickupLine} 💐`;

    const attachment = await api.sendMessage({
      body: message,
      mentions: [{
        tag: event.senderID,
        id: event.senderID,
        fromIndex: message.indexOf(mentionName),
        toIndex: message.indexOf(mentionName) + mentionName.length,
      }],
    }, event.threadID, event.messageID);

    if (!attachment || !attachment.messageID) {
      throw new Error('Failed to send message');
    }

    console.log(`Sent line as a reply with message ID ${attachment.messageID}`);
  } catch (error) {
    console.error(`Failed to send pickup line: ${error.message}`);
    api.sendMessage('Sorry, something went wrong while trying to tell a line. Please try again later.', event.threadID);
  }
};
