module.exports.config = {
	name: "say",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "Yan Maglinte",
	description: "text to voice speech messages",
	usePrefix: true, // SWITCH TO "false" IF YOU WANT TO DISABLE PREFIX
	commandCategory: "message",
	usages: `Text to speech messages`,
	cooldowns: 5,
	dependencies: {
		"path": "",
		"fs-extra": "",
		"axios": ""
	}
};

module.exports.run = async function({ api, event, args }) {
	try {
		const { createWriteStream, createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
		const { resolve } = global.nodemodule["path"];
		const axios = global.nodemodule["axios"];

		// Get the input text
		const content = event.type === "message_reply" ? event.messageReply.body : args.join(" ");
		if (!content) {
			return api.sendMessage("Please provide a text to convert to speech.", event.threadID, event.messageID);
		}

		// Define the path for the audio file
		const path = resolve(__dirname, "cache", `${event.threadID}_${event.senderID}.mp3`);

		// Call the API and download the file
		const response = await axios.get(`https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`, {
			responseType: "stream"
		});
		
		// Save the audio file to the cache folder
		const writer = createWriteStream(path);
		await new Promise((resolve, reject) => {
			response.data.pipe(writer);
			writer.on("finish", resolve);
			writer.on("error", reject);
		});

		// Send the audio as an attachment
		return api.sendMessage(
			{ attachment: createReadStream(path) },
			event.threadID,
			() => unlinkSync(path), // Clean up the file after sending
			event.messageID
		);
	} catch (e) {
		console.error(e);
		return api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID);
	}
};
