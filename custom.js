const cron = require('node-cron');
const axios = require('axios');

const fetchBibleVerse = async () => {
  try {
    const response = await axios.get('https://labs.bible.org/api/?passage=random&type=json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)', // Prevent 403 errors by mimicking a browser request
      },
    });

    const { bookname, chapter, verse, text } = response.data[0];

    // Get the current date in Asia/Manila timezone
    const currentDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
    }).format(new Date());

    return `📖 Daily Bible Verse:\n\n"${text}"\n\n📍 ${bookname} ${chapter}:${verse}\n📅 Date: ${currentDate}`;
  } catch (error) {
    console.error('Error fetching Bible verse:', error.message);
    return '🙏 No Bible verse at the moment.';
  }
};

module.exports = ({ api }) => {
  const config = {
    autoRestart: {
      status: true,
      time: 100,
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
    cron.schedule(`*/${config.autoRestart.time} * * * *`, async () => {
      try {
        const threads = await api.getThreadList(20, null, ['INBOX']);
        for (const thread of threads) {
          if (thread.isGroup) {
            await api.sendMessage(
              '🔃 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀\n━━━━━━━━━━━━━━━━━━\nBot is restarting...',
              thread.threadID
            );
          }
        }
        console.log('Start rebooting the system!');
      } catch (err) {
        console.error('Error during auto-restart:', err);
      }
    });
  }
};
