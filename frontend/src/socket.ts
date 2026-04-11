import { io } from 'socket.io-client';

// Use explicit URL or fallback to localhost:5000 for local dev
const URL = import.meta.env.VITE_BACKEND_URL || '';

export const socket = io(URL, {
  autoConnect: true,
});
