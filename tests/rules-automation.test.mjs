import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  collectFeatures,
  validateAutomationDocument,
  validateRepository,
} from '../scripts/validate-rules-json.mjs';

const hook = (name = 'manual-rule') => ({ support: 'required', hook: name, parameters: {} });

test('collectFeatures finds class and race variant features', () => {
  assert.equal(collectFeatures({ features: [{ id: 'a' }] }).length, 1);
  assert.equal(collectFeatures({ variants: [{ id: 'v', features: [{ id: 'b' }] }] }).length, 1);
});

test('rejects duplicate feature ids in a document scope', () => {
  const errors = validateAutomationDocument({ features: [
    { id: 'same', automation: hook() },
    { id: 'same', automation: hook() },
  ]}, 'class.json');
  assert.ok(errors.some(e => e.includes('duplicate feature id')));
});

test('required hooks need hook and parameters', () => {
  const errors = validateAutomationDocument({ features: [
    { id: 'x', automation: { support: 'required' } },
  ]}, 'race.json');
  assert.ok(errors.some(e => e.includes('required hook')));
});

test('resources that declare recharge semantics include a recovery rule', () => {
  const errors = validateAutomationDocument({
    resources: { pool: { name: 'Pool', uses: 2 } },
    features: [{ id: 'x', automation: hook() }],
  }, 'class.json');
  assert.ok(errors.some(e => e.includes('resource pool')));
});

test('extra attack uses shared attackCount replacement shape', () => {
  const errors = validateAutomationDocument({ features: [{
    id: 'extra-attack',
    automation: { attackActionCount: 2 },
  }]}, 'class.json');
  assert.ok(errors.some(e => e.includes('attackCount')));
});

test('spell list additions are distinct from granted spells', () => {
  const errors = validateAutomationDocument({ features: [{
    id: 'expanded-spells',
    automation: {
      spellGrants: [{ name: 'Shield', freeUses: 1 }],
      spellListAdditions: [{ name: 'Shield', level: 1, levelGateType: 'classLevel' }],
    },
  }]}, 'subclass.json');
  assert.ok(errors.some(e => e.includes('both granted and list-added')));
});

test('subclass spell list additions require class-level gates', () => {
  const errors = validateAutomationDocument({
    classId: 'bard',
    features: [{ id: 'expanded-spells', automation: {
      spellListAdditions: [{ name: 'Shield', unlockLevel: 1 }],
    }}],
  }, 'subclass.json');
  assert.ok(errors.some(e => e.includes('levelGateType')));
});

test('repository validation parses json and returns file-scoped errors', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'rules-'));
  await fs.mkdir(path.join(root, 'data/classes'), { recursive: true });
  await fs.writeFile(path.join(root, 'data/classes/good.json'), JSON.stringify({
    id: 'good',
    features: [{ id: 'feature', automation: hook('good-hook') }],
  }));
  const result = await validateRepository(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.files, 1);
});


import { enrichRaceDocument } from '../scripts/enrich-race-automation.mjs';

test('race enrichment makes common racial mechanics machine-readable', () => {
  const doc = enrichRaceDocument({ id: 'dwarf', variants: [{ id: 'standard', features: [
    { name: 'Darkvision', description: 'You can see in dim light within 60 feet of you as if it were bright light and in darkness as if it were dim light.' },
    { name: 'Poison Immunity', description: 'You are immune to poison damage and the poisoned condition.' },
    { name: 'Dwarven Toughness', description: 'Your hit point maximum increases by 2, and it increases by 2 every time you gain a level.' },
  ] }] });
  const [vision, poison, hp] = doc.variants[0].features;
  assert.equal(vision.automation.senses.darkvision.range, 60);
  assert.deepEqual(poison.automation.immunities.damage, ['poison']);
  assert.deepEqual(poison.automation.immunities.conditions, ['poisoned']);
  assert.equal(hp.automation.hitPoints.perLevel, 2);
});

