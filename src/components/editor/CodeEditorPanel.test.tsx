import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CodeEditorPanel from "./CodeEditorPanel"; // Import the component
import { FileData } from "../../types/editor";

import React from "react";
// Import Editor and EditorProps for mocking
import Editor, { EditorProps } from "@monaco-editor/react";

// Mock FileExplorer using hoisted vi.mock
vi.mock("./FileExplorer", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<"div">) => (
    <div data-testid="mock-file-explorer" {...props} />
  ),
}));

// Mock Monaco Editor using hoisted vi.mock
vi.mock("@monaco-editor/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@monaco-editor/react")>();
  // Create the mock function *inside* the factory
  const MockEditorComponent = vi.fn(
    (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      props: EditorProps
    ) => <div data-testid="mock-editor" /> // Render the mock div
  );
  return {
    ...actual, // Preserve other exports like EditorProps if needed
    __esModule: true,
    default: MockEditorComponent, // Export the mock function as default
  };
});

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

  it("passes correct props to Editor initially", () => {
    render(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={mockActiveFile} // script.js
        onFileSelect={mockOnFileSelect}
      />
    );
    // Use vi.mocked to get typed access to the mock
    const editorProps = vi.mocked(Editor).mock.calls[0][0];

    // Key is handled by React, not passed as a prop in the object
    expect(editorProps.height).toBe("100%");
    expect(editorProps.language).toBe("javascript"); // Based on mockActiveFile.name
    expect(editorProps.value).toBe(mockActiveFile.content);
    expect(editorProps.theme).toBe("vs-dark");
    expect(editorProps.options).toBeDefined();
  });

  it("updates Editor props when activeFile changes", () => {
    const { rerender } = render(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={mockFiles[0]} // script.js
        onFileSelect={mockOnFileSelect}
      />
    );

    // Clear previous mock calls before rerender
    vi.mocked(Editor).mockClear();

    const newActiveFile = mockFiles[1]; // style.css
    rerender(
      <CodeEditorPanel
        files={mockFiles}
        activeFile={newActiveFile}
        onFileSelect={mockOnFileSelect}
      />
    );

    // Use vi.mocked to get typed access to the mock
    const editorProps = vi.mocked(Editor).mock.calls[0][0];

    expect(screen.getByText(newActiveFile.name)).toBeInTheDocument(); // Check file name in header
    // Key is handled by React, not passed as a prop in the object
    expect(editorProps.language).toBe("css"); // Based on newActiveFile.name
    expect(editorProps.value).toBe(newActiveFile.content);
  });
});
