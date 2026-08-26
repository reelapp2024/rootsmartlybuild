// src/socket.js
import { io } from 'socket.io-client';
import { resolveBackendUrl } from './lib/backendUrl';

const socket = io(resolveBackendUrl() || undefined, {
  transports: ['websocket', 'polling'],
  reconnection: true,
});

export default socket;
