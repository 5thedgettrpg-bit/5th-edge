function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function add(auto, key, value) {
  if (value == null) return;
  auto[key] = value;
}

function normalizeRacialSpellcasting(racialSpellcasting = {}) {
  const spellGrants = (racialSpellcasting.grantedSpells || []).map(spell => ({
    ...spell,
    levelGateType: 'characterLevel',
    grantMode: 'racialSpellGrant',
  }));

  const spellListAdditions = [];
  for (const row of racialSpellcasting.spellListAdditions || []) {
    for (const name of row.spells || []) {
      spellListAdditions.push({
        name,
        spellLevel: row.spellLevel,
        grantMode: 'addToClassSpellList',
        requirements: racialSpellcasting.spellListAdditionRequirement || [],
      });
    }
  }

  return {
    ...(racialSpellcasting.abilityChoice ? { spellcastingAbilityChoice: racialSpellcasting.abilityChoice } : {}),
    ...(spellGrants.length ? { spellGrants } : {}),
    ...(spellListAdditions.length ? { spellListAdditions } : {}),
  };
}

function inferCommonAutomation(feature, raceId, variantId) {
  const description = feature.description || '';
  const auto = {};

  if (feature.racialSpellcasting) Object.assign(auto, normalizeRacialSpellcasting(feature.racialSpellcasting));

  const darkvision = description.match(/(?:darkvision|dim light).*?(\d+)\s*feet/i);
  if (darkvision) {
    add(auto, 'senses', {
      darkvision: {
        range: Number(darkvision[1]),
        unit: 'ft',
        magicalDarkness: /magical and nonmagical|magical darkness/i.test(description),
      },
    });
  }

  const damageResistances = [...description.matchAll(/resistance to ([a-z ,]+?) damage/gi)]
    .flatMap(m => m[1].split(/,| and /).map(x => x.trim().toLowerCase()).filter(Boolean));
  if (damageResistances.length) add(auto, 'resistances', { damage: [...new Set(damageResistances)] });

  const damageImmunities = [...description.matchAll(/immune to ([a-z ,]+?) damage/gi)]
    .flatMap(m => m[1].split(/,| and /).map(x => x.trim().toLowerCase()).filter(Boolean));
  const conditionImmunities = [...description.matchAll(/(?:immune to|and)(?: the)? ([a-z-]+) condition/gi)].map(m => m[1].toLowerCase());
  if (damageImmunities.length || conditionImmunities.length) {
    add(auto, 'immunities', {
      ...(damageImmunities.length ? { damage: [...new Set(damageImmunities)] } : {}),
      ...(conditionImmunities.length ? { conditions: [...new Set(conditionImmunities)] } : {}),
    });
  }

  const skillMatches = [...description.matchAll(/proficiency in (?:the )?([A-Za-z ]+?)(?: skill)?(?:\.|,| and|$)/g)]
    .map(m => m[1].trim()).filter(Boolean);
  if (skillMatches.length) add(auto, 'proficiencyGrants', { skills: [...new Set(skillMatches)] });

  const feat = description.match(/gain the ([A-Za-z' -]+) feat/i);
  if (feat) add(auto, 'featureGrants', [{ type: 'feat', name: feat[1].trim() }]);

  const hp = description.match(/hit point maximum increases by (\d+).*?every time you gain a level/i);
  if (hp) add(auto, 'hitPoints', { initial: Number(hp[1]), perLevel: Number(hp[1]) });

  const teleport = description.match(/teleport up to (\d+) feet/i);
  if (teleport) {
    add(auto, 'teleport', { distance: Number(teleport[1]), unit: 'ft', destination: 'unoccupiedSpaceYouCanSee' });
    if (/bonus action/i.test(description)) add(auto, 'activation', { type: 'bonusAction' });
  }

  if (/number of times equal to your proficiency bonus/i.test(description) && /long rest/i.test(description)) {
    add(auto, 'resource', { max: 'proficiencyBonus', recovery: 'longRest' });
  }

  const speed = description.match(/(?:walking )?speed (?:increases by|is) (\d+) feet/i);
  if (speed) add(auto, 'movement', { walk: { value: Number(speed[1]), unit: 'ft', mode: /increases by/i.test(description) ? 'bonus' : 'set' } });

  if (/climbing speed .* equal to your (?:walking|normal) speed/i.test(description)) {
    auto.movement = { ...(auto.movement || {}), climb: { equalTo: 'walk' } };
  }
  if (/swimming speed .* equal to your (?:walking|normal) speed/i.test(description)) {
    auto.movement = { ...(auto.movement || {}), swim: { equalTo: 'walk' } };
  }
  if (/flying speed .* equal to your (?:walking|normal) speed/i.test(description)) {
    auto.movement = { ...(auto.movement || {}), fly: { equalTo: 'walk' } };
  }

  if (/advantage on/i.test(description)) {
    add(auto, 'conditionalAdvantage', {
      support: 'required',
      hook: `race-feature:${raceId}:${variantId}:${feature.id || slugify(feature.name)}:advantage`,
      parameters: { manualResolution: true },
    });
  }

  if (!Object.keys(auto).length) {
    return {
      support: 'required',
      hook: `race-feature:${raceId}:${variantId}:${feature.id || slugify(feature.name)}`,
      parameters: {
        featureName: feature.name,
        manualResolution: true,
      },
    };
  }

  return auto;
}

export function enrichRaceDocument(input) {
  const document = clone(input);
  const raceId = document.id || slugify(document.name || 'race');
  for (const variant of document.variants || []) {
    const variantId = variant.id || slugify(variant.name || 'base');
    for (const feature of variant.features || []) {
      feature.id ||= slugify(feature.name || 'feature');
      feature.automation = {
        ...(feature.automation || {}),
        ...inferCommonAutomation(feature, raceId, variantId),
      };
    }
  }
  return document;
}
