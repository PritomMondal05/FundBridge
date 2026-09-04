import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  ioInstance.on('connection', (socket) => {
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('send_message', async (data) => {
      // Lazy load message handling or dispatch event
      try {
        const { handleSocketDirectMessage } = await import('../utils/storeUtils.js');
        await handleSocketDirectMessage(data, ioInstance);
      } catch (e) {
        console.warn('Socket direct message handling error:', e.message);
      }
    });
  });

  return ioInstance;
};

export const getIO = () => ioInstance;
