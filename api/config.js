// GET /api/config → everything the booking page needs
const { handler } = require('../lib/http');
const { db } = require('../lib/store');
const { SHOP, SLOTS, CONSOLES, AREAS, MAX_AHEAD_DAYS } = require('../lib/config');
const { todayManila, addDays } = require('../lib/util');
module.exports = handler(async (ctx) => {
  const d = await db();
  const services = await d.collection('services').find({ active: true }).sort({ sort: 1 }).toArray();
  const today = todayManila();
  ctx.respond({ success: true, today, last_day: addDays(today, MAX_AHEAD_DAYS), shop: SHOP, consoles: CONSOLES, areas: AREAS,
    slots: SLOTS.map(({ id, label }) => ({ id, label })),
    services: services.map((s) => ({ id: s.id, name: s.name, description: s.description, price: s.price })) });
});
