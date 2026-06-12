# Contact form backend - hello@yarnitti.org

The "Say hello" page (`/contact`) posts `{email, message}` to a single URL set
as `CONTACT_ENDPOINT` in `public/main.js`. This doc covers the cheapest,
lowest-maintenance way to receive those notes: a **Google Apps Script web app**
that writes each one straight into a **Google Sheet** and emails you.

## Why this option

You asked for the cheapest and easiest path that writes straight to a Google
Sheet and emails a notification. Apps Script does both at once:

- **Free.** No server, no paid tier, no card. It runs inside your Google
  account.
- **Writes straight to the Sheet.** The script appends a row per submission, so
  the Sheet is the database. No extra storage to wire up.
- **Emails you.** `MailApp.sendEmail` sends a notification on each submission,
  from your own Google account, with no SMTP setup.
- **Static-site friendly.** The form posts directly from GitHub Pages to the
  script URL. Nothing runs on your side.

The trade-off is that Apps Script does not return CORS headers by default, so
the browser cannot read the response. The form posts with `mode: "no-cors"`
(the row is still written), and treats a completed request as success. That is
fine for a contact form, where the worst case is a missed error message, not a
lost row.

### Alternatives, briefly

- **Formspree / Getform / Basin.** Hosted form endpoints with a free tier
  (~50 submissions/month). Less setup than Apps Script, but the data lives in
  their dashboard, not your Sheet, and you would export to get it into Sheets.
- **Cloudflare Worker + email.** More control and a real JSON response, but you
  write and deploy code and wire an email provider. More moving parts than this
  needs.

For a low-volume, personal art-project contact form, Apps Script wins on cost
and simplicity.

## Setup

### Step 1 - Create the Sheet

Make a new Google Sheet (e.g. "Yarnitti - hello"). Put headers in row 1:

```
Timestamp | Email | Message
```

### Step 2 - Add the Apps Script

In the Sheet: **Extensions → Apps Script**. Replace the contents with:

```javascript
// Receives a POST from the yarnitti.org contact form, appends a row, and
// emails a notification. Deploy as a web app (see below) and paste its /exec
// URL into CONTACT_ENDPOINT in main.js.
const NOTIFY_TO = "julia.ogris@gmail.com"; // where the alert lands

function doPost(e) {
  const email = (e.parameter.email || "").trim();
  const message = (e.parameter.message || "").trim();
  if (!email || !message) {
    return ContentService.createTextOutput("missing fields");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([new Date(), email, message]);

  MailApp.sendEmail({
    to: NOTIFY_TO,
    replyTo: email, // hit Reply to answer the sender directly
    subject: "yarnitti.org - new hello from " + email,
    body: message + "\n\nFrom " + email,
  });

  return ContentService.createTextOutput("ok");
}
```

### Step 3 - Deploy as a web app

**Deploy → New deployment → Type: Web app.**

- **Execute as:** Me (your account).
- **Who has access:** **Anyone**. (Required so the public form can post. The
  script only appends rows and emails you, so there is nothing sensitive to
  expose.)

Click **Deploy**, approve the permission prompt (it needs to edit the Sheet and
send mail as you), and copy the **Web app URL**. It ends in `/exec`.

### Step 4 - Wire the front end

In `public/main.js`, set:

```javascript
const CONTACT_ENDPOINT = "https://script.google.com/macros/s/AKfy.../exec";
```

Commit and push. GitHub Pages redeploys, and the form posts live.

### Step 5 - Test

Open `/contact`, send a test note, and confirm a row lands in the Sheet and the
email arrives. If it does not, the form falls back to telling the visitor to
email `hello@yarnitti.org` directly, so no note is ever silently lost.

## Notes

- **Redeploy after editing the script.** Apps Script serves the last deployed
  version, not the editor's draft. After changing `doPost`, use
  **Deploy → Manage deployments → Edit → New version** so the live URL updates.
  The URL itself stays the same across versions.
- **Spam.** A public endpoint can attract bot posts. If that starts, add a
  honeypot field (a hidden input that humans leave empty and bots fill) and drop
  any submission where it is non-empty. Not worth adding pre-emptively.
- **Volume.** Apps Script's free quota (well into the hundreds of emails a day)
  is far above anything this form will see.
