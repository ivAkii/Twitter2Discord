const { spawn } = require('node:child_process');

// Start server.js first
const server = spawn('node', ['server.js'], { stdio: 'inherit' });

server.on('error', (err) => {
  console.error('Failed to start server.js:', err);
});

// Wait 1 second and then start checkFeeds.js
setTimeout(() => {
  const main = spawn('node', ['checkFeeds.js'], { stdio: 'inherit' });

  main.on('error', (err) => {
    console.error('Failed to start checkFeeds.js:', err);
  });
}, 1000); 
