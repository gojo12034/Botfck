const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "say",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Text to voice speech messages",
    usePrefix: true,
    commandCategory: "message",
    usages: "Text to speech messages",
    cooldowns: 5,
    dependencies: { axios: "", "fs-extra": "" }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const content = args.join(" ") || (event.type === "message_reply" ? event.messageReply.body : "");

    if (!content) {
        return api.sendMessage("Please provide text to convert to speech.", threadID, messageID);
    }

    try {
        // Fetch the audio URL from the API
        const apiUrl = `https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`;
        const response = await axios.get(apiUrl);

        // Extract the audio URL from the API response
        const audioUrl = response.data.audioUrl;
        if (!audioUrl) {
            return api.sendMessage("Failed to fetch the audio file. Please try again later.", threadID, messageID);
        }

        // Define the cache directory and file path
        const cacheDir = path.join(__dirname, "cache");
        const filePath = path.join(cacheDir, `${Date.now()}.mp3`);

        // Ensure the cache directory exists
        await fs.ensureDir(cacheDir);

        // Download the audio file to the cache
        const writer = fs.createWriteStream(filePath);
        const audioResponse = await axios({
            url: audioUrl,
            method: "GET",
            responseType: "stream"
        });
        audioResponse.data.pipe(writer);

        // Wait for the download to complete
        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Send the audio file as an attachment
        api.sendMessage({
            attachment: fs.createReadStream(filePath)
        }, threadID, messageID, () => {
            // Delete the file after sending
            fs.remove(filePath).catch(err => console.error("Failed to delete cached file:", err));
        });

    } catch (error) {
        console.error("Error fetching the audio:", error.message);
        api.sendMessage("Failed to convert text to speech. Please try again later.", threadID, messageID);
    }
};
