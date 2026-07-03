# OIO V3.0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the separate `oio-v3/` React/TypeScript/Dexie app while preserving the existing root-level V2 app.

**Architecture:** The V3 app lives entirely under `oio-v3/`. Data access flows through typed models, Dexie schema, repositories, and services before reaching React features. V2 `localStorage["oio.v1"]` migration is treated as an import path with automatic backup.

**Tech Stack:** React, TypeScript, Vite, Dexie, IndexedDB, Vitest, Testing Library, fake-indexeddb.

## Global Constraints

- Keep the existing root-level `index.html`, `styles.css`, and `app.js` intact.
- Build V3.0 in a separate folder named `oio-v3/`.
- Do not add AI API calls.
- Do not add Review V3 stages.
- Do not add TTS, listening practice, recording, pronunciation comparison, input method mode, cloud sync, user accounts, backend, IELTS-specific behavior, or a major visual redesign.
- Preserve the existing V2 core workflow: source expression intent -> rewritten English text -> highlighted chunk -> cloze card -> context review -> review history.
- Use test-first implementation for production TypeScript behavior.

---

## File Structure

Create these files during implementation:

```text
oio-v3/
  package.json
  index.html
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
  vitest.setup.ts
  src/
    main.tsx
    App.tsx
    app/AppProvider.tsx
    app/routes.ts
    components/EmptyState.tsx
    components/Modal.tsx
    components/Toolbar.tsx
    db/OioDatabase.ts
    db/schema.ts
    features/backup/BackupPage.tsx
    features/cards/CardsPage.tsx
    features/chunks/ChunksPage.tsx
    features/home/HomePage.tsx
    features/prompts/PromptsPage.tsx
    features/review/ReviewPage.tsx
    features/texts/TextDetailPage.tsx
    features/texts/TextLibraryPage.tsx
    models/oio.ts
    repositories/OioRepository.ts
    services/backupService.ts
    services/clozeService.ts
    services/exportService.ts
    services/migrationService.ts
    services/reviewScheduler.ts
    services/textSelectionService.ts
    styles/main.css
    test/fixtures.ts
    test/testDb.ts
```

Keep files small and focused:

- `models/oio.ts` defines data shapes only.
- `db/OioDatabase.ts` owns Dexie setup only.
- `repositories/OioRepository.ts` owns persistence operations only.
- `services/*` contains pure or nearly pure business logic.
- `features/*` contains page-level React UI.

---

### Task 1: Scaffold V3 Project And Test Harness

**Files:**
- Create: `oio-v3/package.json`
- Create: `oio-v3/index.html`
- Create: `oio-v3/tsconfig.json`
- Create: `oio-v3/tsconfig.node.json`
- Create: `oio-v3/vite.config.ts`
- Create: `oio-v3/vitest.setup.ts`
- Create: `oio-v3/src/main.tsx`
- Create: `oio-v3/src/App.tsx`
- Create: `oio-v3/src/styles/main.css`
- Create: `oio-v3/src/test/smoke.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`
- Produces: npm scripts `dev`, `build`, `test`, `test:run`

- [ ] **Step 1: Create scaffold files without app business logic**

Create `oio-v3/package.json`:

```json
{
  "name": "oio-v3",
  "version": "3.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "dexie": "^4.0.11",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.3",
    "vite": "^6.0.7",
    "vitest": "^2.1.8"
  }
}
```

Create `oio-v3/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OIO V3</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `oio-v3/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `oio-v3/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `oio-v3/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
```

Create `oio-v3/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

Create `oio-v3/src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>OIO V3</h1>
      <p>V3 foundation is starting from a separate app folder.</p>
    </main>
  );
}
```

