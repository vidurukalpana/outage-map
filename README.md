# OutageMap

A community map for reporting power, water, internet outages and blocked roads in Sri Lanka.

Anyone can drop a pin to report a problem, see whether neighbours have the same problem, add a "me too", or mark it resolved.

## Problem

- When the power, water or internet goes out, nobody knows whether it is just their house or the whole area.
- Nobody knows when it will come back.
- There is no simple shared place to see outages nearby.

## Features

1. **Report:** tap the map to drop a pin, choose the type, add an optional short note.
2. **Grouping:** reports of the same type within 500 m are grouped into one circle showing the count.
3. **Me too / Resolved:** add "me too" to a report, or mark it resolved. A resolved report leaves the live map at once.
4. **History:** a second map shows the areas with the most outages in the last 7, 30 or 90 days, with the typical outage length.

## Outage types

| Type | Map colour |
| --- | --- |
| Power | Amber `#CA8A04` |
| Water | Blue `#2563EB` |
| Internet | Purple `#7C3AED` |
| Blocked road | Red `#DC2626` |

## Architecture

- **Frontend (Vercel):** React + TypeScript app with a Leaflet map using OpenStreetMap tiles.
- **Backend (Render):** Go API with a per-IP rate limiter in front of the report, cluster, history handlers.
- **Database (Neon):** PostgreSQL + PostGIS stores reports, groups nearby ones, builds the history grid.

The browser talks to the Go API over HTTPS / JSON; the API runs spatial SQL on PostGIS. Map images load directly from OpenStreetMap.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Leaflet + react-leaflet, OpenStreetMap tiles, TanStack Query, React Router, Tailwind CSS |
| Backend | Go, Chi, pgx, golang-migrate, golang.org/x/time/rate |
| Database | PostgreSQL + PostGIS |
| Testing | Go `testing`, Vitest, React Testing Library |
| DevOps | Docker Compose, GitHub Actions |
| Hosting | Vercel (frontend), Render (API), Neon (database) |
