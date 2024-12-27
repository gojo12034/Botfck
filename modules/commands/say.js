module.exports.config = {
	name: "say",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "Biru",
	description: "text to voice speech messages",
  	usePrefix: true, 
	commandCategory: "message",
	usages: `Text to speech messages`,
	cooldowns: 5,
	dependencies: {
		"path": "",
		"fs-extra": ""
	}
};

module.exports.run = async function({ api, event, args }) {
    try {
        const {
            createReadStream,
            unlinkSync
        } = global.nodemodule["fs-extra"];
        const { resolve } = global.nodemodule["path"];
        
        const content = (event.type == "message_reply") 
            ? event.messageReply.body 
            : args.join(" ");
        
        if (!content) {
            return api.sendMessage("Please provide a text to convert to speech.", event.threadID, event.messageID);
        }
        
        const path = resolve(__dirname, 'cache', `${event.threadID}_${event.senderID}.mp3`);
        const response = await global.utils.getStream(`https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`);
        
        const audioUrl = response.audioUrl;
        await global.utils.downloadFile(audioUrl, path);
        
        return api.sendMessage({
            attachment: createReadStream(path)
        }, event.threadID, () => unlinkSync(path), event.messageID);
    } catch (e) {
        return console.log(e);
    }
};
