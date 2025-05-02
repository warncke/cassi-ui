import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskProvider, useTasks } from "./TaskProvider";
// Task and TaskContextItem removed as they are not directly used in the test logic

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

  return (
    <div>
      <button onClick={() => addTask("New Task Content")}>Add Task</button>
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

describe("TaskProvider", () => {
  it("throws error when useTasks is used outside of TaskProvider", () => {
    // Suppress console.error for this specific test
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      "useTasks must be used within a TaskProvider"
    );
    consoleErrorSpy.mockRestore(); // Restore console.error
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

  it("adds a task using addTask and clears context", () => {
    render(
      <TaskProvider>
        <TestComponent />
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
    act(() => {
      fireEvent.click(addTaskButton);
    });

    expect(screen.getByTestId("task-count")).toHaveTextContent("Tasks: 1");
    // ID is predictable because Math.random is mocked
    const taskId = (0.5).toString(36).substr(2, 9);
    const taskElement = screen.getByTestId(`task-${taskId}`);
    expect(taskElement).toHaveTextContent("New Task Content - pending");

    // Verify context was cleared
    expect(screen.getByTestId("context-count")).toHaveTextContent(
      "Context Items: 0"
    );
  });

  it("updates task status using updateTaskStatus", () => {
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
    });
    const taskId = (0.5).toString(36).substr(2, 9);
    expect(screen.getByTestId(`task-${taskId}`)).toHaveTextContent(
      "New Task Content - pending"
    );

    // Update status
    act(() => {
      fireEvent.click(updateStatusButton);
    });
    expect(screen.getByTestId(`task-${taskId}`)).toHaveTextContent(
      "New Task Content - completed"
    );
  });
});
