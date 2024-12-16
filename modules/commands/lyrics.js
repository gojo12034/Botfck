const axios = require("axios");
const path = require("path");
const fs = require("fs-extra");

module.exports.config = {
    name: "lyrics",
    version: "1.0",
    hasPermission: 0,
    description: "Get lyrics and artist image",
    credits: "Biru",
    usePrefix: true,
    commandCategory: "Search",
    usages: "[song title]",
    cooldowns: 0,
};

module.exports.run = async function ({ api, event, args }) {
    try {
        const title = args.join(" ");

        if (!title) {
            return api.sendMessage(
                "⛔ Invalid Usage\n━━━━━━━━━━━━━━━\n\nPlease provide a song title to search for lyrics.",
                event.threadID,
                event.messageID
            );
        }

        api.sendMessage("🔎 Searching for lyrics...", event.threadID, event.messageID);

        // URL to the new lyrics API
        const apiUrl = `https://vneerapi.onrender.com/lyrics?song=${encodeURIComponent(title)}`;
        console.log(`Fetching data from API: ${apiUrl}`);

        const res = await axios.get(apiUrl);
        const data = res.data;

        if (!data || !data.lyrics) {
            return api.sendMessage(
                `No lyrics found for "${title}". Please try with a different song.`,
                event.threadID,
                event.messageID
            );
        }

        // Prepare the message with song title, artist, and lyrics
        const message = `🎵 Lyrics for "${data.title}" by ${data.artist}\n━━━━━━━━━━━━━━━\n\n${data.lyrics}`;

        // Check if there is an artist image URL, handle accordingly
        if (data.artistImage) {
            const artistImageResponse = await axios.get(data.artistImage, { responseType: "arraybuffer" });
            const imageFileName = `${data.title.replace(/\s/g, "_").toLowerCase()}_image.jpg`;
            const imagePath = path.join(__dirname, "images", imageFileName);
            await fs.outputFile(imagePath, artistImageResponse.data);

            const imgData = fs.createReadStream(imagePath);
            await api.sendMessage({
                body: message,
                attachment: imgData,
            }, event.threadID);

            // Clean up image file after sending
            await fs.remove(imagePath);
            console.log(`Image file ${imagePath} removed.`);
        } else {
            // Send message without image if no artist image is found
            await api.sendMessage(message, event.threadID, event.messageID);
        }

        console.log(`Lyrics successfully sent for "${data.title}"`);

    } catch (error) {
        console.error("Error fetching lyrics:", error);
        return api.sendMessage(
            "An error occurred while fetching lyrics. Please try again later.",
            event.threadID,
            event.messageID
        );
    }
};
