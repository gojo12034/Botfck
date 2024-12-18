const { find } = require('llyrics');

module.exports.config = {
  name: 'lyrics',
  version: '1',
  hasPermission: 0,
  credits: 'Biru',
  description: 'View lyrics of a song',
  usePrefix: true,
  commandCategory: 'media',
  usage: 'lyrics [song]',
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const apiKey = 'TUoXsviG2F-cP3lzP5VtzZ3i1IjsPqHabEeqXq7LugC_1F7e0h6yZFrES7ihiaNc'; // Genius API key here!

  const songName = args.join(' ');

  if (!songName) {
    return api.sendMessage('Please enter a song name.', event.threadID, event.messageID);
  }

  try {
    // Primary call to find lyrics using the Genius engine
    const response = await find({
      song: songName,
      engine: 'genius',
      geniusApiKey: apiKey,
      forceSearch: true
    });

    // Check if lyrics were found, fallback to 'musixmatch' engine if not
    if (!response || !response.lyrics) {
      const fallbackResponse1 = await find({
        song: songName,
        engine: 'musixmatch',
        forceSearch: true
      });

      if (fallbackResponse1 && fallbackResponse1.lyrics) {
        const fallbackMessage1 = `🎶 *${fallbackResponse1.title}* by ${fallbackResponse1.artist}\n\n${fallbackResponse1.lyrics}`;
        return api.sendMessage(fallbackMessage1, event.threadID);
      }

      // Fallback to 'youtube' engine if musixmatch also fails
      const fallbackResponse2 = await find({
        song: songName,
        engine: 'youtube',
        forceSearch: true
      });

      if (fallbackResponse2 && fallbackResponse2.lyrics) {
        const fallbackMessage2 = `🎶 *${fallbackResponse2.title}* by ${fallbackResponse2.artist}\n\n${fallbackResponse2.lyrics}`;
        return api.sendMessage(fallbackMessage2, event.threadID);
      }

      // If all engines fail
      return api.sendMessage('Sorry, I couldn\'t find the lyrics for that song.', event.threadID, event.messageID);
    }

    // If lyrics were found in the primary Genius engine
    const { lyrics, title, artist } = response;
    const message = `🎶 *${title}* by ${artist}\n\n${lyrics}`;
    api.sendMessage(message, event.threadID);
  } catch (error) {
    console.error('llyrics error:', error);
    api.sendMessage('Failed to fetch lyrics.', event.threadID, event.messageID);
  }
};
