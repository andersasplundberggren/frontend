# PÅ PLATS – spelarappen

PWA (Vite + React + Mapbox GL) för platsbaserade uppdrag. Spelarna öppnar den på **paplats.pixelworks.se**.

## Kom igång lokalt

```bash
cp .env.example .env   # fyll i VITE_MAPBOX_TOKEN och VITE_API_BASE
npm install
npm run dev
```

## Drift & deploy – två domäner (VIKTIGT)

PÅ PLATS består av två separata delar. Båda måste alltid fungera:

| Domän | Roll | Repo | Deploy |
|---|---|---|---|
| **paplats.pixelworks.se** | Kund- och spelarappen (det här repot) | `andersasplundberggren/frontend` | Push till `main` → GitHub Actions bygger → rsync av `dist/` till `~/paplats.pixelworks.se/` |
| **api.pixelworks.se** | Backend, API, admin och superadmin | `andersasplundberggren/paplats` (privat) | Push till `main` → `git pull` på servern → omstart |

**Regler:**
- Det här repots deploy får **aldrig** skriva till `~/api.pixelworks.se/`. Backenden sköts bara av `paplats`-repot.
- Appen pratar med backenden via `VITE_API_BASE` (`https://api.pixelworks.se/api/v1`). Värdet sätts som GitHub-secret vid bygget.
- Före och efter varje push, kontrollera:
  - `https://paplats.pixelworks.se/` svarar 200.
  - `https://api.pixelworks.se/admin/login` svarar 200.
- Mappen `Backend/` här är en gammal, git-ignorerad kopia från maj 2026. Ändra aldrig där. Backendens aktuella kod finns i repot `paplats`.
