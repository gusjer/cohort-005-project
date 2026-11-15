# Notification providers compared against our criteria

Research for [issue #3](https://github.com/gusjer/cohort-005-project/issues/3), part of the map in [issue #2](https://github.com/gusjer/cohort-005-project/issues/2).

- **Date checked:** 2026-11-15. Pricing and docs pages change; every figure below is as published on that date.
- **Sources:** each provider's own pricing page and documentation, plus the public npm registry for package versions and peer dependencies. Every claim carries the URL it came from.
- **Scope:** facts only. Choosing a provider is a separate decision ticket, and nothing here is a recommendation.
- **Method limits:** pages were read as text extractions. Where a pricing table lost its column layout, or a docs page returned 404, that is said explicitly instead of being filled in. Nothing was verified by signing up or running code.

Candidates: **Knock**, **Novu Cloud**, **MagicBell**, **Courier**, and one additional hosted candidate found, **SuprSend**. NotificationAPI was looked at and set aside (see [Other candidates](#other-candidates)).

## Criteria recap

From the map's Notes: hosted SaaS; a free tier good enough for development; React inbox components and an API for a custom interface; Postmark as an email channel; workable without credentials in local dev and tests. The ticket adds: per-person preferences by type and channel, recipient identity and browser authentication, real-time delivery, batching and digests.

Cadence's stack, for the compatibility rows: React `^19.2.7` and React Router `8.3.0` in framework mode, server-rendered (`package.json`).

## Comparison table

| | Knock | Novu Cloud | MagicBell | Courier | SuprSend |
|---|---|---|---|---|---|
| **Free tier** | 10,000 messages/mo; unlimited environments and seats; Knock branding | 10,000 workflow runs/mo; 5 workflows; 2 environments; 3 seats; Novu branding in Inbox; 24h activity feed and max digest window | 1,000 deliveries/mo (counted per channel); 1 project | 10,000 sends/mo | 10,000 notifications/mo; SuprSend branding in feed |
| **First paid step** | Starter: $250/mo + usage, 50,000 messages, $0.005 overage | Pro: from $30/mo, 30,000 runs, $1.20 per extra 1,000 | Startup: $249/mo, 50,000 deliveries, $0.0025 overage | Business: $0.005 per send, pay as you go, no base fee stated | Essentials: $100/mo, 50,000 notifications, $0.002 overage |
| **Prebuilt React inbox** | Yes (`@knocklabs/react`) | Yes (`@novu/react`) | Yes (`@magicbell/react`) | Yes (`@trycourier/courier-react`) | Yes (`@suprsend/react`) |
| **Headless / custom UI** | React hooks; JS client; Feed API | React hooks; `@novu/js` | JS client (`magicbell-js`); docs for the current React package describe no headless mode | `useCourier()` hook; "low-level APIs" not documented on the page read | `@suprsend/react-core` hooks; JS SDK |
| **React 19 (npm peer range)** | `^17 \|\| ^18 \|\| ^19` | `^18 \|\| ^19`; docs state React 19 supported | `@magicbell/react` declares no peer deps; docs do not state | `>=18.0.0`; docs say "React 18+" | `>= 16.8.0` |
| **SSR / React Router** | Docs do not address | Remix quickstart exists; SSR not addressed; React Router not named | Docs do not address | "render client-side only" (stated for Next.js) | Docs read do not address |
| **Postmark email** | Yes, native integration | Yes, native integration | Not listed. Generic SMTP provider is listed; Postmark offers SMTP | Yes, native integration | Yes, native integration |
| **Preferences by type and channel** | Yes: workflow, category, channel type, and nested combinations | Yes: per workflow per channel, plus global per channel | Yes: category x channel | Yes: per topic, with per-topic channel choice when enabled | Yes: category, channel, and channel within category |
| **Prebuilt preferences UI** | Hosted page; no drop-in React component mentioned | Preferences view inside `<Inbox />` | `UserPreferences` component | `<CourierPreferences />`; hosted page | Hosted page; embeddable React components |
| **Recipient identity** | Your own `id`; identify call or inline on trigger | Your own `subscriberId`; created/upserted on trigger | `external_id` and/or email; upsert | Your own `user_id`; a send does **not** create a profile | Your own `distinct_id` |
| **Browser auth** | Public key; optional enforced RS256 JWT signed by your backend | Public application identifier; optional enforced HMAC-SHA256 hash from your backend | HS256 user JWT signed by your backend (required) | JWT minted by calling Courier's Issue Token endpoint from your backend | Public key; optional enforced ES256 JWT signed by your backend |
| **Real-time** | Yes, websocket | Yes; transport not named on pages read | Yes, "persistent connection"; API reference mentions Ably | Yes, WebSocket | Indicated (socket), not verified at the source |
| **Batching** | Batch step, all plans; window up to 90 days | Digest step; max window 24h free, 7d Pro, 90d Team | Not documented | Batch node; plan availability unresolved | Batch node; pricing lists it from Business ($250) |
| **Scheduled digests** | Not built in; tutorial has your system drive the schedule | Yes, scheduled digest | Not documented | Yes, per-topic digest schedules; plan availability unresolved | Digest node exists; details not read |
| **Non-production mode** | Development environment; per-channel and per-trigger sandbox mode | Development environment; demo email provider (300/mo, own address only) | Nothing documented; free plan has 1 project | Test environment (sends billable); test provider delivers to signup address only | Sandbox, Staging (with Test Mode), Production workspaces |
| **Runs with no credentials at all** | No documented offline mode | No documented offline mode for Novu Cloud | No documented offline mode | No documented offline mode | No documented offline mode |

No provider documents a way to run with no credentials. In every case the "no credentials" requirement has to be met by a stand-in in our own code, on both the server side (emitting) and the browser side (the inbox). See [Running without credentials](#running-without-credentials).

## Knock

**Pricing** (https://knock.app/pricing)

- Free: $0, up to 10,000 messages sent per month. Unlimited environments, team members and delivery channels. 30-day log retention. Batching and digests, preferences and the in-app feed are listed on the free plan. Free includes Knock branding; Starter removes it.
- The page says Free does not hard-cap messages: beyond the limit without a billing method, Knock contacts you.
- Starter: $250/month plus usage, 50,000 messages included, $0.005 per additional message.
- Enterprise: custom. Translations and per-tenant branding/preferences are Enterprise-only.

**In-app inbox**

- `@knocklabs/react` ships prebuilt `NotificationFeedPopover`, `NotificationFeed` and `NotificationIconButton`, and "a complete set of React hooks that you can use to build your own UI on top of" (https://docs.knock.app/in-app-ui/react/overview).
- A Feed API exists for fully custom UI (https://docs.knock.app/integrations/in-app/knock). Messages are unseen / seen / read, with archive as a separate action; the badge counts unseen by default.
- npm: `@knocklabs/react` 0.15.1 (published 2026-11-06), peer deps `react` and `react-dom` `^17.0.0 || ^18.0.0 || ^19.0.0`, plus `next` `^13 || ^14 || ^15 || ^16` and `@tanstack/react-router` `^1.0.0` as peers (https://registry.npmjs.org/@knocklabs/react). Whether those extra peers are optional was not checked.
- **Not answered by the docs:** the React overview and feed pages say nothing about server-side rendering, `"use client"`, or React Router.

**Email via Postmark:** native. "Knock integrates with Postmark to send email notifications to your users." Needs the Postmark server API key and a from address, configured per environment; has a sandbox-mode option and delivery/bounce tracking via webhook (https://docs.knock.app/integrations/email/postmark).

**Preferences:** a `PreferenceSet` has `channel_types`, `channels`, `workflows` and `categories`; channel types can be nested under a workflow or category, giving type-by-channel control. Unset values default to `true`; an environment default set can change the baseline. Knock hosts a preference page reachable by signed URL, or you build your own UI on the preferences API. No drop-in React preferences component is mentioned (https://docs.knock.app/preferences/overview).

**Identity and browser auth**

- Users are identified by an `id` from our system (up to 256 chars, immutable). Only `id` is required; `email` is required for email channels. Users are synced by an identify call or inline when triggering a workflow (https://docs.knock.app/concepts/users).
- The browser uses a public API key. "Enhanced security mode" is off by default; when on, Knock rejects client requests without a user token. The token is an RS256 JWT signed by our backend with a private signing key (`sub` claim required), with no call to Knock needed to create it. It can be set per environment (off in development, on in production). `onUserTokenExpiring` supports refresh (https://docs.knock.app/in-app-ui/security-and-authentication).
- Without enhanced security: "By default, Knock feeds are accessible to anyone who has the feed ID" (https://docs.knock.app/in-app-ui/react/feed).

**Real-time:** yes. The feed client's `listenForUpdates()` connects to a realtime socket and new items are "received over the websocket" (https://docs.knock.app/in-app-ui/javascript/sdk/feed-client).

**Batching and digests:** a batch step groups per recipient, optionally by a batch key; fixed, dynamic, relative and sliding windows; "A batch can stay open for at most 90 days." Templates see the first or last 10 items by default (up to 100 on Enterprise). Knock states batching is not well suited to recurring daily/weekly digests and points to a tutorial that uses our system as the source of truth for the schedule (https://docs.knock.app/designing-workflows/batch-function).

**Non-production options**

- Accounts start with production only; enabling environments adds development, each with its own API keys and channel configuration (https://docs.knock.app/concepts/environments).
- Sandbox mode: per channel per environment (all channel types except in-app), Knock "will never send the request to your downstream provider"; such messages show as "Not sent", are previewable in the dashboard and do not count toward usage (https://docs.knock.app/integrations/overview, https://docs.knock.app/send-notifications/message-statuses). These two pages were read through a search-result summary of docs.knock.app, not opened directly; the next bullet's page was opened directly and confirms sandbox mode exists.
- A workflow trigger can set `settings.sandbox_mode` to force sandbox for that run (https://docs.knock.app/send-notifications/testing-workflows).
- All of the above still need a Knock API key. The API reference lists a single base URL, `https://api.knock.app/v1`, and documents no host override or mock server (https://docs.knock.app/api-reference/overview).

## Novu Cloud

**Pricing** (https://novu.co/pricing)

- Free: $0, 10,000 workflow runs/month, **5 workflows**, 2 environments (Development and Production), up to 3 team members, unlimited subscribers, 24-hour activity feed retention, 24-hour maximum delay/digest window. All channels including in-app and email.
- Pro: from $30/month, 30,000 runs, $1.20 per additional 1,000, 20 workflows, 7-day activity feed and digest window, Novu branding removable.
- Team: from $250/month, 250,000 runs, 100 workflows, up to 10 environments.
- The workflow cap matters to our v1 size (roughly 4 to 8 Notifications) if each Notification is its own workflow. Whether one workflow can serve several notification types was not researched.
- **Not readable:** inbox feed retention per plan did not survive text extraction.

**In-app inbox**

- `<Inbox />` is "a prebuilt, ready-to-use, and fully customizable UI component", composable from `Bell`, `Notifications`, `InboxContent` and `Preferences`. Custom UI uses `@novu/react` hooks or framework-agnostic `@novu/js` (https://docs.novu.co/platform/inbox/overview).
- Headless hooks: `useNotifications`, `useCounts`, `useNovu` under `NovuProvider` (https://docs.novu.co/platform/inbox/headless/get-started).
- React 18.0.0 or later required, React 19 supported (same overview page). npm: `@novu/react` 3.19.2 (2026-09-07), peers `react`/`react-dom` `^18.0.0 || ^19.0.0` (https://registry.npmjs.org/@novu/react).
- A Remix quickstart places `<Inbox />` in `app/root.tsx` (https://docs.novu.co/platform/quickstart/remix). **Not answered:** the page does not mention server-side rendering caveats and does not name React Router.
- On the free plan the Inbox carries Novu branding; removal needs a paid plan (https://docs.novu.co/platform/inbox/prepare-for-production).

**Email via Postmark:** native. Needs the Postmark Server API token and a verified from address (https://docs.novu.co/platform/integrations/email/postmark).

**Preferences:** workflow defaults, subscriber global preferences per channel, and subscriber per-workflow preferences per channel; "the most specific layer that defines a channel wins." Workflows marked critical ignore subscriber preferences and are hidden from them. The Inbox has a built-in Preferences view; there are retrieve/update preference endpoints (https://docs.novu.co/platform/concepts/preferences).

**Identity and browser auth**

- Each subscriber has a `subscriberId` (our internal user id recommended); only `subscriberId` is required. "Novu allows you to create a subscriber automatically at the moment a notification is triggered," and upserts details on every trigger. Bulk create handles 500 per call (https://docs.novu.co/platform/concepts/subscribers). The same page's FAQ also says "You must add a subscriber to Novu before triggering the workflow," which contradicts the just-in-time description; the docs do not resolve this.
- The browser uses a public `applicationIdentifier` plus the `subscriberId`. Optional HMAC protection: our server computes `HMAC-SHA256(secretKey, subscriberId)` as `subscriberHash`. It is a toggle on the in-app provider; once on, "the Inbox will not load" without the hash (https://docs.novu.co/platform/inbox/prepare-for-production). No expiry or token refresh is involved since the hash is static per subscriber.

**Real-time:** yes. The Inbox keeps the unread count current in real time and hooks receive events such as `notifications.notification_received` (https://docs.novu.co/platform/inbox/overview, https://docs.novu.co/platform/inbox/headless/get-started). **Not answered:** the pages read do not name the transport.

**Batching and digests:** a digest step groups by subscriber plus an optional key. Regular digests collect for a duration, optionally only "when events repeat"; scheduled digests deliver at fixed calendar intervals in the subscriber's time zone. Maximum duration depends on plan (https://docs.novu.co/platform/workflow/add-and-configure-steps/configure-action-steps/digest). The docs page gives 30 days for Team where the pricing page gives 90; the two disagree.

**Non-production options**

- Development and Production environments on every account, each with its own application identifier and secret key; workflows are published from Development (https://docs.novu.co/platform/concepts/environments).
- Demo providers allow testing "without configuring a provider": 300 notifications per month per demo channel, demo email "can only send emails to the address associated with your logged-in Novu account", Novu Cloud only (https://docs.novu.co/platform/integrations/demo-providers).
- **Not answered:** no documented dry-run or sandbox flag on a trigger was found, and the environments page does not say Development sends are simulated. A Novu API key is needed for all of the above. (Novu is also open source and self-hostable, but self-hosting is ruled out by the map.)

## MagicBell

**Pricing** (https://www.magicbell.com/pricing)

- Builder: $0, 1,000 deliveries/month, 1 project, unlimited users and team members, all integrations.
- Startup: $249/month, 50,000 deliveries, $0.0025 per additional delivery, 5 projects ($99 per additional project).
- Enterprise: custom.
- A delivery is counted per channel: one notification to 100 users in-app and 50 by email is 150 deliveries.
- The pricing page does not say which plans include the inbox, preferences or real-time.

**In-app inbox**

- `@magicbell/react` provides a `ContextProvider` plus `Inbox`, `FloatingInbox`, `InlineNotification`, `ToastContainer` and `UserPreferences` components. Customisation is by replacement components (`ItemComponent`, `InboxComponent`, `ButtonComponent`) and CSS variables (https://www.magicbell.com/docs/libraries/react).
- **Not answered:** that page describes no headless mode, states no supported React versions, and does not mention SSR. Custom UI can be built on the browser/Node client `magicbell-js` (https://www.magicbell.com/docs/libraries/magicbell-js) against the v2 API at `https://api.magicbell.com/v2` (https://www.magicbell.com/docs/api/reference).
- npm: `@magicbell/react` 1.14.0 (2026-07-29) declares no peer dependencies. The older packages `@magicbell/magicbell-react` 11.5.1 and `@magicbell/react-headless` 5.5.1 (both 2026-03-20) declare `react >= 18.3.1` and are not marked deprecated on npm (https://registry.npmjs.org/@magicbell/react, https://registry.npmjs.org/@magicbell/react-headless). How the older packages relate to the current docs was not established.

**Email via Postmark:** **not listed.** The email channel names five providers: SMTP, Amazon SES, SendGrid, Mailgun and Ping Email (https://www.magicbell.com/docs/channels/email). The SMTP provider takes host, port, username, password and from address (https://www.magicbell.com/docs/channels/email/smtp). Postmark's own docs say it accepts SMTP at `smtp.postmarkapp.com` with the Server API token as username and password (https://postmarkapp.com/developer/user-guide/send-email-with-smtp). MagicBell's docs do not themselves describe using Postmark this way, so this route is an inference from two primary sources, not a documented integration.

**Preferences:** a user preferences object holds categories, each with a list of channels with an `enabled` flag; `GET` and `PUT /channels/user_preferences` (https://www.magicbell.com/docs/api/reference). The `UserPreferences` React component "lets users toggle notification channels per category" (https://www.magicbell.com/docs/libraries/react).

**Identity and browser auth**

- Users are identified by `external_id` and/or email; external id takes precedence and cannot be changed once set. Saving a user is an upsert (https://www.magicbell.com/docs/primitive/user). **Not answered:** whether naming an unknown recipient in a broadcast creates the user.
- The browser needs a user JWT (the React provider's `token` prop is required): "User JWTs must be signed with your project's Secret Key using the `HS256` algorithm," with `user_email` and/or `user_external_id` and `api_key` claims, generated on our backend with no call to MagicBell. Docs examples use a one-year expiry; expiry policy is not otherwise described (https://www.magicbell.com/docs/api/authentication/user).

**Real-time:** "MagicBell maintains a persistent connection to deliver notifications in real-time" (https://www.magicbell.com/docs/channels/in_app). The transport is not named there; the API reference has a field described as restricting delivery "to a specific Ably connection" (https://www.magicbell.com/docs/api/reference).

**Batching and digests:** **not documented.** No batching, digest or delay feature was found in the docs or in the first 100,000 characters of the API reference (the last ~37,000 characters were not read).

**Non-production options:** **not documented.** No sandbox, test mode or environment concept was found. The unit of separation is a project, and the free plan has one.

## Courier

**Pricing** (https://www.courier.com/pricing)

- Developer: free, 10,000 sends/month. To go past that, add a card and move to Business.
- Business: $0.005 per send, pay as you go; "No per-seat or channel add-on fees." No monthly base fee is stated.
- Enterprise: custom.
- **Unresolved:** the comparison table lists "Digest & batching" and "Custom environments", most likely in the Enterprise column, but the column layout was lost in extraction and this could not be confirmed. The page does not assign Inbox or Preferences to any plan. This needs checking by eye on the pricing page.
- "Test sends are billable" (https://www.courier.com/docs/get-started/send-a-message); billing counts sends from every environment (https://www.courier.com/docs/workspaces/environments).

**In-app inbox**

- `@trycourier/courier-react` (React 18+) and `@trycourier/courier-react-17` provide `<CourierInbox />`, `<CourierInboxPopupMenu />`, `<CourierToast />` and `<CourierPreferences />`. `useCourier()` exposes the client and surfaces "to build your own UI, or to drive a prebuilt component from outside it" (https://www.courier.com/docs/sdk-libraries/courier-react-web).
- SSR: "Courier Inbox and Toast support Next.js but render client-side only"; Next.js 13+ needs `'use client'`. Other SSR frameworks, including React Router, are not covered.
- React 19 is not mentioned in the docs. npm: `@trycourier/courier-react` 9.3.5 (2026-11-09), peers `react`/`react-dom` `>=18.0.0`, which admits 19 (https://registry.npmjs.org/@trycourier/courier-react). The older `@trycourier/react-inbox` is deprecated on npm in favour of it.
- Web Components (`@trycourier/courier-ui-inbox`) are the framework-agnostic option. The inbox page mentions building "a custom UI on the low-level APIs" without documenting them there (https://www.courier.com/docs/platform/inbox/inbox-overview).

**Email via Postmark:** native. "Keep Postmark as your email provider. Courier sends through your Postmark account." Needs the Server API token and a from address (https://www.courier.com/docs/external-integrations/email/postmark). Provider credentials are set per environment.

**Preferences:** built on subscription topics, each with a default of opted in, opted out or required. Users override per topic. A per-topic channel choice is stored as `custom_routing` and applies only when the topic has channel selection enabled. Hosted preference page and an in-app preference center; preferences API. The page notes that where custom routing over the API "isn't available" a write returns `402`, which implies a plan gate that the page does not spell out (https://www.courier.com/docs/platform/preferences/preferences-overview).

**Identity and browser auth**

- We choose the `user_id`. `POST /profiles/{user_id}` merges, `PUT` replaces. "A send looks up an existing profile, it doesn't persist one from the `to` object," so profiles must be written separately or contact details passed inline on every send. Authenticating a user to the inbox registers them (https://www.courier.com/docs/platform/users/users).
- Browser auth is a JWT, but unlike the others it is not signed locally: "Your backend mints a short-lived, scoped token with your Courier API key" by calling Courier's Issue Token endpoint, with scopes such as `user_id:<id> inbox:read:messages inbox:write:events`. Omitting `expires_in` "mints a token that never expires." "The SDKs do not refresh tokens" (https://www.courier.com/docs/platform/inbox/authentication).

**Real-time:** yes. `inbox.listenForUpdates()` "opens the WebSocket connection required for real-time updates"; without that call the inbox loads once (https://www.courier.com/docs/sdk-libraries/courier-react-web).

**Batching and digests**

- Batch node: releases on inactivity, a maximum event count or a maximum wait; scope global, user or dynamic (https://courier.com/docs/platform/automations/batching). This page sits under Automations, which another Courier docs page titles "Automations (Legacy)" (https://www.courier.com/docs/platform/automations/automations-overview); the newer product is Journeys. How batching is configured in Journeys was not read.
- Digests: per subscription topic, with a schedule and a linked digest template; recipients can pick a schedule in the preference center (https://www.courier.com/docs/platform/sending/digest-send).
- Plan availability for both is the unresolved pricing-table point above.

**Non-production options**

- "Every workspace starts with Production and Test environments, and you can add up to 18 custom ones" (https://www.courier.com/docs/workspaces/overview). Environments are isolated, with separate keys, templates, integrations and logs.
- Key types: Published (`pk_`) and Draft (`dk_`) (https://www.courier.com/docs/workspaces/environments).
- The Test environment's default email provider "only delivers to the address you signed up with."
- **Unconfirmed:** a search result summary described a "Mock" key type that simulates the lifecycle without calling the downstream provider, listed under Enterprise. The environments page read directly does not mention Mock keys, and the page the summary pointed to returned 404. Treat as unverified.

## SuprSend (additional candidate)

Found as a further hosted provider with an inbox, preferences and a native Postmark integration. Read less deeply than the four named candidates.

**Pricing** (https://www.suprsend.com/pricing)

- Free: $0, 10,000 notifications/month, unlimited team members, 30-day logs, feed shows SuprSend branding. Past the limit: "We do not stop processing and sending your notification requests."
- Essentials: $100/month, 50,000 notifications, $0.002 per additional.
- Business: $250/month, 50,000 notifications, $0.005 per additional.
- As extracted, "User Preferences" and "Batching & digest" are listed from Business, not on Free or Essentials. The per-plan markers partly failed to extract, so this needs confirming by eye. Free accounts get a 30-day trial of all features.

**In-app inbox:** `@suprsend/react` has drop-in inbox components; `@suprsend/react-core` has hooks and providers for custom UI (https://docs.suprsend.com/docs/inbox-react, https://docs.suprsend.com/docs/react-sdk). npm: `@suprsend/react` 1.5.0 (2026-10-22), peer `react >= 16.8.0` (https://registry.npmjs.org/@suprsend/react). SSR and React 19 are not addressed on the pages read.

**Email via Postmark:** native; needs the Postmark Server Token and a verified from address (https://docs.suprsend.com/docs/postmark).

**Preferences:** global channel opt-outs, category preferences, and channel opt-outs within a category; category defaults On, Off or Can't Unsubscribe. Hosted preference page, embeddable React components, and get/update APIs (https://docs.suprsend.com/docs/user-preferences). The same page says the inbox channel requires a feature flag from support; what that means in practice was not established.

**Identity and browser auth:** users have a `distinct_id`. Client SDKs use a public API key; with Enhanced Security Mode on, "All requests will be rejected by SuprSend if enhanced security mode is on and signed user token is not provided." The token is an ES256 JWT signed on our backend with a signing key (`entity_type: "subscriber"`, `entity_id`, `iat`, `exp`); a refresh callback exists (https://docs.suprsend.com/docs/client-authentication).

**Real-time:** a search over docs.suprsend.com reported a `feedClient.initializeSocketConnection()` call in the headless example and a `socketHost` option on the `Inbox` component, but the page containing them was not opened directly (https://docs.suprsend.com/docs/javascript-sdk, read directly, does not mention sockets). Treat real-time as indicated but not verified at the source.

**Batching and digests:** batch node with fixed, dynamic and relative windows and a batch key; `$batched_events` retains 1 to 100 items, default 10 (https://docs.suprsend.com/docs/batch). A separate digest node exists; its page was not read.

**Non-production options:** three default workspaces. Sandbox is "A demo workspace designed for quick exploration and POC" with pre-configured vendors, capped and time-limited, email only to verified addresses. Staging: "Enable Test Mode to safely validate workflows without delivering messages to real users." Test Mode is not available in Sandbox or Production (https://docs.suprsend.com/docs/workspaces).

## Other candidates

- **NotificationAPI:** its pricing URL now redirects to Pingram (https://www.notificationapi.com/pricing redirects to https://www.pingram.io/pricing). That page prices email, SMS and voice sent through the vendor's own delivery, and does not mention in-app notifications, preferences or bringing your own email provider. Not pursued further. npm still publishes `@notificationapi/react` 2.0.1 (2026-10-23, peers include React 19).
- No other hosted provider was examined. Marketing-messaging platforms were not surveyed.

## Running without credentials

The map requires the app and its tests to run with no provider credentials, with a local stand-in equivalent to today's `.outbox/` mail transport. What the sources establish:

1. **No provider documents a zero-credential mode.** Every sandbox, test mode, demo provider and development environment above is a hosted feature that needs an account and an API key. They help with a shared dev or staging setup, not with a fresh clone or CI.
2. **Server side (emitting an event).** All five expose an HTTP API and a Node SDK, so the emit call can sit behind a small interface of our own with a local implementation, the same shape as today's mailer switch on `POSTMARK_SERVER_TOKEN`. None of the docs read describe an official fake or a documented base-URL override for pointing the SDK at a local server (Knock's API overview lists one base URL only; the others were not found either way).
3. **Browser side (the inbox).** This is the larger gap. Prebuilt inbox components talk straight to the provider from the browser and need at least a public key. With no credentials there is nothing for them to connect to, so a stand-in must either replace the inbox UI or feed a custom (headless) UI from a local store. Providers with documented headless hooks or a feed API (Knock, Novu, SuprSend, Courier's `useCourier`) describe the custom-UI path; a stand-in still has to be written by us in every case.
4. **Minting the browser token.** Knock (RS256), Novu (HMAC-SHA256), MagicBell (HS256) and SuprSend (ES256) sign locally on our server with no network call. Courier's token is issued by calling Courier's API. Knock, Novu and SuprSend allow the signed token to be off in a development environment; MagicBell's React provider requires a token.
5. **Preferences and read state** live at the provider. A local stand-in that only records emitted events (like `.outbox/`) will not exercise preferences, read state, batching or channel routing; tests of those behaviours would need either a richer stand-in or a real development environment.

## Trade-offs in brief

- **Free-tier shape differs more than size.** Knock, Novu, Courier and SuprSend all publish 10,000/month; MagicBell publishes 1,000 deliveries counted per channel. Novu's free plan additionally caps workflows at 5 and digest windows at 24 hours, and brands the Inbox. Knock's and SuprSend's free plans brand the feed.
- **The first paid step varies widely:** Novu from $30/month; SuprSend $100; MagicBell $249; Knock $250; Courier has no stated base fee and charges $0.005 per send.
- **Postmark** is a native integration for Knock, Novu, Courier and SuprSend. MagicBell does not list it; SMTP is the only documented route that could reach Postmark.
- **React 19** is explicitly declared by Knock and Novu (npm peer ranges; Novu also in docs). Courier's and SuprSend's ranges admit it without saying so. MagicBell's current package declares nothing.
- **Server-rendered React Router** is not addressed by any provider's docs. Courier states its components render client-side only; Novu has a Remix quickstart that does not discuss SSR. Behaviour under React Router 8 server rendering is untested for all of them.
- **Preferences by type and channel** exist everywhere. The models differ: Knock (workflow/category x channel), Novu (workflow x channel, with a built-in view), MagicBell (category x channel), Courier (topics, channel choice possibly plan-gated), SuprSend (category x channel, possibly from the $250 plan).
- **Browser auth:** local signing for Knock, Novu, MagicBell and SuprSend; a server-to-Courier call for Courier. Knock, Novu and SuprSend are open by default until the security toggle is turned on.
- **Batching and digests:** Knock has batching on all plans but no built-in scheduled digest. Novu has both, with window length tied to plan. Courier has both, plan availability unresolved. SuprSend has both, apparently from Business. MagicBell documents neither.
- **Non-production tooling:** Knock has the most explicit documented dry-run (per-channel and per-trigger sandbox mode). Novu has a development environment and limited demo providers. Courier has a Test environment whose sends are billable. SuprSend has Test Mode in Staging. MagicBell documents nothing. None removes the need for our own local stand-in.

## What the docs did not answer

- Whether any provider's React components render safely under React Router 8 server rendering (no provider addresses it).
- Knock: SSR behaviour; whether the `next` and `@tanstack/react-router` peer dependencies are optional.
- Novu: real-time transport; inbox retention per plan; whether subscribers must exist before a trigger (docs contradict themselves); the Team digest maximum (30 vs 90 days); whether Development sends can be dry-run.
- MagicBell: Postmark support; batching or digests; any test mode or environments; React version support; headless usage with the current package; plan gating of inbox and preferences; whether broadcasts create unknown users.
- Courier: which plan includes digest and batching, custom environments, Inbox and Preferences; whether Mock API keys exist and on which plan; React 19 support in the docs; how batching works in Journeys versus legacy Automations.
- SuprSend: which plans include preferences and batching/digest (extraction unreliable); React 19 and SSR; the inbox feature-flag remark; the digest node.
- For all: inbox message retention, API rate limits relevant to us, and failure behaviour when the provider is unreachable were not researched.
