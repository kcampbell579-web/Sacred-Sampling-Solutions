# Fuel Delivery Dispatch & Driver Portal — Prototype

A single-file, zero-build prototype of an end-to-end heating-oil dispatch
workflow: morning routing across multiple trucks, a "publish / lock" step
that releases manifests to the field, a per-driver sequenced manifest, an
active-stop delivery log with COD collection, and an offline-first sync banner.

## Run it

Open `index.html` in any modern browser. Tailwind loads from a CDN, so you
need internet the first time; everything else is inline vanilla JavaScript.

Optional: serve it locally so two tabs can share state.

```bash
cd prototypes/fuel-dispatch
python3 -m http.server 8080
```

Then open <http://localhost:8080/>.

## Demo script (about two minutes)

1. **Dispatcher tab.** Sixteen orders are loaded for today, all unassigned.
   Click **Auto-cluster & assign**. Orders are clustered by geography into
   North / South / East, kerosene orders are forced onto Truck #3 (the only
   truck with a kerosene compartment), gallons are balanced against each
   truck's tank capacity, and each truck's stops are sequenced from the depot.
   The map draws one dashed route per truck. You can still move a stop between
   trucks with the dropdown on each row.
2. Click **Publish / Lock routes**. Reassignment controls disappear and the
   manifests become visible to drivers.
3. **Driver Portal tab.** Pick a driver, for example Mike R. on Truck #3.
   The manifest shows only that truck's stops, in sequence, with fuel type,
   target gallons, COD amounts and highlighted special notes.
4. Tap the current stop. Press **En Route**, then **Arrived on site**. The
   delivery log appears. On a COD stop, press **Tap to pay** to simulate a
   Stripe Terminal charge, or tick "Payment collected" for check or cash.
   Enter the meter reading and ticket number and press **Complete delivery**.
   The manifest advances to the next stop.
5. Press **Simulate dead zone** in the banner, complete another stop, and
   note that the banner reports changes saved on device. Switch to the
   Dispatcher tab: that stop still shows its last synced status. Press
   **Restore signal** and the queue replays and dispatch updates.
6. Open the page in a second browser tab to see dispatcher and driver views
   update each other live (the prototype uses `localStorage` plus the
   `storage` event as a stand-in for a server push).

**Reset demo** in the header returns everything to the morning state.

## How data flows

```
Dispatcher                                   Driver (per truck)
----------                                   ------------------
orders[] (unassigned)
   │  Auto-cluster & assign
   │   1. fuel-type constraint → eligible trucks
   │   2. k-means over coordinates, seeded at truck home zones
   │   3. capacity balance (bump far stops to the next truck with room)
   │   4. nearest-neighbour sequencing from the depot
   ▼
orders[].truckId / seq / status = pending
   │  Publish / Lock routes
   │   routes.published = true, publishedAt
   ▼
          ───── manifests visible to drivers ─────▶   stopsFor(truckId) sorted by seq
                                                       │  En Route → Arrived → delivery log
                                                       │  status + delivery{} written locally first
                                                       │  change queued in sync.queue
                                                       ▼
          ◀──── when online: queue replays ───────     syncedStatus = status
dispatcher renders syncedStatus (what the server has),
driver renders status (what the device has)
```

All state lives in one object persisted to `localStorage`. In a production
build the same shape maps cleanly onto tables: `trucks`, `orders`,
`route_publications`, `deliveries`, and a client-side outbox for the offline
queue (for example a service worker with IndexedDB that replays to the API).

## What is mocked

- **Map.** An inline SVG with mock coordinates stands in for a real map.
  Swap in Mapbox or Google Maps and real geocodes; the clustering and
  sequencing functions only need `x` / `y`.
- **Routing.** K-means plus nearest-neighbour is enough to show the idea.
  A real build would call a routing engine (OSRM, Google Routes, or a VRP
  solver) for drive-time-aware sequencing and time windows.
- **Stripe.** "Tap to pay" generates a fake PaymentIntent id. The real flow
  creates the PaymentIntent server-side and collects it with Stripe Terminal
  on the driver's phone.
- **Sync.** `localStorage` is the "server". The queue, latency and the
  online/offline split between `status` and `syncedStatus` are real, so the
  behaviour drivers and dispatchers would see is faithful.
- **Login.** Driver selection is a button. Production would use a PIN or SSO.
