const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const SEED_FILE = path.resolve(__dirname, '..', 'data', 'seed.json');

function loadSeed() {
  return JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
}

async function seedDatabase(db) {
  const seed = loadSeed();
  const dealers = db.collection('dealers');
  const reviews = db.collection('reviews');

  await dealers.createIndex({ dealer_id: 1 }, { unique: true });

  for (const item of seed.dealers) {
    await dealers.updateOne(
      { dealer_id: item.id },
      {
        $set: {
          dealer_id: item.id,
          full_name: item.full_name,
          short_name: item.short_name,
          address: item.address,
          city: item.city,
          state: item.state,
          zip: item.zip,
          lat: item.lat,
          long: item.long,
        },
      },
      { upsert: true },
    );
  }

  for (const item of seed.reviews) {
    await reviews.updateOne(
      { dealer_id: item.dealer_id, name: item.name, review: item.review },
      {
        $set: {
          dealer_id: item.dealer_id,
          name: item.name,
          review: item.review,
          sentiment: item.sentiment,
          purchase: item.purchase,
          purchase_date: item.purchase_date,
          car_make: item.car_make,
          car_model: item.car_model,
          car_year: item.car_year,
        },
      },
      { upsert: true },
    );
  }

  return {
    dealers: await dealers.countDocuments(),
    reviews: await reviews.countDocuments(),
  };
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dealership';
  const client = new MongoClient(uri);
  await client.connect();
  const counts = await seedDatabase(client.db());
  console.log(`Seeded MongoDB: ${counts.dealers} dealers, ${counts.reviews} reviews`);
  await client.close();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  });
}

module.exports = { loadSeed, seedDatabase };
