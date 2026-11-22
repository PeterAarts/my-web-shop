# Security and deployment fixes

What changed, and why. Check with `cd server && npm test` (no database needed).

## Critical

| Problem | Fix | Files |
| --- | --- | --- |
| Any registered shop customer could use almost every admin function: see **all orders** (names, addresses), read and change **payment credentials**, read shipping API keys, change products, prices, settings, upload and delete files. Those routes only checked "logged in", not "is admin". | Every admin route now requires the admin role (`requireAdmin`) or, for reading, admin or reviewer (`requireStaff`). The role is read from the database on every call, so a demoted or deleted user loses access immediately, not when their 8-hour token expires. | `middleware/requireRole.js`, all `routes/*` |
| Orders were saved with the **items, prices and total sent by the browser**: anyone could order at any price. | The server builds the order itself: prices and names from the database, shipping cost recalculated for the address and cart. If the total differs from what the customer saw, the order is refused with the correct total. | `services/orderPricingService.js`, `services/shippingQuoteService.js`, `routes/paymentRoutes.js` |
| The stock check read a field that doesn't exist (`stock` instead of `stockQuantity`), so it **never stopped an order**. Negative quantities raised stock and lowered the total. | Quantities must be whole numbers 1–999; stock is taken all-or-nothing in one step per product, so two customers can't buy the last item twice. | `services/orderPricingService.js` |
| Two files had names Linux can't find (`models/paymentProvider.js`, and `models/orderStatusLog` without `.js`). On the server, orders and payments would not load. | Renamed to `PaymentProvider.js` and `OrderStatusLog.js`. | `models/` |
| `axios` was used but not installed by `npm ci`. On a fresh install PostNL and DPD failed to load: **no shipping methods, no checkout**. | Replaced by Node's built-in `fetch`. | `shipping-providers/postnl.js`, `dpd.js` |

## Important

- **Order status:** a customer can only cancel their own order while it waits for payment; only admins change other statuses.
- **Payments:** the payment method must be enabled (and the customer logged in if it requires registration). PayPal: the server checks the amount PayPal actually received, and one PayPal payment can only pay for one order. The capture call in the shop was broken (wrong field name, empty order) and is fixed.
- **Removed** `POST /api/orders`: unused, could not work, and copied the request into an order.
- **Login:** form fields must be text (blocks `{"$ne": null}` tricks), at most 10 login attempts per 15 minutes and 5 registrations or reset mails per hour per address, passwords at least 10 characters. The last admin can't be demoted or deleted.
- **Tokens** are only accepted in the `Authorization` header, not in the address (`?token=`).
- **Shipping labels** in the admin open with the login token (the links were broken: they pointed to a bare file name).
- **CORS** only allows the shop's own sites (and localhost in development); **security headers** via helmet; **error details** are never sent to the browser; **API docs** (`/api-docs`) are off in production.
- **Sessions removed:** nothing used them, but every visitor got one stored in MongoDB.
- **Secrets:** in production the server refuses to start without a `JWT_SECRET` of at least 32 characters.
- **Server binds to 127.0.0.1** by default (`HOST` in `.env`); Apache is the way in.

## For the server (NUC)

- Uploads, labels and picklists can live outside the code: `UPLOAD_DIR`, `LABELS_DIR`, `PICKLIST_DIR`.
- Picklist printing is optional (`PRINT_PICKLISTS=true`, Windows only); `pdf-to-printer` was not installed and would crash the server on Linux.
- `paypal.js` used `require('node-fetch')`, which fails for node-fetch v3: now built-in `fetch`.
- `client/*/.env.production`: production builds call `/api` on their own site instead of `localhost:3000`.
- `npm start` / `npm run dev` pointed to `server/server.js` from inside `server/`: fixed.

## Still to do (not in this change)

- `semver` is used by `services/shippingSyncService.js` but only installed as a sub-dependency. Run `npm install semver` in `server/` to make it a real dependency.
- Decide what the **reviewer** role may do. Now: read orders, dashboard, logs and download picklists and labels; everything that changes something needs admin. Change it in one place: `middleware/requireRole.js` and the route lines.
- Run `npm audit` in `server/` and both clients.
