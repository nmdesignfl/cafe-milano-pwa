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

## Step 1 — Get an email API key and verify a sender (5 min)

Either provider below only requires verifying a single **email address** you
own — no domain or DNS access needed, unlike most providers which require a
fully verified sending domain before they'll deliver to arbitrary recipients.

**Option A — Brevo (recommended, free: about 300 emails/day, no trial expiry)**

1. Go to https://www.brevo.com and sign up (new accounts may be reviewed
   before sending is enabled)
2. Dashboard → **Senders, domains & dedicated IPs → Senders → Add a sender**,
   enter an address you can receive mail at, and confirm the verification
   email Brevo sends you
3. Dashboard → **SMTP & API → API Keys → Generate a new API key** → copy it
   (starts with `xkeysib-`)
4. If Brevo shows **Authorized IPs** under Security, make sure IP
   restriction is deactivated, otherwise Supabase's servers are blocked

**Option B — SendGrid** (the free plan is a time-limited trial, so sending
stops with "Maximum credits exceeded" once it ends)

1. Go to https://sendgrid.com and sign up
2. Dashboard → **Settings → Sender Authentication → Verify a Single Sender**
3. Confirm the verification email, then **Settings → API Keys → Create API
   Key** and copy the key (starts with `SG.`)

That verified address is your `FROM_EMAIL` below — reports will be sent
**from** it, but can go **to** any recipient once it's verified. If both keys
are set, Brevo is used.

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
supabase secrets set BREVO_API_KEY=xkeysib-your_key_here   # or SENDGRID_API_KEY=SG.your_key_here
supabase secrets set FROM_EMAIL="Cafe Milano <you@yourdomain-or-gmail.com>"
```

`FROM_EMAIL` must exactly match the sender address you verified in Step 1.

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
West Island, and Brossard. Each has its own recipient email. Picking a
location on a phone never needs a passcode.

1. Open **⚙ Admin → 📍 Locations**. For each location, enter and save the
   report email.
2. Hand each location off with one of two QR codes:
   - **Manager QR** — for the location's manager. Scanning it once opens the
     app already set to that location, with Admin showing only the
     **📍 Locations** tab for that location. The manager can set their own
     report email and generate their own Staff QR.
   - **Staff QR** — for employees. Scanning it opens the app already set to
     that location, with Admin hidden entirely. Staff never see a location
     picker.
3. Under each QR code, tap **Send link…** (opens the phone's share sheet) or
   **Copy link** to pass it along by text or email instead of showing or
   printing the image.
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
