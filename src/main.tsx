import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App, appRoutes } from './app/App';
import './styles/app.css';
const router=createBrowserRouter(appRoutes);
createRoot(document.getElementById('root')!).render(<StrictMode><App router={router}/></StrictMode>);
