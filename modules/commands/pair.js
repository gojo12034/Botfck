module.exports.config = {
  name: "pair",
  version: "0.2",
  hasPermssion: 0,
  usePrefix: true,
  credits: "D-Jukie (Modified)",
  description: "Pairing",
  commandCategory: "Love",
  usages: "pair",
  cooldowns: 15,
};

module.exports.run = async function ({ api, event, Threads, Users }) {
  try {
    // Get the list of participants
    var { participantIDs } = (await Threads.getData(event.threadID)).threadInfo;
    var tle = Math.floor(Math.random() * 101); // Random compatibility percentage
    var namee = (await Users.getData(event.senderID)).name; // Get sender's name
    const botID = api.getCurrentUserID();
    const listUserID = participantIDs.filter(
      (ID) => ID != botID && ID != event.senderID
    );

    // Randomly pick another participant
    var id = listUserID[Math.floor(Math.random() * listUserID.length)];
    var name = (await Users.getData(id)).name;

    // Create and send message
    var msg = `🥰 Successful pairing!\n💌 Wish you two hundred years of happiness!\n💕 Compatibility Ratio: ${tle}%\n${namee} ❤️ ${name}`;
    return api.sendMessage(msg, event.threadID, event.messageID);
  } catch (error) {
    console.error("Error:", error); // Log the full error for debugging
    return api.sendMessage(
      "An error occurred while pairing. Please try again later.",
      event.threadID,
      event.messageID
    );
  }
};
