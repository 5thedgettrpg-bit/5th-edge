# Temporary Spell Design Editor

Date: 2026-10-08

## Purpose

Build a temporary local HTML/CSS/JavaScript editor for completing the 5th Edge spell design pass. The editor is not part of the permanent product. Its job is to present official 5e.tools 2014 spell data in a readable editable GUI, convert the user's edits into canonical 5th Edge spell JSON, and save completed spell files into the 5th Edge GitHub repository. When the spell pass is finished, the editor can be deleted without affecting the website or VTT.

The permanent source of truth is the spell JSON stored in the 5th Edge repository. Both the 5th Edge website and Arcana VTT will consume that canonical data.

## Source Data

The editor loads the official 2014-rules-era spell corpus from the approved 5e.tools source set already identified for this project.

For unfinished spells, the editor uses the 5e.tools record as the baseline and preserves all useful structured fields from that record rather than reducing spells to a small custom schema.

Useful source data includes, when present:

- name
- source
- page
- SRD status and SRD-safe name
- level
- school
- casting time
- range
- components
- material text and cost/consumption metadata
- duration and concentration
- ritual metadata
- description entries
- higher-level entries
- spell attack metadata
- saving throws
- damage types
- conditions
- area tags
- misc tags
- scaling fields
- alternate/reference sources
- other spell metadata that is useful for display, validation, or VTT behavior

Raw source metadata that is not directly exposed in the main card remains available in an Advanced/Raw section so it is not silently discarded.

## Sidebar and Spell States

The sidebar has three primary sections.

### Needs Done

Contains non-SRD spells that have not yet been finalized into canonical 5th Edge JSON.

### SRD Safe

Contains SRD-covered spells that have not yet been finalized. These may be accepted unchanged or edited.

### Done

Contains spells that already exist as canonical spell JSON in the 5th Edge GitHub spell folder.

A spell must not appear in Needs Done or SRD Safe once a canonical file for that spell exists in the configured 5th Edge GitHub folder.

Done is read from GitHub, not from a local browser-only completion flag. This makes GitHub the authoritative record of completion.

## Editing Model

The main editor looks like a normal spell card rather than a database table.

All player-facing spell fields are editable through readable controls. This includes:

- name
- source/provenance display where appropriate
- level
- school
- casting time
- range
- target/area
- components
- material component details
- duration
- concentration
- ritual
- main description
- At Higher Levels text and scaling
- base-class spell access

The GUI is a human-friendly representation of the canonical JSON. The user should not need to manually edit JSON.

## Base-Class Access

The spell editor manages only normal base-class spell access.

Base-class checkboxes are provided for:

- Artificer
- Bard
- Cleric
- Druid
- Paladin
- Ranger
- Sorcerer
- Warlock
- Wizard

Subclass, race, background, feat, and other feature-granted access does not belong in the canonical spell's base-class list.

For example, if Phantom Steed is a Wizard spell and Hollow Warden grants it, the spell JSON lists Wizard as its base-class access. Hollow Warden's own JSON owns the grant of Phantom Steed.

Any 5e.tools classVariant or subclass-like availability may be preserved as source/provenance metadata, but it does not control 5th Edge base-class availability.

Validation elsewhere should ensure that subclass, race, and other feature JSON references valid canonical spell names.

## VTT Mechanics

Each canonical spell contains explicit VTT mechanics so Arcana VTT does not need to infer core behavior from prose.

The spell card is the source of truth for mechanics that can be deterministically represented by the visible fields. The user should not have to enter the same rule twice.

For example, if Fireball is edited from 150 feet, a 20-foot-radius sphere, and 8d6 fire damage to 120 feet, a 20-foot square, and 10d8 cold damage, the generated JSON must reflect those changes both in the player-facing spell data and in the structured VTT mechanics.

The VTT mechanics model should support, where applicable:

- action/casting type
- range
- point/self/touch targeting
- target count
- area shape and size
- friendly/enemy/both targeting
- spell attack type
- saving throw ability
- success behavior such as half damage or no effect
- damage formulas
- multiple damage instances
- damage types
- healing formulas
- temporary hit points
- upcasting/scaling
- conditions applied or removed
- advantage/disadvantage
- AC or defense modifiers
- movement and forced movement
- teleportation
- persistent effects
- repeated saves
- start/end-of-turn triggers
- reactions and trigger conditions
- concentration
- duration timers
- summons or spawned entities/effects
- resource/slot consumption
- resistance/immunity interaction where explicit handling is required
- special hooks for mechanics that cannot be represented generically