test('race enrichment normalizes racial spellcasting without turning list additions into grants', () => {
  const doc = enrichRaceDocument({ id: 'human', variants: [{ id: 'trail', features: [{
    name: "Finder's Magic",
    description: 'racial magic',
    racialSpellcasting: {
      abilityChoice: ['Intelligence', 'Wisdom', 'Charisma'],
      grantedSpells: [{ name: 'True Strike', type: 'cantrip', unlockLevel: 1 }],
      spellListAdditions: [{ spellLevel: 1, spells: ['Faerie Fire', 'Longstrider'] }],
      spellListAdditionRequirement: ['Spellcasting', 'Pact Magic']
    }
  }] }] });
  const auto = doc.variants[0].features[0].automation;
  assert.equal(auto.spellGrants[0].name, 'True Strike');
  assert.equal(auto.spellGrants[0].levelGateType, 'characterLevel');
  assert.equal(auto.spellListAdditions[0].name, 'Faerie Fire');
  assert.equal(auto.spellListAdditions[0].grantMode, 'addToClassSpellList');
});

test('race enrichment gives unsupported executable prose an explicit VTT hook', () => {
  const doc = enrichRaceDocument({ id: 'oddity', variants: [{ id: 'base', features: [{ name: 'Strange Gift', description: 'Do a highly unusual thing.' }] }] });
  const auto = doc.variants[0].features[0].automation;
  assert.equal(auto.support, 'required');
  assert.equal(auto.hook, 'race-feature:oddity:base:strange-gift');
});


import { enrichClassDocument } from '../scripts/enrich-class-automation.mjs';

test('class enrichment normalizes Extra Attack to a non-stacking attack-count replacement', () => {
  const doc = enrichClassDocument({ id: 'barbarian', features: [{ id: 'extra-attack', name: 'Extra Attack', automation: { attackActionCount: 2 } }] });
  const auto = doc.features[0].automation;
  assert.deepEqual(auto.attackCount, { mode: 'replace', action: 'attack', count: 2, nonStackingKey: 'extraAttack' });
  assert.equal(auto.attackActionCount, undefined);
});

test('Ranger enrichment encodes Hunters Instinct and Natures Veil', () => {
  const doc = enrichClassDocument({ id: 'ranger', features: [
    { id: 'hunters-instinct', name: "Hunter's Instinct", resource: { max: 'proficiencyBonus', recharge: 'longRest', dieByLevel: { 1: 'd4', 5: 'd6' } } },
    { id: 'natures-veil', name: "Nature's Veil", resource: { max: 'proficiencyBonus', recharge: 'longRest' } },
  ] });
  assert.equal(doc.features[0].automation.abilitySubstitution.ability, 'wisdom');
  assert.equal(doc.features[0].automation.resource.recovery, 'longRest');
  assert.equal(doc.features[1].automation.conditionGrant.condition, 'invisible');
  assert.equal(doc.features[1].automation.activation.type, 'bonusAction');
});

test('Paladin enrichment encodes Lay on Hands and Aura of Protection', () => {
  const doc = enrichClassDocument({ id: 'paladin', features: [
    { id: 'lay-on-hands', name: 'Lay on Hands', resource: { max: '5 * Paladin level', recharge: 'longRest' } },
    { id: 'aura-of-protection', name: 'Aura of Protection' },
  ] });
  assert.equal(doc.features[0].automation.resource.max, '5 * Paladin level');
  assert.equal(doc.features[0].automation.activation.type, 'bonusAction');
  assert.equal(doc.features[1].automation.aura.radiusByLevel['6'], 10);
  assert.equal(doc.features[1].automation.aura.radiusByLevel['18'], 30);
});

test('Wizard foundational spellcasting gets a structured VTT hook instead of prose-only rules', () => {
  const doc = enrichClassDocument({ id: 'wizard', spellcasting: { ability: 'Intelligence' }, features: [{ id: 'spellcasting', name: 'Spellcasting' }] });
  assert.equal(doc.features[0].automation.spellcasting.ability, 'Intelligence');
  assert.equal(doc.features[0].automation.spellcasting.source, 'class.spellcasting');
});


