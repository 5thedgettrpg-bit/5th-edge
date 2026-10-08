# VTT Automation Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all current 5th Edge race, class, and approved subclass JSON machine-readable enough for the VTT to execute supported mechanics without parsing prose, while exposing explicit hooks for mechanics the VTT does not yet support.

**Architecture:** Keep player-facing descriptions intact, add or normalize structured `automation` data using one shared vocabulary, and validate the data with a dependency-free Node test/validation layer. Existing race-specific structured fields such as `racialSpellcasting` remain valid source data but should be mirrored or normalized into the shared automation contract where the VTT needs consistent access.

**Tech Stack:** JSON, Node.js ESM, built-in `node:test` and `node:assert`, existing 5th Edge static repository.

**Spec:** `docs/superpowers/specs/2026-10-07-vtt-automation-contract-design.md`

## Global Constraints

- Prose explains the rule. Automation tells the VTT what to do.
- The VTT must not need to parse natural-language descriptions to determine how an executable mechanic works.
- The same mechanic must use the same automation vocabulary whether it comes from a race, class, subclass, feat, spell, or future content type.
- If the VTT does not yet support a mechanic, encode an explicit `support: "required"` hook rather than leaving it prose-only.
- Do not change approved mechanics during the automation pass.
- Do not rewrite player-facing prose unless needed to remove ambiguity between prose and automation.
- Prefer shared primitives over feature-specific one-off schemas.
- Preserve existing `racialSpellcasting` data and normalize rather than discard it.
- Subclass feature cadence for the current approved subclasses is 1, 3, 7, 11, 17.

## Review Focus

- Duplicate Extra Attack sources must not stack unless a feature explicitly allows it.
- Level gates must distinguish class level from character level, especially racial spells versus subclass expanded spells.
- Spell-list additions must remain distinct from spells automatically known, prepared, or freely cast.
- Builder choices must always resolve to valid options, including replacement choices such as Hexblade's Thirsting Blade fallback.
- Unsupported mechanics must fail validation if they are prose-only instead of carrying an explicit required VTT hook.

---

### Task 1: Add Rules Automation Validation Harness

