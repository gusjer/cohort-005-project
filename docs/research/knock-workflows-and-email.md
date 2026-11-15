# Knock: workflows in the repo, plain-text email, server-side feed and preferences

Research for issue #12. Sources are Knock's own documentation, OpenAPI specifications and pricing page, read on 2026-11-15. Nothing here was tested against a live Knock account. Each answer is marked **Verified** (stated by a primary source) or **Unverified** (the sources are silent or only imply it).

## Summary

| Question | Answer | Status |
| --- | --- | --- |
| CLI pull/push of workflows as files on the free plan | Yes. "Manage via API & CLI" is included in Free. | Verified |
| Plain-text email with no HTML layout | The layout can be removed entirely and the text part can be written by us. An email with no HTML part at all is not documented. | Partly verified |
| Server lists a user's feed, marks items read | Yes, with the secret key. | Verified |
| Server reads and writes a user's preferences | Yes, with the secret key. | Verified |
| Preference per workflow, category, channel type, workflow + channel type | Yes to all four. | Verified |
| Default when nothing is set | Opted in to everything; an environment default set can change the baseline. | Verified |
| Defaults managed from files/CLI | Dashboard or Management API only; not a CLI resource. | Verified (CLI absence is by omission) |
| Workflow that cannot be opted out of | `settings.override_preferences: true` on the workflow; lives in `workflow.json`. | Verified; free-plan availability unverified |
| Preference calls need the user to exist first | Not stated for the preference endpoints. | Unverified |
| In-app opt-out prevents the feed item | The channel step is skipped before a message is enqueued. | Verified by two pages, not stated in those exact words |

## 1. Workflows as files, on the free plan

**The CLI pulls and pushes workflows as files.** `knock workflow pull` downloads "workflows with its message templates from Knock to a local file system", and `knock workflow push` uploads a workflow directory: "Knock will update an existing workflow by the matching workflow key, or create a new workflow if it does not exist yet." `--all` with `--workflows-dir` handles every workflow at once. Verified.
- https://docs.knock.app/cli/workflow/pull
- https://docs.knock.app/cli/workflow/push

**It is on the free plan.** The pricing table's "Manage via API & CLI" row is "Yes" for Free, as are "Version control & history" and "Isolated environments" (Unlimited). Verified. The docs pages for the CLI, service tokens and Management API state no plan requirement.
- https://knock.app/pricing

**File layout.** One directory per workflow key holding `workflow.json` plus one folder per channel step for its content, for example `workflows/my-workflow/workflow.json`, `email_1/...`, `in_app_feed_1/markdown_body.md`. Local files arranged this way can be created in Knock with `knock workflow push --all`. Verified.
- https://docs.knock.app/cli/workflow/file-structure

**Project configuration.** A `knock.json` with `{"knockDir": ".knock"}` tells the CLI where resources live; `knock pull` / `knock push` then cover every resource type. The directory tree lists audiences, goals, guides, layouts, message-types, partials, reusable-requests, schemas, translations and workflows. Verified.
- https://docs.knock.app/developer-tools/knock-cli
- https://docs.knock.app/cli/overview/directory-structure

**Authentication.** `knock login` (interactive) or a service token (`knock_st_...`) for CI. Only account owners or admins can create service tokens, and a service token works against the Management API, CLI and MCP server but "not the Knock API". So the repo needs two secrets: a service token for pushing workflows and the secret API key for runtime calls. Verified.
- https://docs.knock.app/developer-tools/service-tokens

**A push is not live until committed.** `--commit` (with `-m`) pushes and commits in one step. Verified.
- https://docs.knock.app/cli/workflow/push

**Environments.** A new account has a single environment, production, and "Every account can create content directly in production." Enabling environments adds development, promotion and branches, cannot be undone, and makes development the CLI's default environment. "Content can only be edited in the environment in which it was created." With environments on, the flow is push to development, commit, then `knock commit promote --to=production`. Verified.
- https://docs.knock.app/version-control/environments
- https://docs.knock.app/version-control/overview
- https://docs.knock.app/tutorials/integrating-into-cicd

