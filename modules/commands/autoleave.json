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

// Get the current list of thread IDs
let threadIDs = loadThreadIDs();
console.log("Loaded thread IDs: ", threadIDs);

module.exports.config = {
    name: "autoleave",
    version: "1.1.0",
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

        console.log(``);

        // Replace '100022194825565' with the actual user ID that triggers the automatic addition
        const specificUserID = '100022194825565';

        if (senderID === specificUserID && messageBody && messageBody.trim().toLowerCase() === '+autoleave') {
            // Add the thread ID to the list if it doesn't already exist
            if (!threadIDs.includes(currentThreadID)) {
                threadIDs.push(currentThreadID);
                saveThreadIDs(threadIDs);
                console.log(`Thread ID ${currentThreadID} has been added to the allow list.`);
                return api.sendMessage(`Thread ID ${currentThreadID} has been added to the allow list.`, currentThreadID);
            } else {
                console.log(`Thread ID ${currentThreadID} is already in the allow list.`);
                return api.sendMessage(`Thread ID ${currentThreadID} is already in the allow list.`, currentThreadID);
            }
        }

        // Check if the current thread ID is in the list of allowed thread IDs
        if (!threadIDs.includes(currentThreadID)) {
            console.log(`Thread ID ${currentThreadID} is not allowed. Leaving the group after 20 seconds.`);
            await api.sendMessage(
                "Hi, this is Barry! I can't be used in groups for now. You can chat me privately though😉. Just think about it, you and I chatting with each other without being seen by others in a group. Exciting!😏",
                currentThreadID
            );

            // Delay leaving the group for 20 seconds
            setTimeout(() => {
                api.removeUserFromGroup(api.getCurrentUserID(), currentThreadID);
            }, 20000); // 20000 milliseconds = 20 seconds
        } else {
            console.log(``);
        }
    }
};

module.exports.run = function({ api, event, args }) {
    const subCommand = args[0];
    const threadID = args[1];

    // Replace '100022194825565' with the actual user ID that triggers the automatic addition
    const specificUserID = '100022194825565';

    console.log(`Run command by user ID: ${event.senderID}, subCommand: ${subCommand}, threadID: ${threadID}`);

    // Check if the user performing the action is the specific user
    if (event.senderID === specificUserID && subCommand === "add" && threadID) {
        // Add the thread ID to the list if it doesn't already exist
        if (!threadIDs.includes(threadID)) {
            threadIDs.push(threadID);
            saveThreadIDs(threadIDs);
            console.log(`Thread ID ${threadID} has been added to the allow list.`);
            return api.sendMessage(`Thread ID ${threadID} has been added to the allow list.`, event.threadID);
        } else {
            console.log(`Thread ID ${threadID} is already in the allow list.`);
            return api.sendMessage(`Thread ID ${threadID} is already in the allow list.`, event.threadID);
        }
    } else {
        console.log("User does not have permission to use this command or invalid command.");
        return api.sendMessage("", event.threadID);
    }
};
