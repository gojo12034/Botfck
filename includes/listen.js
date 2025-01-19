module.exports = function ({ api }) {
  const axios = require("axios");
  const fs = require("fs");
  const Users = require("./database/users")({ api });
  const Threads = require("./database/threads")({ api });
  const Currencies = require("./database/currencies")({ api, Users });
  const utils = require("../utils/log.js");
  const { getThemeColors } = utils;
  const { cra, cb, co } = getThemeColors();

  //////////////////////////////////////////////////////////////////////
  //========= Push all variable from database to environment =========//
  //////////////////////////////////////////////////////////////////////

  (async function () {
    try {
      if (global.config.autoCreateDB) {
        const [threads, users] = await Promise.all([
          Threads.getAll(),
          Users.getAll(["userID", "name", "data"]),
        ]);

        threads.forEach((data) => {
          const idThread = String(data.threadID);
          global.data.allThreadID.push(idThread);
          global.data.threadData.set(idThread, data.data || {});
          global.data.threadInfo.set(idThread, data.threadInfo || {});
          if (data.data && data.data.banned) {
            global.data.threadBanned.set(idThread, {
              reason: data.data.reason || "",
              dateAdded: data.data.dateAdded || "",
            });
          }
          if (
            data.data &&
            data.data.commandBanned &&
            data.data.commandBanned.length !== 0
          ) {
            global.data.commandBanned.set(idThread, data.data.commandBanned);
          }
          if (data.data && data.data.NSFW) {
            global.data.threadAllowNSFW.push(idThread);
          }
        });

        users.forEach((dataU) => {
          const idUsers = String(dataU.userID);
          global.data.allUserID.push(idUsers);
          if (dataU.name && dataU.name.length !== 0) {
            global.data.userName.set(idUsers, dataU.name);
          }
          if (dataU.data && dataU.data.banned) {
            global.data.userBanned.set(idUsers, {
              reason: dataU.data.reason || "",
              dateAdded: dataU.data.dateAdded || "",
            });
          }
          if (
            dataU.data &&
            dataU.data.commandBanned &&
            dataU.data.commandBanned.length !== 0
          ) {
            global.data.commandBanned.set(idUsers, dataU.data.commandBanned);
          }
        });

        global.loading.log(
          `Successfully loaded ${cb(
            `${global.data.allThreadID.length}`
          )} threads and ${cb(`${global.data.allUserID.length}`)} users`,
          "LOADED"
        );
      } else {
        global.loading.log(
          "autoCreateDB is set to false. Skipping data load.",
          "INFO"
        );
      }
    } catch (error) {
      global.loading.log(
        `Can't load environment variable, error: ${error}`,
        "ERROR"
      );
    }
  })();

  global.loading.log(
    `${cra(`[ BOT_INFO ]`)} success!\n${co(`[ LOADED ] `)}${cra(`[ NAME ]:`)} ${
      !global.config.BOTNAME ? "Bot Messenger" : global.config.BOTNAME
    } \n${co(`[ LOADED ] `)}${cra(`[ BotID ]: `)}${api.getCurrentUserID()}\n${co(
      `[ LOADED ] `
    )}${cra(`[ PREFIX ]:`)} ${global.config.PREFIX}`,
    "LOADED"
  );


  

  ///////////////////////////////////////////////
  //========= Require all handle need =========//
  //////////////////////////////////////////////
  const runObj = {
    api,
    Users,
    Threads,
    Currencies,
  };

  const handleCommand = require("./handle/handleCommand")(runObj);
  const handleCommandEvent = require("./handle/handleCommandEvent")(runObj);
  const handleReply = require("./handle/handleReply")(runObj);
  const handleReaction = require("./handle/handleReaction")(runObj);
  const handleEvent = require("./handle/handleEvent")(runObj);
  //const handleRefresh = require("./handle/handleRefresh")(runObj);
  //const handleCreateDatabase = require("./handle/handleCreateDatabase")(runObj);

  

  //////////////////////////////////////////////////
  //========= Send event to handle need =========//
  /////////////////////////////////////////////////

  const Box = require("./liane-box");

  return (event) => {
    const box = new Box(api, event, global.config.autoCensor || false);
    const listenObj = {
      event,
      box,
    };
    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        //handleCreateDatabase(listenObj);
        handleCommand(listenObj);
        handleReply(listenObj);
        handleCommandEvent(listenObj);
        break;
      case "change_thread_image":
        break;
      case "event":
        handleEvent(listenObj);
        //handleRefresh(listenObj);
        break;
      case "message_reaction":
        handleReaction(listenObj);
        break;
      default:
        break;
    }
  };
};