**Nothing stops dashboard edits.** No source describes a setting that makes the dashboard read-only for workflows, so "not edited in the dashboard" is a team convention, enforceable only by re-pushing from the repo (`--force` overwrites what is stored). Unverified whether any lock exists.

**Fallback.** The Management API has the same operations (workflow list, retrieve, upsert, activate, validate) and is what the CLI is built on; it is in the same "Manage via API & CLI" pricing row. Verified.
- https://docs.knock.app/mapi-reference/workflows/upsert

## 2. Plain-text email

**The layout can be removed completely.** "To send a template without any layout wrapper, select "No layout" in the "Email layout" dropdown in your email channel step's template settings." In files this is the email template's `settings.layout_key`: "The `key` of the email layout that wraps the email template. When omitted, the email template will need to define the `<html>` structure." Verified.
- https://docs.knock.app/integrations/email/layouts
- https://docs.knock.app/mapi/openapi.json (schema `EmailTemplate`)

**The text part can be ours, verbatim.** The email template has a `text_body`: "A text template for the email body. When omitted, the email template will be autogenerated from the `html_body` or `visual_blocks`." Verified.
- https://docs.knock.app/mapi/openapi.json (schema `EmailTemplate`)

**An HTML part appears to be mandatory.** `html_body` is "**Required** if `visual_blocks` is not provided." No source describes sending an email with a text part only. Unverified whether a text-only email is possible; the documented shape always carries an HTML body.

**Least layout that is documented:** no layout, an `html_body` that is a bare HTML document around the copy our app rendered, and a `text_body` holding the same copy as plain text. The recipient gets a multipart email whose HTML part is unstyled, which is not identical to today's text-only Postmark emails.

**Possible escape hatches, both unverified:**
- Payload overrides: "Provide a JSON object to merge into the API payload that is sent to the downstream provider", settable at channel or workflow-step level. Whether this can blank Postmark's `HtmlBody` is not documented, and the Postmark page does not say which body fields Knock sends.
- A custom layout has a separate plain-text version (`text_layout`, required alongside `html_layout`) into which the template's plaintext body is injected at `{{content}}`. This controls the text part's wrapper, not whether an HTML part exists.
- https://docs.knock.app/integrations/email/postmark
- https://docs.knock.app/cli/email-layout/file-structure

**Things Knock adds to a Postmark send.** `Metadata.sender` = `knock.app`, `Metadata.knock_message_id`, `Metadata.knock_recipient_id`, and `Tag` = the workflow key. Knock sets no `MessageStream`, so Postmark's default transactional stream is used. CSS inlining is on by default. Knock open and link tracking are channel settings under Advanced; whether they default to on is unverified, and link tracking would rewrite links, so check them for a plain email. Verified except where noted.
- https://docs.knock.app/integrations/email/postmark

**Branding.** "Remove Knock branding" is "No" on Free. The pricing page does not say where the branding appears, and the email docs mention no Knock branding in email bodies. Unverified whether it touches email at all.
- https://knock.app/pricing

## 3. Server-side feed and preferences

**The secret key can call everything.** Secret keys "can perform any API request to Knock", sent as `Authorization: Bearer sk_...`. Public keys "are only meant to identify your account". Key scope cannot be reduced. Verified.
- https://docs.knock.app/developer-tools/api-keys
- https://docs.knock.app/api-reference/overview/authentication

