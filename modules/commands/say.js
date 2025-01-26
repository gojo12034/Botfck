const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

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
	dependencies: { axios: "", "fs-extra": "", path: "" }
};

module.exports.run = async function({ api, event, args }) {
	const { threadID, messageID } = event;
	const content = args.join(" ") || (event.type === "message_reply" ? event.messageReply.body : "");

	if (!content) {
		return api.sendMessage("Please provide text to convert to speech.", threadID, messageID);
	}

	try {
		// Ensure the "cache" directory exists using fs-extra
		const cacheDir = path.resolve(__dirname, "cache");
		await fs.ensureDir(cacheDir);

		// Step 1: Get the audio URL
		const apiUrl = `https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`;
		const response = await axios.get(apiUrl);

		const audioUrl = response.data.audioUrl;
		if (!audioUrl) {
			return api.sendMessage("Failed to fetch the audio file. Please try again later.", threadID, messageID);
		}

		// Step 2: Download the audio file to the cache directory
		const filePath = path.resolve(cacheDir, `${threadID}_${messageID}.mp3`);

		// Use fs-extra to download the file
		const audioStream = await axios({
			url: audioUrl,
			method: "GET",
			responseType: "stream"
		});

		await new Promise((resolve, reject) => {
			const writer = fs.createWriteStream(filePath);
			audioStream.data.pipe(writer);
			writer.on("finish", resolve);
			writer.on("error", reject);
		});

		// Step 3: Send the audio file as an attachment
		api.sendMessage({
			attachment: fs.createReadStream(filePath)
		}, threadID, () => {
			fs.unlink(filePath).catch(err => console.error("Error deleting file:", err)); // Clean up the file after sending
		}, messageID);

	} catch (error) {
		console.error("Error fetching or sending the audio:", error.message);
		api.sendMessage("Failed to convert text to speech. Please try again later.", threadID, messageID);
	}
};
