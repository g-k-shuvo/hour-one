import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/layout/Dashboard';
import './styles/index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <Dashboard />
    </StrictMode>
  );
}
