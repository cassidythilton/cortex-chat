<p align="center">
  <img src="public/static/domo.png" alt="Domo" height="40" />
  &nbsp;&nbsp;<strong>+</strong>&nbsp;&nbsp;
  <img src="https://cdn.brandfetch.io/idvpz8K3OK/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" alt="Snowflake" height="36" />
</p>

<h1 align="center">Cortex Chat</h1>

<p align="center">
  <strong>A conversational analytics interface that connects Domo's application platform with Snowflake Cortex Analyst — enabling natural language queries against enterprise data warehouses.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-2.2-764ABC?logo=redux&logoColor=white" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/AG_Grid-34.3-0084D0" alt="AG Grid" />
  <img src="https://img.shields.io/badge/Plotly.js-3.2-3F4F75?logo=plotly&logoColor=white" alt="Plotly" />
</p>

---

![Cortex Chat — Landing Page](public/static/01-landing-page.png)

## The Problem

Business teams need answers from data — fast. Traditional BI workflows require SQL expertise, dashboard navigation, or waiting for analyst queues. Snowflake's **Cortex Analyst** solves the NL-to-SQL translation problem, but it lacks a purpose-built application layer for end users. Meanwhile, Domo provides a powerful app hosting and governance platform, but has no native bridge to Cortex Analyst.

## The Solution

**Cortex Chat** closes that gap. It is a production-grade Domo custom application that provides a conversational interface to Snowflake Cortex Analyst. Users ask questions in plain English, Cortex Analyst generates and executes optimized SQL, and results are rendered as interactive tables and charts — all within the Domo ecosystem.

### What This Unlocks

| Capability | Description |
|---|---|
| **Natural Language → SQL** | Users type questions in plain English; Cortex Analyst translates to optimized Snowflake SQL |
| **Governed Access** | Runs as a Domo custom app — inheriting Domo's access control, SSO, and audit trail |
| **Self-Service Analytics** | Business users query data directly without SQL knowledge or analyst bottlenecks |
| **Semantic Model Aware** | Leverages Snowflake Semantic Views for accurate, context-aware query generation |
| **Conversation Memory** | Multi-turn conversation history enables follow-up questions with full context |

---

## Screenshots

### Light Mode

<table>
<tr>
<td width="50%">

**Landing Page** — Verified query suggestions, configuration status bar, dark/light theme toggle.

![Landing](public/static/01-landing-page.png)

</td>
<td width="50%">

**Configuration Panel** — Connect to any Snowflake database, schema, warehouse, role, and semantic view.

![Config](public/static/02-configuration-panel.png)

</td>
</tr>
<tr>
<td>

**Processing Animation** — Real-time step-by-step progress: connect → analyze → generate SQL → execute.

![Processing](public/static/04-processing-animation.png)

</td>
<td>

**Analyst Response** — Cortex Analyst interprets the question and displays the generated SQL.

![Analyst](public/static/06-analyst-response.png)

</td>
</tr>
<tr>
<td>

**Table Results** — AG Grid with sorting, filtering, pagination, and CSV export.

![Table](public/static/07-table-results.png)

</td>
<td>

**Chart View** — Auto-detected chart types with Plotly.js, multi-axis support, and time aggregation.

![Chart](public/static/08-chart-view.png)

</td>
</tr>
<tr>
<td>

**Query Details** — Full audit trail: question, analyst interpretation, generated SQL, and results summary.

![Details](public/static/09-query-details.png)

</td>
<td>

**Recent Queries** — Query history with one-click rerun, delete, and result viewing.

![Recent](public/static/10-recent-queries.png)

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
</table>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOMO PLATFORM                               │
│                                                                     │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  Cortex Chat   │    │  Domo AppDB      │    │  Domo Code       │  │
│  │  (React SPA)   │───▶│  (Datastores)    │    │  Engine          │  │
│  │                │    │                  │    │  (Node.js)       │  │
│  │  • Chat UI     │    │  • Configuration │    │                  │  │
│  │  • AG Grid     │    │  • Recent Queries│    │  • OAuth Token   │  │
│  │  • Plotly.js   │    │                  │    │    Refresh       │  │
│  │  • Redux       │    └──────────────────┘    │  • Cortex        │  │
│  │                │                            │    Analyst API   │  │
│  │                │────────────────────────────▶│  • SQL Execution │  │
│  └───────────────┘                             └────────┬─────────┘  │
│                                                         │            │
└─────────────────────────────────────────────────────────┼────────────┘
                                                          │
                                                          ▼
                                              ┌──────────────────────┐
                                              │     SNOWFLAKE        │
                                              │                      │
                                              │  • Cortex Analyst    │
                                              │    (NL → SQL)        │
                                              │  • Semantic Views    │
                                              │  • SQL Execution     │
                                              │  • OAuth 2.0         │
                                              └──────────────────────┘
