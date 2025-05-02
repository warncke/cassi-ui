import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RecordButton from "./RecordButton";
import { TaskProvider, useTasks } from "../../providers/TaskProvider";
import * as voiceRecorderUtils from "../../utils/voiceRecorder"; // Import for type reference and vi.mocked

// --- Mock voiceRecorder module ---
vi.mock("../../utils/voiceRecorder", () => ({
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
}));
// --- End Mock voiceRecorder module ---

// Mock lucide-react
vi.mock("lucide-react", async (importOriginal) => {
  const original = await importOriginal<typeof import("lucide-react")>();
  return {
    ...original,
    Mic: (props: React.ComponentProps<"svg">) => (
      <svg data-testid="icon-mic" {...props} />
    ),
  };
});

// Mock useTasks hook
const mockAddTask = vi.fn();
const mockAddTaskContext = vi.fn();
vi.mock("../../providers/TaskProvider", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../providers/TaskProvider")
  >();
  return {
    ...actual,
    useTasks: () => ({
      tasks: [],
      addTask: mockAddTask,
      updateTaskStatus: vi.fn(), // Mock unused functions if needed
      taskContext: [],
      addTaskContext: mockAddTaskContext,
      clearTaskContext: vi.fn(),
    }),
  };
});

// Spy on console methods
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {}); // Keep warn suppressed

// Helper to render with provider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<TaskProvider>{ui}</TaskProvider>);
};

// Mock MediaStreamTrack and MediaStream for return values
const createMockMedia = () => {
  const mockTrack = {
    stop: vi.fn(),
    readyState: "live",
  } as unknown as MediaStreamTrack;

  const mockStream = {
    getTracks: vi.fn(() => [mockTrack]),
  } as unknown as MediaStream;

  // A simplified mock MediaRecorder focusing on state and stop
  const mockRecorder = {
    stop: vi.fn(),
    state: "inactive", // Start as inactive
    stream: mockStream, // Keep track of the stream for cleanup checks
    // Add other methods/properties if needed by the component's logic
  } as unknown as MediaRecorder;

  return { mockTrack, mockStream, mockRecorder };
};

