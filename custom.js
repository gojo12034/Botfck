const cron = require('node-cron');
const axios = require('axios');

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

module.exports = ({ api }) => {
  const config = {
    autoRestart: {
      status: true,
      time: 100, // Interval in minutes
      note: 'To avoid problems, enable periodic bot restarts',
    },
    greetings: [
      {
        cronTime: '0 5 * * *',
        messages: ['Good morning! Have a great day ahead!'],
      },
      {
        cronTime: '0 8 * * *',
        messages: ['Hello Everyone Time Check 8:00 AM :> \n https://www.facebook.com/CiVi2'],
      },
      {
        cronTime: '0 7 * * *',
        messages: async () => `Good morning! Here’s some inspiration for today:\n\n${await fetchBibleVerse()}`,
      },
      {
        cronTime: '0 19 * * *',
        messages: async () => `Good evening! Reflect on this verse:\n\n${await fetchBibleVerse()}`,
      },
    ],
  };

  config.greetings.forEach((greeting) => {
    cron.schedule(greeting.cronTime, async () => {
      try {
        const message =
          typeof greeting.messages === 'function'
            ? await greeting.messages()
            : greeting.messages[0];

        const threads = await api.getThreadList(20, null, ['INBOX']);
        threads.forEach((thread) => {
          if (thread.isGroup) {
            api.sendMessage(message, thread.threadID).catch((err) => {
              console.error('Error sending message:', err);
            });
          }
        });
      } catch (err) {
        console.error('Error scheduling greeting:', err);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Manila',
    });
  });

  if (config.autoRestart.status) {
    // Schedule the restart function for every 100 minutes using custom logic
    cron.schedule(`0 */1 * * *`, async () => {
      const currentTime = new Date();
      const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      // Check if it's the correct 100-minute interval
      if (minutes % config.autoRestart.time === 0) {
        try {
          console.log('Start rebooting the system!');
          process.exit(1);
        } catch (err) {
          console.error('Error during auto-restart:', err);
        }
      }
    });
  }
};
