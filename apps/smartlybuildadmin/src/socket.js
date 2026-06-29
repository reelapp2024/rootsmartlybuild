// src/socket.js
import { io } from 'socket.io-client';

function resolveSocketUrl() {
  const raw = (import.meta.env.VITE_API_URL || '').trim();
  if (raw) {
    try {
      const u = new URL(raw.includes('://') ? raw : `http://${raw}`);
      return u.origin;
    } catch {
      /* fall through */
    }
  }
  return 'http://localhost:1111';
}

const socket = io(resolveSocketUrl(), {
  transports: ['websocket', 'polling'],
  reconnection: true,
});

export default socket;
