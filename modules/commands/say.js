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
		"axios": "",
		"fs-extra": "",
		"path": ""
	}
};

module.exports.run = async function({ api, event, args }) {
    try {
        const axios = global.nodemodule["axios"];
        const { createWriteStream, unlinkSync } = global.nodemodule["fs-extra"];
        const { resolve } = global.nodemodule["path"];
        
        const content = (event.type == "message_reply") 
            ? event.messageReply.body 
            : args.join(" ");
        
        if (!content) {
            return api.sendMessage("Please provide a text to convert to speech.", event.threadID, event.messageID);
        }

        const path = resolve(__dirname, 'cache', `${event.threadID}_${event.senderID}.mp3`);

        // Fetch the audio file from the API
        const response = await axios({
            url: `https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`,
            method: "GET",
            responseType: "stream"
        });

        // Save the audio file locally
        const writer = createWriteStream(path);
        response.data.pipe(writer);

        // Wait for the file to finish writing
        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Send the audio file to Messenger
        return api.sendMessage({
            attachment: createReadStream(path)
        }, event.threadID, () => unlinkSync(path), event.messageID);

    } catch (e) {
        console.error(e);
        return api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID);
    }
};
