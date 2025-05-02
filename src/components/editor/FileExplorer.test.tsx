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

const mockFilesNested: FileData[] = [
  { id: "1", name: "src/index.ts", content: 'console.log("ts");' },
  { id: "2", name: "src/components/Button.tsx", content: "<button />" },
  { id: "3", name: "src/components/Input.tsx", content: "<input />" },
  { id: "4", name: "package.json", content: "{}" },
  { id: "5", name: "README.md", content: "# Project" },
  { id: "6", name: "src/utils/helpers.ts", content: "export const x = 1;" },
  { id: "7", name: "src/components/nested/Deep.ts", content: "class Deep {}" },
];

const mockOnFileSelect = vi.fn();

describe("FileExplorer", () => {
  beforeEach(() => {
    mockOnFileSelect.mockClear();
    mockAddTaskContext.mockClear();
  });

  it("renders the nested file structure correctly", () => {
    render(
      <FileExplorer
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );

    expect(screen.getByText("FILES")).toBeInTheDocument();
    // Root files
    expect(screen.getByText("package.json")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
    // Top-level directory
    expect(screen.getByText("src")).toBeInTheDocument();

    // Files/dirs inside 'src' should initially not be in the DOM
    expect(screen.queryByText("index.ts")).toBeNull();
    expect(screen.queryByText("components")).toBeNull();
    expect(screen.queryByText("utils")).toBeNull();

    // Expand 'src'
    fireEvent.click(screen.getByText("src").closest("div")!);
    expect(screen.getByText("index.ts")).toBeVisible();
    expect(screen.getByText("components")).toBeVisible(); // Nested directory
    expect(screen.getByText("utils")).toBeVisible(); // Nested directory

    // Files/dirs inside 'components' should initially not be in the DOM
    expect(screen.queryByText("Button.tsx")).toBeNull();
    expect(screen.queryByText("Input.tsx")).toBeNull();
    expect(screen.queryByText("nested")).toBeNull();

    // Expand 'components'
    fireEvent.click(screen.getByText("components").closest("div")!);
    expect(screen.getByText("Button.tsx")).toBeVisible();
    expect(screen.getByText("Input.tsx")).toBeVisible();
    expect(screen.getByText("nested")).toBeVisible(); // Deeply nested dir

    // Files inside 'nested' should initially not be in the DOM
    expect(screen.queryByText("Deep.ts")).toBeNull();

    // Expand 'nested'
    fireEvent.click(screen.getByText("nested").closest("div")!);
    expect(screen.getByText("Deep.ts")).toBeVisible();

    // Expand 'utils'
    fireEvent.click(screen.getByText("utils").closest("div")!);
    expect(screen.getByText("helpers.ts")).toBeVisible();
  });

  it("displays the correct icons for files", () => {
    render(
      <FileExplorer
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );
    // Expand necessary directories to make files visible
    fireEvent.click(screen.getByText("src").closest("div")!);
    fireEvent.click(screen.getByText("components").closest("div")!);
    fireEvent.click(screen.getByText("nested").closest("div")!);
    fireEvent.click(screen.getByText("utils").closest("div")!);

    // Check icons based on mocked components
    expect(
      screen.getByText("index.ts").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-code"); // .ts
    expect(
      screen.getByText("Button.tsx").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-code"); // .tsx
    expect(
      screen.getByText("Input.tsx").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-code"); // .tsx
    expect(
      screen.getByText("package.json").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-json"); // .json
    expect(
      screen.getByText("README.md").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-text"); // .md
    expect(
      screen.getByText("helpers.ts").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-code"); // .ts
    expect(
      screen.getByText("Deep.ts").previousSibling?.firstChild
    ).toHaveAttribute("data-testid", "icon-file-code"); // .ts
  });

  it("calls onFileSelect with the correct id when a file is clicked", () => {
    render(
      <FileExplorer
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );
    // Expand directories to make the file clickable
    fireEvent.click(screen.getByText("src").closest("div")!);
    fireEvent.click(screen.getByText("components").closest("div")!);

    fireEvent.click(screen.getByText("Button.tsx"));
    expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
    expect(mockOnFileSelect).toHaveBeenCalledWith("2"); // Button.tsx has id '2'
  });

  it("highlights the active file", () => {
    render(
      <FileExplorer
        files={mockFilesNested}
        activeFileId="4" // package.json
        onFileSelect={mockOnFileSelect}
      />
    );
    // Expand src to make index.ts visible
    fireEvent.click(screen.getByText("src").closest("div")!);

    const activeFileElement = screen.getByText("package.json").closest("div");
    const inactiveFileElement = screen.getByText("index.ts").closest("div");

    expect(activeFileElement).toHaveClass("bg-gray-700", "text-white");
    expect(inactiveFileElement).not.toHaveClass("bg-gray-700", "text-white");
    expect(inactiveFileElement).toHaveClass("text-gray-300");
  });

  it("toggles nested directory expansion correctly", () => {
    render(
      <FileExplorer
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );

    const srcHeader = screen.getByText("src").closest("div")!;

    // Initially, components and nested are not visible
    expect(screen.queryByText("components")).toBeNull();
    expect(screen.queryByText("nested")).toBeNull();
    expect(screen.queryByText("Deep.ts")).toBeNull();

    // Expand src
    fireEvent.click(srcHeader);
    // Now query for componentsHeader and nestedHeader as they should exist
    const componentsHeader = screen.getByText("components").closest("div")!;
    expect(screen.getByText("components")).toBeVisible();
    expect(screen.getByText("utils")).toBeVisible();
    expect(screen.queryByText("nested")).toBeNull(); // nested is inside components, still hidden
    expect(screen.queryByText("Deep.ts")).toBeNull();

    // Expand components
    fireEvent.click(componentsHeader);
    const nestedHeader = screen.getByText("nested").closest("div")!; // Query now
    expect(screen.getByText("nested")).toBeVisible();
    expect(screen.queryByText("Deep.ts")).toBeNull(); // Deep.ts is inside nested, still hidden

    // Expand nested
    fireEvent.click(nestedHeader);
    expect(screen.getByText("Deep.ts")).toBeVisible();

    // Collapse components (should hide nested and Deep.ts)
    fireEvent.click(componentsHeader);
    expect(screen.queryByText("nested")).toBeNull();
    expect(screen.queryByText("Deep.ts")).toBeNull();

    // Collapse src (should hide components, utils, index.ts)
    fireEvent.click(srcHeader);
    expect(screen.queryByText("components")).toBeNull();
    expect(screen.queryByText("utils")).toBeNull();
    expect(screen.queryByText("index.ts")).toBeNull();
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
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );
    // Expand directories to make file visible
    fireEvent.click(screen.getByText("src").closest("div")!);
    fireEvent.click(screen.getByText("components").closest("div")!);

    const fileElement = screen.getByText("Button.tsx");
    const fileDiv = fileElement.closest("div")!;
    expect(fileDiv).toHaveAttribute("draggable", "true");

    fireEvent.dragStart(fileDiv, mockDragEvent);

    expect(mockDragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        type: "file",
        path: "src/components/Button.tsx", // Correct path
        content: "<button />",
      })
    );
    expect(mockDragEvent.dataTransfer.effectAllowed).toBe("copy");
  });

  it("sets draggable attribute and handles drag start for nested directories", () => {
    const mockDragEvent = {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: "",
      },
    } as unknown as React.DragEvent;

    render(
      <FileExplorer
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );
    // Expand src to make components visible
    fireEvent.click(screen.getByText("src").closest("div")!);

    const dirElement = screen.getByText("components");
    const dirDiv = dirElement.closest("div")!;
    expect(dirDiv).toHaveAttribute("draggable", "true");

    fireEvent.dragStart(dirDiv, mockDragEvent);

    expect(mockDragEvent.dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({ type: "directory", path: "src/components" }) // Correct nested path
    );
    expect(mockDragEvent.dataTransfer.effectAllowed).toBe("copy");
  });

  it("renders the FILES header as sticky", () => {
    render(
      <FileExplorer
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );
    // Find the div containing the "FILES" text
    const headerDiv = screen.getByText("FILES").closest("div");
    expect(headerDiv).toHaveClass("sticky", "top-0", "bg-gray-800", "z-10");
  });

  it("renders the file tree container with overflow and custom scrollbar", () => {
    const { container } = render(
      // Use container from render result
      <FileExplorer
        files={mockFilesNested}
        activeFileId="1"
        onFileSelect={mockOnFileSelect}
      />
    );
    // Select the scrollable container using its class
    const scrollableContainer = container.querySelector(".custom-scrollbar");

    expect(scrollableContainer).toBeInTheDocument(); // First check if it exists
    expect(scrollableContainer).toHaveClass(
      "flex-grow",
      "overflow-y-auto",
      "custom-scrollbar"
    );
  });
});
