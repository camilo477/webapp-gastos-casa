import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App, appRoutes } from './app/App';
import { requireDemoConfiguration } from './application/configuration';
import './styles/app.css';
requireDemoConfiguration(import.meta.env);
const router=createBrowserRouter(appRoutes);
createRoot(document.getElementById('root')!).render(<StrictMode><App router={router}/></StrictMode>);
