const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const PORT = Number(process.env.PORT || 3030);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dealership';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let dealers;
let reviews;
let client;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function connect() {
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  dealers = db.collection('dealers');
  reviews = db.collection('reviews');
  await dealers.createIndex({ dealer_id: 1 }, { unique: true });
}

app.get('/health', async (req, res) => {
  try {
    await client.db().command({ ping: 1 });
    res.json({ status: 'ok', service: 'dealership-service' });
  } catch (error) {
    res.status(503).json({ status: 'unavailable', error: error.message });
  }
});

app.get('/dealers', async (req, res, next) => {
  try {
    const list = await dealers.find({}, { projection: { _id: 0 } }).sort({ dealer_id: 1 }).toArray();
    res.json({ status: 200, dealers: list });
  } catch (error) {
    next(error);
  }
});

app.get('/dealers/:state', async (req, res, next) => {
  try {
    const state = req.params.state;
    const list = await dealers
      .find(
        { state: { $regex: `^${escapeRegex(state)}$`, $options: 'i' } },
        { projection: { _id: 0 } },
      )
      .sort({ dealer_id: 1 })
      .toArray();
    res.json({ status: 200, dealers: list, state });
  } catch (error) {
    next(error);
  }
});

app.get('/dealer/:id', async (req, res, next) => {
  try {
    const dealer_id = Number(req.params.id);
    if (!Number.isInteger(dealer_id)) {
      return res.status(400).json({ status: 400, error: 'Dealer id must be an integer' });
    }
    const dealer = await dealers.findOne({ dealer_id }, { projection: { _id: 0 } });
    if (!dealer) {
      return res.status(404).json({ status: 404, error: `Dealer ${dealer_id} not found` });
    }
    res.json({ status: 200, dealer });
  } catch (error) {
    next(error);
  }
});

app.get('/reviews/dealer/:id', async (req, res, next) => {
  try {
    const dealer_id = Number(req.params.id);
    if (!Number.isInteger(dealer_id)) {
      return res.status(400).json({ status: 400, error: 'Dealer id must be an integer' });
    }
    const list = await reviews
      .find({ dealer_id }, { projection: { _id: 0 } })
      .sort({ _id: -1 })
      .toArray();
    res.json({ status: 200, reviews: list, dealer_id });
  } catch (error) {
    next(error);
  }
});

app.post('/review', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.dealer_id || !body.review) {
      return res.status(400).json({ status: 400, error: 'dealer_id and review are required' });
    }
    const document = {
      dealer_id: Number(body.dealer_id),
      name: body.name || 'Anonymous',
      review: String(body.review),
      sentiment: body.sentiment || 'neutral',
      purchase: Boolean(body.purchase),
      purchase_date: body.purchase_date || null,
      car_make: body.car_make || '',
      car_model: body.car_model || '',
      car_year: body.car_year ? Number(body.car_year) : null,
    };
    const result = await reviews.insertOne(document);
    delete document._id;
    res.status(201).json({ status: 201, id: result.insertedId, review: document });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ status: 500, error: 'Internal server error' });
});

async function start() {
  await connect();
  const server = app.listen(PORT, () => {
    console.log(`Dealership service listening on port ${PORT}`);
  });
  const shutdown = async () => {
    server.close();
    await client.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return server;
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start dealership service:', error.message);
    process.exit(1);
  });
}

module.exports = { app, start };
