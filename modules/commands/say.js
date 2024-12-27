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
	dependencies: {
		"axios": ""
	}
};

module.exports.run = async function({ api, event, args }) {
    try {
        const axios = global.nodemodule["axios"];
        
        const content = (event.type == "message_reply") 
            ? event.messageReply.body 
            : args.join(" ");
        
        if (!content) {
            return api.sendMessage("Please provide a text to convert to speech.", event.threadID, event.messageID);
        }

        // Fetch the audio URL from the API
        const response = await axios.get(`https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`);
        const audioUrl = response.data.audioUrl;

        // Fetch audio stream directly
        const audioStream = await axios.get(audioUrl, { responseType: "stream" });

        return api.sendMessage({
            attachment: audioStream.data
        }, event.threadID, event.messageID);
    } catch (e) {
        console.error(e);
        return api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID);
    }
};
