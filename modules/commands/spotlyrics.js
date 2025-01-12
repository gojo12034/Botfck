const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const config = {
    name: "spotlyrics",
    version: "0.2.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Fetch Spotify music and lyrics",
    usePrefix: true,
    commandCategory: "Media",
    usages: "[song name]",
    cooldowns: 10,
};

// Helper function for downloading MP3 file
async function downloadMp3(url, filePath) {
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
    });

    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

// Main function to handle the command
async function fetchLyrics({ api, event, args }) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);

    const searchTerm = args.join(" ");
    if (!searchTerm) {
        return api.sendMessage("Please provide a song name.", event.threadID, event.messageID);
    }

    try {
        // Fetch data from the API
        const response = await axios.get(`https://vneerapi.onrender.com/spotlyrics?term=${encodeURIComponent(searchTerm)}`);
        const data = response.data;

        if (!data.status) {
            return api.sendMessage("No song found. Please try again with a different keyword.", event.threadID, event.messageID);
        }

        const { song, mp3, lyrics } = data;
        const message = `🎵 **Title:** ${song.title}\n🎤 **Artist:** ${song.artist}\n⏱ **Duration:** ${(song.duration / 1000 / 60).toFixed(2)} mins\n\n📜 **Lyrics:**\n${lyrics}`;

        // Send lyrics first
        api.sendMessage(message, event.threadID, event.messageID, async () => {
            // Define file path for caching
            const cachePath = path.join(__dirname, "cache", `${song.title.replace(/\s+/g, "_")}.mp3`);

            try {
                // Download the MP3 file
                await downloadMp3(mp3, cachePath);

                // Send the MP3 file
                const audioStream = fs.createReadStream(cachePath);
                api.sendMessage(
                    {
                        body: `🎶 Now playing: ${song.title} by ${song.artist}`,
                        attachment: audioStream,
                    },
                    event.threadID,
                    () => {
                        fs.unlinkSync(cachePath); // Delete the file after sending
                    },
                    event.messageID
                );

                api.setMessageReaction("✅", event.messageID, () => {}, true);
            } catch (error) {
                console.error("Error downloading MP3:", error);
                api.sendMessage("An error occurred while downloading the song.", event.threadID, event.messageID);
                api.setMessageReaction("❌", event.messageID, () => {}, true);
            }
        });
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("An error occurred while fetching the song or lyrics.", event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
}

module.exports.config = config;
module.exports.run = fetchLyrics;