Create `oio-v3/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/main.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `oio-v3/src/styles/main.css`:

```css
:root {
  color: #17202a;
  background: #f6f7f9;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

body {
  margin: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px;
}
```

- [ ] **Step 2: Write the smoke test**

Create `oio-v3/src/test/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";

describe("App", () => {
  it("renders the V3 shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "OIO V3" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created under `oio-v3/`.

- [ ] **Step 4: Run tests**

Run: `npm run test:run`

Expected: PASS with `1 passed`.

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: exit code 0 and a `dist/` build output.

- [ ] **Step 6: Commit**

```bash
git add oio-v3
git commit -m "feat: scaffold oio v3 app"
```

---

### Task 2: Define Models, Dexie Schema, And Test Database Helpers

**Files:**
- Create: `oio-v3/src/models/oio.ts`
- Create: `oio-v3/src/db/schema.ts`
- Create: `oio-v3/src/db/OioDatabase.ts`
- Create: `oio-v3/src/test/testDb.ts`
- Create: `oio-v3/src/db/OioDatabase.test.ts`

**Interfaces:**
- Produces: `type OioDataSet`
- Produces: `class OioDatabase extends Dexie`
- Produces: `createTestDb(name?: string): OioDatabase`
- Produces: `emptyDataSet(): OioDataSet`

- [ ] **Step 1: Write failing schema tests**

Create `oio-v3/src/db/OioDatabase.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../test/testDb";

describe("OioDatabase", () => {
  const opened: Array<{ close: () => void; delete: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(
      opened.map(async (db) => {
        db.close();
        await db.delete();
      }),
    );
    opened.length = 0;
  });

  it("opens all V3 stores", async () => {
    const db = createTestDb("schema-test");
    opened.push(db);

    await db.open();

    expect(db.tables.map((table) => table.name).sort()).toEqual([
      "backups",
      "cards",
      "chunks",
      "images",
      "migrationState",
      "reviews",
      "settings",
      "sourceIntents",
      "texts",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/db/OioDatabase.test.ts`

Expected: FAIL because `../test/testDb` does not exist.

- [ ] **Step 3: Implement models and database**

Create `oio-v3/src/models/oio.ts`:

```ts
export type TextType = "story" | "expression_set" | "dialogue" | "writing" | "work" | "casual" | "other";
export type CardPriority = "important" | "normal";
export type ReviewRating = "again" | "good" | "easy";

export type TextItem = {
  id: string;
  title: string;
  originalText?: string;
  rewrittenText: string;
  translation?: string;
  note?: string;
  tags: string[];
  textType: TextType;
  sourceDate: string;
  createdAt: string;
  updatedAt: string;
};

export type SourceIntent = {
  id: string;
  textId: string;
  selectedText: string;
  note: string;
  createdAt: string;
};

export type Chunk = {
  id: string;
  textId: string;
  sourceIntentId?: string;
  selectedText: string;
  sentence: string;
  explanation?: string;
  usageNote?: string;
  personalNote?: string;
  tags: string[];
  createdAt: string;
};

export type Card = {
  id: string;
  textId: string;
  chunkId?: string;
  sourceIntentId?: string;
  sentence: string;
  clozeText: string;
  maskedChunk: string;
  answer: string;
  hint?: string;
  focusNote?: string;
  priority: CardPriority;
  masteryCount: number;
  easyStreak: number;
  isGraduated: boolean;
  graduatedAt?: string;
  reviewCount: number;
  dueAt: string;
  lastReviewedAt?: string;
  createdAt: string;
};

export type TextImage = {
  id: string;
  textId: string;
  name: string;
  dataUrl: string;
  createdAt: string;
};

export type ReviewLog = {
  id: string;
  cardId: string;
  rating: ReviewRating;
  wasCorrect: boolean;
  reviewedAt: string;
};

export type ReviewSettings = {
  id: "review";
  sessionSize: number;
};

export type BackupRecord = {
  id: string;
  kind: "pre_migration" | "pre_import" | "manual";
  createdAt: string;
  payload: unknown;
};

export type MigrationState = {
  id: string;
  source: "localStorage:oio.v1";
  completedAt: string;
  sourceHash: string;
};

export type OioDataSet = {
  texts: TextItem[];
  sourceIntents: SourceIntent[];
  chunks: Chunk[];
  cards: Card[];
  images: TextImage[];
  reviews: ReviewLog[];
  settings: ReviewSettings[];
  backups: BackupRecord[];
  migrationState: MigrationState[];
};

export function emptyDataSet(): OioDataSet {
  return {
    texts: [],
    sourceIntents: [],
    chunks: [],
    cards: [],
    images: [],
    reviews: [],
    settings: [{ id: "review", sessionSize: 7 }],
    backups: [],
    migrationState: [],
  };
}
```

Create `oio-v3/src/db/schema.ts`:

```ts
export const databaseName = "oio-v3";

export const schemaV1 = {
  texts: "id, title, sourceDate, createdAt, updatedAt",
  sourceIntents: "id, textId, createdAt",
  chunks: "id, textId, sourceIntentId, createdAt",
  cards: "id, textId, chunkId, sourceIntentId, dueAt, createdAt, isGraduated, priority",
  images: "id, textId, createdAt",
  reviews: "id, cardId, reviewedAt, rating",
  settings: "id",
  backups: "id, kind, createdAt",
  migrationState: "id, source, completedAt, sourceHash",
};
```

Create `oio-v3/src/db/OioDatabase.ts`:

```ts
import Dexie, { type Table } from "dexie";
import { schemaV1 } from "./schema";
import type {
  BackupRecord,
  Card,
  Chunk,
  MigrationState,
  ReviewLog,
  ReviewSettings,
  SourceIntent,
  TextImage,
  TextItem,
} from "../models/oio";

export class OioDatabase extends Dexie {
  texts!: Table<TextItem, string>;
  sourceIntents!: Table<SourceIntent, string>;
  chunks!: Table<Chunk, string>;
  cards!: Table<Card, string>;
  images!: Table<TextImage, string>;
  reviews!: Table<ReviewLog, string>;
  settings!: Table<ReviewSettings, string>;
  backups!: Table<BackupRecord, string>;
  migrationState!: Table<MigrationState, string>;

  constructor(name = "oio-v3") {
    super(name);
    this.version(1).stores(schemaV1);
  }
}
```

Create `oio-v3/src/test/testDb.ts`:

```ts
import { OioDatabase } from "../db/OioDatabase";

export function createTestDb(name = `oio-v3-test-${crypto.randomUUID()}`) {
  return new OioDatabase(name);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/db/OioDatabase.test.ts`

Expected: PASS.

- [ ] **Step 5: Run full tests and build**

Run: `npm run test:run && npm run build`

Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add oio-v3/src oio-v3/package.json oio-v3/package-lock.json oio-v3/*.json oio-v3/*.ts
git commit -m "feat: add oio v3 data schema"
```

---

### Task 3: Add Repository, Backup, Export, Import, And V2 Migration Services

**Files:**
- Create: `oio-v3/src/repositories/OioRepository.ts`
- Create: `oio-v3/src/services/backupService.ts`
- Create: `oio-v3/src/services/exportService.ts`
- Create: `oio-v3/src/services/migrationService.ts`
- Create: `oio-v3/src/test/fixtures.ts`
- Create: `oio-v3/src/services/migrationService.test.ts`
- Create: `oio-v3/src/services/exportService.test.ts`

**Interfaces:**
- Consumes: `OioDatabase`, `OioDataSet`
- Produces: `class OioRepository`
- Produces: `exportDataSet(repository): Promise<OioDataSet>`
- Produces: `replaceDataSet(repository, dataSet): Promise<void>`
- Produces: `migrateV2LocalStorage(repository, storage, now): Promise<MigrationResult>`

- [ ] **Step 1: Write failing migration and export tests**

Create `oio-v3/src/test/fixtures.ts`:

```ts
import type { OioDataSet } from "../models/oio";
import { emptyDataSet } from "../models/oio";

export const sampleNow = "2026-07-03T12:00:00.000Z";

export function sampleV2Payload() {
  return {
    texts: [
      {
        id: "text_1",
        title: "晚饭邀约",
        originalText: "我今天不太想寒暄。",
        rewrittenText: "I'm not really in the mood for small talk today.",
        translation: "我今天不太想寒暄。",
        note: "",
        tags: ["daily"],
        textType: "dialogue",
        sourceDate: "2026-07-03",
        createdAt: "2026-07-03T10:00:00.000Z",
        updatedAt: "2026-07-03T10:00:00.000Z",
      },
    ],
    sourceIntents: [
      {
        id: "intent_1",
        textId: "text_1",
        selectedText: "不太想寒暄",
        note: "不太想寒暄",
        createdAt: "2026-07-03T10:01:00.000Z",
      },
    ],
    chunks: [
      {
        id: "chunk_1",
        textId: "text_1",
        sourceIntentId: "intent_1",
        selectedText: "in the mood for small talk",
        sentence: "I'm not really in the mood for small talk today.",
        explanation: "",
        usageNote: "",
        personalNote: "",
        tags: [],
        createdAt: "2026-07-03T10:02:00.000Z",
      },
    ],
    cards: [
      {
        id: "card_1",
        textId: "text_1",
        chunkId: "chunk_1",
        sourceIntentId: "intent_1",
        sentence: "I'm not really in the mood for small talk today.",
        clozeText: "I'm not really in the ___ for small talk today.",
        maskedChunk: "in the ___ for small talk",
        answer: "mood",
        priority: "important",
        masteryCount: 1,
        easyStreak: 0,
        isGraduated: false,
        reviewCount: 2,
        dueAt: "2026-07-03T10:05:00.000Z",
        createdAt: "2026-07-03T10:03:00.000Z",
      },
    ],
    images: [],
    reviews: [],
    reviewSettings: { sessionSize: 7 },
  };
}

export function sampleDataSet(): OioDataSet {
  const empty = emptyDataSet();
  const v2 = sampleV2Payload();
  return {
    ...empty,
    texts: v2.texts,
    sourceIntents: v2.sourceIntents,
    chunks: v2.chunks,
    cards: v2.cards,
    images: [],
    reviews: [],
    settings: [{ id: "review", sessionSize: 7 }],
    backups: [],
    migrationState: [],
  };
}
```

Create `oio-v3/src/services/migrationService.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createTestDb } from "../test/testDb";
import { sampleNow, sampleV2Payload } from "../test/fixtures";
import { OioRepository } from "../repositories/OioRepository";
import { migrateV2LocalStorage } from "./migrationService";

describe("migrateV2LocalStorage", () => {
  const dbs: Array<{ close: () => void; delete: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(dbs.map(async (db) => {
      db.close();
      await db.delete();
    }));
    dbs.length = 0;
  });

  it("imports V2 localStorage payload, creates a backup, and records migration state", async () => {
    const db = createTestDb("migration-test");
    dbs.push(db);
    const repository = new OioRepository(db);
    const storage = new Map([["oio.v1", JSON.stringify(sampleV2Payload())]]);

    const result = await migrateV2LocalStorage(repository, storage, () => sampleNow);
    const data = await repository.getDataSet();

    expect(result.status).toBe("migrated");
    expect(data.texts).toHaveLength(1);
    expect(data.cards[0].priority).toBe("important");
    expect(data.settings[0]).toEqual({ id: "review", sessionSize: 7 });
    expect(data.backups[0].kind).toBe("pre_migration");
    expect(data.migrationState[0].source).toBe("localStorage:oio.v1");
  });

  it("does not import the same V2 payload twice", async () => {
    const db = createTestDb("migration-idempotent-test");
    dbs.push(db);
    const repository = new OioRepository(db);
    const storage = new Map([["oio.v1", JSON.stringify(sampleV2Payload())]]);

    await migrateV2LocalStorage(repository, storage, () => sampleNow);
    const second = await migrateV2LocalStorage(repository, storage, () => sampleNow);
    const data = await repository.getDataSet();

    expect(second.status).toBe("already_migrated");
    expect(data.texts).toHaveLength(1);
    expect(data.backups).toHaveLength(1);
  });
});
```

Create `oio-v3/src/services/exportService.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { OioRepository } from "../repositories/OioRepository";
import { createTestDb } from "../test/testDb";
import { sampleDataSet } from "../test/fixtures";
import { exportDataSet, replaceDataSet } from "./exportService";

describe("exportService", () => {
  const dbs: Array<{ close: () => void; delete: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(dbs.map(async (db) => {
      db.close();
      await db.delete();
    }));
    dbs.length = 0;
  });

  it("round-trips a full data set", async () => {
    const db = createTestDb("export-test");
    dbs.push(db);
    const repository = new OioRepository(db);
    const input = sampleDataSet();

    await replaceDataSet(repository, input);
    const output = await exportDataSet(repository);

    expect(output.texts).toEqual(input.texts);
    expect(output.cards).toEqual(input.cards);
    expect(output.settings).toEqual(input.settings);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/services/migrationService.test.ts src/services/exportService.test.ts`

Expected: FAIL because repository and services do not exist.

- [ ] **Step 3: Implement repository and services**

Create `oio-v3/src/repositories/OioRepository.ts`:

```ts
import type { OioDatabase } from "../db/OioDatabase";
import type { BackupRecord, MigrationState, OioDataSet } from "../models/oio";
import { emptyDataSet } from "../models/oio";

export class OioRepository {
  constructor(private readonly db: OioDatabase) {}

  async getDataSet(): Promise<OioDataSet> {
    return {
      texts: await this.db.texts.toArray(),
      sourceIntents: await this.db.sourceIntents.toArray(),
      chunks: await this.db.chunks.toArray(),
      cards: await this.db.cards.toArray(),
      images: await this.db.images.toArray(),
      reviews: await this.db.reviews.toArray(),
      settings: await this.db.settings.toArray(),
      backups: await this.db.backups.toArray(),
      migrationState: await this.db.migrationState.toArray(),
    };
  }

  async replaceDataSet(dataSet: OioDataSet): Promise<void> {
    await this.db.transaction(
      "rw",
      this.db.texts,
      this.db.sourceIntents,
      this.db.chunks,
      this.db.cards,
      this.db.images,
      this.db.reviews,
      this.db.settings,
      this.db.backups,
      this.db.migrationState,
      async () => {
        await Promise.all([
          this.db.texts.clear(),
          this.db.sourceIntents.clear(),
          this.db.chunks.clear(),
          this.db.cards.clear(),
          this.db.images.clear(),
          this.db.reviews.clear(),
          this.db.settings.clear(),
          this.db.backups.clear(),
          this.db.migrationState.clear(),
        ]);
        await this.putDataSet(dataSet);
      },
    );
  }

  async putDataSet(dataSet: OioDataSet): Promise<void> {
    const withDefaults = { ...emptyDataSet(), ...dataSet };
    await Promise.all([
      this.db.texts.bulkPut(withDefaults.texts),
      this.db.sourceIntents.bulkPut(withDefaults.sourceIntents),
      this.db.chunks.bulkPut(withDefaults.chunks),
      this.db.cards.bulkPut(withDefaults.cards),
      this.db.images.bulkPut(withDefaults.images),
      this.db.reviews.bulkPut(withDefaults.reviews),
      this.db.settings.bulkPut(withDefaults.settings),
      this.db.backups.bulkPut(withDefaults.backups),
      this.db.migrationState.bulkPut(withDefaults.migrationState),
    ]);
  }

  async addBackup(backup: BackupRecord): Promise<void> {
    await this.db.backups.put(backup);
  }

  async addMigrationState(state: MigrationState): Promise<void> {
    await this.db.migrationState.put(state);
  }
}
```

Create `oio-v3/src/services/backupService.ts`:

```ts
import type { BackupRecord } from "../models/oio";

export function createBackupRecord(kind: BackupRecord["kind"], payload: unknown, now: () => string): BackupRecord {
  return {
    id: `backup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    createdAt: now(),
    payload,
  };
}
```

Create `oio-v3/src/services/exportService.ts`:

```ts
import type { OioDataSet } from "../models/oio";
import type { OioRepository } from "../repositories/OioRepository";

export async function exportDataSet(repository: OioRepository): Promise<OioDataSet> {
  return repository.getDataSet();
}

export async function replaceDataSet(repository: OioRepository, dataSet: OioDataSet): Promise<void> {
  await repository.replaceDataSet(dataSet);
}
```

Create `oio-v3/src/services/migrationService.ts`:

```ts
import type { Card, OioDataSet, ReviewSettings, TextType } from "../models/oio";
import { emptyDataSet } from "../models/oio";
import type { OioRepository } from "../repositories/OioRepository";
import { createBackupRecord } from "./backupService";

export type MigrationResult =
  | { status: "no_source" }
  | { status: "already_migrated" }
  | { status: "migrated" }
  | { status: "invalid_source"; error: string };

type StorageLike = {
  getItem?: (key: string) => string | null;
  get?: (key: string) => string | undefined;
};

function readStorage(storage: StorageLike, key: string): string | null {
  if (typeof storage.getItem === "function") return storage.getItem(key);
  if (typeof storage.get === "function") return storage.get(key) ?? null;
  return null;
}

function hashSource(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function normalizeTextType(value: unknown): TextType {
  const allowed: TextType[] = ["story", "expression_set", "dialogue", "writing", "work", "casual", "other"];
  return allowed.includes(value as TextType) ? (value as TextType) : "dialogue";
}

function normalizeCard(card: Partial<Card>): Card {
  return {
    id: String(card.id),
    textId: String(card.textId),
    chunkId: card.chunkId,
    sourceIntentId: card.sourceIntentId,
    sentence: String(card.sentence || ""),
    clozeText: String(card.clozeText || ""),
    maskedChunk: String(card.maskedChunk || ""),
    answer: String(card.answer || ""),
    hint: card.hint,
    focusNote: card.focusNote,
    priority: card.priority === "important" ? "important" : "normal",
    masteryCount: Number.isFinite(card.masteryCount) ? Number(card.masteryCount) : 0,
    easyStreak: Number.isFinite(card.easyStreak) ? Number(card.easyStreak) : 0,
    isGraduated: Boolean(card.isGraduated),
    graduatedAt: card.graduatedAt,
    reviewCount: Number.isFinite(card.reviewCount) ? Number(card.reviewCount) : 0,
    dueAt: String(card.dueAt || new Date(0).toISOString()),
    lastReviewedAt: card.lastReviewedAt,
    createdAt: String(card.createdAt || new Date(0).toISOString()),
  };
}

function normalizeV2Payload(payload: Record<string, unknown>): OioDataSet {
  const empty = emptyDataSet();
  const reviewSettings = payload.reviewSettings as Partial<ReviewSettings> | undefined;

  return {
    ...empty,
    texts: Array.isArray(payload.texts)
      ? payload.texts.map((text) => ({ ...(text as any), textType: normalizeTextType((text as any).textType), tags: Array.isArray((text as any).tags) ? (text as any).tags : [] }))
      : [],
    sourceIntents: Array.isArray(payload.sourceIntents) ? (payload.sourceIntents as any[]) : [],
    chunks: Array.isArray(payload.chunks)
      ? payload.chunks.map((chunk) => ({ ...(chunk as any), tags: Array.isArray((chunk as any).tags) ? (chunk as any).tags : [] }))
      : [],
    cards: Array.isArray(payload.cards) ? payload.cards.map((card) => normalizeCard(card as Partial<Card>)) : [],
    images: Array.isArray(payload.images) ? (payload.images as any[]) : [],
    reviews: Array.isArray(payload.reviews) ? (payload.reviews as any[]) : [],
    settings: [{ id: "review", sessionSize: Number(reviewSettings?.sessionSize) || 7 }],
  };
}

export async function migrateV2LocalStorage(repository: OioRepository, storage: StorageLike, now: () => string): Promise<MigrationResult> {
  const raw = readStorage(storage, "oio.v1");
  if (!raw) return { status: "no_source" };

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { status: "invalid_source", error: error instanceof Error ? error.message : "Invalid JSON" };
  }

  const sourceHash = hashSource(raw);
  const existing = await repository.getDataSet();
  if (existing.migrationState.some((state) => state.source === "localStorage:oio.v1" && state.sourceHash === sourceHash)) {
    return { status: "already_migrated" };
  }

  const backup = createBackupRecord("pre_migration", parsed, now);
  const dataSet = normalizeV2Payload(parsed);
  dataSet.backups = [backup];
  dataSet.migrationState = [
    {
      id: `migration_${sourceHash}`,
      source: "localStorage:oio.v1",
      completedAt: now(),
      sourceHash,
    },
  ];

  await repository.replaceDataSet(dataSet);
  return { status: "migrated" };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/services/migrationService.test.ts src/services/exportService.test.ts`

Expected: PASS.

- [ ] **Step 5: Run full tests and build**

Run: `npm run test:run && npm run build`

Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add oio-v3/src
git commit -m "feat: add v2 migration and backup services"
```

---

### Task 4: Add Review, Cloze, And Text Selection Services

**Files:**
- Create: `oio-v3/src/services/reviewScheduler.ts`
- Create: `oio-v3/src/services/reviewScheduler.test.ts`
- Create: `oio-v3/src/services/clozeService.ts`
- Create: `oio-v3/src/services/clozeService.test.ts`
- Create: `oio-v3/src/services/textSelectionService.ts`
- Create: `oio-v3/src/services/textSelectionService.test.ts`

**Interfaces:**
- Produces: `dueCards(cards, now): Card[]`
- Produces: `rateCard(card, rating, wasCorrect, now): { card: Card; review: ReviewLog }`
- Produces: `clozeFromSelection(sentence, chunkText, selectedIndexes): { maskedChunk: string; clozeText: string; answer: string }`
- Produces: `expandSelectionToWord(fullText, selected): string`

- [ ] **Step 1: Write failing service tests**

Create `oio-v3/src/services/reviewScheduler.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Card } from "../models/oio";
import { dueCards, rateCard } from "./reviewScheduler";

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "card_1",
    textId: "text_1",
    chunkId: "chunk_1",
    sentence: "I'm not really in the mood for small talk today.",
    clozeText: "I'm not really in the ___ for small talk today.",
    maskedChunk: "in the ___ for small talk",
    answer: "mood",
    priority: "normal",
    masteryCount: 0,
    easyStreak: 0,
    isGraduated: false,
    reviewCount: 0,
    dueAt: "2026-07-03T09:00:00.000Z",
    createdAt: "2026-07-03T08:00:00.000Z",
    ...overrides,
  };
}

describe("reviewScheduler", () => {
  it("sorts due cards by important, low mastery, low review count, newer created time, then earlier due time", () => {
    const cards = dueCards(
      [
        card({ id: "normal", priority: "normal", masteryCount: 0 }),
        card({ id: "important", priority: "important", masteryCount: 2 }),
        card({ id: "graduated", isGraduated: true }),
      ],
      new Date("2026-07-03T12:00:00.000Z"),
    );

    expect(cards.map((item) => item.id)).toEqual(["important", "normal"]);
  });

  it("rates good cards for tomorrow and increments mastery", () => {
    const result = rateCard(card(), "good", true, new Date("2026-07-03T12:00:00.000Z"));

    expect(result.card.masteryCount).toBe(1);
    expect(result.card.easyStreak).toBe(0);
    expect(result.card.reviewCount).toBe(1);
    expect(result.card.dueAt).toBe("2026-07-04T12:00:00.000Z");
    expect(result.review.rating).toBe("good");
  });

  it("graduates a card after enough successful reviews", () => {
    const result = rateCard(card({ masteryCount: 2, easyStreak: 1 }), "easy", true, new Date("2026-07-03T12:00:00.000Z"));

    expect(result.card.isGraduated).toBe(true);
    expect(result.card.graduatedAt).toBe("2026-07-03T12:00:00.000Z");
  });
});
```

Create `oio-v3/src/services/clozeService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clozeFromSelection } from "./clozeService";

describe("clozeFromSelection", () => {
  it("builds a masked chunk, cloze sentence, and answer from selected token indexes", () => {
    const result = clozeFromSelection(
      "I'm not really in the mood for small talk today.",
      "in the mood for small talk",
      [2],
    );

    expect(result).toEqual({
      maskedChunk: "in the ___ for small talk",
      clozeText: "I'm not really in the ___ for small talk today.",
      answer: "mood",
    });
  });
});
```

Create `oio-v3/src/services/textSelectionService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { expandSelectionToWord } from "./textSelectionService";

describe("expandSelectionToWord", () => {
  it("expands a partial word selection to the full word", () => {
    expect(expandSelectionToWord("I wanted to say hello.", "ell")).toBe("hello");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/services/reviewScheduler.test.ts src/services/clozeService.test.ts src/services/textSelectionService.test.ts`

Expected: FAIL because the service modules do not exist.

- [ ] **Step 3: Implement services**

Create `oio-v3/src/services/reviewScheduler.ts`:

```ts
import type { Card, ReviewLog, ReviewRating } from "../models/oio";

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function easyIntervalDays(easyStreak: number) {
  if (easyStreak <= 1) return 3;
  if (easyStreak === 2) return 7;
  if (easyStreak === 3) return 14;
  return 30;
}

export function dueCards(cards: Card[], now: Date): Card[] {
  return cards
    .filter((card) => !card.isGraduated && new Date(card.dueAt).getTime() <= now.getTime())
    .slice()
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "important" ? -1 : 1;
      if (a.masteryCount !== b.masteryCount) return a.masteryCount - b.masteryCount;
      if (a.reviewCount !== b.reviewCount) return a.reviewCount - b.reviewCount;
      const createdDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (createdDiff) return createdDiff;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
}

export function rateCard(card: Card, rating: ReviewRating, wasCorrect: boolean, now: Date): { card: Card; review: ReviewLog } {
  const reviewedAt = now.toISOString();
  const next: Card = {
    ...card,
    reviewCount: card.reviewCount + 1,
    lastReviewedAt: reviewedAt,
  };

  if (rating === "again") {
    next.easyStreak = 0;
    next.dueAt = addMinutes(now, 10).toISOString();
  }

  if (rating === "good") {
    next.masteryCount = card.masteryCount + 1;
    next.easyStreak = 0;
    next.dueAt = addDays(now, 1).toISOString();
  }

  if (rating === "easy") {
    next.masteryCount = card.masteryCount + 1;
    next.easyStreak = card.easyStreak + 1;
    next.dueAt = addDays(now, easyIntervalDays(next.easyStreak)).toISOString();
  }

  if (next.masteryCount >= 3 && next.easyStreak >= 2) {
    next.isGraduated = true;
    next.graduatedAt = reviewedAt;
  }

  return {
    card: next,
    review: {
      id: `review_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      cardId: card.id,
      rating,
      wasCorrect,
      reviewedAt,
    },
  };
}
```

Create `oio-v3/src/services/clozeService.ts`:

```ts
export function clozeFromSelection(sentence: string, chunkText: string, selectedIndexes: number[]) {
  const tokens = chunkText.match(/\S+/g) || [];
  const selected = new Set(selectedIndexes);
  const answer = selectedIndexes.map((index) => tokens[index]).filter(Boolean).join(" ");
  const maskedChunk = tokens.map((token, index) => (selected.has(index) ? "___" : token)).join(" ");
  const clozeText = sentence.includes(chunkText)
    ? sentence.replace(chunkText, maskedChunk)
    : sentence.replace(answer, answer.split(/\s+/).map(() => "___").join(" "));

  return { maskedChunk, clozeText, answer };
}
```

Create `oio-v3/src/services/textSelectionService.ts`:

```ts
function isWordChar(char: string) {
  return /[A-Za-z0-9']/.test(char);
}

export function expandSelectionToWord(fullText: string, selected: string) {
  const trimmed = selected.trim();
  const index = fullText.indexOf(trimmed);
  if (index < 0) return trimmed;

  let start = index;
  let end = index + trimmed.length;
  while (start > 0 && isWordChar(fullText[start - 1])) start -= 1;
  while (end < fullText.length && isWordChar(fullText[end])) end += 1;
  return fullText.slice(start, end).trim();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/services/reviewScheduler.test.ts src/services/clozeService.test.ts src/services/textSelectionService.test.ts`

Expected: PASS.

- [ ] **Step 5: Run full tests and build**

Run: `npm run test:run && npm run build`

Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add oio-v3/src/services
git commit -m "feat: add review and cloze services"
```

---

### Task 5: Build App Provider And Core Pages

**Files:**
- Create: `oio-v3/src/app/routes.ts`
- Create: `oio-v3/src/app/AppProvider.tsx`
- Modify: `oio-v3/src/App.tsx`
- Create: `oio-v3/src/components/EmptyState.tsx`
- Create: `oio-v3/src/components/Modal.tsx`
- Create: `oio-v3/src/components/Toolbar.tsx`
- Create: `oio-v3/src/features/home/HomePage.tsx`
- Create: `oio-v3/src/features/prompts/PromptsPage.tsx`
- Create: `oio-v3/src/features/texts/TextLibraryPage.tsx`
- Create: `oio-v3/src/features/texts/TextDetailPage.tsx`
- Create: `oio-v3/src/features/chunks/ChunksPage.tsx`
- Create: `oio-v3/src/features/cards/CardsPage.tsx`
- Create: `oio-v3/src/features/review/ReviewPage.tsx`
- Create: `oio-v3/src/features/backup/BackupPage.tsx`
- Modify: `oio-v3/src/styles/main.css`
- Create: `oio-v3/src/App.test.tsx`

**Interfaces:**
- Consumes: `OioRepository`, migration services, review services.
- Produces: user-visible V3 screens for existing V2 core workflows.

- [ ] **Step 1: Write failing app integration test**

Create `oio-v3/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App navigation", () => {
  it("opens the text library and backup page from the shell", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Texts" }));
    expect(screen.getByRole("heading", { name: "Text Library" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Backup" }));
    expect(screen.getByRole("heading", { name: "Data Backup" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/App.test.tsx`

Expected: FAIL because navigation buttons are not implemented.

- [ ] **Step 3: Implement provider, routes, pages, and shell**

Create `oio-v3/src/app/routes.ts`:

```ts
export type RouteName = "home" | "prompts" | "texts" | "chunks" | "cards" | "review" | "backup";

export const routes: Array<{ name: RouteName; label: string }> = [
  { name: "home", label: "Home" },
  { name: "prompts", label: "Prompts" },
  { name: "texts", label: "Texts" },
  { name: "chunks", label: "Chunks" },
  { name: "cards", label: "Cards" },
  { name: "review", label: "Review" },
  { name: "backup", label: "Backup" },
];
```

Create `oio-v3/src/app/AppProvider.tsx`:

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { OioDatabase } from "../db/OioDatabase";
import { OioRepository } from "../repositories/OioRepository";
import type { RouteName } from "./routes";

type AppContextValue = {
  route: RouteName;
  setRoute: (route: RouteName) => void;
  repository: OioRepository;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteName>("home");
  const repository = useMemo(() => new OioRepository(new OioDatabase()), []);

  return <AppContext.Provider value={{ route, setRoute, repository }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppContext must be used inside AppProvider");
  return value;
}
```

Create `oio-v3/src/components/EmptyState.tsx`:

```tsx
export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
```

Create `oio-v3/src/components/Modal.tsx`:

```tsx
export function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="modal">
      <section className="modal-box">
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}
```

Create `oio-v3/src/components/Toolbar.tsx`:

```tsx
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="toolbar">{children}</div>;
}
```

Create simple page components with the exact headings:

```tsx
// oio-v3/src/features/home/HomePage.tsx
export function HomePage() {
  return <h2>Home</h2>;
}
```

```tsx
// oio-v3/src/features/prompts/PromptsPage.tsx
export function PromptsPage() {
  return <h2>Prompts</h2>;
}
```

```tsx
// oio-v3/src/features/texts/TextLibraryPage.tsx
export function TextLibraryPage() {
  return <h2>Text Library</h2>;
}
```

```tsx
// oio-v3/src/features/texts/TextDetailPage.tsx
export function TextDetailPage() {
  return <h2>Text Detail</h2>;
}
```

```tsx
// oio-v3/src/features/chunks/ChunksPage.tsx
export function ChunksPage() {
  return <h2>Chunks</h2>;
}
```

```tsx
// oio-v3/src/features/cards/CardsPage.tsx
export function CardsPage() {
  return <h2>Cards</h2>;
}
```

```tsx
// oio-v3/src/features/review/ReviewPage.tsx
export function ReviewPage() {
  return <h2>Review</h2>;
}
```

```tsx
// oio-v3/src/features/backup/BackupPage.tsx
export function BackupPage() {
  return <h2>Data Backup</h2>;
}
```

Modify `oio-v3/src/App.tsx`:

```tsx
import { AppProvider, useAppContext } from "./app/AppProvider";
import { routes } from "./app/routes";
import { BackupPage } from "./features/backup/BackupPage";
import { CardsPage } from "./features/cards/CardsPage";
import { ChunksPage } from "./features/chunks/ChunksPage";
import { HomePage } from "./features/home/HomePage";
import { PromptsPage } from "./features/prompts/PromptsPage";
import { ReviewPage } from "./features/review/ReviewPage";
import { TextLibraryPage } from "./features/texts/TextLibraryPage";

function ActivePage() {
  const { route } = useAppContext();
  if (route === "prompts") return <PromptsPage />;
  if (route === "texts") return <TextLibraryPage />;
  if (route === "chunks") return <ChunksPage />;
  if (route === "cards") return <CardsPage />;
  if (route === "review") return <ReviewPage />;
  if (route === "backup") return <BackupPage />;
  return <HomePage />;
}

function Shell() {
  const { route, setRoute } = useAppContext();
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>OIO V3</h1>
          <p>Local-first expression learning</p>
        </div>
        <nav className="nav-tabs" aria-label="Primary">
          {routes.map((item) => (
            <button
              key={item.name}
              type="button"
              className={item.name === route ? "active" : ""}
              onClick={() => setRoute(item.name)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <ActivePage />
    </main>
  );
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
```

Append to `oio-v3/src/styles/main.css`:

```css
.topbar {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.nav-tabs,
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nav-tabs button,
.toolbar button {
  border: 1px solid #cfd6dd;
  border-radius: 8px;
  background: #ffffff;
  color: #17202a;
  padding: 8px 12px;
}

.nav-tabs button.active {
  border-color: #17202a;
  background: #17202a;
  color: #ffffff;
}

.empty-state {
  border: 1px dashed #aab4be;
  border-radius: 8px;
  padding: 16px;
  color: #5b6773;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 5: Expand each page incrementally**

For each page, add one failing test, then implement the smallest UI and repository interaction that supports the V2 workflow:

```text
TextLibraryPage: create/edit/list texts.
TextDetailPage: display rewritten text, create source intents, create chunks.
ChunksPage: list chunks and open cloze creation.
CardsPage: list cards and delete cards.
ReviewPage: start a due-card session, check normalized answer, rate Again/Good/Easy.
PromptsPage: keep the manual prompt workflow.
BackupPage: export JSON, import JSON, show migration status.
```

Use this test shape for each page:

```tsx
it("performs the main page workflow", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Texts" }));
  expect(screen.getByRole("heading", { name: "Text Library" })).toBeInTheDocument();
});
```

Run after each page: `npm run test:run -- src/App.test.tsx`

Expected after each page: PASS.

- [ ] **Step 6: Run full tests and build**

Run: `npm run test:run && npm run build`

Expected: exit code 0.

- [ ] **Step 7: Commit**

```bash
git add oio-v3/src
git commit -m "feat: add oio v3 core pages"
```

---

### Task 6: Add Data Backup UI, Migration Startup Hook, And Browser Smoke Verification

**Files:**
- Modify: `oio-v3/src/app/AppProvider.tsx`
- Modify: `oio-v3/src/features/backup/BackupPage.tsx`
- Create: `oio-v3/src/features/backup/BackupPage.test.tsx`
- Modify: `oio-v3/src/App.test.tsx`
- Modify: `oio-v3/src/styles/main.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: `migrateV2LocalStorage`, `exportDataSet`, `replaceDataSet`
- Produces: visible migration status and backup/import workflow.

- [ ] **Step 1: Write failing backup UI test**

Create `oio-v3/src/features/backup/BackupPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../App";

describe("BackupPage", () => {
  it("shows backup actions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Backup" }));

    expect(screen.getByRole("heading", { name: "Data Backup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export JSON" })).toBeInTheDocument();
    expect(screen.getByLabelText("Import JSON")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/features/backup/BackupPage.test.tsx`

Expected: FAIL because backup actions are not implemented.

- [ ] **Step 3: Implement migration startup status and backup page controls**

Modify `oio-v3/src/app/AppProvider.tsx` so startup runs migration:

```tsx
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { OioDatabase } from "../db/OioDatabase";
import { OioRepository } from "../repositories/OioRepository";
import { migrateV2LocalStorage, type MigrationResult } from "../services/migrationService";
import type { RouteName } from "./routes";

type AppContextValue = {
  route: RouteName;
  setRoute: (route: RouteName) => void;
  repository: OioRepository;
  migrationResult: MigrationResult | null;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteName>("home");
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const repository = useMemo(() => new OioRepository(new OioDatabase()), []);

  useEffect(() => {
    migrateV2LocalStorage(repository, window.localStorage, () => new Date().toISOString()).then(setMigrationResult);
  }, [repository]);

  return <AppContext.Provider value={{ route, setRoute, repository, migrationResult }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppContext must be used inside AppProvider");
  return value;
}
```

Modify `oio-v3/src/features/backup/BackupPage.tsx`:

```tsx
import { useState } from "react";
import { useAppContext } from "../../app/AppProvider";
import { exportDataSet, replaceDataSet } from "../../services/exportService";

export function BackupPage() {
  const { repository, migrationResult } = useAppContext();
  const [message, setMessage] = useState("");

  async function exportJson() {
    const data = await exportDataSet(repository);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oio-v3-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Export prepared.");
  }

  async function importJson(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const current = await exportDataSet(repository);
    await repository.addBackup({
      id: `backup_${Date.now().toString(36)}`,
      kind: "pre_import",
      createdAt: new Date().toISOString(),
      payload: current,
    });
    await replaceDataSet(repository, parsed);
    setMessage("Import complete.");
  }

  return (
    <section>
      <h2>Data Backup</h2>
      <p>Migration status: {migrationResult?.status || "checking"}</p>
      <div className="toolbar">
        <button type="button" onClick={exportJson}>Export JSON</button>
        <label className="file-button">
          Import JSON
          <input
            aria-label="Import JSON"
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void importJson(file);
            }}
          />
        </label>
      </div>
      {message ? <p>{message}</p> : null}
    </section>
  );
}
```

Add to `oio-v3/src/styles/main.css`:

```css
.file-button {
  display: inline-flex;
  align-items: center;
  border: 1px solid #cfd6dd;
  border-radius: 8px;
  background: #ffffff;
  padding: 8px 12px;
}

.file-button input {
  inline-size: 1px;
  block-size: 1px;
  opacity: 0;
  position: absolute;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/features/backup/BackupPage.test.tsx`

Expected: PASS.

- [ ] **Step 5: Update README with V3 run instructions**

Append to `README.md`:

````md
## OIO V3 development

The V3 rewrite lives in `oio-v3/`. The root static V2 app remains intact.

```powershell
cd oio-v3
npm install
npm run dev
```

V3 stores data in IndexedDB and can migrate the old `localStorage["oio.v1"]`
payload on first launch.
````

- [ ] **Step 6: Run full verification**

Run from `oio-v3/`: `npm run test:run && npm run build`

Expected: exit code 0.

- [ ] **Step 7: Run browser smoke test**

Run from `oio-v3/`: `npm run dev`

Open the printed local URL and verify:

```text
Home page renders.
Texts navigation works.
Backup page renders.
V2 root app files are still present at repository root.
```

- [ ] **Step 8: Commit**

```bash
git add README.md oio-v3/src
git commit -m "feat: wire oio v3 backup and migration startup"
```

---

## Final Verification

Run these commands before declaring V3.0 foundation complete:

```powershell
git status --short
cd oio-v3
npm run test:run
npm run build
```

Expected:

```text
Vitest reports all tests passing.
Vite build exits with code 0.
Root V2 files are not deleted or moved.
```

Then start the dev server:

```powershell
npm run dev
```

Use the browser to smoke test Home, Texts, Review, and Backup.

## Self-Review Notes

- Spec coverage: tasks cover separate `oio-v3/`, React/Vite/TypeScript, Dexie schema, V2 migration, backup/export/import, Review V2 scheduling, core screens, tests, build, and browser smoke verification.
- Non-goals preserved: no task adds AI API, Review V3 stages, TTS, input method mode, cloud sync, user accounts, backend, IELTS-specific behavior, or a visual redesign.
- Type consistency: model names match service and repository signatures: `OioDataSet`, `OioRepository`, `migrateV2LocalStorage`, `exportDataSet`, `replaceDataSet`, `dueCards`, `rateCard`, and `clozeFromSelection`.