**Files:**
- Create: `tests/rules-automation.test.mjs`
- Create: `scripts/validate-rules-json.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: JSON files under `data/races/`, `data/classes/`, and `data/subclasses/` when present.
- Produces: `npm run rules:test` and `npm run rules:validate`; reusable validation functions exported from `scripts/validate-rules-json.mjs`.

- [ ] **Step 1: Write the failing validation tests**

Use built-in `node:test` to assert:
- every JSON file parses,
- feature IDs are unique where IDs exist,
- any feature marked executable has either structured `automation` or an explicit required VTT hook,
- resources with recovery semantics declare recovery,
- Extra Attack automation uses the shared attack-count shape,
- spell-list additions are not represented as free-cast spell grants,
- subclass spell unlocks identify class-level gates,
- explicit required hooks contain both `hook` and `parameters`.

- [ ] **Step 2: Run the tests and verify they fail against the current mixed schemas**

Run: `node --test tests/rules-automation.test.mjs`

Expected: FAIL on currently unnormalized race/class automation and missing subclass files.

- [ ] **Step 3: Implement validation helpers**

In `scripts/validate-rules-json.mjs`, export:
- `loadJsonFiles(rootDir)`
- `collectFeatures(document)`
- `validateAutomationDocument(document, filePath)`
- `validateRepository(rootDir)`

Keep the validator schema-oriented. It must not infer mechanics from descriptions.

- [ ] **Step 4: Add package scripts**

Add:
- `"rules:test": "node --test tests/rules-automation.test.mjs"`
- `"rules:validate": "node scripts/validate-rules-json.mjs"`

- [ ] **Step 5: Run the harness**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: harness executes successfully, while repository validation still reports the known automation gaps until later tasks complete.

- [ ] **Step 6: Commit**

Commit message: `test: add VTT rules automation validation`

---

### Task 2: Normalize Race Automation Across Current Race JSON

**Files:**
- Modify: all current `data/races/*.json` content files
- Test: `tests/rules-automation.test.mjs`

**Interfaces:**
- Consumes: shared automation vocabulary and validator from Task 1.
- Produces: race variants whose executable mechanics are structured consistently for the VTT.

- [ ] **Step 1: Add failing race coverage tests**

Add representative assertions covering at least:
- Human racial skill-die bonus,
- Human racial spellcasting and spell-list additions,
- Elf magical-darkness vision,
- Elf PB-per-long-rest teleport,
- Dwarf poison damage immunity and poisoned-condition immunity,
- Dwarf permanent HP-per-level scaling,
- one proficiency grant,
- one feat grant,
- one racial spell ability choice,
- one explicit unsupported hook where the VTT cannot yet execute the rule.

Also add a repository-wide assertion that every current race feature with an executable effect has shared automation data or a required hook.

- [ ] **Step 2: Run race tests and verify failure**

Run: `node --test tests/rules-automation.test.mjs`

Expected: FAIL on current prose-only race mechanics.

- [ ] **Step 3: Add shared automation to race features**

Audit every current race file under `data/races/` and encode, where applicable:
- senses,
- movement,
- proficiencies,
- languages and choices,
- resistance/immunity/vulnerability,
- condition immunity,
- skill bonuses and advantage,
- feats,
- racial spell grants,
- spell-list additions,
- proficiency-bonus-based uses,
- teleports,
- size and creature-type effects,
- HP scaling,
- AC formulas,
- attack/targeting modifiers,
- builder choices.

Preserve `racialSpellcasting`; map its mechanics into the shared automation vocabulary rather than deleting it.

- [ ] **Step 4: Add required VTT hooks for unsupported race mechanics**

For any executable race rule the current vocabulary cannot represent directly, add:
`automation.support = "required"`, a stable `hook` name, and structured `parameters`.

- [ ] **Step 5: Run race and repository validation**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: all race automation assertions PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: automate current race rules for VTT`

---

### Task 3: Complete Ranger Automation

**Files:**
- Modify: `data/classes/ranger.json`
- Test: `tests/rules-automation.test.mjs`

**Interfaces:**
- Consumes: shared validator and automation vocabulary.
- Produces: Ranger class JSON with structured automation for every executable class feature.

- [ ] **Step 1: Add failing Ranger tests**

Assert structured automation for:
- Hunter's Instinct resource/use,
- Fighting Style builder choice,
- Know Your Enemy,
- Combat Instincts,
- Deft Explorer,
- Extra Attack using shared attack-count replacement,
- Nature's Veil,
- Favored Enemy progression,
- Vanish,
- Feral Senses,
- Foe Slayer,
- spellcasting and cantrip rules.

- [ ] **Step 2: Run Ranger tests and verify failure**

Run: `node --test tests/rules-automation.test.mjs`

Expected: FAIL because Ranger currently has no feature automation blocks.

- [ ] **Step 3: Implement Ranger automation**

Add the minimum structured data necessary for the builder and VTT to execute each supported rule. Use required hooks only where execution is not yet supported.

- [ ] **Step 4: Verify Ranger**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: PASS for Ranger.

- [ ] **Step 5: Commit**

Commit message: `feat: automate Ranger class rules`

---

### Task 4: Complete Paladin Automation

**Files:**
- Modify: `data/classes/paladin.json`
- Test: `tests/rules-automation.test.mjs`

**Interfaces:**
- Consumes: shared validator and automation vocabulary.
- Produces: Paladin class JSON with machine-readable resource, spellcasting, aura, and combat mechanics.

- [ ] **Step 1: Add failing Paladin tests**

Assert automation for:
- Lay on Hands pool and recovery,
- Fighting Style choice,
- Divine Smite,
- Warrior of Divinity,
- Harness Divine Power,
- Extra Attack using shared attack-count replacement,
- aura effects,
- spellcasting,
- resource recovery,
- subclass hooks and feature-level gates.

- [ ] **Step 2: Run Paladin tests and verify failure**

Run: `node --test tests/rules-automation.test.mjs`

Expected: FAIL because Paladin currently lacks feature automation blocks.

- [ ] **Step 3: Implement Paladin automation**

Encode all supported mechanics and required VTT hooks without changing approved Paladin rules.

- [ ] **Step 4: Verify Paladin**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: PASS for Paladin.

- [ ] **Step 5: Commit**

Commit message: `feat: automate Paladin class rules`

---

### Task 5: Normalize Wizard, Barbarian, and Rogue to the Shared Contract

**Files:**
- Modify as needed: `data/classes/wizard.json`
- Modify as needed: `data/classes/barbarian.json`
- Modify as needed: `data/classes/rogue.json`
- Test: `tests/rules-automation.test.mjs`

**Interfaces:**
- Consumes: shared contract and validator.
- Produces: all existing class JSON using compatible automation shapes.

- [ ] **Step 1: Add compatibility tests**

Assert:
- Barbarian and Rogue retain automation for every executable feature,
- Wizard foundational builder/spellcasting features have structured hooks where needed,
- all three classes use the shared shapes for resources, substitutions, attack count, advantage, resistances, and builder choices,
- no approved mechanics change.

- [ ] **Step 2: Run compatibility tests**

Run: `node --test tests/rules-automation.test.mjs`

Expected: PASS for most Barbarian/Rogue behavior, FAIL on any incompatible or missing Wizard/shared-contract fields.

- [ ] **Step 3: Normalize only where required**

Do not rewrite already-correct feature mechanics. Add or rename structured fields only where necessary for consistency with the shared contract.

- [ ] **Step 4: Verify all current classes**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: PASS for Barbarian, Ranger, Rogue, Paladin, and Wizard.

- [ ] **Step 5: Commit**

Commit message: `refactor: normalize class automation contract`

---

### Task 6: Add College of Valor Bard Subclass JSON

**Files:**
- Create: `data/subclasses/bard/college-of-valor.json`
- Test: `tests/rules-automation.test.mjs`

**Interfaces:**
- Consumes: shared subclass schema and automation vocabulary.
- Produces: standalone Valor Bard subclass JSON that can later attach to the Bard base-class implementation.

- [ ] **Step 1: Add failing Valor tests**

Assert:
- `classId = "bard"`,
- feature levels are exactly 1, 3, 7, 11, 17,
- level 1 grants medium armor, shields, martial weapons, occupied-hand somatic casting, and Bardic Inspiration weapon-damage use,
- expanded spells unlock by Bard level with the finalized spell table,
- Enchanted Blade selects one proficient non-two-handed weapon after a long rest and substitutes Charisma for attack and damage,
- level 7 Extra Attack uses shared attack-count automation,
- level 11 Combat Inspiration expends Bardic Inspiration and grants +5 AC through the start of the target's next turn including the triggering attack,
- level 17 Battle Magic triggers after casting a non-damaging Bard spell with the action and permits two weapon attacks as a bonus action.

- [ ] **Step 2: Run Valor tests and verify failure**

Run: `node --test tests/rules-automation.test.mjs`

Expected: FAIL because the subclass file does not exist.

- [ ] **Step 3: Create Valor subclass JSON**

Use the finalized player-facing rules text and structured automation from the spec. Do not create an unfinished Bard base-class JSON.

- [ ] **Step 4: Verify Valor**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: PASS for Valor.

- [ ] **Step 5: Commit**

Commit message: `feat: add automated College of Valor subclass`

---

### Task 7: Add Hexblade Warlock Subclass JSON

**Files:**
- Create: `data/subclasses/warlock/hexblade.json`
- Test: `tests/rules-automation.test.mjs`

**Interfaces:**
- Consumes: shared subclass schema and automation vocabulary.
- Produces: standalone Hexblade subclass JSON that can later attach to the Warlock base-class implementation.

- [ ] **Step 1: Add failing Hexblade tests**

Assert:
- `classId = "warlock"`,
- feature levels are exactly 1, 3, 7, 11, 17,
- level 1 grants medium armor, shields, martial weapons, occupied-hand somatic casting,
- expanded spells are distinct spell-list additions,
- Hex Weapon selection occurs after a long rest, accepts a proficient non-two-handed weapon, substitutes Charisma for attack and damage, and exposes the Pact of the Blade override,
- Thirsting Blade is granted at level 7 with prerequisite bypass,
- if Thirsting Blade is already known, automation exposes a replacement Eldritch Invocation choice for which the character qualifies,
- Armor of Hexes triggers only on a hit from a creature affected by one of the Warlock's spells, uses a reaction, rolls d6, and converts the hit to a miss on 4+,
- Far Wanderer removes the need to breathe and grants fire and cold resistance.

- [ ] **Step 2: Run Hexblade tests and verify failure**

Run: `node --test tests/rules-automation.test.mjs`

Expected: FAIL because the subclass file does not exist.

- [ ] **Step 3: Create Hexblade subclass JSON**

Use the approved rules text and structured automation. Do not create an unfinished Warlock base-class JSON.

- [ ] **Step 4: Verify Hexblade**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: PASS for Hexblade.

- [ ] **Step 5: Commit**

Commit message: `feat: add automated Hexblade subclass`

---

### Task 8: Repository-Wide Automation Audit and Final Validation

**Files:**
- Modify as needed: any current `data/races/*.json`, `data/classes/*.json`, `data/subclasses/**/*.json`
- Modify: `tests/rules-automation.test.mjs` only for missed validation cases, not to weaken assertions

**Interfaces:**
- Consumes: all work from Tasks 1-7.
- Produces: one validated rules-data set ready for VTT consumption and future VTT hook implementation.

- [ ] **Step 1: Add final repository-wide tests**

Assert:
- all current race/class/subclass JSON parses,
- all executable mechanics have shared automation or explicit required hooks,
- every builder choice is resolvable,
- every resource has recovery where applicable,
- class-level and character-level gates are explicit,
- spell-list additions differ from granted/free-cast spells,
- attack-count replacement sources do not accidentally stack,
- stable IDs are unique,
- no current approved mechanics were removed.

- [ ] **Step 2: Run final tests**

Run:
- `npm run rules:test`
- `npm run rules:validate`

Expected: PASS with no warnings for missing automation.

- [ ] **Step 3: Review the diff against the design spec**

Confirm each spec section has an implemented data shape or explicit required hook. Do not resolve unrelated legacy `data/species/` cleanup in this pass.

- [ ] **Step 4: Commit final audit**

Commit message: `chore: complete VTT automation audit`
