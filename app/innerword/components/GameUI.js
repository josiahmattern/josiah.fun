"use client";
import { useEffect, useRef } from "react";

export default function GameUI({
  myPlayerId,
  players,
  gameState, // { status, prompt, timer, usedWords }
  onSubmitGuess,
  onStartGame,
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-focus input when playing
  useEffect(() => {
    if (gameState.status === "playing") inputRef.current?.focus();
  }, [gameState.status, gameState.prompt]);

  // Auto-scroll sidebar
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [gameState.usedWords]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSubmitGuess(inputVal.trim().toLowerCase());
    setInputVal("");
  };

  const isHost = players.find((p) => p.id === myPlayerId)?.isHost;

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* --- LEFT: GAME AREA --- */}
      <div className="md:col-span-2 space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-primary">BOMB PARTY</h1>
          {gameState.status === "playing" && (
            <div
              className={`text-5xl font-mono font-black ${gameState.timer <= 3 ? "text-error animate-ping" : ""}`}
            >
              {gameState.timer}s
            </div>
          )}
        </header>

        {/* WAITING ROOM */}
        {gameState.status === "lobby" && (
          <div className="card bg-base-200 p-10 text-center shadow-lg border-2 border-base-300">
            <h2 className="text-2xl font-bold mb-2">Waiting for Players...</h2>
            <p className="opacity-60 mb-6">Share the code on the right!</p>
            {isHost ? (
              <button
                onClick={onStartGame}
                className="btn btn-primary btn-lg w-full"
              >
                Start Game
              </button>
            ) : (
              <div className="alert alert-info">
                Waiting for Host to start...
              </div>
            )}
          </div>
        )}

        {/* PLAYING AREA */}
        {gameState.status === "playing" && (
          <div className="space-y-6">
            <div className="card bg-neutral text-neutral-content py-12 items-center shadow-2xl border-b-8 border-primary">
              <span className="text-xs uppercase opacity-50 font-bold mb-2">
                Contains
              </span>
              <span className="text-7xl font-black uppercase tracking-widest">
                {gameState.prompt}
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                autoFocus
                className="input input-bordered input-lg w-full text-center text-3xl font-bold"
                placeholder="Type here..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
              />
            </form>
          </div>
        )}

        {/* GAME OVER */}
        {gameState.status === "gameover" && (
          <div className="card bg-error text-error-content p-8 text-center animate-bounce">
            <h2 className="text-6xl font-black mb-4">BOOM!</h2>
            {isHost && (
              <button onClick={onStartGame} className="btn btn-neutral btn-lg">
                Play Again
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- RIGHT: SIDEBAR --- */}
      <div className="md:col-span-1 flex flex-col h-[500px] bg-base-200 border border-base-300 rounded-box shadow-sm overflow-hidden">
        <div className="p-4 bg-base-300 font-bold text-center uppercase tracking-widest opacity-70">
          Players
        </div>

        {/* PLAYER LIST */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex justify-between p-3 bg-base-100 rounded-lg items-center"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${p.id === myPlayerId ? "bg-primary" : "bg-neutral"}`}
                ></div>
                <span className="font-bold">
                  {p.name} {p.id === myPlayerId && "(You)"}
                </span>
              </div>
              <span className="font-mono font-black">{p.score}</span>
            </div>
          ))}
        </div>

        {/* USED WORDS LOG (Replaces player list in game mode if desired, or sits below) */}
        <div className="p-4 bg-base-100 border-t border-base-300 h-1/3 flex flex-col">
          <span className="text-xs font-bold opacity-50 mb-2">HISTORY</span>
          <div ref={scrollRef} className="overflow-y-auto space-y-1">
            {gameState.usedWords.map((w, i) => (
              <div key={i} className="badge badge-outline mr-1 mb-1">
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to keep React happy with imports
import { useState } from "react";
