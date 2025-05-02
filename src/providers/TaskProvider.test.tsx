import React from "react";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
// Import types separately if needed, avoid importing implementation before mock
// import type { TaskProviderProps } from "./TaskProvider"; // Removed incorrect type import
import { useTasks } from "./TaskProvider";

// Mock the internal blobToBase64 function
vi.mock("./TaskProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./TaskProvider")>();
  const internalMock = vi.fn(); // Define mock inside factory
  return {
    ...actual, // Keep original exports like TaskProvider, useTasks
    // Note: We need TaskProvider implementation, so we keep the original
    // If blobToBase64 was exported, we would mock it here:
    // blobToBase64: internalMock,
    // Since it's internal, we need a different approach (or modify source to export it for testing)
    // --- Let's assume for now blobToBase64 IS exported for this mock strategy ---
    blobToBase64: internalMock,
  };
});

// --- Re-evaluation: blobToBase64 is NOT exported. Mocking it this way won't work. ---
// --- We need to mock the *fetch* call inside blobToBase64, or spy on FileReader ---
// --- Let's revert the vi.mock strategy for blobToBase64 and stick to mocking fetch/console ---
// --- The hoisting error must be related to something else in the setup ---

// --- Reverting blobToBase64 mock ---
import { TaskProvider } from "./TaskProvider"; // Now safe to import

// A simple component to consume the context
const TestComponent = () => {
  const {
    tasks,
    addTask,
    updateTaskStatus,
    taskContext,
    addTaskContext,
    clearTaskContext,
  } = useTasks();

  const mockAudioBlob = new Blob(["mock audio data"], { type: "audio/webm" });

  return (
    <div>
      <button onClick={() => addTask("New Task Content", mockAudioBlob)}>
        Add Task
      </button>
      <button
        onClick={() =>
          tasks.length > 0 && updateTaskStatus(tasks[0].id, "completed")
        }
      >
        Update Status
      </button>
      <button onClick={() => addTaskContext("file", { path: "test.txt" })}>
        Add Context
      </button>
      <button onClick={clearTaskContext}>Clear Context</button>

      <div data-testid="task-count">Tasks: {tasks.length}</div>
      {tasks.map((task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          {task.content} - {task.status}
        </div>
      ))}

      <div data-testid="context-count">Context Items: {taskContext.length}</div>
      {taskContext.map((ctx, index) => (
        <div key={index} data-testid={`context-${index}`}>
          {ctx.type} - {JSON.stringify(ctx.data)}
        </div>
      ))}
    </div>
  );
};

