# Portfolio Tracker

A personal stock portfolio tracker built with Next.js and SQLite. Track holdings across multiple accounts, visualize allocation by category, monitor account value over time, and set investment goals.

## Features

- Multiple accounts (Brokerage, Roth IRA, IRA, Crypto, or custom)
- Holdings with live price refresh via Yahoo Finance
- Allocation pie charts by category and brokerage
- Account value history chart with daily snapshots
- Investment goals per account
- Auto-investment schedules
- Notes per account

## Quick start

**Requirements:** Node.js 22+

```bash
git clone https://github.com/tinaxing14/stock-portfolio-manager.git
cd stock-portfolio-manager
npm install
```

### Run with your own data

```bash
npm run dev
```

Opens a fresh portfolio at [http://localhost:3000](http://localhost:3000). Your data is stored in `~/.stock-portfolio/portfolio.db` on your machine — it is never committed to git.

### Run with demo data

```bash
npm run dev:mock
```

Loads a pre-populated demo portfolio (sample values for illustration). Read-only — any changes you make in this mode are not saved back to git.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [SQLite](https://www.sqlite.org) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Recharts](https://recharts.org)
- [Yahoo Finance 2](https://github.com/gadicc/node-yahoo-finance2) for live prices

## Data & privacy

- Your real portfolio data lives in `~/.stock-portfolio/portfolio.db` on your local machine
- That file is never tracked by git and never leaves your machine
- The demo database (`data/mock-portfolio.db`) contains fictional values and is committed to the repo
