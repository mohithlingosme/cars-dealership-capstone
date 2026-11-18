process.env.MONGODB_URI = process.env.MONGODB_URI || '';

const { MongoMemoryServer } = require('mongodb-memory-server');
const { seedDatabase } = require('./seed');

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('dealership');
  process.env.MONGODB_URI = uri;
  console.log(`Started in-process MongoDB at ${uri}`);

  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  const counts = await seedDatabase(client.db());
  await client.close();
  console.log(`Seeded MongoDB: ${counts.dealers} dealers, ${counts.reviews} reviews`);

  const { start } = require('./app');
  await start();

  const stop = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((error) => {
  console.error('Memory MongoDB startup failed:', error.message);
  process.exit(1);
});
