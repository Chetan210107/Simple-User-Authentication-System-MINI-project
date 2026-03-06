import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './index.css';
import './glass.css';
import App from './components/App';
import { UserProvider } from './context/UserContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
      <ToastContainer position="top-right" autoClose={3000} />
    </UserProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
