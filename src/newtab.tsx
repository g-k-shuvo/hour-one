import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { Dashboard } from './components/layout/Dashboard';
import './styles/index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <Dashboard />
      </ThemeProvider>
    </StrictMode>
  );
}
