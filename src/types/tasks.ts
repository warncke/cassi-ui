export interface TaskContextItem {
  type: string;
  data: Record<string, unknown>;
}

export interface Task {
  id: string;
  content: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  context: TaskContextItem[];
}

export interface TaskContextType {
  tasks: Task[];
  addTask: (content: string) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  taskContext: TaskContextItem[];
  addTaskContext: (type: string, data: Record<string, unknown>) => void;
  clearTaskContext: () => void;
}