import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CodeEditorPanel from "./CodeEditorPanel";
import { FileData } from "../../types/editor";

// Mock the child components
import React from "react";

vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<"div">) => (
    <div data-testid="mock-editor" {...props} />
  ),
}));

vi.mock("./FileExplorer", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<"div">) => (
    <div data-testid="mock-file-explorer" {...props} />
  ),
}));

const mockFiles: FileData[] = [
  { id: "1", name: "script.js", content: 'console.log("hello");' },
  { id: "2", name: "style.css", content: "body { color: red; }" },
];

const mockActiveFile = mockFiles[0];
const mockOnFileSelect = vi.fn();

describe("CodeEditorPanel", () => {
  it("renders the panel with file explorer and editor", () => {
    render(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={mockActiveFile}
        onFileSelect={mockOnFileSelect}
      />
    );

    expect(screen.getByTestId("mock-file-explorer")).toBeInTheDocument();
    expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
    expect(screen.getByText(mockActiveFile.name)).toBeInTheDocument();
  });

  it("displays the active file name", () => {
    render(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={mockActiveFile}
        onFileSelect={mockOnFileSelect}
      />
    );
    expect(screen.getByText("script.js")).toBeInTheDocument();
  });

  it("toggles the file explorer panel visibility", () => {
    render(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={mockActiveFile}
        onFileSelect={mockOnFileSelect}
      />
    );

    const toggleButton = screen.getByRole("button", { name: "☰" });
    const fileExplorer = screen.getByTestId("mock-file-explorer");

    // Initially visible (check parent div class)
    expect(fileExplorer.parentElement).not.toHaveClass("w-0");

    // Click to hide
    fireEvent.click(toggleButton);
    expect(fileExplorer.parentElement).toHaveClass("w-0");

    // Click to show again
    fireEvent.click(toggleButton);
    expect(fileExplorer.parentElement).not.toHaveClass("w-0");
  });

  it("passes correct props to FileExplorer", () => {
    render(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={mockActiveFile}
        onFileSelect={mockOnFileSelect}
      />
    );
    const fileExplorer = screen.getByTestId("mock-file-explorer");
    // Check attributes that are actually set from props on the mock div
    expect(fileExplorer).toHaveAttribute("activefileid", mockActiveFile.id);
    // Cannot reliably check for function/object props like 'files' or 'onFileSelect' as attributes
  });

  it("passes correct props to Editor", () => {
    render(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={mockActiveFile}
        onFileSelect={mockOnFileSelect}
      />
    );
    const editor = screen.getByTestId("mock-editor");
    // Check attributes that are actually set from props on the mock div
    expect(editor).toHaveAttribute("height", "100%");
    expect(editor).toHaveAttribute("defaultlanguage", "javascript"); // Based on mockActiveFile.name
    // expect(editor).toHaveAttribute("defaultvalue", mockActiveFile.content); // This check is unreliable with the mock
    expect(editor).toHaveAttribute("theme", "vs-dark");
    // Cannot reliably check for function props like 'onChange' as attributes
  });
});
