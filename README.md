# PDS CPM Calculator Pro (v3+)

Phoenix Dispatch Solutions — **Per-Load & Monthly CPM + Profit Calculator** with:
- 🔐 Master password gate (client-side SHA-256)
- 🔑 Random per-session access code (`PDS-######`)
- 📨 “Request Access” form via **EmailJS** (no backend)
- ⛽ State-based fuel price selector (editable table; manual override)
- 🧮 Dual modes: **Per-Load** and **Monthly**
- 📄 Print/Save PDF
- 💾 LocalStorage caching
- 🖤 PDS-branded dark UI with red–orange gradient

> Frontend-only, deployable to **AWS Amplify**, **GitHub Pages**, **Netlify**, **Vercel**, or **Cloudflare Pages**.

---

## 1) Quick Start

```bash
# install
npm i

# run dev
npm run dev

# build
npm run build

# preview production build
npm run preview
```

Open http://localhost:5173 during dev.

---

## 2) Configuration

### Master Password
- Current master password (already hashed in code):  
  `Ri$e@ndH@ul$ecure25`
- To change it:
  1. Open browser console and run:
     ```js
     const enc = new TextEncoder();
     crypto.subtle.digest("SHA-256", enc.encode("NEW_PASSWORD"))
       .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,"0")).join(""))
       .then(console.log)
     ```
  2. Replace `STORED_HASH` in `src/App.jsx` with the new hash.

### EmailJS (no backend email)
1. Create a free account: https://www.emailjs.com  
2. Add a **service**, **template**, and get **public key**.
3. In `src/App.jsx`, replace:
   ```js
   const EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
   const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
   const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
   ```
4. Template variables used:
   - `name`, `email`, `company`, `notes`, `submitted_at`

> The form emails both the dispatcher (you) and/or the requesting user depending on your template.

### Fuel Prices (State-based)
- This build ships an in-code editable map: `STATE_DIESEL_PRICE_USD` in `src/App.jsx`.
- Update it weekly (e.g., Monday) using EIA/DOE numbers.  
- Users can still **override** the price manually per calculation.

---

## 3) Deploy

### AWS Amplify (recommended)
1. Push this repo to GitHub.
2. AWS Console → **Amplify** → **Host web app** → Connect GitHub repo/branch.
3. Build settings (auto-detected for Vite):
   - **Build:** `npm ci && npm run build`
   - **Output dir:** `dist`
4. Deploy → you get a `*.amplifyapp.com` URL.

### GitHub Pages
- Use an action or `gh-pages` to publish `dist/`.
- Make sure your base URL is `/` (default Vite).

### Netlify / Vercel / Cloudflare Pages
- Connect Git → build command `npm run build`
- Output dir: `dist`

---

## 4) Security Notes

This is a **static app**. The password gate and session codes are **client-side**.  
For real auth, sharing, analytics, revocation, and expiring links, add backend (e.g., AWS Lambda + SES + DynamoDB).  
The UI is built to evolve into that easily later.

---

## 5) Brand
- Drop your phoenix logo and favicons when ready; placeholders are left out intentionally.
- Footer contact: `dispatch@riseandhaul.com`.

---

## 6) License
MIT — see [LICENSE](./LICENSE).
