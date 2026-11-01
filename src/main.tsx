import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Trata automaticamente atualizações de versão em produção quando novos deploys substituem chunks em cache
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Novo deploy detectado. Recarregando com a versão mais recente...');
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(<App />);