```

### Component Breakdown

| Layer | Technology | Responsibility |
|---|---|---|
| **Frontend** | React 18, TypeScript, Redux Toolkit | Conversational UI, state management, data visualization |
| **Data Grid** | AG Grid Community | Sortable, filterable, paginated result tables with CSV export |
| **Charting** | Plotly.js + react-plotly.js | Auto-detected chart types, multi-axis, time aggregation |
| **Backend** | Domo Code Engine (Node.js) | OAuth token management, Cortex Analyst API proxy, SQL execution |
| **Persistence** | Domo AppDB (Datastores) | Configuration storage, query history (recent 50 queries) |
| **Auth** | Domo OAuth → Snowflake OAuth 2.0 | Refresh token flow; credentials stored in Domo Accounts |
| **Proxy** | @domoinc/ryuu-proxy | Local dev server proxy to Domo instance APIs |

---

## Key Features

### Conversational Query Interface
- Natural language input with real-time processing animation
- Multi-turn conversation history for contextual follow-up questions
- Verified query suggestions for guided exploration
- Analyst interpretation displayed before results

### Data Visualization
- **Table View** — AG Grid with sorting, column filtering, pagination (10/20/50/100 rows), cell text selection, and CSV export
- **Chart View** — Plotly.js with automatic chart type detection (line for time-series, bar for categorical), multi-axis support, Y-axis column selection, and time aggregation (daily/weekly/monthly/yearly)
- **Details View** — Full audit trail showing original question, analyst interpretation, generated SQL, column schema, and row count

### Query Management
- Recent query history persisted in Domo AppDB
- One-click rerun of stored SQL queries
- Query deletion with confirmation modal
- Auto-pruning to retain only the 50 most recent queries

### Configuration
- In-app Snowflake configuration panel (database, schema, role, warehouse, semantic view)
- Configuration persisted in Domo Datastores
- Real-time connection status bar showing active configuration

### UX
- Light/dark theme with system-aware toggle and `localStorage` persistence
- Responsive processing animation with step-by-step progress indicators
- Keyboard shortcuts (Enter to send, Escape to close modals)
- Error handling with retry logic (exponential backoff for transient failures)

---

## Code Engine Function (`codeengine.js`)

The backend logic runs as a **Domo Code Engine** package — a serverless Node.js function hosted within the Domo platform. It exposes two functions:

### `callAnalyst(message, view, database, schema, role, warehouse, conversationHistory)`

1. Retrieves OAuth credentials from Domo Accounts
2. Mints a fresh Snowflake access token via refresh token flow
3. Constructs a Cortex Analyst request body with conversation history and semantic model reference
4. Calls `POST /api/v2/cortex/analyst/message` on Snowflake
5. Extracts both logical SQL (for display) and physical SQL (for execution)
6. Executes the physical SQL via `POST /api/v2/statements`
7. Returns structured results with columns, rows, analyst metadata, and updated conversation history

### `executeStoredSql(sql, database, schema, role, warehouse)`

Re-executes a previously generated SQL statement without calling Cortex Analyst. Used for query rerun functionality.

### Security Model

- **No secrets in code** — OAuth client ID, client secret, and refresh token are stored in Domo's encrypted Accounts system (referenced by account ID)
- **Token lifecycle** — Access tokens are minted per-request via refresh token grant; no long-lived tokens are cached
- **Snowflake RBAC** — Queries execute under the configured Snowflake role, inheriting its permissions

---

## Project Structure

```
cortex-chat/
├── codeengine.js              # Domo Code Engine — OAuth, Cortex Analyst, SQL execution
├── public/
│   ├── manifest.json          # Domo app manifest (name, version, size, package/collection mappings)
│   └── static/                # Screenshots and assets
├── src/
│   ├── main.tsx               # App entry point (React 18 + Redux Provider)
│   ├── components/
│   │   ├── App/               # Root layout
│   │   ├── AppHeader/         # Branding, theme toggle
│   │   ├── ChatApp/           # Main orchestrator — chat + results + config
│   │   ├── ChatContainer/     # Chat header + input wrapper
│   │   ├── ChatHeader/        # Config status, settings, clear conversation
│   │   ├── ChatInput/         # Message input, send, response handling
│   │   ├── ChartView/         # Plotly.js chart with auto-detection
│   │   ├── ConfigPanel/       # Snowflake configuration modal
│   │   ├── ConfigStatus/      # Connection status indicator
│   │   ├── ConfirmModal/      # Reusable confirmation dialog
│   │   ├── ExampleQuestions/  # Verified query suggestions
│   │   ├── Message/           # Chat message bubble
│   │   ├── ProcessAnimation/  # Multi-step processing overlay
│   │   ├── QueryDetailsModal/ # Query detail popup
│   │   ├── QueryDetailsView/  # Inline query detail panel
│   │   ├── QueryResultsPanel/ # Table/Chart/Details tabbed panel
│   │   ├── RecentQueries/     # Query history sidebar
│   │   ├── TableModal/        # Full-screen table modal
│   │   └── TypingIndicator/   # Animated typing indicator
│   ├── reducers/
│   │   └── chat/slice.ts      # Redux Toolkit slice — all app state + async thunks
│   ├── services/
│   │   ├── configService.ts   # Domo Datastore CRUD for configuration
│   │   ├── domoService.ts     # Cortex Analyst + SQL execution client
│   │   └── recentQueriesService.ts  # AppDB CRUD for query history
│   ├── utils/
│   │   ├── appDbHelpers.ts    # AppDB response unwrapping
│   │   └── mockData.ts        # Mock analyst response for offline dev
│   └── styles/
│       ├── theme.scss         # CSS custom properties (light/dark)
│       └── ag-grid-theme.scss # AG Grid theme overrides
├── setupProxy.js              # Ryuu proxy configuration for local dev
├── vite.config.ts             # Vite build config with proxy + manifest plugins
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** (recommended) or npm/yarn
- **Domo CLI** — [`@domoinc/da`](https://www.npmjs.com/package/@domoinc/da) and [`ryuu`](https://www.npmjs.com/package/ryuu)
- **Domo Instance** with:
  - A Snowflake OAuth account configured in Domo Accounts
  - A Snowflake database with a [Cortex Analyst Semantic View](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst)
- **Snowflake** with Cortex Analyst enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/cassidythilton/cortex-chat.git
cd cortex-chat

# Install dependencies
pnpm install
```

### Configuration

#### 1. Snowflake OAuth Account (Domo)

Create an OAuth account in your Domo instance that stores the Snowflake client credentials:

| Account Field | Maps To |
|---|---|
| `username` | Snowflake OAuth Client ID |
| `password` | Snowflake OAuth Client Secret |
| `domoAccessToken` | Snowflake OAuth Refresh Token |

Update `ACCOUNT_ID` in `codeengine.js` with your Domo account ID.

#### 2. Snowflake Account

Update `ACCOUNT` in `codeengine.js` with your Snowflake account identifier (e.g., `ab12345.us-east-2`).

#### 3. Code Engine Package

Deploy `codeengine.js` as a Domo Code Engine package with two exported functions:
- `callAnalyst` — Main NL-to-SQL pipeline
- `executeStoredSql` — SQL re-execution

#### 4. Manifest Overrides

After your first upload to Domo, copy the generated asset `id` and `proxyId` into `src/manifestOverrides.json`:

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

#### 5. Domo Login

```bash
domo login
```

### Development

```bash
# Start local dev server (proxied to your Domo instance)
pnpm start

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format
```

### Build & Deploy

```bash
# Build and upload to Domo
pnpm upload
```

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm start` | Start Vite dev server with Domo proxy |
| `pnpm build` | Lint, format, test, then production build |
| `pnpm test` | Run Vitest in watch mode |
| `pnpm test:ci` | Run tests once (CI mode) |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm format` | Prettier formatting |
| `pnpm upload` | Build + upload to Domo instance |
| `pnpm storybook` | Start Storybook dev server |
| `pnpm generate` | Scaffold new component or reducer |

---

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| Framework | React | 18.3 |
| Language | TypeScript | 5.6 |
| Build | Vite | 5.4 |
| State | Redux Toolkit | 2.2 |
| Data Grid | AG Grid Community | 34.3 |
| Charts | Plotly.js | 3.2 |
| Icons | Lucide React | 0.553 |
| Styling | SCSS Modules | — |
| Testing | Vitest + Testing Library | 2.1 |
| Linting | ESLint 9 + Prettier | — |
| Platform | Domo Custom Apps | — |
| Backend | Domo Code Engine | Node.js |
| Persistence | Domo AppDB (Datastores) | — |
| AI/ML | Snowflake Cortex Analyst | — |

---

## License

This project is provided as-is for demonstration and reference purposes. See your organization's licensing policies before use in production.
