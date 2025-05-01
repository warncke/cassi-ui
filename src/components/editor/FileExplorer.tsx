import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown,
  FileJson,
  FileText,
  FileCode,
  FileType,
  FileImage,
  FileSpreadsheet,
  Package,
  FileTerminal,
  Settings,
  FileCheck
} from 'lucide-react';
import { FileData } from '../../types/editor';
import { useTasks } from '../../providers/TaskProvider';

interface FileExplorerProps {
  files: FileData[];
  activeFileId: string;
  onFileSelect: (fileId: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onFileSelect,
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const { addTaskContext } = useTasks();

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      // JavaScript/TypeScript
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode size={16} className="text-yellow-400" />;
      
      // Web files
      case 'html':
        return <FileCode size={16} className="text-orange-400" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <FileCode size={16} className="text-blue-400" />;
      
      // Config files
      case 'json':
        return <FileJson size={16} className="text-purple-400" />;
      case 'yml':
      case 'yaml':
        return <FileSpreadsheet size={16} className="text-green-400" />;
      case 'env':
        return <FileCheck size={16} className="text-green-400" />;
      
      // Package files
      case 'lock':
        return <Package size={16} className="text-red-400" />;
      
      // Documentation
      case 'md':
        return <FileText size={16} className="text-blue-300" />;
      case 'txt':
        return <FileText size={16} className="text-gray-400" />;
      
      // Config files
      case 'config.js':
      case 'config.ts':
        return <Settings size={16} className="text-gray-400" />;
      
      // Shell scripts
      case 'sh':
      case 'bash':
        return <FileTerminal size={16} className="text-green-400" />;
      
      // Images
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <FileImage size={16} className="text-pink-400" />;
      
      // Font files
      case 'ttf':
      case 'otf':
      case 'woff':
      case 'woff2':
        return <FileType size={16} className="text-purple-300" />;
      
      // Default
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  // Group files by directory
  const filesByDirectory: Record<string, FileData[]> = {};
  
  files.forEach(file => {
    const parts = file.name.split('/');
    const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    
    if (!filesByDirectory[directory]) {
      filesByDirectory[directory] = [];
    }
    
    filesByDirectory[directory].push(file);
  });

  const sortedDirectories = Object.keys(filesByDirectory).sort((a, b) => {
    if (a === '') return 1;
    if (b === '') return -1;
    return a.localeCompare(b);
  });

  const toggleDirectory = (directory: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(directory)) {
        next.delete(directory);
      } else {
        next.add(directory);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: { type: 'file' | 'directory', path: string, content?: string }) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderDirectory = (directory: string, dirFiles: FileData[]) => {
    const dirName = directory.split('/').pop() || '';
    const isExpanded = expandedDirs.has(directory);
    
    return (
      <div key={directory}>
        {directory && (
          <div 
            className="text-gray-400 text-sm font-semibold py-1 px-4 flex items-center cursor-pointer hover:bg-gray-700"
            onClick={() => toggleDirectory(directory)}
            draggable
            onDragStart={(e) => handleDragStart(e, { type: 'directory', path: directory })}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="mr-2" />
            ) : (
              <ChevronRight size={16} className="mr-2" />
            )}
            {dirName}
          </div>
        )}
        <div className={`${directory ? "pl-2" : ""} ${directory && !isExpanded ? "hidden" : ""}`}>
          {dirFiles.map(file => {
            const fileName = file.name.split('/').pop() || '';
              
            return (
              <div
                key={file.id}
                className={`flex items-center px-4 py-1 text-sm cursor-pointer hover:bg-gray-700 ${
                  file.id === activeFileId ? 'bg-gray-700 text-white' : 'text-gray-300'
                }`}
                onClick={() => onFileSelect(file.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, { 
                  type: 'file', 
                  path: file.name,
                  content: file.content
                })}
              >
                <span className="mr-2">{getFileIcon(fileName)}</span>
                <span className="truncate">{fileName}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="font-semibold text-sm text-gray-300 px-2 py-2 mb-2">
        FILES
      </div>
      
      {sortedDirectories.map(directory => 
        renderDirectory(directory, filesByDirectory[directory])
      )}
    </div>
  );
};

export default FileExplorer;