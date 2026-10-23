# Nightly Email Report — Setup

The app emails an Excel workbook every night at 3:00am instead of storing
task records in a database. This is a one-time setup, done once by you —
staff never see any of it.

## What gets emailed

One Excel file with six sheets:

| Sheet | Contents |
|---|---|
| Pre-Service | Date, day, task, completed |
| Post-Service | Date, day, task, completed |
| Manager Closing | Date, day, task, completed |
| General Cleaning | AM/PM rotation tasks |
| Kitchen Weekly | Daily station cleaning |
| Weekly Inventory | Date, item, and quantity |

Every task is listed whether it was completed or not — unchecked tasks show
"Not completed" instead of being left out, so the report reflects everything
that was missed, not just what got done.

---

## Step 1 — Get a SendGrid API key and verify a sender (5 min)

SendGrid only requires verifying a single **email address** you own — no
domain or DNS access needed, unlike most providers which require a fully
verified sending domain before they'll deliver to arbitrary recipients.

1. Go to https://sendgrid.com and sign up (free tier: 100 emails/day)
2. Dashboard → **Settings → Sender Authentication → Verify a Single Sender**
3. Fill in the form with an email address you can receive mail at (e.g.
   your own Gmail) and confirm the verification email SendGrid sends you
4. Dashboard → **Settings → API Keys → Create API Key** (Full Access is
   fine) → copy the key (starts with `SG.`)

That verified address is your `FROM_EMAIL` below — reports will be sent
**from** it, but can go **to** any recipient once it's verified.

## Step 2 — Install the Supabase CLI (2 min)

```bash
npm install -g supabase
supabase login
```

## Step 3 — Deploy the email function (3 min)

From inside this folder:

```bash
supabase link --project-ref ougltosugexkphazmcwz
supabase functions deploy send-report --no-verify-jwt
```

Then set your secrets:

```bash
supabase secrets set SENDGRID_API_KEY=SG.your_key_here
supabase secrets set FROM_EMAIL="Cafe Milano <you@yourdomain-or-gmail.com>"
```

`FROM_EMAIL` must exactly match the address you verified in Step 1.

> Deploying without the CLI: in the Supabase dashboard go to
> **Edge Functions → Deploy a new function**, name it `send-report`,
> and paste the contents of
> `supabase-edge-function/send-report/index.ts`. Then add the two
> secrets under **Edge Functions → Manage secrets**. Also check the
> function's own **Settings** for "Enforce JWT Verification" and turn
> it off — otherwise the app can't reach the function at all.

## Step 4 — Update the database schema

In the Supabase dashboard → **SQL Editor**, run the SQL shown in the app
under **Admin → Data / SQL → Supabase sync**. This creates the two tables
still in use (`admin_overrides`, `devices`) and drops the old logging
tables.

## Step 5 — Set up locations and their recipient emails

This app supports four locations sharing one deployment — Jarry, Laval,
West Island, and Brossard. Each has its own recipient email, set centrally
by the master Admin — picking a location on a staff phone never needs a
passcode.

1. In **⚙ Admin → Data / SQL**, under **Locations, recipient emails & staff
   QR codes**, enter and save the report email for each location.
2. Tap **QR code** next to a location to generate a QR code for it, then
   send that image to the location's manager (text, print, AirDrop —
   however is easiest).
3. Staff scan the QR code with their phone's camera, which opens the app
   with that location already set — they never see a location picker at
   all.
4. A phone can also pick its location manually by tapping the **📍
   location pill** in the header, if a QR code isn't handy.

## Step 6 — Test it

Still in Admin → Data / SQL → Supabase sync:

- **Send report now** — emails immediately, so you can confirm it arrives
- **Download Excel** — saves the workbook locally to check the contents

---

## How the nightly send works

Each phone independently emails its own report at 3:00am local time. If a
phone is off or offline at 3am, that night's send is skipped and it
retries the following night — the data is not lost, since everything is
kept on the device and the next report includes all history.

You'll receive one email per active device. The subject line and the
first sheet both name the staff member who submitted it.

## Data privacy

Task completions, inventory counts, and sign-offs are **never** written
to the database. They live on each phone and travel only as an email
attachment. The database holds just two things: the checklist
customisations an admin makes (so they can sync to all phones), and the
device registry (names and last-seen times).
