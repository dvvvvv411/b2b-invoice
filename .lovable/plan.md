## Komplettes Redesign: Hell, modern, seriös mit blauer Akzentfarbe

Wechsel vom dunklen "Hacker/Gaming"-Theme zu einem hellen, professionellen Business-Look mit blauer Primärfarbe — über das gesamte Admin-Panel und die Auth-/Landing-Seite.

### 1. Design-System (`src/index.css`)

Neues helles Farb-Theme als HSL-Tokens:
- **Background**: Weiß, Foreground Slate-900
- **Card / Popover**: Weiß mit dezentem Slate-Border
- **Primary (Blau)**: `217 91% 60%` (Tailwind Blue-Stil), Glow `217 91% 50%`
- **Secondary**: helles Slate
- **Muted / Border / Input**: dezente Slate-Töne
- **Ring**: blauer Fokus
- **Sidebar**: weißer Hintergrund mit dezenter blauer Akzent-Selektion

Entfernen / ersetzen (zentrale Utilities, damit alle Seiten automatisch profitieren):
- `grid-bg` → entfernen (kein animiertes Grid)
- `neon-glow-green/purple` → ersetzen durch sanften Schatten (`shadow-soft`, `shadow-elevated`)
- `text-gradient-primary/secondary` → dezenter Blau-Gradient (oder einfach `text-foreground`)
- `glass` → saubere weiße Karte mit Border + sanftem Schatten (kein Backdrop-Blur)
- `font-orbitron` → auf Inter mappen
- `pulse-glow`, `float`, `particle`, Grid-Keyframes → entfernen
- `body { overflow-hidden }` → entfernen, damit Scroll funktioniert
- Standardmäßig Light-Theme (kein `dark` class auf html)

### 2. Tailwind (`tailwind.config.ts`)
- `font-orbitron` auf `Inter` mappen
- Neue Schatten-Tokens: `boxShadow.soft`, `boxShadow.elevated`

### 3. Button-Varianten (`src/components/ui/button.tsx`)
- `gaming` → sauberer blauer Primary-Button (`bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft`)
- `hero` → outline-style mit blauer Border und dezentem Hover
- Keine Scale-Animationen, kein Neon-Glow

### 4. Layout-Komponenten

**`AdminLayout.tsx`**
- `grid-bg` Div entfernen
- `overflow-hidden` auf Flex-Container hinzufügen → Scroll-Fix

**`AdminHeader.tsx`**
- Weißer Header mit dezentem Border-Bottom und kleinem Schatten
- Logo-Box: blauer Gradient statt grün, kein Neon-Glow
- Kein `font-orbitron`

**`AdminSidebar.tsx`**
- Weiße Sidebar, aktive Items: dezenter blauer Hintergrund + linker blauer Akzent-Border
- Hover: helles Slate
- Kein Neon-Glow

### 5. Alle Admin-Seiten (Bankkonten, Autos, Bestellungen, Kunden, Kanzleien, Speditionen, InsolventeUnternehmen, DokumenteErstellen, Dashboard)
- Headline-Klassen `text-gradient-primary font-orbitron` → schlichte `text-2xl lg:text-3xl font-semibold text-foreground`
- `variant="gaming"` Buttons bleiben im Code — die Variante ist neu definiert
- Karten verwenden weiterhin `glass`-Klasse (zentral neu definiert) → keine Massen-Edits nötig
- Dashboard-Stat-Cards: Icons in dezente blau/grau Container, Hover = sanfter Schatten

### 6. Auth-Seite (`src/pages/Auth.tsx`)
- `grid-bg` entfernen, `Gamepad2` → `Building2`/`LogIn`
- Headline ohne `font-orbitron`/Gradient — schlichtes Slate-900
- Card als weiße Karte mit Schatten

### 7. Landing (`src/components/GamingLanding.tsx`)
- Schlichte helle Landing-Page mit Hero, blauer Akzent, sauberem CTA zum Admin-Panel
- Entfernung aller Particle/Float/Grid-Effekte

### Resultat
Helles, modernes Business-Look mit konsistenter blauer Akzentfarbe. Durch zentrales Umdefinieren von `index.css` + `button.tsx` + `tailwind.config.ts` greift der neue Look automatisch global — nur Layout/Auth/Landing brauchen zusätzlich gezielte Anpassungen.