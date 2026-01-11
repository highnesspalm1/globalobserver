# 🌍 Global Observer

**Geo-Intelligence Platform für Konfliktmonitoring**

Eine moderne, kostenlose und KI-freie Web-Plattform zur Visualisierung geopolitischer Konflikte. Basierend auf dem Architekturbericht "Entwicklung einer souveränen Geo-Intelligence-Plattform".

## ✨ Features

### 🗺️ Interaktive Karte
- **MapLibre GL JS** - GPU-beschleunigte WebGL-Kartenrendering
- **PMTiles Support** - Serverlose Vektor-Tile Architektur
- **4 Kartenstile** - Dark, Satellite, Terrain, Tactical
- **Event Clustering** - Performante Darstellung tausender Punkte
- **Territorien** - Zeitbasierte Polygon-Darstellung

### ⏱️ Zeit-Reise
- **Timeline Slider** - Navigation durch historische Daten
- **Playback Mode** - Automatische Wiedergabe mit einstellbarer Geschwindigkeit
- **Temporale Filter** - Filtern nach Zeitraum

### 🎯 Ereignis-System
- **9 Kategorien** - Beschuss, Luftangriff, Drohnen, Kampf, Bewegung, Marine, Politik, Humanitär, Infrastruktur
- **4 Schweregrade** - Kritisch, Hoch, Mittel, Niedrig
- **Verifizierung** - Trennung zwischen verifizierten und ungeprüften Daten

### 🎨 Design
- **Militärisches Premium-Design** - Olive/Camo Farbpalette
- **Responsive** - Desktop & Mobile optimiert
- **Accessibility** - ARIA-Labels und Keyboard-Navigation

### 🔧 Admin-Interface
- **Event-Erstellung** - Formular mit Kartenintegration
- **Verifikations-Workflow** - Prüfung und Freigabe von Events
- **Statistiken** - Echtzeit-Übersicht

## 🛠️ Tech Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Karten-Engine | MapLibre GL JS |
| State Management | Zustand |
| Datenbank | Supabase (PostgreSQL + PostGIS) |
| Tile Hosting | PMTiles auf GitHub Pages |
| Styling | CSS Modules |
| Icons | Lucide React |
| CI/CD | GitHub Actions |

## 🚀 Schnellstart

### Voraussetzungen
- Node.js 18+
- npm oder pnpm

### Installation

```bash
# Repository klonen
git clone https://github.com/your-username/globalobserver.git
cd globalobserver

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die App läuft dann unter `http://localhost:5173`

### Umgebungsvariablen (optional)

Erstelle eine `.env` Datei für Supabase-Integration:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_PMTILES_URL=https://your-username.github.io/globalobserver/tiles
```

## 📁 Projektstruktur

```
globalobserver/
├── src/
│   ├── components/
│   │   ├── admin/         # Admin-Panel
│   │   ├── layers/        # Layer-Controls
│   │   ├── map/           # Karten-Komponenten
│   │   ├── sidebar/       # Sidebar & Filter
│   │   ├── stats/         # Statistik-Bar
│   │   ├── timeline/      # Zeit-Slider
│   │   └── ui/            # UI-Primitives
│   ├── stores/            # Zustand Store
│   ├── types/             # TypeScript Types
│   ├── lib/               # Utilities & Supabase Client
│   └── App.tsx            # Haupt-App
├── database/
│   └── schema.sql         # PostGIS Schema
├── scripts/
│   └── ingest.py          # Telegram Scraper
└── .github/
    └── workflows/
        └── ingest.yml     # GitHub Actions
```

## 🗄️ Datenbank Setup

### 1. Supabase Projekt erstellen
1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Kopiere URL und Anon-Key in `.env`

### 2. Schema ausführen
Führe den Inhalt von `database/schema.sql` im Supabase SQL Editor aus.

### 3. PostGIS aktivieren
```sql
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
```

## 🤖 Ingestion Pipeline

Die KI-freie Datenerfassung nutzt deterministische RegEx-Filter:

```bash
# Python Dependencies
pip install telethon supabase python-dotenv

# Scraper ausführen
python scripts/ingest.py
```

### Telegram API Setup
1. Gehe zu [my.telegram.org](https://my.telegram.org)
2. Erstelle eine App
3. Setze `TELEGRAM_API_ID` und `TELEGRAM_API_HASH`

## 🎨 Design System

### Farbpalette

```css
/* Camo Colors */
--camo-dark: #2d3528;
--camo-medium: #4a5240;
--camo-light: #6b7a5d;
--camo-accent: #8fa36f;

/* Tactical Neutrals */
--tactical-black: #0d0f0a;
--tactical-charcoal: #1a1d16;
--tactical-gray: #2a2e24;

/* Severity Indicators */
--critical-red: #ef4444;
--high-orange: #f59e0b;
--medium-yellow: #eab308;
--low-green: #22c55e;
```

## 📦 Build & Deploy

```bash
# Production Build
npm run build

# Preview Build
npm run preview
```

### GitHub Pages Deployment

Die GitHub Actions Pipeline:
1. Führt den Scraper alle 30 Minuten aus
2. Generiert PMTiles mit tippecanoe
3. Deployed auf GitHub Pages

## 🔒 Sicherheit

- **Row Level Security (RLS)** - Datenbankebene Zugriffskontrollen
- **Keine Tracking-Cookies** - DSGVO-konform
- **Open Source** - Vollständig transparenter Code

## 📄 Lizenz

MIT License

## 🙏 Credits

- MapLibre GL JS Team
- Supabase Team
- PMTiles/Protomaps
- OpenStreetMap Contributors
- CARTO für Basemap Tiles

---

**Global Observer** - *Transparente Konfliktvisualisierung für das 21. Jahrhundert*
