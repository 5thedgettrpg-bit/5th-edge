# Temporary Spell Design Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a temporary local spell-authoring GUI that loads unfinished official 5e.tools 2014 spells, lets the user edit the complete spell and VTT-relevant mechanics, and writes each finished canonical spell JSON directly to the 5th Edge GitHub repository.

**Architecture:** Keep the temporary tool isolated under `tools/spell-editor/` so it can be deleted after the spell pass without affecting the live site. The browser loads 5e.tools source records for unfinished spells, reads `data/spells/` from the 5th Edge repository for Done spells, normalizes edits through a pure spell-model module, derives deterministic VTT mechanics from the card fields, and uses the GitHub Contents API for authenticated create/update writes. GitHub is the authority for completion; local storage holds only drafts and optional local editor settings.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, browser Fetch API, GitHub REST Contents API, browser localStorage, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-08-temporary-spell-design-editor.md`

## Global Constraints

- The editor is temporary and local-only; no public deployment or server-side application is required.
- The permanent source of truth is `5thedgettrpg-bit/5th-edge`.
- Canonical finished spells live as one JSON file per spell under `data/spells/<stable-slug>.json`.
- Needs Done and SRD Safe come from the approved official 2014-rules-era 5e.tools spell corpus.
- Done comes from canonical spell JSON already present in the 5th Edge GitHub spell folder.
- Spell JSON owns base-class availability only: Artificer, Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard.
- Subclass, race, background, feat, and other feature spell grants remain owned by those features' own JSON and are not copied into the spell's base-class list.
- Preserve useful 5e.tools fields instead of collapsing records to a minimal schema.
- Player-facing card fields are the source of truth for mechanics that can be derived deterministically.
- Do not require the user to enter the same mechanic twice.
- A spell is marked Done only after GitHub confirms the canonical file write.
- Never hardcode or commit a GitHub token.
- An unchanged spell can be finalized and written as canonical JSON.
- A finished spell reopened from Done must load the GitHub canonical record, not its old 5e.tools baseline.

## Review Focus

- A renamed spell must retain a stable file identity so editing the display name does not orphan the old canonical path; tests must pin slug/file-key behavior.
- GitHub create versus update must use the correct current blob SHA and must never mark the spell Done after a rejected or failed write; tests must cover both flows.
- Source records with uncommon 5e.tools component/range/duration shapes must round-trip without losing fields; tests must cover object material components and nonstandard range/duration records.
- Card edits that change range, area, save, damage dice/type, concentration, or upcasting must update generated VTT mechanics without stale duplicate values; tests must exercise a Fireball-like transformation.
- Subclass/classVariant source metadata must be preserved as provenance but excluded from canonical base-class access; tests must exercise a Wizard-only spell with variant/subclass access in source data.

---

### Task 1: Isolate the editor and define the canonical spell model

**Files:**
- Create: `tools/spell-editor/index.html`
- Create: `tools/spell-editor/styles.css`
- Create: `tools/spell-editor/app.js`
- Create: `tools/spell-editor/spell-model.mjs`
- Create: `tools/spell-editor/tests/spell-model.test.mjs`

**Interfaces:**
- Consumes: raw 5e.tools spell records and canonical 5th Edge spell records.
- Produces:
  - `normalizeSourceSpell(raw, access): CanonicalDraft`
  - `applyCardPatch(draft, patch): CanonicalDraft`
  - `buildCanonicalSpell(draft): CanonicalSpell`
  - `spellFileKey(spell): string`
  - `BASE_CLASSES: readonly string[]`

- [ ] **Step 1: Write failing model tests**

Cover:
- a PHB/SRD record retains unknown/useful raw metadata;
- the approved nine base classes are the only values accepted into `classes`;
- `classVariant`/subclass-like source access is preserved under provenance but does not enter `classes`;
- `spellFileKey()` is stable across a display-name edit by using a stored canonical/source key;
- an unchanged normalized spell serializes into a complete canonical record.

Run: `node --test tools/spell-editor/tests/spell-model.test.mjs`

Expected: FAIL because the model module does not exist.

- [ ] **Step 2: Implement the model API**

Implement the exact exported interfaces above in `spell-model.mjs`. Keep preserved source-only metadata grouped under a provenance/raw-source field while promoting editable canonical fields to top-level normalized fields. Store a stable internal/source key that survives later name edits and determines the filename unless an explicit migration is implemented.

- [ ] **Step 3: Run the model tests**

Run: `node --test tools/spell-editor/tests/spell-model.test.mjs`

Expected: PASS.

- [ ] **Step 4: Add the isolated editor shell**

Create a three-pane-capable shell in `index.html` and `styles.css` with sidebar state tabs, main spell card region, collapsible VTT Mechanics region, Advanced/Raw region, token/settings controls, validation status, and Finish actions. `app.js` should initially render the shell without network dependencies.

- [ ] **Step 5: Commit**

```bash
git add tools/spell-editor
git commit -m "feat: scaffold temporary spell editor model"
```

### Task 2: Load the approved 5e.tools corpus and derive unfinished queues

**Files:**
- Create: `tools/spell-editor/source-loader.mjs`
- Create: `tools/spell-editor/source-config.mjs`
- Create: `tools/spell-editor/tests/source-loader.test.mjs`
- Modify: `tools/spell-editor/app.js`

**Interfaces:**
- Consumes:
  - `normalizeSourceSpell(raw, access)` from Task 1.
  - approved source-file configuration.
- Produces:
  - `loadSourceCorpus(fetchImpl): Promise<SourceSpell[]>`
  - `loadSpellAccess(fetchImpl): Promise<SpellAccessIndex>`
  - `partitionUnfinished(sourceSpells, doneKeys): { needsDone, srdSafe }`
  - `SOURCE_FILES: readonly string[]`

- [ ] **Step 1: Write failing source-loader tests**

Use stubbed fetch responses to assert:
- only the approved official source files are loaded;
- 5e.tools source/access metadata is joined without treating classVariant/subclass access as base classes;
- SRD truthiness sends an unfinished spell to SRD Safe;
- non-SRD sends an unfinished spell to Needs Done;
- any source spell whose stable key is present in Done is excluded from both unfinished queues;
- duplicate name/source identities are rejected or deterministically deduplicated with an explicit validation error.

Run: `node --test tools/spell-editor/tests/source-loader.test.mjs`

Expected: FAIL.

- [ ] **Step 2: Implement source configuration and loader**

Define the approved 2014 source files in one configuration module, use raw GitHub/5e.tools endpoints that support browser CORS, and keep fetch dependency injection for tests.

- [ ] **Step 3: Wire startup loading into the editor**

On startup, load source corpus and access data, but do not yet perform GitHub writes. Render counts and names under Needs Done and SRD Safe.

- [ ] **Step 4: Run tests**

Run:
```bash
node --test tools/spell-editor/tests/source-loader.test.mjs
node --test tools/spell-editor/tests/spell-model.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/spell-editor
git commit -m "feat: load official 2014 spell corpus"
```

### Task 3: Build the editable spell card and deterministic mechanics generator

**Files:**
- Create: `tools/spell-editor/mechanics.mjs`
- Create: `tools/spell-editor/spell-card.mjs`
- Create: `tools/spell-editor/tests/mechanics.test.mjs`
- Modify: `tools/spell-editor/index.html`
- Modify: `tools/spell-editor/styles.css`
- Modify: `tools/spell-editor/app.js`

**Interfaces:**
- Consumes: `CanonicalDraft` from Task 1.
- Produces:
  - `deriveMechanics(spell): DerivedMechanics`
  - `mergeExplicitMechanics(derived, overrides): SpellMechanics`
  - `renderSpellCard(container, draft, callbacks): void`
  - `readCardPatch(container): SpellPatch`

- [ ] **Step 1: Write failing mechanics tests**

Pin a Fireball-like transformation:
- baseline range 150 feet becomes 120 feet;
- sphere becomes a 20-foot square;
- 8d6 fire becomes 10d8 cold;
- Dexterity save remains explicit;
- half-on-success remains represented;
- an upcast rule changes to the card's edited scaling;
- the resulting mechanics have no stale 150/8d6/fire/sphere values.

Also cover:
- concentration/duration synchronization;
- attack-roll versus save resolution;
- multi-instance damage;
- spells with no damage;
- explicit mechanics overrides for behaviors that cannot be derived from card fields.

Run: `node --test tools/spell-editor/tests/mechanics.test.mjs`

Expected: FAIL.

- [ ] **Step 2: Implement mechanics derivation**

Derive mechanics from structured card fields, not by reparsing free-form description text when an explicit field exists. Allow explicit VTT-only overrides for exceptional mechanics and merge them after derived values.

- [ ] **Step 3: Implement the spell-card GUI**

Render editable controls for:
- name;
- level;
- school;
- casting time;
- range;
- target/area;
- V/S/M and material details;
- duration/concentration;
- ritual;
- description entries;
- At Higher Levels;
- base-class checkboxes;
- structured save/attack/damage/healing/condition fields needed to make VTT derivation reliable.

The visual presentation should resemble a readable spell card, not a spreadsheet/database form.

- [ ] **Step 4: Implement the collapsible VTT Mechanics and Advanced/Raw panels**

Show generated mechanics readably and expose only exceptional/manual mechanics fields for direct editing. Advanced/Raw shows preserved fields and provenance without making raw JSON the primary editing experience.

- [ ] **Step 5: Run tests**

Run:
```bash
node --test tools/spell-editor/tests/mechanics.test.mjs
node --test tools/spell-editor/tests/spell-model.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/spell-editor
git commit -m "feat: add editable spell cards and VTT mechanics"
```

### Task 4: Add validation, drafts, and lossless canonical export

**Files:**
- Create: `tools/spell-editor/validation.mjs`
- Create: `tools/spell-editor/drafts.mjs`
- Create: `tools/spell-editor/tests/validation.test.mjs`
- Create: `tools/spell-editor/tests/roundtrip.test.mjs`
- Modify: `tools/spell-editor/app.js`

**Interfaces:**
- Consumes: model/mechanics APIs from Tasks 1 and 3.
- Produces:
  - `validateCanonicalSpell(spell): ValidationIssue[]`
  - `loadDraft(key): CanonicalDraft | null`
  - `saveDraft(key, draft): void`
  - `clearDraft(key): void`
  - `downloadSpellJson(spell): void`

- [ ] **Step 1: Write failing validation and round-trip tests**

Cover:
- level outside 0-9;
- invalid school;
- malformed dice formula;
- invalid base class;
- area spell missing shape/size;
- VTT mechanics contradicting card-derived range/damage;
- uncommon object material component survives normalization/export;
- nonstandard range/duration source shapes survive round-trip under preserved provenance;
- canonical JSON can serialize without dropping preserved unknown source fields.

Run:
```bash
node --test tools/spell-editor/tests/validation.test.mjs
node --test tools/spell-editor/tests/roundtrip.test.mjs
```

Expected: FAIL.

- [ ] **Step 2: Implement validation and exact-field error reporting**

Return issues with `path`, `code`, and `message` so the GUI can point to the exact invalid field. Block Finish when severity is error.

- [ ] **Step 3: Implement local draft persistence**

Autosave in-progress edits keyed by stable spell identity. Local draft state must never make a spell Done. Add Reset Unsaved Changes.

- [ ] **Step 4: Implement single-spell backup export**

Export the exact canonical JSON that would be written to GitHub as `<stable-slug>.json`.

- [ ] **Step 5: Run tests**

Run:
```bash
node --test tools/spell-editor/tests/validation.test.mjs
node --test tools/spell-editor/tests/roundtrip.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/spell-editor
git commit -m "feat: validate and preserve spell drafts"
```

### Task 5: Add direct GitHub read/write integration and authoritative Done state

**Files:**
- Create: `tools/spell-editor/github-client.mjs`
- Create: `tools/spell-editor/tests/github-client.test.mjs`
- Modify: `tools/spell-editor/app.js`
- Modify: `tools/spell-editor/index.html`
- Modify: `tools/spell-editor/styles.css`

**Interfaces:**
- Consumes: canonical spell JSON, stable file key, runtime GitHub token.
- Produces:
  - `createGitHubClient({ token, owner, repo, branch, fetchImpl }): GitHubClient`
  - `GitHubClient.listDoneSpells(): Promise<DoneSpellRef[]>`
  - `GitHubClient.readSpell(fileKey): Promise<{ spell, sha }>`
  - `GitHubClient.writeSpell(fileKey, spell, currentSha?): Promise<WriteResult>`

- [ ] **Step 1: Write failing GitHub client tests**

With mocked fetch, cover:
- list/read of `data/spells/`;
- creating a new spell without a SHA;
- updating an existing Done spell with the current SHA;
- retry is not attempted blindly after SHA conflict;
- unauthorized/forbidden/network failures return explicit errors;
- token never appears in serialized spell data or local draft data;
- a failed write leaves the spell unfinished.

Run: `node --test tools/spell-editor/tests/github-client.test.mjs`

Expected: FAIL.

- [ ] **Step 2: Implement GitHub client**

Target:
- owner: `5thedgettrpg-bit`
- repo: `5th-edge`
- branch: `main`
- spell folder: `data/spells/`

Use the Contents API with a runtime token and correct blob SHA for updates.

- [ ] **Step 3: Make Done authoritative from GitHub**

On authenticated refresh:
- list canonical spell files from GitHub;
- map them by stable key;
- remove those keys from Needs Done/SRD Safe;
- populate Done;
- clicking Done reads that canonical GitHub JSON.

If GitHub cannot be reached, show a clear disconnected state and do not pretend locally saved drafts are Done.

- [ ] **Step 4: Implement Finish / Save to GitHub and Finish & Next**

Flow:
1. build canonical spell;
2. validate;
3. fetch current Done file/SHA when updating;
4. create or update GitHub file;
5. only on success clear local draft;
6. refresh Done from GitHub;
7. move/open next unfinished spell for Finish & Next.

- [ ] **Step 5: Run tests**

Run:
```bash
node --test tools/spell-editor/tests/github-client.test.mjs
node --test tools/spell-editor/tests/*.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/spell-editor
git commit -m "feat: save canonical spells directly to GitHub"
```

### Task 6: Add operator workflow polish and perform end-to-end acceptance

**Files:**
- Create: `tools/spell-editor/README.md`
- Modify: `tools/spell-editor/index.html`
- Modify: `tools/spell-editor/styles.css`
- Modify: `tools/spell-editor/app.js`
- Test: `tools/spell-editor/tests/*.test.mjs`

**Interfaces:**
- Consumes: all prior task APIs.
- Produces: the complete temporary authoring workflow.

- [ ] **Step 1: Add workflow tests for sidebar state transitions**

Using pure/state helpers where possible, assert:
- unfinished non-SRD spell starts in Needs Done;
- unfinished SRD spell starts in SRD Safe;
- successful GitHub completion moves it to Done;
- reopening Done loads canonical GitHub data;
- saving an edited Done spell updates the same canonical file;
- failed write does not change its completion state.

Run: `node --test tools/spell-editor/tests/*.test.mjs`

Expected: PASS.

- [ ] **Step 2: Add practical editor controls**

Add search, level filter, source filter, completion counts, previous/next navigation, unsaved indicator, Save Draft, Finish / Save to GitHub, Finish & Next, Export JSON, Reset Unsaved Changes, token connection status, and refresh-from-GitHub control.

- [ ] **Step 3: Write the temporary operator README**

Document:
- how to open/run the editor locally;
- how to create/use a least-privilege GitHub token for this private workflow without embedding it in source;
- the Needs Done / SRD Safe / Done meaning;
- the one-spell-per-file output path;
- recovery using local drafts or Export JSON;
- how to delete `tools/spell-editor/` after the design pass without deleting `data/spells/`.

- [ ] **Step 4: Run the full automated test suite**

Run:
```bash
npm run rules:test
npm run rules:validate
node --test tools/spell-editor/tests/*.test.mjs
```

Expected: all existing rule tests/validation and all editor tests pass.

- [ ] **Step 5: Perform one real user acceptance spell**

Have the user choose one real spell they are comfortable finalizing. In the GUI:
1. open it from Needs Done or SRD Safe;
2. either accept it unchanged or make a deliberately visible rules edit;
3. inspect generated VTT mechanics;
4. click Finish / Save to GitHub;
5. verify the file appears under `data/spells/<stable-slug>.json`;
6. verify the spell disappears from its unfinished queue and appears in Done;
7. reopen it from Done and confirm the GUI exactly reflects the canonical GitHub JSON.

If the user chooses a Fireball-style edit, verify range, area, damage dice/type, save resolution, and At Higher Levels all round-trip correctly.

- [ ] **Step 6: Commit final editor polish**

```bash
git add tools/spell-editor
git commit -m "feat: finish temporary spell design workflow"
```

## Post-Editor Follow-Up

The website and Arcana VTT consumption work is intentionally outside this implementation plan. After the spell library is sufficiently populated, create separate scoped work for:

1. generating/maintaining any combined spell index or bundle consumers need;
2. teaching the 5th Edge site to render canonical spell JSON;
3. teaching Arcana VTT to load the same canonical JSON and execute the normalized `mechanics` contract;
4. validating subclass/race/feature spell references against the canonical library.

The temporary editor must remain deletable without breaking any of those permanent consumers.
