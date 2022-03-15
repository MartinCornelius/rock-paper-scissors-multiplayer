let playerID = 0;
let playerReady = false;
let enemyReady = false;
let bothPlayersDone = false;

let winnerMessage = document.querySelector("#winner-message");
let displayMessage = document.querySelector("#display-message");
let rock = document.querySelector("#btnRock");
let paper = document.querySelector("#btnPaper");
let scissors = document.querySelector("#btnScissors");

const socket = io();

// Adding event listener for the player
rock.addEventListener("click", onBtnClick);
paper.addEventListener("click", onBtnClick);
scissors.addEventListener("click", onBtnClick);

// Retrieve client id from server
socket.on("player-id", (id) => {
  if (id === -1) {
    displayMessage.textContent = "Sorry, the server is full";
  }
  else {
    playerID = parseInt(id);
    console.log("Client-id: " + playerID);
  }
});

// When other players connect
socket.on("another-player-connected", (id) => {
  console.log("Another player joined: Player " + id);
  restartGame();
});

// When other player disconnect
socket.on("player-disconnected", (id) => {
  console.log(`A player disconnected Player ${id}`);
});

// When enemy is ready
socket.on("enemy-ready", (id) => {
  enemyReady = true;
  if (!playerReady) {
    displayMessage.textContent = "Other player is waiting for you to play";
  }
});

// Result
socket.on("game-result", (winner) => {
  let message = "";
  if (winner === "player1" && playerID === 0 || winner === "player2" && playerID === 1) {
    message = "you won!";
  }
  else if (winner === "player1" && playerID === 1 || winner === "player2" && playerID === 0) {
    message = "you lost!";
  }
  else {
    message = "draw";
  }

  displayMessage.textContent = "";
  winnerMessage.textContent = message;

  socket.emit("restart-game");
});

// Restart game
socket.on("restart-game", restartGame);

// When selected a play option
function onBtnClick(event) {
  event.preventDefault();

  playerReady = true;
  socket.emit("player-ready", event.target.innerHTML);

  // Disable when clicked
  rock.disabled = true;
  paper.disabled = true;
  scissors.disabled = true;

  // Change text on client side
  const text = document.querySelector("#display-message");
  text.textContent = "waiting for opponent to play";
}

function restartGame() {
  displayMessage.textContent = "choose a play";
  rock.disabled = false;
  paper.disabled = false;
  scissors.disabled = false;

  playerReady = false;
  enemyReady = false;
}

// Adding message
const addMessage = (messageContent, user) => {
  const messages = document.querySelector("#messages");
  const newMessage = document.createElement("li");
  newMessage.innerHTML = user + ": " + messageContent;

  messages.appendChild(newMessage);
  messages.scrollTop = messages.scrollHeight;
}

// Sending message
const onChatSubmitted = (sock) => (event) => {
  event.preventDefault();

  const input = document.querySelector("#chat");
  const text = input.value;
  input.value = "";

  sock.emit("message", text);
}

// Prompt for username
let username = prompt("Enter your username");
socket.emit("updateUsername", username);

console.log(socket.username);

socket.on("message", addMessage);

document
  .querySelector("#chat-form")
  .addEventListener("submit", onChatSubmitted(socket));