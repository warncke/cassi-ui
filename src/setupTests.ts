import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock console methods (as per user instructions)
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// Mock missing JSDOM APIs
vi.stubGlobal("alert", vi.fn());

// Mock navigator.mediaDevices.getUserMedia - Keep this as it's needed by RecordButton tests
const mockGetUserMedia = vi.fn(async () => {
  // Return a mock MediaStream
  return {
    getTracks: vi.fn(() => [
      {
        stop: vi.fn(),
        readyState: "live",
      },
    ]),
  };
});

// Ensure navigator.mediaDevices exists and assign getUserMedia
if (!globalThis.navigator.mediaDevices) {
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: {},
    writable: true,
    configurable: true,
  });
}
Object.defineProperty(globalThis.navigator.mediaDevices, "getUserMedia", {
  value: mockGetUserMedia,
  writable: true,
  configurable: true,
});

// We won't mock MediaRecorder or BlobEvent globally anymore,
// as it seems to conflict with React DOM in this setup.
// Tests needing these might require specific local mocks.
