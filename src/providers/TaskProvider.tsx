import React, { createContext, useContext, useState, useCallback } from 'react';
import { Task, TaskContextType, TaskContextItem } from '../types/tasks';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskContext, setTaskContext] = useState<TaskContextItem[]>([]);

  const addTask = useCallback((content: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      timestamp: Date.now(),
      status: 'pending',
      context: taskContext
    };
    setTasks(prev => [newTask, ...prev]);
    // Clear the context after creating the task
    setTaskContext([]);
  }, [taskContext]);

  const updateTaskStatus = useCallback((id: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status } : task
    ));
  }, []);

  const addTaskContext = useCallback((type: string, data: Record<string, unknown>) => {
    setTaskContext(prev => [...prev, { type, data }]);
  }, []);

  const clearTaskContext = useCallback(() => {
    setTaskContext([]);
  }, []);

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      updateTaskStatus,
      taskContext,
      addTaskContext,
      clearTaskContext
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};