import type { Action } from "@optcg/shared-types";
import type { ClientMessage, ServerMessage, ServerMessageHandler } from "./types";

export class GameClient {
  private ws: WebSocket | null = null;
  private handlers: ServerMessageHandler[] = [];

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(url: string, onOpen?: () => void, onClose?: () => void): void {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => onOpen?.();
    this.ws.onclose = () => onClose?.();
    this.ws.onerror = () => onClose?.();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      for (const handler of this.handlers) handler(msg);
    };
  }

  onMessage(handler: ServerMessageHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  private send(msg: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  createLobby(playerName: string): void {
    this.send({ type: "CreateLobby", playerName });
  }

  joinLobby(lobbyId: string, playerName: string): void {
    this.send({ type: "JoinLobby", lobbyId, playerName });
  }

  ready(deckId: string): void {
    this.send({ type: "Ready", deckId });
  }

  submitAction(action: Action): void {
    this.send({ type: "SubmitAction", action });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers = [];
  }
}
