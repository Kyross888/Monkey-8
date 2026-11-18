// Shop settings. Edit the text/prices here (services and their prices can also be edited in /admin).
module.exports = {
  SHOP: {
    name: 'Console Service',          // <- put your shop name here
    tagline: 'We come to you, or drop it off at the shop.',
    area: 'Iloilo City',               // <- your service area
    facebook: 'Your Facebook page',
    facebook_url: 'https://www.facebook.com/',
    shop_address: 'Shop address here', // <- shown for drop-off bookings
  },
  MAX_AHEAD_DAYS: 60,    // how far ahead customers can book
  SLOT_CAPACITY: 2,      // how many appointments per time slot per day
  SLOTS: [
    { id: 's1', label: '9:00 AM', start: 9 },
    { id: 's2', label: '11:00 AM', start: 11 },
    { id: 's3', label: '1:00 PM', start: 13 },
    { id: 's4', label: '3:00 PM', start: 15 },
    { id: 's5', label: '5:00 PM', start: 17 },
  ],
  CONSOLES: [
    { id: 'ps4', name: 'PS4', storage: ['500GB', '1TB', '2TB'] },
    { id: 'ps4slim', name: 'PS4 Slim', storage: ['500GB', '1TB', '2TB'] },
    { id: 'ps4pro', name: 'PS4 Pro', storage: ['1TB', '2TB'] },
    { id: 'ps5', name: 'PS5', storage: ['825GB', '1TB', '2TB'] },
    { id: 'other', name: 'Other', storage: ['Not sure'] },
  ],
  // Home-visit areas and the travel fee for each (set fee 0 for free). Edit to match where you go.
  AREAS: [
    { id: 'city', name: 'Iloilo City Proper', fee: 0 },
    { id: 'jaro', name: 'Jaro / Mandurriao / La Paz', fee: 50 },
    { id: 'molo', name: 'Molo / Arevalo / Villa', fee: 50 },
    { id: 'near', name: 'Oton / Pavia / Leganes / Santa Barbara', fee: 150 },
    { id: 'far', name: 'Other town (we will confirm the fee)', fee: 250 },
  ],
  // Starter services (prices are placeholders; edit in /admin)
  SERVICES: [
    { id: 'setup', name: 'Console setup', description: 'Account, system updates, settings and a full check that everything works.', price: 500, sort: 1 },
    { id: 'storage', name: 'Storage upgrade', description: 'Swap in a bigger drive (500GB to 1TB or 2TB) and set the console up again. Drive price is separate.', price: 600, sort: 2 },
    { id: 'clean', name: 'Cleaning and cooling', description: 'Open clean, dust removal and fresh thermal paste so it runs quiet and cool.', price: 700, sort: 3 },
    { id: 'repair', name: 'Diagnosis and repair', description: 'We check what is wrong and tell you the cost before we fix anything.', price: 300, sort: 4 },
  ],
};
