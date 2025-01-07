module.exports.config = {
  name: "pair2",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "D-Jukie (Modified by biru)",
  description: "Pairing",
  usePrefix: true,
  commandCategory: "Love",
  usages: "pair",
  cooldowns: 15
};

module.exports.run = async function({ api, event, Threads, Users }) {
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

    // Add tags for mentions
    var arraytag = [];
    arraytag.push({ id: event.senderID, tag: namee });
    arraytag.push({ id: id, tag: name });

    // Create and send message
    var msg = {
      body: `🥰 Successful pairing!\n💌 Wish you two hundred years of happiness!\n💕 Compatibility Ratio: ${tle}%\n@${namee} ❤️ @${name}`,
      mentions: arraytag
    };
    return api.sendMessage(msg, event.threadID, event.messageID);
  } catch (error) {
    console.error("Error:", error);
    api.sendMessage("An error occurred while pairing.", event.threadID);
  }
};
