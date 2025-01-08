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
    // Fetch thread participants
    const threadData = await Threads.getData(event.threadID);
    if (!threadData || !threadData.threadInfo || !threadData.threadInfo.participantIDs) {
      return api.sendMessage(
        "Unable to fetch participant data. Please try again later.",
        event.threadID,
        event.messageID
      );
    }

    const { participantIDs } = threadData.threadInfo;
    const botID = api.getCurrentUserID();
    const listUserID = participantIDs.filter(
      (ID) => ID != botID && ID != event.senderID
    );

    // Ensure there are valid participants
    if (listUserID.length === 0) {
      return api.sendMessage(
        "No other participants available for pairing in this thread.",
        event.threadID,
        event.messageID
      );
    }

    // Fetch user names
    const senderData = await Users.getData(event.senderID);
    if (!senderData || !senderData.name) {
      return api.sendMessage(
        "Unable to fetch your name. Please try again later.",
        event.threadID,
        event.messageID
      );
    }

    const namee = senderData.name;

    // Randomly pick a participant
    const randomID = listUserID[Math.floor(Math.random() * listUserID.length)];
    const randomUserData = await Users.getData(randomID);
    if (!randomUserData || !randomUserData.name) {
      return api.sendMessage(
        "Unable to fetch the name of your pair. Please try again later.",
        event.threadID,
        event.messageID
      );
    }

    const name = randomUserData.name;

    // Generate compatibility percentage
    const tle = Math.floor(Math.random() * 101);

    // Send pairing result
    const msg = `🥰 Successful pairing!\n💌 Wish you two hundred years of happiness!\n💕 Compatibility Ratio: ${tle}%\n${namee} ❤️ ${name}`;
    return api.sendMessage(msg, event.threadID, event.messageID);
  } catch (error) {
    console.error("Error in pairing command:", error); // Log the full error for debugging
    return api.sendMessage(
      "An unexpected error occurred while processing the pairing command. Please try again later.",
      event.threadID,
      event.messageID
    );
  }
};
