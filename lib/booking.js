const { SLOTS, SLOT_CAPACITY, CONSOLES, AREAS, MAX_AHEAD_DAYS } = require('./config');
const { isYmd, todayManila, addDays, makeRef, str, normPhone } = require('./util');

const ACTIVE = ['pending', 'confirmed'];
const last10 = (p) => normPhone(p).replace(/\D/g, '').slice(-10);
function manilaHour() { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.getUTCHours() + d.getUTCMinutes() / 60; }

async function takeSeat(db, date, slot_id, ref) {
  for (let seat = 1; seat <= SLOT_CAPACITY; seat++) {
    try { await db.collection('locks').insertOne({ date, slot_id, seat, ref, created_at: new Date() }); return seat; }
    catch (e) { if (!(e && (e.code === 11000 || /duplicate/i.test(e.message || '')))) throw e; }
  }
  return 0;
}

async function createBooking(db, input, { admin = false } = {}) {
  const service = await db.collection('services').findOne({ id: str(input.service_id, 40) });
  if (!service || (!service.active && !admin)) return { error: 'Please choose a service.', status: 400 };
  const con = CONSOLES.find((c) => c.id === input.console_id);
  if (!con) return { error: 'Please choose your console.', status: 400 };
  const storage = con.storage.includes(input.storage) ? input.storage : '';
  if (!storage) return { error: 'Please choose the storage size.', status: 400 };

  const mode = input.mode === 'shop' ? 'shop' : 'home';
  let area = null, address = '', landmark = '';
  if (mode === 'home') {
    area = AREAS.find((a) => a.id === input.area_id);
    address = str(input.address, 200); landmark = str(input.landmark, 120);
    if (!area) return { error: 'Please choose your area.', status: 400 };
    if (address.length < 5) return { error: 'Please enter your street, barangay and house details.', status: 400 };
  }

  const date = str(input.date, 10), today = todayManila();
  if (!isYmd(date)) return { error: 'Please choose a date.', status: 400 };
  if (!admin && (date < today || date > addDays(today, MAX_AHEAD_DAYS))) return { error: 'That date is not available.', status: 400 };
  const slot = SLOTS.find((s) => s.id === input.slot_id);
  if (!slot) return { error: 'Please choose a time.', status: 400 };
  if (!admin && date === today && slot.start <= manilaHour()) return { error: 'That time has already passed today. Pick a later time.', status: 400 };
  if (await db.collection('blocks').findOne({ date })) return { error: 'Sorry, we are not available on that day.', status: 409 };

  const name = str(input.name, 80), phone = normPhone(input.phone);
  if (name.length < 2) return { error: 'Please enter your full name.', status: 400 };
  if (last10(phone).length < 10) return { error: 'Please enter a valid mobile number.', status: 400 };
  if (!admin) {
    const open = await db.collection('bookings').countDocuments({ phone_key: last10(phone), status: { $in: ACTIVE }, date: { $gte: today } });
    if (open >= 3) return { error: 'You already have 3 upcoming bookings. Message us to book more.', status: 429 };
  }

  let ref = makeRef();
  for (let i = 0; i < 4 && (await db.collection('bookings').findOne({ ref }, { projection: { _id: 1 } })); i++) ref = makeRef();
  const seat = await takeSeat(db, date, slot.id, ref);
  if (!seat) return { error: 'That time was just taken. Please pick another time.', status: 409 };

  const fee = area ? area.fee : 0;
  const booking = {
    ref, service_id: service.id, service_name: service.name, console_id: con.id, console_name: con.name, storage,
    mode, area_id: area ? area.id : '', area_name: area ? area.name : '', address, landmark,
    date, slot_id: slot.id, time_label: slot.label, seat,
    name, phone, phone_key: last10(phone), email: str(input.email, 120), facebook: str(input.facebook, 120), notes: str(input.notes, 400),
    service_price: service.price, travel_fee: fee, total: service.price + fee,
    status: admin ? 'confirmed' : 'pending', source: admin ? 'admin' : 'website',
    created_at: new Date(), updated_at: new Date(),
  };
  try { await db.collection('bookings').insertOne(booking); }
  catch (e) { await db.collection('locks').deleteMany({ ref }); throw e; }
  return { booking };
}

async function cancelBooking(db, ref) {
  await db.collection('bookings').updateOne({ ref }, { $set: { status: 'cancelled', updated_at: new Date() } });
  await db.collection('locks').deleteMany({ ref });
}

const publicView = (b) => ({
  ref: b.ref, status: b.status, service_name: b.service_name, console_name: b.console_name, storage: b.storage,
  mode: b.mode, area_name: b.area_name, address: b.address, date: b.date, time_label: b.time_label,
  name: b.name, total: b.total, travel_fee: b.travel_fee, created_at: b.created_at,
});

module.exports = { createBooking, cancelBooking, publicView, last10, ACTIVE, manilaHour };