test('College of Valor subclass encodes VTT-executable progression', async () => {
  const j = JSON.parse(await fs.readFile(new URL('../data/subclasses/bard/college-of-valor.json', import.meta.url), 'utf8'));
  assert.equal(j.classId, 'bard');
  assert.deepEqual(j.featureLevels, [1,3,7,11,17]);
  const extra = j.features.find(f => f.id === 'extra-attack');
  assert.equal(extra.automation.attackCount.count, 2);
  const combat = j.features.find(f => f.id === 'combat-inspiration');
  assert.equal(combat.automation.acBonus.value, 5);
  assert.equal(combat.automation.acBonus.duration, 'untilStartOfTargetNextTurn');
  const enchanted = j.features.find(f => f.id === 'enchanted-blade');
  assert.equal(enchanted.automation.weaponSelection.abilitySubstitution.ability, 'charisma');
});

test('Hexblade subclass encodes invocation grant, replacement, and Armor of Hexes', async () => {
  const j = JSON.parse(await fs.readFile(new URL('../data/subclasses/warlock/hexblade.json', import.meta.url), 'utf8'));
  assert.equal(j.classId, 'warlock');
  assert.deepEqual(j.featureLevels, [1,3,7,11,17]);
  const thirsting = j.features.find(f => f.id === 'thirsting-blade');
  assert.equal(thirsting.automation.featureGrant.ignorePrerequisites, true);
  assert.equal(thirsting.automation.alreadyKnownReplacement.type, 'eldritchInvocation');
  const armor = j.features.find(f => f.id === 'armor-of-hexes');
  assert.equal(armor.automation.resolution.die, 'd6');
  assert.equal(armor.automation.resolution.successOn, '4+');
});


test('rejects executable features that are left without automation', () => {
  const errors = validateAutomationDocument({ features: [{ id: 'prose-only', name: 'Prose Only', description: 'Does something.' }] }, 'rules.json');
  assert.ok(errors.some(e => e.includes('missing automation')));
});


test('allows the same feature id in different race variants while rejecting duplicates inside one variant', () => {
  const doc = {
    variants: [
      { id: 'a', features: [{ id: 'darkvision', automation: { senses: { darkvision: { range: 60 } } } }] },
      { id: 'b', features: [{ id: 'darkvision', automation: { senses: { darkvision: { range: 60 } } } }] }
    ]
  };
  const errors = validateAutomationDocument(doc, 'race.json');
  assert.equal(errors.some(e => e.includes('duplicate feature id')), false);
});


test('race conditional advantage never requires runtime prose parsing', () => {
  const doc = enrichRaceDocument({ id: 'test-race', variants: [{ id: 'base', features: [{
    name: 'Sharp Senses',
    description: 'You have advantage on Wisdom (Perception) checks made to notice hidden creatures.'
  }] }] });
  const conditional = doc.variants[0].features[0].automation.conditionalAdvantage;
  assert.equal(conditional.support, 'required');
  assert.equal(conditional.predicateSource, undefined);
  assert.match(conditional.hook, /sharp-senses:advantage$/);
});


