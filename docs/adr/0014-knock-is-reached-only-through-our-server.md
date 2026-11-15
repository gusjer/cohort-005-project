# Knock is reached only through our server, and the app owns the copy

Everything the app does with Knock goes through one server-side module: emitting a Notification, reading a person's inbox, changing read state and preferences. The browser never talks to Knock. The app also writes the words of every Notification in code and sends them as the payload, so each Knock workflow is a thin pass-through. We chose this because the app and its tests must run with no credentials: one server-side seam needs one local stand-in, and a stand-in can only show what Knock would show if the copy is ours.

## Considered Options

- **Knock's React hooks in the browser** (what ADR 0013 assumed). Rejected: the stand-in would need a second, browser-side fake of Knock's client, the hooks are undocumented under server-rendered React Router, and the browser would need a signed token.
- **Templates held in Knock, the app sending only data.** Rejected: every template would be duplicated locally for the stand-in, and the three existing Refund Request emails would be re-authored in a dashboard where tests cannot see them.

## Consequences

- No websocket. The inbox updates on navigation or revalidation, not live.
- Knock's template editor goes unused, and a change of wording needs a deploy.
- The browser needs no Knock token, so Knock's enhanced security mode and its signing key are not used.
- A Notification that fails to reach Knock is logged and lost. The action that caused it still succeeds.
