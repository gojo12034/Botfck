const cron = require('node-cron');
const axios = require('axios');

// Function to fetch a Bible verse
const fetchBibleVerse = async () => {
  try {
    const response = await axios.get('https://bible-api.com/data/web/random/MAT,MRK,LUK,JHN');
    const { book, chapter, verse, text } = response.data.random_verse;

    const currentDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
    }).format(new Date());

    return `📖 Daily Bible Verse:\n\n"${text}"\n\n📍 ${book} ${chapter}:${verse}\n📅 Date: ${currentDate}`;
  } catch (error) {
    console.error('Error fetching Bible verse:', error.message);
    return `📖 Daily Bible Verse:\n\n"For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope."\n\n📍 Jeremiah 29:11\n📅 Date: ${new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
    }).format(new Date())}`;
  }
};

// Function to send messages with delays between each thread
const sendMessageWithDelay = async (api, message, threads, delay = 2000) => {
  for (const thread of threads) {
    try {
      await api.sendMessage(message, thread.threadID);
      console.log(`Message sent to thread ${thread.threadID}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (err) {
      console.error(`Error sending message to thread ${thread.threadID}: ${err.message}`);
    }
  }
};

module.exports = ({ api }) => {
  const config = {
    autoRestart: {
      status: true,
      time: 40, // Restart interval in minutes (e.g., 40 minutes)
      note: 'Restart is scheduled to run at precise intervals from midnight.',
    },
    greetings: [
      {
        cronTime: '0 5 * * *',
        messages: ['Good morning! Have a great day ahead!'],
      },
      {
        cronTime: '0 7 * * *',
        messages: async () => `Good morning! Here’s some inspiration for today:\n\n${await fetchBibleVerse()}`,
      },
      {
        cronTime: '0 8 * * *',
        messages: ['Hello Everyone Time Check 8:00 AM :> \n https://www.facebook.com/CiVi2'],
      },
      {
        cronTime: '0 12 * * *',
        messages: ['Good afternoon! Don’t forget to take a break and enjoy your lunch!'],
      },
      {
        cronTime: '0 14 * * *',
        messages: ['It’s 2 PM! Time to focus on your daily tasks. Keep pushing forward!'],
      },
      {
        cronTime: '0 19 * * *',
        messages: async () => `Good evening! Reflect on this verse:\n\n${await fetchBibleVerse()}`,
      },
      {
        cronTime: '0 22 * * *',
        messages: ['It’s 10 PM. Time to wind down and get ready for bed. Have a peaceful night!'],
      },
    ],
  };

  // Schedule greetings
  config.greetings.forEach((greeting) => {
    cron.schedule(
      greeting.cronTime,
      async () => {
        try {
          const message =
            typeof greeting.messages === 'function'
              ? await greeting.messages()
              : greeting.messages[0];

          console.log(`Preparing to send message: "${message}"`);

          let threads = [];
          try {
            threads = (await api.getThreadList(10, null, ['INBOX'])).filter(
              (thread) => thread.isGroup === true
            );
          } catch (err) {
            console.error('Error retrieving threads:', err.message);
          }

          if (threads.length === 0) {
            console.log('No accessible group threads found.');
            return;
          }

          console.log(`Found ${threads.length} accessible group threads.`);
          await sendMessageWithDelay(api, message, threads, 2000);
        } catch (err) {
          console.error('Error during greeting execution:', err.message);
        }
      },
      {
        scheduled: true,
        timezone: 'Asia/Manila',
      }
    );
  });

  // Schedule precise restart at configured intervals
  if (config.autoRestart.status) {
    const restartCron = `*/${config.autoRestart.time} * * * *`;
    cron.schedule(restartCron, () => {
      const now = new Date();
      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();

      // Restart only if the current time is a multiple of the configured interval
      if (minutesSinceMidnight % config.autoRestart.time === 0) {
        try {
          console.log(`Restarting bot as scheduled at ${now.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' })}`);
          process.exit(1); // Restart bot
        } catch (err) {
          console.error('Error during restart:', err.message);
        }
      }
    });
  }
};
