Sidekick — Architecture

Version: 1.0
Date: 2026-09-06
Status: Development Baseline
Related document: PRD.md

⸻

1. Purpose

This document defines the technical architecture of Sidekick.

The architecture is designed around five requirements:

1. Build and ship quickly.
2. Work without a backend.
3. Keep user data local.
4. Allow functionality to grow through modules.
5. Avoid architectural decisions that prevent future expansion.

The architecture should be simple enough for the first release and structured enough to survive later releases.

⸻

2. Architecture Summary

Sidekick consists of:

┌───────────────────────────────────────────┐
│                 SIDEKICK                  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │          Application Shell          │  │
│  │                                     │  │
│  │ Routing / Layout / Navigation / UI  │  │
│  └──────────────────┬──────────────────┘  │
│                     │                     │
│  ┌──────────────────▼──────────────────┐  │
│  │                 CORE                 │  │
│  │                                      │  │
│  │ Entities / Events / Lifecycle /      │  │
│  │ Recommendations / Validation         │  │
│  └───────────────┬───────────┬─────────┘  │
│                  │           │            │
│        ┌─────────▼───┐   ┌──▼─────────┐  │
│        │   MODULES   │   │  SERVICES  │  │
│        │             │   │            │  │
│        │ Dashboard   │   │ Storage    │  │
│        │ Projects    │   │ Search     │  │
│        │ Notes       │   │ Export     │  │
│        │ Tasks       │   │ Research   │  │
│        │ Dropshipping│   │ AI         │  │
│        └─────────────┘   └─────┬──────┘  │
│                                │         │
│                         ┌──────▼──────┐  │
│                         │ IndexedDB   │  │
│                         │   / Dexie   │  │
│                         └─────────────┘  │
└───────────────────────────────────────────┘

⸻

3. Architectural Rules

These rules should be treated as constraints.

Rule 1 — UI never talks directly to IndexedDB

Incorrect:

Component → Dexie

Correct:

Component
   ↓
Service / Repository
   ↓
Dexie

⸻

Rule 2 — Modules never manipulate the database directly

Incorrect:

DropshippingModule
       ↓
IndexedDB

Correct:

DropshippingModule
       ↓
ProductRepository
       ↓
IndexedDB

⸻

Rule 3 — Core does not know business-model details

The core can know:

Project
Product
Task
Note
Experiment

It should not know:

AliExpress
TikTok Shop
Dropshipping supplier
Print-on-demand provider

Those belong to modules.

⸻

Rule 4 — External services are optional

Internet unavailable
      ↓
Core still works

⸻

Rule 5 — User data is structured

Avoid giant JSON blobs.

Prefer:

projects
products
suppliers
notes
tasks
experiments

over:

everything: JSON

⸻

4. Technology

Runtime

Browser-based PWA.

Language

TypeScript.

Build

Vite.

UI

Preact.

Database

Dexie + IndexedDB.

CSS

Plain CSS with design tokens.

Avoid introducing a UI framework until there is a concrete reason.

⸻

5. Layer Model

Sidekick uses five conceptual layers.

┌─────────────────────────┐
│          UI             │
├─────────────────────────┤
│       MODULES           │
├─────────────────────────┤
│          CORE           │
├─────────────────────────┤
│       SERVICES          │
├─────────────────────────┤
│     DATA / STORAGE      │
└─────────────────────────┘

Dependencies should generally flow downward.

⸻

6. UI Layer

Responsible for:

* Rendering
* User input
* Navigation
* Form state
* Visual feedback
* Accessibility

The UI should not contain business calculations.

Bad:

const profit = price - purchase - shipping;

inside a component.

Better:

const result = calculateProfit(input);

The calculation belongs to domain logic.

⸻

7. Module Layer

Modules represent user-facing capabilities.

Example:

modules/
├── dashboard/
├── projects/
├── notes/
├── tasks/
└── dropshipping/

Each module contains its own:

components
views
logic
routes
module definition

Example:

dropshipping/
├── index.ts
├── module.ts
├── routes.ts
├── components/
├── views/
├── calculators/
├── workflows/
└── types.ts

⸻

8. Core Layer

