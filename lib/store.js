const { getDb } = require('./db');
const { SERVICES } = require('./config');
let ready;
async function db() {
  const d = await getDb();
  if (!ready) {
    ready = (async () => {
      const safe = async (p) => { try { await p; } catch (e) { console.warn('index:', e.message); } };
      // one lock per (date, slot, seat) → unique index makes double-booking impossible
      await safe(d.collection('locks').createIndex({ date: 1, slot_id: 1, seat: 1 }, { unique: true }));
      await safe(d.collection('locks').createIndex({ ref: 1 }));
      await safe(d.collection('bookings').createIndex({ ref: 1 }, { unique: true }));
      await safe(d.collection('bookings').createIndex({ phone_key: 1 }));
      await safe(d.collection('bookings').createIndex({ created_at: -1 }));
      await safe(d.collection('blocks').createIndex({ date: 1 }, { unique: true }));
      for (const s of SERVICES) await d.collection('services').updateOne({ id: s.id }, { $setOnInsert: { ...s, active: true } }, { upsert: true });
    })().catch((e) => { ready = null; throw e; });
  }
  await ready;
  return d;
}
module.exports = { db };
