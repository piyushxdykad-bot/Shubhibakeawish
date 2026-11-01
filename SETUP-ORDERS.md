# Taking real orders — setup (about 15 minutes)

The site ships in **demo mode**: orders are saved only in the visitor's own browser and move through their statuses automatically, so the full flow can be shown without a backend. To take real orders, connect a free Supabase project.

## 1. Create the database
1. Sign up at supabase.com and create a project (region: Mumbai is closest to Prayagraj).
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and press **Run**.
   It creates the menu (with the catalogue prices), the orders table, the security rules, and the two functions the website calls. It is safe to run again later.

## 2. Connect the website
1. In Supabase open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
2. Paste both into `assets/config.js`:
   ```js
   supabaseUrl: "https://xxxx.supabase.co",
   supabaseAnonKey: "eyJ...",
   ```
   The anon key is designed to be public. Customers can only place an order and look up their own order with its code plus the last 4 digits of their phone. They can never list or read other orders.
3. Commit and push. The "Demo mode" labels disappear once both values are set.

## 3. Give the café staff access
1. In Supabase open **Authentication → Users → Add user**, and create a login for each staff member (email + password).
2. Copy that user's **UID** and run in the SQL Editor:
   ```sql
   insert into public.staff (user_id) values ('PASTE-THE-UID-HERE');
   ```
3. Staff sign in at **/admin.html** (not linked anywhere on the site). From there they can see every order, tap a phone number to open WhatsApp, move an order along (Confirmed → In the oven → Ready / Out for delivery → Enjoyed), and leave a short message that the customer sees on the tracking page.

## How it works
- **Prices come from the database**, not the browser. Change a price or hide an item in Supabase under **Table Editor → menu_items** (`price_paise` is in paise, so ₹220 = 22000; set `available` to false to pause an item). Also update the price shown on the website in `assets/order.js` and `menu.html`, so the page and the database agree.
- **Order codes** look like `SBW-7K3QMN`. A customer tracks at `/track.html` with the code and the last 4 digits of their phone.
- **Spam guard:** at most 5 orders per phone number per hour.
- **Payment** is on pickup / on delivery, or by UPI after the café confirms. There is no online card payment yet. Razorpay can be added later.
- **Notifications:** the café sees new orders on the admin page, which refreshes every 30 seconds. To get an email or WhatsApp alert for each new order, add a Supabase Database Webhook on `orders` inserts.

> Hosting: this needs the site served from a real domain or GitHub Pages. The Claude artifact preview always runs in demo mode, because artifacts can't connect to outside servers.
