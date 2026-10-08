function clone(v){return JSON.parse(JSON.stringify(v));}
function hook(classId, f){return {support:'required',hook:`class-feature:${classId}:${f.id}`,parameters:{featureName:f.name,manualResolution:true}};}
export function enrichClassDocument(input){
 const d=clone(input), id=d.id;
 for(const f of d.features||[]){
  const a={...(f.automation||{})};
  if(f.id==='extra-attack'){
   delete a.attackActionCount;
   a.attackCount={mode:'replace',action:'attack',count:2,nonStackingKey:'extraAttack'};
  }
  if(f.id==='spellcasting') a.spellcasting={source:'class.spellcasting',ability:d.spellcasting?.ability||f.ability,progression:d.spellcasting?.progression,spellListId:d.spellcasting?.spellListId||f.spellList};
  if(/subclass|conclave|oath|tradition|path|archetype/i.test(f.id||'')) a.subclassChoice={required:true,featureLevels:f.subclassFeatureLevels||d.subclass?.featureLevels||[]};
  if(id==='ranger'){
   if(f.id==='hunters-instinct') Object.assign(a,{resource:{max:f.resource?.max||'proficiencyBonus',recovery:f.resource?.recharge||'longRest',dieByLevel:f.resource?.dieByLevel},abilitySubstitution:{ability:'wisdom',for:['weaponAttack','weaponDamage'],requiresWeaponProficiency:true},rollBonus:{dieFrom:'hunters-instinct.resource',appliesTo:['attackRoll','abilityCheck','savingThrow'],timing:'afterD20BeforeOutcome',maxPerRoll:1}});
   if(f.id==='fighting-style') a.builderChoice={type:'fightingStyle',choose:1,options:Object.keys(f.choices||{}),special:f.special||{}};
   if(f.id==='natures-veil') Object.assign(a,{activation:{type:'bonusAction'},resource:{max:f.resource?.max||'proficiencyBonus',recovery:f.resource?.recharge||'longRest'},conditionGrant:{condition:'invisible',duration:'untilStartOfNextTurn',includeEquipment:true}});
   if(f.id==='explorer') Object.assign(a,{movement:{climb:{equalTo:'walk'},swim:{equalTo:'walk'}},bonusActionJump:{distance:30,unit:'ft',additionalMovement:true}});
   if(f.id==='mastered-instincts') a.modifyFeature={target:'combat-instincts',replacementDie:'d6',resourceSpendOptional:true};
   if(f.id==='vanish') Object.assign(a,{activation:{type:'bonusAction'},conditionGrant:{condition:'invisible',duration:'untilStartOfNextTurn',includeEquipment:true},tracking:{nonmagical:false}});
   if(f.id==='feral-senses') a.sensesCombat={ignoreUnseenAttackDisadvantage:true,detectInvisible:{range:30,unit:'ft',requiresNotHidden:true,disabledBy:['blinded','deafened']}};
   if(f.id==='foe-slayer') a.scaling={abilityIncrease:{wisdom:4},abilityMaximum:{wisdom:24},minimumInstinctRoll:3};
  }
  if(id==='paladin'){
   if(f.id==='lay-on-hands') Object.assign(a,{activation:{type:'bonusAction'},resource:{max:f.resource?.max||'5 * Paladin level',recovery:f.resource?.recharge||'longRest'},healing:{pointsPerHp:1,touch:true,invalidCreatureTypes:['construct','undead']},alternateSpend:[{cost:5,effect:'cureDisease'},{cost:5,effect:'neutralizePoison'}]});
   if(f.id==='sacred-oath') Object.assign(a,{subclassChoice:{required:true,featureLevels:f.subclassFeatureLevels||[]},resourceGrant:{id:'channel-divinity',uses:f.channelDivinity?.uses||1,recovery:f.channelDivinity?.recharge||['shortRest','longRest']},spellPolicy:d.spellcasting?.grantedSpellPolicy});
   if(f.id==='fighting-style') a.builderChoice={type:'fightingStyle',choose:1,source:'paladinFightingStyles',unique:true};
   if(f.id==='divine-smite') a.onHitSpendSpellSlot={attackType:'meleeWeaponAttack',damageType:'radiant',baseDice:'2d8',extraDicePerSlotAbove1:1,maxDice:'5d8',bonusVs:['fiend','undead'],bonusDice:'1d8'};
   if(f.id==='warrior-of-divinity') a.spellGrant={name:'Shield',alwaysPrepared:true,countsAgainstPrepared:false,freeUses:'proficiencyBonus',recovery:'longRest',canUseSpellSlots:true};
   if(f.id==='harness-divine-power') a.resourceConversion={activation:'bonusAction',spend:{resource:'channel-divinity',amount:1},gain:'expendedSpellSlot',maxSlotLevel:'ceil(proficiencyBonus / 2)'};
   if(f.id==='aura-of-protection') a.aura={radiusByLevel:{'6':10,'18':30},unit:'ft',requiresConscious:true,effect:{type:'savingThrowBonus',value:'max(1, Charisma modifier)'},targets:['self','friendlyCreature']};
   if(f.id==='divine-health') a.immunities={disease:true};
   if(f.id==='aura-of-courage') a.aura={radiusByLevel:{'10':10,'18':30},unit:'ft',requiresConscious:true,effect:{type:'conditionImmunity',condition:'frightened'},targets:['self','friendlyCreature']};
   if(f.id==='improved-divine-smite') a.damageBonus={trigger:'meleeWeaponHit',dice:'1d8',damageType:'radiant'};
   if(f.id==='blessed-restoration') a.onHealing={sources:['lay-on-hands','paladinSpell'],grantEffect:'Bless',duration:'untilStartOfNextTurn',concentration:false,nonStackingKey:'bless'};
   if(f.id==='cleansing-touch') a.dispel={activation:'action',target:['self','willingCreatureTouched'],endSpells:1,resource:{max:'max(1, Charisma modifier)',recovery:'longRest'}};
   if(f.id==='divine-mastery') a.modifyResource={target:'channel-divinity',uses:2,preserveRecovery:true};
   if(f.id==='aura-improvements') a.modifyAuras={radius:30,unit:'ft',targets:['aura-of-protection','aura-of-courage','sacred-oath-aura']};
  }
  if(id==='wizard'){
   if(f.id==='hit-points') a.hitPoints={hitDie:'d6',firstLevel:'6 + CON',higherLevel:'1d6 or 4 + CON'};
   if(f.id==='proficiencies') a.proficiencyPackage={source:'class.proficiencies'};
   if(f.id==='equipment') a.builderEquipment={source:'class.startingEquipment'};
   if(f.id==='arcane-tradition') a.subclassChoice={required:true,featureLevels:f.subclassFeatureLevels||d.subclass?.featureLevels||[]};
  }
  if(!Object.keys(a).length) Object.assign(a,hook(id,f));
  f.automation=a;
 }
 return d;
}
