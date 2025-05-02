import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FileExplorer from "./FileExplorer";
import { FileData } from "../../types/editor";
import * as TaskProvider from "../../providers/TaskProvider";

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const original = await importOriginal<typeof import("lucide-react")>();
  return {
    ...original,
    FileCode: (props: React.ComponentProps<"div">) => (
      <div data-testid="icon-file-code" {...props} />
    ),
    FileText: (props: React.ComponentProps<"div">) => (
      <div data-testid="icon-file-text" {...props} />
    ),
    FileJson: (props: React.ComponentProps<"div">) => (
      <div data-testid="icon-file-json" {...props} />
    ),
    ChevronRight: (props: React.ComponentProps<"div">) => (
      <div data-testid="icon-chevron-right" {...props} />
    ),
    ChevronDown: (props: React.ComponentProps<"div">) => (
      <div data-testid="icon-chevron-down" {...props} />
    ),
    // Add mocks for other icons used if needed for specific tests
  };
});

// Mock useTasks hook
const mockAddTaskContext = vi.fn();
vi.spyOn(TaskProvider, "useTasks").mockReturnValue({
  tasks: [],
  addTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  taskContext: [],
  addTaskContext: mockAddTaskContext,
  clearTaskContext: vi.fn(),
});

const mockFiles: FileData[] = [
  { id: "1", name: "src/index.ts", content: 'console.log("ts");' },
  { id: "2", name: "src/styles.css", content: "body { color: blue; }" },
  { id: "3", name: "package.json", content: "{}" },
  { id: "4", name: "README.md", content: "# Project" },
];

const mockOnFileSelect = vi.fn();

describe("FileExplorer", () => {
  beforeEach(() => {
    mockOnFileSelect.mockClear();
    mockAddTaskContext.mockClear();
  });

  it("renders the file list grouped by directory", () => {
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );

    expect(screen.getByText("FILES")).toBeInTheDocument();
    expect(screen.getByText("src")).toBeInTheDocument(); // Directory name
    expect(screen.getByText("index.ts")).toBeInTheDocument();
    expect(screen.getByText("styles.css")).toBeInTheDocument();
    expect(screen.getByText("package.json")).toBeInTheDocument(); // Root file
    expect(screen.getByText("README.md")).toBeInTheDocument(); // Root file
  });

  it("displays the correct icons for files", () => {
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );
    // Check icons based on mocked components
    expect(
      screen.getByText("index.ts").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-code");
    expect(
      screen.getByText("styles.css").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-code"); // Assuming css uses FileCode mock
    expect(
      screen.getByText("package.json").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-json");
    expect(
      screen.getByText("README.md").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-text");
  });

  it("calls onFileSelect with the correct id when a file is clicked", () => {
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );

    fireEvent.click(screen.getByText("styles.css"));
    expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
    expect(mockOnFileSelect).toHaveBeenCalledWith("2");
  });

  it("highlights the active file", () => {
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="3" // package.json
        onFileSelect={mockOnFileSelect}
      />
    );

    const activeFileElement = screen.getByText("package.json").closest("div");
    const inactiveFileElement = screen.getByText("index.ts").closest("div");

    expect(activeFileElement).toHaveClass("bg-gray-700", "text-white");
    expect(inactiveFileElement).not.toHaveClass("bg-gray-700", "text-white");
    expect(inactiveFileElement).toHaveClass("text-gray-300");
  });

  it("toggles directory expansion on click", () => {
    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );

    const dirTextElement = screen.getByText("src");
    // Find the clickable header (likely the parent div containing the icon and text)
    const clickableHeader = dirTextElement.closest("div");
    if (!clickableHeader) {
      throw new Error("Could not find clickable header for directory 'src'");
    }
    // Find the container holding the files for this directory
    // This assumes the file list container is a sibling div/ul after the header div
    const fileContainer = clickableHeader.nextElementSibling;
    if (!fileContainer) {
      throw new Error("Could not find file container for directory 'src'");
    }

    // Check initial state (assuming collapsed - check for 'hidden' class)
    expect(fileContainer).toHaveClass("hidden");
    let icon = clickableHeader.querySelector('[data-testid^="icon-chevron"]');
    expect(icon).toHaveAttribute("data-testid", "icon-chevron-right"); // Collapsed icon

    // Click to expand
    fireEvent.click(clickableHeader);
    expect(fileContainer).not.toHaveClass("hidden");
    // Re-query icon after state change
    icon = clickableHeader.querySelector('[data-testid^="icon-chevron"]');
    expect(icon).toHaveAttribute("data-testid", "icon-chevron-down"); // Expanded icon

    // Click to collapse again
    fireEvent.click(clickableHeader);
    expect(fileContainer).toHaveClass("hidden");
    // Re-query icon after state change
    icon = clickableHeader.querySelector('[data-testid^="icon-chevron"]');
    expect(icon).toHaveAttribute("data-testid", "icon-chevron-right"); // Collapsed icon
  });

  it("sets draggable attribute and handles drag start for files", () => {
    const mockDragEvent = {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: "",
      },
    } as unknown as React.DragEvent;

    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );

    const fileElement = screen.getByText("index.ts");
    expect(fileElement.closest("div")).toHaveAttribute("draggable", "true");

    fireEvent.dragStart(fileElement.closest("div")!, mockDragEvent);

    expect(mockDragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        type: "file",
        path: "src/index.ts",
        content: 'console.log("ts");',
      })
    );
    expect(mockDragEvent.dataTransfer.effectAllowed).toBe("copy");
  });

  it("sets draggable attribute and handles drag start for directories", () => {
    const mockDragEvent = {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: "",
      },
    } as unknown as React.DragEvent;

    render(
      <FileExplorer
        files={mockFiles}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );

    const dirElement = screen.getByText("src");
    expect(dirElement.closest("div")).toHaveAttribute("draggable", "true");

    fireEvent.dragStart(dirElement.closest("div")!, mockDragEvent);

    expect(mockDragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({ type: "directory", path: "src" })
    );
    expect(mockDragEvent.dataTransfer.effectAllowed).toBe("copy");
  });
});
