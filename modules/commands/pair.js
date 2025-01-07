module.exports.config = {
  name: "pair",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "D-Jukie (Xuyên get)",
  description: "Pairing",
  usePrefix: true,
  commandCategory: "Love",
  usages: "pair",
  cooldowns: 15
};

module.exports.run = async function({ api, event, Threads, Users }) {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];

  try {
    var { participantIDs } = (await Threads.getData(event.threadID)).threadInfo;
    var tle = Math.floor(Math.random() * 101); // Random compatibility percentage
    var namee = (await Users.getData(event.senderID)).name; // Get sender's name
    const botID = api.getCurrentUserID();
    const listUserID = participantIDs.filter(
      (ID) => ID != botID && ID != event.senderID
    );
    var id = listUserID[Math.floor(Math.random() * listUserID.length)]; // Pick a random participant
    var name = (await Users.getData(id)).name; // Get chosen participant's name
    var arraytag = [];
    arraytag.push({ id: event.senderID, tag: namee });
    arraytag.push({ id: id, tag: name });

    // Use /tmp for temporary files
    const avatar1Path = `/tmp/avt_${event.senderID}.png`;
    const avatar2Path = `/tmp/avt2_${id}.png`;
    const gifLovePath = `/tmp/giflove.png`;

    // Download images
    let Avatar = (
      await axios.get(
        `https://graph.facebook.com/${event.senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(avatar1Path, Buffer.from(Avatar, "utf-8"));

    let gifLove = (
      await axios.get(`https://i.ibb.co/wC2JJBb/trai-tim-lap-lanh.gif`, {
        responseType: "arraybuffer",
      })
    ).data;
    fs.writeFileSync(gifLovePath, Buffer.from(gifLove, "utf-8"));

    let Avatar2 = (
      await axios.get(
        `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(avatar2Path, Buffer.from(Avatar2, "utf-8"));

    // Attach images
    var imglove = [];
    imglove.push(fs.createReadStream(avatar1Path));
    imglove.push(fs.createReadStream(gifLovePath));
    imglove.push(fs.createReadStream(avatar2Path));

    // Create and send message
    var msg = {
      body: `🥰Successful pairing!\n💌Wish you two hundred years of happiness\n💕Double ratio: ${tle}%\n${namee} 💓 ${name}`,
      mentions: arraytag,
      attachment: imglove,
    };
    api.sendMessage(msg, event.threadID, event.messageID, () => {
      // Cleanup temporary files
      fs.unlinkSync(avatar1Path);
      fs.unlinkSync(avatar2Path);
      fs.unlinkSync(gifLovePath);
    });
  } catch (error) {
    console.error("Error:", error);
    api.sendMessage("An error occurred while pairing.", event.threadID);
  }
};
