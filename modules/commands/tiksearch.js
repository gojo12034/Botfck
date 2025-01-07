module.exports.config = {
  name: "tiksearch",
  version: "0.2",
  hasPermssion: "0",
  credits: "Biru", 
  description: "Search for TikTok videos",
  usePrefix: true,
  commandCategory: "Media",
  usage: "+tiksearch <query>",
  cooldowns: 5,
};

const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.run = async function({ api, event, args }) {
  try {
    const searchQuery = args.join(" ");
    if (!searchQuery) {
      api.sendMessage("Usage: +tiksearch <query>", event.threadID);
      return;
    }
    
    api.sendMessage("⏱️ | Searching TikTok videos, please wait...", event.threadID);
    
    const response = await axios.get(`https://vneerapi.onrender.com/tiktok?query=${encodeURIComponent(searchQuery)}`);
    const videoData = response.data;

    if (!videoData || !videoData.no_watermark) {
      api.sendMessage("No videos found for the given search query.", event.threadID);
      return;
    }

    const message = `𝐓𝐢𝐤𝐭𝐨𝐤 𝐫𝐞𝐬𝐮𝐥𝐭:\n\n𝐓𝐢𝐭𝐥𝐞: ${videoData.title}\n𝐌𝐮𝐬𝐢𝐜: ${videoData.music}\n𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐋𝐢𝐧𝐤: ${videoData.no_watermark}`;

    // Use the /tmp directory for temporary files in Render
    const filePath = path.join("/tmp", `tiktok_video_${Date.now()}.mp4`);
    const writer = fs.createWriteStream(filePath);

    const videoResponse = await axios({
      method: 'get',
      url: videoData.no_watermark,
      responseType: 'stream',
    });

    videoResponse.data.pipe(writer);

    writer.on('finish', () => {
      api.sendMessage(
        { body: message, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath) // Cleanup temporary file after sending
      );
    });

    writer.on('error', (err) => {
      console.error("Error writing video file:", err);
      api.sendMessage("An error occurred while downloading the video.", event.threadID);
    });
  } catch (error) {
    console.error('Error:', error);
    api.sendMessage("An error occurred while processing the request.", event.threadID);
  }
};
