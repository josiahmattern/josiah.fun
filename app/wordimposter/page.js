"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

export default function WordImposter() {
  const [wordList, setWordList] = useState([]);
  const [wordsLoaded, setWordsLoaded] = useState(false);

  useEffect(() => {
    async function loadWords() {
      try {
        const res = await fetch("/words.txt");
        const text = await res.text();
        const lines = text.split(/\r?\n/).map((w) => w.trim()).filter(Boolean);
        setWordList(lines);
        setWordsLoaded(true);
      } catch (e) {
        console.error("Failed to load words:", e);
      }
    }
    loadWords();
  }, []);

  const [namesInput, setNamesInput] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem("wi:names")) || ""
  );
  const [imposterCountInput, setImposterCountInput] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem("wi:imps"));
      if (!Number.isNaN(saved) && saved >= 1) return saved;
    }
    return 1;
  });
  const [stealthImposters, setStealthImposters] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wi:stealth") === "1";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("wi:names", namesInput);
  }, [namesInput]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("wi:imps", String(imposterCountInput));
  }, [imposterCountInput]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("wi:stealth", stealthImposters ? "1" : "0");
  }, [stealthImposters]);

  const [players, setPlayers] = useState([]);
  const [secretWord, setSecretWord] = useState("");
  const [imposterWord, setImposterWord] = useState("");
  const [imposters, setImposters] = useState(new Set());
  const [firstPlayerIndex, setFirstPlayerIndex] = useState(-1);

  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [showImposters, setShowImposters] = useState(false);

  const [confirmingReveal, setConfirmingReveal] = useState(false);
  const confirmTimerRef = useRef(null);

  const parseNames = useCallback(() => {
    return namesInput.split(/[\n,]/).map((n) => n.trim()).filter(Boolean);
  }, [namesInput]);

  const canStart = useMemo(() => {
    const count = parseNames().length;
    return count >= 3 && wordsLoaded;
  }, [parseNames, wordsLoaded]);

  const chooseImposters = (nPlayers, k) => {
    const set = new Set();
    while (set.size < k) set.add(Math.floor(Math.random() * nPlayers));
    return set;
  };

  const startGame = useCallback(() => {
    const names = parseNames();
    if (names.length < 3) {
      alert("Need at least 3 players");
      return;
    }
    if (!wordsLoaded || wordList.length === 0) {
      alert("Word list not loaded yet — try again in a second.");
      return;
    }

    const word = wordList[Math.floor(Math.random() * wordList.length)];
    const maxImps = Math.max(1, Math.min(imposterCountInput || 1, names.length - 1));
    const impSet = chooseImposters(names.length, maxImps);

    let first = Math.floor(Math.random() * names.length);
    while (impSet.has(first)) first = Math.floor(Math.random() * names.length);

    let impWord = "";
    if (stealthImposters && maxImps > 0) {
      do {
        impWord = wordList[Math.floor(Math.random() * wordList.length)];
      } while (impWord === word && wordList.length > 1);
    }

    setPlayers(names);
    setSecretWord(word);
    setImposterWord(impWord);
    setImposters(impSet);
    setFirstPlayerIndex(first);
    setStarted(true);
    setI(0);
    setRevealed(false);
    setMessage("");
    setFinished(false);
    setShowImposters(false);
    setConfirmingReveal(false);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, [parseNames, wordList, wordsLoaded, imposterCountInput, stealthImposters]);

  const actuallyReveal = useCallback(() => {
    if (revealed) return;
    const isImp = imposters.has(i);
    if (isImp && !stealthImposters) {
      setMessage("IMPOSTER");
    } else if (isImp && stealthImposters) {
      setMessage(imposterWord || "IMPOSTER");
    } else {
      setMessage(secretWord);
    }
    setRevealed(true);
  }, [revealed, i, imposters, stealthImposters, imposterWord, secretWord]);

  const handleRevealPress = useCallback(() => {
    if (revealed) return;

    if (!confirmingReveal) {
      setConfirmingReveal(true);
      setMessage("Tap again to reveal");
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmingReveal(false);
        setMessage("");
        confirmTimerRef.current = null;
      }, 1500);
      return;
    }

    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = null;
    setConfirmingReveal(false);
    actuallyReveal();
  }, [confirmingReveal, revealed, actuallyReveal]);

  const nextPlayer = useCallback(() => {
    if (i + 1 >= players.length) {
      setFinished(true);
      return;
    }
    setI((prev) => prev + 1);
    setRevealed(false);
    setMessage("");
    setConfirmingReveal(false);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, [i, players.length]);

  const resetGame = useCallback(() => {
    setPlayers([]);
    setSecretWord("");
    setImposterWord("");
    setImposters(new Set());
    setFirstPlayerIndex(-1);
    setStarted(false);
    setI(0);
    setRevealed(false);
    setMessage("");
    setFinished(false);
    setShowImposters(false);
    setConfirmingReveal(false);
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, []);

  const imposterCount = imposters.size;

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6">
      <div className="w-full max-w-md">
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Word Imposter</h1>
          <p className="text-sm text-base-content/70 my-1">
            Play <span className="font-bold">2 to 3</span> rounds for a full game.
          </p>
        </header>

        {/* SETUP */}
        {!started && (
          <section className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text mb-2">Enter player names (comma or newline)</span>
              </label>
              <textarea
                rows={5}
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                className="textarea w-full"
                placeholder="e.g. Alex, Sam, Jamie…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Number of imposters</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={imposterCountInput}
                  onChange={(e) => setImposterCountInput(Math.max(1, Number(e.target.value) || 1))}
                  className="input input-bordered w-full"
                />
              </div>

              <button
                onClick={startGame}
                disabled={!canStart}
                className={`btn w-full sm:w-auto ${
                  canStart ? "btn-primary" : "btn-disabled"
                }`}
              >
                {wordsLoaded ? "Start" : "Loading words…"}
              </button>
            </div>

            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                checked={stealthImposters}
                onChange={(e) => setStealthImposters(e.target.checked)}
                className="checkbox checkbox-primary"
              />
              <span className="label-text">Stealth imposters (imposters also get a word)</span>
            </label>

          </section>
        )}

        {/* REVEAL PHASE */}
        {started && !finished && (
          <section className="space-y-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Double-tap the player to reveal</h2>
              <p className="text-sm text-base-content/70">
                {i + 1} / {players.length}
              </p>
            </div>

            <button
              onClick={handleRevealPress}
              className="btn btn-outline btn-lg w-full font-bold"
            >
              {players[i]}
            </button>

            <p
              className={`min-h-[2.25rem] text-center text-xl ${
                revealed
                  ? "font-semibold text-primary"
                  : confirmingReveal
                  ? "text-warning"
                  : "text-base-content/60"
              }`}
            >
              {revealed ? message : message || "—"}
            </p>

            <button
              onClick={nextPlayer}
              disabled={!revealed}
              className={`btn w-full ${revealed ? "btn-primary" : "btn-disabled"}`}
            >
              Next
            </button>
          </section>
        )}

        {/* POST-ROUND REVEAL */}
        {started && finished && (
          <section className="space-y-5">
            <div className="card border border-base-300 bg-base-200 p-4">
              <p>All players have been revealed.</p>
              <p>
                <span className="text-base-content/70">First player:</span>{" "}
                <strong>{players[firstPlayerIndex]}</strong>
              </p>
              <p className="text-sm text-base-content/60 mt-1">
                {imposterCount} imposter{imposterCount === 1 ? "" : "s"} hidden among you.
              </p>
            </div>

            {!showImposters ? (
              <button
                onClick={() => setShowImposters(true)}
                className="btn btn-primary w-full"
              >
                Reveal Imposter{imposterCount === 1 ? "" : "s"}
              </button>
            ) : (
              <div className="card border border-base-300 bg-base-200 p-4 text-left">
                <p className="font-medium mb-2">
                  The imposter{imposterCount === 1 ? " was" : "s were"}:
                </p>
                <ul className="space-y-1">
                  {Array.from(imposters).map((idx) => (
                    <li key={idx}>
                      <strong>{players[idx]}</strong> 🕵️‍♂️
                    </li>
                  ))}
                </ul>
                {stealthImposters && imposterWord && (
                  <p className="text-sm text-base-content/60 mt-3">
                    (Stealth mode: imposters saw “{imposterWord}”, civilians saw “{secretWord}”.)
                  </p>
                )}
              </div>
            )}

            <button onClick={resetGame} className="btn btn-outline w-full">
              Reset
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