A collapsible VTT Mechanics section exposes only the fields that cannot be reliably generated from the normal spell-card data, plus any generated values that are useful for verification.

Generated mechanics should update immediately when the user changes linked spell-card fields.

## Canonical Spell JSON

The exported/saved file is the finished 5th Edge spell record, not an override patch.

The canonical record contains:

1. useful source/provenance metadata
2. the final player-facing 5th Edge spell data
3. base-class availability
4. normalized VTT mechanics

The final JSON should not require consumers to merge the record with the original 5e.tools spell at runtime.

One spell is stored per file under a stable slug, for example:

```
data/spells/fireball.json
data/spells/phantom-steed.json
data/spells/silvery-barbs.json
```

A generated index or combined bundle may be added later for consumers, but individual spell files are the canonical authored records.

## Finish / Save Workflow

For an unfinished spell:

1. Open the spell from Needs Done or SRD Safe.
2. Review or edit the card.
3. Review any advanced VTT mechanics that cannot be generated automatically.
4. Press Finish / Save to GitHub.
5. Validate the record.
6. Generate the full canonical JSON.
7. Save the spell file into the 5th Edge GitHub spell folder.
8. Only after GitHub confirms the write, remove the spell from its unfinished sidebar section.
9. The spell now appears in Done.
10. Optionally open the next unfinished spell automatically.

If the user makes no changes, finishing the spell still creates the complete canonical JSON file. Accepting the original spell unchanged is a valid completed state.

## Editing Finished Spells

Done is loaded from the actual 5th Edge GitHub spell directory.

Opening a Done spell loads the canonical GitHub JSON, not the old 5e.tools baseline.

The user can edit a Done spell and save again. The existing spell file is updated in place.

## GitHub Integration

This tool is private and temporary, used locally by the user.

The editor may connect directly to the GitHub API using a token entered by the user at runtime.

Requirements:

- never hardcode a GitHub token into the HTML/CSS/JavaScript
- never commit the token to the repository
- token entry is local to the user's browser session unless the user explicitly chooses local persistence
- use the 5th Edge repository as the destination
- create or update the canonical spell path based on the stable spell slug
- read the current GitHub version before updating an existing Done spell so updates use the correct blob SHA
- report GitHub write failures and do not mark a spell Done when a write fails

The current target repository is `5thedgettrpg-bit/5th-edge`.

## Local Safety and Recovery

The editor auto-saves in-progress changes locally so an unfinished spell is not lost before it is written to GitHub.

Local draft state is not authoritative completion state.

The editor also provides Export JSON as a backup path for the currently open spell.

Useful actions:

- Save Draft
- Finish / Save to GitHub
- Finish & Next
- Export JSON
- Reset Unsaved Changes

## Validation

Before a spell can be finished, validate at minimum:

- valid name and stable slug
- level is 0 through 9
- valid school
- valid casting-time structure
- valid range structure
- valid component structure
- valid duration structure
- base classes use the approved base-class set
- damage dice/formulas parse when present
- save/attack mechanics are internally consistent
- area shape/size is valid when the spell uses an area
- VTT mechanics do not contradict the linked visible fields
- upcasting data is structurally valid when present
- JSON can serialize without loss of required source fields

Validation should identify the exact field that needs correction instead of failing with a generic message.

## Data Ownership Rule

Permanent ownership is:

- Spell JSON owns the spell and its base-class availability.
- Subclass JSON owns subclass spell grants.
- Race JSON owns racial spell grants.
- Background, feat, and other feature JSON own their own spell grants.
- The website and VTT both consume the canonical spell JSON from the 5th Edge repository.

This avoids duplicating subclass/race access across many spell files.

## Non-Goals

This temporary editor does not become the permanent spell CMS.

It does not need:

- multi-user authentication
- user accounts
- server-side persistence beyond GitHub
- collaboration
- deployment as a public application
- permanent hosting
- subclass or race authoring
- website rendering logic
- VTT runtime execution logic

Those consumers are separate work after the canonical spell library is complete.

## Success Criteria

The spell pass is complete when every spell has a canonical JSON file in the 5th Edge GitHub spell folder and therefore appears in Done.

At that point:

- the temporary editor can be deleted
- the 5th Edge website can read canonical spell data from GitHub
- Arcana VTT can read the same canonical spell data
- neither consumer needs the original 5e.tools record at runtime
- the VTT has structured mechanics sufficient to automate generic spell behavior and explicit hooks for exceptional behavior
