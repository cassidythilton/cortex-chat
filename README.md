# Cortex Chat

> **Conversational analytics interface for Snowflake Cortex Analyst.** Ask questions in natural language, get SQL-generated results — rendered as interactive tables and charts, all governed within the Domo platform.

![version](https://img.shields.io/badge/version-0.0.2-brightgreen)
![platform](https://img.shields.io/badge/platform-Domo_Custom_App-333333?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABPSURBVDhPY/wPBAxUBExAzEJNjf+BmImaGv8DMRMuNQxQjFUNIx41/6GYcTCpYSRkIjmAiZoaGZE1MlFTIyOyRkZqakQ2kQlq4n+oGgYGAJ2dCh5bsHMFAAAAAElFTkSuQmCC)
![license](https://img.shields.io/badge/license-MIT-blue)
&nbsp;
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Snowflake](https://img.shields.io/badge/Snowflake-Cortex_AI-29B5E8?logo=snowflake&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white)
![AG Grid](https://img.shields.io/badge/AG_Grid-34-0084D0)
![Plotly](https://img.shields.io/badge/Plotly.js-3-3F4F75?logo=plotly&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS_Modules-Sass-CC6699?logo=sass&logoColor=white)

---

![Cortex Chat — Landing Page](public/static/01-landing-page.png)

---

## Table of Contents

1. [What Problem Does This Solve?](#what-problem-does-this-solve)
2. [Architecture](#architecture)
3. [Key Capabilities](#key-capabilities)
4. [Code Engine — Backend Functions](#code-engine--backend-functions)
5. [Security Model](#security-model)
6. [Screenshots & UI Tour](#screenshots--ui-tour)
7. [Data Persistence](#data-persistence)
8. [Getting Started](#getting-started)
9. [Available Scripts](#available-scripts)
10. [Project Structure](#project-structure)
11. [Tech Stack](#tech-stack)
12. [License](#license)

---

## What Problem Does This Solve?

Business teams need answers from data — fast. Traditional BI workflows require SQL expertise, dashboard navigation, or waiting for analyst queues. Snowflake's **Cortex Analyst** solves the NL-to-SQL translation problem, but it needs a purpose-built application layer. Domo provides app hosting and governance, but has no native bridge to Cortex Analyst.

**Cortex Chat** closes that gap by combining **three capabilities**:

| Signal | Source | Question It Answers | Status |
|---|---|---|---|
| ![NL→SQL](https://img.shields.io/badge/Natural_Language_→_SQL-Cortex_Analyst-29B5E8) | Snowflake Cortex Analyst API | *"What were our top partners by revenue in 2024?"* | ![status](https://img.shields.io/badge/status-live-brightgreen) |
| ![Query History](https://img.shields.io/badge/Query_History-Domo_AppDB-333333) | Domo Datastores (AppDB) | *"What did I ask last week? Can I rerun that query?"* | ![status](https://img.shields.io/badge/status-live-brightgreen) |
| ![Data Viz](https://img.shields.io/badge/Data_Visualization-AG_Grid_+_Plotly-0084D0) | AG Grid + Plotly.js | *"Show me this as a chart with time aggregation"* | ![status](https://img.shields.io/badge/status-live-brightgreen) |
| ![Conversation Memory](https://img.shields.io/badge/Conversation_Memory-Multi--turn-764ABC) | Redux + Code Engine | *"Now break that down by quarter"* (follow-up) | ![status](https://img.shields.io/badge/status-live-brightgreen) |
| ![Config](https://img.shields.io/badge/Self--Service_Config-In--App-blue) | Domo Datastores | *"Can I point this at a different Snowflake schema?"* | ![status](https://img.shields.io/badge/status-live-brightgreen) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            DOMO PLATFORM                                 │
│                                                                          │
│  ┌─────────────────┐    ┌───────────────────┐    ┌────────────────────┐  │
│  │  Cortex Chat     │    │  Domo AppDB       │    │  Domo Code Engine  │  │
│  │  (React SPA)     │───▶│  (Datastores)     │    │  (Node.js)         │  │
│  │                  │    │                   │    │                    │  │
│  │  • Chat UI       │    │  • configuration  │    │  • OAuth refresh   │  │
│  │  • AG Grid       │    │  • recent_queries │    │  • Cortex Analyst  │  │
│  │  • Plotly.js     │    │                   │    │  • SQL execution   │  │
│  │  • Redux Toolkit │    └───────────────────┘    │                    │  │
│  │                  │                             │                    │  │
│  │                  │─────────────────────────────▶│                    │  │
│  └─────────────────┘                              └─────────┬──────────┘  │
│                                                              │            │
└──────────────────────────────────────────────────────────────┼────────────┘
                                                               │
                                                               ▼
                                                  ┌───────────────────────┐
                                                  │      SNOWFLAKE        │
                                                  │                       │
                                                  │  • Cortex Analyst API │
                                                  │  • Semantic Views     │
                                                  │  • SQL REST API       │
                                                  │  • OAuth 2.0          │
                                                  └───────────────────────┘
```

### Layer Breakdown

| Layer | Technology | Role | Status |
|---|---|---|---|
| ![Frontend](https://img.shields.io/badge/Frontend-React_18-61DAFB) | React, TypeScript, Redux Toolkit | Conversational UI, state, data visualization | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Grid](https://img.shields.io/badge/Data_Grid-AG_Grid-0084D0) | AG Grid Community 34 | Sortable, filterable, paginated tables + CSV export | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Charts](https://img.shields.io/badge/Charts-Plotly.js-3F4F75) | Plotly.js + react-plotly.js | Auto-detected chart types, multi-axis, time aggregation | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Backend](https://img.shields.io/badge/Backend-Code_Engine-333333) | Domo Code Engine (Node.js) | OAuth token mgmt, Cortex Analyst proxy, SQL execution | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Persistence](https://img.shields.io/badge/Persistence-AppDB-333333) | Domo Datastores | Config storage, query history (capped at 50) | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Auth](https://img.shields.io/badge/Auth-OAuth_2.0-orange) | Domo Accounts → Snowflake OAuth | Refresh token flow; no secrets in code | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Proxy](https://img.shields.io/badge/Dev_Proxy-ryuu--proxy-gray) | @domoinc/ryuu-proxy | Local dev → Domo instance API tunneling | ![live](https://img.shields.io/badge/-live-brightgreen) |

---

## Key Capabilities

### 🗣️ Conversational Query Interface

| Feature | Description | Status |
|---|---|---|
| Natural Language Input | Type questions in plain English; Cortex Analyst translates to optimized SQL | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Conversation Memory | Multi-turn history — ask follow-up questions with full context | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Verified Query Suggestions | Pre-built example queries for guided first-run experience | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Processing Animation | Step-by-step overlay: Connect → Analyze → Generate SQL → Execute | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Analyst Interpretation | Shows Cortex Analyst's understanding of the question before results | ![live](https://img.shields.io/badge/-live-brightgreen) |

### 📊 Data Visualization

| View | Technology | Capabilities | Status |
|---|---|---|---|
| ![Table](https://img.shields.io/badge/Table-AG_Grid-0084D0) | AG Grid Community | Sorting, column filtering, pagination `10`/`20`/`50`/`100`, cell text selection, CSV export | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Chart](https://img.shields.io/badge/Chart-Plotly.js-3F4F75) | Plotly.js | Auto chart-type detection (line vs bar), multi-axis, Y-column selection, time aggregation (daily/weekly/monthly/yearly) | ![live](https://img.shields.io/badge/-live-brightgreen) |
| ![Details](https://img.shields.io/badge/Details-Audit_Trail-gray) | React | Question, analyst response, generated SQL, column schema, row count | ![live](https://img.shields.io/badge/-live-brightgreen) |

### 🔄 Query Management

| Feature | Description | Status |
|---|---|---|
| Recent Queries | Persistent history via Domo AppDB — survives page reloads | ![live](https://img.shields.io/badge/-live-brightgreen) |
| One-Click Rerun | Re-execute stored SQL without re-calling Cortex Analyst | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Query Deletion | Delete individual queries with confirmation modal | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Auto-Pruning | Automatically retains only the 50 most recent queries | ![live](https://img.shields.io/badge/-live-brightgreen) |

### ⚙️ Configuration & UX

| Feature | Description | Status |
|---|---|---|
| In-App Config Panel | Set Snowflake database, schema, role, warehouse, semantic view | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Connection Status Bar | Real-time indicator showing active Snowflake configuration | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Dark / Light Theme | Toggle with `localStorage` persistence | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Keyboard Shortcuts | `Enter` to send, `Escape` to close modals | ![live](https://img.shields.io/badge/-live-brightgreen) |
| Error Handling | Retry logic with exponential backoff for transient failures | ![live](https://img.shields.io/badge/-live-brightgreen) |

---

## Code Engine — Backend Functions

The backend runs as a **Domo Code Engine** package — serverless Node.js functions hosted within Domo. Two functions are exposed:

### `callAnalyst`

> ![type](https://img.shields.io/badge/type-NL→SQL_Pipeline-29B5E8) ![runtime](https://img.shields.io/badge/runtime-Node.js-339933?logo=node.js&logoColor=white)

**Parameters:** `message` · `view` · `database` · `schema` · `role` · `warehouse` · `conversationHistory`

| Step | Action | API |
|---|---|---|
| 1 | Retrieve OAuth credentials from Domo Accounts | `sdk.getAccount()` |
| 2 | Mint fresh Snowflake access token via refresh token | `POST /oauth/token-request` |
| 3 | Build Cortex Analyst request body with conversation history | — |
| 4 | Call Cortex Analyst | `POST /api/v2/cortex/analyst/message` |
| 5 | Extract logical SQL (display) + physical SQL (execution) | — |
| 6 | Execute physical SQL on Snowflake | `POST /api/v2/statements` |
| 7 | Return structured response: columns, rows, analyst metadata, updated history | — |

### `executeStoredSql`

> ![type](https://img.shields.io/badge/type-SQL_Re--execution-0084D0) ![runtime](https://img.shields.io/badge/runtime-Node.js-339933?logo=node.js&logoColor=white)

**Parameters:** `sql` · `database` · `schema` · `role` · `warehouse`

Re-executes a previously generated SQL statement against Snowflake without calling Cortex Analyst. Powers the **Rerun Query** feature.

---

## Security Model

| Concern | Approach | Status |
|---|---|---|
| ![secrets](https://img.shields.io/badge/Secrets-Domo_Accounts-orange) | OAuth client ID, client secret, and refresh token stored in Domo's encrypted Accounts system — **never in code** | ![secure](https://img.shields.io/badge/-secure-brightgreen) |
| ![tokens](https://img.shields.io/badge/Token_Lifecycle-Per--Request-orange) | Access tokens minted per-request via refresh token grant; no long-lived tokens cached | ![secure](https://img.shields.io/badge/-secure-brightgreen) |
| ![rbac](https://img.shields.io/badge/RBAC-Snowflake_Role-29B5E8) | Queries execute under the configured Snowflake role, inheriting its permissions | ![secure](https://img.shields.io/badge/-secure-brightgreen) |
| ![governance](https://img.shields.io/badge/Governance-Domo_Platform-333333) | App runs within Domo — inherits SSO, access control, and audit trail | ![secure](https://img.shields.io/badge/-secure-brightgreen) |
| ![mock](https://img.shields.io/badge/Mock_Data-Sanitized-blue) | All mock/test data uses synthetic values — no real credentials, schemas, or PII | ![secure](https://img.shields.io/badge/-secure-brightgreen) |

---

## Screenshots & UI Tour

### Light Mode

<table>
<tr>
<td width="50%">

**Landing Page** — Verified query suggestions, connection status bar, theme toggle

![Landing](public/static/01-landing-page.png)

</td>
<td width="50%">

**Configuration Panel** — Connect to any Snowflake database, schema, warehouse, role, and semantic view

![Config](public/static/02-configuration-panel.png)

</td>
</tr>
<tr>
<td>

**Ask a Question** — Natural language input with send button and helper text

![Ask](public/static/03-ask-question.png)

</td>
<td>

**Processing Animation** — Step-by-step: Connect → Analyze → Generate SQL → Execute

![Processing](public/static/04-processing-animation.png)

</td>
</tr>
<tr>
<td>

**Analyst Response** — Cortex Analyst interpretation + generated SQL in chat

![Analyst](public/static/06-analyst-response.png)

</td>
<td>

**Table Results** — AG Grid: sorting, filtering, pagination, CSV export

![Table](public/static/07-table-results.png)

</td>
</tr>
<tr>
<td>

**Chart View** — Plotly.js with auto-detection, Y-axis selection, time aggregation

![Chart](public/static/08-chart-view.png)

</td>
<td>

**Query Details** — Audit trail: question, analyst response, SQL, results summary

![Details](public/static/09-query-details.png)

</td>
</tr>
<tr>
<td>

**Recent Queries** — Query history with rerun, delete, and result preview

![Recent](public/static/10-recent-queries.png)

</td>
<td>

**Rerun Query** — Re-execute stored SQL with loading indicator

![Rerun](public/static/11-rerun-query.png)

</td>
</tr>
</table>

### Dark Mode

<table>
<tr>
<td width="50%">

![Dark Landing](public/static/13-dark-mode-landing.png)

</td>
<td width="50%">

![Dark Config](public/static/14-dark-mode-config.png)

</td>
</tr>
<tr>
<td>

![Dark Results](public/static/15-dark-mode-results.png)

</td>
<td>

![Dark Chart](public/static/16-dark-mode-chart.png)

</td>
</tr>
<tr>
<td colspan="2">

![Dark Details](public/static/17-dark-mode-details.png)

</td>
</tr>
</table>

---

## Data Persistence

Two Domo AppDB collections back the application:

### `configuration`

> ![collection](https://img.shields.io/badge/collection-configuration-333333) ![type](https://img.shields.io/badge/type-single_document-blue)

| Column | Type | Purpose |
|---|---|---|
| `snowflake_database` | `STRING` | Target Snowflake database |
| `snowflake_schema` | `STRING` | Target schema within the database |
| `snowflake_role` | `STRING` | Snowflake role for query execution |
| `snowflake_warehouse` | `STRING` | Compute warehouse |
| `snowflake_view` | `STRING` | Cortex Analyst semantic view name |

### `recent_queries`

> ![collection](https://img.shields.io/badge/collection-recent__queries-333333) ![type](https://img.shields.io/badge/type-capped_at_50-blue)

| Column | Type | Purpose |
|---|---|---|
| `query_text` | `STRING` | Original natural language question |
| `sql_generated` | `STRING` | Physical SQL (for re-execution) |
| `logical_sql` | `STRING` | Logical SQL (for display) |
| `result_columns` | `STRING` | JSON-stringified column names |
| `result_row_count` | `LONG` | Number of rows returned |
| `created_at` | `STRING` | ISO 8601 timestamp |
| `analyst_message` | `STRING` | Cortex Analyst interpretation text |

---

## Getting Started

### Prerequisites

| Requirement | Details |
|---|---|
| ![node](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white) | Runtime environment |
| ![pnpm](https://img.shields.io/badge/pnpm-recommended-F69220?logo=pnpm&logoColor=white) | Package manager (npm/yarn also supported) |
| ![domo](https://img.shields.io/badge/Domo_CLI-@domoinc/da-333333) | [`@domoinc/da`](https://www.npmjs.com/package/@domoinc/da) + [`ryuu`](https://www.npmjs.com/package/ryuu) |
| ![snowflake](https://img.shields.io/badge/Snowflake-Cortex_Analyst-29B5E8?logo=snowflake&logoColor=white) | Snowflake account with Cortex Analyst enabled + Semantic View |
| ![domo-acct](https://img.shields.io/badge/Domo_Account-OAuth_Credentials-orange) | Snowflake OAuth client ID, secret, and refresh token stored in Domo Accounts |

### Installation

```bash
git clone https://github.com/cassidythilton/cortex-chat.git
cd cortex-chat
pnpm install
```

### Configuration

#### Step 1 — Snowflake OAuth Account (Domo)

Create an OAuth account in your Domo instance:

| Account Field | Maps To |
|---|---|
| `username` | Snowflake OAuth **Client ID** |
| `password` | Snowflake OAuth **Client Secret** |
| `domoAccessToken` | Snowflake OAuth **Refresh Token** |

Then update `ACCOUNT_ID` in `codeengine.js` with your Domo account ID.

#### Step 2 — Snowflake Account Identifier

Update `ACCOUNT` in `codeengine.js` with your Snowflake account (e.g., `ab12345.us-east-2`).

#### Step 3 — Code Engine Deployment

Deploy `codeengine.js` as a Domo Code Engine package exposing:

| Function | Purpose |
|---|---|
| `callAnalyst` | NL → SQL → Execute → Results pipeline |
| `executeStoredSql` | Re-execute stored SQL without Cortex Analyst |

#### Step 4 — Manifest Overrides

After first upload, copy the generated `id` and `proxyId` into `src/manifestOverrides.json`:

```json
{
  "your-instance": {
    "description": "Your Domo instance",
    "manifest": {
      "id": "YOUR_ASSET_ID",
      "proxyId": "YOUR_PROXY_ID"
    }
  }
}
```

#### Step 5 — Login & Run

```bash
domo login
pnpm start
```

---

## Available Scripts

| Script | Description | When to Use |
|---|---|---|
| `pnpm start` | Start Vite dev server with Domo proxy | Local development |
| `pnpm build` | Lint + format + test + production build | Pre-deploy validation |
| `pnpm test` | Vitest in watch mode | Development |
| `pnpm test:ci` | Tests (single run, no color) | CI pipelines |
| `pnpm lint` | ESLint with auto-fix | Code quality |
| `pnpm format` | Prettier formatting | Code style |
| `pnpm upload` | Build + upload to Domo | Deployment |
| `pnpm storybook` | Storybook dev server (port 6006) | Component development |
| `pnpm generate` | Scaffold component or reducer | New feature scaffolding |

---

## Project Structure

```
cortex-chat/
├── codeengine.js                 # Backend — OAuth, Cortex Analyst, SQL execution
├── public/
│   ├── manifest.json             # Domo app manifest (packages, collections, sizing)
│   └── static/                   # Screenshots and assets
├── src/
│   ├── main.tsx                  # Entry point — React 18 + Redux Provider
│   ├── components/
│   │   ├── App/                  # Root layout shell
│   │   ├── AppHeader/            # Branding bar (Domo + Snowflake logos, theme toggle)
│   │   ├── ChatApp/              # Main orchestrator — chat + results + config
│   │   ├── ChatContainer/        # Chat header + input wrapper
│   │   ├── ChatHeader/           # Config status, settings gear, clear conversation
│   │   ├── ChatInput/            # NL input field, send, response processing
│   │   ├── ChartView/            # Plotly.js — auto chart type, multi-axis, aggregation
│   │   ├── ConfigPanel/          # Snowflake config modal (5 fields)
│   │   ├── ConfigStatus/         # Connection indicator (database.schema • role • warehouse)
│   │   ├── ConfirmModal/         # Reusable confirmation dialog
│   │   ├── ExampleQuestions/     # Verified query suggestion cards
│   │   ├── Message/              # Chat bubble (supports HTML + plain text)
│   │   ├── ProcessAnimation/     # 4-step processing overlay with progress bars
│   │   ├── QueryDetailsModal/    # Query detail popup (from recent queries)
│   │   ├── QueryDetailsView/     # Inline detail view (question, SQL, summary)
│   │   ├── QueryResultsPanel/    # Tabbed panel: Table | Chart | Details
│   │   ├── RecentQueries/        # Query history sidebar with rerun/delete
│   │   ├── TableModal/           # Full-screen AG Grid modal
│   │   └── TypingIndicator/      # Animated step-through typing indicator
│   ├── reducers/
│   │   ├── chat/slice.ts         # Redux Toolkit slice — state + 7 async thunks
│   │   ├── createAppSlice.ts     # Typed slice factory
│   │   └── index.ts              # Store configuration
│   ├── services/
│   │   ├── configService.ts      # Domo Datastore CRUD — configuration collection
│   │   ├── domoService.ts        # Cortex Analyst + SQL execution client
│   │   └── recentQueriesService.ts  # AppDB CRUD — recent_queries collection
│   ├── utils/
│   │   ├── appDbHelpers.ts       # AppDB response unwrapping utility
│   │   └── mockData.ts           # Synthetic mock data for offline development
│   ├── styles/
│   │   ├── theme.scss            # CSS custom properties (light + dark tokens)
│   │   └── ag-grid-theme.scss    # AG Grid theme overrides
│   └── types/
│       └── domo.d.ts             # Domo SDK type declarations
├── setupProxy.js                 # Ryuu proxy config for local dev
├── vite.config.ts                # Vite — plugins, proxy, build, env
├── tsconfig.json                 # TypeScript config
├── eslint.config.js              # ESLint 9 flat config
├── package.json                  # Dependencies + scripts
└── pnpm-lock.yaml                # Lockfile
```

---

## Tech Stack

| Category | Technology | Version | Badge |
|---|---|---|---|
| Framework | React | 18.3 | ![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white) |
| Language | TypeScript | 5.6 | ![TS](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white) |
| Build | Vite | 5.4 | ![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white) |
| State | Redux Toolkit | 2.2 | ![Redux](https://img.shields.io/badge/Redux_Toolkit-2.2-764ABC?logo=redux&logoColor=white) |
| Data Grid | AG Grid Community | 34.3 | ![AG](https://img.shields.io/badge/AG_Grid-34.3-0084D0) |
| Charts | Plotly.js | 3.2 | ![Plotly](https://img.shields.io/badge/Plotly.js-3.2-3F4F75?logo=plotly&logoColor=white) |
| Icons | Lucide React | 0.553 | ![Lucide](https://img.shields.io/badge/Lucide-0.553-F56565) |
| Styling | SCSS Modules | — | ![SCSS](https://img.shields.io/badge/SCSS_Modules-CC6699?logo=sass&logoColor=white) |
| Testing | Vitest + Testing Library | 2.1 | ![Vitest](https://img.shields.io/badge/Vitest-2.1-6E9F18?logo=vitest&logoColor=white) |
| Linting | ESLint + Prettier | 9 / 3 | ![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white) |
| Platform | Domo Custom Apps | — | ![Domo](https://img.shields.io/badge/Domo-Custom_App-333333) |
| Backend | Domo Code Engine | Node.js | ![CE](https://img.shields.io/badge/Code_Engine-Node.js-339933?logo=node.js&logoColor=white) |
| Persistence | Domo AppDB | Datastores | ![AppDB](https://img.shields.io/badge/AppDB-Datastores-333333) |
| AI/ML | Snowflake Cortex Analyst | — | ![Cortex](https://img.shields.io/badge/Snowflake-Cortex_AI-29B5E8?logo=snowflake&logoColor=white) |

---

## License

This project is provided as-is for demonstration and reference purposes.

![MIT](https://img.shields.io/badge/license-MIT-blue)
