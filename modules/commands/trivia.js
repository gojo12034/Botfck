const axios = require('axios');

module.exports.config = {
  name: "trivia",
  version: "1.0",
  hasPermission: 0,
  credits: "RICKCIEL",
  usePrefix: true,
  description: "Answer using a, b, c, or d.",
  commandCategory: "Fun",
  cooldowns: 10,
};

const triviaSessions = {}; 

module.exports.run = async ({ api, event }) => {
  const { threadID } = event;

  if (triviaSessions[threadID] && !triviaSessions[threadID].answered) {
    const designMessage = "There is an active trivia question. Please answer the previous question before starting a new one.";
    api.sendMessage(designMessage, threadID);
    return;
  }

  try {
    const sessionID = `${threadID}_${Date.now()}`;
    const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
    const question = response.data.results[0];

    const options = [question.correct_answer, ...question.incorrect_answers].sort(() => Math.random() - 0.5);
    const optionsString = options.map((option, index) => `${String.fromCharCode(97 + index)}) ${option}`).join('\n');

    const questionMessage = `🎯Trivia Question🎯:\n\n${question.question}\n\n${optionsString}`;
    api.sendMessage(questionMessage, threadID);

    const correctIndex = options.indexOf(question.correct_answer);
    triviaSessions[sessionID] = { correctIndex, answered: false };

    
    setTimeout(() => {
      if (!triviaSessions[sessionID].answered) {
        api.sendMessage(`Time's up! The correct answer is: ${options[correctIndex]}⌛`, threadID);
        delete triviaSessions[sessionID];
      }
    }, 60000); //60s

    
    const answerRegex = /^[a-d]$/;
    const listener = ({ body }) => {
      if (body && answerRegex.test(body.toLowerCase()) && !triviaSessions[sessionID].answered) {
        const userAnswer = body.toLowerCase();
        if (userAnswer === String.fromCharCode(97 + correctIndex)) {
          api.sendMessage(`Correct! The answer is: ${options[correctIndex]}🎉`, threadID);
        } else {
          api.sendMessage(`Baka!, the correct answer is: ${options[correctIndex]}😞`, threadID);
        }
        triviaSessions[sessionID].answered = true;
      }
    };

    
    api.listenMqtt((_, message) => listener(message));
  } catch (error) {
    console.error("Error fetching trivia question:", error);
    api.sendMessage("An error occurred while fetching the trivia question.", threadID);
  }
};
