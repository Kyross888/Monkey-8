const crypto = require('crypto');
const { handler } = require('../lib/http');
const { db } = require('../lib/store');
const { createBooking, cancelBooking } = require('../lib/booking');
const { str, isYmd, todayManila } = require('../lib/util');
const { SLOTS, CONSOLES, AREAS } = require('../lib/config');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

module.exports = handler(async (ctx) => {
  const action = ctx.query.action || '';
  if (action === 'login') {
    const pw = process.env.ADMIN_PASSWORD;
    if (!pw) return ctx.respond({ success: false, error: 'ADMIN_PASSWORD is not set on the server.' }, 500);
    await new Promise((r) => setTimeout(r, 400));
    if (!same(ctx.body.password || '', pw)) return ctx.respond({ success: false, error: 'Wrong password.' }, 401);
    ctx.setAdmin(true); return ctx.respond({ success: true });
  }
  if (action === 'logout') { ctx.setAdmin(false); return ctx.respond({ success: true }); }
  if (!ctx.isAdmin()) return ctx.respond({ success: false, error: 'Please log in.', login: true }, 401);
  if (action === 'me') return ctx.respond({ success: true });
  const d = await db();

  if (action === 'bookings') {
    const q = {};
    if (ctx.query.status && ctx.query.status !== 'all') q.status = ctx.query.status;
    if (isYmd(ctx.query.date)) q.date = ctx.query.date;
    const s = str(ctx.query.q, 60);
    if (s) { const rx = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); q.$or = [{ ref: rx }, { name: rx }, { phone: rx }, { service_name: rx }, { address: rx }]; }
    const rows = await d.collection('bookings').find(q).sort({ date: -1, time_label: 1 }).limit(300).toArray();
    const all = await d.collection('bookings').find({}, { projection: { status: 1, total: 1 } }).toArray();
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }; let revenue = 0;
    for (const b of all) { counts[b.status] = (counts[b.status] || 0) + 1; if (['confirmed', 'completed'].includes(b.status)) revenue += b.total || 0; }
    return ctx.respond({ success: true, bookings: rows.map(({ _id, phone_key, ...b }) => b), counts, revenue });
  }
  if (action === 'set_status' && ctx.method === 'POST') {
    const b = await d.collection('bookings').findOne({ ref: str(ctx.body.ref, 20) }), status = ctx.body.status;
    if (!b) return ctx.respond({ success: false, error: 'Booking not found.' }, 404);
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) return ctx.respond({ success: false, error: 'Bad status.' }, 400);
    if (b.status === 'cancelled' && status !== 'cancelled') return ctx.respond({ success: false, error: 'A cancelled booking cannot be reopened. Create a new one.' }, 400);
    if (status === 'cancelled') await cancelBooking(d, b.ref);
    else await d.collection('bookings').updateOne({ ref: b.ref }, { $set: { status, updated_at: new Date() } });
    return ctx.respond({ success: true });
  }
  if (action === 'add_booking' && ctx.method === 'POST') {
    const r = await createBooking(d, ctx.body, { admin: true });
    if (r.error) return ctx.respond({ success: false, error: r.error }, r.status || 400);
    return ctx.respond({ success: true, ref: r.booking.ref });
  }
  if (action === 'options') return ctx.respond({ success: true, consoles: CONSOLES, areas: AREAS, slots: SLOTS });
  if (action === 'services') {
    const s = await d.collection('services').find({}).sort({ sort: 1 }).toArray();
    return ctx.respond({ success: true, services: s.map(({ _id, ...x }) => x) });
  }
  if (action === 'save_service' && ctx.method === 'POST') {
    const b = ctx.body, set = { name: str(b.name, 80), description: str(b.description, 300), price: Math.max(0, Math.round(Number(b.price) || 0)), active: !!b.active };
    if (!set.name) return ctx.respond({ success: false, error: 'Name is required.' }, 400);
    let id = str(b.id, 40);
    if (!id) { // new service
      id = 'svc-' + crypto.randomBytes(3).toString('hex');
      const n = await d.collection('services').countDocuments({});
      await d.collection('services').insertOne({ id, sort: n + 1, ...set });
      return ctx.respond({ success: true });
    }
    const r = await d.collection('services').updateOne({ id }, { $set: set });
    return r.matchedCount ? ctx.respond({ success: true }) : ctx.respond({ success: false, error: 'Service not found.' }, 404);
  }
  if (action === 'blocks') {
    const rows = await d.collection('blocks').find({ date: { $gte: todayManila() } }).sort({ date: 1 }).toArray();
    return ctx.respond({ success: true, blocks: rows.map((r) => ({ date: r.date, reason: r.reason || '' })) });
  }
  if (action === 'block' && ctx.method === 'POST') {
    const date = str(ctx.body.date, 10);
    if (!isYmd(date)) return ctx.respond({ success: false, error: 'Choose a valid date.' }, 400);
    await d.collection('blocks').updateOne({ date }, { $set: { date, reason: str(ctx.body.reason, 80) } }, { upsert: true });
    return ctx.respond({ success: true, message: 'Day blocked. Existing bookings on that day are not changed.' });
  }
  if (action === 'unblock' && ctx.method === 'POST') {
    await d.collection('blocks').deleteMany({ date: str(ctx.body.date, 10) });
    return ctx.respond({ success: true });
  }
  ctx.respond({ success: false, error: 'Unknown action.' }, 400);
});
