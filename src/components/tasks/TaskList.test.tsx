import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskList from "./TaskList";
import { Task, TaskContextItem } from "../../types/tasks";

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const original = await importOriginal<typeof import("lucide-react")>();
  return {
    ...original,
    CheckCircle2: (props: React.ComponentProps<"svg">) => (
      <svg data-testid="icon-check" {...props} />
    ),
    XCircle: (props: React.ComponentProps<"svg">) => (
      <svg data-testid="icon-x" {...props} />
    ),
    Clock: (props: React.ComponentProps<"svg">) => (
      <svg data-testid="icon-clock" {...props} />
    ),
  };
});

const mockContext1: TaskContextItem[] = [
  { type: "file", data: { path: "src/component.tsx" } },
];
const mockContext2: TaskContextItem[] = [
  { type: "directory", data: { path: "src/utils" } }, // Test directory path formatting
  { type: "file", data: { path: "src/utils/helper.ts" } },
];

const mockTasks: Task[] = [
  {
    id: "t1",
    content: "Implement feature A",
    timestamp: 1678886400000,
    status: "pending",
    context: mockContext1,
  },
  {
    id: "t2",
    content: "Fix bug B",
    timestamp: 1678886460000,
    status: "completed",
    context: [],
  },
  {
    id: "t3",
    content: "Refactor module C",
    timestamp: 1678886520000,
    status: "failed",
    context: mockContext2,
  },
];

const mockOnClose = vi.fn();

describe("TaskList", () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    vi.clearAllMocks();
  });

  it("renders the title and close button", () => {
    render(<TaskList tasks={mockTasks} onClose={mockOnClose} />);
    expect(screen.getByText("Active Tasks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "×" })).toBeInTheDocument();
  });

  it("renders the correct number of tasks", () => {
    render(<TaskList tasks={mockTasks} onClose={mockOnClose} />);
    // Check for specific task content directly
    expect(screen.getByText("Implement feature A")).toBeInTheDocument();
    expect(screen.getByText("Fix bug B")).toBeInTheDocument();
    expect(screen.getByText("Refactor module C")).toBeInTheDocument();
  });

  it("displays task content, timestamp, and context", () => {
    render(<TaskList tasks={mockTasks} onClose={mockOnClose} />);
    const task1 = screen.getByText("Implement feature A");
    const task3 = screen.getByText("Refactor module C");

    // Check content
    expect(task1).toBeInTheDocument();
    // Check timestamp (just check if it's rendered, format depends on locale)
    expect(
      screen.getByText(new Date(mockTasks[0].timestamp).toLocaleTimeString())
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date(mockTasks[2].timestamp).toLocaleTimeString())
    ).toBeInTheDocument();

    // Check context for task 1
    const task1Context = task1
      .closest("div")
      ?.querySelector(".text-xs.text-gray-500");
    expect(task1Context).toHaveTextContent("file:");
    expect(task1Context).toHaveTextContent("src/component.tsx");

    // Check context for task 3 (includes directory formatting check)
    const task3Context = task3
      .closest("div")
      ?.querySelector(".text-xs.text-gray-500");
    expect(task3Context).toHaveTextContent("directory:");
    expect(task3Context).toHaveTextContent("src/utils/"); // Note the trailing slash
    expect(task3Context).toHaveTextContent("file:");
    expect(task3Context).toHaveTextContent("src/utils/helper.ts");
  });

  it("displays the correct status icons", () => {
    render(<TaskList tasks={mockTasks} onClose={mockOnClose} />);
    // Find the main container div for each task item
    const task1Container = screen
      .getByText("Implement feature A")
      .closest(".flex.items-center.gap-3");
    const task2Container = screen
      .getByText("Fix bug B")
      .closest(".flex.items-center.gap-3");
    const task3Container = screen
      .getByText("Refactor module C")
      .closest(".flex.items-center.gap-3");

    // Query for the icon within the specific task container
    expect(
      task1Container?.querySelector('[data-testid="icon-clock"]')
    ).toBeInTheDocument(); // Pending
    expect(
      task2Container?.querySelector('[data-testid="icon-check"]')
    ).toBeInTheDocument(); // Completed
    expect(
      task3Container?.querySelector('[data-testid="icon-x"]')
    ).toBeInTheDocument(); // Failed
  });

  it("calls onClose when the close button is clicked", () => {
    render(<TaskList tasks={mockTasks} onClose={mockOnClose} />);
    const closeButton = screen.getByRole("button", { name: "×" });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders correctly with no tasks", () => {
    render(<TaskList tasks={[]} onClose={mockOnClose} />);
    expect(screen.getByText("Active Tasks")).toBeInTheDocument();
    expect(screen.queryByText(/Task /)).not.toBeInTheDocument(); // No task content
  });

  it("renders correctly with tasks having no context", () => {
    const taskNoContext: Task[] = [
      {
        id: "t4",
        content: "Task without context",
        timestamp: Date.now(),
        status: "pending",
        context: [],
      },
    ];
    render(<TaskList tasks={taskNoContext} onClose={mockOnClose} />);
    const taskElement = screen.getByText("Task without context");
    expect(taskElement).toBeInTheDocument();
    // Check that no context div is rendered
    expect(
      taskElement.closest("div")?.querySelector(".text-xs.text-gray-500")
    ).toBeNull();
  });
});
