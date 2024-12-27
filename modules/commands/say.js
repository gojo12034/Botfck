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
        
        
        const response = await axios.get(`https://vneerapi.onrender.com/t2v?text=${encodeURIComponent(content)}`);
        
        if (!response.data.audioUrl) {
            return api.sendMessage("Failed to generate the audio. Please try again later.", event.threadID, event.messageID);
        }

        
        const audioResponse = await axios.get(response.data.audioUrl, { responseType: "arraybuffer" });
        const audioBuffer = Buffer.from(audioResponse.data, "binary");

        
        return api.sendMessage({
            attachment: audioBuffer,
            filename: `${event.threadID}_${event.senderID}.mp3`
        }, event.threadID, event.messageID);
    } catch (e) {
        console.error(e);
        return api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID);
    }
};
