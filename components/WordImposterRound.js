"use client";
import { useEffect, useState } from "react";

/**
 * Props:
 * - players: string[]            // all player names
 * - imposters: string[]          // subset of players who are imposters
 * - roundSeconds?: number        // countdown length (default 60)
 */
export default function GameRound({
  players = [],
  imposters = [],
  roundSeconds = 60,
}) {
  const [timeLeft, setTimeLeft] = useState(roundSeconds);
  const [canReveal, setCanReveal] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanReveal(true);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  return (
    <div className="mx-auto max-w-xl p-6 rounded-2xl border border-neutral-200">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Round Timer</h2>
        <span
          className={`text-sm px-2.5 py-1 rounded-full ${
            timeLeft > 0 ? "bg-neutral-100" : "bg-green-100"
          }`}
        >
          {timeLeft > 0 ? `${timeLeft}s left` : "Time’s up!"}
        </span>
      </header>

      <div className="mb-4">
        <p className="text-sm text-neutral-600">Players:</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {players.map((p) => (
            <li
              key={p}
              className="text-sm px-2 py-1 rounded-md bg-neutral-100"
            >
              {p}
            </li>
          ))}
        </ul>
      </div>

      {canReveal && !revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 border border-neutral-300 hover:border-neutral-400 active:scale-[0.99] transition"
        >
          Reveal imposters
        </button>
      )}

      {revealed && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-1">
            Imposter{imposters.length !== 1 ? "s" : ""}:
          </h3>
          {imposters.length > 0 ? (
            <ul className="list-disc ml-5">
              {imposters.map((name) => (
                <li key={name} className="text-base">
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base">None (plot twist 😳)</p>
          )}
        </div>
      )}
    </div>
  );
}