Core contains functionality that is independent of any particular business model.

core/
├── entities/
├── enums/
├── events/
├── lifecycle/
├── recommendations/
└── validation/

Examples:

Project lifecycle
Task states
Note types
Recommendation types
Event definitions
Validation rules

⸻

9. Service Layer

Services expose capabilities to modules.

services/
├── storage/
├── search/
├── export/
├── recommendations/
├── research/
└── ai/

A service should have a clear responsibility.

⸻

10. Repository Layer

Repositories provide persistence abstraction.

Example:

interface ProjectRepository {
  get(id: string): Promise<Project | undefined>;
  list(): Promise<Project[]>;
  create(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

The application can therefore change its database implementation later without changing the module.

⸻

11. Database

Dexie should manage IndexedDB.

Example logical tables:

projects
tasks
notes
experiments
products
suppliers
competitors
moduleConfigs
userSettings

Later:

metrics
trendSignals
aiRequests
activityLog

⸻

12. Database Relationships

Relationships are represented by IDs.

Example:

Project
   │
   ├── id
   │
   ├── Task.projectId
   ├── Note.projectId
   ├── Product.projectId
   ├── Experiment.projectId
   └── Supplier.projectId

Avoid storing entire objects inside other objects unless there is a strong reason.

⸻

13. IDs

All persisted entities use UUIDs.

Example:

const id = crypto.randomUUID();

IDs must be immutable.

⸻

14. Timestamps

Persist:

createdAt
updatedAt

where relevant.

Use ISO-compatible dates or normalized Date handling consistently.

⸻

15. Database Migrations

Dexie schema versions must be explicit.

Example:

Database v1
    ↓
Database v2
    ↓
Database v3

A migration must preserve existing user data.

Never silently discard unknown fields during upgrades.

⸻

16. Module Registry

The registry is responsible for:

* Registering modules
* Enabling modules
* Disabling modules
* Initializing modules
* Destroying modules
* Exposing module metadata

Example:

interface ModuleRegistry {
  register(module: SidekickModule): void;
  enable(id: string): Promise<void>;
  disable(id: string): Promise<void>;
  get(id: string): SidekickModule | undefined;
  list(): SidekickModule[];
}

⸻

17. Module Context

Modules receive a controlled context.

interface ModuleContext {
  repositories: Repositories;
  services: Services;
  events: EventBus;
  navigation: NavigationService;
}

This prevents modules from becoming tightly coupled to application internals.

⸻

18. Module Interface

interface SidekickModule {
  id: string;
  name: string;
  version: string;
  icon: string;
  enabled: boolean;
  routes: ModuleRoute[];
  navigation?: ModuleNavigation[];
  init(context: ModuleContext): Promise<void>;
  destroy(): void;
  actions?: ModuleAction[];
  settings?: ModuleSetting[];
}

⸻

19. Static Modules vs Dynamic Plugins

The first architecture supports modules conceptually.

However:

Phase 1 modules are statically bundled.

Do not build dynamic JavaScript plugin installation yet.

Initial:

Build
 ↓
Bundle
 ↓
Modules included

Future:

Module catalogue
 ↓
Install module
 ↓
Load module
 ↓
Register

Dynamic third-party modules introduce:

* Security concerns
* Version compatibility
* Dependency management
* Sandboxing
* Code signing
* Storage permissions

Those are unnecessary for the first release.

⸻

20. Event Bus

The event bus provides loose coupling.

interface EventBus {
  emit<T>(event: string, payload: T): void;
  on<T>(
    event: string,
    handler: (payload: T) => void
  ): () => void;
}

The on() function returns an unsubscribe function.

Example:

const unsubscribe = events.on(
  "task.completed",
  task => {
    // React to completion
  }
);
unsubscribe();

⸻

21. Important Events

Initial event vocabulary:

app.ready
project.created
project.updated
project.stageChanged
task.created
task.completed
note.created
note.updated
product.created
product.updated
experiment.created
experiment.completed
module.enabled
module.disabled
data.imported
data.exported

Events should describe facts.

Avoid command-like events such as:

doThingNow

Prefer:

thing.created

⸻

22. Recommendation Engine

The recommendation engine is deterministic initially.

Input:

Project
Tasks
Notes
Products
Experiments
Stage
Missing information
Risks

Output:

Recommendation[]

Example rule:

IF
project.stage = research
AND
no supplier exists
THEN
recommend:
"Find 3 suppliers"

This makes the system useful without AI.

⸻

23. Recommendation Priority

Each recommendation gets a priority.

Example:

100 = critical
80  = high
60  = normal
40  = useful
20  = optional

Dashboard shows the highest-priority recommendations first.

⸻

24. Recommendation Sources

A recommendation should identify its source.

Example:

interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  reason: string;
  priority: number;
  source:
    | "workflow"
    | "missing-data"
    | "risk"
    | "experiment"
    | "trend"
    | "ai";
  action?: RecommendationAction;
}

This allows the UI to explain why something is recommended.

⸻

25. Domain Logic

Business calculations belong in pure functions where possible.

Example:

calculateProfit(input)
calculateMargin(input)
calculateBreakEven(input)
calculateVAT(input)
calculateOpportunityScore(input)

Pure functions are easy to test.

⸻

26. Money Handling

Money must not rely on floating-point arithmetic for important calculations.

Prefer integer minor units where practical.

Example:

299 kr

stored as:

29900 öre

or use a dedicated money representation.

interface Money {
  amount: number;
  currency: "SEK";
}

The initial system can support SEK only while keeping the model extensible.

⸻

27. Profit Calculation

The calculation layer should distinguish:

Revenue
- Product cost
- Shipping
- Payment fees
- Advertising
- Other costs
= Contribution

VAT handling should be explicit.

Do not mix VAT and non-VAT values silently.

⸻

28. Assumption System

Values can optionally have provenance.

interface ValueWithConfidence<T> {
  value: T;
  type:
    | "fact"
    | "estimate"
    | "assumption";
  source?: string;
  confidence?: number;
}

This becomes useful to:

* Reality Check
* AI
* Product scoring
* Experiment analysis

⸻

29. Search

Local search initially.

Search targets:

Projects
Notes
Products
Suppliers
Competitors
Tasks

The first implementation can use simple indexed/local filtering.

A dedicated search index can be introduced only if required.

⸻

30. Export Architecture

Export service:

interface ExportService {
  exportAll(): Promise<Blob>;
  exportProject(
    projectId: string
  ): Promise<Blob>;
}

Export format:

{
  "schemaVersion": 1,
  "exportedAt": "...",
  "application": "sidekick",
  "data": {
    "projects": [],
    "tasks": [],
    "notes": [],
    "products": []
  }
}

⸻

31. Import Architecture

Import process:

File
 ↓
Parse
 ↓
Validate
 ↓
Check schemaVersion
 ↓
Migrate if required
 ↓
Preview
 ↓
Merge / Replace
 ↓
Persist
 ↓
Emit data.imported

Do not immediately overwrite existing data after file selection.

⸻

32. Backup Philosophy

Because there is no cloud account initially:

Export is the backup mechanism.

The UI should make this obvious.

Suggested Settings section:

💾 Data
Last backup:
3 dagar sedan
[Exportera data]
[Importera data]

Later, automatic cloud synchronization can be added.

⸻

33. AI Service

The AI service should have an abstraction.

interface AIService {
  analyze(
    request: AIRequest
  ): Promise<AIResponse>;
}

The rest of Sidekick should not depend directly on a specific provider.

Possible future providers:

OpenAI
Anthropic
Google
Groq
Local model

⸻

34. AI Data Boundary

Before an AI request:

User data
   ↓
Context Builder
   ↓
Minimal required context
   ↓
AI provider

The Context Builder controls what leaves the device.

Example:

buildProductAnalysisContext(productId)

rather than:

sendEntireDatabaseToAI()

⸻

35. AI Actions

AI should initially be read-only.

Later it may suggest actions.

Example:

AI:
"Jag föreslår att du skapar tre uppgifter."
[Skapa uppgifter]
[Avbryt]

User confirmation is required.

⸻

36. Research Service

External research is separated from the UI.

interface ResearchService {
  search(query: string): Promise<ResearchResult[]>;
}

This allows the future trend system to evolve independently.

⸻

37. External API Strategy

External APIs should be adapters.

ResearchService
      │
      ├── Google adapter
      ├── Trend adapter
      └── Future adapters

The application depends on the service interface, not the provider.

⸻

38. Offline Architecture

