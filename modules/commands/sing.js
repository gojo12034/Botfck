const { Client } = require("youtubei");
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const youtube = new Client();

const config = {
    name: "sing",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Play music via search keyword",
    usePrefix: true,
    commandCategory: "Media",
    usages: "[searchMusic]",
    cooldowns: 15,
};

// Helper function for downloading audio file with custom User-Agent
async function downloadAudio(url, filePath) {
    console.log(`Starting download from URL: ${url}`);
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });

    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => {
            console.log(`Audio downloaded to: ${filePath}`);
            resolve();
        });
        writer.on('error', (error) => {
            console.error(`Error during audio download: ${error.message}`);
            reject(error);
        });
    });
}

// Main function to handle the command
async function playMusic({ api, event, args }) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);

    const searchQuery = args.join(" ");
    if (!searchQuery) {
        return api.sendMessage("Please provide a search keyword or a YouTube link.", event.threadID, event.messageID);
    }

    try {
        // Search for the video on YouTube
        const searchResults = await youtube.search(searchQuery, { type: "video" });

        if (!searchResults.items.length) {
            return api.sendMessage("No results found. Please try again with a different keyword.", event.threadID, event.messageID);
        }

        let message = "Choose a video:\n";
        searchResults.items.forEach((item, index) => {
            message += `${index + 1}. ${item.title}\n`;
        });

        api.sendMessage(message, event.threadID, (error, info) => {
            if (error) {
                console.error('Error sending message:', error);
                return;
            }

            global.client.handleReply.push({
                type: "chooseVideo",
                name: config.name,
                author: event.senderID,
                messageID: info.messageID,
                searchResults,
            });
        });

    } catch (error) {
        console.error("Error during video search:", error);
        api.sendMessage("An error occurred while searching for the video.", event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

async function handleReply({ api, event, handleReply }) {
    const { searchResults } = handleReply;
    const choice = parseInt(event.body);

    if (isNaN(choice) || choice < 1 || choice > searchResults.items.length) {
        return api.sendMessage("Invalid choice. Please reply with a valid number.", event.threadID, event.messageID);
    }

    // Unsend the choices message
    api.unsendMessage(event.messageReply.messageID);

    const video = searchResults.items[choice - 1];
    const videoId = video.id?.videoId || video.id;

    api.sendMessage(`Fetching "${video.title}" as audio...`, event.threadID, event.messageID);

    try {
        // Fetch video download information from the new API with custom User-Agent
        const apiUrl = `https://vneerapi.onrender.com/ytdown?url=https://youtu.be/${videoId}`;
        console.log(`Requesting video details from API: ${apiUrl}`);
        
        const response = await axios.get(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        console.log(`API Response:`, response.data);

        const { title, thumbnail, downloadUrl } = response.data;

        if (!downloadUrl) {
            console.error(`API did not return a download URL.`);
            return api.sendMessage("Failed to fetch the download link.", event.threadID, event.messageID);
        }

        // Download the audio file
        const cachePath = path.join(__dirname, "cache", `music_${videoId}.mp3`);
        await downloadAudio(downloadUrl, cachePath);

        // Send the audio to the user
        const audioStream = fs.createReadStream(cachePath);
        api.sendMessage({
            body: `🎵 Now playing: ${title}`,
            attachment: audioStream
        }, event.threadID, () => {
            fs.unlinkSync(cachePath); // Delete the file after sending
        }, event.messageID);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
        console.error("Error during video fetching or download:", error);
        api.sendMessage("An error occurred while trying to play the song.", event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

module.exports.config = config;
module.exports.run = playMusic;
module.exports.handleReply = handleReply;
