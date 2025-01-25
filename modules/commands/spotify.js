const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "spotify",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Play Spotify music via a search keyword",
    usePrefix: true,
    commandCategory: "Media",
    usages: "[spotify name]",
    cooldowns: 10,
    dependencies: { axios: "" }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const searchQuery = args.join(" ");

    // Validate the input
    if (!searchQuery) {
        return api.sendMessage("Please provide the name of a song to search.", threadID, messageID);
    }

    try {
        // Fetch song details from the external API
        const apiUrl = `https://vneerapi.onrender.com/spotify2?song=${encodeURIComponent(searchQuery)}`;
        const response = await axios.get(apiUrl);

        // Validate API response
        if (!response.data || !response.data.download || !response.data.download.download || !response.data.download.download.file_url) {
            return api.sendMessage("Sorry, I couldn't find the song. Please try another keyword.", threadID, messageID);
        }

        // Extract necessary data
        const songMetadata = response.data.metadata || {};
        const downloadUrl = response.data.download.download.file_url;

        const songTitle = songMetadata.name || "Unknown Title";
        const songArtist = songMetadata.artist || "Unknown Artist";
        const albumName = songMetadata.album || "Unknown Album";

        // Format the response message
        const messageBody = `🎶 Now Playing: "${songTitle}"\n👤 Artist: ${songArtist}\n💽 Album: ${albumName}`;

        // Download the song
        const filePath = path.join(__dirname, "cache", `${songTitle}.mp3`);

        const downloadResponse = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        // Save the file locally
        const writer = fs.createWriteStream(filePath);
        downloadResponse.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: messageBody,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => {
                fs.unlinkSync(filePath); // Clean up the file after sending
            }, messageID);
        });

        writer.on('error', (error) => {
            console.error("Error saving the file:", error.message);
            api.sendMessage("Failed to save the song. Please try again later.", threadID, messageID);
        });

        downloadResponse.data.on('error', (err) => {
            console.error("Error downloading the file:", err.message);
            api.sendMessage("Failed to download the song. Please try again later.", threadID, messageID);
        });

    } catch (error) {
        console.error("Error fetching the song:", error.message);
        api.sendMessage("Failed to retrieve the song. Please try again later.", threadID, messageID);
    }
};