**List a user's feed.** `GET /v1/users/{user_id}/feeds/{id}` where `{id}` is the in-app channel id. Returns `entries` (feed items), `meta` (`total_count`, `unread_count`, `unseen_count`) and `page_info`. Filters include `status`, `archived`, `tenant`, `workflow_categories`; pagination by `after` / `before` / `page_size` (default 50). "If the user has not yet been identified within Knock, an empty feed will be returned." The publishable key plus user token is only described as the client-side way of calling it. "Feed API" is "Yes" on Free. Verified. Note the in-app docs describe the feed mainly through client SDKs; the server-side use rests on the endpoint reference and the secret-key statement above, not on a guide that walks through it.
- https://docs.knock.app/api-reference/users/feeds/list_items
- https://docs.knock.app/in-app-ui/api-overview
- https://knock.app/pricing

**Mark items read.** `PUT /v1/messages/{message_id}/read` marks one message read, `DELETE` on the same path marks it unread, and `POST /v1/messages/batch/read` with `{"message_ids": [...]}` marks many. Equivalent endpoints exist for seen, interacted and archived. Verified.
- https://docs.knock.app/api-reference/messages/mark_as_read
- https://docs.knock.app/api-reference/messages/batch/mark_as_read

**No real-time push to our server.** Unverified and out of scope here: the docs describe live feed updates through the client socket only; a server-side inbox would poll or refetch.

## 4. Preferences

### a. Shape of a PreferenceSet

"A preference set is built using four keys: `categories`, `channels`, `channel_types`, `workflows`." A user's `default` set also carries `commercial_subscribed`. Verified.

```json
{
  "channel_types": { "email": false },
  "categories": {
    "collaboration": { "channel_types": { "email": true, "in_app_feed": true } }
  },
  "workflows": {
    "mention": false,
    "invoice-issued": { "channel_types": { "email": true } }
  }
}
```

| Granularity | Supported | How |
| --- | --- | --- |
| Per workflow | Yes | `workflows.<key>: false` |
| Per category | Yes | `categories.<key>: false` |
| Per channel type | Yes | top-level `channel_types.<type>` |
| Per workflow + channel type | Yes | `workflows.<key>.channel_types.<type>` |
| Per category + channel type | Yes | `categories.<key>.channel_types.<type>` |
| Per specific channel | Yes | `channels.<channel uuid>`, also nestable |

Conflict rules, verified: "Knock only sends a notification if all preference combinations that exist on the recipient evaluate to `true`." A category set to `false` blocks the notification even if a channel type is `true`. A specific `channel` preference takes priority over a `channel_type` preference.
- https://docs.knock.app/preferences/overview

A user can hold several preference sets, addressed by id; `default` is the one used when no tenant is on the trigger.
- https://docs.knock.app/api-reference/users/get_preferences

### b. When a person has never set preferences

"If you do not set a preference for a given channel, workflow, or workflow category, Knock defaults them to `true`." Verified.

An **environment default** PreferenceSet can change that baseline: "When Knock evaluates preferences for a recipient who has not set any preferences of their own, the environment default serves as the baseline." It is "always the lowest priority in the merge hierarchy"; the order is the recipient's set, then (only when a tenant is on the trigger) the tenant default, then the environment default. Verified.
- https://docs.knock.app/preferences/overview

**Managing defaults.** The environment default is set "either in the Knock dashboard or with the Management API": `PUT /v1/environments/{environment_slug}/defaults` with a `preference_set` body, which "replaces any existing set in full, and `null` clears it". Changes apply immediately and are not committed or promoted. Verified.
- https://docs.knock.app/mapi-reference/environments/defaults/update

The CLI's directory structure lists no preferences resource, so the default set cannot be pulled or pushed as a file with the CLI; keeping it in the repo means a script that calls the Management API with a service token. Verified by omission only.
- https://docs.knock.app/cli/overview/directory-structure

**Tenant defaults** exist, but "Per-tenant preferences" is "No" on Free and Starter (Enterprise only). Verified.
- https://knock.app/pricing

Whether `GET` preferences returns the merged effective set or only what the user stored, for a user with nothing set, is unverified. The reference documents only a 200 response with an example whose `id` is `"default"`.

