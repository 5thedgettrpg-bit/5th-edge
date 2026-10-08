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
