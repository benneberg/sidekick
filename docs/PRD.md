Sidekick — Product Requirements Document

Version: 1.1
Date: 2026-09-06
Status: Draft — Development Baseline
Author: Based on product and architectural concept development

⸻

1. Overview

1.1 Product Vision

Sidekick is a personal entrepreneurial operating system for young entrepreneurs experimenting with side-income ideas.

Rather than building a single-purpose dropshipping tool, Sidekick provides a modular workspace where different entrepreneurial tools and business models can be added over time.

The first business model is dropshipping, but the architecture is intentionally broader.

Core philosophy

* Local-first — The app works offline. User data lives primarily on the user’s device.
* Modular — Business models and specialist tools are implemented as modules.
* Intelligent, not AI-dependent — AI enhances structured user data but is never required for core functionality.
* Action-oriented — Sidekick tells the user what to do next instead of presenting a collection of disconnected tools.
* Experiment-driven — Ideas should be tested with small experiments rather than treated as assumptions.
* Reality-based — The system distinguishes facts from estimates and assumptions.
* Learning while doing — Education appears in context instead of forcing users through a traditional course.
* Teen-friendly — The interface should be understandable and motivating for a 15-year-old without becoming childish for a 17–20-year-old.

Product principle

Ideas are cheap. Evidence is valuable. Small experiments beat big assumptions.

⸻

2. Target Audience

2.1 Primary

Young entrepreneurs aged approximately 15–20 in Sweden who are exploring their first side-income ventures.

Typical characteristics:

* Limited business experience
* Limited budget
* Primarily mobile users
* May experiment intermittently
* May have several ideas at once
* Need practical guidance rather than business theory
* Want quick answers
* Can lose interest if setup is complicated

2.2 Secondary

First-time entrepreneurs of any age who want a structured, low-friction way to test business ideas without heavy infrastructure.

⸻

3. Value Proposition

Sidekick should help the user move through:

IDEA
  ↓
RESEARCH
  ↓
HYPOTHESIS
  ↓
EXPERIMENT
  ↓
LEARNING
  ↓
DECISION
  ↓
LAUNCH / ITERATE / STOP

The user’s journey should not be:

“Use all of our tools.”

It should be:

“What should I do next?”

⸻

4. Product Goals

4.1 Primary Goals

1. Allow a user to create and investigate an idea in less than five minutes.
2. Provide a useful personal workspace without requiring an account.
3. Work offline for all core functionality.
4. Make financial assumptions visible.
5. Turn ideas into actionable projects.
6. Provide a clear next action for each active project.
7. Make experimentation and failure normal.
8. Support dropshipping deeply enough to be genuinely useful.
9. Make adding future business-model modules easy.
10. Allow the application to evolve based on actual use by its first users.

4.2 Non-Goals for the First Release

The first release will NOT attempt to provide:

* Full e-commerce platform functionality
* Payment processing
* Automated store creation
* Automated advertising
* Automated supplier ordering
* Accounting software
* Full CRM
* Full legal compliance automation
* User accounts
* Cloud synchronization
* AI dependency
* Third-party plugin marketplace

These may be considered later.

⸻

5. Success Metrics

Metric	Initial Target
Time from idea to first documented research	< 5 minutes
Core functionality available offline	100%
Initial application load	< 2 seconds
Local search response	< 200 ms
Module switch	< 500 ms
PWA installation rate among returning users	> 30%
Project task completion rate	> 60%
Data export success	100%
User can create first project without instructions	Yes

The most important early metric is qualitative:

Do the teenagers actually keep using it?

⸻

6. Product Architecture

6.1 High-Level Architecture

                         SIDEKICK PWA
                              │
                ┌─────────────┴─────────────┐
                │                           │
          APPLICATION SHELL            UI SYSTEM
                │
        ┌───────┼────────┐
        │       │        │
        ▼       ▼        ▼
      CORE    MODULES   SERVICES
        │       │        │
        │       │        ├── Storage
        │       │        ├── Search
        │       │        ├── Export
        │       │        ├── Recommendations
        │       │        ├── Research
        │       │        └── AI (optional)
        │       │
        │       ├── Dropshipping
        │       ├── Trends
        │       └── Future modules
        │
        ▼
   DOMAIN DATA
        │
 ┌──────┼───────────────┐
 ▼      ▼       ▼       ▼
