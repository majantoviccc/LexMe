# LexMe – AI Chat App za crnogorsko pravo

## Opis projekta

AI chat aplikacija specijalizovana za razumijevanje crnogorskog prava i odgovaranje na pitanja vezana za tu oblast. UI chat aplikacije će ličiti na ChatGPT, sa sidebar-om sa desne strane koji će sadržati **projekte** (na ChatGPT-u je ovo premium feature – u suštini folderi za grupisanje srodnih chatova) i **poruke**.

Chat će biti povezan sa Google Gemini API-jem – pri registraciji na Google Cloud Console-u dobija se oko **$300 free credits**.

---

## Tech Stack

- **Next.js**
- **TailwindCSS**
- **Shadcn** komponente
- **AI SDK** by Vercel
- **TypeScript**
- **AI (chat) elements**

---

## Ključni izazovi / stvari za riješiti

- **Streaming poruka** – chunks poruka se pojavljuju na ekranu kako ih AI generiše, umjesto da sve dođe odjednom
- **Promptovanje AI-ja / guardrails** – AI ne odgovara na bilo šta, već samo na specifične teme (crnogorsko pravo)
- **File upload** – ako se odluči da korisnici mogu da uploaduju dokumente
- ...

---

## Podjela posla (tim od 3 člana)

### Nikola Tausan – AI/LLM/ML
- Odgovoran za **send message / stream response API**
- Implementira **guardrails** da spriječi nerelevantne upite
  - kroz promptovanje ili drugu metodu
- Referenca: **agent patterns** – posebno obratiti pažnju na **Routing** pattern
  - (primjeri su u TypeScript-u, ali se patterni mogu primijeniti u bilo kom frameworku)

### Maja Antović – Backend / Database
- Dizajn **database šeme**
- Implementacija baze
- Ostali API-jevi:
  - upravljanje projektima
  - brisanje threadova
  - ...

### Ivan Toskovic (ja) – Frontend
- Kompletan frontend aplikacije
- Integracija sa backend-om

---

## Nikolina sugestija (arhitektura komunikacije)

> Preko **web socketa** će frontend da se poveže sa backend-om u **Elixir-u**. Front pošalje upit i poveže se na web socket, a backend mu šalje **token po token** odgovore u realnom vremenu.

### Šta je WebSocket (WS) integracija?

**WebSocket** je protokol koji omogućava **trajnu dvosmernu konekciju** između frontenda i backenda.

Razlika u odnosu na klasičan HTTP zahtjev:
- **HTTP**: pošalješ zahtjev → čekaš → dobiješ ceo odgovor odjednom
- **WebSocket**: otvoriš trajnu konekciju → backend ti šalje podatke kako stignu (token po token, kako Gemini generiše odgovor)

#### Kako to izgleda u praksi:
1. Frontend otvara WebSocket konekciju ka Elixir backend-u
2. Korisnik unese pitanje → frontend ga pošalje kroz tu konekciju
3. Backend prosljedi pitanje Gemini API-ju i počne da prima stream odgovora
4. Backend nam šalje **token po token** kroz isti WS kanal
5. Frontend "lijepi" tokene jedan za drugim u poruku → efekat kao kad ChatGPT "kuca" odgovor uživo

### Implikacija za mene (Ivan / frontend):
- **Nema modifikacije backend-a**
- Radim **samo frontend** u odnosu na zadati backend
- Frontend mora:
  - otvarati WebSocket konekciju
  - slati upite preko WS-a
  - primati i renderovati token-by-token odgovore
  - prikazivati streaming poruke u realnom vremenu
  - handle-ovati prekid konekcije / reconnect

---

## Plan rada (frontend fokus)

### 1. Setup
- [ ] Inicijalizovati Next.js projekat sa TypeScript-om
- [ ] Setup TailwindCSS
- [ ] Setup Shadcn UI komponenti
- [ ] Integrisati AI SDK by Vercel + AI (chat) elements

### 2. UI / Layout
- [ ] Glavni chat layout (ChatGPT-like)
- [ ] Sidebar sa desne strane
  - [ ] Lista **projekata** (folderi za grupisanje chatova)
  - [ ] Lista poruka / threadova unutar projekta
- [ ] Header / navigacija
- [ ] Chat input (slanje poruke + file upload **dugme** – samo UI, bez funkcionalnosti zasad)
- [ ] Chat message lista (user + AI poruke)

### 3. WebSocket integracija
- [ ] Implementirati WS klijent za konekciju sa Elixir backend-om
- [ ] Slanje upita preko WS-a
- [ ] Primanje token-by-token streama
- [ ] Renderovanje streaming poruka (incremental update)
- [ ] Handle-ovanje connection states (loading, error, reconnect)

### 4. Projekti / Threadovi
- [ ] CRUD operacije za projekte (preko backend API-ja)
- [ ] CRUD operacije za threadove / chatove
- [ ] Grupisanje chatova po projektima
- [ ] Switching između chatova

### 5. UX detalji
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Responsive design
- [ ] Dark / light mode (opciono)

### 6. File upload (samo UI placeholder zasad)
- [ ] Dugme za upload u chat input-u (vizuelno prisutno)
- [ ] Bez funkcionalnosti za sada – ostavlja se za kasnije
- [ ] (Kasnije) Upload dokumenata u chatu
- [ ] (Kasnije) Prikaz uploadovanih fajlova

---

## Linkovi / Resursi

- [Next.js](https://nextjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Google Gemini API](https://ai.google.dev/)
- Agent patterns (Routing pattern za guardrails)
