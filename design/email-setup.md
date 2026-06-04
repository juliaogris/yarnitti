# Email setup — hello@yarnitti.org

Goal: receive mail at `hello@yarnitti.org` in Gmail, and send/reply **as**
that address from Gmail.

## Already done

- **Receiving** via ImprovMX (free). MX records point to ImprovMX, alias
  `hello@` forwards to `julia.ogris@gmail.com`.
- **SPF** record exists: `v=spf1 include:spf.improvmx.com ~all`.

## Sending — Brevo free SMTP (this doc)

Brevo gives a free SMTP server (300 emails/day) that Gmail can send through,
so the From line reads `hello@yarnitti.org`.

### Step 1 — Create a Brevo account

```
https://www.brevo.com
```
Sign up (free plan). It asks for a phone number for verification. Skip any
paid upsell; the free tier includes SMTP.

### Step 2 — Authenticate the domain in Brevo

In Brevo: **Senders, Domains & Dedicated IPs → Domains → Add a domain** and
enter `yarnitti.org`. Brevo then shows a set of DNS records to add. They are
**account-specific**, so copy the exact values Brevo displays. They will be:

1. **Ownership TXT** — host `@`, value like `brevo-code:xxxxxxxx`.
2. **DKIM** — Brevo shows either a TXT at `mail._domainkey` or two CNAMEs
   (`brevo1._domainkey`, `brevo2._domainkey`). Add exactly what it shows.
3. **DMARC** (recommended) — host `_dmarc`, TXT, e.g.
   `v=DMARC1; p=none; rua=mailto:julia.ogris@gmail.com`.

### Step 3 — Merge SPF (important — do NOT add a second SPF record)

A domain may have only **one** SPF TXT record. Edit the existing one at
GoDaddy from:

```
v=spf1 include:spf.improvmx.com ~all
```
to:
```
v=spf1 include:spf.improvmx.com include:spf.brevo.com ~all
```

### Step 4 — Get SMTP credentials

In Brevo: **SMTP & API → SMTP**. Note:

- Server: `smtp-relay.brevo.com`
- Port: `587`
- Login: your Brevo account email
- Password: the **SMTP key** shown on that page (not your account password)

Keep the SMTP key private. Do not paste it into any file in this repo.

### Step 5 — Add the address to Gmail

Gmail → **Settings → See all settings → Accounts and Import → "Send mail
as" → Add another email address**:

- Name: `Yarnitti`
- Email: `hello@yarnitti.org`
- Untick "Treat as an alias".
- SMTP server: `smtp-relay.brevo.com`, port `587`
- Username: Brevo login, Password: Brevo SMTP key, TLS.

Gmail sends a confirmation code to `hello@yarnitti.org`, which forwards back
to your inbox. Enter it. Optionally set it as the default From, or leave
Gmail to reply from whichever address a mail was sent to.

### Step 6 — Test

Reply to a test mail (or compose new), pick `hello@yarnitti.org` in the From
dropdown, send to another account, and confirm the From shows
`hello@yarnitti.org` and it does not land in spam.

## Verification (Claude can run these)

After the DNS records are in, these confirm propagation:

- SPF: `dig +short TXT yarnitti.org` shows both includes.
- DKIM: `dig +short TXT mail._domainkey.yarnitti.org` (or the CNAMEs).
- DMARC: `dig +short TXT _dmarc.yarnitti.org`.
- Ownership: Brevo's domain page flips to "authenticated".
