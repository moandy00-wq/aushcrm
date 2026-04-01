# AushCRM Plan — Context7 Validation Report

> Generated 2026-03-31. Each library referenced in the plan was resolved via Context7 and queried against current documentation.

---

## 1. @supabase/ssr

**Status: VERIFIED**

- `createBrowserClient()` — Confirmed. Creates a singleton Supabase client for browser with automatic `document.cookie` handling. API matches plan.
- `createServerClient()` — Confirmed. Requires explicit `cookies: { getAll, setAll }` handlers. The plan's middleware pattern (using `request.cookies.getAll()` and `response.cookies.set()`) matches the current documented pattern exactly.
- Middleware cookie pattern — Confirmed. The `NextResponse.next({ request })` + double cookie-set pattern (on request and response) is the current recommended approach.
- Server Component pattern — Confirmed. Uses `cookies()` from `next/headers` with read-only `getAll`.

No issues found.

---

## 2. @supabase/supabase-js

**Status: VERIFIED**

- `supabase.auth.getUser()` — Confirmed. Returns `{ data: { user }, error }`. API matches plan.
- `.from('table').select()` — Confirmed. Standard PostgREST query builder.
- `.rpc('function_name', params)` — Confirmed. Returns `{ data, error }`. Plan uses this for atomic position re-indexing.
- Realtime: `supabase.channel('name').on('postgres_changes', { event, schema, table }, callback).subscribe()` — Confirmed. This is the current API. The plan references this pattern for kanban board sync.
- `.range()` for pagination — Standard PostgREST API, confirmed.

No issues found.

---

## 3. Vercel AI SDK (`ai` package)

**Status: ISSUES FOUND**

### Issue 3a: `generateObject()` is DEPRECATED

The plan references `generateObject()` at Step 3.5 (extract.ts):
> "Calls Claude with `generateObject()` + `interviewExtractionSchema`"

**Current API**: `generateObject()` is deprecated in AI SDK v5+. The replacement is `generateText()` with `Output.object()`:

```typescript
// DEPRECATED (plan references this)
import { generateObject } from 'ai';
const result = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: interviewExtractionSchema,
  prompt: '...',
});

// CORRECT replacement
import { generateText, Output } from 'ai';
const { output } = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  output: Output.object({ schema: interviewExtractionSchema }),
  prompt: '...',
});
```

**Correction needed**: Step 3.5 must replace `generateObject()` with `generateText()` + `Output.object()`. The result is accessed via `result.output` instead of `result.object`.

### Issue 3b: `useChat()` API has breaking changes in v5+

The plan references `useChat()` at Step 3.3 with:
- `api` option directly on `useChat()`
- `body: { leadId, nonce }` option directly on `useChat()`
- Implied use of `handleSubmit`, `handleInputChange`, `input` from the hook

**Current API (v5+)**:
- `input`, `handleInputChange`, `handleSubmit` are **removed** from `useChat()`. Input state must be managed manually with `useState`.
- The `api` option is **deprecated**. Use `transport: new DefaultChatTransport({ api: '/api/interview' })` instead.
- The `body` option is **deprecated** at hook level. Pass it via `DefaultChatTransport({ body: { leadId, nonce } })` or per-request via `sendMessage({ text }, { body: { leadId, nonce } })`.
- `isLoading` is **replaced** by `status` for more granular control.
- Messages are sent via `sendMessage({ text: input })` instead of `handleSubmit`.

**Correction needed**: Step 3.3 must be updated to use:
```typescript
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

const [input, setInput] = useState('');
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/interview',
    body: { leadId, nonce },
  }),
});
```

### Issue 3c: `streamText()` and `toUIMessageStreamResponse()` — VERIFIED

`streamText()` from `ai` and `result.toUIMessageStreamResponse()` are confirmed current API. No issues.

### Issue 3d: `convertToModelMessages()` — VERIFIED

`convertToModelMessages()` is confirmed current API for converting UI messages to model-compatible format. The plan's API route pattern of `const { messages } = await req.json()` followed by `convertToModelMessages(messages)` is correct.

### Issue 3e: `Output.object()` — VERIFIED

`Output.object({ schema })` is confirmed current API for structured output generation with `streamText()` and `generateText()`.

---

## 4. @ai-sdk/anthropic

**Status: VERIFIED**

- `anthropic('claude-sonnet-4-20250514')` — Confirmed. The provider function accepts a model ID string directly. The format `anthropic('model-id')` is correct.
- Model ID `claude-sonnet-4-20250514` — This is a valid Claude model ID format. The provider also supports aliases like `anthropic.chat()` and `anthropic.languageModel()`.

No issues found.

---

## 5. @ai-sdk/react

**Status: ISSUE FOUND (see Issue 3b above)**

The `useChat()` hook API has changed significantly in v5+. The plan must account for:
- Manual input state management (`useState`)
- `sendMessage()` instead of `handleSubmit()`
- `DefaultChatTransport` for API/body configuration
- `status` instead of `isLoading`

See Issue 3b for full details and corrections.

---

## 6. resend

**Status: VERIFIED**

- `new Resend('api-key')` — Confirmed. Constructor accepts API key string.
- `resend.emails.send({ from, to, subject, html })` — Confirmed. Returns `{ data, error }`. Supports `react` property for React Email templates as an alternative to `html`.
- Tags, idempotency keys — Available but not referenced in plan (fine).

No issues found.

---

## 7. @react-email/components

**Status: VERIFIED**

