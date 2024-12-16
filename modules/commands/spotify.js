const axios = require('axios');

module.exports.config = {
    name: "spotify",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Play music via a search keyword",
    usePrefix: true,
    commandCategory: "Media",
    usages: "[song name]",
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

    // React and show typing indicator
    api.setMessageReaction("🕢", messageID, () => {}, true);
    api.sendTypingIndicator(threadID, true);

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

        // Send the message first
        api.sendMessage(messageBody, threadID, async () => {
            try {
                // Fetch the song directly as a stream
                const downloadResponse = await axios({
                    url: downloadUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                // Send the attachment
                api.sendMessage({
                    attachment: downloadResponse.data
                }, threadID, () => {
                    api.setMessageReaction("✅", messageID, () => {}, true);
                }, messageID);
            } catch (downloadError) {
                console.error("Error fetching the song stream:", downloadError.message);
                api.sendMessage("An error occurred while downloading the song. Please try again later.", threadID, messageID);
                api.setMessageReaction("❌", messageID, () => {}, true);
            }
        });

    } catch (error) {
        console.error("Error fetching the song:", error.message);
        api.sendMessage("Failed to retrieve the song. Please try again later.", threadID, messageID);
        api.setMessageReaction("❌", messageID, () => {}, true);
    }
};
