import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Toolbar from "./Toolbar";
import * as TaskProvider from "../../providers/TaskProvider";
import { Task } from "../../types/tasks";

// Mock child components and hooks
vi.mock("lucide-react", async (importOriginal) => {
  const original = await importOriginal<typeof import("lucide-react")>();
  return {
    ...original,
    ListTodo: (props: React.ComponentProps<"svg">) => (
      <svg data-testid="icon-list-todo" {...props} />
    ),
  };
});

vi.mock("../voice/RecordButton", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-record-button">Record Button</div>,
}));

vi.mock("../tasks/TaskList", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="mock-task-list">
      Task List <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock useTasks hook - allow dynamic task data per test
const mockUseTasks = vi.spyOn(TaskProvider, "useTasks");

const mockTasks: Task[] = [
  {
    id: "t1",
    content: "Task 1 content",
    timestamp: Date.now(),
    status: "pending",
    context: [],
  },
  {
    id: "t2",
    content: "Task 2 content",
    timestamp: Date.now() - 1000,
    status: "pending",
    context: [],
  },
];

describe("Toolbar", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseTasks.mockClear();
    vi.clearAllMocks(); // Clear mocks for components too
  });

  it("renders the RecordButton", () => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      addTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      taskContext: [],
      addTaskContext: vi.fn(),
      clearTaskContext: vi.fn(),
    });
    render(<Toolbar />);
    expect(screen.getByTestId("mock-record-button")).toBeInTheDocument();
  });

  it("does not render the task list button when there are no tasks", () => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      addTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      taskContext: [],
      addTaskContext: vi.fn(),
      clearTaskContext: vi.fn(),
    });
    render(<Toolbar />);
    expect(screen.queryByTestId("icon-list-todo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-task-list")).not.toBeInTheDocument();
  });

  it("renders the task list button with count when there are tasks", () => {
    mockUseTasks.mockReturnValue({
      tasks: mockTasks,
      addTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      taskContext: [],
      addTaskContext: vi.fn(),
      clearTaskContext: vi.fn(),
    });
    render(<Toolbar />);
    const button = screen.getByRole("button"); // The task list button
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("icon-list-todo")).toBeInTheDocument();
    expect(screen.getByText(mockTasks.length.toString())).toBeInTheDocument(); // Check badge count
    expect(screen.queryByTestId("mock-task-list")).not.toBeInTheDocument(); // Task list initially closed
  });

  it("opens and closes the TaskList when the button is clicked", () => {
    mockUseTasks.mockReturnValue({
      tasks: mockTasks,
      addTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      taskContext: [],
      addTaskContext: vi.fn(),
      clearTaskContext: vi.fn(),
    });
    render(<Toolbar />);

    const taskListButton = screen.getByRole("button"); // The task list button

    // Task list should not be visible initially
    expect(screen.queryByTestId("mock-task-list")).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(taskListButton);
    expect(screen.getByTestId("mock-task-list")).toBeInTheDocument();

    // Click the close button inside the mocked TaskList
    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);
    expect(screen.queryByTestId("mock-task-list")).not.toBeInTheDocument();

    // Click task list button again to re-open
    fireEvent.click(taskListButton);
    expect(screen.getByTestId("mock-task-list")).toBeInTheDocument();

    // Click task list button itself to close
    fireEvent.click(taskListButton);
    expect(screen.queryByTestId("mock-task-list")).not.toBeInTheDocument();
  });
});
