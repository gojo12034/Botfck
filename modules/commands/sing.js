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

// Pool of User-Agents for randomization
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/92.0.902.73 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
];

// Helper function to pick a random User-Agent
function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Helper function for downloading audio file
async function downloadAudio(url, filePath) {
    console.log(`Starting download from URL: ${url}`);
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            "User-Agent": getRandomUserAgent(),
        },
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
        console.log(`Video ID: ${videoId}`);

        // Step 1: Request MP3 download
        const downloadResponse = await axios({
            method: 'GET',
            url: `https://p.oceansaver.in/ajax/download.php?copyright=0&format=mp3&url=https://youtu.be/${videoId}`,
            headers: {
                'User-Agent': getRandomUserAgent(),
            },
        });

        const downloadData = downloadResponse.data;
        console.log(`Download Response for Video ID ${videoId}:`, downloadData);

        if (!downloadData.success || !downloadData.id) {
            return api.sendMessage("Failed to initiate the download process.", event.threadID, event.messageID);
        }

        const { id, info } = downloadData;

        // Step 2: Check progress and get final download URL
        const progressResponse = await axios({
            method: 'GET',
            url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
            headers: {
                'User-Agent': getRandomUserAgent(),
            },
        });

        const progressData = progressResponse.data;
        console.log(`Progress Response for Download ID ${id}:`, progressData);

        if (!progressData.success || !progressData.download_url) {
            return api.sendMessage("Failed to fetch the download URL.", event.threadID, event.messageID);
        }

        const { download_url: downloadUrl } = progressData;

        // Download the audio file
        const cachePath = path.join(__dirname, "cache", `music_${videoId}.mp3`);
        await downloadAudio(downloadUrl, cachePath);

        // Send the audio to the user
        const audioStream = fs.createReadStream(cachePath);
        api.sendMessage({
            body: `🎵 Now playing: ${info.title}`,
            attachment: audioStream,
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
