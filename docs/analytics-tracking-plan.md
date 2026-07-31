# Analytics tracking plan — "traffic up, no clients"

Date: 2026-07-31 · GA4 property `530171693` (Website) · Measurement ID `G-9NYPGY8VFQ`

## What the data actually shows (last 90 days)

- **~925 sessions / ~800 new users.** Real growth, but the quality is the story.
- **Channels:** Direct **648** sessions at **25% engagement**; Organic Search **231** at **79%**; AI Assistant **34** at **71%**; Referral 6.
  - The growth is mostly **Direct + low engagement** = untagged and/or bot/own-traffic. The *good* traffic (Organic + AI ≈ 265 sessions at ~78%) is smaller but real.
- **Real leads are tiny:** `booking_form_submitted` = **4**, `whatsapp_click` = **4**, `email_click` = **4** — about **12 real contact attempts in 90 days**.
- **But GA looks healthy because of a phantom conversion:** `generate_lead` fired **176** times. It is **not in our code** — it's a GA4-side rule (an Event-creation rule or Enhanced Measurement) that's inflating "conversions". If that's your Key Event, the dashboard shows ~176 leads that never happened. **This is the core of "traffic up, no clients": the number you trust isn't the real lead.**
- **Your own visits are in the data:** landing pages include `/admin` (20) and `/admin/login` (13) — only you can reach those. Your constant testing from phone/laptop/home Wi-Fi is a big slice of that low-engagement Direct.
- **Event schema is duplicated:** our clean `booking_*` events coexist with GA4 auto `form_*` events (`form_start` 191 vs `booking_form_start` 21, etc.), which muddies every funnel.

**Verdict: it's both.** (1) The tracking made a low-conversion site *look* like it was converting, and (2) genuine conversion is very low (~0.5%), worsened by low-intent Direct traffic. Fix the signal first, then improve the funnel against honest numbers.

## The plan

### A. Clean the signal (so the numbers are real)
1. **Exclude your own traffic.** Done in code: any browser that opens `/admin` now self-tags `traffic_type:"internal"` on every event, across all your devices (survives changing mobile IPs). You just activate GA4's **Internal Traffic** data filter. Add IP rules too as a backup (see checklist).
2. **Kill the phantom `generate_lead`.** Find the GA4 Event-creation/Enhanced-Measurement rule producing it and remove it (or stop marking it as a Key Event).
3. **One true conversion.** Mark **`booking_form_submitted`** as the Key Event. Add `whatsapp_click` and `email_click` as secondary Key Events — for us a WhatsApp message *is* a lead.
4. **Turn off GA4 Enhanced Measurement → Form interactions** to stop the duplicate `form_start`/`form_submit` noise (our `booking_*` events already cover this).
5. **Exclude bots.** Our code already tags `traffic_type:"bot"`; activate a GA4 data filter to exclude it.

### B. Make the funnel legible
Build one Funnel exploration:
`page_view → contact_page_view → booking_form_start → booking_step_completed → booking_form_submitted`
Now drop-off is visible: who never reaches the form vs. who starts and bails. Segment it by channel and landing page.

### C. Know where traffic comes from
6. **UTM-tag every marketing link** (WhatsApp shares, Instagram bio, QR codes/flyers, partner links) — `?utm_source=instagram&utm_medium=social&utm_campaign=...`. This drains the Direct bucket into real, attributable channels.
7. **Link Google Search Console → GA4** for the organic queries bringing people in.

### D. Read it weekly
Track the four numbers that matter: **booking_form_submitted, whatsapp_click, email_click**, and which **landing page + channel** preceded each — filtered to non-internal, non-bot. That's your true pipeline.

## Your checklist (GA4 UI — the parts I can't do from code)

- [ ] **Internal traffic — IP rules.** Admin → Data Streams → Web → *Configure tag settings* → *Show all* → **Define internal traffic** → Create rule (`traffic_type = internal`), add IP addresses/CIDR for: home Wi-Fi, office/computer, and your phone's network(s). *Note: a phone on 4G/5G has a changing IP, so this won't reliably catch mobile — that's why the code self-flag (above) is the primary mechanism.*
- [ ] **Activate the Internal Traffic filter.** Admin → **Data Filters** → *Internal Traffic* → set **Active** (not Testing). This is what actually excludes both the code flag and the IP rules.
- [ ] **Activate a Bot/Developer filter.** Add a data filter to **exclude** `traffic_type = bot`.
- [ ] **Find & remove `generate_lead`.** Admin → Events (and *Create event* / *Modify event* rules) — delete or fix whatever mints it. Check Google Ads links too.
- [ ] **Mark Key Events.** Admin → Events → toggle **Key event** ON for `booking_form_submitted`, `whatsapp_click`, `email_click`. Toggle it OFF for `generate_lead`.
- [ ] **Enhanced Measurement.** Admin → Data Streams → Web → Enhanced measurement (gear) → **uncheck Form interactions**.
- [ ] **UTM-tag** your marketing links going forward.
- [ ] **Link Search Console** to GA4 (Admin → Search Console links).

## What's already set up in code (shipped)
- Owner self-flagging as `traffic_type:"internal"` (visit `/admin` once per device).
- Bot tagging as `traffic_type:"bot"`.
- A clean `booking_*` event funnel + outbound-click events (WhatsApp/email/phone).

Once A+B are done, we'll have honest numbers — then the real work is CRO on the actual funnel (the 4 → more), which we'll base on what the clean data shows.
