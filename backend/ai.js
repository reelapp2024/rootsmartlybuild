// app.js
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const aiGeneratorRouter = require('./routes/ai_generator');
const adminV1Router = require('./routes/admin_v1');
const webappV1Router = require('./routes/webapp_v1');
const customSiteV1Router = require('./routes/custom_site_v1');
const monorepoRouter = require('./routes/monorepo');
require('dotenv').config();
const app = express();
const fileUpload = require('express-fileupload');
const cors = require('cors');
const connectDB = require('./config/db');
const Blog = require('./models/blogs'); // Corrected case to match import
const mongoose = require('mongoose');

// After DB connection and before starting the server
require('./crons/scheduler');

const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);
  socket.on('joinProject', (projectId) => {
    const room = `project_${projectId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });
  socket.on('leaveProject', (projectId) => {
    const room = `project_${projectId}`;
    socket.leave(room);
  });
});

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Redis Setup
const redis = require('redis');
const client = redis.createClient();
client.connect().catch((err) => {
  console.error('Error connecting to Redis:', err);
});

async function scanKeys(pattern) {
  const keysFound = [];
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 1000 })) {
    keysFound.push(key);
  }
  return keysFound;
}

async function deleteKeys(pattern) {
  let deletedCount = 0;
  for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 1000 })) {
    await client.del(key);
    console.log(`Deleted key: ${key}`);
    deletedCount++;
  }
  return deletedCount;
}

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
// Increase body size limit to handle large base64 images (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 },
  safeFileNames: true,
  preserveExtension: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Route definitions (API routes FIRST)
app.use('/', indexRouter);
app.use('/test', usersRouter);
app.use('/AI', aiGeneratorRouter);
app.use('/admin/v1', adminV1Router);
app.use('/webapp/v1', webappV1Router);
app.use('/api/monorepo', monorepoRouter);
app.use('/custom/v1', customSiteV1Router);

// Queue management endpoints
app.get('/api/queues', async (req, res) => {
  try {
    const keys = await scanKeys('queue*');
    res.json({ queues: keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/queues', async (req, res) => {
  try {
    const count = await deleteKeys('queue*');
    res.json({ message: 'All queues cleared', deletedCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blog redirect route (AFTER API routes)
app.get('/blog/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const projectId = process.env.VITE_PROJECT_ID;
    console.log(`Processing /blog/${slug} with projectId: ${projectId}`);

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      console.error('Invalid projectId:', projectId);
      return res.redirect('/not-found');
    }

    const blog = await Blog.findOne({
      projectId,
      $or: [
        { slug: slug.trim().toLowerCase() },
        { oldSlugs: slug.trim().toLowerCase() }
      ],
      status: 1,
    });

    if (!blog) {
      console.error(`Blog not found for slug: ${slug}`);
      return res.redirect('/not-found');
    }

    if (blog.slug !== slug.trim().toLowerCase()) {
      console.log(`Redirecting from ${slug} to ${blog.slug}`);
      return res.redirect(301, `/blog/${blog.slug}`);
    }

    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  } catch (err) {
    console.error('Error in blog route:', err);
    next(err);
  }
});

// Static files (AFTER API and blog routes)
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all for SPA (LAST)
app.get('*', (req, res) => {
  console.log(`Catch-all route hit for: ${req.originalUrl}`);
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handler
app.use(function (err, req, res, next) {
  // Check if this is an API request (starts with /admin, /api, etc.)
  const isApiRequest = req.path.startsWith('/admin') || req.path.startsWith('/api') || req.path.startsWith('/custom-site') || req.path.startsWith('/webapp');
  
  if (isApiRequest) {
    // Handle specific error types
    let statusCode = err.status || 500;
    let errorMessage = err.message || 'Internal server error';
    
    // Handle payload too large error (413)
    if (err.type === 'entity.too.large' || err.status === 413) {
      statusCode = 413;
      errorMessage = 'Payload too large. Image data may be too large. Please try uploading a smaller image or compress the image before uploading.';
    }
    
    // Return JSON for API requests
    res.status(statusCode).json({
      message: errorMessage,
      error: req.app.get('env') === 'development' ? err : {},
      status: statusCode
    });
  } else {
    // Render error page for non-API requests
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
  }
});

// Start server
const port = process.env.PORT || '1111';
const APIsMode = process.env.ProductionMode || 'N/A';
server.listen(port, async () => {
  console.log(`Server is running on port ${port}, Production Mode: ${APIsMode}`);
  await connectDB();
});










module.exports = app;