const axios = require("axios");

module.exports.config = {
    name: "adduser",
    version: "2.4.3",
    hasPermssion: 0,
    credits: "jonell mod n api by biru",
    description: "Add user to the group",
    usePrefix: true,
    commandCategory: "group",
    usages: "[link or UID]",
    cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let input = args.join(" ").trim();
    const fbUrlRegex = /^https:\/\/(www\.)?facebook\.com\/(profile\.php\?id=\d+|\d+|[a-zA-Z0-9.]+\/?)$/;
    const uidRegex = /^\d+$/;

    if (!fbUrlRegex.test(input) && !uidRegex.test(input)) {
        return api.sendMessage("❌ Invalid Facebook profile URL or UID. Please provide a valid link or numeric UID.", threadID, messageID);
    }

    const preparingMessage = await api.sendMessage("🔄 Processing request...", threadID, messageID);

    try {
        let uid;

        // Parse input to get UID
        if (fbUrlRegex.test(input)) {
            const urlParts = input.split("facebook.com/")[1].replace("/", "");
            if (uidRegex.test(urlParts)) {
                uid = urlParts; // Direct UID in the URL path
            } else if (input.includes("profile.php")) {
                const urlParams = new URL(input);
                uid = urlParams.searchParams.get("id"); // Extract UID from ?id=
            } else {
                const username = urlParts; // Username-based URL
                const res = await axios.get(`https://vneerapi.onrender.com/fbid?url=https://www.facebook.com/${username}`);
                api.editMessage("🔄 Verifying user...", preparingMessage.messageID, threadID);

                if (res.data.status && res.data.facebookId) {
                    uid = res.data.facebookId;
                } else {
                    return api.editMessage("❌ Failed to fetch Facebook UID. Please check the profile URL.", preparingMessage.messageID, threadID);
                }
            }
        } else {
            uid = input; // Direct numeric UID
        }

        // Validate the UID exists and fetch user info
        const userDetails = await api.getUserInfo(uid);
        if (!userDetails[uid]) {
            return api.editMessage("❌ User not found. Please provide a valid UID or URL.", preparingMessage.messageID, threadID);
        }

        const userName = userDetails[uid].name;

        // Check if the user is already in the group
        const threadInfo = await api.getThreadInfo(threadID);
        if (threadInfo.participantIDs.includes(uid)) {
            return api.editMessage(`ℹ️ The user (${userName}) is already in this group.`, preparingMessage.messageID, threadID);
        }

        // Add user to the group
        await api.addUserToGroup(uid, threadID);
        api.editMessage(`✅ Successfully added ${userName} to the group!`, preparingMessage.messageID, threadID);
    } catch (error) {
        console.error("Error adding user:", error.message);
        api.editMessage("❌ An error occurred while adding the user. Please try again later.", preparingMessage.messageID, threadID);
    }
};
