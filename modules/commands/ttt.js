module.exports.config = {
  name: "ttt",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Mirai Team",
  description: "Play caro with AI or challenge another user",
  usePrefix: true,
  commandCategory: "game",
  cooldowns: 5,
  usages: "x/o/delete/continue @mention"
};

var AIMove;
const fs = require("fs");
const { loadImage, createCanvas } = require("canvas");

function startBoard({isX, data}) {
  data.board = new Array(3);
  data.isX = isX;
  data.gameOn = true;
  data.gameOver = false;
  data.available = [];
  for(var i = 0; i < 3; i++) data.board[i] = new Array(3).fill(0);
  return data;
}

async function displayBoard(data) {
  const path = __dirname + "/cache/ttt.png";
  let canvas = createCanvas(1200, 1200);
  let cc = canvas.getContext("2d");
  let background = await loadImage("https://i.postimg.cc/nhDWmj1h/background.png");
  cc.drawImage(background, 0, 0, 1200, 1200);
  var quanO = await loadImage("https://i.postimg.cc/rFP6xLXQ/O.png");
  var quanX = await loadImage("https://i.postimg.cc/HLbFqcJh/X.png");
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      var temp = data.board[i][j].toString();
      var x = 54 + 366*j;
      var y = 54 + 366*i;
      if (temp == "1") if (data.isX) { cc.drawImage(quanO, x, y, 360, 360) } else cc.drawImage(quanX, x, y, 360, 360);
      if (temp == "2") if (data.isX) { cc.drawImage(quanX, x, y, 360, 360) } else cc.drawImage(quanO, x, y, 360, 360);
    }
  }
  var ketqua = [];
  fs.writeFileSync(path, canvas.toBuffer("image/png"));
  ketqua.push(fs.createReadStream(path));
  return ketqua;
}

function checkAIWon(data) {
  if(data.board[0][0] == data.board[1][1] && data.board[0][0] == data.board[2][2] && data.board[0][0] == 1) return true;
  if(data.board[0][2] == data.board[1][1] && data.board[0][2] == data.board[2][0] && data.board[0][2] == 1) return true;   
  for(var i = 0; i < 3; ++i) {
    if(data.board[i][0] == data.board[i][1] && data.board[i][0] == data.board[i][2] && data.board[i][0] == 1) return true;
    if(data.board[0][i] == data.board[1][i] && data.board[0][i] == data.board[2][i] && data.board[0][i] == 1) return true;
  }
  return false;
}

function checkPlayerWon(data) {
  if(data.board[0][0] == data.board[1][1] && data.board[0][0] == data.board[2][2] && data.board[0][0] == 2) return true;
  if(data.board[0][2] == data.board[1][1] && data.board[0][2] == data.board[2][0] && data.board[0][2] == 2) return true;   
  for(var i = 0; i < 3; ++i) {
    if(data.board[i][0] == data.board[i][1] && data.board[i][0] == data.board[i][2] && data.board[i][0] == 2) return true;
    if(data.board[0][i] == data.board[1][i] && data.board[0][i] == data.board[2][i] && data.board[0][i] == 2) return true;
  }
  return false;
}

function solveAIMove({depth, turn, data}) {
  if (checkAIWon(data)) return +1;
  if (checkPlayerWon(data)) return -1;
  let availablePoint = getAvailable(data);
  if (availablePoint.length == 0) return 0;

  var min = Number.MAX_SAFE_INTEGER;
  var max = Number.MIN_SAFE_INTEGER;

  for (var i = 0, length = availablePoint.length; i < length; i++) {
    var point = availablePoint[i];
    if (turn == 1) {
      placeMove({point, player: 1, data});
      var currentScore = solveAIMove({depth: depth + 1, turn: 2, data});
      max = Math.max(currentScore, max);
      if (currentScore >= 0) {
        if (depth == 0) AIMove = point;
      }
      if (currentScore == 1) {
        data.board[point[0]][point[1]] = 0;
        break;
      }
       if(i == availablePoint.length - 1 && max < 0) {
        if(depth == 0) AIMove = point;
      }
    }
    else if (turn == 2) {
      placeMove({point, player: 2, data});
      var currentScore = solveAIMove({depth: depth + 1, turn: 1, data});
      min = Math.min(currentScore, min);
      if (min == -1) {
        data.board[point[0]][point[1]] = 0;
        break;
      }
    }
    data.board[point[0]][point[1]] = 0;
  }
  return turn == 1 ? max : min;
}

function placeMove({point, player, data}) {
  return data.board[point[0]][point[1]] = player;
}

function getAvailable(data) {
  let availableMove = []
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (data.board[i][j] == 0) availableMove.push([i, j]);
    }
  }
  return availableMove;
}

