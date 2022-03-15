const http = require("http");
const express = require("express");
const socketio = require("socket.io");

// Server config
const PORT = 8080 || 5000;

// New express app
const app = express();

// Use static files
app.use(express.static(`${__dirname}/../client`));

// Create new http server
const server = http.createServer(app);

// Create socket wrapper
const io = socketio(server);

// Handle socket connections for players
let player1 = null;
let player2 = null;

const players = [null, null];
io.on("connection", (socket) => {
  let playerIndex = -1;
  for (const i in players) {
    if (players[i] == null) {
      playerIndex = i;
      break;
    }
  }

  // Ignore a player 3
  if (playerIndex === -1) return;

  // Assign client-side with playerId
  socket.emit("player-id", playerIndex);

  console.log(`Player ${playerIndex} has connected...`);
  
  // false if the player hasn't played their hand yet, otherwise true.
  players[playerIndex] = false; // Changed from null
  
  // Tell other players when a player connects
  socket.broadcast.emit("another-player-connected", playerIndex);

  // When player is ready
  socket.on("player-ready", (value) => {
    socket.broadcast.emit("enemy-ready", playerIndex); // Telling the other player they are ready
    players[playerIndex] = true; // Setting socket player to ready

    if (playerIndex == 0) {
      player1 = value;
    }
    else if (playerIndex == 1) {
      player2 = value;
    }

    if (players[0] == true && players[1] == true) {
      playGame();
    }
    
    console.log(players);
  });

  socket.on("restart-game", () => {
    for (const i in players) {
      players[i] = false;
    }

    player1 = null;
    player2 = null;

    //setInterval(() => { io.emit("restart-game") }, 3000);
    io.emit("restart-game");
  });

  // Disconnecting player
  socket.on("disconnect", () => {
    console.log(`Player ${playerIndex} disconnected...`);
    players[playerIndex] = null;
    
    player1 = null;
    player2 = null;

    // tell other players who disconnected
    socket.broadcast.emit("player-disconnected", playerIndex);
  });

  console.log(players);

  // Chat app
  socket.on("updateUsername", (username) => {
    socket.username = username;
    socket.emit("message", " has connected", socket.username);
  });
  
  // message
  socket.on("message", (content) => io.emit("message", content, socket.username));
});

// Error handling
server.on("error", () => { console.error(err) });

// Starting http server
server.listen(PORT, () => {
  console.log("server started on localhost:" + PORT);
});

function playGame() {
  let winner = null;

  if (player1 && player2) {
    if (player1 === "Rock") {
      if (player2 === "Scissors") winner = "player1";
      else if (player2 === "Paper") winner = "player2";
      else winner = "draw";
    }
    else if (player1 === "Paper") {
      if (player2 === "Rock") winner = "player1";
      else if (player2 === "Scissors") winner = "player2";
      else winner = "draw";
    }
    else if (player1 === "Scissors") {
      if (player2 === "Paper") winner = "player1";
      else if (player2 === "Rock") winner = "player2";
      else winner = "draw";
    }
  
    console.log("Winner is", winner);
    io.emit("game-result", winner);
  }
}