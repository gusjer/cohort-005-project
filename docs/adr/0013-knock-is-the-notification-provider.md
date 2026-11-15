# Knock is the notification provider

Notifications are stored and delivered by Knock, a hosted provider, which sends email through Postmark. We judged providers on their free tier, because v1 is a small catalogue far below any volume limit, and Knock was the only candidate whose free tier includes everything we need: no cap on workflows or environments, preferences by type and channel, batching, a feed API with React hooks for an inbox we build ourselves, and a browser token our server signs without calling the provider.

The comparison behind this is in `docs/research/notification-providers.md` on the `research/notification-providers` branch, checked 2026-11-15.

## Considered Options

- **Novu Cloud.** Rejected although its first paid plan is far cheaper ($30 a month against $250). Its free plan allows 5 workflows against a v1 catalogue of 4 to 8 Notifications, and its preferences are per workflow, so sharing a workflow between Notifications would break preferences by type.
- **SuprSend.** Rejected: preferences and batching appear to start at its $250 plan, and the in-app channel needs a flag enabled by its support.
- **Courier.** Rejected: the browser token is issued by calling Courier's API, so the app cannot mint one offline, and sends from the test environment are billed.
- **MagicBell.** Rejected: no Postmark integration, a free tier of 1,000 deliveries counted per channel, and no documented test mode or batching.

## Consequences

- No provider runs without credentials, so the local stand-in is ours, on the server and in the browser. For that reason the inbox is our own interface on Knock's hooks, not Knock's prebuilt components.
- Knock has no scheduled digests. A daily or weekly digest would need our own scheduler, which the app does not have.
- Outgrowing 10,000 messages a month means a step to $250 a month.
- Knock's hooks are untested under server-rendered React Router. If they fail there, the fallback is Knock's Feed API from our own code, not another provider.
