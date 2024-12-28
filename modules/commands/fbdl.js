const axios = require("axios");
const fs = require("fs");
const { promisify } = require("util");

const unlinkAsync = promisify(fs.unlink);

module.exports.config = {
  name: "fbdl",
  version: "1.2.0",
  hasPermission: 0,
  credits: "Biru",
  usePrefix: true,
  description: "Download and send a Facebook video",
  commandCategory: "Utility",
  usages: "fbdl [video URL]",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) {
    await api.sendMessage("Please provide a valid Facebook video URL.", event.threadID);
    return;
  }

  const videoURL = args[0];

  try {
    // Call the external API
    const apiUrl = `https://vneerapi.onrender.com/fbdl?url=${encodeURIComponent(videoURL)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.links || Object.keys(response.data.links).length === 0) {
      await api.sendMessage("Failed to retrieve the video. Please check the URL and try again.", event.threadID);
      return;
    }

    // Select the highest quality link (720p if available, fallback to 360p)
    const downloadLink = response.data.links["720p (HD)"] || response.data.links["360p (SD)"];
    const videoTitle = response.data.author || "Facebook Video";

    await api.sendMessage(
      `Downloading the video: "${videoTitle}". Please wait...`,
      event.threadID
    );

    // Fetch the video file from the download URL
    const videoBuffer = await axios.get(downloadLink, { responseType: "arraybuffer" });

    const videoFileName = `${Date.now()}.mp4`;
    await fs.promises.writeFile(videoFileName, videoBuffer.data);
    const videoStream = fs.createReadStream(videoFileName);

    // Send the video to the user
    await api.sendMessage({ attachment: videoStream }, event.threadID);

    // Clean up the temporary video file
    await unlinkAsync(videoFileName);
  } catch (error) {
    console.error("Error fetching or sending the video:", error);
    await api.sendMessage(
      "An error occurred while processing your request. Please try again later.",
      event.threadID
    );
  }
};
