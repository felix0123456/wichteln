# 🎄 Wichteln Service (wichteln.felixresch.com)

Ein festlicher, moderner Wichteldienst für Großfamilien mit Untergruppen-Ausschluss (z. B. Haushaltszweige) und strengem Verbot von gegenseitigen 2er-Täuschen ($A \to B \implies B \not\to A$).

## ✨ Features
- **Mathematisch sichere Zuteilung**:
  - Kein Selbst-Beschenken.
  - Niemand zieht eine Person aus der eigenen Familie/Untergruppe.
  - Strenges Verbot von gegenseitigen Zyklen der Länge 2 ($A \to B$ und $B \to A$).
  - Automatische Erkennung von unlösbaren Konstellationen (z.B. wenn eine Gruppe $> 50\%$ aller Mitglieder umfasst).
- **Einfache Teilnehmer-Enthüllung**:
  - Name im Dropdown wählen & 4-stellige PIN eingeben.
  - Festliche Enthüllungskarte mit Geschenk-Icon, Konfetti, Wichtelkind-Name, Untergruppe, Budget-Vorgabe und Datum.
- **Admin-Zentrale (`/admin`)**:
  - Geschützt durch `ADMIN_PASSWORD` via HTTP-only Cookie-Session.
  - Familien-Untergruppen & Teilnehmer verwalten.
  - 4-stellige PINs automatisch generieren oder manuell vergeben.
  - 1-Klick-Kopieren von fertigen WhatsApp-Einladungen für die Familienmitglieder.
  - Spoiler-Schutz für die Ergebnis-Matrix (Maskierung, damit der Organisator mitspeilen kann).
  - Event-Einstellungen (Budget, Datum der Bescherung, Notizen).
- **Docker & Coolify Ready**:
  - Standalone Next.js 15 Build (~120 MB).
  - SQLite Persistenz unter `/app/data/wichteln.db`.

## 🛠️ Lokale Entwicklung
```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

## 🧪 Tests
```bash
npx tsx --test src/lib/matching.test.ts
```
