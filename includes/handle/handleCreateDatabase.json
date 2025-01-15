module.exports = function ({ Users, Threads }) {
    const logger = require("../../utils/log.js");
    const threads = require('../database/data/threadsData.json');
    const users = require('../database/data/usersData.json');

    // Utility function to create a delay
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    return async function ({ event }) {
        const { allUserID, allThreadID } = global.data; 
        const { autoCreateDB } = global.config;
        if (!autoCreateDB) return;

        var { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        try {
            // Introduce a delay (e.g., 1000ms = 1 second)
            await sleep(3000);

            if (!allThreadID.includes(threadID) && event.isGroup && !threads.hasOwnProperty(threadID)) {
                allThreadID.push(threadID);
                await Threads.createData(threadID);
                logger.log(global.getText('handleCreateDatabase', 'newThread', threadID), 'DATABASE');
            }

            if (threads.hasOwnProperty(threadID)) {
                var data = threads[threadID];
                if (data) {
                    if (!data.threadInfo.participantIDs.includes(senderID)) {
                        data.threadInfo.participantIDs.push(senderID);
                        logger.log('Perform more group data ' + threadID, 'ADD DATA');
                        await Threads.setData(threadID, { threadInfo: data.threadInfo });
                    }
                }
            }

            if (!allUserID.includes(senderID) && !users.hasOwnProperty(senderID)) {
                allUserID.push(senderID);
                await Users.createData(senderID);
                logger.log(global.getText('handleCreateDatabase', 'newUser', senderID), 'DATABASE');
            }
            return;
        } catch (err) {
            console.log(err);
        }
    };
}
