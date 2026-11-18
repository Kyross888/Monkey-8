// MongoDB connection, cached across warm serverless invocations.
const { MongoClient } = require('mongodb');
let clientPromise = global._lensMongo;

function getClient() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI environment variable is not set.');
    clientPromise = global._lensMongo = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 }).connect();
  }
  return clientPromise;
}

// Own database name => completely separate from any other site on the same cluster.
async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || 'ps_service_db');
}

module.exports = { getDb };
