import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import FileExplorer from './FileExplorer';
import { FileData } from '../../types/editor';

interface CodeEditorPanelProps {
  files: FileData[];
  activeFile: FileData;
  onFileSelect: (fileId: string) => void;
}

const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({
  files,
  activeFile,
  onFileSelect,
}) => {
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      console.log('File content changed:', value);
      // TODO: Update file content in state
    }
  };

  // Determine language based on file extension
  const getLanguage = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="flex h-full">
      {/* File Explorer */}
      <div
        className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
          isPanelExpanded ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <FileExplorer
          files={files}
          activeFileId={activeFile.id}
          onFileSelect={onFileSelect}
        />
      </div>

      {/* Editor */}
      <div className="flex-grow flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center">
          <button
            onClick={togglePanel}
            className="text-gray-400 hover:text-white p-1 rounded"
          >
            ☰
          </button>
          <span className="ml-4 text-sm font-mono truncate">
            {activeFile.name}
          </span>
        </div>
        <div className="flex-grow">
          <Editor
            height="100%"
            defaultLanguage={getLanguage(activeFile.name)}
            defaultValue={activeFile.content}
            theme="vs-dark"
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
              fontSize: 14,
              lineHeight: 1.5,
              automaticLayout: true,
              readOnly: true,
              domReadOnly: true,
              contextmenu: false,
              cursorStyle: 'line-thin',
              renderValidationDecorations: 'off',
              selectionHighlight: false,
              occurrencesHighlight: false,
              renderLineHighlight: 'none',
              matchBrackets: 'never',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPanel;