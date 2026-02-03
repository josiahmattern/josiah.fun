"use client";
import { useState, useEffect, useRef } from "react";
import GameUI from "./components/GameUI";
import Link from "next/link";

export default function InnerWordPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [view, setView] = useState("menu");
  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isPeerLoaded, setIsPeerLoaded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // --- GAME STATE ---
  const [myPlayerId, setMyPlayerId] = useState("");
  const [hostId, setHostId] = useState("");
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState({
    status: "lobby",
    prompt: "...",
    usedWords: [],
    currentPlayerId: null,
    lastExplodedPlayerId: null,
  });

  // --- REFS ---
  const peerInstance = useRef(null);
  const PeerLibrary = useRef(null);
  const connRef = useRef([]);
  const hostConnRef = useRef(null);

  const playersRef = useRef([]);
  const gameRef = useRef(gameState);
  const timerRef = useRef({ elapsed: 0, limit: 0 });

  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    gameRef.current = gameState;
  }, [gameState]);

  // 1. SETUP
  useEffect(() => {
    setHasMounted(true);
    import("peerjs").then((module) => {
      PeerLibrary.current = module.default;
      setIsPeerLoaded(true);
    });
  }, []);

  // 2. HOST LOGIC
  const handleHost = () => {
    if (!username.trim()) return alert("Enter name");
    setIsConnecting(true);

    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const fullId = `bombparty-v2-${code}`;

    const peer = new PeerLibrary.current(fullId, { debug: 1 });
    peerInstance.current = peer;

    peer.on("open", (id) => {
      setHostId(code);
      setMyPlayerId(id);
      const initialMe = { id, name: username, lives: 3, isHost: true };
      setPlayers([initialMe]);
      setView("game");
      setIsConnecting(false);
    });

    peer.on("connection", (conn) => {
      connRef.current.push(conn);
      conn.on("data", (data) => handleHostData(data, conn.peer));
    });

    peer.on("error", (err) => {
      setIsConnecting(false);
      alert(`Host Error: ${err.type}`);
    });
  };

  // 3. JOIN LOGIC
  const handleJoin = () => {
    if (!username.trim()) return alert("Enter name");
    if (joinCode.length !== 4) return alert("Code must be 4 chars");

    setIsConnecting(true);
    const fullHostId = `bombparty-v2-${joinCode.toUpperCase()}`;
    const peer = new PeerLibrary.current();
    peerInstance.current = peer;

    peer.on("open", (id) => {
      setMyPlayerId(id);
      const conn = peer.connect(fullHostId);
      hostConnRef.current = conn;

      conn.on("open", () => {
        setView("game");
        setIsConnecting(false);
        setHostId(joinCode.toUpperCase());
        conn.send({ type: "JOIN", name: username });
      });

      conn.on("data", (data) => handleClientData(data));
      conn.on("error", () => {
        setIsConnecting(false);
        alert("Connection Failed");
      });
    });
  };

  // 4. DATA HANDLERS
  const handleHostData = (data, senderId) => {
    if (data.type === "JOIN") {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === senderId)) return prev;
        const newPlayers = [
          ...prev,
          { id: senderId, name: data.name, lives: 3, isHost: false },
        ];
        broadcast({ type: "SYNC_PLAYERS", players: newPlayers });
        return newPlayers;
      });
    }

    if (data.type === "GUESS") {
      const { word } = data;
      const current = gameRef.current;
      if (senderId !== current.currentPlayerId) return;

      if (
        word.includes(current.prompt.toLowerCase()) &&
        !current.usedWords.includes(word)
      ) {
        passTurn(word);
      }
    }
  };

  const handleClientData = (data) => {
    if (data.type === "SYNC_PLAYERS") setPlayers(data.players);
    if (data.type === "SYNC_STATE") setGameState(data.state);
  };

  // 5. TURN LOGIC
  const getRandomLimit = () => Math.floor(Math.random() * 5000) + 3000;

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
      "que",
      "ght",
      "ack",
    ];
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const getNextAlivePlayerId = (currentId) => {
    const list = playersRef.current;
    if (list.length === 0) return null;
    let idx = list.findIndex((p) => p.id === currentId);
    if (idx === -1) idx = 0;
    for (let i = 1; i <= list.length; i++) {
      const nextIdx = (idx + i) % list.length;
      if (list[nextIdx].lives > 0) return list[nextIdx].id;
    }
    return null;
  };

  const passTurn = (wordToAdd = null) => {
    const nextId = getNextAlivePlayerId(gameRef.current.currentPlayerId);
    const aliveCount = playersRef.current.filter((p) => p.lives > 0).length;
    if (aliveCount <= 1 && playersRef.current.length > 1) {
      endGame();
      return;
    }

    timerRef.current = { elapsed: 0, limit: getRandomLimit() };

    const newState = {
      ...gameRef.current,
      status: "playing",
      currentPlayerId: nextId,
      prompt: generatePrompt(),
      lastExplodedPlayerId: null,
      usedWords: wordToAdd
        ? [wordToAdd, ...gameRef.current.usedWords]
        : gameRef.current.usedWords,
    };

    setGameState(newState);
    broadcast({ type: "SYNC_STATE", state: newState });
  };

  const explodeCurrentPlayer = () => {
    const currentId = gameRef.current.currentPlayerId;
    if (!currentId) return;

    const newPlayers = playersRef.current.map((p) =>
      p.id === currentId ? { ...p, lives: p.lives - 1 } : p,
    );
    setPlayers(newPlayers);
    broadcast({ type: "SYNC_PLAYERS", players: newPlayers });

    const aliveCount = newPlayers.filter((p) => p.lives > 0).length;
    if (aliveCount <= 1 && newPlayers.length > 1) {
      endGame();
      return;
    }

    const nextId = getNextAlivePlayerId(currentId);
    timerRef.current = { elapsed: 0, limit: getRandomLimit() };

    const newState = {
      ...gameRef.current,
      currentPlayerId: nextId,
      prompt: generatePrompt(),
      lastExplodedPlayerId: currentId,
    };

    setGameState(newState);
    broadcast({ type: "SYNC_STATE", state: newState });
  };

  const endGame = () => {
    const newState = { ...gameRef.current, status: "gameover" };
    setGameState(newState);
    broadcast({ type: "SYNC_STATE", state: newState });
  };

  const onStartGame = () => {
    const resetPlayers = playersRef.current.map((p) => ({ ...p, lives: 3 }));
    setPlayers(resetPlayers);
    broadcast({ type: "SYNC_PLAYERS", players: resetPlayers });

    const starter =
      resetPlayers[Math.floor(Math.random() * resetPlayers.length)].id;
    timerRef.current = { elapsed: 0, limit: getRandomLimit() };

    const newState = {
      status: "playing",
      prompt: generatePrompt(),
      usedWords: [],
      currentPlayerId: starter,
      lastExplodedPlayerId: null,
    };

    setGameState(newState);
    broadcast({ type: "SYNC_STATE", state: newState });
  };

  useEffect(() => {
    if (!myPlayerId || !players.find((p) => p.id === myPlayerId)?.isHost)
      return;
    if (gameState.status !== "playing") return;

    const interval = setInterval(() => {
      timerRef.current.elapsed += 100;
      if (timerRef.current.elapsed >= timerRef.current.limit) {
        explodeCurrentPlayer();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.status, myPlayerId]);

  const broadcast = (msg) => {
    connRef.current.forEach((c) => c.open && c.send(msg));
  };

  const onSubmitGuess = (word) => {
    if (players.find((p) => p.id === myPlayerId)?.isHost) {
      handleHostData({ type: "GUESS", word }, myPlayerId);
    } else {
      hostConnRef.current?.send({ type: "GUESS", word });
    }
  };

  if (!hasMounted) return null;

  if (view === "menu") {
    return (
      // Added 'relative' to the container so absolute positioning works
      <div className="min-h-screen flex items-center justify-center bg-base-100 p-4 relative">
        {/* BACK HOME BUTTON: Moved to absolute position top-right */}
        <div className="absolute top-4 right-4">
          <div className="badge badge-lg badge-neutral font-mono p-4 hover:scale-105 transition-transform">
            <Link href="/" className="hover:text-primary transition-colors">
              BACK HOME
            </Link>
          </div>
        </div>

        <div className="card w-full max-w-sm bg-base-200 shadow-xl border-2 border-base-300">
          <div className="card-body items-center text-center space-y-4">
            <h1 className="text-4xl font-black text-primary tracking-tighter">
              INNERWORD
            </h1>
            <input
              className="input input-bordered w-full text-center text-lg font-bold"
              placeholder="Your Name"
              value={username || ""}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={12}
            />
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
                  className="input input-bordered join-item w-full text-center uppercase"
                  placeholder="CODE"
                  maxLength={4}
                  value={joinCode}
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

  // --- FIXED: Pass roomCode and remove floating div ---
  return (
    <div className="min-h-screen bg-base-100 p-4 flex justify-center">
      <GameUI
        myPlayerId={myPlayerId}
        players={players}
        gameState={gameState}
        roomCode={hostId} // <-- Passed as Prop
        onSubmitGuess={onSubmitGuess}
        onStartGame={onStartGame}
      />
    </div>
  );
}
