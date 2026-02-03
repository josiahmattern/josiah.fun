"use client";
import { useState, useEffect, useRef } from "react";
import GameUI from "./components/GameUI";

export default function InnerWordPage() {
  // --- UI STATE ---
  const [hasMounted, setHasMounted] = useState(false); // Fixes Next.js hydration errors
  const [view, setView] = useState("menu"); // menu, join, game
  const [username, setUsername] = useState(""); // Initialize with empty string
  const [joinCode, setJoinCode] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isPeerLoaded, setIsPeerLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // --- GAME STATE ---
  const [myPlayerId, setMyPlayerId] = useState("");
  const [hostId, setHostId] = useState(""); // The 4-letter code
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({
    status: "lobby",
    prompt: "...",
    timer: 15,
    usedWords: [],
  });

  // --- REFS ---
  const peerInstance = useRef(null);
  const PeerLibrary = useRef(null);
  const connRef = useRef([]); // Host: Array of connections
  const hostConnRef = useRef(null); // Joiner: Connection to host

  // 1. MOUNT & LOAD PEERJS
  useEffect(() => {
    setHasMounted(true);
    import("peerjs").then((module) => {
      PeerLibrary.current = module.default;
      setIsPeerLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      if (peerInstance.current) peerInstance.current.destroy();
    };
  }, []);

  // 2. HOST LOGIC
  const handleHost = () => {
    if (!username.trim()) return alert("Please enter a name");
    if (!PeerLibrary.current) return;

    setIsConnecting(true);

    // Generate 4-letter code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const fullId = `bombparty-${code}`;

    const peer = new PeerLibrary.current(fullId);
    peerInstance.current = peer;

    peer.on("open", (id) => {
      setHostId(code);
      setMyPlayerId(id);
      setPlayers([{ id, name: username, score: 0, isHost: true }]);
      setView("game");
      setIsConnecting(false);
    });

    peer.on("connection", (conn) => {
      connRef.current.push(conn);

      conn.on("open", () => {
        // Send current players to the new joiner
        // We use a functional update inside the event to get the FRESH 'players' state
        // (This is tricky in React closures, so we sync simpler: ask joiner to send name first)
      });

      conn.on("data", (data) => {
        handleHostData(data, conn.peer, conn);
      });
    });

    peer.on("error", (err) => {
      setIsConnecting(false);
      if (err.type === "unavailable-id")
        handleHost(); // Retry if code taken
      else alert("Connection Error: " + err.type);
    });
  };

  // 3. JOIN LOGIC
  const handleJoin = () => {
    if (!username.trim()) return alert("Please enter a name");
    if (joinCode.length !== 4) return alert("Code must be 4 letters");
    if (!PeerLibrary.current) return;

    setIsConnecting(true);

    const peer = new PeerLibrary.current(); // Random ID for joiner
    peerInstance.current = peer;

    peer.on("open", (id) => {
      setMyPlayerId(id);
      const fullHostId = `bombparty-${joinCode.toUpperCase()}`;
      const conn = peer.connect(fullHostId);
      hostConnRef.current = conn;

      conn.on("open", () => {
        setView("game");
        setIsConnecting(false);
        // Handshake: Tell host my name
        conn.send({ type: "JOIN", name: username });
      });

      conn.on("data", (data) => handleClientData(data));
      conn.on("error", () => {
        setIsConnecting(false);
        alert("Could not connect to host.");
      });
      conn.on("close", () => {
        alert("Host disconnected");
        window.location.reload();
      });
    });
  };

  // 4. DATA HANDLERS
  const handleHostData = (data, senderId, conn) => {
    if (data.type === "JOIN") {
      setPlayers((prev) => {
        // Prevent duplicate joins
        if (prev.find((p) => p.id === senderId)) return prev;

        const newPlayers = [
          ...prev,
          { id: senderId, name: data.name, score: 0, isHost: false },
        ];
        // Broadcast new list to everyone (including the new guy)
        broadcast({ type: "SYNC_PLAYERS", players: newPlayers });
        return newPlayers;
      });
    }

    if (data.type === "GUESS") {
      setGameState((prev) => {
        const word = data.word;
        // Host Validates Word Here
        if (
          word.includes(prev.prompt.toLowerCase()) &&
          !prev.usedWords.includes(word)
        ) {
          // Update Score
          setPlayers((currPlayers) => {
            const updated = currPlayers.map((p) =>
              p.id === senderId ? { ...p, score: p.score + 1 } : p,
            );
            broadcast({ type: "SYNC_PLAYERS", players: updated });
            return updated;
          });

          // Update Game State
          const newState = {
            ...prev,
            timer: 15, // Reset timer
            prompt: generatePrompt(),
            usedWords: [word, ...prev.usedWords],
          };
          broadcast({ type: "SYNC_STATE", state: newState });
          return newState;
        }
        return prev;
      });
    }
  };

  const handleClientData = (data) => {
    if (data.type === "SYNC_PLAYERS") setPlayers(data.players);
    if (data.type === "SYNC_STATE") setGameState(data.state);
  };

  // 5. UTILS & GAME LOOP
  const broadcast = (msg) => {
    connRef.current.forEach((c) => c.open && c.send(msg));
  };

  const generatePrompt = () => {
    const chars = [
      "ing",
      "ent",
      "ter",
      "est",
      "ist",
      "ion",
      "ver",
      "all",
      "and",
    ];
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const onStartGame = () => {
    const newState = {
      status: "playing",
      prompt: generatePrompt(),
      timer: 15,
      usedWords: [],
    };
    setGameState(newState);
    broadcast({ type: "SYNC_STATE", state: newState });
  };

  const onSubmitGuess = (word) => {
    // If Host, handle locally. If Client, send to Host.
    const me = players.find((p) => p.id === myPlayerId);
    if (me?.isHost) {
      handleHostData({ type: "GUESS", word }, myPlayerId, null);
    } else {
      hostConnRef.current?.send({ type: "GUESS", word });
    }
  };

  // Host Timer Loop
  useEffect(() => {
    if (!myPlayerId || !players.find((p) => p.id === myPlayerId)?.isHost)
      return;
    if (gameState.status !== "playing") return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.timer <= 0) {
          const overState = { ...prev, status: "gameover" };
          broadcast({ type: "SYNC_STATE", state: overState });
          return overState;
        }
        const nextState = { ...prev, timer: prev.timer - 1 };
        broadcast({ type: "SYNC_STATE", state: nextState });
        return nextState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.status, myPlayerId]);

  // --- RENDER ---
  // Prevent hydration mismatch
  if (!hasMounted) return <div className="min-h-screen bg-base-100"></div>;

  // VIEW: MAIN MENU
  if (view === "menu") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
        <div className="card w-full max-w-sm bg-base-200 shadow-xl border-2 border-base-300">
          <div className="card-body items-center text-center space-y-4">
            <h1 className="text-4xl font-black text-primary tracking-tighter">
              BOMB PARTY
            </h1>
            <p className="text-sm opacity-60 font-bold uppercase tracking-widest">
              Multiplayer
            </p>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold">Your Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full text-center text-lg font-bold"
                placeholder="e.g. SpeedTyper"
                value={username || ""}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={12}
              />
            </div>

            <div className="w-full space-y-2 pt-2">
              <button
                onClick={handleHost}
                disabled={!isPeerLoaded || isConnecting}
                className="btn btn-primary w-full btn-lg"
              >
                {isConnecting ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Host Game"
                )}
              </button>

              <div className="divider">OR</div>

              <div className="join w-full">
                <input
                  className="input input-bordered join-item w-full text-center font-mono uppercase tracking-widest"
                  placeholder="CODE"
                  maxLength={4}
                  value={joinCode || ""}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <button
                  onClick={handleJoin}
                  disabled={!isPeerLoaded || isConnecting}
                  className="btn btn-neutral join-item"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: LOBBY & GAME (Handled by GameUI)
  return (
    <div className="min-h-screen bg-base-100 p-4 flex justify-center">
      {/* Room Code Badge */}
      {gameState.status === "lobby" && (
        <div className="fixed top-4 left-4 z-50">
          <div className="badge badge-lg badge-neutral font-mono shadow-lg p-4">
            Code:{" "}
            <span className="font-black ml-2 text-primary select-all">
              {hostId || "..."}
            </span>
          </div>
        </div>
      )}

      <GameUI
        myPlayerId={myPlayerId}
        players={players}
        gameState={gameState}
        onSubmitGuess={onSubmitGuess}
        onStartGame={onStartGame}
      />
    </div>
  );
}
