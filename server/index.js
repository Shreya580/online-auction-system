const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const startServer = async () => {
  await connectDB();

  require('./models/User');
  require('./models/Item');
  require('./models/Bid');

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/items', require('./routes/items'));
  app.use('/api/bids', require('./routes/bids'));

  const startAuctionCron = require('./utils/auctionCron');
  startAuctionCron();

  // Make io accessible in route files
  app.set('io', io);

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Client joins a room for a specific item
    socket.on('join_item', (itemId) => {
      socket.join(itemId);
      console.log(`Socket ${socket.id} joined room: ${itemId}`);
    });

    // Client leaves the room
    socket.on('leave_item', (itemId) => {
      socket.leave(itemId);
      console.log(`Socket ${socket.id} left room: ${itemId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

const PORT = process.env.PORT || 5000;
startServer();