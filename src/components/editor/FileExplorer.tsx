import React, { useState } from "react";
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
  FileCheck,
} from "lucide-react";
import { FileData } from "../../types/editor";

interface TreeNode {
  id: string;
  name: string;
  type: "directory" | "file";
  path: string;
  children?: TreeNode[];
  fileData?: FileData;
}

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

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      // JavaScript/TypeScript
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return <FileCode size={16} className="text-yellow-400" />;

      // Web files
      case "html":
        return <FileCode size={16} className="text-orange-400" />;
      case "css":
      case "scss":
      case "sass":
        return <FileCode size={16} className="text-blue-400" />;

      // Config files
      case "json":
        return <FileJson size={16} className="text-purple-400" />;
      case "yml":
      case "yaml":
        return <FileSpreadsheet size={16} className="text-green-400" />;
      case "env":
        return <FileCheck size={16} className="text-green-400" />;

      // Package files
      case "lock":
        return <Package size={16} className="text-red-400" />;

      // Documentation
      case "md":
        return <FileText size={16} className="text-blue-300" />;
      case "txt":
        return <FileText size={16} className="text-gray-400" />;

      // Config files
      case "config.js":
      case "config.ts":
        return <Settings size={16} className="text-gray-400" />;

      // Shell scripts
      case "sh":
      case "bash":
        return <FileTerminal size={16} className="text-green-400" />;

      // Images
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
        return <FileImage size={16} className="text-pink-400" />;

      // Font files
      case "ttf":
      case "otf":
      case "woff":
      case "woff2":
        return <FileType size={16} className="text-purple-300" />;

      // Default
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  const buildFileTree = (files: FileData[]): TreeNode[] => {
    const root: TreeNode = {
      id: "root",
      name: "root",
      type: "directory",
      path: "",
      children: [],
    };
    const nodeMap: Record<string, TreeNode> = { "": root };

    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));

    sortedFiles.forEach((file) => {
      const parts = file.name.split("/");
      let currentPath = "";
      let parentNode = root;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        let dirNode = nodeMap[currentPath];
        if (!dirNode) {
          dirNode = {
            id: currentPath,
            name: part,
            type: "directory",
            path: currentPath,
            children: [],
          };
          if (!parentNode.children) parentNode.children = [];
          parentNode.children.push(dirNode);
          nodeMap[currentPath] = dirNode;
        }
        parentNode = dirNode;
      }

      const fileName = parts[parts.length - 1];
      const fileNode: TreeNode = {
        id: file.id,
        name: fileName,
        type: "file",
        path: file.name,
        fileData: file,
      };
      if (!parentNode.children) parentNode.children = [];
      parentNode.children.push(fileNode);
    });

    const sortChildren = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };
    sortChildren(root);

    return root.children!;
  };

  const fileTree = buildFileTree(files);

  const toggleDirectory = (directoryPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(directoryPath)) {
        next.delete(directoryPath);
      } else {
        next.add(directoryPath);
      }
      return next;
    });
  };

  const handleDragStart = (
    e: React.DragEvent,
    item: { type: "file" | "directory"; path: string; content?: string }
  ) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const renderNode = (node: TreeNode, level: number): JSX.Element => {
    const indent = level * 16;

    if (node.type === "directory") {
      const isExpanded = expandedDirs.has(node.path);
      return (
        <div key={node.path}>
          <div
            className="text-gray-400 text-sm font-semibold py-1 flex items-center cursor-pointer hover:bg-gray-700"
            style={{ paddingLeft: `${indent + 16}px` }}
            onClick={() => toggleDirectory(node.path)}
            draggable
            onDragStart={(e) =>
              handleDragStart(e, { type: "directory", path: node.path })
            }
          >
            {isExpanded ? (
              <ChevronDown size={16} className="mr-2 flex-shrink-0" />
            ) : (
              <ChevronRight size={16} className="mr-2 flex-shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={node.id}
          className={`flex items-center py-1 text-sm cursor-pointer hover:bg-gray-700 ${
            node.id === activeFileId
              ? "bg-gray-700 text-white"
              : "text-gray-300"
          }`}
          style={{ paddingLeft: `${indent + 16 + (level > 0 ? 16 : 0)}px` }} // Adjust padding based on level
          onClick={() => onFileSelect(node.id)}
          draggable
          onDragStart={(e) =>
            handleDragStart(e, {
              type: "file",
              path: node.path,
              content: node.fileData?.content,
            })
          }
        >
          <span className="mr-2 flex-shrink-0">{getFileIcon(node.name)}</span>
          <span className="truncate">{node.name}</span>
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="font-semibold text-sm text-gray-300 px-4 py-3 mb-2 sticky top-0 bg-gray-800 z-10">
        FILES
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {fileTree.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
};

export default FileExplorer;
