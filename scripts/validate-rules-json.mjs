import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function collectFeatures(document) {
  const features = [];
  if (Array.isArray(document?.features)) features.push(...document.features);
  for (const variant of document?.variants || []) {
    if (Array.isArray(variant?.features)) features.push(...variant.features);
  }
  return features;
}

function hasRecovery(resource) {
  return resource?.recovery != null || resource?.recharge != null || resource?.reset != null;
}

function namesOf(items = []) {
  return new Set(items.map(x => typeof x === 'string' ? x : x?.name).filter(Boolean));
}

export function validateAutomationDocument(document, filePath = '<memory>') {
  const errors = [];
  const features = collectFeatures(document);
  const seen = new Set();

  for (const feature of features) {
    if (feature?.id) {
      if (seen.has(feature.id)) errors.push(`${filePath}: duplicate feature id ${feature.id}`);
      seen.add(feature.id);
    }

    const automation = feature?.automation;
    if (automation?.support === 'required' && (!automation.hook || automation.parameters == null)) {
      errors.push(`${filePath}: required hook on ${feature.id || feature.name || 'feature'} needs hook and parameters`);
    }

    if (feature?.id === 'extra-attack' && automation) {
      if (!automation.attackCount || automation.attackCount.mode !== 'replace' || automation.attackCount.action !== 'attack') {
        errors.push(`${filePath}: extra-attack must use shared attackCount replacement shape`);
      }
    }

    const grants = namesOf(automation?.spellGrants);
    const additions = namesOf(automation?.spellListAdditions);
    for (const name of grants) {
      if (additions.has(name)) errors.push(`${filePath}: ${name} is both granted and list-added`);
    }

    if (document?.classId && Array.isArray(automation?.spellListAdditions)) {
      for (const spell of automation.spellListAdditions) {
        if (spell?.levelGateType !== 'classLevel') {
          errors.push(`${filePath}: subclass spell ${spell?.name || '<unnamed>'} needs levelGateType classLevel`);
        }
      }
    }
  }

  for (const [key, resource] of Object.entries(document?.resources || {})) {
    const hasUseShape = resource?.uses != null || resource?.max != null || resource?.usesByLevel != null;
    if (hasUseShape && !hasRecovery(resource)) errors.push(`${filePath}: resource ${key} needs a recovery rule`);
  }

  return errors;
}

export async function loadJsonFiles(rootDir) {
  const roots = ['data/races', 'data/classes', 'data/subclasses'];
  const files = [];
  for (const rel of roots) {
    const dir = path.join(rootDir, rel);
    try {
      const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        const parent = entry.parentPath || entry.path || dir;
        files.push(path.join(parent, entry.name));
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return files;
}

export async function validateRepository(rootDir) {
  const files = await loadJsonFiles(rootDir);
  const errors = [];
  for (const file of files) {
    let document;
    try {
      document = JSON.parse(await fs.readFile(file, 'utf8'));
    } catch (error) {
      errors.push(`${path.relative(rootDir, file)}: invalid JSON: ${error.message}`);
      continue;
    }
    errors.push(...validateAutomationDocument(document, path.relative(rootDir, file)));
  }
  return { files: files.length, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rootDir = process.cwd();
  const result = await validateRepository(rootDir);
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${result.files} rules JSON files.`);
  }
}
