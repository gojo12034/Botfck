const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "say",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Yan Maglinte",
    description: "text to voice speech messages or download MP3s",
    usePrefix: true, // SWITCH TO "false" IF YOU WANT TO DISABLE PREFIX
    commandCategory: "message",
    usages: `Text to speech messages or provide a direct MP3 link`,
    cooldowns: 5,
    dependencies: { axios: "", fs: "fs-extra", path: "" }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const content = args.join(" ") || (event.type === "message_reply" ? event.messageReply.body : "");

    if (!content) {
        return api.sendMessage("Please provide text to convert to speech or an MP3 URL.", threadID, messageID);
    }

    try {
        // Ensure the "cache" directory exists
        const cacheDir = path.resolve(__dirname, "cache");
        if (!await fs.pathExists(cacheDir)) {
            await fs.mkdirp(cacheDir);
        }

        let audioUrl;
        if (content.startsWith("http") && content.endsWith(".mp3")) {
            // Direct MP3 download link
            audioUrl = content;
        } else {
            // Convert text to speech
            const apiUrl = `https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`;
            const response = await axios.get(apiUrl);
            audioUrl = response.data.audioUrl;

            if (!audioUrl) {
                return api.sendMessage("Failed to fetch the audio file. Please try again later.", threadID, messageID);
            }
        }

        // Step 2: Download the audio file locally
        const filePath = path.resolve(cacheDir, `${threadID}_${messageID}.mp3`);
        const writer = await fs.createWriteStream(filePath);

        const audioStream = await axios({
            url: audioUrl,
            method: "GET",
            responseType: "stream"
        });

        audioStream.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Step 3: Send the audio file as an attachment
        api.sendMessage({
            attachment: fs.createReadStream(filePath)
        }, threadID, () => {
            fs.remove(filePath); // Clean up the file after sending
        }, messageID);

    } catch (error) {
        console.error("Error fetching or sending the audio:", error.message);
        api.sendMessage("Failed to process your request. Please try again later.", threadID, messageID);
    }
};