Projects Tasks Notes Products
         │
         ▼
      IndexedDB

⸻

7. Architectural Principles

7.1 Local-first

Core application functionality must not require a backend.

Primary data storage:

Browser
  ↓
IndexedDB
  ↓
Local application state

7.2 Graceful degradation

External services are optional.

If:

* AI is unavailable
* trend APIs are unavailable
* internet access disappears

the core application continues to function.

7.3 Shared data model

Modules must use shared domain entities instead of storing opaque arbitrary data blobs.

For example, the Dropshipping module should use the shared Product entity.

It should not create:

dropshippingData = giant JSON blob

inside the core database.

7.4 Core owns persistence

Modules request data through repositories/services.

Module
   ↓
Repository
   ↓
IndexedDB

The module does not directly manipulate IndexedDB.

7.5 Modules own business behavior

The core should not know how dropshipping works.

The Dropshipping module owns:

* supplier workflows
* product evaluation
* dropshipping-specific checklists
* dropshipping calculations
* dropshipping recommendations

7.6 AI is a service

AI is not the architecture.

AI is a service that can consume structured context.

Sidekick data
      ↓
AI context builder
      ↓
LLM
      ↓
Structured result
      ↓
User approval
      ↓
Sidekick data

⸻

8. Technology Stack

8.1 Recommended Stack

Layer	Technology
Language	TypeScript
Build	Vite
UI	Preact
Storage	IndexedDB
IndexedDB wrapper	Dexie
Styling	CSS
PWA	Web App Manifest + Service Worker
Routing	Lightweight client-side router
Hosting	GitHub Pages / Netlify / Vercel
Testing	Vitest
E2E testing	Playwright, later
Formatting	Prettier
Linting	ESLint

The architecture should remain lightweight.

There is no reason to introduce a large backend framework for the first version.

⸻

9. Application Structure

Recommended project structure:

sidekick/
│
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── sw.js
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.ts
│   │   ├── module-registry.ts
│   │   └── app-context.ts
│   │
│   ├── core/
│   │   ├── entities/
│   │   ├── enums/
│   │   ├── events/
│   │   ├── recommendations/
│   │   ├── lifecycle/
│   │   └── validation/
│   │
│   ├── data/
│   │   ├── db.ts
│   │   ├── schema.ts
│   │   ├── migrations/
│   │   └── repositories/
│   │
│   ├── services/
│   │   ├── storage/
│   │   ├── search/
│   │   ├── export/
│   │   ├── research/
│   │   ├── ai/
│   │   └── recommendations/
│   │
│   ├── modules/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── notes/
│   │   ├── tasks/
│   │   ├── settings/
│   │   └── dropshipping/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── cards/
│   │   └── layout/
│   │
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── responsive.css
│   │
│   ├── i18n/
│   │   └── sv.ts
│   │
│   └── main.tsx
│
├── tests/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md

⸻

10. Core Domain Entities

The core initially contains:

UserSettings
Project
Task
Note
Experiment
Product
Supplier
Competitor
Metric
ModuleConfig

Not every entity needs to be implemented in the first usable release.

⸻

11. Project Model

