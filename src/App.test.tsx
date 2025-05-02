import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "./App";
import { FileData } from "./types/editor";

const mockFiles: FileData[] = [
  { id: "1", name: "file1.tsx", content: "const a = 1;" },
  { id: "2", name: "file2.css", content: "body { color: red; }" },
];

describe("App", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    render(<App />);
    expect(screen.getByText("Loading files...")).toBeInTheDocument();
  });

  it("renders files when fetch is successful", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockFiles,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading files...")).not.toBeInTheDocument();
    });

    // Find the file explorer section (assuming it contains the "FILES" heading)
    // and check for files within that specific section
    const fileExplorerSection = screen
      .getByText("FILES")
      .closest('div[class*="w-64"]');
    expect(fileExplorerSection).toBeInTheDocument();
    expect(fileExplorerSection).toBeInstanceOf(HTMLElement); // Add instance check

    // Check if file names are rendered within the file explorer
    // Add assertion to satisfy TypeScript
    const explorerElement = fileExplorerSection as HTMLElement;
    expect(
      within(explorerElement).getByText(mockFiles[0].name)
    ).toBeInTheDocument();
    expect(
      within(explorerElement).getByText(mockFiles[1].name)
    ).toBeInTheDocument();

    // Also check if the active file name is shown in the editor panel header
    const editorPanelHeader = screen.getByText(mockFiles[0].name, {
      selector: 'span[class*="ml-4"]',
    });
    expect(editorPanelHeader).toBeInTheDocument();
  });

  it("shows 'No files found' message when fetch returns empty array", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading files...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No files found.")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    const errorMessage = "Network Error";
    fetchMock.mockRejectedValueOnce(new Error(errorMessage));

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading files...")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(`Error: Failed to fetch files: ${errorMessage}`)
    ).toBeInTheDocument();
  });

  it("shows error message when fetch response is not ok", async () => {
    const status = 500;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: status,
      json: async () => ({ message: "Server Error" }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading files...")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(
        `Error: Failed to fetch files: HTTP error! status: ${status}`
      )
    ).toBeInTheDocument();
  });

  it("shows error message when fetch returns non-array data", async () => {
    const invalidData = { message: "This is not an array" };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading files...")).not.toBeInTheDocument();
    });

    // Check for the specific error message thrown when data is not an array
    expect(
      screen.getByText(
        "Error: Failed to fetch files: Received invalid data format from server."
      )
    ).toBeInTheDocument();
  });

  it("sets README.md as active file if it exists", async () => {
    const filesWithReadme: FileData[] = [
      { id: "file1.ts", name: "file1.ts", content: "console.log('hello');" },
      { id: "README.md", name: "README.md", content: "# Project Readme" },
      { id: "file2.css", name: "file2.css", content: "body { color: blue; }" },
    ];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => filesWithReadme,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading files...")).not.toBeInTheDocument();
    });

    // Check if README.md is the active file in the editor panel header
    const editorPanelHeader = screen.getByText("README.md", {
      selector: 'span[class*="ml-4"]',
    });
    expect(editorPanelHeader).toBeInTheDocument();
  });

  it("sets the first file as active if README.md does not exist", async () => {
    const filesWithoutReadme: FileData[] = [
      { id: "config.js", name: "config.js", content: "module.exports = {};" },
      { id: "styles.css", name: "styles.css", content: ".app { margin: 0; }" },
    ];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => filesWithoutReadme,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText("Loading files...")).not.toBeInTheDocument();
    });

    // Check if the first file is the active file in the editor panel header
    const editorPanelHeader = screen.getByText(filesWithoutReadme[0].name, {
      selector: 'span[class*="ml-4"]',
    });
    expect(editorPanelHeader).toBeInTheDocument();
  });
});
