import React, { useState } from 'react';
import { ListTodo } from 'lucide-react';
import RecordButton from '../voice/RecordButton';
import TaskList from '../tasks/TaskList';
import { useTasks } from '../../providers/TaskProvider';

const Toolbar: React.FC = () => {
  const { tasks } = useTasks();
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);

  return (
    <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-center relative">
      {tasks.length > 0 && (
        <div className="absolute left-4">
          <button
            onClick={() => setIsTaskListOpen(!isTaskListOpen)}
            className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors relative"
          >
            <ListTodo size={20} />
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {tasks.length}
            </span>
          </button>
        </div>
      )}
      
      <RecordButton />
      
      {isTaskListOpen && <TaskList tasks={tasks} onClose={() => setIsTaskListOpen(false)} />}
    </div>
  );
};

export default Toolbar;