const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "spotlyrics",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Fetch lyrics and download Spotify song.",
    usePrefix: true,
    commandCategory: "Media",
    usages: "[song name]",
    cooldowns: 10,
    dependencies: { axios: "", "fs-extra": "", path: "" }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const searchQuery = args.join(" ");

    // Validate input
    if (!searchQuery) {
        return api.sendMessage("Please provide the name of a song to search.", threadID, messageID);
    }

    // React and show typing indicator
    api.setMessageReaction("🕢", messageID, () => {}, true);
    api.sendTypingIndicator(threadID, true);

    try {
        // Fetch song details and lyrics from the external API
        const apiUrl = `https://vneerapi.onrender.com/spotlyrics?term=${encodeURIComponent(searchQuery)}`;
        const response = await axios.get(apiUrl);

        // Validate API response
        if (!response.data || !response.data.status || !response.data.song || !response.data.lyrics || !response.data.mp3) {
            return api.sendMessage("Sorry, I couldn't find the song or its lyrics. Please try another keyword.", threadID, messageID);
        }

        // Extract song details
        const { song, mp3, lyrics } = response.data;
        const songTitle = song.title || "Unknown Title";
        const songArtist = song.artist || "Unknown Artist";
        const coverImage = song.cover || null;

        // Send lyrics first
        const lyricsMessage = `🎶 *${songTitle}* by ${songArtist}\n\n📜 Lyrics:\n${lyrics}`;
        api.sendMessage({
            body: lyricsMessage,
            attachment: coverImage ? await axios.get(coverImage, { responseType: 'stream' }).then(res => res.data) : null
        }, threadID, async () => {
            // Cache the MP3 file
            const cacheDir = path.join(__dirname, "cache");
            await fs.ensureDir(cacheDir);
            const cachePath = path.join(cacheDir, `music_${songTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`);

            // Download the MP3 file
            const downloadResponse = await axios({
                url: mp3,
                method: 'GET',
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(cachePath);
            downloadResponse.data.pipe(writer);

            writer.on('finish', async () => {
                try {
                    // Send the MP3 file
                    const audioStream = fs.createReadStream(cachePath);
                    await api.sendMessage({
                        body: `🎵 Here's the MP3 for "${songTitle}"`,
                        attachment: audioStream
                    }, threadID, () => {
                        // Delete the cached file after sending
                        fs.removeSync(cachePath);
                    }, messageID);
                } catch (err) {
                    console.error("Error sending MP3 file:", err);
                    api.sendMessage("Failed to send the song. Please try again later.", threadID, messageID);
                }
            });

            writer.on('error', (err) => {
                console.error("Error writing MP3 file:", err);
                api.sendMessage("Failed to download the song. Please try again later.", threadID, messageID);
            });
        });

        api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
        console.error("Error fetching lyrics or song:", error.message);
        api.sendMessage("Failed to retrieve the song or lyrics. Please try again later.", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};
