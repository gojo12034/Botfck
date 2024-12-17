module.exports.config = {
  name: "uid",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Biru",
  description: "Share a contact or get the user's Facebook UID.",
  usePrefix: true,
  commandCategory: "message",
  cooldowns: 5
};

module.exports.run = function ({ api, event }) {
  // Function to share contact and send user ID
  function shareContact(userID) {
    const message = ``;
    api.sendMessage(message, event.threadID, (err) => {
      if (err) {
        console.error("Failed to send message:", err);
      } else {
        api.shareContact(userID, userID, event.threadID, (err, data) => {
          if (err) {
            console.error("Failed to share contact:", err);
          } else {
            console.log("Contact shared successfully:", data);
          }
        });
      }
    });
  }

  // Check if there are mentions
  if (Object.keys(event.mentions).length === 0) {
    if (event.messageReply) {
      // If replying to a message, get the senderID of the message being replied to
      const senderID = event.messageReply.senderID;
      shareContact(senderID);
    } else {
      // If no mentions and no message reply, use the sender's ID
      const senderID = event.senderID;
      shareContact(senderID);
    }
  } else {
    // If there are mentions, loop through each mentioned user
    for (const mentionID in event.mentions) {
      shareContact(mentionID);
    }
  }
};
