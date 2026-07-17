const app = require("./app");
const env = require("./config/env");
const { connectDb } = require("./db/connect");

async function start() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`KhabarAdda API listening on ${env.port}`);
    console.log(`Health: http://localhost:${env.port}/api/v1/health`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
