import { io } from 'socket.io-client';

// Use explicit URL or fallback to production URL for live dev
const URL = (import.meta.env.VITE_BACKEND_URL || 'https://pulse-grid-backend.onrender.com').replace(/\/$/, '');

export const socket = io(URL, {
  autoConnect: true,
});