- All referenced components confirmed available from `@react-email/components`:
  - `Html` — confirmed
  - `Head` — confirmed
  - `Body` — confirmed
  - `Container` — confirmed
  - `Text` — confirmed
  - `Button` — confirmed
  - `Heading` — confirmed (also available)
  - `Section` — confirmed (also available)
  - `Hr` — confirmed (also available)
  - `Preview` — confirmed (also available)
- `Tailwind` component also available for CSS styling in emails.

No issues found.

---

## 8. @dnd-kit/react

**Status: VERIFIED**

- `DragDropProvider` — Confirmed. Imported from `@dnd-kit/react`. Accepts `onDragStart`, `onDragOver`, `onDragEnd` callbacks.
- `useSortable` — Confirmed. Imported from `@dnd-kit/react/sortable`. Accepts `{ id, index, type, accept, group }` props.
- `group` prop for multi-list — Confirmed. Used to categorize items by column in kanban boards. Items with the same `group` value belong to the same list.
- `move` helper — Confirmed. Imported from `@dnd-kit/helpers`. Used in `onDragEnd` for simple state updates.
- Kanban pattern (columns as sortable containers with `collisionPriority`, items with `group`) — Confirmed as documented pattern.

No issues found.

---

## 9. next-themes

**Status: VERIFIED**

- `ThemeProvider` — Confirmed. Imported from `next-themes`.
- Props confirmed: `attribute`, `defaultTheme`, `enableSystem`, `forcedTheme`, `themes`, `storageKey`, `enableColorScheme`, `disableTransitionOnChange`, `nonce`, `value`, `scriptProps`.
- The plan uses light mode only for the dashboard (can use `forcedTheme="light"` or `enableSystem={false}` with `defaultTheme="light"`).

No issues found.

---

## 10. zod

**Status: VERIFIED**

- `z.object()` — Confirmed
- `z.string()` with `.min()`, `.max()`, `.email()`, `.uuid()` — Confirmed
- `z.enum()` with string array — Confirmed
- `z.array()` — Confirmed
- `z.number()` with `.int()`, `.positive()`, `.nonnegative()`, `.max()` — Confirmed
- `.default()` — Confirmed
- `.optional()` — Confirmed
- `.nullable()` — Confirmed

All schema patterns in the plan (Section 2.2) use standard, current Zod v3 API. No issues.

---

## 11. recharts

**Status: VERIFIED**

- `LineChart` — Confirmed
- `BarChart` — Confirmed
- `PieChart` — Confirmed
- `ResponsiveContainer` — Confirmed
- Additional components available: `ComposedChart`, `FunnelChart`, `AreaChart`, `RadarChart`, `ScatterChart`, `Treemap`
- Standard sub-components: `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `Line`, `Bar`, `Pie`, `Cell`, `Label`

All chart types referenced in the plan are available. No issues.

---

## Summary of Issues

| # | Library | Issue | Severity | Correction |
|---|---|---|---|---|
| 3a | `ai` (Vercel AI SDK) | `generateObject()` is deprecated | **HIGH** | Replace with `generateText()` + `Output.object({ schema })` in Step 3.5. Access result via `result.output`. |
| 3b | `@ai-sdk/react` | `useChat()` API has breaking changes: `input`, `handleInputChange`, `handleSubmit`, `api`, `body` are deprecated/removed | **HIGH** | Step 3.3 must use `sendMessage()`, manual `useState` for input, `DefaultChatTransport` for api/body config, `status` instead of `isLoading`. |

---

## Corrections Required in Plan

### Step 3.3 (Chat Interface) — replace `useChat()` usage description:

**Current (incorrect)**:
> - Uses `useChat()` from `@ai-sdk/react`
> - API endpoint: `/api/interview`
> - Passes `body: { leadId, nonce }` with each request

**Should be**:
> - Uses `useChat()` from `@ai-sdk/react` with `DefaultChatTransport` from `ai`
> - Transport configured: `new DefaultChatTransport({ api: '/api/interview', body: { leadId, nonce } })`
> - Input state managed manually via `useState` (useChat no longer provides `input`/`handleInputChange`/`handleSubmit`)
> - Messages sent via `sendMessage({ text: input })` — not `handleSubmit`
> - Loading state via `status` property (not `isLoading`)

### Step 3.5 (Lead Extraction) — replace `generateObject()`:

**Current (incorrect)**:
> - Calls Claude with `generateObject()` + `interviewExtractionSchema`

**Should be**:
> - Calls Claude with `generateText()` + `Output.object({ schema: interviewExtractionSchema })` from `ai`
> - Accesses extracted data via `result.output`
> - Fallback: if `result.output` is null (extraction failed), return partial data with defaults

### Architecture Decisions table — update AI chat entry:

**Current**:
> `useChat()` handles streaming, message state, abort. `streamText()` on server handles Claude API. Built-in message protocol.

**Should add**:
> Uses `DefaultChatTransport` for transport config. `sendMessage()` for submissions. Manual input state via `useState`.

---

## Final Verdict

### NEEDS CORRECTIONS

Two high-severity issues found related to the Vercel AI SDK v5+ API changes:
1. `generateObject()` must be replaced with `generateText()` + `Output.object()`
2. `useChat()` hook API must be updated to use `sendMessage()`, `DefaultChatTransport`, and manual input state

All other 9 libraries (supabase/ssr, supabase-js, @ai-sdk/anthropic, resend, react-email, dnd-kit/react, next-themes, zod, recharts) are **VERIFIED** with no issues.

Once the two AI SDK corrections are applied, the plan is validated for implementation.
