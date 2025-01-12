const cron = require('node-cron');
const axios = require('axios');

const fetchBibleVerse = async () => {
  try {
    const response = await axios.get('https://bible-api.com/data/web/random/MAT,MRK,LUK,JHN');
    const { random_verse } = response.data;
    const { book, chapter, verse, text } = random_verse;

    const date = new Date().toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `📖 *Daily Bible Verse* - ${date}:\n\n"${text.trim()}"\n\n- *${book} ${chapter}:${verse}*`;
  } catch (error) {
    console.error('Error fetching Bible verse:', error.message);
    return 'Unable to fetch a Bible verse at the moment. Please try again later.';
  }
};

module.exports = ({ api }) => {
  const config = {
    autoRestart: {
      status: true,
      time: 40,
      note: 'To avoid problems, enable periodic bot restarts',
    },
    greetings: [
      {
        cronTime: '0 5 * * *',
        messages: ['Good morning! Have a great day ahead!'],
      },
      {
        cronTime: '0 7 * * *',
        messages: async () => `Good morning! Here's your daily inspiration:\n\n${await fetchBibleVerse()}`,
      },
      {
        cronTime: '0 8 * * *',
        messages: ['Hello Everyone Time Check 8:00 AM :> \n https://www.facebook.com/CiVi2'],
      },
      {
        cronTime: '0 12 * * *',
        messages: ['It’s lunchtime! Take a break and enjoy your meal!'],
      },
      {
        cronTime: '0 14 * * *',
        messages: ['⏰ Reminder: Stay focused on your tasks! You’ve got this!'],
      },
      {
        cronTime: '0 17 * * *',
        messages: ['🌇 The sun is setting! Take some time to reflect and relax.'],
      },
      {
        cronTime: '0 19 * * *',
        messages: async () => `Good evening! Reflect on this:\n\n${await fetchBibleVerse()}`,
      },
      {
        cronTime: '0 22 * * *',
        messages: ['🌙 Good night! Rest well and recharge for tomorrow.'],
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
    cron.schedule(`*/${config.autoRestart.time} * * * *`, () => {
      console.log('Start rebooting the system!');
      process.exit(1);
    });
  }
};
