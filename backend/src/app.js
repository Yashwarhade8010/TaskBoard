const express = require('express');
const cors = require('cors');
const { ZodError } = require('zod');
const tasksRouter = require('./routes/tasks');

function createApp({ pool }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/tasks', tasksRouter(pool));

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.issues });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
