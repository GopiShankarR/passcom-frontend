# Passcom — US Small‑Business Compliance (Frontend)

Single‑page React + TypeScript app (Vite + Tailwind + Zustand + D3 + Recharts) that talks to the Passcom backend at `http://localhost:4000`.

## Quickstart

```bash
# 1) Extract and install
npm install

# 2) Set API base if not default
echo 'VITE_API_BASE=http://localhost:4000' > .env.local

# 3) Run
npm run dev
# App runs at http://localhost:5173
```

## Features

- **Single‑screen UX**: Business Profile form (live validation) + Results + Visualization
- **Evaluate** → `POST /api/evaluate` with an Idempotency‑Key (uuid)
- **Why?** toggles show JSONLogic for each hit
- **Filters**: jurisdiction + category (heuristic)
- **Share link**: serializes form state to `?s=` (base64 JSON) and copies URL
- **Visualization**: 
  - D3 force graph: Rules → Obligations → Derived facts
  - Recharts bar chart: obligations by jurisdiction
- **State**: Zustand store for `profile`, `lastResult`, `lastError`
- **Tailwind UI**: clean, minimal design
- **Print to PDF**: prints obligations/results nicely

## Project Structure

```
src/
  components/
    BusinessProfileForm.tsx
    ResultsPanel.tsx
    TopBar.tsx
    VizGraph.tsx
    RechartsSummary.tsx
  hooks/
    useQuerySync.ts
  lib/
    api.ts
  store/
    useAppStore.ts
  styles/
    index.css
  types/
    business.ts
  utils/
    share.ts
    uuid.ts
  App.tsx
  main.tsx
```

## Notes

- The grouping by **jurisdiction** uses a simple heuristic based on `ruleId` prefixes (`federal:*`, `state:XX:*`, `city:*`). Unknown formats will show as "Unknown".
- Live validation checks date, NAICS, state, ZIP, and basic numeric constraints.
- CORS must be enabled on the backend (as provided).
