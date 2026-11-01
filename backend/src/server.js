const config = require('./config');
const { createPool, migrate } = require('./db');
const { createApp } = require('./app');

async function main() {
  const pool = createPool(config.db);
  await migrate(pool);

  const app = createApp({ pool });
  app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
}

main().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
