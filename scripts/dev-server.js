// scripts/dev-server.js
const express = require('express');
const path = require('path');

function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    const app = express();

    // Serve framework builds
    const frameworks = ['react', 'vue', 'svelte', 'angular', 'blazor'];
    frameworks.forEach(framework => {
      app.use(`/${framework}`, express.static(
        path.join(__dirname, '..', 'test-implementations', `${framework}-app`, 'build')
      ));
    });

    // Default route
    app.get('/', (req, res) => {
      res.send('Framework Benchmark Server');
    });

    // Start server
    const server = app.listen(port, () => {
      console.log(`Development server running at http://localhost:${port}`);
      resolve(server);
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}

// Export the startServer function
module.exports = { startServer };

// Start the server if this script is run directly
if (require.main === module) {
  startServer().catch(console.error);
}