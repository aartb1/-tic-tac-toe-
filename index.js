const express = require("express");
const bodyParser = require("body-parser");
const { createCanvas } = require("canvas");

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));

function frameHTML({ title, imageUrl, postUrl, buttons, state }) {
  const s = state ? JSON.stringify(state) : undefined;
  return `<!doctype html>
<html>
<head>
  <meta property="og:title" content="${title}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:post_url" content="${postUrl}" />
  ${buttons.map((b,i)=>`<meta property="fc:frame:button:${i+1}" content="${b}" />`).join("\n  ")}
  ${s ? `<meta property="fc:frame:state" content='${s}' />` : ""}
</head>
<body><h1>${title}</h1></body>
</html>`;
}

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a]===board[b] && board[a]===board[c]) return board[a];
  }
  if (board.every(c=>c!=="")) return "remis";
  return null;
}

function drawBoard(board, winner) {
  const size = 600;
  const cell = size / 3;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  for (let y=0; y<3; y++) {
    for (let x=0; x<3; x++) {
      const i = y*3+x;
      ctx.fillStyle = (x+y)%2===0 ? "#a7c7e7" : "#4a90e2";
      ctx.fillRect(x*cell, y*cell, cell, cell);

      ctx.fillStyle = "#000";
      ctx.font = "bold
