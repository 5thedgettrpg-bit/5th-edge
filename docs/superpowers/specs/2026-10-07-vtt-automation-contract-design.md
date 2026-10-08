# 5th Edge VTT Automation Contract

## Purpose

5th Edge JSON is both rules content and executable VTT data.

Every rule entry must preserve readable player-facing prose, but any mechanic the VTT can reasonably execute must also be expressed in structured automation data. The VTT must not need to parse natural-language descriptions to determine how a feature works.

The same mechanic should use the same automation vocabulary whether it comes from a race, class, subclass, feat, spell, or future content type.

## Core Rule

**Prose explains the rule. Automation tells the VTT what to do.**

If the VTT does not yet support a mechanic, the JSON must expose a structured required hook rather than pretending the rule is automated.

## Scope of the first automation pass

Current race data under `data/races/`.

Current class data:
- Barbarian
- Ranger
- Rogue
- Paladin
- Wizard

Current approved subclasses:
- College of Valor Bard
- Hexblade Warlock

Bard and Warlock base-class JSON do not need to be completed before their subclass JSON exists. Subclass automation may declare dependencies on future base-class hooks.

## Shared feature shape

Rules should converge on a common feature structure:

```json
{
  "id": "feature-id",
  "name": "Feature Name",
  "level": 3,
  "type": "active",
  "description": "Player-facing rules text.",
  "automation": {}
}
```

Fields such as `levels`, `repeatable`, `resource`, `activation`, `duration`, and builder metadata may be present where needed.

## Shared automation vocabulary

### Proficiency grants

Use structured grants for armor, weapons, tools, skills, saving throws, and languages.

Example intents:
- grant medium armor proficiency
- grant shields
- grant martial weapons
- grant Perception
- choose one tool
- choose one language

The VTT should be able to apply the grant to the character sheet automatically.

### Ability substitution

Use for mechanics that replace one ability with another for a defined calculation.

Examples:
- Charisma instead of Strength or Dexterity for Hex Weapon attack rolls
- Charisma instead of Strength or Dexterity for Hex Weapon damage rolls
- Strength instead of Charisma for Barbarian Intimidation
- Wisdom for Ranger weapon attacks if a feature grants it

Automation must identify:
- original ability set or calculation
- replacement ability
- scope
- restrictions
- duration if temporary

### Advantage and disadvantage

Automation must identify:
- roll type
- ability, skill, save, attack, or target scope
- conditions
- duration
- disabling conditions where applicable

### Bonus and penalty modifiers

Use structured numeric or dice modifiers for:
- AC
- attack rolls
- damage
- saves
- skills
- speed
- initiative
- spell DCs
- other supported calculations

The source, duration, stacking behavior, and trigger must be explicit when relevant.

### Resistances, immunities, and vulnerabilities

Represent damage and condition changes directly.

Examples:
- poison damage immunity
- poisoned condition immunity
- fire resistance
- cold resistance

### Senses

Represent darkvision, superior darkvision, magical-darkness vision, blindsense, and similar senses as structured sheet data.

### Movement

Represent:
- base speed changes
- additional movement types
- temporary speed bonuses
- movement restrictions

### Hit point changes

Represent permanent HP-per-level changes, temporary HP, maximum-HP changes, and healing pools directly.

### Resources

A resource must define:
- name
- maximum or scaling formula
- recovery
- current-use handling
- level scaling
- whether it is shared with another feature

Examples:
- Rage
- Bardic Inspiration
- Lay on Hands
- racial PB-per-long-rest uses
- counters such as Relentless Rage DC

### Activations and reactions

Automation should identify:
- action
- bonus action
- reaction
- free/manual activation
- trigger event
- eligible target
- range if relevant

### Duration and expiry

Use structured duration for:
- current turn
- until start/end of next turn
- 1 minute
- until long rest
- permanent
- concentration-linked effects where relevant

### Attack count

Extra Attack and equivalent effects should use one shared attack-count mechanic.

The automation must prevent accidental stacking when multiple sources grant the same attack-count replacement unless a feature explicitly states otherwise.

### Spellcasting grants

Racial, class, and subclass spell grants must identify:
- spell
- unlock level
- casting ability or ability choice
- free uses
- recharge
- whether spell slots can also be used
- whether material components are changed
- whether the spell is always known/prepared

### Spell-list additions

Spell-list additions must be machine-readable and separate from granted spells.

They must identify:
- receiving class or qualifying spellcasting source
- unlock level or spell level
- spells added
- whether the spells are automatically known/prepared or simply added to the list

Subclass expanded spells that unlock at class levels must use class-level gates, not character-level gates.

### Builder choices

Any choice the character builder needs must be structured.

Examples:
- subclass selection
- fighting style
- ability choice for racial spellcasting
- skill proficiency fallback
- invocation replacement
- weapon selection for Hex Weapon
- feat choice
- spell choice

The JSON must provide valid options or a resolvable source for those options.

### Weapon selection and tagging

Features that modify a chosen weapon must declare:
- selection timing
- valid weapon filters
- number of weapons
- duration of selection
- properties granted or replaced
- pact-weapon or similar overrides

The VTT must be able to determine which inventory weapon is affected.

### Feature grants

A feature may grant another feature, invocation, feat, spell, or rules object.

