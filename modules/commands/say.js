const axios = require('axios');

module.exports.config = {
	name: "say",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "Biru",
	description: "text to voice speech messages",
	usePrefix: true, 
	commandCategory: "message",
	usages: `Text to speech messages`,
	cooldowns: 5,
	dependencies: { axios: "" }
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const content = args.join(" ") || (event.type === "message_reply" ? event.messageReply.body : "");

    if (!content) {
        return api.sendMessage("Please provide text to convert to speech.", threadID, messageID);
    }

    try {
        // Fetch the audio URL from the API
        const apiUrl = `https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`;
        const response = await axios.get(apiUrl);

        // Extract the audio URL from the API response
        const audioUrl = response.data.audioUrl;
        if (!audioUrl) {
            return api.sendMessage("Failed to fetch the audio file. Please try again later.", threadID, messageID);
        }

        // Fetch the audio file as a stream
        const audioStream = await axios({
            url: audioUrl,
            method: "GET",
            responseType: "stream"
        });

        // Send the audio file as an attachment
        api.sendMessage({
            attachment: audioStream.data
        }, threadID, messageID);

    } catch (error) {
        console.error("Error fetching the audio:", error.message);
        api.sendMessage("Failed to convert text to speech. Please try again later.", threadID, messageID);
    }
};
