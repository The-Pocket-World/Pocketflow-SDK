/**
 * Mock implementation of the socket.io client
 */

export class MockSocket {
  public id = "mock-socket-id";
  public connected = true;
  public eventHandlers: Record<string, Array<(...args: any[]) => void>> = {};

  // Event handling
  on = jest
    .fn()
    .mockImplementation((event: string, handler: (...args: any[]) => void) => {
      if (!this.eventHandlers[event]) {
        this.eventHandlers[event] = [];
      }
      this.eventHandlers[event].push(handler);
      return this;
    });

  once = jest
    .fn()
    .mockImplementation((event: string, handler: (...args: any[]) => void) => {
      if (!this.eventHandlers[event]) {
        this.eventHandlers[event] = [];
      }
      this.eventHandlers[event].push(handler);
      return this;
    });

  emit = jest.fn().mockImplementation((event: string, ...args: any[]) => {
    // Call event handlers
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          // Just capture errors to prevent tests from failing directly
          console.error(
            `Error in mock socket event handler for ${event}:`,
            error
          );
        }
      });
    }
    return true;
  });

  removeAllListeners = jest.fn().mockImplementation((event?: string) => {
    if (event) {
      delete this.eventHandlers[event];
    } else {
      this.eventHandlers = {};
    }
    return this;
  });

  connect = jest.fn().mockImplementation(() => {
    // Simulate connecting by emitting the connect event
    this.connected = true;
    setTimeout(() => {
      this.emit("connect");
    }, 10);
    return this;
  });

  disconnect = jest.fn().mockImplementation(() => {
    this.connected = false;
    this.emit("disconnect", "io client disconnect");
    return this;
  });

  // Make the socket an EventEmitter with the _events property
  _events = {};
  _eventsCount = 0;
  _maxListeners = undefined;
}

/**
 * Mock implementation of socket.io-client's io function
 */
export const mockIo = jest.fn().mockImplementation(() => {
  return new MockSocket();
});

// Replace the real io import with our mock
jest.mock("socket.io-client", () => ({
  io: mockIo,
}));
