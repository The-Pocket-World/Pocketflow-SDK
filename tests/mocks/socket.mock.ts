import { EventEmitter } from "events";

export class MockSocket extends EventEmitter {
  private eventHandlers: Record<string, Array<(...args: any[]) => void>> = {};
  public connected = true;
  public id = "mock-socket-id";

  constructor() {
    super();
    this.eventHandlers = {};
  }

  on(event: string, callback: (...args: any[]) => void): this {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
    return super.on(event, callback);
  }

  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  disconnect(): void {
    this.connected = false;
    this.emit("disconnect", "io client disconnect");
  }

  connect(): void {
    this.connected = true;
    this.emit("connect");
  }

  // Helper method to trigger events for testing
  triggerEvent(event: string, ...args: any[]): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((handler) => handler(...args));
    }
  }
}

// Mock for the socket.io-client io function
export const mockIo = jest.fn().mockImplementation(() => {
  return new MockSocket();
});

// Replace the real io import with our mock
jest.mock("socket.io-client", () => ({
  io: mockIo,
}));
