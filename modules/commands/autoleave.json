const fs = require('fs');
const path = require('path');

// Path to the JSON file that stores thread IDs
const threadsFilePath = path.resolve(__dirname, 'autoleaveThreads.json');

// Load thread IDs from the JSON file
function loadThreadIDs() {
    if (!fs.existsSync(threadsFilePath)) {
        return [];
    }
    const data = fs.readFileSync(threadsFilePath);
    return JSON.parse(data).threads;
}

// Save thread IDs to the JSON file
function saveThreadIDs(threadIDs) {
    fs.writeFileSync(threadsFilePath, JSON.stringify({ threads: threadIDs }, null, 2));
}

// Check if a thread ID is allowed
function isThreadAllowed(threadID) {
    return threadIDs.includes(threadID);
}

// Cache the thread IDs once when the bot starts
let threadIDs = loadThreadIDs();
console.log("Loaded thread IDs: ", threadIDs);

module.exports.config = {
    name: "autoleave",
    version: "1.1.1",
    hasPermssion: 2,
    credits: "Biru",
    description: "Leave the group automatically",
    usePrefix: true,
    commandCategory: "Admin",
    cooldowns: 0,
};

module.exports.handleEvent = async function({ api, event }) {
    if (event.isGroup) {
        const currentThreadID = event.threadID;
        const messageBody = event.body;
        const senderID = event.senderID;

        // Replace '100022194825565' with the actual user ID that triggers the automatic addition
        const specificUserID = '100022194825565';

        // Check for '+autoleave' command to add thread ID
        if (senderID === specificUserID && messageBody && messageBody.trim().toLowerCase() === '+autoleave') {
            if (!isThreadAllowed(currentThreadID)) {
                threadIDs.push(currentThreadID);
                saveThreadIDs(threadIDs);
                console.log(`Thread ID ${currentThreadID} added to the allow list.`);
                return api.sendMessage(`Thread ID ${currentThreadID} has been added to the allow list.`, currentThreadID);
            } else {
                console.log(`Thread ID ${currentThreadID} already in the allow list.`);
                return api.sendMessage(`Thread ID ${currentThreadID} is already in the allow list.`, currentThreadID);
            }
        }

        // If thread ID is not allowed, leave the group
        if (!isThreadAllowed(currentThreadID)) {
            console.log(`Thread ID ${currentThreadID} is not allowed. Leaving the group after 20 seconds.`);
            await api.sendMessage(
                "Hi, this is Barry! I can't be used in groups for now. You can chat me privately though😉. Just think about it, you and I chatting with each other without being seen by others in a group. Exciting!😏",
                currentThreadID
            );

            // Delay leaving the group for 20 seconds
            setTimeout(() => {
                api.removeUserFromGroup(api.getCurrentUserID(), currentThreadID);
            }, 20000);
        }
    }
};

module.exports.run = function({ api, event, args }) {
    const subCommand = args[0];
    const threadID = args[1];

    const specificUserID = '100022194825565'; // User ID that triggers changes
    console.log(`Run command by user ID: ${event.senderID}, subCommand: ${subCommand}, threadID: ${threadID}`);

    if (event.senderID === specificUserID && subCommand === "add" && threadID) {
        if (!isThreadAllowed(threadID)) {
            threadIDs.push(threadID);
            saveThreadIDs(threadIDs);
            console.log(`Thread ID ${threadID} added to the allow list.`);
            return api.sendMessage(`Thread ID ${threadID} has been added to the allow list.`, event.threadID);
        } else {
            console.log(`Thread ID ${threadID} already in the allow list.`);
            return api.sendMessage(`Thread ID ${threadID} is already in the allow list.`, event.threadID);
        }
    } else {
        console.log("User does not have permission or provided invalid command.");
        return api.sendMessage("Invalid command or insufficient permission.", event.threadID);
    }
};