interface Project {
  id: string;
  name: string;
  description?: string;
  stage: LifecycleStage;
  businessModel: string;
  metrics: {
    revenue: number;
    costs: number;
    orders: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

Lifecycle

idea
research
validation
test
launch
active
paused
failed
completed

A failed project is not deleted automatically.

It represents:

A tested idea from which the user learned something.

⸻

12. Task Model

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  stage?: LifecycleStage;
  status:
    | "todo"
    | "in-progress"
    | "done";
  priority:
    | "low"
    | "medium"
    | "high";
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
}

⸻

13. Note Model

interface Note {
  id: string;
  title: string;
  type:
    | "note"
    | "idea"
    | "research"
    | "risk"
    | "supplier"
    | "finance"
    | "competitor";
  content: string;
  url?: string;
  tags: string[];
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

⸻

14. Facts, Estimates and Assumptions

Sidekick should distinguish between:

FACT
ESTIMATE
ASSUMPTION

Example:

Selling price       299 kr     FACT
Supplier price       80 kr     FACT
Shipping              35 kr     FACT
Ad cost                40 kr    ESTIMATE
Sales/month            100      ASSUMPTION

This information can later be used by the Reality Check engine.

The distinction should not create unnecessary friction in the UI.

Users should be able to enter a value quickly and optionally classify it.

⸻

15. Experiment Model

Experiments are a core concept.

interface Experiment {
  id: string;
  projectId: string;
  hypothesis: string;
  test: string;
  budget?: number;
  successCriteria?: string;
  result?: string;
  conclusion?: string;
  status:
    | "planned"
    | "running"
    | "completed"
    | "cancelled";
  createdAt: Date;
  completedAt?: Date;
}

Example:

HYPOTES
"People will buy this product for 299 kr."
TEST
Create landing page + small advertisement.
BUDGET
300 kr
SUCCESS
3 purchases
RESULT
2 purchases
CONCLUSION
Interesting but insufficient evidence.
DECISION
Continue testing.

⸻

16. Product Model

interface Product {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  salePrice?: number;
  purchasePrice?: number;
  shippingCost?: number;
  opportunityScore?: OpportunityScore;
  createdAt: Date;
  updatedAt: Date;
}

⸻

17. Opportunity Score

The score must be explainable.

interface OpportunityScore {
  total: number;
  dimensions: {
    demand: number;
    competition: number;
    margin: number;
    trend: number;
    shipping: number;
    socialPotential: number;
  };
  confidence: number;
  calculatedAt: Date;
  methodology: string;
}

Example:

Opportunity       78/100
Confidence        62%
Demand             82
Competition        61
Margin             84
Trend              91
Shipping           60
Social potential   83

The system must never present a score as objective truth.

It is an evaluation based on available evidence.

⸻

18. Module System

Every module implements a standard interface.

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

The module receives controlled access to Sidekick capabilities through ModuleContext.

Example:

interface ModuleContext {
  repositories: Repositories;
  services: Services;
  events: EventBus;
  navigation: NavigationService;
}

Modules do not directly access global application state.

⸻

19. Module Lifecycle

DISCOVER
   ↓
REGISTER
   ↓
ENABLE
   ↓
INIT
   ↓
RUN
   ↓
DISABLE
   ↓
DESTROY

For the initial application, modules are statically bundled.

Example:

const modules = [
  dashboardModule,
  projectsModule,
  notesModule,
  tasksModule,
  settingsModule,
  dropshippingModule
];

A true dynamically installable plugin marketplace is a later feature.

⸻

20. Event System

Sidekick should use a lightweight event bus.

Examples:

events.emit("project.created", project);
events.emit("task.completed", task);
events.emit("note.created", note);
events.emit("product.created", product);
events.emit("experiment.completed", experiment);

Modules can subscribe:

events.on("task.completed", handler);

This allows loosely coupled functionality.

⸻

21. Recommendation Engine

The Recommendation Engine is a core subsystem.

Its purpose is to answer:

What should the user do next?

interface Recommendation {
  id: string;
  projectId?: string;
  type:
    | "next-task"
    | "warning"
    | "opportunity"
    | "missing-information"
    | "learning";
  title: string;
  reason: string;
  priority: number;
  action?: {
    label: string;
    type: string;
    payload?: unknown;
  };
}

Example:

🔎 Hitta 3 leverantörer
⚠️ Fraktkostnaden saknas
💰 Kalkylen saknar moms
📈 Produktens trend ökar
📚 Läs om returer

The first implementation should be deterministic.

AI-based recommendations come later.

⸻

22. “Do This Next” Engine

For each project:

✓ Produkt vald
✓ Konkurrenter undersökta
→ Hitta 3 leverantörer
→ Kontrollera fraktkostnad
→ Kontrollera leveranstid
→ Beräkna faktisk marginal
→ Bestäm testbudget

Recommended actions can be generated from:

* Project stage
* Business model
* Completed tasks
* Missing information
* Experiments
* Risks
* Financial data

⸻

23. Dropshipping Module

The first business vertical.

Components

Dropshipping
├── Products
├── Product Research
├── Profit Calculator
├── Supplier Tracker
├── Competitor Tracker
├── Product Score
└── Workflow Templates

⸻

24. Profit Calculator

Inputs:

* Product cost
* Shipping
* Payment fee
* Advertising cost
* Sale price
* VAT/moms

Outputs:

* Total cost
* Gross profit
* Net contribution
* Margin %
* Break-even units
* Price sensitivity

Example:

Produktkostnad        80 kr
Frakt                 35 kr
Betalningsavgift       8 kr
Annonsering            55 kr
────────────────────────────
Kostnad               178 kr
Försäljningspris      299 kr
Bidrag                121 kr
Marginal              40.5%

The calculator should explicitly explain which values are estimates.

⸻

25. “Should I Sell This?” Tool

The tool evaluates:

* Margin
* Competition
* Complexity
* Shipping
* Product characteristics
* Available evidence

Output:

🟢 Värt att undersöka
Styrkor:
• Bra möjlig marginal
• Enkel produkt att demonstrera
• Rimligt pris
Risker:
• Hård konkurrens
• Osäker leveranstid
Nästa steg:
🔎 Hitta 3 konkurrenter.

The result must be presented as guidance, not a guarantee.

⸻

26. Supplier Tracker

Store:

* Supplier name
* URL
* Contact
* Product
* Purchase price
* Shipping
* Delivery time
* Sample quality
* Communication quality
* Notes
* Risk flags

Suppliers can be linked to multiple products where appropriate.

⸻

27. Competitor Tracker

Store:

* Competitor
* URL
* Product
* Price
* Strengths
* Weaknesses
* Marketing observations
* Notes

Price history can be added later.

⸻

28. Trends Module

Trend information is treated as research signals, not predictions.

Signal categories:

🔥 Emerging
📈 Growing
➡️ Stable
📉 Declining
⚠️ Saturated

Phase 1/2:

* Manual trend logging

Later:

* External trend APIs
* Search signals
* Social signals
* Marketplace signals
* AI-assisted interpretation

⸻

29. AI Assistant

AI is optional.

Potential capabilities:

* Product analysis
* Research summarization
* Risk identification
* Experiment suggestions
* Competitor analysis
* Product descriptions
* Ad copy
* Note → task conversion
* Reality Check
* Contextual explanations

AI outputs should be structured where possible.

Example:

interface AIRecommendation {
  type: string;
  title: string;
  explanation: string;
  confidence?: number;
  suggestedActions?: Action[];
}

The user must approve changes before AI:

* Creates tasks
* Modifies data
* Saves notes
* Changes project state

⸻

30. Reality Check

Reality Check detects:

* Missing costs
* Unrealistic margins
* Unsupported sales projections
* Assumptions presented as facts
* Missing VAT
* Missing returns
* Missing advertising costs

Example:

⚠️ Vänta lite.
70 % bruttomarginal betyder inte
70 % faktisk vinst.
Din kalkyl saknar:
• annonser
• returer
• betalningsavgifter
• moms
• kundsupport
• eventuella importkostnader
[Öppna komplett kalkyl]

⸻

31. Learning System

The learning system uses contextual guidance.

It should not initially be a traditional course.

Example:

💡 Snabbtips
En låg inköpskostnad betyder inte automatiskt
bra lönsamhet.
Kontrollera även frakt, returer,
betalningsavgifter och annonsering.

Users can dismiss tips.

Experience levels:

beginner
intermediate
advanced

⸻

32. Swedish Business Layer

Later phase.

Topics:

* SEK
* Moms
* Consumer rights
* Distance selling
* Returns
* Import
* Customs
* Product safety
* GDPR
* Advertising rules
* Business registration
* Age-related considerations

All legal information should reference authoritative sources.

Sidekick must not present itself as a legal advisor.

⸻

33. Dashboard

The dashboard is the primary experience.

It should show:

👋 Hej, Lukas!
🚀 Mina projekt
NordicCase
Produktval
███████░░░ 72%
📌 GÖR DETTA NU
→ Hitta 3 leverantörer
→ Kontrollera frakt
→ Beräkna marginal
⚠️ ATT TÄNKA PÅ
Din vinstkalkyl saknar moms.
📈 MÖJLIGHETER
3 produkter att undersöka

The dashboard should prioritize actions over statistics.

⸻

34. Navigation

Mobile-first navigation:

🏠 Hem
🚀 Projekt
🔎 Research
💰 Kalkyl
📝 Anteckningar

Additional functionality can be reached from project detail and a secondary menu.

Avoid putting every module into the primary navigation.

⸻

35. Onboarding

Minimal onboarding.

Step 1

Välkommen till Sidekick

Step 2

Name

Step 3

Experience level

🌱 Nybörjare
🛠️ Jag har testat lite
🚀 Jag har erfarenhet

Step 4

Business model

🛒 Dropshipping

Step 5

Choose:

[Skapa mitt första projekt]
[Visa exempel]

A demo project should be available.

⸻

36. Demo Data

A demo project should be included.

Example:

NordicCase
──────────────
Stage: Research
Product:
MagSafe Phone Stand
Tasks:
✓ Product selected
✓ Competitors researched
→ Find suppliers
Notes:
3 research notes
Financial:
Estimated margin: 38%

The user should be able to remove demo data.

⸻

37. Offline Experience

Core functionality:

* Read data
* Create data
* Edit data
* Delete data
* Search
* Calculate
* Manage tasks
* Manage projects
* Manage notes
* Run local recommendation logic

All work offline.

External operations are optional.

The UI should show a subtle status indicator:

● Offline

or

● Online

⸻

38. Data Export

Export is a first-class feature.

Exportera Sidekick-data

Formats:

JSON

Later:

* CSV
* Markdown
* PDF

Users must be able to restore their data from JSON.

⸻

39. Data Import

Support:

Importera
├── Replace existing data
└── Merge with existing data

Import should validate schema versions.

⸻

40. Database Versioning

IndexedDB schema must be versioned.

Example:

v1
v2
v3

Migrations must be explicit.

No destructive schema changes without migration.

⸻

41. Security & Privacy

Default:

User data stays on the device.

No account is required.

External APIs should receive only the minimum required information.

Before implementing AI/API functionality, the architecture must define:

* What data leaves the device
* Where it goes
* Whether it is stored
* How API keys are handled

API keys must never be embedded in a public client-side application if the API provider does not explicitly support secure client-side usage.

⸻

42. PWA

Sidekick should support:

* Installable application
* Offline cache
* App icon
* Splash/startup behavior
* Standalone display
* Responsive layout

The service worker should cache the application shell.

User data remains in IndexedDB.

⸻

43. Accessibility

Target:

WCAG 2.1 AA

Requirements:

* Keyboard navigation
* Semantic HTML
* Screen-reader labels
* Focus management
* Touch-friendly controls
* Sufficient contrast
* Reduced-motion support
* Clear error states

⸻

44. Performance

Metric	Requirement
First Contentful Paint	< 1.5s
Time to Interactive	< 3s
Module switch	< 500ms
Local search	< 200ms
IndexedDB write	< 100ms
Initial JS bundle	Keep as small as practical

Performance should be measured rather than assumed.

⸻

45. Testing Strategy

Unit Tests

Test:

* Profit calculations
* Margin calculations
* VAT calculations
* Recommendation logic
* Project lifecycle rules
* Data validation
* Import/export
* Database migrations

Component Tests

Test:

* Forms
* Cards
* Project views
* Calculators
* Navigation

End-to-End

Later:

Create project
 ↓
Add product
 ↓
Calculate profit
 ↓
Create task
 ↓
Complete task
 ↓
Recommendation changes

This represents the critical user journey.

⸻

46. Roadmap

Phase 0 — First Usable Release

Goal: Get the application into the teenagers’ hands as quickly as possible.

Features:

* PWA shell
* Swedish UI
* Dashboard
* Projects
* Tasks
* Notes
* Basic Dropshipping project type
* Profit calculator
* IndexedDB
* JSON export/import
* Dark/light theme
* Demo project

The first version does NOT need:

* AI
* trend APIs
* supplier API integrations
* cloud sync
* advanced analytics

Definition of done

A teenager can:

Open Sidekick
   ↓
Create project
   ↓
Add product
   ↓
Calculate profitability
   ↓
Create research notes
   ↓
Get next task
   ↓
Close the app
   ↓
Return later
   ↓
Everything is still there

⸻

47. Phase 1 — Foundation

Build the complete core architecture:

* Module registry
* Repository layer
* Event bus
* Recommendation engine
* Structured entities
* Database migrations
* Search
* Data export/import
* PWA
* Accessibility
* Testing infrastructure

Some of these can be introduced progressively during Phase 0 rather than waiting until everything is complete.

⸻

48. Phase 2 — Dropshipping Vertical

Features:

* Product database
* Product research
* Manual Opportunity Score
* Profit calculator
* What-if analysis
* Supplier tracker
* Competitor tracker
* Workflow templates
* Stage checklists
* Experiments
* Basic trend logging
* Reality Check rules

⸻

49. Phase 3 — Intelligence

Features:

* AI assistant
* AI product analysis
* External trend research
* Smart recommendations
* Smart note linking
* AI Reality Check
* Contextual learning
* Research summarization

⸻

50. Phase 4 — Swedish Business Layer

Features:

* VAT/moms guidance
* EU/non-EU considerations
* Consumer rights
* Returns
* Import/customs
* Product safety
* Swedish business resources
* Age-related considerations
* “Innan du börjar sälja”

⸻

51. Phase 5 — Platform Expansion

Potential features:

* Additional business models
* Cloud sync
* Advanced analytics
* Multi-language support
* Module catalogue
* Dynamically installable modules
* Community features

Possible modules:

Dropshipping
Print-on-Demand
Digital Products
Affiliate Marketing
Freelancing
Reselling
AI Services
Content Creation

⸻

52. Development Philosophy

Sidekick should be developed in small vertical slices.

Avoid:

Build entire architecture
        ↓
Build every screen
        ↓
Build every database
        ↓
Six weeks later
        ↓
First user

Prefer:

Create project
        ↓
Use it
        ↓
Improve
        ↓
Add notes
        ↓
Use it
        ↓
Improve
        ↓
Add product
        ↓
Use it
        ↓
Improve

The first users are also product testers.

⸻

53. User Feedback Loop

Sidekick should eventually contain:

💡 Föreslå en funktion

A suggestion can contain:

* What the user wanted
* Why they wanted it
* Optional screenshot/context
* Project/module context

This becomes the product backlog.

The architecture should make adding small features inexpensive.

⸻

54. Product Philosophy

Sidekick should encourage:

* Experimentation
* Evidence
* Small budgets
* Learning
* Iteration
* Critical thinking

Sidekick should discourage:

* “Get rich quick” thinking
* Treating AI predictions as facts
* Treating trend scores as guarantees
* Spending large amounts before validation
* Confusing revenue with profit

⸻

55. Open Questions

1. Should the demo project be enabled by default?
2. What should the visual identity/brand of Sidekick be?
3. Which Swedish external sources should be used for the business/legal layer?
4. Which trend sources provide sufficiently useful data?
5. Which AI provider should eventually be supported?
6. Should Sidekick remain open source?
7. Should optional cloud sync eventually exist?
8. Should users be able to share projects?
9. Should a future family/parent mode exist?
10. Should modules eventually become independently installable packages?

These questions must not block the first usable release.

⸻

56. Glossary

Term	Definition
PWA	Progressive Web App
IndexedDB	Browser-based local database
Module	Self-contained Sidekick feature
Project	Business idea being explored
Experiment	Small test designed to produce evidence
Lifecycle Stage	Project development state
Opportunity Score	Explainable product evaluation
Reality Check	System that challenges unsupported assumptions
Recommendation	Suggested next action or warning
Fact	Value supported by known information
Estimate	Approximation based on available information
Assumption	Unverified belief used in a calculation or plan

⸻

57. Final Product Definition

Sidekick is not primarily:

A dropshipping app.

It is:

A personal entrepreneurial operating system that helps young people turn ideas into experiments, experiments into evidence, and evidence into better decisions.

Dropshipping is the first vertical.

The platform is the long-term product.