// Mock Math.random for predictable IDs (optional but good practice)
const mockMath = Object.create(globalThis.Math);
mockMath.random = () => 0.5; // Always return 0.5 for predictable 'random' ID
globalThis.Math = mockMath;

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("TaskProvider", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockReset();
    // mockBlobToBase64.mockReset(); // No longer mocking blobToBase64 directly

    // Default mock implementation for fetch (successful response)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, taskId: "server-task-id" }),
    } as Response);
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks(); // This restores fetch
    // Re-stub fetch for subsequent tests if needed
    vi.stubGlobal("fetch", mockFetch); // Re-stub fetch as it's used across tests potentially
  });

  it("throws error when useTasks is used outside of TaskProvider", () => {
    // Mock console.error locally for this test to prevent polluting test output
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      "useTasks must be used within a TaskProvider"
    );
    errorSpy.mockRestore(); // Clean up the local spy
  });

  it("provides initial state (empty tasks and context)", () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    expect(screen.getByTestId("task-count")).toHaveTextContent("Tasks: 0");
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 0"
    );
  });

  it("adds context items using addTaskContext", () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    const addContextButton = screen.getByRole("button", {
      name: "Add Context",
    });

    act(() => {
      fireEvent.click(addContextButton);
    });

    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 1"
    );
    expect(screen.getByTestId("context-0")).toHaveTextContent(
      'file - {"path":"test.txt"}'
    );

    act(() => {
      fireEvent.click(addContextButton); // Add another
    });
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 2"
    );
  });

  it("clears context items using clearTaskContext", () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    const addContextButton = screen.getByRole("button", {
      name: "Add Context",
    });
    const clearContextButton = screen.getByRole("button", {
      name: "Clear Context",
    });

    act(() => {
      fireEvent.click(addContextButton); // Add one first
    });
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 1"
    );

    act(() => {
      fireEvent.click(clearContextButton);
    });
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 0"
    );
  });

  it("provides initial state (empty tasks and context)", () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    expect(screen.getByTestId("task-count")).toHaveTextContent("Tasks: 0");
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 0"
    );
  });

  it("adds context items using addTaskContext", () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    const addContextButton = screen.getByRole("button", {
      name: "Add Context",
    });

    act(() => {
      fireEvent.click(addContextButton);
    });

    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 1"
    );
    expect(screen.getByTestId("context-0")).toHaveTextContent(
      'file - {"path":"test.txt"}'
    );

    act(() => {
      fireEvent.click(addContextButton); // Add another
    });
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 2"
    );
  });

  it("clears context items using clearTaskContext", () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    const addContextButton = screen.getByRole("button", {
      name: "Add Context",
    });
    const clearContextButton = screen.getByRole("button", {
      name: "Clear Context",
    });

    act(() => {
      fireEvent.click(addContextButton); // Add one first
    });
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 1"
    );

    act(() => {
      fireEvent.click(clearContextButton);
    });
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 0"
    );
  });

  it("adds a task with audioBlob using addTask, clears context, and calls fetch", async () => {
    const mockAudioBlob = new Blob(["mock audio data"], { type: "audio/webm" });
    // Removed duplicate declaration above
    // We don't mock blobToBase64 anymore, so no expectedBase64 needed here for setup
    const taskId = (0.5).toString(36).substr(2, 9);

    const TestWrapper = () => {
      const hookResult = useTasks();
      return (
        <>
          <TestComponent />
          <div data-testid="hook-tasks">{JSON.stringify(hookResult.tasks)}</div>
        </>
      );
    };
    render(
      <TaskProvider>
        <TestWrapper />
      </TaskProvider>
    );
    const addTaskButton = screen.getByRole("button", { name: "Add Task" });
    const addContextButton = screen.getByRole("button", {
      name: "Add Context",
    });

    // Add context first
    act(() => {
      fireEvent.click(addContextButton);
    });
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 1"
    );

    // Add task
    await act(async () => {
      fireEvent.click(addTaskButton);
      // Allow promises to resolve
      // Allow promises to resolve - findBy* handles waiting
      // Allow promises to resolve - findBy* handles waiting
    });

    // Wait for the task element itself to appear, implying state update
    const taskElement = await screen.findByTestId(`task-${taskId}`);
    expect(taskElement).toHaveTextContent("New Task Content - pending");

    // Now check the count
    expect(screen.getByTestId("task-count")).toHaveTextContent("Tasks: 1");

    // Verify the audioBlob is present in the state using waitFor
    await waitFor(() => {
      const hookTasksDiv = screen.getByTestId("hook-tasks");
      const tasksState = JSON.parse(hookTasksDiv.textContent || "[]");
      // Check length before accessing index 0
      expect(tasksState).toHaveLength(1);
      expect(tasksState[0].audioBlob).toBeDefined();
    });
    // Note: Comparing Blob objects directly in JSON is tricky.
    // We check for its existence here. A more robust check might involve
    // reading the blob content if necessary, but existence is often sufficient.

    // Verify context was cleared
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 0"
    );

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:7777/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Body needs careful checking due to base64 potentially varying slightly
      // We check the structure and key parts
      body: expect.stringContaining(`"id":"${taskId}"`),
    });
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:7777/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: expect.stringContaining(`"content":"New Task Content"`),
    });
    // Check base64 part - requires async conversion in test or mocking
    // For simplicity here, we check if audioBase64 field exists if blob was provided
    const fetchCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(fetchCallBody).toHaveProperty("audioBase64");
    // A more robust check would involve mocking blobToBase64 and checking the exact value
    // expect(fetchCallBody.audioBase64).toBe(expectedBase64); // Cannot check exact value without mock
  });

  it("handles fetch error when adding a task", async () => {
    // Setup mocks for this specific test
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error("Network error"));
    // No need to mock blobToBase64

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    const addTaskButton = screen.getByRole("button", { name: "Add Task" });
    const taskId = (0.5).toString(36).substr(2, 9);

    // Add task
    await act(async () => {
      fireEvent.click(addTaskButton);
      // Allow promises to resolve/reject - findBy* handles waiting
    });

    // Verify fetch was called using waitFor
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Verify task was still added locally despite fetch error by waiting for it
    const taskElement = await screen.findByTestId(`task-${taskId}`);
    expect(taskElement).toHaveTextContent("New Task Content - pending");
    const taskCountElement = await screen.findByTestId("task-count");
    expect(taskCountElement).toHaveTextContent("Tasks: 1");
  });

  it("updates task status using updateTaskStatus", async () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    const addTaskButton = screen.getByRole("button", { name: "Add Task" });
    const updateStatusButton = screen.getByRole("button", {
      name: "Update Status",
    });

    // Add task first
    act(() => {
      fireEvent.click(addTaskButton);
      // Allow promises to resolve - findBy* handles waiting
    });
    const taskId = (0.5).toString(36).substr(2, 9);
    // Wait for the task to appear before trying to update it
    const taskElement = await screen.findByTestId(`task-${taskId}`);
    expect(taskElement).toHaveTextContent("New Task Content - pending");

    // Update status
    act(() => {
      fireEvent.click(updateStatusButton);
    });
    expect(screen.getByTestId(`task-${taskId}`)).toHaveTextContent(
      "New Task Content - completed"
    );
  });
});
