// GET /api/availability?from=&to=  → { days: { "2026-12-01": { s1: 2, s2: 0, ... } }, blocked: [dates] }
const { handler } = require('../lib/http');
const { db } = require('../lib/store');
const { isYmd, addDays, todayManila } = require('../lib/util');
const { SLOTS, SLOT_CAPACITY, MAX_AHEAD_DAYS } = require('../lib/config');
const { manilaHour } = require('../lib/booking');
module.exports = handler(async (ctx) => {
  const d = await db();
  const today = todayManila();
  const from = isYmd(ctx.query.from) && ctx.query.from > today ? ctx.query.from : today;
  const to = isYmd(ctx.query.to) && ctx.query.to < addDays(today, MAX_AHEAD_DAYS) ? ctx.query.to : addDays(today, MAX_AHEAD_DAYS);
  const locks = await d.collection('locks').find({ date: { $gte: from, $lte: to } }, { projection: { date: 1, slot_id: 1 } }).toArray();
  const blocks = await d.collection('blocks').find({ date: { $gte: from, $lte: to } }).toArray();
  const used = {};
  for (const l of locks) used[l.date + '|' + l.slot_id] = (used[l.date + '|' + l.slot_id] || 0) + 1;
  const blocked = new Set(blocks.map((b) => b.date));
  const now = manilaHour(), days = {};
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const row = {};
    for (const s of SLOTS) row[s.id] = blocked.has(day) || (day === today && s.start <= now) ? 0 : Math.max(0, SLOT_CAPACITY - (used[day + '|' + s.id] || 0));
    days[day] = row;
  }
  ctx.respond({ success: true, days, blocked: [...blocked] });
});
