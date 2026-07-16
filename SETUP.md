# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

The defaults work out of the box — you only need to change them if ports 3000 or 3002
are already in use on your machine.

## 3. Run the Application

Open **two** terminal windows in the project folder, in this order:

**Terminal 1 — API server (port 3002, auto-reloads on save)**
```bash
npm run dev
```

**Terminal 2 — React dev server (port 3000)**
```bash
npm start
```

Then open `http://localhost:3000` in your browser.

The React app automatically proxies all `/api/*` requests to the API server, so you do not
need to change any URLs. Start the API first — the proxy reads the API's actual port from
the `.server-port` file once at startup (and falls back to `http://localhost:3002` if the
file does not exist yet).

---

## Production Build

To build the React app and serve everything from a single server on port 3002:

```bash
npm run serve
```

---

## Verify Everything Is Working

After both servers start you should see:

- **Terminal 1:** `[INFO ] Server : http://localhost:3002`
- **Terminal 2:** `webpack compiled successfully`
- **Browser:** The blockchain UI shows the genesis block and demo transactions

---

## Quick Tour

| Action | How |
|---|---|
| View the blockchain | Blocks appear automatically on the right panel |
| Create a wallet | Click **Create Wallet** in the Wallet Studio panel |
| Create a transaction | Paste your private key, enter recipient and amount, click **Sign & Send Transaction** |
| Mine a block | Click **Mine Block** in the Stats panel |
| Check API health | Open `http://localhost:3002/health` |
| Auto-refresh | The UI refreshes every 5 seconds automatically |

---

## Backend Tests

```bash
npm test
```

## Smart Contract (Foundry)

The `forge-std` library is already included in `lib/`, so after installing
[Foundry](https://getfoundry.sh) you can run the contract tests directly:

```bash
forge build
forge test -vv
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | API server with nodemon (auto-reload) |
| `npm start` | React development server |
| `npm run server` | API server without auto-reload |
| `npm test` | Backend blockchain tests |
| `npm run build` | Build React for production |
| `npm run serve` | Build + start production server |

---

## Fonts (Optional)

The UI supports custom fonts from `public/fonts/`. If no font files are present, the app
falls back to system fonts — the application works fully without them.

To add custom fonts, place `.woff2` / `.woff` files in `public/fonts/` following the naming
convention in `public/index.html`.
