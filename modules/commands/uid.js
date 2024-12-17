module.exports.config = {
  name: "uid",
  version: "1.1.0",
  hasPermission: 0,
  credits: "Biru",
  description: "Share a contact or get the user's Facebook UID.",
  usePrefix: true,
  commandCategory: "message",
  cooldowns: 5
};

module.exports.run = function ({ api, event }) {
  // Function to send a message containing the user's Facebook URL and UID
  function sendUIDMessage(userID) {
    const facebookURL = `https://www.facebook.com/${userID}`;
    const message = `🔗 Facebook Profile:\n${facebookURL}\n\n🆔 User ID: ${userID}`;
    api.sendMessage(message, event.threadID, (err) => {
      if (err) {
        console.error("Failed to send message:", err);
      } else {
        console.log(`Successfully sent UID for userID: ${userID}`);
      }
    });
  }

  // Check if there are mentions in the message
  if (Object.keys(event.mentions).length === 0) {
    if (event.messageReply) {
      // If replying to a message, get the senderID of the message being replied to
      const senderID = event.messageReply.senderID;
      sendUIDMessage(senderID);
    } else {
      // If no mentions and no message reply, use the sender's own ID
      const senderID = event.senderID;
      sendUIDMessage(senderID);
    }
  } else {
    // If there are mentions, loop through each mentioned user
    for (const mentionID in event.mentions) {
      sendUIDMessage(mentionID);
    }
  }
};
