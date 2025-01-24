const { Client } = require("youtubei");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

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
];

// Helper function to pick a random User-Agent
function getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Helper function for downloading audio file
async function downloadAudio(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        headers: {
            "User-Agent": getRandomUserAgent(),
        },
    });

    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

// Main function to handle the command
async function playMusic({ api, event, args }) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);

    const searchQuery = args.join(" ");
    if (!searchQuery) {
        return api.sendMessage(
            "Please provide a search keyword or a YouTube link.",
            event.threadID,
            event.messageID
        );
    }

    try {
        // Search for the video on YouTube
        const searchResults = await youtube.search(searchQuery, { type: "video" });

        if (!searchResults.items.length) {
            return api.sendMessage(
                "No results found. Please try again with a different keyword.",
                event.threadID,
                event.messageID
            );
        }

        let message = "Choose a video:\n";
        searchResults.items.forEach((item, index) => {
            message += `${index + 1}. ${item.title}\n`;
        });

        api.sendMessage(message, event.threadID, (error, info) => {
            if (error) return;
            global.client.handleReply.push({
                type: "chooseVideo",
                name: config.name,
                author: event.senderID,
                messageID: info.messageID,
                searchResults,
            });
        });
    } catch (error) {
        api.sendMessage(
            "An error occurred while searching for the video.",
            event.threadID,
            event.messageID
        );
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

async function handleReply({ api, event, handleReply }) {
    const { searchResults } = handleReply;
    const choice = parseInt(event.body);

    if (isNaN(choice) || choice < 1 || choice > searchResults.items.length) {
        return api.sendMessage(
            "Invalid choice. Please reply with a valid number.",
            event.threadID,
            event.messageID
        );
    }

    api.unsendMessage(event.messageReply.messageID);

    const video = searchResults.items[choice - 1];
    const videoId = video.id?.videoId || video.id;

    try {
        const response = await axios({
            method: "GET",
            url: `https://api.fabdl.com/youtube/get?url=https://youtu.be/${videoId}`,
            headers: {
                "User-Agent": getRandomUserAgent(),
            },
        });

        const data = response.data.result;
        if (!data || !data.audios || data.audios.length === 0) {
            return api.sendMessage(
                "No audio download links available.",
                event.threadID,
                event.messageID
            );
        }

        const audio = data.audios[0];
        const cachePath = path.join(
            __dirname,
            "cache",
            `music_${videoId}.mp3`
        );

        await downloadAudio(audio.url, cachePath);

        api.sendMessage(
            {
                body: `🎵 Now playing: ${data.title}`,
                attachment: fs.createReadStream(cachePath),
            },
            event.threadID,
            () => fs.unlinkSync(cachePath),
            event.messageID
        );

        api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage(
            "An error occurred while trying to play the song.",
            event.threadID,
            event.messageID
        );
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

module.exports.config = config;
module.exports.run = playMusic;
module.exports.handleReply = handleReply;
