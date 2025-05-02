import React, { createContext, useContext, useState, useCallback } from "react";
import { Task, TaskContextType, TaskContextItem } from "../types/tasks";

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read blob as base64 string"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskContext, setTaskContext] = useState<TaskContextItem[]>([]);

  const addTask = useCallback(
    async (content: string, audioBlob?: Blob) => {
      const taskId = Math.random().toString(36).substr(2, 9);
      let audioBase64: string | undefined = undefined;

      if (audioBlob) {
        try {
          audioBase64 = await blobToBase64(audioBlob);
        } catch (error) {
          console.error("Error converting audio blob to base64:", error);
        }
      }

      const taskData = {
        id: taskId,
        content,
        audioBase64,
      };

      try {
        const response = await fetch("http://localhost:7777/task", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("Task POST response:", responseData);
      } catch (error) {
        console.error("Failed to post task:", error);
      }

      const newTask: Task = {
        id: taskId,
        content,
        timestamp: Date.now(),
        status: "pending",
        context: taskContext,
        audioBlob,
      };
      setTasks((prev) => [newTask, ...prev]);
      setTaskContext([]);
    },
    [taskContext]
  );

  const updateTaskStatus = useCallback((id: string, status: Task["status"]) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task))
    );
  }, []);

  const addTaskContext = useCallback(
    (type: string, data: Record<string, unknown>) => {
      setTaskContext((prev) => [...prev, { type, data }]);
    },
    []
  );

  const clearTaskContext = useCallback(() => {
    setTaskContext([]);
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTaskStatus,
        taskContext,
        addTaskContext,
        clearTaskContext,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};
