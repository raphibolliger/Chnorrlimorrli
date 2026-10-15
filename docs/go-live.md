# Go-live-Checkliste

Diese Liste wird erst nach ausdrücklichem OK abgearbeitet. Bis dahin läuft `chnorrlimorrli.ch` auf Ecwid weiter.

Supabase-Projekt: `lisritbuqnjhdsguzrnu` · Repo-Variablen und Secrets: GitHub → Settings → Secrets and variables → Actions

## 1. Vorbereitung (vor dem Termin)

- [ ] Offene Angaben in den rechtlichen Seiten ergänzen (rot markiert mit `[OFFEN: …]`):
  - Impressum: Strasse und Hausnummer des Vereins, vertretungsberechtigte Person
  - Datenschutzerklärung: Strasse und Hausnummer, Prüfung durch den Verein
  - AGB: Lieferfrist Postversand, Rückgaberegel, Prüfung durch den Verein
  - Versand und Zahlung: Lieferfrist Postversand
- [ ] Produkte, Preise, Texte und Bilder in der Verwaltung prüfen
- [ ] Bild der «Freiämter Chnorrlimorrli-Socken» hochladen, falls das Produkt wieder aktiv wird
- [ ] PLZ-Liste «Lieferung im Freiamt» prüfen
- [ ] Termin festlegen (Dezember ist Hauptsaison der Bücher)

## 2. Ecwid abschliessen (am Umstellungstag)

- [ ] Offene Ecwid-Bestellungen abarbeiten
- [ ] Bestellungen in Ecwid als CSV exportieren und archivieren
- [ ] Aktuellen Lagerbestand von Buch 1 notieren

## 3. Stripe Live

- [ ] Im Live-Modus einen eingeschränkten Schlüssel für den Shop erstellen (Checkout Sessions schreiben, Payment Intents und Charges lesen, Refunds schreiben) und als Secret `STRIPE_SECRET_KEY` hinterlegen
- [ ] Live-Webhook anlegen:
  - URL: `https://lisritbuqnjhdsguzrnu.supabase.co/functions/v1/stripe-webhook`
  - Ereignisse: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
  - Signing Secret als Secret `STRIPE_WEBHOOK_SECRET` hinterlegen
- [ ] Zahlungsmethoden im Live-Modus: TWINT, Karten, Apple Pay, Google Pay aktiv
- [ ] Nach dem Abschalten von Ecwid die Ecwid-Verbindung in Stripe entfernen

## 4. Supabase

- [ ] Testdaten entfernen (SQL Editor):
  ```sql
  delete from public.orders;
  alter sequence public.order_number_seq restart with 1001;
  ```
- [ ] Lagerbestand von Buch 1 auf den Ecwid-Stand setzen (Verwaltung → Produkte)
- [ ] `hoi@chnorrlimorrli.ch` als Admin erfassen: `supabase/scripts/create-admin.sh hoi@chnorrlimorrli.ch`

## 5. GitHub-Variablen umstellen

| Variable                | Wert                            |
| ----------------------- | ------------------------------- |
| `MAIL_REDIRECT_TO`      | löschen                         |
| `MAIL_REPLY_TO`         | `hoi@chnorrlimorrli.ch`         |
| `ADMIN_NOTIFICATION_TO` | `hoi@chnorrlimorrli.ch`         |
| `SITE_URL`              | `https://chnorrlimorrli.ch`     |
| `ALLOWED_ORIGINS`       | `https://www.chnorrlimorrli.ch` |
| `BASE_HREF`             | `/`                             |
| `SITE_NOINDEX`          | `false`                         |

- [ ] Workflow «Deploy Supabase» manuell starten (übernimmt Secrets, Mail-Einstellungen und die Auth-Konfiguration mit der neuen Site-URL)
- [ ] Workflow «Deploy to GitHub Pages» manuell starten

## 6. Domain

- [ ] GitHub Pages: Custom Domain `chnorrlimorrli.ch` setzen, nach dem Zertifikat «Enforce HTTPS» aktivieren
- [ ] DNS bei Hostpoint:
  - `chnorrlimorrli.ch` A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `chnorrlimorrli.ch` AAAA: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
  - `www` CNAME: `raphibolliger.github.io`
  - MX, SPF, DKIM und `ms-domain-verification` **nicht verändern**

## 7. Kontrolle nach der Umstellung

- [ ] Startseite, Unterseiten und alte Links `/products` funktionieren unter `https://chnorrlimorrli.ch`
- [ ] Testbestellung mit echter Zahlung (z. B. Socken mit Abholung) und anschliessender Stornierung mit Erstattung in der Verwaltung
- [ ] Bestellbestätigung kommt bei der Kundin oder dem Kunden an, Admin-Mail bei `hoi@chnorrlimorrli.ch`
- [ ] Login in die Verwaltung mit `hoi@chnorrlimorrli.ch`
- [ ] Plausible zählt Besuche auf `chnorrlimorrli.ch`
- [ ] Ecwid-Abo kündigen
