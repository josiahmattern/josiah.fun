"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

export default function WordImposter() {
  // Load words from /public/words.txt
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

  // Inputs (persisted)
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

  // Game state
  const [players, setPlayers] = useState([]);
  const [secretWord, setSecretWord] = useState("");
  const [imposterWord, setImposterWord] = useState(""); // used only in stealth mode
  const [imposters, setImposters] = useState(new Set());
  const [firstPlayerIndex, setFirstPlayerIndex] = useState(-1);

  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [showImposters, setShowImposters] = useState(false);

  // Double-tap reveal state
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

    // First player not an imposter
    let first = Math.floor(Math.random() * names.length);
    while (impSet.has(first)) first = Math.floor(Math.random() * names.length);

    // If stealth mode, pick an imposter word different from the civilian one
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
      setMessage(imposterWord || "IMPOSTER"); // safety fallback
    } else {
      setMessage(secretWord);
    }
    setRevealed(true);
  }, [revealed, i, imposters, stealthImposters, imposterWord, secretWord]);

  // Double-tap handler
  const handleRevealPress = useCallback(() => {
    if (revealed) return;

    // First tap -> arm
    if (!confirmingReveal) {
      setConfirmingReveal(true);
      setMessage("Tap again to reveal");
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
      confirmTimerRef.current = setTimeout(() => {
        setConfirmingReveal(false);
        setMessage("");
        confirmTimerRef.current = null;
      }, 1500);
      return;
    }

    // Second tap within window -> reveal
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
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

  const revealImposters = useCallback(() => setShowImposters(true), []);

  const imposterCount = imposters.size;

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-6">
      <div className="w-full max-w-md">
        <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Word Imposter</h1>
          <p className="text-sm text-neutral-500 my-1">
            Play <span className="font-bold"> 2 to 3</span> rounds for a full game.
          </p>
        </header>

        {/* SETUP */}
        {!started && (
          <section className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter player names (comma or newline)</label>
              <textarea
                rows={5}
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 text-base outline-none focus:ring-2 focus:ring-black/10"
                placeholder="e.g. Alex, Sam, Jamie…"
                inputMode="text"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of imposters</label>
                <input
                  type="number"
                  min={1}
                  value={imposterCountInput}
                  onChange={(e) => setImposterCountInput(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-xl border border-neutral-300 p-3 text-base outline-none focus:ring-2 focus:ring-black/10"
                  inputMode="numeric"
                />
              </div>

              <button
                onClick={startGame}
                disabled={!canStart}
                className={`rounded-xl px-4 py-3 text-base font-semibold transition w-full sm:w-auto ${
                  canStart ? "bg-black text-white active:scale-[0.98]" : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {wordsLoaded ? "Start" : "Loading words…"}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={stealthImposters}
                onChange={(e) => setStealthImposters(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <span>Stealth imposters (imposters also get a word)</span>
            </label>

            <p className="text-xs text-neutral-500">Need at least 3 players.</p>
          </section>
        )}

        {/* REVEAL PHASE */}
        {started && !finished && (
          <section className="space-y-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Double-tap the player to reveal</h2>
              <p className="text-sm text-neutral-500">
                {i + 1} / {players.length}
              </p>
            </div>

            <button
              onClick={handleRevealPress}
              className="w-full rounded-2xl border border-neutral-300 p-5 text-2xl font-bold active:scale-[0.98]"
            >
              {players[i]}
            </button>

            <p
              className={`min-h-[2.25rem] text-center text-xl ${
                revealed ? "font-semibold" : confirmingReveal ? "text-amber-600" : "text-neutral-400"
              }`}
            >
              {revealed ? message : message || "—"}
            </p>

            <button
              onClick={nextPlayer}
              disabled={!revealed}
              className={`w-full rounded-xl px-4 py-3 text-base font-semibold transition ${
                revealed ? "bg-black text-white active:scale-[0.98]" : "bg-neutral-200 text-neutral-500"
              }`}
            >
              Next
            </button>
          </section>
        )}

        {/* POST-ROUND REVEAL */}
        {started && finished && (
          <section className="space-y-5">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <p className="text-base">All players have been revealed.</p>
              <p className="text-base">
                <span className="text-neutral-500">First player:</span>{" "}
                <strong>{players[firstPlayerIndex]}</strong>
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {imposterCount} imposter{imposterCount === 1 ? "" : "s"} hidden among you.
              </p>
            </div>

            {!showImposters ? (
              <button
                onClick={() => setShowImposters(true)}
                className="w-full rounded-xl bg-black text-white px-4 py-3 text-base font-semibold active:scale-[0.98]"
              >
                Reveal Imposter{imposterCount === 1 ? "" : "s"}
              </button>
            ) : (
              <div className="rounded-2xl border border-neutral-200 p-4 text-left">
                <p className="text-base font-medium mb-2">
                  The imposter{imposterCount === 1 ? " was" : "s were"}:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {Array.from(imposters).map((idx) => (
                    <li key={idx}>
                      <strong>{players[idx]}</strong> 🕵️‍♂️
                    </li>
                  ))}
                </ul>
                {stealthImposters && imposterWord && (
                  <p className="text-sm text-neutral-500 mt-3">
                    (Stealth mode: imposters saw “{imposterWord}”, civilians saw “{secretWord}”.)
                  </p>
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
      </div>
    </div>
  );
}

