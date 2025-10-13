"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export default function WordImposter() {
  const words = useMemo(() => ["apple", "moon", "bridge", "river", "storm"], []);

  const [namesInput, setNamesInput] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("wi:names")) || ""
  );
  const [roundSecondsInput, setRoundSecondsInput] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem("wi:secs"));
      if (!Number.isNaN(saved) && saved >= 5) return saved;
    }
    return 60;
  });

  const [players, setPlayers] = useState([]);
  const [secretWord, setSecretWord] = useState("");
  const [imposterIndex, setImposterIndex] = useState(-1);
  const [firstPlayerIndex, setFirstPlayerIndex] = useState(-1);

  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [showImposters, setShowImposters] = useState(false);

  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("wi:names", namesInput);
  }, [namesInput]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("wi:secs", String(roundSecondsInput));
  }, [roundSecondsInput]);

  const parseNames = useCallback(() => {
    return namesInput
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);
  }, [namesInput]);

  const canStart = useMemo(() => parseNames().length >= 3, [parseNames]);

  const startGame = useCallback(() => {
    const names = parseNames();
    if (names.length < 3) {
      alert("Need at least 3 players");
      return;
    }

    const secs = Math.max(5, Number(roundSecondsInput) || 60);

    const word = words[Math.floor(Math.random() * words.length)];
    const imp = Math.floor(Math.random() * names.length);

    let first = Math.floor(Math.random() * names.length);
    while (first === imp) first = Math.floor(Math.random() * names.length);

    setPlayers(names);
    setSecretWord(word);
    setImposterIndex(imp);
    setFirstPlayerIndex(first);

    setStarted(true);
    setI(0);
    setRevealed(false);
    setMessage("");
    setFinished(false);
    setShowImposters(false);

    setRemaining(secs);
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [parseNames, roundSecondsInput, words]);

  const reveal = useCallback(() => {
    if (revealed) return;
    setMessage(i === imposterIndex ? "IMPOSTER" : secretWord);
    setRevealed(true);
  }, [revealed, i, imposterIndex, secretWord]);

  const nextPlayer = useCallback(() => {
    if (i + 1 >= players.length) {
      setFinished(true);
      return;
    }
    setI((prev) => prev + 1);
    setRevealed(false);
    setMessage("");
  }, [i, players.length]);

  const resetGame = useCallback(() => {
    setPlayers([]);
    setSecretWord("");
    setImposterIndex(-1);
    setFirstPlayerIndex(-1);
    setStarted(false);
    setI(0);
    setRevealed(false);
    setMessage("");
    setFinished(false);
    setShowImposters(false);

    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setRemaining(0);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRunning) return;

    let secs = paused ? remaining : Math.max(5, Number(roundSecondsInput) || 60);
    setRemaining(secs);
    setTimerRunning(true);
    setPaused(false);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimerRunning(false);
          setPaused(false);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try {
              navigator.vibrate?.(200);
            } catch {}
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, [roundSecondsInput, paused, remaining, timerRunning]);

  const pauseTimer = useCallback(() => {
    if (!timerRunning) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
    setPaused(true);
  }, [timerRunning]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
    setPaused(false);
    setRemaining(0);
  }, []);

  const revealImposters = useCallback(() => setShowImposters(true), []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6">
      <div className="w-full max-w-md">
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Word Imposter</h1>
          <p className="text-sm text-neutral-500">quick, clean, mobile-first</p>
        </header>

        {!started && (
          <section className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter names (comma or newline)</label>
              <textarea
                rows={5}
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 text-base outline-none focus:ring-2 focus:ring-black/10"
                placeholder="e.g. Alex, Sam, Jamie…"
                inputMode="text"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Round timer (seconds)</label>
                <input
                  type="number"
                  min={5}
                  value={roundSecondsInput}
                  onChange={(e) => setRoundSecondsInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-300 p-3 text-base outline-none focus:ring-2 focus:ring-black/10"
                  inputMode="numeric"
                />
              </div>
              <button
                onClick={startGame}
                disabled={!canStart}
                className={`rounded-xl px-4 py-3 text-base font-semibold transition w-full sm:w-auto ${
                  canStart
                    ? "bg-black text-white active:scale-[0.98]"
                    : "bg-neutral-200 text-neutral-500"
                }`}
                aria-disabled={!canStart}
              >
                Start
              </button>
            </div>
            <p className="text-xs text-neutral-500">Need at least 3 players.</p>
          </section>
        )}

        {started && !finished && (
          <section className="space-y-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Tap the player to reveal</h2>
              <p className="text-sm text-neutral-500">
                {i + 1} / {players.length}
              </p>
            </div>

            <button
              onClick={reveal}
              className="w-full rounded-2xl border border-neutral-300 p-5 text-2xl font-bold active:scale-[0.98]"
            >
              {players[i]}
            </button>

            <p
              className={`min-h-[2.25rem] text-center text-xl ${
                revealed ? "font-semibold" : "text-neutral-400"
              }`}
              aria-live="polite"
            >
              {revealed ? message : "—"}
            </p>

            <button
              onClick={nextPlayer}
              disabled={!revealed}
              className={`w-full rounded-xl px-4 py-3 text-base font-semibold transition ${
                revealed
                  ? "bg-black text-white active:scale-[0.98]"
                  : "bg-neutral-200 text-neutral-500"
              }`}
            >
              Next
            </button>
          </section>
        )}

        {started && finished && (
          <section className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <p className="text-base">All players have been revealed.</p>
              <p className="text-base">
                <span className="text-neutral-500">First player:</span>{" "}
                <strong>{players[firstPlayerIndex]}</strong>
              </p>
            </div>

{/* INITIAL START (only before the first start) */}
{!timerRunning && !paused && remaining > 0 && (
  <button
    onClick={startTimer}
    className="w-full rounded-xl bg-black text-white px-4 py-3 text-base font-semibold active:scale-[0.98]"
  >
    Start Timer ({formatTime(remaining)})
  </button>
)}

{/* TIMER CARD — stays visible when running OR paused */}
{(timerRunning || paused) && (
  <div className="rounded-2xl border border-neutral-200 p-4 text-center">
    <p className="text-sm text-neutral-500">
      {paused ? "Paused" : "Time remaining"}
    </p>
    <p className="text-4xl font-bold tracking-tight">{formatTime(remaining)}</p>

    <div className="flex gap-3 mt-3">
      {paused ? (
        <button
          onClick={startTimer} // resume
          className="flex-1 rounded-xl bg-black text-white px-4 py-3 text-base font-semibold active:scale-[0.98]"
        >
          Resume
        </button>
      ) : (
        <button
          onClick={pauseTimer}
          className="flex-1 rounded-xl bg-neutral-100 px-4 py-3 text-base font-semibold active:scale-[0.98]"
        >
          Pause
        </button>
      )}

      <button
        onClick={stopTimer}
        className="flex-1 rounded-xl bg-neutral-100 px-4 py-3 text-base font-semibold active:scale-[0.98]"
      >
        Stop
      </button>
    </div>
  </div>
)}

{/* TIME'S UP */}
{!timerRunning && !paused && remaining <= 0 && (
  <div className="space-y-3 text-center">
    <p className="text-lg font-semibold">⏰ Time up! Vote!</p>
    {!showImposters ? (
      <button
        onClick={revealImposters}
        className="w-full rounded-xl bg-black text-white px-4 py-3 text-base font-semibold active:scale-[0.98]"
      >
        Reveal Imposter
      </button>
    ) : (
      <div className="rounded-2xl border border-neutral-200 p-4">
        <p className="text-base">
          The imposter was: <strong>{players[imposterIndex]}</strong> 🕵️‍♂️
        </p>
      </div>
    )}
  </div>
)}

            <button
              onClick={resetGame}
              className="w-full rounded-xl bg-neutral-100 px-4 py-3 text-base font-semibold active:scale-[0.98]"
            >
              Reset
            </button>
          </section>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