                    SIDEKICK
                       │
                ┌──────▼──────┐
                │ Application │
                └──────┬──────┘
                       │
              ┌────────▼────────┐
              │    IndexedDB    │
              └─────────────────┘
                       │
                always available
External services:
AI       ─────── optional
Trends   ─────── optional
Research ─────── optional

⸻

39. Service Worker

The service worker caches:

* HTML
* JavaScript
* CSS
* icons
* static assets

It does not need to manage application data.

Application data belongs to IndexedDB.

⸻

40. Routing

Use lightweight client-side routing.

Routes should be module-oriented.

Examples:

/
/projects
/projects/:id
/notes
/tasks
/research
/calculator
/settings

Dropshipping:

/dropshipping/products
/dropshipping/products/:id
/dropshipping/suppliers
/dropshipping/competitors

⸻

41. Navigation

The primary mobile navigation should remain small.

Home
Projects
Research
Calculator
Notes

Project-specific features should appear inside the project.

Avoid a navigation bar containing 15 items.

⸻

42. UI Component Architecture

Reusable components:

Button
Card
Input
Select
Modal
Sheet
Tabs
Badge
ProgressBar
EmptyState
Toast
ConfirmDialog

Domain components belong inside modules.

Example:

ProfitCalculator
ProductScoreCard
SupplierCard

should not be global UI components.

⸻

43. Design System

Create basic design tokens:

spacing
radius
typography
font sizes
shadows
breakpoints
z-index
motion

Themes:

light
dark
system

Do not over-design the first version.

The interface should feel:

modern
fast
friendly
clear
slightly playful

but not like a children’s app.

⸻

44. Mobile-First Rules

Primary design target:

360–430 px width

Controls should be touch-friendly.

Minimum practical touch target:

~44 × 44 px

Desktop should be responsive rather than separately designed first.

⸻

45. Error Handling

Errors should be understandable.

Bad:

DexieError: ConstraintError

User-facing:

Något gick fel när informationen skulle sparas.
Dina tidigare uppgifter är fortfarande kvar.
Försök igen.

Technical errors should still be logged for development.

⸻

46. Empty States

Empty states should explain what to do.

Instead of:

No projects.

Use:

🚀 Inga projekt ännu
Har du en idé?
Skapa ditt första projekt och börja
undersöka den på några minuter.
[+ Skapa projekt]

⸻

47. Loading States

Local operations should normally feel instant.

External operations need explicit loading states.

Example:

🔎 Undersöker...

AI:

🤖 Analyserar...

Never block the whole application while waiting for an external API.

⸻

48. Security

Threat model for the first version:

* Malicious imported JSON
* XSS through user notes
* Unsafe external URLs
* Third-party scripts
* API key exposure

Rules:

1. Escape/render user content safely.
2. Do not inject arbitrary HTML from notes.
3. Sanitize Markdown.
4. Treat imported data as untrusted.
5. Avoid unnecessary third-party scripts.
6. Never expose private API keys in client code.

⸻

49. Privacy

Default behavior:

No account
No tracking required
No cloud database
Local data

Analytics, if later introduced, should be opt-in or privacy-conscious.

⸻

50. Testing Architecture

Unit tests

Highest priority:

Profit calculation
Margin
VAT
Break-even
Opportunity score
Recommendation rules
Lifecycle transitions
Import/export
Migration

Integration tests

Test:

Repository
 ↕
IndexedDB

UI tests

Test important user flows.

⸻

51. Critical End-to-End Flow

This should always work:

Open app
   ↓
Create project
   ↓
Select Dropshipping
   ↓
Add product
   ↓
Enter costs
   ↓
Calculate profit
   ↓
Save result
   ↓
Create task
   ↓
Complete task
   ↓
Recommendation changes
   ↓
Reload application
   ↓
Everything persists

This is the initial definition of architectural health.

⸻

52. Development Sequence

Build vertically.

Slice 1

Application shell
+
IndexedDB
+
Projects

Result:

A usable project manager.

Slice 2

Notes
+
Tasks

Result:

A usable entrepreneurial workspace.

Slice 3

Dropshipping
+
Product
+
Profit calculator

Result:

A usable dropshipping tool.

Slice 4

Recommendations
+
Project workflow

Result:

Sidekick starts guiding the user.

Slice 5

PWA
+
Offline
+
Export/import

Result:

A deployable personal application.

Slice 6

Experiments
+
Reality Check

Result:

Sidekick starts teaching entrepreneurial thinking.

Only after these slices should we prioritize:

AI
Trends
External research

⸻

53. Definition of First Production Release

The first production release is successful if:

Data

* Projects persist.
* Notes persist.
* Tasks persist.
* Products persist.
* Calculations persist.
* Data can be exported.
* Data can be imported.

UX

* Works on mobile.
* Can be installed.
* Works offline.
* Swedish throughout.
* No obvious navigation dead ends.

Dropshipping

A user can:

Create idea
 ↓
Create product
 ↓
Calculate profitability
 ↓
Document research
 ↓
Create next task

Reliability

* No data loss during normal use.
* Reloading does not lose state.
* Offline mode works.
* Import/export round trip works.

⸻

54. Future Architecture

The architecture leaves room for:

