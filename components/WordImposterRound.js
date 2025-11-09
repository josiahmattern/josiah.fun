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
    <div className="mx-auto max-w-xl p-6 rounded-2xl border border-base-300 bg-base-200 text-base-content">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Round Timer</h2>
        <span
          className={`badge ${
            timeLeft > 0 ? "badge-neutral" : "badge-success"
          }`}
        >
          {timeLeft > 0 ? `${timeLeft}s left` : "Time’s up!"}
        </span>
      </header>

      <div className="mb-4">
        <p className="text-sm text-base-content/70">Players:</p>
        <ul className="mt-1 flex flex-wrap gap-2">
          {players.map((p) => (
            <li key={p} className="badge badge-outline">
              {p}
            </li>
          ))}
        </ul>
      </div>

      {canReveal && !revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="btn btn-primary mt-3 w-full sm:w-auto"
        >
          Reveal imposters
        </button>
      )}

      {revealed && (
        <div className="mt-5">
          <h3 className="text-sm font-medium text-base-content/80 mb-2">
            Imposter{imposters.length !== 1 ? "s" : ""}:
          </h3>
          {imposters.length > 0 ? (
            <ul className="list-disc ml-5 space-y-1">
              {imposters.map((name) => (
                <li key={name} className="text-base">
                  <span className="font-semibold text-error">{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base italic text-base-content/70">
              None (plot twist 😳)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

