import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { toast } from 'react-toastify'
const originalError = toast.error;
const originalSuccess = toast.success;
const originalInfo = toast.info;
const originalWarning = toast.warning;

toast.error = (msg, options) => { toast.dismiss(); return originalError(msg, options); };
toast.success = (msg, options) => { toast.dismiss(); return originalSuccess(msg, options); };
toast.info = (msg, options) => { toast.dismiss(); return originalInfo(msg, options); };
toast.warning = (msg, options) => { toast.dismiss(); return originalWarning(msg, options); };

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>
)
