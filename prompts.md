# BreezeSG - Project Prompts Log

This document records the user prompts used during the development of BreezeSG, a Singapore-based real-time PSI air quality monitoring and alerting application.

---

### Prompt 1: Initial Application Concept & Frontend Build
```text
build a singapore based application that tracks live PSI levels and alerts users when air quality drops below healthy thresholds. It should include an interactive map and push notifications.

bulid just the front end for now, I will add the serverless backend connection later.
```

**Actions taken:**
- Implemented real-time PSI and 1-hour PM2.5 tracking across Singapore's 5 official NEA zones (Central, North, South, East, West).
- Created dual-mode interactive map: custom SVG regional schematic map and CartoDB/Leaflet geospatial map.
- Built push notifications system with Web Notification API, custom threshold sliders, sound chimes, test trigger, and alert log drawer.
- Integrated official NEA and MOH health advisories tailored by audience persona.
- Added 6-pollutant analysis matrix ($PM_{2.5}$, $PM_{10}$, $O_3$, $NO_2$, $SO_2$, $CO$) and 24-hour historical trend chart.

---

### Prompt 2: GitHub Repository Setup & Push
```text
git push https://[GITHUB_PAT_TOKEN]@github.com/siewhongch/haze.git
```
*(Token redacted for repository security)*

**Actions taken:**
- Initialized local Git repository.
- Created initial commit containing complete codebase.
- Added remote origin and pushed `main` branch to `https://github.com/siewhongch/haze.git`.

---

### Prompt 3: Serverless API Integration
```text
Add a serverless API connection that pulls live data from data.gov.sg using the following endpoint: 
GET https://api-open.data.gov.sg/v2/real-time/api/psi

- store this in /api folder in the project root level, NOT the src folder
- include /health.ts and psi.ts within the same subfolder
- there is no key required for this service
```

**Actions taken:**
- Created `/api/psi.ts` fetching live data from `https://api-open.data.gov.sg/v2/real-time/api/psi` with CORS and caching headers.
- Created `/api/health.ts` for monitoring uptime and upstream health.
- Configured `/server.ts` Express entry point mounting `/api` endpoints and Vite dev middleware.
- Updated `src/services/neaService.ts` to consume `/api/psi` with direct fallback.
- Committed and pushed changes to GitHub repository.

---

### Prompt 4: Prompts Collation
```text
collate all prompts into prompts.md
```

**Actions taken:**
- Created this `prompts.md` markdown file in the project root documenting all prompts in chronological order.
