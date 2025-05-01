import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Task } from '../../types/tasks';

interface TaskListProps {
  tasks: Task[];
  onClose: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onClose }) => {
  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-blue-500 animate-pulse" />;
    }
  };

  const formatPath = (path: string) => {
    // If it's a directory, ensure it ends with a forward slash
    if (path.indexOf('.') === -1) {
      return path.endsWith('/') ? path : `${path}/`;
    }
    return path;
  };

  return (
    <div className="absolute bottom-16 left-0 w-80 bg-gray-800 border border-gray-700 rounded-tr-lg shadow-lg">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-200">Active Tasks</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 border-b border-gray-700 flex items-center gap-3"
          >
            {getStatusIcon(task.status)}
            <div className="flex-grow">
              <span className="text-sm text-gray-300 block">{task.content}</span>
              {task.context && task.context.length > 0 && (
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  {task.context.map((ctx, index) => (
                    <div key={index} className="flex gap-1">
                      <span className="font-medium">{ctx.type}:</span>
                      <span className="font-mono">{formatPath(ctx.data.path as string)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {new Date(task.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;