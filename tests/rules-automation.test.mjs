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
