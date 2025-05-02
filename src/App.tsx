import { useState, useEffect } from "react";
import MainLayout from "./components/layout/MainLayout";
import CodeEditorPanel from "./components/editor/CodeEditorPanel";
import { FileData } from "./types/editor";
import { TaskProvider } from "./providers/TaskProvider";

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:7777/dir");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Get raw data first

        if (Array.isArray(data)) {
          setFiles(data); // Set state only if it's an array
          if (data.length > 0) {
            const readmeFile = data.find(
              (file: FileData) => file.name === "README.md"
            );
            if (readmeFile) {
              setActiveFileId(readmeFile.id);
            } else {
              setActiveFileId(data[0].id); // Fallback to the first file
            }
          } else {
            setActiveFileId(null);
          }
        } else {
          // Handle the case where the response is not an array
          console.error("API response is not an array:", data);
          throw new Error("Received invalid data format from server.");
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(`Failed to fetch files: ${e.message}`);
        } else {
          setError("An unknown error occurred while fetching files.");
        }
        setFiles([]); // Ensure files is an empty array on error
        setActiveFileId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const activeFile = files.find((file) => file.id === activeFileId);

  if (loading) {
    return (
      <TaskProvider>
        <MainLayout>
          <div className="flex items-center justify-center h-full">
            Loading files...
          </div>
        </MainLayout>
      </TaskProvider>
    );
  }

  if (error) {
    return (
      <TaskProvider>
        <MainLayout>
          <div className="flex items-center justify-center h-full text-red-500">
            Error: {error}
          </div>
        </MainLayout>
      </TaskProvider>
    );
  }

  if (!activeFile && files.length > 0) {
    // Should ideally not happen if setActiveFileId is set correctly, but as a fallback
    setActiveFileId(files[0].id);
    return null; // Re-render triggered
  }

  return (
    <TaskProvider>
      <MainLayout>
        {files.length > 0 && activeFile ? (
          <CodeEditorPanel
            files={files}
            activeFile={activeFile}
            onFileSelect={setActiveFileId}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            No files found.
          </div>
        )}
      </MainLayout>
    </TaskProvider>
  );
}

export default App;
