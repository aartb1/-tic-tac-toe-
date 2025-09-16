// Farcaster Frame: Kółko i Krzyżyk z BASED! + "Nowa gra"
// Działa na Vercel (serverless) dzięki @napi-rs/canvas

const express = require("express");
const bodyParser = require("body-parser");
const { createCanvas } = require("@napi-rs/canvas");

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
  const size = 1200;            // 1200x630 to dobry wymiar do podglądu linków
  const height = 630;
  const gridSize = height;      // plansza kwadratowa po lewej
  const cell = gridSize / 3;
  const canvas = createCanvas(size, height);
  const ctx = canvas.getContext("2d");

  // tło
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 0, size, height);

  // plansza 3x3 w odcieniach niebieskiego
  for (let y=0; y<3; y++) {
    for (let x=0; x<3; x++) {
      const i = y*3+x;
      ctx.fillStyle = (x+y)%2===0 ? "#a7c7e7" : "#4a90e2"; // jasny/ciemny
      ctx.fillRect(x*cell, y*cell, cell, cell);

      const v = board[i] || (i+1).toString();
      ctx.fillStyle = "#001220";
      ctx.font = "bold 120px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(v==="X"?"❌":v==="O"?"⭕":v, x*cell+cell/2, y*cell+cell/2);
    }
  }

  // podpis po prawej
  ctx.fillStyle = "#e0f0ff";
  ctx.font = "bold 64px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Kółko i Krzyżyk", gridSize + 40, 40);

  // overlay po zakończeniu
  if (winner) {
    ctx.fillStyle = "rgba(0,0,40,0.7)";
    ctx.fillRect(0, 0, gridSize, gridSize);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 120px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText("BASED!", gridSize/2, gridSize/2 - 80);

    ctx.font = "bold 72px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.fillText(winner==="remis" ? "REMIS" : `Wygrał ${winner}`, gridSize/2, gridSize/2 + 40);
  }

  return canvas.toBuffer("image/png");
}

// PNG z aktualnym stanem
app.get("/ttt/image",(req,res)=>{
  let board=[];
  try { board=JSON.parse(String(req.query.board||"[]")); } catch {}
  const winner = req.query.winner ? String(req.query.winner) : null;
  const img = drawBoard(board, winner);
  res.set("Content-Type","image/png").send(img);
});

// Wejście do Frame'a
app.get("/ttt", (_req,res)=>{
  const base = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
  const board = Array(9).fill("");
  const state = { board, turn:"X" };
  const html = frameHTML({
    title:"Kółko i Krzyżyk",
    imageUrl:`${base}/ttt/image?board=${encodeURIComponent(JSON.stringify(board))}`,
    postUrl:`${base}/ttt/action`,
    buttons:["1","2","3","4","5","6","7","8","9","Nowa gra"],
    state
  });
  res.type("text/html").send(html);
});

// Ruchy / reset
app.post("/ttt/action",(req,res)=>{
  const raw = req.body || {};
  let untrusted={};
  try {
    if(typeof raw.untrustedData==="string") untrusted=JSON.parse(raw.untrustedData);
    else if(raw.untrustedData) untrusted=raw.untrustedData;
    else untrusted=raw;
  } catch { untrusted=raw; }

  let state={board:Array(9).fill(""),turn:"X"};
  try { if(untrusted.state) state=JSON.parse(untrusted.state);} catch {}

  const base=process.env.PUBLIC_BASE_URL||`http://localhost:${port}`;
  const btn = Number(untrusted.buttonIndex||1);

  // 10-ty przycisk = "Nowa gra"
  if (btn === 10) {
    state={board:Array(9).fill(""),turn:"X"};
  } else {
    let winner = checkWinner(state.board);
    if (!winner) {
      const move = btn-1;
      if(state.board[move]===""){
        state.board[move]=state.turn;
        state.turn=state.turn==="X"?"O":"X";
      }
      winner = checkWinner(state.board);
      const html=frameHTML({
        title:"Kółko i Krzyżyk",
        imageUrl:`${base}/ttt/image?board=${encodeURIComponent(JSON.stringify(state.board))}&winner=${winner||""}`,
        postUrl:`${base}/ttt/action`,
        buttons: winner ? ["Nowa gra"] : ["1","2","3","4","5","6","7","8","9","Nowa gra"],
        state
      });
      return res.type("text/html").send(html);
    }
  }

  // odświeżona plansza (po ruchu lub resecie)
  const html=frameHTML({
    title:"Kółko i Krzyżyk",
    imageUrl:`${base}/ttt/image?board=${encodeURIComponent(JSON.stringify(state.board))}`,
    postUrl:`${base}/ttt/action`,
    buttons:["1","2","3","4","5","6","7","8","9","Nowa gra"],
    state
  });
  res.type("text/html").send(html);
});

app.listen(port,()=>console.log(`TicTacToe Frame running on :${port}`));