              SIDEKICK
                  │
      ┌───────────┼────────────┐
      │           │            │
   Local       Optional      External
   Core        Cloud Sync    Services
      │           │            │
      │           │       ┌────┼─────┐
      │           │       │    │     │
      │           │      AI Trends Research
      │
      └──────── Modules ────────┐
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              Dropshipping      POD       Digital
                    │
                    ▼
                 Product
                    │
             ┌──────┼───────┐
             ▼      ▼       ▼
         Suppliers Trends   AI

The core remains stable while capabilities expand.

⸻

55. Architectural Decision Records

Important architectural decisions should eventually be documented in:

docs/adr/

Example:

001-local-first.md
002-dexie-indexeddb.md
003-module-architecture.md
004-preact.md
005-static-first-deployment.md

Do not create an ADR for every minor implementation choice.

Use ADRs when reversing the decision later would be expensive.

⸻

56. Things We Explicitly Do Not Build Yet

Do not prematurely implement:

* Backend authentication
* User accounts
* Cloud database
* Real-time synchronization
* Plugin marketplace
* Microservices
* GraphQL
* Server-side rendering
* Complex state-management framework
* Automated store integrations
* Automated supplier purchasing
* Full accounting system

These add complexity before the product has proven that users need them.

⸻

57. Guiding Architectural Principle

The most important architectural rule is:

Make the first version small without making the architecture disposable.

We should be able to ship quickly while retaining clean boundaries:

UI
 ↓
Modules
 ↓
Core
 ↓
Services
 ↓
Repositories
 ↓
IndexedDB

This structure gives Sidekick enough architecture to grow without forcing us to build the future before we have built the present.

⸻

58. Final Architecture

The intended long-term architecture is:

                         ┌───────────────────┐
                         │     SIDEKICK      │
                         │   PWA / SHELL     │
                         └─────────┬─────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
                 ▼                 ▼                 ▼
              MODULES             CORE            SERVICES
                 │                 │                 │
       ┌─────────┼─────────┐       │       ┌─────────┼──────────┐
       │         │         │       │       │         │          │
  Projects    Notes   Dropshipping │   Storage   Research      AI
                                  │
                       ┌──────────┼──────────┐
                       │          │          │
                    Events   Recommendations Lifecycle
                       │
                       ▼
                  DOMAIN ENTITIES
                       │
        ┌──────────────┼────────────────┐
        ▼              ▼                ▼
     Project         Product           Task
        │              │                │
        ├── Notes      ├── Supplier     │
        ├── Tasks      ├── Competitor   │
        └── Experiments└── Scores      │
                       │
                       ▼
                  REPOSITORIES
                       │
                       ▼
                    DEXIE
                       │
                       ▼
                  INDEXEDDB

This is the architectural foundation for Sidekick.
