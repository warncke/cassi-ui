import { FileData } from '../types/editor';

export const sampleFiles: FileData[] = [
  {
    id: '1',
    name: 'src/App.tsx',
    content: `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <p>Edit <code>src/App.tsx</code> and save to reload.</p>
        <p>
          <button onClick={() => setCount(count + 1)}>
            count is: {count}
          </button>
        </p>
      </header>
    </div>
  );
}

export default App;`,
  },
  {
    id: '2',
    name: 'src/index.tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  },
  {
    id: '3',
    name: 'src/components/Button.tsx',
    content: `import React from 'react';

interface ButtonProps {
  primary?: boolean;
  size?: 'small' | 'medium' | 'large';
  label: string;
  onClick?: () => void;
}

/**
 * Primary UI component for user interaction
 */
export const Button: React.FC<ButtonProps> = ({
  primary = false,
  size = 'medium',
  label,
  onClick,
}) => {
  const baseStyle = 'rounded-md font-semibold';
  const sizeClass = {
    small: 'py-1 px-2 text-sm',
    medium: 'py-2 px-4 text-base',
    large: 'py-3 px-6 text-lg',
  };
  const colorClass = primary
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <button
      type="button"
      className={\`\${baseStyle} \${sizeClass[size]} \${colorClass}\`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};`,
  },
  {
    id: '4',
    name: 'package.json',
    content: `{
  "name": "ai-coding-project",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11"
  }
}`,
  },
  {
    id: '5',
    name: 'README.md',
    content: `# AI Coding Project

This project demonstrates an AI-assisted coding environment.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### \`npm test\`

Launches the test runner in the interactive watch mode.

### \`npm run build\`

Builds the app for production to the \`build\` folder.`,
  },
];