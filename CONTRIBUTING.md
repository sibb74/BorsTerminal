# Bidra till BörsTerminal (Contributing Guide)

Tack för att du vill bidra till **BörsTerminal**.  
BörsTerminal är ett öppet (MIT-licensierat) projekt med målet att skapa en högkvalitativ desktop-terminal för svensk aktieanalys.

Oavsett om du vill lägga till en ny teknisk indikator i Python, förbättra React-gränssnittet eller optimera SQLite-cachen – alla bidrag är välkomna.

---

## Lokal Utvecklingsmiljö

### 1. Klona projektet och installera dependencies

```bash
git clone https://github.com/sibb74/BorsTerminal.git
cd BorsTerminal

# Installera Frontend-dependencies
npm install

# Skapa Python Virtual Environment och installera backend-dependencies
python3 -m venv .venv
source .venv/bin/activate  # På Windows: .venv\Scripts\activate
pip install -r src-sidecar/requirements.txt
```

### 2. Kör utvecklingsmiljön

```bash
# Starta Python FastAPI Sidecar (port 8000) och Vite Dev Server (port 1420) samtidigt:
npm run dev
```

För att starta appen i ett Tauri desktop-fönster:
```bash
npm run tauri dev
```

---

## Hur man lägger till en ny indikator i Python

Alla finansiella indikatorer och nyckeltalsberäkningar finns i [`src-sidecar/app/services/indicator_engine.py`](file:///Users/emilgustavsson/Documents/BorsTerminal/src-sidecar/app/services/indicator_engine.py).

För att lägga till en ny indikator (t.ex. RSI eller MACD):
1. Öppna `indicator_engine.py`.
2. Använd `pandas` för att beräkna värdet utifrån prisdatan eller rapportdatan i SQLite.
3. Exponera resultatet via den relevanta FastAPI-routern i [`src-sidecar/app/routers/`](file:///Users/emilgustavsson/Documents/BorsTerminal/src-sidecar/app/routers/).
4. Lägg till typen i frontenden i `src/lib/api.ts` och rita ut indikatorn i TradingView-grafen eller nyckeltalskortet.

---

## Pull Request (PR) Riktlinjer

1. **Skapa en feature branch:** `git checkout -b feature/min-nya-indikator`
2. **Skriv ren och typad kod:** Använd TypeScript i frontenden och typ-hints i Python (`mypy` / FastAPI).
3. **Bevara mörkt tema (Classic Finance):** Följ den etablerade färgsättningen (mörka bakgrunder, skarpa linjer, emerald/red för finansindikatorer).
4. **Skapa PR:** Beskriv dina ändringar och bifoga gärna en skärmdump om du har ändrat UI:t.

---

## Har du frågor eller idéer?

Öppna ett [Issue på GitHub](https://github.com/sibb74/BorsTerminal/issues) för att diskutera nya funktioner eller rapportera buggar.
