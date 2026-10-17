# Oefenwiel

Vite + React-app voor kinderen, draait volledig in de browser (geen API-key, geen backend).
Elke push naar `main` deployt automatisch naar GitHub Pages.

## Versienummer

- De versie staat in `package.json` en verschijnt onderaan de app (`__APP_VERSION__`).
- Hoog de versie op bij **elke** wijziging die je commit (semver):
  - patch (1.6.0 → 1.6.1): fixes en kleine aanpassingen
  - minor (1.6.0 → 1.7.0): nieuwe functies of zichtbare designwijzigingen
- Zet dezelfde versie ook in `package-lock.json` (bovenaan en bij `packages[""]`).
