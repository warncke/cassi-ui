import { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import CodeEditorPanel from './components/editor/CodeEditorPanel';
import { FileData } from './types/editor';
import { sampleFiles } from './data/sampleFiles';
import { TaskProvider } from './providers/TaskProvider';

function App() {
  const [files, setFiles] = useState<FileData[]>(sampleFiles);
  const [activeFileId, setActiveFileId] = useState<string>(sampleFiles[0].id);

  const activeFile = files.find(file => file.id === activeFileId) || files[0];

  return (
    <TaskProvider>
      <MainLayout>
        <CodeEditorPanel 
          files={files}
          activeFile={activeFile}
          onFileSelect={setActiveFileId}
        />
      </MainLayout>
    </TaskProvider>
  );
}

export default App;