import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const params = new URLSearchParams(window.location.search);
const windowType = params.get('window') ?? 'controller';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App windowType={windowType as 'controller' | 'prompter'} />
  </React.StrictMode>
);