### c. A workflow that cannot be opted out of

Workflow setting `override_preferences`: "Whether to ignore recipient preferences for a given type of notification. If true, will send for every channel in the workflow even if the recipient has opted out of a certain kind. Defaults to false." It is part of the workflow definition (`settings.override_preferences` in the upsert request, so it lives in `workflow.json`). In the dashboard: open the workflow, "Manage workflow", enable "Override recipient preferences"; "You will need to commit this change for it to take effect." Verified.
- https://docs.knock.app/mapi/openapi.json (schema `WorkflowRequest`)
- https://docs.knock.app/preferences/overview

Free-plan availability: unverified. No source ties it to a plan, and the pricing table does not list it; "Preferences" as a whole is "Yes" on Free.

Related: `settings.is_commercial` (default false) marks a workflow as commercial, which makes it subject to the user's `commercial_subscribed` flag. Our seven workflows should leave it false.

### d. Server-side calls for a user's preferences

| Call | Endpoint |
| --- | --- |
| List all sets | `GET /v1/users/{user_id}/preferences` |
| Get one set | `GET /v1/users/{user_id}/preferences/{id}` (`default`) |
| Set | `PUT /v1/users/{user_id}/preferences/{id}` |
| Unset | `DELETE /v1/users/{user_id}/preferences/{id}` |
| Bulk set | `POST /v1/users/bulk/preferences` |

`PUT` replaces by default: "By default, this is a destructive operation and will replace any existing preferences with the preferences given. Use '__persistence_strategy__': 'merge' to merge with existing preferences instead." Verified.
- https://docs.knock.app/api-reference/users/set_preferences
- https://docs.knock.app/api-reference/users/get_preferences
- https://docs.knock.app/api-reference/users/unset_preferences

**Does the user have to exist first?** Unverified. The preference endpoint references document only success responses and say nothing about unknown users. What is verified nearby:
- "All identification methods in Knock use an upsert approach", and inline identification on a trigger "enables lazy recipient creation".
- Preferences can be sent inside identification (the identify call or a trigger's recipient object) under `preferences: { "default": { ... } }`. That path deep-merges instead of replacing, and Knock recommends the preference endpoints for normal use.
- The feed endpoint explicitly returns an empty feed for a never-identified user; the preference endpoints make no such statement.

Safe design if this matters before it is tested: write preferences through `PUT /v1/users/{user_id}` (identify, an upsert) with a `preferences` key, or identify the user before the first preference write.
- https://docs.knock.app/managing-recipients/identifying-recipients

### e. Does an in-app opt-out prevent the feed item?

Yes, by the documented order of execution. A channel step checks, in order, step conditions, required recipient data, then "the recipient's preferences to see if they have opted out from receiving notifications on this channel or from this workflow", and only "If the step continues, Knock will render the template associated with the step and enqueue a message". The debugging page lists it as a skip: "Recipient preferences opt out. If the recipient has set preferences that opt them out of this notification type or channel, the step is skipped." A skipped step enqueues no message, and feed items are messages on the in-app channel, so no feed item is created. Verified from these two pages; no page states "no feed item is created" in those words, and it was not tested.
- https://docs.knock.app/designing-workflows/channel-step
- https://docs.knock.app/send-notifications/debugging-workflows

The channel type key for the feed in a PreferenceSet is `in_app_feed`.
- https://docs.knock.app/preferences/overview

## Open items worth one live test

1. Whether an email can go out with no HTML part (for example via a Postmark payload override), and what the no-layout HTML part looks like in a mail client.
2. Whether `PUT /v1/users/{user_id}/preferences/default` succeeds for a user that was never identified.
3. Whether `GET` preferences returns the merged effective set (with environment defaults) or only stored values.
4. Whether "Override recipient preferences" is usable on Free, and where Free-plan Knock branding appears.
5. Whether Knock open/link tracking is on by default for a new Postmark channel.