Automation must specify:
- granted object type
- granted object ID/name
- prerequisite bypass if allowed
- replacement behavior if the character already has it

### Conditional effects

Conditional mechanics must identify their predicate in structured form.

Examples:
- while raging
- while unarmored
- against a creature affected by one of your spells
- only when using Strength
- only with a selected weapon
- disabled while blinded, deafened, or incapacitated

### Tables and scaling

If a feature scales by level, the scaling values must be structured rather than embedded only in prose.

Examples:
- Sneak Attack dice
- Rage Damage
- Primal Die
- uses per level
- extra critical dice
- Bardic Inspiration die size

## Unsupported mechanics

When a mechanic cannot yet be executed by the VTT, use an explicit hook such as:

```json
{
  "automation": {
    "support": "required",
    "hook": "named-vtt-hook",
    "parameters": {}
  }
}
```

Do not leave a complex mechanic as prose-only if the VTT will eventually need to enforce or execute it.

A required hook means:
1. the rule is intentionally structured,
2. the VTT does not yet support it,
3. the missing capability can be tracked and implemented later.

## Race automation requirements

Every current race variant should be audited for:
- senses
- movement
- proficiencies
- languages and language choices
- resistances and immunities
- skill bonuses and advantage
- feats granted
- racial spellcasting
- spell-list additions
- PB-based resources
- teleports
- size and creature-type effects
- HP changes
- AC formulas
- special attack or targeting rules
- builder choices

Existing `racialSpellcasting` data should be preserved and normalized into the shared automation model rather than discarded.

## Class automation requirements

### Barbarian

Already close to the target standard. Preserve current automation and normalize naming/shape where needed.

### Rogue

Already close to the target standard. Preserve current automation and normalize naming/shape where needed.

### Wizard

Audit the remaining foundational features and ensure builder-facing and spellcasting-facing mechanics expose structured hooks consistently.

### Ranger

Add automation for every executable feature, including:
- Hunter's Instinct
- Fighting Style
- Know Your Enemy
- Combat Instincts
- Deft Explorer
- Extra Attack
- Nature's Veil
- Favored Enemy progression
- Vanish
- Feral Senses
- Foe Slayer
- spellcasting and cantrip rules

### Paladin

Add automation for every executable feature, including:
- Lay on Hands
- Fighting Style
- Divine Smite
- Warrior of Divinity
- Harness Divine Power
- Extra Attack
- aura effects
- spellcasting
- resource recovery
- subclass hooks

## Subclass automation requirements

### College of Valor Bard

Create `data/subclasses/bard/college-of-valor.json`.

Automation must support:
- medium armor proficiency
- shield proficiency
- martial weapon proficiency
- somatic casting with occupied hands
- Bardic Inspiration weapon-damage use at level 1
- expanded spell list unlocked by Bard level
- Enchanted Blade weapon selection at level 3
- Charisma substitution for attack and damage on the selected weapon
- Extra Attack at level 7
- Combat Inspiration reaction at level 11
- expend Bardic Inspiration die
- +5 AC until the start of the target's next turn, including the triggering attack
- Battle Magic at level 17
- cast a non-damaging Bard spell as the triggering action
- two weapon attacks as a bonus action

### Hexblade Warlock

Create `data/subclasses/warlock/hexblade.json`.

Automation must support:
- medium armor proficiency
- shield proficiency
- martial weapon proficiency
- somatic casting with occupied hands
- expanded spell list unlocked by Warlock level
- Hex Weapon selection at level 3
- proficient, non-two-handed weapon restriction
- Charisma substitution for attack and damage
- selection refresh on long rest
- Pact of the Blade override for pact weapons
- Thirsting Blade grant at level 7
- ignore Thirsting Blade prerequisites for the granted invocation
- if already known, choose another qualifying invocation
- Armor of Hexes reaction at level 11
- trigger only from a creature affected by one of the Warlock's spells
- d6 roll, miss on 4+
- Far Wanderer at level 17
- no breathing requirement
- fire resistance
- cold resistance

## Validation requirements

The automation pass is not complete merely because every feature has an `automation` object.

Validation must check:

1. Every feature with an executable mechanic has structured automation.
2. Prose and automation do not contradict each other.
3. Every builder choice has resolvable options.
4. Every resource has a recovery rule.
5. Every level-gated effect identifies the correct level type, class level or character level.
6. Spell-list additions are distinct from automatically granted spells.
7. Duplicate mechanics such as Extra Attack do not stack unless explicitly intended.
8. Unsupported mechanics have explicit required VTT hooks.
9. IDs are stable and unique within their content type.
10. JSON remains valid after every change.

## Design principles

- Do not change approved mechanics during the automation pass.
- Do not rewrite player-facing prose unless needed to remove ambiguity between prose and automation.
- Prefer shared primitives over one-off feature-specific schemas.
- Avoid duplicating the same rule in multiple incompatible shapes.
- Optimize for builder and VTT execution first, while keeping the JSON readable for humans.
- New content should follow this contract from the start so future automation passes are unnecessary.

## Definition of done

The first automation pass is complete when all current race, class, and approved subclass JSON can be consumed without natural-language parsing for any mechanic the VTT is expected to execute, and every unsupported executable mechanic is represented by an explicit required VTT hook.
