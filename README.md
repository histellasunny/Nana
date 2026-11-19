# Nana Travel Itinerary · Malaysia & Singapore

A mobile-first travel companion for the family trip from 25 November to 3 December 2026.
The UI is rebuilt to follow the approved reference: bright sky-blue and white surfaces, Lato for English, Noto Sans KR for Korean, large travel photography, daily itinerary cards, date-specific map pins, and a shared memo board.

## Files to upload
Upload the contents of this ZIP (not the ZIP file itself) to the root of your GitHub Pages repository:
- `index.html`
- `style.css`
- `app.js`
- `config.js`
- `itinerary.json`
- `SUPABASE_SETUP.sql`
- `README.md`

Keep all files together at the repository root. Do not place them inside an extra folder.

## Supabase shared memo setup
The browser configuration in `config.js` already contains the Project URL and the Publishable key supplied in the conversation. A Publishable key is intended for browser use; do not add a Secret key or `service_role` key to this file.

1. Open your Supabase project.
2. Go to **SQL Editor → New query**.
3. Open `SUPABASE_SETUP.sql`, copy the whole script, paste it into SQL Editor, and click **Run**.
4. If the table is not available through the API, open **Project Settings → API → Data API** (the exact menu label may vary) and make sure the `public` schema / `travel_memos` table is exposed to the Data API.
5. Open the deployed website and select **Memo**.
6. The memo screen should show “Connected”. Submit a test note and check that it appears in the list.

The SQL creates `public.travel_memos` and grants anonymous visitors read and insert access under Row Level Security. Anyone with the website link can read and add notes. There is no public update or delete policy. Do not store passwords, payment details, passport information, or other sensitive personal data in the memo board.

New notes are refreshed on other viewers' pages approximately every 15 seconds while the Memo page is open. This is periodic refresh, not instant push notification.

## Daily maps
The Map tab is date-based. Select a day to see location pins in itinerary order. Named locations are geocoded through the OpenStreetMap Nominatim service; unresolved names remain in the list with Google Maps search links. The blue connecting line is a visual ordering guide and is not turn-by-turn navigation. Four exact Google Maps share links supplied by the user remain in `itinerary.json`.

## Publishing with GitHub Pages
1. Extract this ZIP on your computer.
2. Open the existing GitHub repository.
3. Choose **Add file → Upload files**.
4. Upload all seven files from the extracted folder to the repository root, replacing the previous versions.
5. Commit the changes to the publishing branch (normally `main`).
6. Open **Settings → Pages** and confirm the correct branch and `/ (root)` folder are selected.

The site uses hosted fonts, Leaflet map assets, Supabase JS, and OpenStreetMap tiles, so visitors need an internet connection.