function checkAvailableSpot(point, pointArray) {
  if (pointArray.find(element => element.toString() == point.toString())) return true;
  else return false;
}

function move(x, y, data) {
  var availablePoint = getAvailable(data);
  var playerMove = [x, y];
  if (checkAvailableSpot(playerMove, availablePoint)) {
    placeMove({point: playerMove, player: data.currentPlayer == data.players[0] ? 1 : 2, data});
  } else return "This box is already checked!";
  solveAIMove({depth: 0, turn: 1, data});
}

function checkGameOver(data) {
  if (getAvailable(data).length == 0 || checkAIWon(data) || checkPlayerWon(data)) return true;
  return false;
}

function AIStart(data) {
  var point = [Math.round(Math.random()) * 2, Math.round(Math.random()) * 2];
  placeMove({point, player: 1, data});
}

module.exports.handleReply = async function({ event, api, handleReply }) {
  let { body, threadID, messageID, senderID } = event;
  if (!global.moduleData.tictactoe) global.moduleData.tictactoe = new Map();
  let data = global.moduleData.tictactoe.get(threadID);
  if (!data || !data.gameOn) return;

  if (senderID !== data.currentPlayer) {
    return api.sendMessage("It's not your turn!", threadID, messageID);
  }

  var number = parseInt(body);
  if (!isNaN(number) && number > 0 && number < 10) {
    var row = number < 4 ? 0 : number < 7 ? 1 : 2;
    var col = (number - 1) % 3;
    var temp = move(row, col, data);

    if (checkGameOver(data)) {
      var resultMessage = "";
      if (checkAIWon(data)) {
        resultMessage = `Player ${data.players[0]} (${data.isX ? "X" : "O"}) wins!`;
      } else if (checkPlayerWon(data)) {
        resultMessage = `Player ${data.players[1]} (${data.isX ? "O" : "X"}) wins!`;
      } else {
        resultMessage = "It's a tie!";
      }
      global.moduleData.tictactoe.delete(threadID);
      return api.sendMessage(resultMessage, threadID, messageID);
    }

    // Switch player turn
    data.currentPlayer = data.players[0] === senderID ? data.players[1] : data.players[0];

    var msg = temp === undefined ? "Reply with the number of the cell to mark" : temp;
    api.sendMessage({ body: msg, attachment: await displayBoard(data) }, threadID, (error, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        author: data.currentPlayer,
        messageID: info.messageID
      });
    }, messageID);
  } else {
    return api.sendMessage("Invalid cell number!", threadID, messageID);
  }
}

module.exports.run = async function ({ event, api, args }) {
  if (!global.moduleData.tictactoe) global.moduleData.tictactoe = new Map();
  let { threadID, messageID, senderID, mentions } = event;
  const threadSetting = global.data.threadData.get(threadID) || {};
  var prefix = threadSetting.PREFIX || global.config.PREFIX;
  let data = global.moduleData.tictactoe.get(threadID) || { "gameOn": false, "player": "" };
  let concak = "" + prefix + this.config.name;
  let newData;

  if (args.length == 0) return api.sendMessage("Please select X or O, or mention an opponent", threadID, messageID);

  if (args[0].toLowerCase() == "delete") {
    global.moduleData.tictactoe.delete(threadID);
    return api.sendMessage("Removed chessboard!", threadID, messageID);
  }

  if (args[0].toLowerCase() == "continue") {
    if (!data.gameOn) return api.sendMessage("No data! use " + concak + " x/o to play new", threadID, messageID);
    return api.sendMessage({ body: "Reply with the number of the cell to mark", attachment: await displayBoard(data) }, threadID, (error, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        author: senderID,
        messageID: info.messageID
      });
    }, messageID);
  }

  // Detect if a user is mentioned
  if (Object.keys(mentions).length > 0) {
    let opponentID = Object.keys(mentions)[0];
    if (!data.gameOn) {
      var abc = args[0].toLowerCase();
      if (abc !== "x" && abc !== "o") return api.sendMessage("Please select X or O", threadID, messageID);

      newData = startBoard({ isX: abc === "x", data, threadID });
      newData.players = [senderID, opponentID];
      newData.currentPlayer = senderID;  // The player who initiated the game

      api.sendMessage({ body: `Game started! ${abc.toUpperCase()} vs ${abc === "x" ? "O" : "X"}\n${mentions[opponentID].replace('@', '')}, you're up next!`, attachment: await displayBoard(newData) }, threadID, (error, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          author: senderID,
          messageID: info.messageID
        });
      }, messageID);
    } else {
      return api.sendMessage("A TicTacToe game is already in progress in this group.\nUse:\n" + concak + " continue -> to continue\n" + concak + " delete -> to erase the board", threadID, messageID);
    }

    global.moduleData.tictactoe.set(threadID, newData);
  }
};
