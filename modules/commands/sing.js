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

// Helper function for downloading audio file
async function downloadAudio(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
        });

        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                console.error("Error writing audio file:", err);
                reject(err);
            });
        });
    } catch (error) {
        console.error("Error downloading audio:", error.message);
        throw new Error("Failed to download audio.");
    }
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
        console.error("Error while searching for videos:", error.message);
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

    api.sendMessage(`Downloading "${video.title}" as audio...`, event.threadID, event.messageID);

    try {
        // Fetch video download information from the new API
        const apiUrl = `https://api.fabdl.com/youtube/get?url=https://youtu.be/${videoId}`;
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        if (response.status !== 200) {
            console.error("Unexpected API response status:", response.status, response.data);
            throw new Error("Failed to fetch video data from API.");
        }

        const { title, audios } = response.data.result;
        const audio = audios.find(a => a.type === 'm4a');

        if (!audio) {
            console.error("No valid audio found in API response:", response.data);
            throw new Error("No audio found for the selected video.");
        }

        // Download the audio file
        const cachePath = path.join(__dirname, "cache", `music_${videoId}.m4a`);
        await downloadAudio(audio.url, cachePath);

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
        console.error("Error in handleReply:", error.message);
        api.sendMessage("An error occurred while trying to play the song.", event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

module.exports.config = config;
module.exports.run = playMusic;
module.exports.handleReply = handleReply;
