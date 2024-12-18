const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const unlinkAsync = promisify(fs.unlink);

let downloadingLinks = [];
let downloadEnabled = true;

module.exports.config = {
  name: "autofb",
  version: "1.3.0",
  hasPermission: 0,
  credits: "Biru",
  usePrefix: true,
  description: "Auto download and send a Facebook video when someone sends a link.",
  commandCategory: "Utility",
  usages: "fb video URL",
  cooldowns: 10,
};

async function sendFacebookVideo(api, event, videoUrl) {
  try {
    await api.sendMessage("🔄 Fetching video details, please wait...", event.threadID);

    // Call the API to get video download links
    const response = await axios.get(`https://vneerapi.onrender.com/fbdl?url=${encodeURIComponent(videoUrl)}`);
    const videoData = response.data;

    // Check if the video links exist
    if (!videoData || !videoData.links) {
      throw new Error("Failed to fetch video download links.");
    }

    // Select video quality: Prefer 720p (HD), fall back to 360p (SD)
    const videoLink = videoData.links["720p (HD)"] || videoData.links["360p (SD)"];
    if (!videoLink) throw new Error("No valid video link found.");

    // Download the video
    const videoBuffer = await axios.get(videoLink, { responseType: "arraybuffer" });
    const filePath = path.join(__dirname, "cache", "fb_video.mp4");

    fs.writeFileSync(filePath, Buffer.from(videoBuffer.data));

    // Send the video to the user
    await api.sendMessage(
      {
        body: `✅ Video downloaded successfully in ${videoData.links["720p (HD)"] ? "HD (720p)" : "SD (360p)"} quality!`,
        attachment: fs.createReadStream(filePath),
      },
      event.threadID,
      () => unlinkAsync(filePath) // Clean up the cached file
    );
  } catch (error) {
    console.error("Error:", error.message || error);
    await api.sendMessage("❌ An error occurred while processing the video link. Please try again.", event.threadID);
  }
}

module.exports.handleEvent = async function ({ event, api }) {
  try {
    if (!event || !event.body || !downloadEnabled || event.type !== "message") return;

    const message = event.body;

    // Updated regex to match any Facebook video link format, including group links
    const regex = /(https?:\/\/(?:www\.)?facebook\.com\/(?:[^/]+\/videos\/|video\.php\?v=\d+|reel\/|watch\/?\?v=|groups\/\d+\/permalink\/\d+\/)\S*)/g;
    const links = message.match(regex);

    if (links && links.length > 0) {
      for (const link of links) {
        if (!link) continue;

        if (downloadingLinks.includes(link)) {
          console.log("Link is already being processed for download:", link);
          api.sendMessage(
            `⚠️ The video from this link is already being processed:\n${link}`,
            event.threadID
          );
          continue;
        }

        console.log("Downloading video from link:", link);
        downloadingLinks.push(link);

        try {
          await sendFacebookVideo(api, event, link);
        } finally {
          downloadingLinks = downloadingLinks.filter((dlLink) => dlLink !== link);
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
