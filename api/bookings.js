const { handler } = require('../lib/http');
const { db } = require('../lib/store');
const { createBooking, cancelBooking, publicView, last10 } = require('../lib/booking');
const { str, todayManila } = require('../lib/util');

async function find(d, ref, phone) {
  const r = str(ref, 20).toUpperCase();
  if (!r || last10(phone || '').length < 10) return null;
  const b = await d.collection('bookings').findOne({ ref: r });
  return b && b.phone_key === last10(phone) ? b : null;
}
module.exports = handler(async (ctx) => {
  const d = await db();
  if (ctx.method === 'POST' && ctx.query.action === 'cancel') {
    const b = await find(d, ctx.body.ref, ctx.body.phone);
    if (!b) return ctx.respond({ success: false, error: 'Booking not found. Check the reference and phone number.' }, 404);
    if (!['pending', 'confirmed'].includes(b.status)) return ctx.respond({ success: false, error: 'This booking can no longer be cancelled.' }, 400);
    if (b.date <= todayManila()) return ctx.respond({ success: false, error: 'Bookings for today can only be cancelled by messaging us.' }, 400);
    await cancelBooking(d, b.ref);
    return ctx.respond({ success: true });
  }
  if (ctx.method === 'POST') {
    if (str(ctx.body.website)) return ctx.respond({ success: true, booking: { ref: 'PS-OK' } }); // honeypot
    const r = await createBooking(d, ctx.body);
    if (r.error) return ctx.respond({ success: false, error: r.error }, r.status || 400);
    return ctx.respond({ success: true, booking: publicView(r.booking) }, 201);
  }
  const b = await find(d, ctx.query.ref, ctx.query.phone);
  if (!b) return ctx.respond({ success: false, error: 'Booking not found. Check the reference and phone number.' }, 404);
  ctx.respond({ success: true, booking: publicView(b) });
});
