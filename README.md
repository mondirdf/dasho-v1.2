# Dasho — Market Intelligence Dashboard

> **Your Market Command Center.**
> Real-time data, AI-powered recaps, and pro trading widgets.

---

## What is Dasho?

Dasho is a **professional-grade market intelligence dashboard** for crypto traders and analysts. It combines real-time price tracking, AI-powered market analysis, and institutional-level trading tools into a customizable, drag-and-drop interface.

**Live URL**: [dashooo.vercel.app](https://dashooo.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui + Custom Glass Design System |
| State | React Context + TanStack Query |
| Grid | react-grid-layout (desktop) + dnd-kit (mobile) |
| Backend | Supabase (Postgres + Auth + Edge Functions + Realtime) |
| Data Sources | Binance API (primary), CoinGecko, CoinCap (fallback) |
| AI | Lovable AI Gateway / Google Gemini |
| Payments | NOWPayments (USDT TRC20) |

---

## Quick Start

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd dasho

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Project Structure

```
src/
├── config/site.ts          ← Central config (brand, SEO, pricing, colors, widgets)
├── pages/                  ← Route pages (Index, Dashboard, Login, etc.)
├── components/
│   ├── dashboard/          ← Dashboard grid, header, mobile nav
│   ├── widgets/            ← 19 widget components + registry + renderer
│   └── ui/                 ← shadcn/ui primitives
├── contexts/               ← Auth + Dashboard state providers
├── hooks/                  ← Custom hooks (mobile, plans, realtime, OHLC)
├── engines/                ← Trading analysis engines (structure, volatility, etc.)
├── adapters/market/        ← Multi-source data adapters
├── services/               ← Supabase queries
└── analytics/              ← User behavior tracking

supabase/functions/         ← 15 Edge Functions (data fetching, AI, payments, admin)
```

---

## Documentation

| File | Description |
|------|-------------|
| [`PLATFORM_OVERVIEW.md`](./PLATFORM_OVERVIEW.md) | Complete platform guide — features, design, pricing |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | File structure, database schema, routes |
| [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) | How to add widgets, change limits, extend the platform |
| [`WIDGET_GUIDE.md`](./WIDGET_GUIDE.md) | Widget development patterns and visual presets |

---

## Key Features

- 🔴 **Real-time crypto data** via Binance API (no rate limiting)
- 🤖 **AI Market Recap** with 6h-cached daily summaries
- 📊 **19 widgets** across crypto, stocks, forex, commodities, indices
- 🔬 **Pro trading tools**: Structure Scanner (BOS/ChoCH), Mini Backtester, MTF Confluence, Volatility Regime
- 🎯 **Smart Alerts** with multi-condition rules
- 🎨 **4 visual themes**: Default, Midnight Blue, Terminal Green, Light Mode
- 📱 **Mobile-optimized** with touch-friendly drag-and-drop
- 🔐 **Row Level Security** on all user data
- 💰 **Crypto payments** ($15/2 months Pro via USDT TRC20)

---

## License

Private project. All rights reserved.
