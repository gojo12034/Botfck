const cron = require('node-cron');
const axios = require('axios');

// Function to fetch a Bible verse
const fetchBibleVerse = async () => {
  try {
    const response = await axios.get('https://bible-api.com/data/web/random/MAT,MRK,LUK,JHN');
    const { book, chapter, verse, text } = response.data.random_verse;

    // Format the date for Asia/Manila timezone
    const currentDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
    }).format(new Date());

    return `📖 Daily Bible Verse:\n\n"${text}"\n\n📍 ${book} ${chapter}:${verse}\n📅 Date: ${currentDate}`;
  } catch (error) {
    console.error('Error fetching Bible verse:', error.message);

    // Fallback Bible verse
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
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before sending to the next thread
    } catch (err) {
      console.warn(
        `WARN sendMessage Got error ${err.error || 'unknown'}. This might mean that you're not part of the conversation ${thread.threadID}`
      );
      console.error(`Error sending message to thread ${thread.threadID}:`, err.message);
    }
  }
};

module.exports = ({ api }) => {
  const config = {
    autoRestart: {
      status: true,
      time: 40, // Interval in minutes
      note: 'To avoid problems, enable periodic bot restarts',
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

          // Attempt to get all threads from the inbox
          let threads = [];
          try {
            threads = (await api.getThreadList(20, null, ['INBOX'])).filter(
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

  if (config.autoRestart.status) {
    cron.schedule(`*/${config.autoRestart.time} * * * *`, () => {
      try {
        console.log('Auto-restarting the bot...');
        process.exit(1); // Exit with success code to allow restart
      } catch (err) {
        console.error('Error during auto-restart:', err.message);
      }
    });
  }
};