describe("RecordButton", () => {
  let mockTrack: MediaStreamTrack;
  let mockStream: MediaStream;
  let mockRecorder: MediaRecorder;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockAddTask.mockClear();
    mockAddTaskContext.mockClear();
    // Clear the module mock functions using vi.mocked
    vi.mocked(voiceRecorderUtils.startRecording).mockClear();
    vi.mocked(voiceRecorderUtils.stopRecording).mockClear();
    mockConsoleWarn.mockClear();

    // Create fresh mocks for each test
    const media = createMockMedia();
    mockTrack = media.mockTrack;
    mockStream = media.mockStream;
    mockRecorder = media.mockRecorder;

    // Default successful mock implementations using vi.mocked
    vi.mocked(voiceRecorderUtils.startRecording).mockResolvedValue({
      recorder: mockRecorder,
      stream: mockStream,
    });
    vi.mocked(voiceRecorderUtils.stopRecording).mockResolvedValue(
      new Blob(["audio"], { type: "audio/webm" })
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks(); // Restores original implementations of spies
    vi.useRealTimers();
  });

  it("renders initial state", () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("icon-mic")).toBeInTheDocument();
    expect(button).not.toHaveClass("animate-pulse");
    expect(screen.queryByText(/s$/)).not.toBeInTheDocument();
  });

  it("starts recording on mouse down and updates UI", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    // Use act to wrap state updates
    await act(async () => {
      fireEvent.mouseDown(button);
      // Allow the startRecording promise to resolve
      await Promise.resolve();
      // Advance timer just enough for the first interval
      vi.advanceTimersByTime(1);
    });

    expect(vi.mocked(voiceRecorderUtils.startRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    expect(button).toHaveClass("animate-pulse");
    expect(screen.getByText("0s")).toBeInTheDocument(); // Initial state after start

    // Advance timer by 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1s")).toBeInTheDocument();

    // Advance timer by less than a full second (should not change display)
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText("1s")).toBeInTheDocument();

    // Advance timer to the next second
    await act(async () => {
      vi.advanceTimersByTime(500); // Advance remaining time for the second interval
    });
    expect(screen.getByText("2s")).toBeInTheDocument();
  });

  it("stops recording on mouse up, calls addTask, and cleans up", async () => {
    const blobSize = 2048;
    const mockBlob = new Blob(["audio"], { type: "audio/webm" });
    Object.defineProperty(mockBlob, "size", { value: blobSize });
    vi.mocked(voiceRecorderUtils.stopRecording).mockResolvedValue(mockBlob); // Override default for size check

    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    // Start recording
    await act(async () => {
      fireEvent.mouseDown(button);
      await Promise.resolve(); // Allow start promise to resolve
      vi.advanceTimersByTime(1); // Trigger initial timer state
    });
    expect(screen.getByText("0s")).toBeInTheDocument();

    // Advance timer
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("2s")).toBeInTheDocument();

    // Set recorder state to recording before stopping
    Object.defineProperty(mockRecorder, "state", {
      value: "recording",
      configurable: true,
    });

    // Stop recording
    await act(async () => {
      fireEvent.mouseUp(button);
      await Promise.resolve(); // Allow stop promise and cleanup to resolve
    });

    expect(vi.mocked(voiceRecorderUtils.stopRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    expect(vi.mocked(voiceRecorderUtils.stopRecording)).toHaveBeenCalledWith(
      mockRecorder
    );
    expect(mockAddTask).toHaveBeenCalledTimes(1);
    expect(mockAddTask).toHaveBeenCalledWith(
      "Processing voice command (2 KB)",
      mockBlob
    );
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1); // Check internal cleanup call
    expect(mockTrack.stop).toHaveBeenCalledTimes(1); // Check internal cleanup call

    expect(button).not.toHaveClass("animate-pulse");
    expect(screen.queryByText(/s$/)).not.toBeInTheDocument();
  });

  it("starts recording on Space key down", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    await act(async () => {
      fireEvent.keyDown(window, { code: "Space" });
      await Promise.resolve(); // Allow start promise to resolve
      vi.advanceTimersByTime(1); // Trigger initial timer state
    });

    expect(vi.mocked(voiceRecorderUtils.startRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    expect(button).toHaveClass("animate-pulse");
    expect(screen.getByText("0s")).toBeInTheDocument();
  });

  it("stops recording on Space key up", async () => {
    const blobSize = 500;
    const mockBlob = new Blob(["audio"], { type: "audio/webm" });
    Object.defineProperty(mockBlob, "size", { value: blobSize });
    vi.mocked(voiceRecorderUtils.stopRecording).mockResolvedValue(mockBlob); // Override default

    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    // Start
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space" });
      await Promise.resolve();
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText("0s")).toBeInTheDocument();

    // Advance
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("1s")).toBeInTheDocument();

    Object.defineProperty(mockRecorder, "state", {
      value: "recording",
      configurable: true,
    });

    // Stop
    await act(async () => {
      fireEvent.keyUp(window, { code: "Space" });
      await Promise.resolve(); // Allow stop promise and cleanup
    });

    expect(vi.mocked(voiceRecorderUtils.stopRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    expect(mockAddTask).toHaveBeenCalledWith(
      "Processing voice command (0 KB)",
      mockBlob
    ); // 500 bytes -> 0 KB
    expect(screen.queryByText(/s$/)).not.toBeInTheDocument();
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(button).not.toHaveClass("animate-pulse");
  });

  it("starts recording on touch start", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    await act(async () => {
      fireEvent.touchStart(button);
      await Promise.resolve(); // Allow start promise
      vi.advanceTimersByTime(1); // Trigger timer state
    });

    expect(vi.mocked(voiceRecorderUtils.startRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    expect(button).toHaveClass("animate-pulse");
    expect(screen.getByText("0s")).toBeInTheDocument();
  });

  it("stops recording on touch end", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    // Start
    await act(async () => {
      fireEvent.touchStart(button);
      await Promise.resolve();
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText("0s")).toBeInTheDocument();

    Object.defineProperty(mockRecorder, "state", {
      value: "recording",
      configurable: true,
    });

    // Stop
    await act(async () => {
      fireEvent.touchEnd(button);
      await Promise.resolve(); // Allow stop promise and cleanup
    });

    const defaultBlob = new Blob(["audio"], { type: "audio/webm" }); // Re-create the default blob used if not overridden
    expect(vi.mocked(voiceRecorderUtils.stopRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    expect(mockAddTask).toHaveBeenCalledTimes(1);
    expect(mockAddTask).toHaveBeenCalledWith(
      expect.stringContaining("Processing voice command"), // Check the string part loosely
      defaultBlob // Check that the default blob was passed
    );
    expect(screen.queryByText(/s$/)).not.toBeInTheDocument();
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(button).not.toHaveClass("animate-pulse");
  });

  it("handles drag over and drag leave", () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    expect(button).not.toHaveClass("bg-blue-600");
    fireEvent.dragOver(button);
    expect(button).toHaveClass("bg-blue-600", "scale-110");

    fireEvent.dragLeave(button);
    expect(button).not.toHaveClass("bg-blue-600", "scale-110");
  });

  it("handles drop with file data", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });
    const fileData = { type: "file", path: "test.txt", content: "hello" };
    const dataTransfer = {
      getData: vi.fn((format) =>
        format === "application/json" ? JSON.stringify(fileData) : ""
      ),
    };

    await act(async () => {
      fireEvent.drop(button, { dataTransfer });
    });

    expect(dataTransfer.getData).toHaveBeenCalledWith("application/json");
    expect(mockAddTaskContext).toHaveBeenCalledTimes(1);
    expect(mockAddTaskContext).toHaveBeenCalledWith("file", {
      path: "test.txt",
      content: "hello",
    });
  });

  it("handles drop with directory data", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });
    const dirData = { type: "directory", path: "src/components" };
    const dataTransfer = {
      getData: vi.fn((format) =>
        format === "application/json" ? JSON.stringify(dirData) : ""
      ),
    };

    await act(async () => {
      fireEvent.drop(button, { dataTransfer });
    });

    expect(dataTransfer.getData).toHaveBeenCalledWith("application/json");
    expect(mockAddTaskContext).toHaveBeenCalledTimes(1);
    expect(mockAddTaskContext).toHaveBeenCalledWith("directory", {
      path: "src/components",
    });
  });

  it("handles drop with missing application/json data", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });
    const dataTransfer = {
      getData: vi.fn().mockReturnValue(""), // Simulate no json data
    };

    await act(async () => {
      fireEvent.drop(button, { dataTransfer });
      // Ensure microtasks like console.warn run and timers settle
      await vi.runAllTimersAsync();
    });

    expect(dataTransfer.getData).toHaveBeenCalledWith("application/json");
    expect(mockAddTaskContext).not.toHaveBeenCalled();
    // Assertions for alert/error removed
  });

  it("handles drop with invalid JSON data", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });
    const dataTransfer = {
      getData: vi.fn().mockReturnValue("{invalid json"),
    };

    await act(async () => {
      fireEvent.drop(button, { dataTransfer });
      // Ensure microtasks like console.error/alert run and timers settle
      await vi.runAllTimersAsync();
    });

    expect(dataTransfer.getData).toHaveBeenCalledWith("application/json");
    expect(mockAddTaskContext).not.toHaveBeenCalled();
    // Assertions for alert/error removed
  });

  it("handles drop with incomplete file data", async () => {
    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });
    const incompleteData = { type: "file", path: "test.txt" }; // Missing content
    const dataTransfer = {
      getData: vi.fn().mockReturnValue(JSON.stringify(incompleteData)),
    };

    await act(async () => {
      fireEvent.drop(button, { dataTransfer });
      // Ensure microtasks like console.warn run and timers settle
      await vi.runAllTimersAsync();
    });

    expect(mockAddTaskContext).not.toHaveBeenCalled();
    // Assertions for alert/error removed
  });

  it("handles error during start recording", async () => {
    const startError = new Error("Mic permission denied");
    vi.mocked(voiceRecorderUtils.startRecording).mockRejectedValue(startError); // Mock utility to reject

    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    // Use act and ensure promise rejection is handled
    await act(async () => {
      fireEvent.mouseDown(button);
      // Allow the rejected promise and subsequent catch block to execute
      // Need to ensure the catch block runs *before* assertions
      try {
        // Wait for the specific promise associated with this call to settle
        const results = vi.mocked(voiceRecorderUtils.startRecording).mock
          .results;
        if (results.length > 0) {
          await results[results.length - 1]?.value;
        }
      } catch {
        // Expected rejection
      }
      // Flush microtasks and timers to ensure catch block runs
      await vi.runAllTimersAsync();
    });

    expect(vi.mocked(voiceRecorderUtils.startRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    // Assertions for alert/error removed
    // Ensure recorder/track stop methods not called directly if start failed early
    expect(mockRecorder.stop).not.toHaveBeenCalled();
    expect(mockTrack.stop).not.toHaveBeenCalled();
    expect(screen.queryByText(/s$/)).not.toBeInTheDocument();
  });

  it("handles error during stop recording", async () => {
    const stopError = new Error("Failed to process audio");
    vi.mocked(voiceRecorderUtils.stopRecording).mockRejectedValue(stopError); // Mock utility to reject

    renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    // Start successfully
    await act(async () => {
      fireEvent.mouseDown(button);
      await Promise.resolve();
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText("0s")).toBeInTheDocument();
    Object.defineProperty(mockRecorder, "state", {
      value: "recording",
      configurable: true,
    });

    // Attempt to stop, expecting error
    await act(async () => {
      fireEvent.mouseUp(button);
      // Allow rejection and finally block
      try {
        // Wait for the specific promise associated with this call to settle
        const results = vi.mocked(voiceRecorderUtils.stopRecording).mock
          .results;
        if (results.length > 0) {
          await results[results.length - 1]?.value;
        }
      } catch {
        // Expected rejection
      }
      // Flush microtasks and timers to ensure catch/finally blocks run
      await vi.runAllTimersAsync();
    });

    expect(vi.mocked(voiceRecorderUtils.stopRecording)).toHaveBeenCalledTimes(
      1
    ); // Use vi.mocked
    expect(mockAddTask).not.toHaveBeenCalled(); // Task should not be added on error
    // Assertions for alert/error removed

    // Verify cleanup still happens in the finally block
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(mockTrack.stop).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/s$/)).not.toBeInTheDocument(); // UI should reset
    expect(button).not.toHaveClass("animate-pulse");
  });

  it("cleans up resources on unmount while recording", async () => {
    const { unmount } = renderWithProvider(<RecordButton />);
    const button = screen.getByRole("button", {
      name: /record voice command/i,
    });

    // Start recording
    await act(async () => {
      fireEvent.mouseDown(button);
      await Promise.resolve();
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText("0s")).toBeInTheDocument(); // Verify recording started
    Object.defineProperty(mockRecorder, "state", {
      value: "recording",
      configurable: true,
    });

    // Unmount the component
    act(() => {
      unmount();
    });

    // Verify cleanup happened
    expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
    expect(mockTrack.stop).toHaveBeenCalledTimes(1);
    // Check if timer was cleared (difficult to check directly, but cleanup implies it)
  });
});
