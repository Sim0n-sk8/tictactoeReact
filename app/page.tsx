"use client";

import { useState } from "react";

type Mode = "single" | "blitz" | "friend";
type Player = "X" | "O";
type SquareValue = Player | null;
type Difficulty = "Easy" | "Medium" | "Hard";

type Scores = { X: number; O: number; ties: number };

// ======== UTILS ========
function calculateWinner(squares: SquareValue[]): Player | null {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let [a,b,c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
  }
  return null;
}

function minimax(squares: SquareValue[], depth: number, isMax: boolean, ai: Player, human: Player): number {
  const winner = calculateWinner(squares);
  if(winner === ai) return 10 - depth;
  if(winner === human) return depth - 10;
  if(squares.every(Boolean)) return 0;

  if(isMax){
    let maxEval = -Infinity;
    for(let i=0;i<9;i++){
      if(!squares[i]){
        squares[i]=ai;
        let evalScore = minimax(squares, depth+1, false, ai, human);
        squares[i]=null;
        maxEval = Math.max(maxEval, evalScore);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for(let i=0;i<9;i++){
      if(!squares[i]){
        squares[i]=human;
        let evalScore = minimax(squares, depth+1, true, ai, human);
        squares[i]=null;
        minEval = Math.min(minEval, evalScore);
      }
    }
    return minEval;
  }
}

function bestMove(squares: SquareValue[], ai: Player, human: Player, difficulty: Difficulty): number {
  if(difficulty === "Easy"){
    const empties = squares.map((v,i)=>v===null?i:-1).filter(i=>i!==-1);
    return empties[Math.floor(Math.random()*empties.length)];
  }
  if(difficulty === "Medium"){
    if(Math.random()<0.5) return bestMove(squares, ai, human, "Hard");
    const empties = squares.map((v,i)=>v===null?i:-1).filter(i=>i!==-1);
    return empties[Math.floor(Math.random()*empties.length)];
  }
  // Hard = perfect
  let bestScore = -Infinity;
  let move = -1;
  for(let i=0;i<9;i++){
    if(!squares[i]){
      squares[i]=ai;
      const score = minimax(squares, 0, false, ai, human);
      squares[i]=null;
      if(score>bestScore){bestScore=score; move=i;}
    }
  }
  return move;
}

// ======== COMPONENTS ========
function Square({ value, onClick }: { value: SquareValue; onClick: ()=>void }) {
  const markClass = value==="X"?"xMark":value==="O"?"oMark":"";
  return <button className={`square ${markClass}`} onClick={onClick}><span>{value}</span></button>
}

function Board({ squares, onClick }: { squares: SquareValue[]; onClick: (i:number)=>void }) {
  return (
    <div className="boardWrapper">
      {[0,3,6].map(row=>(
        <div key={row} className="boardRow">
          {squares.slice(row,row+3).map((sq,i)=>(
            <Square key={row+i} value={sq} onClick={()=>onClick(row+i)} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ModeSelection({ onSelect, onSetDifficulty }: { onSelect: (mode: Mode)=>void; onSetDifficulty: (diff: Difficulty)=>void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  return (
    <div className="modeScreen">
      <h1>GRIDz</h1>
      <h2>Choose Mode & Difficulty</h2>
      <div className="difficultyButtons">
        {["Easy","Medium","Hard"].map(d=>(
          <button key={d} onClick={()=>setDifficulty(d as Difficulty)} className={difficulty===d?"selected":""}>{d}</button>
        ))}
      </div>
      <div className="modeButtons">
        <button onClick={()=>{onSetDifficulty(difficulty); onSelect("single");}}>Single vs AI</button>
        <button onClick={()=>{onSetDifficulty(difficulty); onSelect("blitz");}}>Blitz vs AI</button>
        <button onClick={()=>onSelect("friend")}>VS Friend</button>
      </div>
    </div>
  )
}

// ======== MAIN GAME ========
export default function Game() {
  const [mode, setMode] = useState<Mode|null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [scores, setScores] = useState<Scores>({X:0,O:0,ties:0});
  const [winner, setWinner] = useState<Player|"Tie"|null>(null);

  function resetBoard() {
    setSquares(Array(9).fill(null));
    setWinner(null);
  }

  function goHome() {
    setMode(null);
    resetBoard();
    setScores({X:0,O:0,ties:0});
  }

function handleClick(i: number) {
  if (squares[i] || winner) return;

  const nextSquares = squares.slice();

  // Player move
  nextSquares[i] = "X";

  // AI move immediately if mode is single or blitz
  if (mode !== "friend") {
    const ai: Player = "O";
    const human: Player = "X";
    const move = bestMove(nextSquares, ai, human, difficulty);

    if (move !== -1) nextSquares[move] = ai;
  }

  // Check for winner or tie after both moves
  const gameWinner = calculateWinner(nextSquares);
  const tie = !gameWinner && nextSquares.every(Boolean);

  if (gameWinner || tie) {
    const w = gameWinner ?? "Tie";
    setWinner(w);
    setScores(prev => ({
      X: prev.X + (w === "X" ? 1 : 0),
      O: prev.O + (w === "O" ? 1 : 0),
      ties: prev.ties + (w === "Tie" ? 1 : 0),
    }));
    if (mode === "blitz") setTimeout(resetBoard, 600);
  }

  setSquares(nextSquares);
}



  if(!mode) return <ModeSelection onSelect={setMode} onSetDifficulty={setDifficulty} />;

  return (
    <div className="game">
      {winner && (
        <div className="winnerOverlay" onClick={mode==="blitz"?undefined:resetBoard}>
          <h1>{winner==="Tie"?"TIE!":winner+" WINS!"}</h1>
        </div>
      )}
      <div className="gameBoard">
        <Board squares={squares} onClick={handleClick} />
      </div>
      <div className="gameInfo">
        <div className="scoreBoard">
          <p>X Wins: {scores.X}</p>
          <p>O Wins: {scores.O}</p>
          <p>Ties: {scores.ties}</p>
        </div>
        <div className="modeScreen">
          <button onClick={resetBoard} >Restart</button>
          <button onClick={goHome} >Home</button>
        </div>
      </div>
    </div>
  )
}