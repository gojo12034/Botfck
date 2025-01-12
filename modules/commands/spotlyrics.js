const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "spotlyrics",
    version: "1.3.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Fetch lyrics and download Spotify song.",
    usePrefix: true,
    commandCategory: "Media",
    usages: "[song name]",
    cooldowns: 10,
    dependencies: { axios: "", fs: "", path: "" }
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
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const cachePath = path.join(cacheDir, `music_${songTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`);

            try {
                // Download the MP3 file and write it to cache
                const downloadStream = await axios({
                    url: mp3,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(cachePath);

                // Wait for the stream to complete
                await new Promise((resolve, reject) => {
                    downloadStream.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // Send the MP3 file
                const audioStream = fs.createReadStream(cachePath);
                api.sendMessage({
                    body: `🎵 Here's the MP3 for "${songTitle}"`,
                    attachment: audioStream
                }, threadID, () => {
                    // Delete the cached file after sending
                    fs.unlinkSync(cachePath);
                }, messageID);

            } catch (downloadError) {
                console.error("Error downloading MP3 file:", downloadError);
                api.sendMessage("Failed to download the MP3 file. Please try again later.", threadID, messageID);
            }
        });

        api.setMessageReaction("✅", messageID, () => {}, true);

    } catch (error) {
        console.error("Error fetching lyrics or song:", error.message);
        api.sendMessage("Failed to retrieve the song or lyrics. Please try again later.", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};
