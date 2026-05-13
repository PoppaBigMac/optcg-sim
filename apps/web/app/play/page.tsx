"use client";

import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useGameStore } from "@/lib/game-client";
import { Board } from "@/components/game/Board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Action } from "@optcg/shared-types";

function LobbyView() {
  const { status, lobby, connect, ready, lastError } = useGameStore();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [deck, setDeck] = useState<"vanilla-red" | "vanilla-green">("vanilla-red");
  const [mode, setMode] = useState<"idle" | "creating" | "joining">("idle");

  useEffect(() => {
    if (lastError) {
      toast.error(lastError);
    }
  }, [lastError]);

  if (status === "disconnected" || mode === "idle") {
    return (
      <div className="max-w-sm mx-auto space-y-6 p-4">
        <h1 className="text-2xl font-bold text-center">OPTCG Play</h1>

        <div className="space-y-2">
          <label className="text-sm font-medium">Your Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter player name"
            maxLength={32}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Deck</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deck"
                value="vanilla-red"
                checked={deck === "vanilla-red"}
                onChange={() => setDeck("vanilla-red")}
                className="accent-red-500"
              />
              <span className="text-sm text-red-600 font-medium">Vanilla Red</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deck"
                value="vanilla-green"
                checked={deck === "vanilla-green"}
                onChange={() => setDeck("vanilla-green")}
                className="accent-green-600"
              />
              <span className="text-sm text-green-600 font-medium">Vanilla Green</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!name.trim()}
            onClick={() => {
              setMode("creating");
              connect(name.trim(), "create");
            }}
          >
            Create Lobby
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            disabled={!name.trim()}
            onClick={() => setMode("joining")}
          >
            Join Lobby
          </Button>
        </div>

        {mode === "joining" && (
          <div className="space-y-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-char lobby code"
              maxLength={6}
            />
            <Button
              className="w-full"
              disabled={code.length !== 6 || !name.trim()}
              onClick={() => connect(name.trim(), "join", code)}
            >
              Join
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <div className="text-center p-8">
        <div className="text-lg">Connecting...</div>
      </div>
    );
  }

  if (lobby) {
    return (
      <div className="max-w-sm mx-auto space-y-6 p-4 text-center">
        <h2 className="text-xl font-bold">Lobby</h2>

        {lobby.isHost && (
          <div className="space-y-2">
            <div className="text-sm text-ink-400">Share this code with your opponent:</div>
            <div className="text-4xl font-mono font-bold tracking-widest text-orange-600">
              {lobby.lobbyId}
            </div>
          </div>
        )}

        <div className="text-sm">
          {lobby.opponentName ? (
            <span className="text-green-600 font-medium">
              {lobby.opponentName} joined!
            </span>
          ) : (
            <span className="text-ink-400">Waiting for opponent...</span>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Deck: <span className={deck === "vanilla-red" ? "text-red-600" : "text-green-600"}>{deck}</span></div>
        </div>

        {lobby.opponentName && !lobby.isReady && (
          <Button onClick={() => ready(deck)} className="w-full">
            Ready Up
          </Button>
        )}

        {lobby.isReady && (
          <div className="text-sm text-ink-400">Waiting for opponent to ready up...</div>
        )}
      </div>
    );
  }

  return null;
}

function MatchView() {
  const { match, submitAction, lastRejection, clearRejection } = useGameStore();

  useEffect(() => {
    if (lastRejection) {
      toast.error(lastRejection);
      clearRejection();
    }
  }, [lastRejection, clearRejection]);

  if (!match) return null;

  const handleAction = (action: Action) => {
    submitAction(action);
  };

  return (
    <Board
      state={match.state}
      mySlot={match.mySlot}
      actionLog={match.actionLog}
      onAction={handleAction}
    />
  );
}

function MatchEndedView() {
  const { match, reset } = useGameStore();

  if (!match) return null;

  const isWinner = match.winner === match.mySlot;

  return (
    <div className="max-w-md mx-auto space-y-6 p-4 text-center">
      <h2 className="text-3xl font-bold">
        {isWinner ? (
          <span className="text-green-600">You Win!</span>
        ) : (
          <span className="text-red-500">You Lose</span>
        )}
      </h2>
      <div className="text-sm text-ink-400">
        Winner: {match.winner} &middot; {match.actionLog.length} actions
      </div>

      <div className="text-left">
        <h3 className="text-sm font-bold mb-2">Action Log</h3>
        <div className="h-64 overflow-y-auto border border-ink-200 rounded-md bg-white p-2 text-xs font-mono">
          {match.actionLog.map((action, i) => (
            <div key={i} className="py-0.5 border-b border-ink-100 last:border-0">
              <span className="text-ink-400 mr-1">{i + 1}.</span>
              {action.type} ({action.player})
            </div>
          ))}
        </div>
      </div>

      <Button onClick={reset} className="w-full">
        Back to Lobby
      </Button>
    </div>
  );
}

export default function PlayPage() {
  const { match } = useGameStore();

  return (
    <div className="min-h-screen bg-ink-50 py-4">
      <Toaster position="top-center" richColors />
      {match?.winner ? (
        <MatchEndedView />
      ) : match ? (
        <MatchView />
      ) : (
        <LobbyView />
      )}
    </div>
  );
}
