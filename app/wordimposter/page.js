"use client";
import { useState, useRef, useEffect } from "react";

export default function WordImposter() {
  const words = ["apple", "moon", "bridge", "river", "storm"];

  const [namesInput, setNamesInput] = useState("");
  const [roundSecondsInput, setRoundSecondsInput] = useState(60);

  const [players, setPlayers] = useState([]);
  const [secretWord, setSecretWord] = useState("");
  const [imposterIndex, setImposterIndex] = useState(-1);
  const [firstPlayerIndex, setFirstPlayerIndex] = useState(-1);

  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0); // current player index
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [showImposters, setShowImposters] = useState(false);

  // timer
  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startGame() {
    const names = namesInput
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length < 3) {
      alert("Need at least 3 players");
      return;
    }

    const secs = Math.max(5, parseInt(String(roundSecondsInput), 10) || 60);

    const word = words[Math.floor(Math.random() * words.length)];
    const imp = Math.floor(Math.random() * names.length);

    // Pick a first player who is NOT the imposter
    let first = Math.floor(Math.random() * names.length);
    while (first === imp) {
      first = Math.floor(Math.random() * names.length);
    }

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
  }

  function reveal() {
    if (revealed) return;
    if (i === imposterIndex) {
      setMessage("IMPOSTER");
    } else {
      setMessage(secretWord);
    }
    setRevealed(true);
  }

  function nextPlayer() {
    if (i + 1 >= players.length) {
      setFinished(true);
      return;
    }
    setI(i + 1);
    setRevealed(false);
    setMessage("");
  }

  function resetGame() {
    setNamesInput("");
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
  }

  function startTimer() {
    if (timerRunning) return;

    let secs = Math.max(5, parseInt(String(roundSecondsInput), 10) || 60);
    setRemaining(secs);
    setTimerRunning(true);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setTimerRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
  }

  function revealImposters() {
    setShowImposters(true);
  }

  return (
    <div className="text-lg flex flex-col items-center h-screen justify-center">
      {!started && (
        <div>
        <h1 className="text-2xl font-bold mb-4">Word Imposter!</h1>
          <p>Enter names (comma or newline):</p>
          <textarea
            rows={5}
            value={namesInput}
            onChange={(e) => setNamesInput(e.target.value)}
            className="border border-black"
          />
          <p>Round timer (seconds):</p>
          <input
            type="number"
            min={5}
            value={roundSecondsInput}
            onChange={(e) => setRoundSecondsInput(e.target.value)}
            className="border border-black"
          />
          <br />
          <button onClick={startGame} className="btn btn-primary mt-4">Start</button>
        </div>
      )}

      {started && !finished && (
        <div>
          <div className="flex flex-row items-center mb-8">
            <h1 className="text-2xl font-bold">Click on player name to reveal word</h1>
            <p className="text-sm ml-2 text-neutral-500">
              (Player {i + 1} of {players.length})
            </p>
          </div>
          <button onClick={reveal} className="text-xl">{players[i]}</button>
          <p>{revealed ? message : ""}</p>
          <button onClick={nextPlayer} disabled={!revealed} className="btn btn-primary mt-8">
            Next
          </button>
        </div>
      )}

      {started && finished && (
        <div>
          <div className="mb-8">
            <p>All players have been revealed.</p>
            <p>
              <strong>{players[firstPlayerIndex]}</strong> goes first!
            </p>
          </div>

          {!timerRunning && remaining > 0 && (
            <button onClick={startTimer} className="btn btn-primary">Start Timer</button>
          )}

          {timerRunning && (
            <div>
              <p>Time remaining: <strong>{remaining}s</strong></p>
            </div>
          )}


          {/* NEW: after timer hits zero */}
          {!timerRunning && remaining <= 0 && (
            <div>
              <p>⏰ Time up! Vote!</p>
              {!showImposters && (
                <button onClick={revealImposters}>Reveal Imposters</button>
              )}
              {showImposters && (
                <div>
                  <p>
                    The imposter was:{" "}
                    <strong>{players[imposterIndex]}</strong> 🕵️‍♂️
                  </p>
                </div>
              )}
            </div>
          )}

          <button onClick={resetGame} className="btn btn-primary">Reset</button>
        </div>
      )}
    </div>
  );
}
