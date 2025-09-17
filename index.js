const express = require("express");
const bodyParser = require("body-parser");
const { createCanvas } = require("@napi-rs/canvas");

const app = express();
app.use(bodyParser.json());

// Prosta plansza do kółko i krzyżyk
let board = Array(9).fill(null);

// Funkcja rysująca planszę
function drawBoard(message = "") {
  const size = 400;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Tło
  ctx.fillStyle = "#cce6ff"; // jasny niebieski
  ctx.fillRect(0, 0, size, size);

  // Linie
  ctx.strokeStyle = "#003366"; // ciemny niebieski
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(size / 3, 0);
  ctx.lineTo(size / 3, size);
  ctx.moveTo((size / 3) * 2, 0);
  ctx.lineTo((size / 3) * 2, size);
  ctx.moveTo(0, size / 3);
  ctx.lineTo(size, size / 3);
  ctx.moveTo(0, (size / 3) * 2);
  ctx.lineTo(size, (size / 3) * 2);
  ctx.stroke();

  // Pola
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  board.forEach((val, i) => {
    if (val) {
      const x = (i % 3) * (size / 3) + size / 6;
      const y = Math.floor(i / 3) * (size / 3) + size / 6;
      ctx.fillStyle = val === "X" ? "#001f4d" : "#3399ff";
      ctx.fillText(val, x, y);
    }
  });

  // Komunikat np. "BASED!"
  if (message) {
    ctx.fillStyle = "#ff0000";
    ctx.font = "bold 40px Arial";
    ctx.fillText(message, size / 2, size - 30);
  }

  return canvas.toBuffer("image/png");
}

// Funkcja sprawdzania zwycięzcy
function checkWinner() {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // poziome
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // pionowe
    [0, 4, 8], [2, 4, 6]             // przekątne
  ];

  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

// Endpoint: obrazek planszy
app.get("/api/image", (req, res) => {
  const winner = checkWinner();
  const message = winner ? "BASED!" : "";
  res.setHeader("Content-Type", "image/png");
  res.send(drawBoard(message));
});

// Endpoint: ruch lub nowa gra
app.post("/api/move", (req, res) => {
  const { buttonIndex } = req.body.untrustedData;

  if (buttonIndex >= 1 && buttonIndex <= 9) {
    const idx = buttonIndex - 1;
    if (!board[idx]) {
      board[idx] = "X"; // na start tylko X
    }
  }
  if (buttonIndex === 10) {
    board = Array(9).fill(null); // nowa gra
  }

  res.setHeader("Content-Type", "text/html");
  res.send(renderFrame());
});

// Endpoint: strona główna /ttt
app.get("/ttt", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(renderFrame());
});

// HTML Frame
function renderFrame() {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Kółko i Krzyżyk</title>
      <meta property="og:title" content="Kółko i Krzyżyk">
      <meta property="og:image" content="https://tic-tac-toe-j6il.vercel.app/api/image">
      <meta property="fc:frame" content="vNext">
      <meta property="fc:frame:image" content="https://tic-tac-toe-j6il.vercel.app/api/image">
      <meta property="fc:frame:post_url" content="https://tic-tac-toe-j6il.vercel.app/api/move">
      <meta property="fc:frame:button:1" content="Pole 1">
      <meta property="fc:frame:button:2" content="Pole 2">
      <meta property="fc:frame:button:3" content="Pole 3">
      <meta property="fc:frame:button:4" content="Pole 4">
      <meta property="fc:frame:button:5" content="Pole 5">
      <meta property="fc:frame:button:6" content="Pole 6">
      <meta property="fc:frame:button:7" content="Pole 7">
      <meta property="fc:frame:button:8" content="Pole 8">
      <meta property="fc:frame:button:9" content="Pole 9">
      <meta property="fc:frame:button:10" content="Nowa gra">
    </head>
    <body>
      <h1>Kółko i Krzyżyk</h1>
    </body>
  </html>
  `;
}

module.exports = app;