test('Ranger core features are executable automation rather than generic manual hooks', () => {
  const doc = enrichClassDocument({
    id: 'ranger',
    hitDie: 10,
    savingThrows: ['Strength','Dexterity'],
    armorProficiencies: ['Light armor','Medium armor','Shields'],
    weaponProficiencies: ['Simple weapons','Martial weapons'],
    skillChoices: { count: 2, from: ['Perception','Survival'] },
    features: [
      { id:'hit-points', name:'Hit Points' },
      { id:'proficiencies', name:'Proficiencies', choices:{skills:{count:2,from:['Perception','Survival']},expertise:{count:1,requirement:'proficient skill'}}, armor:['Light armor','Medium armor','Shields'], weapons:['Simple weapons','Martial weapons'], tools:[], savingThrows:['Strength','Dexterity'] },
      { id:'know-your-enemy', name:'Know Your Enemy', mechanics:{requiresOutsideCombat:true,observationOrInteractionMinutes:1,choose:2,characteristics:['Armor Class'],comparisonResult:['equal','superior','inferior']} },
      { id:'combat-instincts', name:'Combat Instincts', options:{'Guarded Instinct':'x','Sweeping Instinct':'y','Pursuing Instinct':'z'} },
      { id:'deft-explorer', name:'Deft Explorer', parts:[
        {name:'Canny',level:3,description:'x'},{name:'Roving',level:6,description:'y'},{name:'Tireless',level:10,description:'z'}
      ]},
      { id:'favored-enemy', name:'Favored Enemy', choiceLevels:[7,10,14,18], enemyTypes:['Beasts'], mechanics:{damageBonusAgainstFavoredEnemy:'proficiencyBonus'} },
      { id:'heightened-instinct', name:'Heightened Instinct', mechanics:{hunterInstinctRecharge:['shortRest','longRest']} },
      { id:'lands-stride', name:"Land's Stride" }
    ]
  });
  const byId = Object.fromEntries(doc.features.map(f => [f.id, f]));
  assert.equal(byId['hit-points'].automation.hitPoints.hitDie, 'd10');
  assert.equal(byId['proficiencies'].automation.proficiencyPackage.skillChoices.count, 2);
  assert.equal(byId['know-your-enemy'].automation.inspectCreature.choose, 2);
  assert.equal(byId['combat-instincts'].automation.options.guarded.acBonusFrom, 'instinctDieRoll');
  assert.equal(byId['deft-explorer'].automation.parts.roving.movementBonus.value, 5);
  assert.deepEqual(byId['favored-enemy'].automation.builderChoice.choiceLevels, [6,10,14,18]);
  assert.equal(byId['heightened-instinct'].automation.modifyResource.target, 'hunters-instinct');
  assert.equal(byId['lands-stride'].automation.proficiencyGrants.savingThrows[0], 'Wisdom');
  for (const id of ['hit-points','proficiencies','know-your-enemy','combat-instincts','deft-explorer','favored-enemy','heightened-instinct','lands-stride']) {
    assert.notEqual(byId[id].automation.support, 'required');
  }
});

test('Wizard proficiency automation references real top-level proficiency fields', () => {
  const doc = enrichClassDocument({
    id:'wizard',
    armorProficiencies:[],
    weaponProficiencies:['Daggers'],
    toolProficiencies:[],
    savingThrows:['Intelligence','Wisdom'],
    skillChoices:{count:2,from:['Arcana','History']},
    features:[{id:'proficiencies',name:'Proficiencies'}]
  });
  const pkg = doc.features[0].automation.proficiencyPackage;
  assert.deepEqual(pkg.weapons, ['Daggers']);
  assert.deepEqual(pkg.savingThrows, ['Intelligence','Wisdom']);
  assert.equal(pkg.skillChoices.count, 2);
  assert.equal(pkg.source, undefined);
});


test('race proficiency choices are structured choices, not literal skill names', () => {
  const doc = enrichRaceDocument({ id:'test', variants:[{id:'base',features:[
    {name:'Divergent Persona',description:'You gain proficiency in one tool of your choice.'},
    {name:'Skill Versatility',description:'You gain proficiency in two skills of your choice.'}
  ]}]});
  const [tool,skills]=doc.variants[0].features;
  assert.equal(tool.automation.proficiencyChoices.tools.choose,1);
  assert.equal(tool.automation.proficiencyGrants?.skills,undefined);
  assert.equal(skills.automation.proficiencyChoices.skills.choose,2);
  assert.equal(skills.automation.proficiencyGrants?.skills,undefined);
});
