const axios = require("axios");

module.exports.config = {
  name: "darkjoke",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "fix by atsushi",
  description: "get a random dark joke",
  usePrefix: true, 
  commandCategory: "category",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  try {
    const response = await axios.get("https://v2.jokeapi.dev/joke/dark");
    const { type, setup, delivery, joke } = response.data;

    let darkMsg = "";

    if (type === "twopart") {
      darkMsg = `${setup}\n\n${delivery}`;
    } else {
      darkMsg = joke;
    }

    api.sendMessage(darkMsg, event.threadID, event.messageID);
  } catch (error) {
    console.error("Something went wrong:", error);
    api.sendMessage("An error occurred. Please try again later.", event.threadID);
  }
};
