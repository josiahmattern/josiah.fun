"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function GameUI({
  myPlayerId,
  players,
  gameState,
  roomCode,
  onSubmitGuess,
  onStartGame,
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const currentPlayer = players.find((p) => p.id === gameState.currentPlayerId);
  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isHost = players.find((p) => p.id === myPlayerId)?.isHost;

  const alivePlayers = players.filter((p) => p.lives > 0);

  if (!gameState) return <div className="p-10 text-center">Loading...</div>;

  useEffect(() => {
    if (gameState.status === "playing" && isMyTurn) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [gameState.currentPlayerId, isMyTurn, gameState.status]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [gameState.usedWords]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || !isMyTurn) return;
    onSubmitGuess(inputVal.trim().toLowerCase());
    setInputVal("");
  };

  const renderLives = (count) => {
    const safeCount = Math.max(0, Math.min(count, 3));
    return (
      <div className="flex gap-0.5 justify-center mt-0.5">
        {[...Array(3)].map((_, i) => (
          <span
            key={i}
            className={`text-[8px] md:text-[10px] drop-shadow-sm ${
              i < safeCount ? "opacity-100" : "opacity-20 grayscale"
            }`}
          >
            ❤️
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 pb-6 h-[calc(100vh-2rem)]">
      <div className="lg:col-span-3 flex flex-col gap-4 h-full relative">
        <header className="flex justify-between items-center bg-base-100 p-4 rounded-2xl shadow-sm z-10 shrink-0">
          <h1 className="text-2xl font-black text-primary tracking-tighter">
            INNERWORD
          </h1>
          <div className="badge badge-lg badge-neutral font-mono p-4">
            <Link href="/" className="hover:text-primary transition-colors">
              BACK HOME
            </Link>
          </div>
        </header>

        {gameState.status === "lobby" && (
          <div className="flex-1 card bg-base-200 shadow-xl border-4 border-base-300 flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl font-black mb-2 opacity-80">
              WAITING ROOM
            </h2>
            <div className="text-lg opacity-60 mb-8 font-medium">
              Share the code{" "}
              <span className="text-primary font-bold">{roomCode}</span>
            </div>

            <div className="flex flex-wrap gap-8 justify-center mb-10">
              {players.map((p) => (
                <div key={p.id} className="text-center animate-pop">
                  <div
                    className={`font-bold text-xl ${
                      p.id === myPlayerId
                        ? "text-secondary scale-110"
                        : "text-base-content"
                    }`}
                  >
                    {p.name}
                  </div>
                </div>
              ))}
            </div>

            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={players.length < 2}
                className="btn btn-primary btn-lg px-12 shadow-xl hover:scale-105 transition-transform"
              >
                Start Game
              </button>
            ) : (
              <div className="flex items-center gap-2 text-info font-bold animate-pulse">
                <span className="loading loading-dots loading-sm"></span>
                Waiting for Host...
              </div>
            )}
          </div>
        )}

        {gameState.status === "playing" && (
          <div className="flex-1 relative bg-base-300/50 rounded-3xl border-4 border-base-300 shadow-inner overflow-hidden flex flex-col">
            <div className="text-center pt-6 z-20 shrink-0">
              {isMyTurn ? (
                <div className="text-2xl md:text-3xl font-black text-primary animate-pulse drop-shadow-sm">
                  YOUR TURN!
                </div>
              ) : (
                <div className="text-lg md:text-xl font-bold opacity-60">
                  Waiting for{" "}
                  <span className="text-base-content opacity-100">
                    {currentPlayer?.name}
                  </span>
                  ...
                </div>
              )}
            </div>

            <div className="flex-1 relative w-full h-full min-h-[400px]">
              {/* REMOVED CIRCLE: Now just the bomb and word floating */}
              <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10">
                <div
                  className={`text-5xl md:text-6xl mb-2 transition-transform ${
                    isMyTurn ? "animate-bounce" : ""
                  }`}
                >
                  💣
                </div>
                <div className="mb-8 text-3xl md:text-5xl font-black uppercase text-primary drop-shadow-md">
                  {gameState.prompt}
                </div>
              </div>

              {alivePlayers.map((p, index) => {
                const total = alivePlayers.length;
                const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
                const radius = 34;
                const x = 50 + radius * Math.cos(angle);
                const y = 44 + radius * Math.sin(angle);

                const isActive = p.id === gameState.currentPlayerId;
                const isMe = p.id === myPlayerId;

                return (
                  <div
                    key={p.id}
                    className="absolute flex flex-col items-center justify-center transition-all duration-500"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: isActive ? 20 : 5,
                    }}
                  >
                    <div
                      className={`flex flex-col items-center transition-all duration-300 ${
                        isActive
                          ? "scale-125 z-50 drop-shadow-md"
                          : "scale-100 opacity-70"
                      }`}
                    >
                      <span
                        className={`uppercase tracking-wide whitespace-nowrap ${
                          isActive
                            ? "font-black text-primary text-lg md:text-xl"
                            : isMe
                              ? "font-bold text-secondary text-base md:text-lg"
                              : "font-bold text-base-content text-sm md:text-base"
                        }`}
                      >
                        {p.name}
                      </span>
                      {renderLives(p.lives)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-30">
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg relative"
              >
                <input
                  ref={inputRef}
                  disabled={!isMyTurn}
                  className={`input input-lg w-full text-center text-xl font-bold shadow-2xl border-4 transition-all rounded-2xl ${
                    isMyTurn
                      ? "input-primary scale-105 border-primary bg-base-100"
                      : "input-disabled bg-base-200/50 border-transparent opacity-60"
                  }`}
                  placeholder={
                    isMyTurn ? "TYPE HERE!" : "Wait for your turn..."
                  }
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  autoComplete="off"
                />
              </form>
            </div>
          </div>
        )}

        {gameState.status === "gameover" && (
          <div className="flex-1 card bg-neutral text-neutral-content shadow-2xl flex flex-col items-center justify-center p-10 animate-fade-in">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-6xl font-black mb-2 text-warning">WINNER</h2>
            <div className="text-4xl font-bold mb-8">
              {players.find((p) => p.lives > 0)?.name || "NOBODY"}
            </div>
            {isHost && (
              <button
                onClick={onStartGame}
                className="btn btn-primary btn-lg px-12"
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-1 flex flex-col h-full bg-base-200/50 rounded-2xl border-2 border-base-200 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 border-b border-base-300">
          <div className="text-xs font-bold opacity-50 uppercase tracking-widest mb-3 flex justify-between">
            <span>Graveyard 🪦</span>
            <span>{players.filter((p) => p.lives <= 0).length} Dead</span>
          </div>

          <div className="overflow-y-auto space-y-2 pr-1">
            {players.filter((p) => p.lives <= 0).length === 0 ? (
              <div className="text-center opacity-30 text-sm py-4 italic">
                No casualties yet...
              </div>
            ) : (
              players
                .filter((p) => p.lives <= 0)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2 bg-base-100 rounded-lg opacity-50 grayscale"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-bold text-xs">
                      💀
                    </div>
                    <span className="font-bold line-through">{p.name}</span>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="h-1/2 flex flex-col p-4 bg-base-100">
          <div className="text-xs font-bold opacity-50 uppercase tracking-widest mb-3">
            Used Words ({gameState.usedWords.length})
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto flex flex-wrap gap-2 content-start pr-1"
          >
            {gameState.usedWords.map((w, i) => (
              <span
                key={i}
                className="badge badge-neutral badge-outline font-mono"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-pop {
          animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
