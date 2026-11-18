# Console Service – Booking Website

Customers pick a service, their console and storage size, a date and time, and where we meet (home visit or shop drop-off) at `/`.
You manage bookings at `/admin`.

## 1. Put your own details in (lib/config.js)
- `SHOP`: shop name, service area, Facebook page, shop address (shown for drop-off bookings)
- `SLOTS`: the time slots, and `SLOT_CAPACITY`: how many appointments per slot
- `AREAS`: the home-visit areas and the travel fee for each
- `CONSOLES`: models and their storage sizes
Service names and prices are edited in `/admin` → Services & prices.

## 2. Deploy (new GitHub repo + new Vercel project)
1. New GitHub repo, upload everything in this folder (not `node_modules`).
2. Vercel → Add New → Project → import it. Preset: Other.
3. Environment variables: `MONGODB_URI`, `MONGODB_DB` = `ps_service_db`, `ADMIN_PASSWORD`, `JWT_SECRET`.
4. Deploy. Open `/admin` to log in. The starter services appear on the first visit.

## How double-booking is prevented
Each appointment takes one seat in its time slot, stored with a unique index (date + slot + seat). If two people book the last seat at the same moment, only one gets it. Cancelling frees the seat.

## Run locally
`npm install`, copy `.env.example` to `.env.local`, then `npm run dev` → http://localhost:3000
