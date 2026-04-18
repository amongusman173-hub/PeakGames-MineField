// ═══════════════════════════════════════════════════════════════
//  MINEFIELD ROGUELIKE
// ═══════════════════════════════════════════════════════════════
const MAX_HP=3, FADE_MS=280;
const NUM_COLORS=['','n1','n2','n3','n4','n5','n6','n7','n8'];

// ── Persistent meta currency ──────────────────────────────────
let gems = parseInt(localStorage.getItem('mf_gems')||'0');
let bestScore = parseInt(localStorage.getItem('mf_best')||'0');
let gachaInventory = JSON.parse(localStorage.getItem('mf_gacha')||'[]'); // [{id,icon,name}]

function saveGems(){ localStorage.setItem('mf_gems', gems); }
function saveGacha(){ localStorage.setItem('mf_gacha', JSON.stringify(gachaInventory)); }

// ── EXP & Skill Tree ──────────────────────────────────────────
let playerExp  = parseInt(localStorage.getItem('mf_exp')||'0');
let unlockedSkills = JSON.parse(localStorage.getItem('mf_skills')||'[]');
function saveExp(){ localStorage.setItem('mf_exp', playerExp); }
function saveSkills(){ localStorage.setItem('mf_skills', JSON.stringify(unlockedSkills)); }

// Skill tree nodes — id, name, icon, desc, cost(exp), requires(id[]), effect
const SKILL_TREE=[
  // ── ROOT ──
  {id:'s_root',     icon:'⭐', name:'FOUNDATION',    desc:'The beginning of mastery.',                    cost:0,   req:[],                       branch:'root',     x:0,    y:0},
  // ── SURVIVAL (top) ──
  {id:'s_hp1',      icon:'❤️', name:'TOUGH SKIN',    desc:'Start every run with +1 max HP.',              cost:50,  req:['s_root'],               branch:'survival', x:0,    y:-180},
  {id:'s_regen1',   icon:'💉', name:'RECOVERY',      desc:'Restore 1 HP on every perfect floor.',         cost:180, req:['s_hp1'],                branch:'survival', x:-140, y:-300},
  {id:'s_shield1',  icon:'🛡️', name:'IRON WILL',     desc:'Shield perk recharges every 2 floors.',        cost:120, req:['s_hp1'],                branch:'survival', x:140,  y:-300},
  {id:'s_hp2',      icon:'💗', name:'VITALITY',      desc:'Start every run with +2 max HP (total +3).',   cost:250, req:['s_shield1'],            branch:'survival', x:140,  y:-430},
  {id:'s_hp_max',   icon:'💖', name:'FIVE LIVES',    desc:'Max HP cap raised to 5.',                      cost:500, req:['s_hp2'],                branch:'survival', x:0,    y:-530},
  {id:'s_lucky1',   icon:'🍀', name:'BORN LUCKY',    desc:'Lucky Charm perk chance raised to 20%.',       cost:200, req:['s_regen1'],             branch:'survival', x:-280, y:-430},
  // ── INVENTORY (top-left) ──
  {id:'s_inv1',     icon:'🎒', name:'EXTRA POCKET',  desc:'Inventory capacity +2 (max 14).',              cost:80,  req:['s_root'],               branch:'inventory',x:-220, y:-120},
  {id:'s_inv2',     icon:'🗃️', name:'BACKPACK',      desc:'Inventory capacity +4 (max 18).',              cost:200, req:['s_inv1'],               branch:'inventory',x:-360, y:-200},
  {id:'s_slots1',   icon:'🔧', name:'EXTRA SLOT',    desc:'Equip 4 items instead of 3.',                  cost:300, req:['s_inv2'],               branch:'inventory',x:-480, y:-120},
  {id:'s_inv3',     icon:'📦', name:'WAREHOUSE',     desc:'Inventory capacity +6 (max 24).',              cost:450, req:['s_slots1'],             branch:'inventory',x:-480, y:-260},
  {id:'s_inv4',     icon:'🏛️', name:'VAULT',         desc:'Inventory capacity +10 (max 34).',             cost:700, req:['s_inv3'],               branch:'inventory',x:-360, y:-360},
  // ── SHOP (top-right) ──
  {id:'s_shop1',    icon:'🏪', name:'BARGAIN EYE',   desc:'Shop shows 1 extra item per section.',         cost:100, req:['s_root'],               branch:'shop',     x:220,  y:-120},
  {id:'s_shop2',    icon:'🔮', name:'LUCKY STOCK',   desc:'Shop rerolls once for free each visit.',       cost:220, req:['s_shop1'],              branch:'shop',     x:360,  y:-200},
  {id:'s_shop3',    icon:'💡', name:'INSIDER',       desc:'Shop always includes 1 perk you don\'t own.',  cost:380, req:['s_shop2'],              branch:'shop',     x:480,  y:-120},
  {id:'s_shop4',    icon:'💰', name:'BULK BUY',      desc:'Upgrades cost 10% less gold.',                 cost:300, req:['s_shop2'],              branch:'shop',     x:480,  y:-260},
  {id:'s_shop5',    icon:'🎁', name:'BONUS RELIC',   desc:'Shop always offers 1 extra relic.',            cost:500, req:['s_shop4'],              branch:'shop',     x:360,  y:-360},
  // ── GACHA (bottom-right) ──
  {id:'s_gacha1',   icon:'🎰', name:'LUCKY PULL',    desc:'Pity counter reduced to 15 rolls.',            cost:150, req:['s_root'],               branch:'gacha',    x:220,  y:120},
  {id:'s_gacha2',   icon:'✨', name:'RARE LUCK',     desc:'Rare drop rate +10%.',                         cost:280, req:['s_gacha1'],             branch:'gacha',    x:360,  y:200},
  {id:'s_gacha3',   icon:'👑', name:'EPIC LUCK',     desc:'Epic drop rate +5%.',                          cost:450, req:['s_gacha2'],             branch:'gacha',    x:480,  y:120},
  {id:'s_gacha4',   icon:'🌟', name:'MEGA PULL',     desc:'Pity counter reduced to 10 rolls.',            cost:600, req:['s_gacha3'],             branch:'gacha',    x:480,  y:260},
  {id:'s_gacha5',   icon:'💫', name:'GUARANTEED',    desc:'First roll each session is always rare+.',     cost:800, req:['s_gacha4'],             branch:'gacha',    x:360,  y:360},
  // ── SCORE (bottom-left) ──
  {id:'s_score1',   icon:'📊', name:'SCORE SENSE',   desc:'Score bonus per safe reveal +5.',              cost:80,  req:['s_root'],               branch:'score',    x:-220, y:120},
  {id:'s_score2',   icon:'🔥', name:'COMBO MASTER',  desc:'Combo boost upgrade cap +2.',                  cost:180, req:['s_score1'],             branch:'score',    x:-360, y:200},
  {id:'s_score3',   icon:'⚡', name:'CHAIN SCORER',  desc:'Each chain tile gives +15 score.',             cost:300, req:['s_score2'],             branch:'score',    x:-480, y:120},
  {id:'s_score4',   icon:'🏆', name:'PERFECTIONIST', desc:'Perfect floor bonus doubled (+200).',          cost:400, req:['s_score3'],             branch:'score',    x:-480, y:260},
  {id:'s_score5',   icon:'💎', name:'SCORE LEGEND',  desc:'Gem gain per floor +50%.',                     cost:600, req:['s_score4'],             branch:'score',    x:-360, y:360},
  // ── COMBAT (bottom) ──
  {id:'s_combat1',  icon:'⚔️', name:'MINE SENSE',    desc:'Start each run with Mine Sense upgrade x1.',  cost:120, req:['s_root'],               branch:'combat',   x:0,    y:180},
  {id:'s_combat2',  icon:'🧲', name:'GOLD FINDER',   desc:'Gold Magnet perk bonus raised to +8/flag.',   cost:200, req:['s_combat1'],            branch:'combat',   x:-140, y:300},
  {id:'s_combat3',  icon:'💣', name:'BOMB EXPERT',   desc:'Flagging a mine variant earns +15 extra gold.',cost:350, req:['s_combat2'],            branch:'combat',   x:0,    y:400},
  {id:'s_combat4',  icon:'🎯', name:'PRECISION',     desc:'Wrong flags no longer reduce score.',          cost:280, req:['s_combat1'],            branch:'combat',   x:140,  y:300},
  {id:'s_combat5',  icon:'🛡️', name:'FORTRESS',      desc:'Start each run with Shield perk active.',     cost:500, req:['s_combat3','s_combat4'],branch:'combat',   x:0,    y:530},
];

const BRANCH_COLORS={root:'#f5c842',survival:'#e94560',inventory:'#a78bfa',shop:'#f5a623',gacha:'#4ecca3',score:'#5bc8f5',combat:'#ff7043'};

function getSkillEffect(id){return unlockedSkills.includes(id);}
function skillMaxHp(){
  let bonus=0;
  if(getSkillEffect('s_hp1')) bonus+=1;
  if(getSkillEffect('s_hp2')) bonus+=2;
  return bonus;
}
function skillMaxInventory(){
  let cap=12;
  if(getSkillEffect('s_inv1')) cap+=2;
  if(getSkillEffect('s_inv2')) cap+=4;
  if(getSkillEffect('s_inv3')) cap+=6;
  if(getSkillEffect('s_inv4')) cap+=10;
  return cap;
}
function skillEquipSlots(){return getSkillEffect('s_slots1')?4:3;}
function skillShopExtra(){return getSkillEffect('s_shop1')?1:0;}
function skillPity(){
  if(getSkillEffect('s_gacha4')) return 10;
  if(getSkillEffect('s_gacha1')) return 15;
  return 20;
}

// ── Bomb variants ─────────────────────────────────────────────
const BOMB_VARIANTS=[
  {id:'freeze', emoji:'🧊',label:'FREEZE', hue:200,desc:'Hitting freezes next flag earn'},
  {id:'scatter',emoji:'💥',label:'SCATTER',hue:35, desc:'Hitting reveals 3 random safe tiles'},
  {id:'ghost',  emoji:'👻',label:'GHOST',  hue:280,desc:'Invisible until a neighbor is revealed'},
  {id:'gold',   emoji:'💰',label:'GOLD',   hue:50, desc:'Flagging earns +30 gold'},
  {id:'chain',  emoji:'🔗',label:'CHAIN',  hue:15, desc:'Hitting also triggers an adjacent mine'},
  {id:'bounty', emoji:'👑',label:'BOUNTY', hue:45, desc:'Flag it for +50 gold, hit it for -2 HP'},
];

// ── Floor modifiers ───────────────────────────────────────────
const FLOOR_MODIFIERS=[
  {id:'normal',    icon:'',    name:'',                color:'',         desc:'',                                                                      weight:30},
  {id:'cursed',    icon:'💀',  name:'CURSED FLOOR',    color:'#e94560',  desc:'Mine hits deal 2 HP instead of 1.',                                     weight:8},
  {id:'foggy',     icon:'🌫️', name:'FOG OF WAR',      color:'#78909c',  desc:'Numbers show but may be off by ±1. Stay sharp.',                        weight:6},
  {id:'rush',      icon:'⏱️', name:'TIME PRESSURE',   color:'#f5a623',  desc:'You have 90 seconds. Run out = lose 1 HP.',                             weight:7},
  {id:'dense',     icon:'💣',  name:'MINEFIELD',       color:'#e94560',  desc:'+30% more mines this floor.',                                           weight:7},
  {id:'goldmine',  icon:'💰',  name:'GOLD RUSH',       color:'#f5c842',  desc:'All correct flags earn double gold.',                                   weight:7},
  {id:'elite',     icon:'⚡',  name:'ELITE FLOOR',     color:'#b07aff',  desc:'Mines are invisible until you are 1 tile away.',                        weight:5},
  {id:'peaceful',  icon:'🕊️', name:'SAFE HAVEN',      color:'#4ecca3',  desc:'First mine hit this floor is free.',                                    weight:6},
  {id:'mirror',    icon:'🔀',  name:'MIRROR FIELD',    color:'#7ecfff',  desc:'The grid is flipped horizontally.',                                     weight:4},
  {id:'shrink',    icon:'🔬',  name:'SHRINK RAY',      color:'#b07aff',  desc:'Grid is smaller but mine density is higher.',                           weight:5},
  {id:'jackpot',   icon:'🎰',  name:'JACKPOT',         color:'#f5c842',  desc:'Every mine is a Gold or Bounty variant.',                               weight:4},
  {id:'darkness',  icon:'🌑',  name:'LIGHTS OUT',      color:'#aab4c8',  desc:'The board is pitch black. Move your mouse to light up nearby tiles.',   weight:5},
  {id:'healing',   icon:'💚',  name:'HEALING FIELD',   color:'#4ecca3',  desc:'Reveal 10 safe tiles to restore 1 HP.',                                 weight:5},
  {id:'frozen',    icon:'🧊',  name:'FROZEN FIELD',    color:'#7ecfff',  desc:'Flagging is disabled. Mines must be avoided entirely.',                 weight:4},
  {id:'bonus',     icon:'⭐',  name:'BONUS FLOOR',     color:'#f5c842',  desc:'No mines! Reveal all tiles for a big score bonus.',                     weight:3},
  {id:'volatile',  icon:'💥',  name:'VOLATILE FIELD',  color:'#ff7043',  desc:'Every mine hit triggers a chain — adjacent mines also explode.',        weight:4},
  {id:'rich',      icon:'💎',  name:'RICH VEIN',       color:'#4ecca3',  desc:'Every safe tile revealed earns +3 gold.',                               weight:4},
];

// ── Boss floor modifiers (every 3rd floor) ────────────────────
const BOSS_MODIFIERS=[
  {id:'boss_titan',   icon:'💥', name:'TITAN FIELD',    color:'#ff4466', desc:'50% more mines. Mine hits deal 2 HP. Clear for +300 score bonus.',  isBoss:true},
  {id:'boss_phantom', icon:'👁️',name:'PHANTOM FIELD',  color:'#b07aff', desc:'All mines are Ghost type. No numbers shown.',                       isBoss:true},
  {id:'boss_vault',   icon:'🏆', name:'BOUNTY VAULT',    color:'#f5c842', desc:'All mines are Bounty type. Flag them all for massive gold.',         isBoss:true},
  {id:'boss_chain',   icon:'🔗', name:'CHAIN REACTION', color:'#ff7043', desc:'All mines are Chain type. One wrong move cascades.',                 isBoss:true},
  {id:'boss_clock',   icon:'⏰', name:'SPEED TRIAL',    color:'#f5a623', desc:'60 second timer. Every correct flag adds +5 seconds.',               isBoss:true},
];

// ── Perks ─────────────────────────────────────────────────────
const PERKS=[
  {id:'shield',      icon:'🛡️', name:'SHIELD',        desc:'Next mine hit per floor deals no damage.',         cost:90},
  {id:'lucky',       icon:'🍀',  name:'LUCKY CHARM',   desc:'10% chance any mine hit is ignored.',              cost:120},
  {id:'detector',    icon:'📡',  name:'DETECTOR',      desc:'Unrevealed tiles with 3+ mine neighbors glow faintly.',  cost:120},
  {id:'gold_magnet', icon:'🧲',  name:'GOLD MAGNET',   desc:'+5 gold per correct flag permanently.',            cost:70},
  {id:'double_score',icon:'✨',  name:'SCORE RUSH',    desc:'Safe reveals give +20 score instead of +10.',      cost:100},
  {id:'bomb_sense',  icon:'👁️', name:'BOMB SENSE',    desc:'Ghost bombs are always visible.',                  cost:85},
  {id:'medic',       icon:'💉',  name:'MEDIC',         desc:'Restore 1 HP when clearing a floor perfectly.',   cost:110},
  {id:'cartographer',icon:'🗺️', name:'CARTOGRAPHER',  desc:'Start each floor with 3 random safe tiles revealed.',cost:95},
  {id:'gambler',     icon:'🎲',  name:'GAMBLER',       desc:'50% chance mine hits deal 0 damage, 50% deal 2.', cost:80},
  {id:'scavenger',   icon:'🔎',  name:'SCAVENGER',     desc:'Earn +10 gold for every 10 tiles revealed.',       cost:75},
  {id:'berserker',   icon:'⚔️', name:'BERSERKER',     desc:'Score multiplier = current HP (1-3x).',            cost:130},
  {id:'treasurer',   icon:'🏦',  name:'TREASURER',     desc:'Carry 20% of gold as bonus score at run end.',     cost:100},
];

// ── Cursed Relics ─────────────────────────────────────────────
const RELICS=[
  {id:'blood_pact',  icon:'🩸', name:'BLOOD PACT',    desc:'+100 gold per floor.',            curse:'Max HP reduced to 2.',              cost:30,  effect:{goldPerFloor:100},  downside:{maxHp:2}},
  {id:'cursed_eye',  icon:'👁',  name:'CURSED EYE',    desc:'Mines within 3 tiles of revealed cells glow faintly.',  curse:'Mine hits deal 2 HP. Extremely rare.',  cost:180, effect:{seeAll:true}, downside:{doubleDmg:true}, rare:true},
  {id:'glass_cannon',icon:'💎', name:'GLASS CANNON',  desc:'Score x3 multiplier.',            curse:'Die on any mine hit.',              cost:15,  effect:{scoreMult:3},       downside:{oneHit:true}},
  {id:'debt',        icon:'💳', name:'DEBT CONTRACT', desc:'Start with +200 gold.',           curse:'-20 gold per floor.',               cost:0,   effect:{startGold:200},     downside:{goldDrain:20}},
  {id:'mirror',      icon:'🪞', name:'MIRROR CURSE',  desc:'Wrong flags give +5 gold.',       curse:'Correct flags give no gold.',       cost:10,  effect:{wrongFlagGold:5},   downside:{noCorrectGold:true}},
  {id:'timepiece',   icon:'⏰', name:'CURSED CLOCK',  desc:'Timer floors give +2 min.',       curse:'Non-timer floors have 3 min.',      cost:35,  effect:{timerBonus:120},    downside:{alwaysTimer:true}},
  {id:'vampirism',   icon:'🧛', name:'VAMPIRISM',     desc:'+1 HP on every perfect floor.',   curse:'Start each run with only 1 HP.',    cost:20,  effect:{vampRegen:true},    downside:{startHp1:true}},
  {id:'warlords_map',icon:'🗺️', name:'WARLORD\'S MAP',desc:'See exact mine count per row/col.',curse:'No flood-reveal — every tile manual.',cost:25,effect:{showRowCol:true},  downside:{noFlood:true}},
  {id:'cursed_dice', icon:'🎲', name:'CURSED DICE',   desc:'Score x2 on perfect floors.',     curse:'Score x0.5 on imperfect floors.',   cost:30,  effect:{diceScore:true},    downside:{diceScoreBad:true}},
  {id:'iron_crown',  icon:'👑', name:'IRON CROWN',    desc:'+50 score per correct flag.',      curse:'Wrong flags deal 1 HP.',            cost:40,  effect:{crownFlag:true},    downside:{wrongFlagDmg:true}},
];

// ── Shop consumables & upgrades ───────────────────────────────
const CONSUMABLES=[
  {id:'reveal_5',  icon:'🔍', name:'SCOUT x5',    desc:'Reveal 5 random safe tiles next floor.',       cost:55, deferred:true},
  {id:'defuse_3',  icon:'✂️', name:'DEFUSE KIT',  desc:'Auto-flag 3 random mines next floor.',         cost:60, deferred:true},
  {id:'nuke',      icon:'☢️', name:'NUKE',        desc:'Reveal ALL safe tiles next floor.',            cost:200,deferred:true},
  {id:'extra_life',icon:'❤️', name:'EXTRA LIFE',  desc:'Restore 1 life (max 3).',                      cost:80},
  {id:'gold_rush', icon:'💸', name:'GOLD RUSH',   desc:'Earn 60 gold instantly. One use per shop.',    cost:30, oneUse:true},
  {id:'time_warp', icon:'⏳', name:'TIME WARP',   desc:'Restore 1 HP.',                                cost:110},
  {id:'reveal_row',icon:'📏', name:'ROW SCAN',    desc:'Reveal a random safe row next floor.',         cost:70, deferred:true},
  {id:'swap',      icon:'🔄', name:'MINE SWAP',   desc:'Move 2 random mines next floor.',              cost:90, deferred:true},
];
const UPGRADES=[
  // cost = base price; each additional stack costs +20% more (applied in shop render)
  {id:'flag_bonus',   icon:'🚩',name:'FLAG BONUS',    desc:'+4 gold per correct flag. Stacks.',              cost:50,  maxStack:4},
  {id:'score_boost',  icon:'📊',name:'SCORE BOOST',   desc:'+4 score per safe reveal. Stacks.',              cost:55,  maxStack:4},
  {id:'mine_sense',   icon:'🔔',name:'MINE SENSE',    desc:'-1 mine next floor. Stacks.',                    cost:70,  maxStack:3},
  {id:'gold_interest',icon:'💹',name:'INTEREST',      desc:'Earn 4% of gold at floor start. Stacks.',        cost:65,  maxStack:3},
  {id:'hp_regen',     icon:'💗',name:'HP REGEN',      desc:'+1 HP restored on floor clear. Stacks.',         cost:100, maxStack:2},
  {id:'combo_boost',  icon:'🔥',name:'COMBO BOOST',   desc:'+6 score per tile in a flood chain. Stacks.',    cost:60,  maxStack:3},
  {id:'gold_finder',  icon:'🧲',name:'GOLD FINDER',   desc:'+15 gold per floor cleared. Stacks.',            cost:45,  maxStack:5},
  {id:'armor',        icon:'🛡',name:'ARMOR',         desc:'Reduce all mine damage by 1 (min 1). Stacks.',   cost:110, maxStack:2},
  {id:'scout',        icon:'🔭',name:'SCOUT',         desc:'Start each floor with 1 extra safe tile revealed. Stacks.',cost:65,maxStack:3},
];

// ── Gacha pool ────────────────────────────────────────────────
// Evolved items — unlocked by merging 5 of the same base item
const EVOLVED_ITEMS={
  'g_gold50':    {id:'g_gold50_evo',    icon:'💰✨', name:'GOLD HOARD EX',      desc:'Start run with +300 gold.',                rarity:'evolved', effect:{gold:300},                  evolvedFrom:'g_gold50',    evolveDesc:'5× Gold Stash merged → massive starting gold'},
  'g_scout':     {id:'g_scout_evo',     icon:'🔍✨', name:'MASTER SCOUT',       desc:'Start run with 15 tiles revealed.',         rarity:'evolved', effect:{revealStart:15},             evolvedFrom:'g_scout',     evolveDesc:'5× Head Start merged → reveal 15 tiles at run start'},
  'g_defuse':    {id:'g_defuse_evo',    icon:'✂️✨', name:'BOMB DISPOSAL',      desc:'Start run with 8 mines auto-flagged.',      rarity:'evolved', effect:{defuseStart:8},              evolvedFrom:'g_defuse',    evolveDesc:'5× Defuse Start merged → 8 mines flagged at run start'},
  'g_interest':  {id:'g_interest_evo',  icon:'💹✨', name:'COMPOUND INTEREST',  desc:'Start run with 3× Interest upgrade.',       rarity:'evolved', effect:{upgrade:'gold_interest',upgradeStacks:3}, evolvedFrom:'g_interest',  evolveDesc:'5× Interest merged → start with 3 stacks of Interest'},
  'g_flag_bonus':{id:'g_flag_bonus_evo',icon:'🚩✨', name:'FLAG MASTER',        desc:'Start run with 3× Flag Bonus upgrade.',     rarity:'evolved', effect:{upgrade:'flag_bonus',upgradeStacks:3},    evolvedFrom:'g_flag_bonus',evolveDesc:'5× Flag Bonus merged → start with 3 stacks of Flag Bonus'},
  'g_combo':     {id:'g_combo_evo',     icon:'🔥✨', name:'COMBO LEGEND',       desc:'Start run with 3× Combo Boost upgrade.',    rarity:'evolved', effect:{upgrade:'combo_boost',upgradeStacks:3},   evolvedFrom:'g_combo',     evolveDesc:'5× Combo Boost merged → start with 3 stacks of Combo Boost'},
  'g_score_up':  {id:'g_score_up_evo',  icon:'📊✨', name:'SCORE LEGEND',       desc:'Start run with 3× Score Boost upgrade.',    rarity:'evolved', effect:{upgrade:'score_boost',upgradeStacks:3},   evolvedFrom:'g_score_up',  evolveDesc:'5× Score Boost merged → start with 3 stacks of Score Boost'},
  'g_shield':    {id:'g_shield_evo',    icon:'🛡️✨',name:'FORTRESS START',     desc:'Start run with Shield + 2 free HP.',        rarity:'evolved', effect:{perk:'shield',gold:0,bonusHp:2},          evolvedFrom:'g_shield',    evolveDesc:'5× Shield Start merged → Shield perk + 2 bonus max HP'},
  'g_gold100':   {id:'g_gold100_evo',   icon:'💎✨', name:'GOLD EMPIRE',        desc:'Start run with +400 gold.',                 rarity:'evolved', effect:{gold:400},                  evolvedFrom:'g_gold100',   evolveDesc:'5× Gem Cache merged → 400 starting gold'},
  'g_lucky':     {id:'g_lucky_evo',     icon:'🍀✨', name:'BORN LUCKY EX',      desc:'Start run with Lucky Charm (30% chance).', rarity:'evolved', effect:{perk:'lucky',luckyBoost:true},            evolvedFrom:'g_lucky',     evolveDesc:'5× Lucky Start merged → Lucky Charm with 30% dodge chance'},
  'g_score':     {id:'g_score_evo',     icon:'✨✨', name:'SCORE RUSH EX',      desc:'Start run with Score Rush + Combo Boost.',  rarity:'evolved', effect:{perk:'double_score',upgrade:'combo_boost'},evolvedFrom:'g_score',     evolveDesc:'5× Score Rush merged → Score Rush perk + free Combo Boost'},
  'g_medic':     {id:'g_medic_evo',     icon:'💉✨', name:'FIELD MEDIC',        desc:'Start run with Medic + HP Regen upgrade.',  rarity:'evolved', effect:{perk:'medic',upgrade:'hp_regen'},         evolvedFrom:'g_medic',     evolveDesc:'5× Medic Start merged → Medic perk + HP Regen upgrade'},
  'g_gold150':   {id:'g_gold150_evo',   icon:'🏅✨', name:'TREASURE TROVE',     desc:'Start run with +500 gold.',                 rarity:'evolved', effect:{gold:500},                  evolvedFrom:'g_gold150',   evolveDesc:'5× Gold Hoard merged → 500 starting gold'},
  'g_scout10':   {id:'g_scout10_evo',   icon:'🗺️✨', name:'OMNISCIENT',         desc:'Start run with 25 tiles revealed.',         rarity:'evolved', effect:{revealStart:25},             evolvedFrom:'g_scout10',   evolveDesc:'5× Big Head Start merged → 25 tiles revealed at run start'},
  'g_hp':        {id:'g_hp_evo',        icon:'❤️✨', name:'IMMORTAL HEART',     desc:'Start run with 5 max HP.',                  rarity:'evolved', effect:{maxHp:5},                   evolvedFrom:'g_hp',        evolveDesc:'5× Extra Heart merged → start with 5 max HP'},
  'g_berserker': {id:'g_berserker_evo', icon:'⚔️✨', name:'WAR GOD',            desc:'Start run with Berserker + Gambler.',       rarity:'evolved', effect:{perk:'berserker',perk2:'gambler'},        evolvedFrom:'g_berserker', evolveDesc:'5× Berserker Start merged → Berserker + Gambler perks'},
  'g_treasurer': {id:'g_treasurer_evo', icon:'🏦✨', name:'GOLD BARON',         desc:'Start run with Treasurer + 30% conversion.',rarity:'evolved', effect:{perk:'treasurer',treasurerBoost:true},    evolvedFrom:'g_treasurer', evolveDesc:'5× Treasurer Start merged → 30% gold→score conversion'},
  'g_gold200':   {id:'g_gold200_evo',   icon:'👑✨', name:'GOLD KING',          desc:'Start run with +600 gold.',                 rarity:'evolved', effect:{gold:600},                  evolvedFrom:'g_gold200',   evolveDesc:'5× Gold Jackpot merged → 600 starting gold'},
  'g_cartographer':{id:'g_cartographer_evo',icon:'🗺️✨',name:'MASTER CARTOGRAPHER',desc:'Start run with 8 safe tiles revealed + Detector.',rarity:'evolved',effect:{perk:'cartographer',revealStart:8},evolvedFrom:'g_cartographer',evolveDesc:'5× Cartographer merged → 8 pre-revealed tiles + Detector perk'},
  'g_detector':  {id:'g_detector_evo',  icon:'📡✨', name:'OMNISCIENT RADAR',   desc:'Start run with Detector + Bomb Sense.',     rarity:'evolved', effect:{perk:'detector',perk2:'bomb_sense'},      evolvedFrom:'g_detector',  evolveDesc:'5× Detector Start merged → Detector + Bomb Sense perks'},
};
const MERGE_THRESHOLD=5;

const GACHA_POOL=[
  // Common
  {id:'g_gold50',    icon:'💰', name:'GOLD STASH',      desc:'Start run with +50 gold.',              rarity:'common', effect:{gold:50}},
  {id:'g_scout',     icon:'🔍', name:'HEAD START',      desc:'Start run with 5 tiles revealed.',      rarity:'common', effect:{revealStart:5}},
  {id:'g_defuse',    icon:'✂️', name:'DEFUSE START',    desc:'Start run with 2 mines flagged.',       rarity:'common', effect:{defuseStart:2}},
  {id:'g_interest',  icon:'💹', name:'INTEREST x1',     desc:'Start run with Interest upgrade.',      rarity:'common', effect:{upgrade:'gold_interest'}},
  {id:'g_flag_bonus',icon:'🚩', name:'FLAG BONUS x1',   desc:'Start run with Flag Bonus upgrade.',    rarity:'common', effect:{upgrade:'flag_bonus'}},
  {id:'g_combo',     icon:'🔥', name:'COMBO BOOST x1',  desc:'Start run with Combo Boost upgrade.',   rarity:'common', effect:{upgrade:'combo_boost'}},
  {id:'g_score_up',  icon:'📊', name:'SCORE BOOST x1',  desc:'Start run with Score Boost upgrade.',   rarity:'common', effect:{upgrade:'score_boost'}},
  // Rare
  {id:'g_shield',    icon:'🛡️', name:'SHIELD START',   desc:'Start run with Shield perk.',           rarity:'rare',   effect:{perk:'shield'}},
  {id:'g_gold100',   icon:'💎', name:'GEM CACHE',       desc:'Start run with +100 gold.',             rarity:'rare',   effect:{gold:100}},
  {id:'g_lucky',     icon:'🍀', name:'LUCKY START',     desc:'Start run with Lucky Charm perk.',      rarity:'rare',   effect:{perk:'lucky'}},
  {id:'g_score',     icon:'✨', name:'SCORE RUSH',      desc:'Start run with Score Rush perk.',       rarity:'rare',   effect:{perk:'double_score'}},
  {id:'g_medic',     icon:'💉', name:'MEDIC START',     desc:'Start run with Medic perk.',            rarity:'rare',   effect:{perk:'medic'}},
  {id:'g_detector',  icon:'📡', name:'DETECTOR START',  desc:'Start run with Detector perk.',         rarity:'epic',   effect:{perk:'detector'}},
  {id:'g_gold150',   icon:'🏅', name:'GOLD HOARD',      desc:'Start run with +150 gold.',             rarity:'rare',   effect:{gold:150}},
  {id:'g_scout10',   icon:'🗺️', name:'BIG HEAD START',  desc:'Start run with 10 tiles revealed.',    rarity:'rare',   effect:{revealStart:10}},
  // Epic
  {id:'g_hp',        icon:'❤️', name:'EXTRA HEART',     desc:'Start run with 4 max HP.',              rarity:'epic',   effect:{maxHp:4}},
  {id:'g_berserker', icon:'⚔️', name:'BERSERKER START', desc:'Start run with Berserker perk.',        rarity:'epic',   effect:{perk:'berserker'}},
  {id:'g_treasurer', icon:'🏦', name:'TREASURER START', desc:'Start run with Treasurer perk.',        rarity:'epic',   effect:{perk:'treasurer'}},
  {id:'g_gold200',   icon:'👑', name:'GOLD JACKPOT',    desc:'Start run with +200 gold.',             rarity:'epic',   effect:{gold:200}},
  {id:'g_cartographer',icon:'🗺️',name:'CARTOGRAPHER',  desc:'Start run with Cartographer perk.',     rarity:'epic',   effect:{perk:'cartographer'}},
];
const RARITY_WEIGHTS={common:55,rare:30,epic:15};
const RARITY_COLORS={common:'#4ecca3',rare:'#b07aff',epic:'#f5c842',evolved:'#ff9f43'};

// Pity system: guarantee epic after 20 rolls
let gachaPityCount=parseInt(localStorage.getItem('mf_pity')||'0');
function savePity(){localStorage.setItem('mf_pity',gachaPityCount);}

// ── State ─────────────────────────────────────────────────────
let state={};

// ═══════════════════════════════════════════════════════════════
//  CANVAS VFX
// ═══════════════════════════════════════════════════════════════
const bgCanvas=document.getElementById('bg-canvas');
const bgCtx=bgCanvas.getContext('2d');
let bgDots=[],fxParticles=[],shockwaves=[];

function initBg(){
  bgCanvas.width=window.innerWidth; bgCanvas.height=window.innerHeight;
  bgDots=Array.from({length:80},()=>makeDot(false));
}
function makeDot(fromBottom){
  return{x:Math.random()*bgCanvas.width,y:fromBottom?bgCanvas.height+5:Math.random()*bgCanvas.height,
    r:Math.random()*1.6+.3,vx:(Math.random()-.5)*.35,vy:-(Math.random()*.45+.1),
    a:Math.random()*.55+.1,hue:Math.random()<.5?160:350};
}
function tickBg(){
  bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
  const onMenu=!document.getElementById('menu-screen').classList.contains('hidden');
  if(onMenu){
    bgCtx.strokeStyle='rgba(78,204,163,0.035)';bgCtx.lineWidth=1;
    for(let x=0;x<bgCanvas.width;x+=44){bgCtx.beginPath();bgCtx.moveTo(x,0);bgCtx.lineTo(x,bgCanvas.height);bgCtx.stroke();}
    for(let y=0;y<bgCanvas.height;y+=44){bgCtx.beginPath();bgCtx.moveTo(0,y);bgCtx.lineTo(bgCanvas.width,y);bgCtx.stroke();}
  }
  for(let i=0;i<bgDots.length;i++){
    const d=bgDots[i];d.x+=d.vx;d.y+=d.vy;
    if(d.y<-5)bgDots[i]=makeDot(true);
    bgCtx.beginPath();bgCtx.arc(d.x,d.y,d.r,0,Math.PI*2);
    bgCtx.fillStyle=`hsla(${d.hue},80%,65%,${d.a})`;bgCtx.fill();
  }
  fxParticles=fxParticles.filter(p=>p.life>0);
  for(const p of fxParticles){
    p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=p.decay;
    bgCtx.beginPath();bgCtx.arc(p.x,p.y,Math.max(.1,p.r*p.life),0,Math.PI*2);
    bgCtx.fillStyle=`hsla(${p.hue},90%,60%,${p.life})`;
    bgCtx.shadowBlur=8;bgCtx.shadowColor=`hsla(${p.hue},90%,60%,.8)`;
    bgCtx.fill();bgCtx.shadowBlur=0;
  }
  shockwaves=shockwaves.filter(s=>s.life>0);
  for(const s of shockwaves){
    s.r+=s.speed;s.life-=.04;
    bgCtx.beginPath();bgCtx.arc(s.x,s.y,s.r,0,Math.PI*2);
    bgCtx.strokeStyle=`hsla(${s.hue},90%,65%,${s.life})`;
    bgCtx.lineWidth=2*s.life;bgCtx.shadowBlur=12;bgCtx.shadowColor=`hsla(${s.hue},90%,65%,.6)`;
    bgCtx.stroke();bgCtx.shadowBlur=0;
  }
  requestAnimationFrame(tickBg);
}
function canvasExplode(x,y,hue,count){
  const vfxMult=settings.vfx==='low'?0.3:settings.vfx==='medium'?0.6:1;
  const n=Math.round(count*vfxMult);
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=2+Math.random()*6;
    fxParticles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,r:2+Math.random()*5,
      hue:hue+(Math.random()-.5)*30,life:1,decay:.02+Math.random()*.025});
  }
  for(let i=0;i<3;i++) shockwaves.push({x,y,r:4+i*8,speed:4+i*2,hue,life:1});
}
function screenShake(intensity=8,duration=350){
  if(settings.shake==='off')return;
  const gs=document.getElementById('game-screen');
  const start=performance.now();
  function shake(now){
    const t=(now-start)/duration;
    if(t>=1){gs.style.transform='';return;}
    const d=1-t;
    gs.style.transform=`translate(${(Math.random()-.5)*intensity*d}px,${(Math.random()-.5)*intensity*d}px)`;
    requestAnimationFrame(shake);
  }
  requestAnimationFrame(shake);
}
function rippleReveal(cells,cols,startIdx){
  const{rows}=state.grid;
  const dist={};const q=[startIdx];dist[startIdx]=0;
  while(q.length){
    const cur=q.shift();
    for(const n of getNeighbors(cur,cols,rows)){
      if(dist[n]===undefined&&cells[n].revealed){dist[n]=dist[cur]+1;q.push(n);}
    }
  }
  Object.entries(dist).forEach(([idx,d])=>{
    const el=getCellEl(+idx);if(!el)return;
    setTimeout(()=>{
      el.style.transition='transform .15s ease,box-shadow .15s ease';
      el.style.transform='scale(1.12)';el.style.boxShadow='0 0 10px #4ecca366';
      setTimeout(()=>{el.style.transform='';el.style.boxShadow='';},150);
    },d*18);
  });
}
function flagSparkle(x,y){
  for(let i=0;i<12;i++){
    const a=Math.random()*Math.PI*2,s=1+Math.random()*3;
    fxParticles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,r:1.5+Math.random()*2,
      hue:45+(Math.random()-.5)*20,life:1,decay:.04+Math.random()*.04});
  }
  shockwaves.push({x,y,r:2,speed:3,hue:45,life:.7});
}
window.addEventListener('resize',initBg);initBg();tickBg();

// ── Mouse tracking for Lights Out modifier ────────────────────
let mouseX=0,mouseY=0;
document.addEventListener('mousemove',e=>{
  mouseX=e.clientX;mouseY=e.clientY;
  const isDark=(state.modifier&&state.modifier.id==='darkness')||state.lightsAlways;
  if(state.grid&&isDark&&!state.dead&&!state.won) render();
});

// ═══════════════════════════════════════════════════════════════
//  SCREEN TRANSITIONS
// ═══════════════════════════════════════════════════════════════
const ALL_SCREENS=['menu-screen','gacha-screen','howto-screen','modifier-screen','game-screen','shop-screen','end-screen','settings-screen','inventory-screen','run-mods-screen','pause-screen','skill-screen','changelog-screen'];
function showScreen(id,cb){
  const cur=ALL_SCREENS.map(s=>document.getElementById(s)).find(el=>!el.classList.contains('hidden'));
  function doShow(){
    ALL_SCREENS.forEach(s=>{const el=document.getElementById(s);el.classList.add('hidden');el.classList.remove('fading-out','fading-in');});
    const next=document.getElementById(id);
    next.classList.remove('hidden');next.classList.add('fading-in');
    setTimeout(()=>next.classList.remove('fading-in'),FADE_MS+50);
    if(cb)cb();
  }
  if(cur&&cur.id!==id){cur.classList.add('fading-out');setTimeout(doShow,FADE_MS);}
  else doShow();
}

// ── Persistent settings ───────────────────────────────────────
let settings = JSON.parse(localStorage.getItem('mf_settings')||'{"vfx":"high","shake":"on","musicVol":25,"sfxVol":100}');
function saveSettings(){ localStorage.setItem('mf_settings', JSON.stringify(settings)); }

// ── Persistent run modifiers ──────────────────────────────────
const RUN_MODIFIERS=[
  // Page 1 — Basic
  {id:'hard_mode',    icon:'💀', name:'HARD MODE',         desc:'Start with 2 HP instead of 3.',                          mult:1.15, unlock:1},
  {id:'real_sweep',   icon:'🧹', name:'ACTUAL MINESWEEPER',desc:'1 life only — just like the real game.',                 mult:1.60, unlock:1},
  {id:'no_shop',      icon:'🚫', name:'NO SHOP',           desc:'Skip the shop between floors.',                          mult:1.30, unlock:1},
  {id:'no_flags',     icon:'🚩', name:'NO FLAGS',          desc:'Flagging is disabled. No gold from mines.',              mult:1.10, unlock:1},
  {id:'speed_run',    icon:'⚡', name:'SPEED RUN',         desc:'Every floor has a 60s timer.',                           mult:1.20, unlock:2},
  {id:'fog_always',   icon:'🌫️',name:'PERMA FOG',         desc:'Numbers are always unreliable (±1).',                    mult:1.15, unlock:2},
  // Page 2 — Advanced
  {id:'no_safe_zone', icon:'🎯', name:'NO SAFE ZONE',      desc:'No guaranteed safe starting area.',                      mult:1.08, unlock:2},
  {id:'chain_always', icon:'🔗', name:'CHAIN REACTION',    desc:'Every mine is a Chain type. Hits cascade.',              mult:1.25, unlock:3},
  {id:'elite_always', icon:'👁️',name:'ELITE ALWAYS',      desc:'All mines are invisible until 1 tile away.',             mult:1.20, unlock:3},
  {id:'boss_rush',    icon:'💥', name:'BOSS RUSH',         desc:'Every floor is a boss floor.',                           mult:1.30, unlock:4},
  {id:'no_gold',      icon:'💸', name:'POVERTY RUN',       desc:'Earn no gold. Multiplier reduced.',                      mult:1.12, unlock:2},
  {id:'double_mines', icon:'💣', name:'DOUBLE MINES',      desc:'Mine density is doubled.',                               mult:1.28, unlock:4},
  // Page 3 — Extreme
  {id:'lights_always',icon:'🌑', name:'LIGHTS OUT',        desc:'Every floor is pitch black. Use your mouse as a torch.', mult:1.22, unlock:3},
  {id:'no_reveal',    icon:'🔇', name:'SILENT FIELD',      desc:'Flood-reveal disabled. Every tile must be clicked.',     mult:1.12, unlock:2},
  {id:'cursed_always',icon:'☠️', name:'ALWAYS CURSED',     desc:'Every mine hit deals 2 HP.',                             mult:1.18, unlock:3},
  {id:'shrink_run',   icon:'🔬', name:'SHRINK RUN',        desc:'All grids are smaller with higher density.',             mult:1.12, unlock:2},
  {id:'no_hp_regen',  icon:'💔', name:'NO REGEN',          desc:'HP is never restored between floors.',                   mult:1.15, unlock:2},
  {id:'ghost_always', icon:'👻', name:'GHOST MINES',       desc:'All mines are Ghost type — invisible until nearby.',     mult:1.20, unlock:3},
  // Page 4 — New
  {id:'volatile_run', icon:'💥', name:'VOLATILE RUN',      desc:'Every mine hit triggers a chain explosion.',             mult:1.25, unlock:3},
  {id:'no_numbers',   icon:'🔕', name:'BLIND FIELD',       desc:'No numbers shown on any tile.',                          mult:1.35, unlock:4},
  {id:'tiny_grid',    icon:'🔲', name:'TINY GRID',         desc:'All grids are 6×6 max. Very dense.',                     mult:1.18, unlock:2},
  {id:'rich_run',     icon:'💎', name:'RICH RUN',          desc:'All floors are Rich Vein. More gold, more risk.',        mult:0.90, unlock:1},
  {id:'pacifist',     icon:'🕊️',name:'PACIFIST',          desc:'Flagging mines is the only way to score. No reveals.',   mult:1.40, unlock:4},
  {id:'sudden_death', icon:'⚰️', name:'SUDDEN DEATH',      desc:'Lose 1 HP every 30 seconds automatically.',             mult:1.30, unlock:3},
];
let activeRunMods = JSON.parse(localStorage.getItem('mf_runmods')||'[]');
let runsCompleted = parseInt(localStorage.getItem('mf_runs')||'0');
function saveRunMods(){ localStorage.setItem('mf_runmods', JSON.stringify(activeRunMods)); }
function saveRuns(){ localStorage.setItem('mf_runs', runsCompleted.toString()); }

// ── Equipped inventory slots ──────────────────────────────────
let equippedSlots = JSON.parse(localStorage.getItem('mf_equipped')||'[null,null,null]');
function saveEquipped(){ localStorage.setItem('mf_equipped', JSON.stringify(equippedSlots)); }

// ── Button wiring ─────────────────────────────────────────────
// Play click sound on all menu buttons globally
document.addEventListener('click', e=>{
  if(e.target.matches('.menu-btn, .menu-btn *, .gacha-roll-btn, .shop-tab, .shop-arrow, .toggle-btn, .danger-btn, .inv-trash-btn, .inv-confirm-delete, #btn-modifier-go, #btn-resume, #btn-pause-menu')){
    playsfx('click');
  }
});

document.getElementById('btn-play').addEventListener('click',       ()=>startGame());
document.getElementById('btn-gacha').addEventListener('click',      ()=>openGacha());
document.getElementById('btn-how').addEventListener('click',        ()=>{initHowtoGrid();showScreen('howto-screen');});
document.getElementById('btn-back').addEventListener('click',       ()=>showScreen('menu-screen'));
document.getElementById('btn-gacha-back').addEventListener('click', ()=>showScreen('menu-screen'));
document.getElementById('btn-retry').addEventListener('click',      ()=>startGame());
document.getElementById('btn-menu').addEventListener('click',       ()=>{showScreen('menu-screen');updateMenuDisplay();});
document.getElementById('btn-continue').addEventListener('click',   ()=>nextFloor());
document.getElementById('btn-modifier-go').addEventListener('click',()=>enterFloor());

// Settings
document.getElementById('btn-settings').addEventListener('click',  ()=>openSettings());
document.getElementById('btn-settings-back').addEventListener('click',()=>{showScreen('menu-screen');});
document.getElementById('btn-run-mods-quick').addEventListener('click', ()=>openRunMods());
document.getElementById('btn-run-mods-quick').style.display='none'; // hidden until 1 run done
document.getElementById('btn-reset-save').addEventListener('click', ()=>{
  if(confirm('Reset ALL progress? This cannot be undone.')){
    localStorage.clear();
    gems=0;bestScore=0;gachaInventory=[];equippedSlots=[null,null,null];
    activeRunMods=[];runsCompleted=0;gachaPityCount=0;playerExp=0;unlockedSkills=[];
    updateMenuDisplay();showScreen('menu-screen');
  }
});

// Inventory
document.getElementById('btn-inventory').addEventListener('click', ()=>openInventory());
document.getElementById('btn-inventory-back').addEventListener('click',()=>showScreen('menu-screen'));
document.getElementById('inv-trash-btn').addEventListener('click',()=>{
  inventoryDeleteMode=!inventoryDeleteMode;
  inventoryDeleteSelected=new Set();
  renderInventory();
});
document.getElementById('inv-confirm-delete').addEventListener('click',()=>{
  const indices=[...inventoryDeleteSelected].sort((a,b)=>b-a);
  const names=indices.map(i=>gachaInventory[i]?.name).filter(Boolean).join(', ');
  if(!confirm(`Delete ${indices.length} item(s)?\n${names}\n\nThis cannot be undone.`))return;
  // Unequip any that are equipped
  indices.forEach(i=>{
    const item=gachaInventory[i];
    if(item) equippedSlots=equippedSlots.map(s=>s&&s.id===item.id?null:s);
  });
  gachaInventory=indices.reduce((arr,i)=>{arr.splice(i,1);return arr;},[...gachaInventory]);
  saveGacha();saveEquipped();
  inventoryDeleteMode=false;inventoryDeleteSelected=new Set();
  renderInventory();
});

// Skill Tree
document.getElementById('btn-skill').addEventListener('click',()=>openSkillTree());
document.getElementById('btn-skill-back').addEventListener('click',()=>showScreen('menu-screen'));

// Changelog
document.getElementById('btn-changelog').addEventListener('click',()=>openChangelog());
document.getElementById('btn-changelog-back').addEventListener('click',()=>showScreen('menu-screen'));

// Run Modifiers
document.getElementById('btn-run-mods-back').addEventListener('click',()=>showScreen('menu-screen'));
document.getElementById('btn-run-mods-reset').addEventListener('click',()=>{
  activeRunMods=[];saveRunMods();renderRunMods();
});

// Pause
document.getElementById('btn-resume').addEventListener('click', ()=>resumeGame());
document.getElementById('btn-pause-menu').addEventListener('click',()=>{
  stopTimer();state.dead=true;showScreen('menu-screen');updateMenuDisplay();
});

// Mobile flag toggle
let mobileFlagMode=false;
document.getElementById('btn-mobile-flag').addEventListener('click',()=>{
  mobileFlagMode=!mobileFlagMode;
  const btn=document.getElementById('btn-mobile-flag');
  btn.textContent=mobileFlagMode?'🚩 FLAG: ON':'🚩 FLAG';
  btn.classList.toggle('active',mobileFlagMode);
});

// ESC key — pause/resume
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const gameVisible=!document.getElementById('game-screen').classList.contains('hidden');
    const pauseVisible=!document.getElementById('pause-screen').classList.contains('hidden');
    if(gameVisible) openPause();
    else if(pauseVisible) resumeGame();
  }
});

// Shop tab arrows
document.getElementById('shop-prev').addEventListener('click',()=>changeShopTab(-1));
document.getElementById('shop-next').addEventListener('click',()=>changeShopTab(1));
document.querySelectorAll('.shop-tab').forEach(btn=>{
  btn.addEventListener('click',()=>setShopTab(parseInt(btn.dataset.tab)));
});
document.querySelectorAll('.shop-dot').forEach(dot=>{
  dot.addEventListener('click',()=>setShopTab(parseInt(dot.dataset.tab)));
});

function updateMenuDisplay(){
  document.getElementById('best-score-display').textContent=bestScore>0?`BEST: ${bestScore}`:'';
  document.getElementById('gems-display').textContent=gems>0?`💎 ${gems} GEMS`:'';
  // Show run modifiers quick button after 1 run
  const show=runsCompleted>0?'':'none';
  document.getElementById('btn-run-mods-quick').style.display=show;
}
updateMenuDisplay();

// ── Pause ─────────────────────────────────────────────────────
function openPause(){
  if(state.dead||state.won)return;
  if(state.timerInterval&&state.timerInterval!=='paused'){clearInterval(state.timerInterval);state.timerInterval='paused';}
  document.getElementById('pause-stats').innerHTML=
    `<div>Floor <span>${state.floor}</span></div>
     <div>Score <span>${state.score.toLocaleString()}</span></div>
     <div>Lives <span>${'♥'.repeat(Math.max(0,state.hp))}${'♡'.repeat(Math.max(0,state.maxHp-state.hp))}</span></div>
     <div>Gold <span>💰${state.gold}</span></div>`;
  document.getElementById('pause-screen').classList.remove('hidden');
  document.getElementById('pause-screen').classList.add('fading-in');
  setTimeout(()=>document.getElementById('pause-screen').classList.remove('fading-in'),FADE_MS+50);
}

function resumeGame(){
  document.getElementById('pause-screen').classList.add('hidden');
  if(state.timerInterval==='paused'){
    state.timerInterval=setInterval(()=>{
      state.timerLeft--;updateTimerDisplay();
      if(state.timerLeft<=0){
        stopTimer();state.hp--;
        flashMessage('⏱️  TIME\'S UP  −1 HP','#f5a623');
        screenShake(6,300);render();
        if(state.hp<=0)setTimeout(triggerDeath,400);
      }
    },1000);
  }
}

// ── Shop tabs ─────────────────────────────────────────────────
let currentShopTab=0;
function setShopTab(idx){
  currentShopTab=idx;
  document.querySelectorAll('.shop-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  document.querySelectorAll('.shop-page').forEach((p,i)=>p.classList.toggle('active',i===idx));
  document.querySelectorAll('.shop-dot').forEach((d,i)=>d.classList.toggle('active',i===idx));
}
function changeShopTab(dir){setShopTab((currentShopTab+dir+4)%4);}

// ── Settings ──────────────────────────────────────────────────
// ── Audio ─────────────────────────────────────────────────────
const bgMusic = new Audio('sounds/backgroundmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = (settings.musicVol ?? 25) / 100;

const SFX = {
  click:   new Audio('sounds/buttonclick.mp3'),
  reveal:  new Audio('sounds/minefieldnotbombtile.mp3'),
  flag:    new Audio('sounds/placeflag.mp3'),
  explode: new Audio('sounds/bomb_explod.mp3'),
  buy:     new Audio('sounds/buysucsess.mp3'),
};
function setSfxVolume(vol){
  const v=vol/100;
  SFX.reveal.volume=v;
  SFX.flag.volume=v;
  SFX.explode.volume=v;
  SFX.buy.volume=v;
  // Click is boosted — cap at 1.0
  SFX.click.volume=Math.min(1.0, v*1.5);
}
setSfxVolume(settings.sfxVol ?? 100);

function playsfx(name){
  const src=SFX[name];
  if(!src)return;
  // Clone so overlapping sounds work
  const clone=src.cloneNode();
  clone.volume=src.volume;
  clone.play().catch(()=>{});
}

// Start music on first user interaction (browser autoplay policy)
let musicStarted=false;
function tryStartMusic(){
  if(musicStarted)return;
  musicStarted=true;
  if(!settings.musicMuted) bgMusic.play().catch(()=>{});
}
document.addEventListener('click', tryStartMusic, {once:true});
document.addEventListener('keydown', tryStartMusic, {once:true});

function initSlider(inputId, fillId, valId, settingKey){
  const input=document.getElementById(inputId);
  const val=document.getElementById(valId);
  function update(){
    const pct=((input.value-input.min)/(input.max-input.min))*100;
    input.style.setProperty('--pct', pct+'%');
    val.textContent=input.value;
    settings[settingKey]=parseInt(input.value);
    saveSettings();
    if(settingKey==='musicVol') bgMusic.volume=parseInt(input.value)/100;
    if(settingKey==='sfxVol')   setSfxVolume(parseInt(input.value));
  }
  input.addEventListener('input',update);
  return update;
}

function initToggleGroup(groupId, settingKey){
  const group=document.getElementById(groupId);
  if(!group)return;
  group.querySelectorAll('.toggle-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      group.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      settings[settingKey]=btn.dataset.val;
      saveSettings();
    });
  });
}

const _updateMusicSlider=initSlider('setting-music-vol','slider-fill-music','slider-val-music','musicVol');
const _updateSfxSlider=initSlider('setting-sfx-vol','slider-fill-sfx','slider-val-sfx','sfxVol');
initToggleGroup('toggle-vfx','vfx');
initToggleGroup('toggle-shake','shake');

// Mute toggle
document.getElementById('btn-mute-music').addEventListener('click',()=>{
  settings.musicMuted=!settings.musicMuted;
  saveSettings();
  applyMuteState();
});
function applyMuteState(){
  const btn=document.getElementById('btn-mute-music');
  if(settings.musicMuted){
    bgMusic.volume=0;
    btn.textContent='🔇';btn.classList.add('muted');
  } else {
    bgMusic.volume=(settings.musicVol??25)/100;
    btn.textContent='🔊';btn.classList.remove('muted');
  }
}

// Reset audio to defaults
document.getElementById('btn-audio-reset').addEventListener('click',()=>{
  settings.musicVol=25;settings.sfxVol=100;settings.musicMuted=false;
  saveSettings();
  document.getElementById('setting-music-vol').value=25;
  document.getElementById('setting-sfx-vol').value=100;
  _updateMusicSlider();_updateSfxSlider();
  applyMuteState();
  setSfxVolume(100);
});

function openSettings(){
  // Sliders
  const musicInput=document.getElementById('setting-music-vol');
  const sfxInput=document.getElementById('setting-sfx-vol');
  musicInput.value=settings.musicVol??25;
  sfxInput.value=settings.sfxVol??100;
  _updateMusicSlider();
  _updateSfxSlider();
  // Toggle groups
  ['toggle-vfx','toggle-shake'].forEach(gid=>{
    const key=gid==='toggle-vfx'?'vfx':'shake';
    const val=settings[key]||(key==='vfx'?'high':'on');
    const group=document.getElementById(gid);
    group.querySelectorAll('.toggle-btn').forEach(b=>{
      b.classList.toggle('active',b.dataset.val===val);
    });
  });
  applyMuteState();
  showScreen('settings-screen');
}

// ── Inventory ─────────────────────────────────────────────────
let inventoryDeleteMode=false;
let inventoryDeleteSelected=new Set();

function openInventory(){
  inventoryDeleteMode=false;
  inventoryDeleteSelected=new Set();
  document.getElementById('inventory-gems-display').textContent=`💎 ${gems}  ·  ⚡ ${playerExp} EXP`;
  renderInventory();
  showScreen('inventory-screen');
}

function renderInventory(){
  const countEl=document.getElementById('inv-count-label');
  const cap=skillMaxInventory();
  if(countEl) countEl.textContent=`(${gachaInventory.length}/${cap})`;

  // Delete mode toggle button
  const trashBtn=document.getElementById('inv-trash-btn');
  if(trashBtn){
    trashBtn.textContent=inventoryDeleteMode?'✕ CANCEL':'🗑 DELETE';
    trashBtn.className='inv-trash-btn'+(inventoryDeleteMode?' active':'');
  }

  // Confirm delete button — count unique groups selected
  const confirmBtn=document.getElementById('inv-confirm-delete');
  if(confirmBtn){
    // Count how many unique item groups have at least one index selected
    const groups2={};
    gachaInventory.forEach((item,idx)=>{if(!groups2[item.id])groups2[item.id]=[];groups2[item.id].push(idx);});
    const selectedGroups=Object.values(groups2).filter(idxs=>idxs.some(i=>inventoryDeleteSelected.has(i)));
    const totalSelected=inventoryDeleteSelected.size;
    confirmBtn.style.display=inventoryDeleteMode&&totalSelected>0?'block':'none';
    confirmBtn.textContent=`DELETE ${totalSelected} ITEM${totalSelected!==1?'S':''}`;
  }

  // Equipped slots — dynamic count from skill tree
  const slotCount=skillEquipSlots();
  const slotsEl=document.getElementById('equipped-slots');
  // Ensure we have enough slot divs
  while(slotsEl.children.length<slotCount){
    const d=document.createElement('div');
    d.className='equipped-slot empty';
    d.dataset.slot=slotsEl.children.length;
    slotsEl.appendChild(d);
  }
  while(slotsEl.children.length>slotCount) slotsEl.removeChild(slotsEl.lastChild);
  // Ensure equippedSlots array is right size
  while(equippedSlots.length<slotCount) equippedSlots.push(null);

  Array.from(slotsEl.children).forEach((slot,i)=>{
    const item=equippedSlots[i];
    slot.innerHTML='';
    if(!item){
      slot.className='equipped-slot empty';
      slot.innerHTML=`<span class="slot-num">${i+1}</span><span class="slot-empty-text">EMPTY</span>`;
    } else {
      slot.className='equipped-slot filled'+(item.rarity==='evolved'?' evolved-slot':'');
      const stackLabel=item.stackCount&&item.stackCount>1?`<div class="slot-stack-count">×${item.stackCount}</div>`:'';
      slot.innerHTML=`<span class="slot-num">${i+1}</span>
        <div class="slot-item-icon">${item.icon}</div>
        <div class="slot-item-name">${item.name}</div>
        <div class="slot-item-rarity" style="color:${RARITY_COLORS[item.rarity]||'#4ecca3'}">${item.rarity==='evolved'?'✨ EVOLVED':(item.rarity||'common').toUpperCase()}</div>
        ${stackLabel}
        <button class="unequip-btn" title="Unequip">✕</button>`;
      slot.querySelector('.unequip-btn').addEventListener('click',e=>{
        e.stopPropagation();
        equippedSlots[i]=null;saveEquipped();renderInventory();
      });
    }
  });

  // Collection list — group duplicates
  const list=document.getElementById('inventory-list');
  list.innerHTML='';
  if(gachaInventory.length===0){
    list.innerHTML='<div class="inv-empty">No items yet — roll the Gacha Machine!</div>';
    return;
  }

  // Group by id, preserving first-seen index for equip reference
  const groups={};
  gachaInventory.forEach((item,idx)=>{
    if(!groups[item.id]) groups[item.id]={item,indices:[],count:0};
    groups[item.id].indices.push(idx);
    groups[item.id].count++;
  });

  Object.values(groups).forEach(({item,indices,count})=>{
    const isEquipped=equippedSlots.some(s=>s&&s.id===item.id);
    const canMerge=count>=MERGE_THRESHOLD&&EVOLVED_ITEMS[item.id]&&!item.id.endsWith('_evo');
    const isSelected=indices.some(i=>inventoryDeleteSelected.has(i));
    const card=document.createElement('div');
    card.className='inventory-item'+(isEquipped?' equipped':'')+(inventoryDeleteMode?' delete-mode':'')+(isSelected?' selected-delete':'');

    // Stack count badge
    const countBadge=count>1
      ?`<div class="inv-stack-badge ${count>=MERGE_THRESHOLD?'merge-ready':''}">${count>=MERGE_THRESHOLD?'⚡':''}×${count}</div>`
      :'';

    // Merge button (only when 5+ and not evolved)
    const mergeBtn=canMerge&&!inventoryDeleteMode
      ?`<button class="inv-merge-btn" title="Merge 5 into evolved item">⚡ MERGE</button>`
      :'';

    card.innerHTML=`
      <div class="inv-item-icon">${item.icon}</div>
      <div class="inv-item-body">
        <div class="inv-item-name-row">
          <div class="inv-item-name">${item.name}</div>
          ${countBadge}
        </div>
        <div class="inv-item-desc">${item.desc||''}</div>
        ${mergeBtn}
      </div>
      <div class="inv-item-right">
        <div class="inv-item-rarity" style="color:${RARITY_COLORS[item.rarity]||'#4ecca3'}">${(item.rarity||'common').toUpperCase()}</div>
        ${inventoryDeleteMode
          ? `<div class="inv-delete-check">${isSelected?'☑':'☐'}</div>`
          : isEquipped?'<div class="inv-equipped-badge">EQUIPPED</div>':'<div class="inv-equip-hint">click to equip</div>'}
        <button class="inv-preview-btn" title="Preview item">?</button>
      </div>`;

    // Merge button handler
    if(canMerge){
      card.querySelector('.inv-merge-btn').addEventListener('click',e=>{
        e.stopPropagation();
        mergeItems(item.id);
      });
    }

    card.querySelector('.inv-preview-btn').addEventListener('click',e=>{
      e.stopPropagation();openItemPreview(item,count);
    });
    card.addEventListener('contextmenu',e=>{e.preventDefault();openItemPreview(item,count);});
    card.addEventListener('click',()=>{
      if(inventoryDeleteMode){
        // Toggle all indices of this group
        if(isSelected) indices.forEach(i=>inventoryDeleteSelected.delete(i));
        else indices.forEach(i=>inventoryDeleteSelected.add(i));
        renderInventory();
      } else if(!isEquipped){
        const emptySlot=equippedSlots.findIndex(s=>s===null);
        if(emptySlot===-1){flashInventoryMsg('All slots are full — unequip something first!');return;}
        // Equip with stack count embedded
        const itemWithCount={...item,stackCount:count};
        equippedSlots[emptySlot]=itemWithCount;saveEquipped();renderInventory();
      }
    });
    list.appendChild(card);
  });
}

function flashInventoryMsg(msg){
  const sub=document.getElementById('inventory-sub');
  const orig=sub.textContent;sub.textContent=msg;sub.style.color='var(--accent)';
  setTimeout(()=>{sub.textContent=orig;sub.style.color='';},2000);
}

function mergeItems(baseId){
  const evolved=EVOLVED_ITEMS[baseId];
  if(!evolved)return;
  // Remove 5 copies of baseId
  let removed=0;
  gachaInventory=gachaInventory.filter(item=>{
    if(item.id===baseId&&removed<MERGE_THRESHOLD){removed++;return false;}
    return true;
  });
  // Unequip if equipped
  equippedSlots=equippedSlots.map(s=>s&&s.id===baseId?null:s);
  // Add evolved item
  gachaInventory.push({...evolved});
  saveGacha();saveEquipped();
  // Flash
  flashInventoryMsg(`⚡ MERGED into ${evolved.name}!`);
  canvasExplode(window.innerWidth/2,window.innerHeight/2,45,40);
  renderInventory();
}

// ── Item Preview Modal ────────────────────────────────────────
// Detailed descriptions per perk/item effect
const ITEM_DETAIL_TEXT={
  shield:     'At the start of each floor your shield recharges. The next mine you hit deals 0 damage and the shield breaks. Only one shield charge per floor.',
  lucky:      'Every time you click a mine, there is a 10% random chance the hit is completely ignored — no HP loss, no score penalty.',
  detector:   'Any hidden tile that has 3 or more mines in its 8 neighbours will glow red. This does NOT reveal the tile, just hints at danger.',
  gold_magnet:'Every correctly flagged mine earns +5 extra gold on top of the base reward. Stacks with Flag Bonus upgrades.',
  double_score:'Every safe tile you reveal gives +20 score instead of the base +10. Pairs well with Combo Boost.',
  bomb_sense: 'Ghost mines are normally invisible until you are right next to them. With Bomb Sense they are always shown.',
  medic:      'If you clear a floor without hitting any mine (perfect floor), you restore 1 HP. Great for careful players.',
  cartographer:'At the start of every floor, 3 random safe tiles are automatically revealed for you.',
  gambler:    'Mine hits are random: 50% chance you take 0 damage (dodged!), 50% chance you take 2 damage instead of 1. High risk, high reward.',
  scavenger:  'For every 10 safe tiles you reveal in a run, you earn +10 gold. Rewards thorough exploration.',
  berserker:  'Your score multiplier equals your current HP. At 3 HP you score 3× per tile. At 1 HP you score 1×.',
  treasurer:  'When your run ends, 20% of your remaining gold is converted into bonus score.',
  // upgrades
  flag_bonus: 'Each stack adds +4 gold per correctly flagged mine. Stacks up to 4 times (+16 max). Each stack costs 25% more than the last.',
  score_boost:'Each stack adds +4 score per safe tile revealed. Stacks up to 4 times (+16 max). Each stack costs 25% more.',
  mine_sense: 'Each stack removes 1 mine from the next floor. Stacks up to 3 times. Each stack costs 25% more.',
  gold_interest:'At the start of each floor, earn 4% of your current gold as interest. Stacks up to 3 times (12% max). Each stack costs 25% more.',
  hp_regen:   'Restore 1 HP when you clear a floor (in addition to the normal +1 HP). Stacks up to 2 times. Second stack costs 25% more.',
  combo_boost:'+6 score for every tile in a flood-reveal chain. Stacks up to 3 times. Each stack costs 25% more.',
};

// Mini demo grid configs per perk
const ITEM_DEMO_CONFIG={
  shield:     {cols:4,rows:3,mines:[5],hint:'The shield absorbs the first mine hit each floor'},
  lucky:      {cols:4,rows:3,mines:[1,6,10],hint:'10% chance any mine hit is ignored'},
  detector:   {cols:4,rows:3,mines:[0,1,4],hint:'Tiles near 3+ mines glow red'},
  gold_magnet:{cols:4,rows:3,mines:[2,7],hint:'Flag mines to earn bonus gold'},
  double_score:{cols:4,rows:3,mines:[3,8],hint:'Each safe reveal gives +20 score'},
  bomb_sense: {cols:4,rows:3,mines:[0,5,9],hint:'Ghost mines are always visible with Bomb Sense'},
  medic:      {cols:4,rows:3,mines:[4,11],hint:'Clear without hitting a mine to restore 1 HP'},
  cartographer:{cols:4,rows:3,mines:[2,6],hint:'3 safe tiles are pre-revealed each floor'},
  gambler:    {cols:4,rows:3,mines:[1,7,10],hint:'50/50 on every mine hit — dodge or double damage'},
  scavenger:  {cols:4,rows:3,mines:[3,9],hint:'Reveal 10 tiles to earn +10 gold'},
  berserker:  {cols:4,rows:3,mines:[5,8],hint:'Score multiplier = your current HP'},
  treasurer:  {cols:4,rows:3,mines:[2,11],hint:'20% of gold becomes bonus score at run end'},
};

function openItemPreview(item,count){
  const overlay=document.getElementById('item-preview-overlay');
  const isEvolved=item.rarity==='evolved';
  const evolvedData=EVOLVED_ITEMS[item.id]; // if this item CAN evolve
  const EVOLVED_COLOR='#ff9f43';

  document.getElementById('item-preview-icon').textContent=item.icon;
  document.getElementById('item-preview-name').textContent=item.name;
  const rarityEl=document.getElementById('item-preview-rarity');
  const rarityColor=isEvolved?EVOLVED_COLOR:(RARITY_COLORS[item.rarity]||'#4ecca3');
  rarityEl.textContent=isEvolved?'✨ EVOLVED':(item.rarity||'common').toUpperCase();
  rarityEl.style.color=rarityColor;
  document.getElementById('item-preview-desc').textContent=item.desc||'';

  // Stack info
  const detailEl=document.getElementById('item-preview-detail');
  const perkId=item.effect&&item.effect.perk?item.effect.perk:null;
  const upgradeId=item.effect&&item.effect.upgrade?item.effect.upgrade:null;
  const detailKey=perkId||upgradeId;
  let detailText=ITEM_DETAIL_TEXT[detailKey]||'Equip this item to activate its effect at the start of your next run.';

  // Add stack info
  if(count&&count>1){
    detailText+=`\n\n📦 You have ×${count} of this item. Effects scale with stack count when equipped.`;
  }
  // Add evolve info
  if(evolvedData&&!isEvolved){
    const needed=Math.max(0,MERGE_THRESHOLD-(count||1));
    detailText+=needed>0
      ?`\n\n⚡ MERGE: Collect ${needed} more to evolve into ${evolvedData.name}!`
      :`\n\n⚡ READY TO MERGE! Open inventory and click MERGE to evolve into ${evolvedData.name}.`;
  }
  if(isEvolved&&item.evolveDesc){
    detailText=`✨ EVOLVED ITEM\n${item.evolveDesc}\n\n${detailText}`;
  }
  detailEl.textContent=detailText;

  // Mini demo canvas
  const cfg=ITEM_DEMO_CONFIG[detailKey];
  const canvas=document.getElementById('item-preview-canvas');
  const hint=document.getElementById('item-preview-demo-hint');
  if(cfg&&!isEvolved){
    document.getElementById('item-preview-demo-label').style.display='';
    canvas.style.display='block';
    hint.textContent=cfg.hint;
    drawItemDemoGrid(canvas,cfg,detailKey);
  } else {
    document.getElementById('item-preview-demo-label').style.display='none';
    canvas.style.display='none';
    hint.textContent='';
  }

  overlay.classList.remove('hidden');
}

function drawItemDemoGrid(canvas,cfg,perkId){
  const CELL=44,GAP=3;
  const W=cfg.cols*(CELL+GAP)-GAP, H=cfg.rows*(CELL+GAP)-GAP;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const mineSet=new Set(cfg.mines);
  const total=cfg.cols*cfg.rows;

  // Compute adjacency
  const adj=Array(total).fill(0);
  for(let i=0;i<total;i++){
    if(mineSet.has(i))continue;
    const r=Math.floor(i/cfg.cols),c=i%cfg.cols;
    let count=0;
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      if(dr===0&&dc===0)continue;
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<cfg.rows&&nc>=0&&nc<cfg.cols&&mineSet.has(nr*cfg.cols+nc))count++;
    }
    adj[i]=count;
  }

  // Decide which tiles to reveal (non-mine, non-adjacent to mine for flood)
  const revealed=new Set();
  for(let i=0;i<total;i++){
    if(!mineSet.has(i)&&adj[i]===0) revealed.add(i);
  }
  // Also reveal numbered tiles adjacent to revealed
  for(let i=0;i<total;i++){
    if(!mineSet.has(i)&&adj[i]>0){
      const r=Math.floor(i/cfg.cols),c=i%cfg.cols;
      let hasRevNeighbor=false;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<cfg.rows&&nc>=0&&nc<cfg.cols&&revealed.has(nr*cfg.cols+nc)){hasRevNeighbor=true;break;}
      }
      if(hasRevNeighbor) revealed.add(i);
    }
  }

  const NUM_COLORS_HEX=['','#5bc8f5','#4ecca3','#e94560','#b07aff','#ff7043','#26c6da','#f06292','#78909c'];

  for(let i=0;i<total;i++){
    const col=i%cfg.cols, row=Math.floor(i/cfg.cols);
    const x=col*(CELL+GAP), y=row*(CELL+GAP);
    const isMine=mineSet.has(i);
    const isRev=revealed.has(i);

    // Background
    ctx.fillStyle=isMine?'#3a0a10':isRev?'#0d1018':'#1a1f30';
    roundRect(ctx,x,y,CELL,CELL,6);ctx.fill();

    // Border
    ctx.strokeStyle=isMine?'#e94560':isRev?'#131820':'#252c42';
    ctx.lineWidth=1;
    roundRect(ctx,x,y,CELL,CELL,6);ctx.stroke();

    // Detector highlight
    if(perkId==='detector'&&!isMine&&!isRev){
      const r2=Math.floor(i/cfg.cols),c2=i%cfg.cols;
      let mc=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr=r2+dr,nc=c2+dc;
        if(nr>=0&&nr<cfg.rows&&nc>=0&&nc<cfg.cols&&mineSet.has(nr*cfg.cols+nc))mc++;
      }
      if(mc>=3){
        ctx.fillStyle='rgba(233,69,96,0.18)';
        roundRect(ctx,x,y,CELL,CELL,6);ctx.fill();
        ctx.strokeStyle='rgba(233,69,96,0.4)';
        roundRect(ctx,x,y,CELL,CELL,6);ctx.stroke();
      }
    }

    // Content
    ctx.textAlign='center';ctx.textBaseline='middle';
    const cx=x+CELL/2, cy=y+CELL/2;
    if(isMine){
      ctx.font=`${CELL*.55}px serif`;ctx.fillText('💣',cx,cy);
    } else if(isRev&&adj[i]>0){
      ctx.font=`bold ${CELL*.42}px Orbitron,monospace`;
      ctx.fillStyle=NUM_COLORS_HEX[Math.min(adj[i],8)];
      ctx.fillText(adj[i],cx,cy);
    } else if(perkId==='cartographer'&&!isMine&&!isRev&&i<3){
      // Show pre-revealed tiles
      ctx.fillStyle='rgba(78,204,163,0.25)';
      roundRect(ctx,x,y,CELL,CELL,6);ctx.fill();
      ctx.font=`${CELL*.4}px serif`;ctx.fillText('✓',cx,cy);
    }
  }
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);
  ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
}

document.getElementById('item-preview-close').addEventListener('click',()=>{
  document.getElementById('item-preview-overlay').classList.add('hidden');
});
document.getElementById('item-preview-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('item-preview-overlay'))
    document.getElementById('item-preview-overlay').classList.add('hidden');
});

// ── Howto Mini Minefield ──────────────────────────────────────
let howtoGrid={cells:[],cols:6,rows:5,mines:new Set(),won:false,lost:false};
let howtoFlagMode=false;

function initHowtoGrid(){
  howtoFlagMode=false;
  const flagBtn=document.getElementById('btn-howto-flag');
  if(flagBtn){flagBtn.textContent='🚩 FLAG MODE: OFF';flagBtn.classList.remove('active');}
  const cols=6,rows=5,mineCount=5;
  const total=cols*rows;
  const mines=new Set();
  // Safe zone: top-left 2x2
  const safe=new Set([0,1,cols,cols+1]);
  while(mines.size<mineCount){const i=Math.floor(Math.random()*total);if(!safe.has(i))mines.add(i);}
  const cells=Array.from({length:total},(_,i)=>({mine:mines.has(i),revealed:false,flagged:false,adj:0}));
  for(let i=0;i<total;i++){
    if(cells[i].mine)continue;
    const r=Math.floor(i/cols),c=i%cols;
    let n=0;
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&cells[nr*cols+nc].mine)n++;
    }
    cells[i].adj=n;
  }
  howtoGrid={cells,cols,rows,mines,won:false,lost:false};
  renderHowtoGrid();
  const msg=document.getElementById('howto-grid-msg');
  if(msg){msg.textContent='';msg.style.color='';}
}

function howtoFlood(idx){
  const{cells,cols,rows}=howtoGrid;
  const q=[idx];cells[idx].revealed=true;
  while(q.length){
    const cur=q.shift();
    if(cells[cur].adj>0)continue;
    const r=Math.floor(cur/cols),c=cur%cols;
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      const nr=r+dr,nc=c+dc;
      if(nr<0||nr>=rows||nc<0||nc>=cols)continue;
      const ni=nr*cols+nc;
      if(!cells[ni].revealed&&!cells[ni].flagged&&!cells[ni].mine){cells[ni].revealed=true;q.push(ni);}
    }
  }
}

function renderHowtoGrid(){
  const{cells,cols}=howtoGrid;
  const grid=document.getElementById('howto-grid');
  if(!grid)return;
  grid.style.gridTemplateColumns=`repeat(${cols},40px)`;
  grid.innerHTML='';
  cells.forEach((cell,i)=>{
    const el=document.createElement('div');
    el.className='cell';
    el.style.width='40px';el.style.height='40px';el.style.fontSize='.85rem';
    if(cell.revealed){
      el.classList.add('revealed');
      if(cell.mine){el.classList.add('mine-explode');el.textContent='💣';}
      else if(cell.adj>0){el.textContent=cell.adj;el.classList.add(NUM_COLORS[Math.min(cell.adj,8)]);}
    } else if(cell.flagged){
      el.classList.add('flagged');el.textContent='🚩';
    } else {
      el.classList.add('hidden');
    }
    if(!howtoGrid.won&&!howtoGrid.lost){
      el.addEventListener('click',()=>{
        if(howtoFlagMode) howtoFlag(i);
        else howtoReveal(i);
      });
      el.addEventListener('contextmenu',e=>{e.preventDefault();howtoFlag(i);});
    }
    grid.appendChild(el);
  });
}

function howtoReveal(idx){
  const{cells}=howtoGrid;
  if(cells[idx].revealed||cells[idx].flagged)return;
  if(cells[idx].mine){
    cells[idx].revealed=true;
    howtoGrid.lost=true;
    renderHowtoGrid();
    const msg=document.getElementById('howto-grid-msg');
    msg.textContent='💥 Mine hit! Click New Board to try again.';
    msg.style.color='var(--accent)';
    return;
  }
  howtoFlood(idx);
  const allSafe=howtoGrid.cells.every(c=>c.mine||c.revealed);
  if(allSafe){
    howtoGrid.won=true;
    const msg=document.getElementById('howto-grid-msg');
    msg.textContent='✨ Board cleared! Nice work!';
    msg.style.color='var(--accent2)';
  }
  renderHowtoGrid();
}

function howtoFlag(idx){
  const{cells}=howtoGrid;
  if(cells[idx].revealed)return;
  cells[idx].flagged=!cells[idx].flagged;
  renderHowtoGrid();
}

document.getElementById('btn-howto-reset').addEventListener('click',initHowtoGrid);
document.getElementById('btn-howto-flag').addEventListener('click',()=>{
  howtoFlagMode=!howtoFlagMode;
  const btn=document.getElementById('btn-howto-flag');
  btn.textContent=howtoFlagMode?'🚩 FLAG MODE: ON':'🚩 FLAG MODE: OFF';
  btn.classList.toggle('active',howtoFlagMode);
});

// ── Skill Tree ────────────────────────────────────────────────
// BRANCH_COLORS defined at top with SKILL_TREE data
const NODE_R=32; // node circle radius
let skillTooltip=null; // currently hovered node id
let skillCanvas=null,skillCtx=null;
let skillPan={x:0,y:0},skillDrag={active:false,sx:0,sy:0,ox:0,oy:0};
let skillScale=1;

function openSkillTree(){
  document.getElementById('skill-exp-display').textContent=`⚡ ${playerExp} EXP`;
  // Auto-unlock root
  if(!unlockedSkills.includes('s_root')){unlockedSkills.push('s_root');saveSkills();}
  initSkillCanvas();
  showScreen('skill-screen');
}

function initSkillCanvas(){
  const wrap=document.getElementById('skill-tree-container');
  wrap.innerHTML='';

  // Canvas
  const cv=document.createElement('canvas');
  cv.id='skill-canvas';
  cv.style.cssText='display:block;cursor:grab;touch-action:none';
  wrap.appendChild(cv);

  // Tooltip div
  const tip=document.createElement('div');
  tip.id='skill-tooltip';tip.className='skill-tooltip';tip.style.display='none';
  wrap.appendChild(tip);

  skillCanvas=cv;skillCtx=cv.getContext('2d');
  skillPan={x:0,y:0};skillScale=1;skillTooltip=null;

  resizeSkillCanvas();
  // Auto-fit after first resize
  autoFitSkillTree();
  window.addEventListener('resize',()=>{resizeSkillCanvas();autoFitSkillTree();});

  // Pan drag
  cv.addEventListener('mousedown',e=>{
    skillDrag={active:true,sx:e.clientX,sy:e.clientY,ox:skillPan.x,oy:skillPan.y};
    cv.style.cursor='grabbing';
  });
  window.addEventListener('mouseup',()=>{skillDrag.active=false;cv.style.cursor='grab';});
  window.addEventListener('mousemove',e=>{
    if(skillDrag.active){
      skillPan.x=skillDrag.ox+(e.clientX-skillDrag.sx);
      skillPan.y=skillDrag.oy+(e.clientY-skillDrag.sy);
      drawSkillTree();
    }
    // Tooltip hover
    const pos=canvasPos(e,cv);
    const hit=hitNode(pos.x,pos.y);
    if(hit!==skillTooltip){skillTooltip=hit;drawSkillTree();showSkillTooltip(hit,e);}
    else if(hit) moveSkillTooltip(e);
  });
  cv.addEventListener('click',e=>{
    if(Math.abs(e.clientX-skillDrag.sx)>4||Math.abs(e.clientY-skillDrag.sy)>4)return;
    const pos=canvasPos(e,cv);
    const hit=hitNode(pos.x,pos.y);
    if(!hit)return;
    const node=SKILL_TREE.find(n=>n.id===hit);
    if(!node)return;
    const unlocked=unlockedSkills.includes(node.id);
    const canUnlock=!unlocked&&playerExp>=node.cost&&node.req.every(r=>unlockedSkills.includes(r));
    if(canUnlock){
      playerExp-=node.cost;unlockedSkills.push(node.id);saveExp();saveSkills();
      document.getElementById('skill-exp-display').textContent=`⚡ ${playerExp} EXP`;
      const pos2=worldToScreen(node.x,node.y);
      canvasExplode(skillCanvas.getBoundingClientRect().left+pos2.x,skillCanvas.getBoundingClientRect().top+pos2.y,45,24);
      drawSkillTree();showSkillTooltip(hit,e);
    }
  });
  // Scroll to zoom
  cv.addEventListener('wheel',e=>{
    e.preventDefault();
    const delta=e.deltaY>0?-0.1:0.1;
    skillScale=Math.max(0.5,Math.min(2,skillScale+delta));
    drawSkillTree();
  },{passive:false});

  drawSkillTree();
}

function resizeSkillCanvas(){
  if(!skillCanvas)return;
  const wrap=document.getElementById('skill-tree-container');
  const dpr=window.devicePixelRatio||1;
  const cssW=wrap.clientWidth||window.innerWidth;
  const cssH=wrap.clientHeight||window.innerHeight-60;
  // CSS size
  skillCanvas.style.width=cssW+'px';
  skillCanvas.style.height=cssH+'px';
  // Physical pixel size
  skillCanvas.width=Math.round(cssW*dpr);
  skillCanvas.height=Math.round(cssH*dpr);
  // Store for layout math — always work in CSS px
  skillCanvas._cssW=cssW;
  skillCanvas._cssH=cssH;
  skillCanvas._dpr=dpr;
  drawSkillTree();
}

function autoFitSkillTree(){
  if(!skillCanvas)return;
  const W=skillCanvas._cssW||skillCanvas.width;
  const H=skillCanvas._cssH||skillCanvas.height;
  const pad=80;
  const xs=SKILL_TREE.map(n=>n.x),ys=SKILL_TREE.map(n=>n.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs);
  const minY=Math.min(...ys),maxY=Math.max(...ys);
  const treeW=maxX-minX||1,treeH=maxY-minY||1;
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  skillScale=Math.min((W-pad*2)/treeW,(H-pad*2)/treeH,1.2);
  skillPan={x:-cx*skillScale,y:-cy*skillScale};
  drawSkillTree();
}

function worldToScreen(wx,wy){
  const W=skillCanvas._cssW||skillCanvas.width;
  const H=skillCanvas._cssH||skillCanvas.height;
  return{
    x:wx*skillScale+skillPan.x+W/2,
    y:wy*skillScale+skillPan.y+H/2
  };
}

function canvasPos(e,cv){
  const r=cv.getBoundingClientRect();
  const W=cv._cssW||cv.width;
  const H=cv._cssH||cv.height;
  const sx=e.clientX-r.left,sy=e.clientY-r.top;
  return{
    x:(sx-skillPan.x-W/2)/skillScale,
    y:(sy-skillPan.y-H/2)/skillScale
  };
}

function hitNode(wx,wy){
  for(const n of SKILL_TREE){
    const dx=n.x-wx,dy=n.y-wy;
    if(Math.hypot(dx,dy)<=NODE_R+4) return n.id;
  }
  return null;
}

function drawSkillTree(){
  if(!skillCtx||!skillCanvas)return;
  const ctx=skillCtx;
  const W=skillCanvas._cssW||skillCanvas.width;
  const H=skillCanvas._cssH||skillCanvas.height;
  const dpr=skillCanvas._dpr||window.devicePixelRatio||1;

  // Reset to identity, scale by DPR so all drawing is in CSS px
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);

  // Background grid
  ctx.strokeStyle='rgba(78,204,163,0.04)';ctx.lineWidth=1;
  const gs=44*skillScale;
  const ox=(skillPan.x+W/2)%gs;
  const oy=(skillPan.y+H/2)%gs;
  for(let x=ox;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=oy;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Draw connections first
  SKILL_TREE.forEach(node=>{
    node.req.forEach(reqId=>{
      const parent=SKILL_TREE.find(n=>n.id===reqId);
      if(!parent)return;
      const p=worldToScreen(parent.x,parent.y);
      const c=worldToScreen(node.x,node.y);
      const bothUnlocked=unlockedSkills.includes(node.id)&&unlockedSkills.includes(reqId);
      const parentUnlocked=unlockedSkills.includes(reqId);
      const color=BRANCH_COLORS[node.branch]||'#4ecca3';
      ctx.beginPath();
      ctx.moveTo(p.x,p.y);ctx.lineTo(c.x,c.y);
      if(bothUnlocked){
        ctx.strokeStyle=color;ctx.lineWidth=3*skillScale;
        ctx.shadowBlur=8;ctx.shadowColor=color;
      } else if(parentUnlocked){
        ctx.strokeStyle=color+'66';ctx.lineWidth=2*skillScale;ctx.shadowBlur=0;
      } else {
        ctx.strokeStyle='#1f2535';ctx.lineWidth=1.5*skillScale;ctx.shadowBlur=0;
      }
      ctx.stroke();ctx.shadowBlur=0;
    });
  });

  // Draw nodes
  SKILL_TREE.forEach(node=>{
    const s=worldToScreen(node.x,node.y);
    const unlocked=unlockedSkills.includes(node.id);
    const canUnlock=!unlocked&&playerExp>=node.cost&&node.req.every(r=>unlockedSkills.includes(r));
    const isHovered=skillTooltip===node.id;
    const color=BRANCH_COLORS[node.branch]||'#4ecca3';
    const r=NODE_R*skillScale*(isHovered?1.12:1);

    // Outer glow
    if(unlocked||canUnlock){
      ctx.beginPath();ctx.arc(s.x,s.y,r+6*skillScale,0,Math.PI*2);
      ctx.fillStyle=color+(unlocked?'33':'22');
      ctx.shadowBlur=unlocked?20:10;ctx.shadowColor=color;
      ctx.fill();ctx.shadowBlur=0;
    }

    // Circle fill
    ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);
    if(unlocked){
      const g=ctx.createRadialGradient(s.x-r*.3,s.y-r*.3,r*.1,s.x,s.y,r);
      g.addColorStop(0,color+'cc');g.addColorStop(1,color+'44');
      ctx.fillStyle=g;
    } else if(canUnlock){
      ctx.fillStyle='#1a1f30';
    } else {
      ctx.fillStyle='#0d1018';
    }
    ctx.fill();

    // Border
    ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);
    ctx.strokeStyle=unlocked?color:canUnlock?color+'88':'#1f2535';
    ctx.lineWidth=(unlocked?2.5:1.5)*skillScale;
    ctx.stroke();

    // Icon
    ctx.font=`${Math.round(18*skillScale)}px serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.globalAlpha=unlocked?1:canUnlock?0.8:0.3;
    ctx.fillText(node.icon,s.x,s.y);
    ctx.globalAlpha=1;

    // Name label below
    ctx.font=`${Math.round(9*skillScale)}px 'Orbitron',sans-serif`;
    ctx.fillStyle=unlocked?color:canUnlock?color+'aa':'#3a3f55';
    ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText(node.name,s.x,s.y+r+4*skillScale);

    // Cost badge
    if(!unlocked&&node.cost>0){
      const badge=`⚡${node.cost}`;
      ctx.font=`${Math.round(8*skillScale)}px 'Share Tech Mono',monospace`;
      ctx.fillStyle=canUnlock?'#f5c842':'#3a3f55';
      ctx.textBaseline='top';
      ctx.fillText(badge,s.x,s.y+r+(14)*skillScale);
    }
  });

  ctx.font=`${Math.round(10*skillScale)}px 'Share Tech Mono',monospace`;
  ctx.fillStyle='#3a3f55';ctx.textAlign='left';ctx.textBaseline='bottom';
  ctx.fillText('drag to pan  ·  scroll to zoom  ·  click to unlock',8,H-6);
}

function showSkillTooltip(nodeId,e){
  const tip=document.getElementById('skill-tooltip');
  if(!tip)return;
  if(!nodeId){tip.style.display='none';return;}
  const node=SKILL_TREE.find(n=>n.id===nodeId);
  if(!node){tip.style.display='none';return;}
  const unlocked=unlockedSkills.includes(node.id);
  const canUnlock=!unlocked&&playerExp>=node.cost&&node.req.every(r=>unlockedSkills.includes(r));
  const color=BRANCH_COLORS[node.branch]||'#4ecca3';
  tip.innerHTML=`
    <div class="st-name" style="color:${color}">${node.icon} ${node.name}</div>
    <div class="st-desc">${node.desc}</div>
    <div class="st-cost">${unlocked?'✓ UNLOCKED':canUnlock?`Click to unlock — ⚡${node.cost} EXP`:`⚡${node.cost} EXP — ${node.req.length?'requires prerequisites':'not enough EXP'}`}</div>
  `;
  tip.style.display='block';
  moveSkillTooltip(e);
}

function moveSkillTooltip(e){
  const tip=document.getElementById('skill-tooltip');
  if(!tip||tip.style.display==='none')return;
  const wrap=document.getElementById('skill-tree-container');
  const wr=wrap.getBoundingClientRect();
  let tx=e.clientX-wr.left+14,ty=e.clientY-wr.top-10;
  if(tx+200>wr.width) tx=e.clientX-wr.left-214;
  tip.style.left=tx+'px';tip.style.top=ty+'px';
}

// ── Changelog ─────────────────────────────────────────────────
const CHANGELOG=[
  {version:'v1.4', date:'Latest', entries:[
    '🔒 Privacy Policy added — accessible from the main menu footer',
    '🐛 Fixed: infinite health after retrying a run (HP now hard-capped at 10)',
    '🐛 Fixed: Gold Vault gacha item conflicted with Bounty Vault boss floor name',
    '🐛 Fixed: Bonus Floor was pre-cleared before the player could see it',
    '⚖️ Relics repriced to reflect their downsides (Glass Cannon 15g, Vampirism 20g, etc.)',
    '⚖️ Shop upgrade costs now scale +25% per stack to prevent snowballing',
    '📦 Inventory stacking: duplicate items grouped with ×N count badge',
    '⚡ Item merging: collect 5 of the same item to evolve it into a powerful upgraded version',
    '✨ 20 evolved items with unique enhanced abilities',
    '🎒 Equipping a stacked item scales its effect by stack count',
    '📱 Mobile support: touch to reveal, hold to flag, FLAG MODE toggle button',
    '🧹 ACTUAL MINESWEEPER run modifier: 1 life only, just like the real game',
    '🆕 New run modifiers: VOLATILE RUN, BLIND FIELD, TINY GRID, RICH RUN, PACIFIST, SUDDEN DEATH',
    '🆕 New relics: VAMPIRISM, WARLORD\'S MAP, CURSED DICE, IRON CROWN',
    '🆕 New upgrades: GOLD FINDER, ARMOR, SCOUT',
    '🆕 New floor modifiers: FROZEN FIELD, BONUS FLOOR, VOLATILE FIELD, RICH VEIN',
  ]},
  {version:'v1.1', date:'Previous', entries:[
    '🔊 Sound system: background music, SFX for reveals, flags, mine hits, purchases',
    '⚙️ Settings reworked: music & SFX volume sliders, mute toggle, reset to default',
    '🎒 Inventory close button moved to top-right corner',
    '🔍 Item preview: right-click or ? on any inventory item for detailed breakdown',
    '📖 How to Play reworked with interactive mini minefield',
    '🐛 Fixed: every floor was getting a special modifier',
    '🐛 Fixed: floor clear could fire twice causing floors to skip',
  ]},
  {version:'v1.0', date:'Earlier', entries:[
    '🌳 Skill tree expanded to 7 branches with 30+ nodes',
    '💖 New skills: FIVE LIVES, BORN LUCKY, FORTRESS, PRECISION, VAULT, BONUS RELIC, GUARANTEED, SCORE LEGEND',
    '🔧 Skill tree: drag to pan, scroll to zoom, branch color-coding',
    '🏆 Boss floor clear bonus now correctly awards +300 score for Titan Field',
  ]},
];

function openChangelog(){
  const list=document.getElementById('changelog-list');
  list.innerHTML='';
  CHANGELOG.forEach((v,idx)=>{
    const isLatest=idx===0;
    const section=document.createElement('div');
    section.className='cl-section'+(isLatest?' open':'');
    section.innerHTML=`
      <div class="cl-version-header">
        <div class="cl-version-badge${isLatest?' latest':''}">${v.version}</div>
        <div class="cl-version-date">${v.date}</div>
        <div class="cl-version-count">${v.entries.length} changes</div>
        <span class="cl-chevron">▶</span>
      </div>
      <div class="cl-entries-wrap">
        <ul class="cl-entries">${v.entries.map(e=>`<li><span class="cl-entry-dot"></span>${e}</li>`).join('')}</ul>
      </div>`;
    section.querySelector('.cl-version-header').addEventListener('click',()=>{
      section.classList.toggle('open');
    });
    list.appendChild(section);
  });
  showScreen('changelog-screen');
}

// ── Run Modifiers ─────────────────────────────────────────────
let runModPage=0;
const RUN_MODS_PER_PAGE=6;

function openRunMods(){
  runModPage=0;
  renderRunMods();
  showScreen('run-mods-screen');
}

function renderRunMods(){
  const list=document.getElementById('run-mods-list');
  list.innerHTML='';

  const totalPages=Math.ceil(RUN_MODIFIERS.length/RUN_MODS_PER_PAGE);
  const pageItems=RUN_MODIFIERS.slice(runModPage*RUN_MODS_PER_PAGE,(runModPage+1)*RUN_MODS_PER_PAGE);

  pageItems.forEach(mod=>{
    const locked=runsCompleted<mod.unlock;
    const active=activeRunMods.includes(mod.id);
    const card=document.createElement('div');
    card.className='run-mod-card'+(active?' active':'')+(locked?' locked':'');
    card.innerHTML=`
      <div class="rmc-left">
        <div class="rmc-icon">${mod.icon}</div>
        <div class="rmc-body">
          <div class="rmc-name">${mod.name}</div>
          <div class="rmc-desc">${locked?`🔒 Complete ${mod.unlock} run(s) to unlock`:mod.desc}</div>
        </div>
      </div>
      <div class="rmc-right">
        <div class="rmc-mult ${active?'active':''}">×${mod.mult.toFixed(1)}</div>
        <div class="rmc-toggle ${active?'on':''}">${active?'●':'○'}</div>
      </div>`;
    if(!locked){
      card.addEventListener('click',()=>{
        if(active) activeRunMods=activeRunMods.filter(id=>id!==mod.id);
        else activeRunMods.push(mod.id);
        saveRunMods();renderRunMods();
      });
    }
    list.appendChild(card);
  });

  // Page nav
  const nav=document.getElementById('run-mods-nav');
  nav.innerHTML='';
  if(totalPages>1){
    const prev=document.createElement('button');
    prev.className='shop-arrow';prev.textContent='◀';
    prev.disabled=runModPage===0;
    prev.addEventListener('click',()=>{runModPage--;renderRunMods();});

    const pageLabel=document.createElement('span');
    pageLabel.className='run-mods-page-label';
    pageLabel.textContent=`${runModPage+1} / ${totalPages}`;

    const next=document.createElement('button');
    next.className='shop-arrow';next.textContent='▶';
    next.disabled=runModPage>=totalPages-1;
    next.addEventListener('click',()=>{runModPage++;renderRunMods();});

    nav.appendChild(prev);nav.appendChild(pageLabel);nav.appendChild(next);
  }

  // Update multiplier display
  const totalMult=activeRunMods.reduce((acc,id)=>{
    const m=RUN_MODIFIERS.find(r=>r.id===id);return m?acc+(m.mult-1):acc;
  },1.0);
  document.getElementById('run-mods-mult').textContent='×'+totalMult.toFixed(1);
}

// ═══════════════════════════════════════════════════════════════
//  GACHA MACHINE
// ═══════════════════════════════════════════════════════════════
function openGacha(){
  renderGachaInventory();
  updateGachaDisplay();
  showScreen('gacha-screen');
}
function updateGachaDisplay(){
  document.getElementById('gacha-gems-display').textContent=`💎 ${gems}`;
  document.getElementById('btn-roll1').disabled=gems<10;
  document.getElementById('btn-roll3').disabled=gems<25;
  const pityEl=document.getElementById('gacha-pity');
  if(pityEl) pityEl.textContent=`Pity: ${gachaPityCount}/20 — epic guaranteed at 20`;
}
function renderGachaInventory(){
  const list=document.getElementById('gacha-inv-list');
  list.innerHTML='';
  if(gachaInventory.length===0){list.innerHTML='<span style="color:var(--dim);font-size:.75rem">No upgrades yet — roll to earn some!</span>';return;}
  gachaInventory.forEach((item,idx)=>{
    const tag=document.createElement('div');tag.className='gacha-inv-tag';
    tag.innerHTML=`${item.icon} ${item.name} <span class="remove-tag" data-idx="${idx}">✕</span>`;
    tag.querySelector('.remove-tag').addEventListener('click',()=>{gachaInventory.splice(idx,1);saveGacha();renderGachaInventory();});
    list.appendChild(tag);
  });
}

document.getElementById('btn-roll1').addEventListener('click',()=>doGachaRoll(1));
document.getElementById('btn-roll3').addEventListener('click',()=>doGachaRoll(3));

function doGachaRoll(count){
  const costs={1:10,3:25};
  const cost=costs[count]||count*10;
  if(gems<cost)return;
  gems-=cost;saveGems();updateGachaDisplay();updateMenuDisplay();

  const results=[];
  for(let i=0;i<count;i++) results.push(rollGachaItem());

  const slots=[0,1,2].map(i=>document.getElementById(`slot-${i}`));
  const slotMap={1:[1],3:[0,1,2]};
  const activeSlots=slotMap[count]||[0,1,2];

  // Reset all slots
  slots.forEach((s,i)=>{
    s.textContent='?';s.className='gacha-slot';
    s.style.borderColor='';s.style.boxShadow='';
    s.style.opacity=activeSlots.includes(i)?'1':'0.12';
  });

  // Cycle through random icons before landing
  const allIcons=GACHA_POOL.map(i=>i.icon);
  const cycleIntervals=[];

  results.slice(0,3).forEach((item,i)=>{
    const slotIdx=activeSlots[i];
    const slot=slots[slotIdx];
    const delay=i*220;

    // Start cycling
    setTimeout(()=>{
      slot.classList.add('spinning');
      let tick=0;
      const iv=setInterval(()=>{
        slot.textContent=allIcons[Math.floor(Math.random()*allIcons.length)];
        tick++;
      },60);
      cycleIntervals.push(iv);

      // Land after spin duration
      const spinDur=500+i*150;
      setTimeout(()=>{
        clearInterval(iv);
        slot.classList.remove('spinning');
        slot.classList.add('landed');
        slot.textContent=item.icon;
        slot.style.borderColor=RARITY_COLORS[item.rarity];
        slot.style.boxShadow=`0 0 28px ${RARITY_COLORS[item.rarity]}88`;
        // Bounce
        slot.style.transform='scale(1.25)';
        setTimeout(()=>{slot.style.transform='scale(0.92)';},120);
        setTimeout(()=>{slot.style.transform='scale(1)';},220);
        const r=slot.getBoundingClientRect();
        canvasExplode(r.left+r.width/2,r.top+r.height/2,
          item.rarity==='epic'?45:item.rarity==='rare'?280:160,
          item.rarity==='epic'?32:item.rarity==='rare'?20:12);
        if(item.rarity==='epic'){
          screenShake(4,300);
          for(let j=0;j<3;j++) setTimeout(()=>shockwaves.push({x:r.left+r.width/2,y:r.top+r.height/2,r:4,speed:6,hue:45,life:.9}),j*100);
        }
      },spinDur);
    },delay);
  });

  const totalTime=results.length*220+700;
  setTimeout(()=>{
    results.forEach(item=>{
      if(gachaInventory.length<skillMaxInventory()) gachaInventory.push(item);
    });
    saveGacha();renderGachaInventory();
    document.getElementById('gacha-result').innerHTML=results.map(r=>`
      <span class="gacha-result-item" style="color:${RARITY_COLORS[r.rarity]}">${r.icon} ${r.name}</span>
    `).join('');
    updateGachaDisplay();
  },totalTime);
}

function rollGachaItem(){
  gachaPityCount++;
  // Pity: force epic at 20 rolls
  let rarity;
  if(gachaPityCount>=skillPity()){
    rarity='epic';gachaPityCount=0;
  } else {
    const epicRate=RARITY_WEIGHTS.epic+(getSkillEffect('s_gacha3')?5:0);
    const rareRate=RARITY_WEIGHTS.rare+(getSkillEffect('s_gacha2')?10:0);
    const roll=Math.random()*100;
    rarity=roll<epicRate?'epic':roll<epicRate+rareRate?'rare':'common';
    if(rarity==='epic') gachaPityCount=0;
  }
  savePity();
  const pool=GACHA_POOL.filter(i=>i.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}

// ═══════════════════════════════════════════════════════════════
//  GAME INIT
// ═══════════════════════════════════════════════════════════════
function startGame(){
  // Compute run modifier multiplier
  const runModMult=activeRunMods.reduce((acc,id)=>{
    const m=RUN_MODIFIERS.find(r=>r.id===id);return m?acc+(m.mult-1):acc;
  },1.0);

  // Base HP — check equipped items and skill tree for maxHp
  const activeItems=[...equippedSlots.filter(Boolean)];
  const baseMaxHp=Math.min(MAX_HP+skillMaxHp(), getSkillEffect('s_hp_max')?5:MAX_HP+skillMaxHp());
  const maxHp=activeItems.some(i=>i.effect&&i.effect.maxHp)?
    Math.min(getSkillEffect('s_hp_max')?5:99, Math.max(baseMaxHp,...activeItems.filter(i=>i.effect&&i.effect.maxHp).map(i=>i.effect.maxHp))):baseMaxHp;

  // Iron man run mod
  const ironMan=activeRunMods.includes('iron_man')||activeRunMods.includes('real_sweep');

  state={
    floor:1,score:0,hp:ironMan?1:maxHp,maxHp:ironMan?1:maxHp,gold:0,
    dead:false,won:false,floorCleared:false,
    frozenFlag:false,shielded:false,firstHitFree:false,
    perks:{},relics:{},upgrades:{},
    unlockedVariants:[],
    modifier:null,
    timerInterval:null,timerLeft:0,
    perfectFloor:true,
    combo:0,
    gemEarned:0,
    runModMult,
    noShop:activeRunMods.includes('no_shop'),
    noFlags:activeRunMods.includes('no_flags'),
    speedRun:activeRunMods.includes('speed_run'),
    fogAlways:activeRunMods.includes('fog_always'),
    hardMode:activeRunMods.includes('hard_mode'),
    noSafeZone:activeRunMods.includes('no_safe_zone'),
    eliteAlways:activeRunMods.includes('elite_always'),
    bossRush:activeRunMods.includes('boss_rush'),
    noGold:activeRunMods.includes('no_gold'),
    doubleMines:activeRunMods.includes('double_mines'),
    lightsAlways:activeRunMods.includes('lights_always'),
    noReveal:activeRunMods.includes('no_reveal')||activeRunMods.includes('pacifist'),
    cursedAlways:activeRunMods.includes('cursed_always'),
    mirrorAlways:false,
    jackpotRun:false,
    shrinkRun:activeRunMods.includes('shrink_run')||activeRunMods.includes('tiny_grid'),
    noHpRegen:activeRunMods.includes('no_hp_regen'),
    ghostAlways:activeRunMods.includes('ghost_always'),
    chainAlways:activeRunMods.includes('chain_always'),
    volatileRun:activeRunMods.includes('volatile_run'),
    noNumbers:activeRunMods.includes('no_numbers'),
    richRun:activeRunMods.includes('rich_run'),
    pacifist:activeRunMods.includes('pacifist'),
    suddenDeath:activeRunMods.includes('sudden_death'),
    usedConsumables:new Set(),
    deferredConsumables:[],
  };

  if(state.hardMode&&!ironMan){state.hp=2;state.maxHp=2;}
  if(activeRunMods.includes('no_gold')){state.gold=0;}

  // Apply equipped inventory items (with stacking and evolved effects)
  activeItems.forEach(item=>{
    if(!item.effect)return;
    const stacks=item.stackCount||1;
    if(item.effect.gold)    state.gold+=item.effect.gold*stacks;
    if(item.effect.perk)    state.perks[item.effect.perk]=true;
    if(item.effect.perk2)   state.perks[item.effect.perk2]=true;
    const upgStacks=(item.effect.upgradeStacks||1)*stacks;
    if(item.effect.upgrade) state.upgrades[item.effect.upgrade]=(state.upgrades[item.effect.upgrade]||0)+upgStacks;
    if(item.effect.maxHp&&!ironMan){state.maxHp=Math.max(state.maxHp,item.effect.maxHp);state.hp=state.maxHp;}
    if(item.effect.bonusHp&&!ironMan){state.maxHp+=item.effect.bonusHp;state.hp=state.maxHp;}
    // luckyBoost: raise lucky chance to 30%
    if(item.effect.luckyBoost) state.luckyBoost=true;
    // treasurerBoost: 30% conversion instead of 20%
    if(item.effect.treasurerBoost) state.treasurerBoost=true;
  });

  // Apply relic downsides that affect starting HP
  if(state.relics['vampirism']&&state.relics['vampirism'].downside&&!ironMan){
    state.hp=1;state.maxHp=Math.max(state.maxHp,1);
  }
  // Hard cap maxHp at 10 regardless of items/skills
  if(!ironMan) state.maxHp=Math.min(state.maxHp,10);
  state.hp=Math.min(state.hp,state.maxHp);

  // Roll floor 1 modifier — boss rush overrides, otherwise normal roll (floor 1 is never a boss)
  state.modifier=state.bossRush?rollBossModifier():rollModifier();
  clearConsumableBar();
  showModifierScreen();
}

// ═══════════════════════════════════════════════════════════════
//  FLOOR MODIFIER
// ═══════════════════════════════════════════════════════════════
function rollModifier(){
  // Floor 1 always normal; boss floors handled separately
  if(state.floor===1) return FLOOR_MODIFIERS[0];
  // Admin forced modifier
  if(forcedNextModifier){
    const id=forcedNextModifier;
    forcedNextModifier=null;
    if(id==='__chaos__'){
      const all=[...FLOOR_MODIFIERS,...BOSS_MODIFIERS].filter(m=>m.id!=='normal');
      return all[Math.floor(Math.random()*all.length)];
    }
    const found=[...FLOOR_MODIFIERS,...BOSS_MODIFIERS].find(m=>m.id===id);
    if(found)return found;
  }
  const totalWeight=FLOOR_MODIFIERS.reduce((s,m)=>s+m.weight,0);
  let r=Math.random()*totalWeight;
  for(const m of FLOOR_MODIFIERS){r-=m.weight;if(r<=0)return m;}
  return FLOOR_MODIFIERS[0];
}

function rollBossModifier(){
  return BOSS_MODIFIERS[Math.floor(Math.random()*BOSS_MODIFIERS.length)];
}

function showModifierScreen(){
  const mod=state.modifier;
  const floorLabel=document.getElementById('modifier-floor-label');
  const icon=document.getElementById('modifier-icon');
  const name=document.getElementById('modifier-name');
  const desc=document.getElementById('modifier-desc');
  const relicsEl=document.getElementById('modifier-relics');
  const box=document.getElementById('modifier-box');

  const isBoss=mod&&mod.isBoss;
  box.style.borderColor=isBoss?'#ff4466':mod&&mod.color?mod.color:'var(--border)';
  box.style.boxShadow=isBoss?'0 0 60px #ff446644':'';

  if(isBoss){
    floorLabel.textContent=`⚠ BOSS FLOOR ${state.floor} ⚠`;
    floorLabel.style.color='#ff4466';
  } else {
    floorLabel.textContent=`FLOOR ${state.floor}`;
    floorLabel.style.color='';
  }

  if(!mod||mod.id==='normal'){
    icon.textContent='💣';
    name.textContent=`FLOOR ${state.floor}`;
    name.style.color='var(--accent2)';
    desc.textContent='Standard minefield. Good luck.';
  } else {
    icon.textContent=mod.icon;
    name.textContent=mod.name;
    name.style.color=mod.color;
    desc.textContent=mod.desc;
  }

  // Show active relics
  relicsEl.innerHTML='';
  Object.keys(state.relics).forEach(rid=>{
    const r=RELICS.find(x=>x.id===rid);
    if(r){const t=document.createElement('div');t.className='modifier-relic-tag';t.textContent=`${r.icon} ${r.name}`;relicsEl.appendChild(t);}
  });

  showScreen('modifier-screen');
}

function enterFloor(){
  showScreen('game-screen',()=>{
    // Restore consumable bar from deferred list
    clearConsumableBar();
    state.deferredConsumables.forEach(entry=>{
      const item=CONSUMABLES.find(c=>c.id===(entry.id||entry));
      if(item) addConsumableToBar(item);
    });
    buildFloor();
  });
}

// ═══════════════════════════════════════════════════════════════
//  FLOOR BUILDING
// ═══════════════════════════════════════════════════════════════
function generateFloorConfig(floor){
  const base=Math.min(floor-1,6);
  let cols=7+base+Math.floor(Math.random()*3);
  let rows=7+base+Math.floor(Math.random()*3);
  const total=cols*rows;
  const minD=.10+base*.015, maxD=.18+base*.018;
  let density=minD+Math.random()*(maxD-minD);
  const mod=state.modifier;
  if(mod&&mod.id==='dense')   density*=1.3;
  if(mod&&mod.id==='shrink'||state.shrinkRun)  {cols=Math.max(6,cols-3);rows=Math.max(6,rows-3);density*=1.4;}
  if(mod&&mod.id==='boss_titan') density*=1.5;
  if(state.doubleMines) density*=2;
  if(state.jackpotRun&&!mod) {/* handled in variant map */}
  // Bonus floor: no mines at all
  if(mod&&mod.id==='bonus') return{cols,rows,mines:0};
  const mineReduction=state.upgrades['mine_sense']||0;
  const mines=Math.max(3,Math.round(cols*rows*density)-mineReduction);
  return{cols,rows,mines};
}

function buildFloor(){
  // Interest upgrade
  const iStacks=state.upgrades['gold_interest']||0;
  if(iStacks>0){const b=Math.floor(state.gold*iStacks*.04);if(b>0){state.gold+=b;flashMessage(`💹 INTEREST +💰${b}`,'#f5c842');}}

  // Relic: debt drain
  if(state.relics['debt']){state.gold=Math.max(0,state.gold-20);flashMessage('💳 DEBT -💰20','#ff6b6b');}

  // Relic: always timer
  const mod=state.modifier;
  const alwaysTimer=state.relics['timepiece']&&state.relics['timepiece'].downside;

  // Unlock bomb variant each floor (starting floor 2)
  if(state.floor>1){
    const vIdx=(state.floor-2)%BOMB_VARIANTS.length;
    const nv=BOMB_VARIANTS[vIdx];
    if(!state.unlockedVariants.includes(nv.id)) state.unlockedVariants.push(nv.id);
  }

  const cfg=generateFloorConfig(state.floor);
  const{cols,rows,mines}=cfg;
  const total=cols*rows;

  // Safe zone 3x3 top-left (unless no_safe_zone run mod)
  const safe=new Set();
  if(!state.noSafeZone){
    for(let dr=0;dr<3;dr++) for(let dc=0;dc<3;dc++) if(dr<rows&&dc<cols) safe.add(dr*cols+dc);
  }

  const mineSet=new Set();
  while(mineSet.size<mines){const idx=Math.floor(Math.random()*total);if(!safe.has(idx))mineSet.add(idx);}

  // Variants — boss modifiers override all mines to a specific type
  const mineArr=[...mineSet];
  const variantMap={};
  if(mod&&mod.id==='boss_phantom'){
    mineArr.forEach(idx=>{ variantMap[idx]='ghost'; });
  } else if(mod&&mod.id==='boss_vault'){
    mineArr.forEach(idx=>{ variantMap[idx]='bounty'; });
  } else if(mod&&mod.id==='boss_chain'){
    mineArr.forEach(idx=>{ variantMap[idx]='chain'; });
  } else if(mod&&mod.id==='jackpot'||state.jackpotRun){
    mineArr.forEach(idx=>{ variantMap[idx]=Math.random()<.5?'gold':'bounty'; });
  } else if(state.ghostAlways){
    mineArr.forEach(idx=>{ variantMap[idx]='ghost'; });
  } else if(state.chainAlways){
    mineArr.forEach(idx=>{ variantMap[idx]='chain'; });
  } else if(state.unlockedVariants.length>0){
    const vCount=Math.max(1,Math.floor(mines*.3));
    mineArr.slice().sort(()=>Math.random()-.5).slice(0,vCount).forEach(idx=>{
      variantMap[idx]=state.unlockedVariants[Math.floor(Math.random()*state.unlockedVariants.length)];
    });
  }

  const cells=Array.from({length:total},(_,i)=>({
    mine:mineSet.has(i),variant:variantMap[i]||null,
    revealed:false,flagged:false,adjacent:0,
  }));
  for(let i=0;i<total;i++)
    if(!cells[i].mine) cells[i].adjacent=getNeighbors(i,cols,rows).filter(n=>cells[n].mine).length;

  state.grid={cells,cols,rows,mines};
  state.perfectFloor=true;
  state.combo=0;
  state.floorCleared=false;

  // Perks on floor start
  if(state.perks['shield']||getSkillEffect('s_combat5')) state.shielded=true;
  if(mod&&mod.id==='peaceful') state.firstHitFree=true;
  // Frozen modifier: disable flagging this floor
  state.frozenFloor=(mod&&mod.id==='frozen')||false;
  // Bonus floor: tiles reveal with a wave after render — handled post-render below
  state.bonusFloor=(mod&&mod.id==='bonus')||false;
  // Rich vein / rich run: track for gold per reveal
  state.richFloor=(mod&&mod.id==='rich')||state.richRun||false;

  if(alwaysTimer&&(!mod||mod.id!=='rush')) startTimer(180);
  else if(mod&&mod.id==='rush') startTimer(90+(state.relics['timepiece']?120:0));
  else if(mod&&mod.id==='boss_clock') startTimer(60);
  else if(state.speedRun) startTimer(60);
  else stopTimer();

  // Sudden death: tick HP every 30s
  if(state.suddenDeath){
    state.suddenDeathInterval=setInterval(()=>{
      if(state.dead||state.won||state.floorCleared)return;
      state.hp=Math.max(0,state.hp-1);
      flashMessage('⏰ SUDDEN DEATH −1 HP','#e94560');
      screenShake(6,300);render();
      if(state.hp<=0)setTimeout(triggerDeath,400);
    },30000);
  }

  // Healing modifier: track tiles for HP restore
  state.healingTilesRevealed=0;

  // Cartographer perk: reveal 3 random safe tiles
  if(state.perks['cartographer']){
    const hidden=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);
    hidden.sort(()=>Math.random()-.5).slice(0,3).forEach(i=>{cells[i].revealed=true;});
  }

  // Scout upgrade: reveal extra safe tiles
  const scoutStacks=state.upgrades['scout']||0;
  if(scoutStacks>0){
    const hidden=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);
    hidden.sort(()=>Math.random()-.5).slice(0,scoutStacks).forEach(i=>{cells[i].revealed=true;});
  }

  // Apply deferred consumables from previous shop visit
  if(state.deferredConsumables&&state.deferredConsumables.length>0){
    state.deferredConsumables.forEach(entry=>{
      const id=entry.id||entry; // handle both formats
      switch(id){
        case 'reveal_5':{const h=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);h.sort(()=>Math.random()-.5).slice(0,5).forEach(i=>{cells[i].revealed=true;});break;}
        case 'defuse_3':{const u=cells.map((_,i)=>i).filter(i=>cells[i].mine&&!cells[i].flagged);u.sort(()=>Math.random()-.5).slice(0,3).forEach(i=>{cells[i].flagged=true;});break;}
        case 'nuke':cells.forEach(c=>{if(!c.mine)c.revealed=true;});break;
        case 'reveal_row':{
          const safeRows=[...new Set(cells.map((_,i)=>Math.floor(i/state.grid.cols)).filter(r=>!cells.slice(r*state.grid.cols,(r+1)*state.grid.cols).some(c=>c.mine)))];
          if(safeRows.length){const row=safeRows[Math.floor(Math.random()*safeRows.length)];for(let c=0;c<state.grid.cols;c++)cells[row*state.grid.cols+c].revealed=true;}
          break;
        }
        case 'swap':{
          const mines=cells.map((_,i)=>i).filter(i=>cells[i].mine&&!cells[i].revealed&&!cells[i].flagged);
          const safe=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);
          mines.sort(()=>Math.random()-.5).slice(0,2).forEach(mi=>{
            const si=safe.splice(Math.floor(Math.random()*safe.length),1)[0];
            if(si===undefined)return;
            cells[mi].mine=false;cells[si].mine=true;cells[mi].variant=null;
          });
          for(let i=0;i<cells.length;i++) if(!cells[i].mine) cells[i].adjacent=getNeighbors(i,state.grid.cols,state.grid.rows).filter(n=>cells[n].mine).length;
          break;
        }
      }
    });
    state.deferredConsumables=[];
    clearConsumableBar();
  }

  // Equipped items: revealStart / defuseStart (scaled by stackCount)
  equippedSlots.filter(Boolean).forEach(item=>{
    const stacks=item.stackCount||1;
    if(item.effect&&item.effect.revealStart&&state.floor===1){
      const hidden=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);
      hidden.sort(()=>Math.random()-.5).slice(0,item.effect.revealStart*stacks).forEach(i=>{cells[i].revealed=true;});
    }
    if(item.effect&&item.effect.defuseStart&&state.floor===1){
      const unflagged=cells.map((_,i)=>i).filter(i=>cells[i].mine&&!cells[i].flagged);
      unflagged.sort(()=>Math.random()-.5).slice(0,item.effect.defuseStart*stacks).forEach(i=>{cells[i].flagged=true;});
    }
  });

  // Elite always run mod
  const eliteAlwaysMod=state.eliteAlways;

  // Cursed eye relic: mines near revealed cells shown dynamically in render()

  floodReveal(0);
  updateBombLegend();
  updateModifierBanner();
  render();

  // Pop-in
  const gridEl=document.getElementById('grid');
  Array.from(gridEl.children).forEach((el,i)=>{
    el.classList.add('popin');
    el.style.animationDelay=`${Math.min(i*4,300)}ms`;
    setTimeout(()=>{el.classList.remove('popin');el.style.animationDelay='';},Math.min(i*4,300)+250);
  });

  // Bonus floor: wave-reveal all tiles after pop-in, then auto-clear
  if(state.bonusFloor){
    flashMessage('⭐ BONUS FLOOR — no mines! Collecting score...','#f5c842');
    const total=cells.length;
    cells.forEach((_,i)=>{
      setTimeout(()=>{
        cells[i].revealed=true;
        render();
        if(i===total-1){
          // All revealed — trigger clear after a beat
          setTimeout(()=>checkFloorClear(),400);
        }
      }, 600 + i*18);
    });
  }
}

function getNeighbors(idx,cols,rows){
  const r=Math.floor(idx/cols),c=idx%cols,out=[];
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc)continue;
    const nr=r+dr,nc=c+dc;
    if(nr>=0&&nr<rows&&nc>=0&&nc<cols)out.push(nr*cols+nc);
  }
  return out;
}
function floodReveal(startIdx){
  const{cells,cols,rows}=state.grid;
  const visited=new Set();
  function visit(idx){
    if(visited.has(idx))return;visited.add(idx);
    const cell=cells[idx];if(cell.mine)return;
    cell.revealed=true;cell.flagged=false;
    if(cell.adjacent===0) for(const n of getNeighbors(idx,cols,rows))visit(n);
  }
  visit(startIdx);
}

// ── Timer ─────────────────────────────────────────────────────
function startTimer(seconds){
  stopTimer();
  state.timerLeft=seconds;
  document.getElementById('hud-timer-block').style.display='flex';
  updateTimerDisplay();
  state.timerInterval=setInterval(()=>{
    state.timerLeft--;
    updateTimerDisplay();
    if(state.timerLeft<=0){
      stopTimer();
      state.hp--;
      flashMessage('⏱️  TIME\'S UP  −1 HP','#f5a623');
      screenShake(6,300);
      render();
      if(state.hp<=0) setTimeout(triggerDeath,400);
    }
  },1000);
}
function stopTimer(){
  if(state.timerInterval){clearInterval(state.timerInterval);state.timerInterval=null;}
  document.getElementById('hud-timer-block').style.display='none';
}
function updateTimerDisplay(){
  const el=document.getElementById('hud-timer');
  const m=Math.floor(state.timerLeft/60),s=state.timerLeft%60;
  el.textContent=`${m}:${s.toString().padStart(2,'0')}`;
  el.className='hud-val'+(state.timerLeft<=15?' timer-danger':'');
}

// ═══════════════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════════════
function onReveal(idx){
  if(state.dead||state.won)return;
  const{cells,cols,rows}=state.grid;
  const cell=cells[idx];
  if(cell.revealed||cell.flagged)return;

  if(cell.mine){
    cell.revealed=true;
    const el=getCellEl(idx);const{cx,cy}=cellCenter(el);

    // Lucky perk (luckyBoost raises chance to 30%)
    if(state.perks['lucky']&&Math.random()<(state.luckyBoost?.30:.10)){
      canvasExplode(cx,cy,160,16);flashMessage('🍀  LUCKY — mine ignored!','#4ecca3');render();return;
    }
    // Gambler perk
    if(state.perks['gambler']){
      if(Math.random()<.5){canvasExplode(cx,cy,160,16);flashMessage('🎲  GAMBLER — dodged!','#4ecca3');render();return;}
      else{state.hp=Math.max(0,state.hp-2);canvasExplode(cx,cy,350,32);screenShake(14,500);flashMessage('🎲  GAMBLER — double damage!','#e94560');render();if(state.hp<=0)setTimeout(triggerDeath,400);return;}
    }
    // Shield
    if(state.shielded){
      state.shielded=false;canvasExplode(cx,cy,200,20);flashMessage('🛡️  SHIELD ABSORBED!','#4ecca3');render();return;
    }
    // First hit free (peaceful modifier)
    if(state.firstHitFree){
      state.firstHitFree=false;canvasExplode(cx,cy,160,16);flashMessage('🕊️  PEACEFUL — first hit free!','#4ecca3');render();return;
    }

    // Damage calculation
    let dmg=1;
    if(state.modifier&&state.modifier.id==='cursed') dmg=2;
    if(state.cursedAlways) dmg=2;
    if(state.relics['cursed_eye']&&state.relics['cursed_eye'].downside) dmg=2;
    if(state.relics['glass_cannon']) {state.hp=0;dmg=0;}
    // Bounty mine: -2 HP normally, but only -1 on boss_vault (all mines are bounty there)
    if(cell.variant==='bounty') dmg=state.modifier&&state.modifier.id==='boss_vault'?1:Math.min(state.hp,2);
    // Volatile modifier: chain all adjacent mines
    if((state.volatileRun||(state.modifier&&state.modifier.id==='volatile'))&&dmg>0){
      const nb=getNeighbors(idx,cols,rows).filter(n=>cells[n].mine&&!cells[n].revealed);
      nb.forEach(n=>{cells[n].revealed=true;state.hp=Math.max(0,state.hp-1);});
      if(nb.length>0) setTimeout(()=>flashMessage(`💥 VOLATILE — ${nb.length} chain!`,'#ff7043'),300);
    }
    // Armor upgrade: reduce damage
    const armorStacks=state.upgrades['armor']||0;
    if(armorStacks>0) dmg=Math.max(1,dmg-armorStacks);
    // Iron crown relic: wrong flag damage handled in onFlag
    // Vampirism relic: handled in checkFloorClear

    state.hp=Math.max(0,state.hp-dmg);
    state.score=Math.max(0,state.score-50);
    state.perfectFloor=false;
    state.combo=0;
    canvasExplode(cx,cy,350,32);
    screenShake(10,400);
    playsfx('explode');
    flashMessage(`💥  MINE HIT  −${dmg} HP  −50`,'#e94560');

    // Variant effects
    if(cell.variant==='scatter'){
      const hidden=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);
      hidden.sort(()=>Math.random()-.5).slice(0,3).forEach(i=>{cells[i].revealed=true;});
      setTimeout(()=>flashMessage('💥  SCATTER — 3 tiles revealed!','#fa0'),400);
    }
    if(cell.variant==='freeze'){state.frozenFlag=true;setTimeout(()=>flashMessage('🧊  FROZEN — next flag earns no gold!','#7af'),400);}
    if(cell.variant==='chain'){
      const nb=getNeighbors(idx,cols,rows).filter(n=>cells[n].mine&&!cells[n].revealed);
      if(nb.length>0){const t=nb[Math.floor(Math.random()*nb.length)];cells[t].revealed=true;state.hp=Math.max(0,state.hp-1);setTimeout(()=>flashMessage('🔗  CHAIN REACTION!','#f44'),400);}
    }

    render();
    if(state.hp<=0)setTimeout(triggerDeath,400);
    return;
  }

  // Safe tile
  const el=getCellEl(idx);const{cx,cy}=cellCenter(el);
  const before=cells.filter(c=>c.revealed).length;
  if(state.noReveal){
    // Silent field: only reveal the clicked tile, no flood
    cells[idx].revealed=true;
  } else {
    floodReveal(idx);
  }
  const after=cells.filter(c=>c.revealed).length;
  const newTiles=after-before;

  state.combo+=newTiles;
  const comboBonus=(state.upgrades['combo_boost']||0)*6*Math.max(0,newTiles-1);
  const hpMult=state.perks['berserker']?state.hp:1;
  const scoreMult=state.relics['glass_cannon']?3:1;
  const baseScore=10+(state.upgrades['score_boost']||0)*4+(state.perks['double_score']?10:0)+(getSkillEffect('s_score1')?5:0);
  const adminMult=state._score2xFloor?2:1;
  const scoreGain=Math.round((baseScore+comboBonus)*hpMult*scoreMult*adminMult);
  state.score+=scoreGain;

  // Scavenger perk
  if(state.perks['scavenger']&&Math.floor(after/10)>Math.floor(before/10)){
    state.gold+=10;spawnPopup(cx,cy-20,'+💰10','#f5c842');
  }

  spawnPopup(cx,cy,`+${scoreGain}`,'#4ecca3');
  playsfx('reveal');

  // Rich floor / gold_finder upgrade: gold per reveal
  if(state.richFloor){state.gold+=3;spawnPopup(cx,cy-18,'+💰3','#f5c842');}

  // Healing modifier: restore 1 HP every 10 safe tiles revealed
  if(state.modifier&&state.modifier.id==='healing'){
    state.healingTilesRevealed=(state.healingTilesRevealed||0)+newTiles;
    const heals=Math.floor(state.healingTilesRevealed/10);
    if(heals>0){
      state.healingTilesRevealed%=10;
      state.hp=Math.min(state.hp+heals,state.maxHp);
      flashMessage('💚 HEALING +1 HP','#4ecca3');
    }
  }

  render();
  if(newTiles>=3)rippleReveal(cells,cols,idx);
  checkFloorClear();
}

function onFlag(idx){
  if(state.dead||state.won)return;
  if(state.noFlags||state.frozenFloor)return;
  const{cells}=state.grid;
  const cell=cells[idx];
  if(cell.revealed)return;
  cell.flagged=!cell.flagged;
  if(cell.flagged){
    const el=getCellEl(idx);const{cx,cy}=cellCenter(el);flagSparkle(cx,cy);
    playsfx('flag');
    // Boss clock: correct flag adds 5 seconds
    if(state.modifier&&state.modifier.id==='boss_clock'&&cell.mine){
      state.timerLeft+=5;updateTimerDisplay();
      spawnPopup(cx,cy-20,'+5s','#f5a623');
    }
    // Iron crown relic: wrong flag deals 1 HP
    if(!cell.mine&&state.relics['iron_crown']){
      state.hp=Math.max(0,state.hp-1);
      flashMessage('👑 IRON CROWN — wrong flag! −1 HP','#e94560');
      screenShake(6,300);render();
      if(state.hp<=0){setTimeout(triggerDeath,400);return;}
    }
    // Iron crown relic: correct flag +50 score
    if(cell.mine&&state.relics['iron_crown']){
      state.score+=50;spawnPopup(cx,cy-20,'+50','#f5c842');
    }
  }
  render();
}

// ═══════════════════════════════════════════════════════════════
//  FLOOR CLEAR
// ═══════════════════════════════════════════════════════════════
function checkFloorClear(){
  const{cells}=state.grid;
  if(!cells.every(c=>c.mine||c.revealed))return;
  if(state.floorCleared)return;
  state.floorCleared=true;

  stopTimer();
  const bonus=200+state.floor*50;
  state.score+=bonus;
  // Boss titan clear bonus
  if(state.modifier&&state.modifier.id==='boss_titan'){
    state.score+=300;flashMessage('💥 TITAN CLEARED! +300 BONUS','#ff4466');
  }

  // Base gold from field size (small=100, medium=150, large=250)
  const total=state.grid.cols*state.grid.rows;
  const fieldBonus=state.noGold?0:total<80?100:total<150?150:250;
  state.gold+=fieldBonus;

  // Flag accuracy gold
  let correct=0,wrong=0,goldBombs=0,bountyBombs=0;
  cells.forEach(c=>{
    if(!c.flagged)return;
    if(c.mine){
      correct++;
      if(c.variant==='gold') goldBombs++;
      if(c.variant==='bounty') bountyBombs++;
    } else wrong++;
  });

  const noCorrectGold=state.relics['mirror']&&state.relics['mirror'].downside;
  const wrongFlagGold=state.relics['mirror']?5:0;
  const goldMod=state.modifier&&state.modifier.id==='goldmine'?2:1;
  const base=10+(state.upgrades['flag_bonus']||0)*4+(state.perks['gold_magnet']?(getSkillEffect('s_combat2')?8:5):0);
  const regularGold=noCorrectGold?0:(correct-goldBombs-bountyBombs)*base*goldMod;
  const goldBombGold=noCorrectGold?0:goldBombs*(30+base+(getSkillEffect('s_combat3')?15:0))*goldMod;
  const bountyBombGold=noCorrectGold?0:bountyBombs*(50+base)*goldMod;
  const wrongGold=wrong*wrongFlagGold;
  const wrongPenalty=(noCorrectGold||getSkillEffect('s_combat4'))?0:wrong*10;
  const goldEarned=state.noGold?0:Math.max(0,regularGold+goldBombGold+bountyBombGold+wrongGold-wrongPenalty);
  state.gold+=goldEarned;

  // Gold Finder upgrade: flat bonus per floor cleared
  const gfStacks=state.upgrades['gold_finder']||0;
  if(gfStacks>0&&!state.noGold){
    const gfBonus=gfStacks*15;
    state.gold+=gfBonus;
    flashMessage(`🧲 GOLD FINDER +💰${gfBonus}`,'#f5c842');
  }

  // Clear sudden death interval
  if(state.suddenDeathInterval){clearInterval(state.suddenDeathInterval);state.suddenDeathInterval=null;}

  // Perfect floor bonus
  if(state.perfectFloor){
    let perfBonus=getSkillEffect('s_score4')?200:100;
    // Cursed dice relic: x2 on perfect
    if(state.relics['cursed_dice']) perfBonus*=2;
    state.score+=perfBonus;
    flashMessage(`✨ PERFECT FLOOR! +${perfBonus} score`,'#f5c842');
    if(state.perks['medic']||getSkillEffect('s_regen1')){state.hp=Math.min(state.hp+1,state.maxHp);flashMessage('💉 MEDIC +1 HP','#4ecca3');}
    // Vampirism relic: +1 HP on perfect
    if(state.relics['vampirism']){state.hp=Math.min(state.hp+1,state.maxHp);flashMessage('🧛 VAMPIRISM +1 HP','#b07aff');}
  } else {
    // Cursed dice relic: x0.5 on imperfect
    if(state.relics['cursed_dice']) state.score=Math.round(state.score*0.5);
  }

  // HP regen upgrade
  const hpRegen=state.upgrades['hp_regen']||0;
  if(hpRegen>0) state.hp=Math.min(state.hp+hpRegen,state.maxHp);

  if(goldEarned>0||fieldBonus>0) setTimeout(()=>flashMessage(`🚩 ${correct} correct, ${wrong} wrong → +💰${goldEarned}  📐 field +💰${fieldBonus}`,'#f5c842'),state.perfectFloor?1200:400);

  const gridEl=document.getElementById('grid');const gr=gridEl.getBoundingClientRect();
  for(let i=0;i<6;i++) setTimeout(()=>canvasExplode(gr.left+Math.random()*gr.width,gr.top+Math.random()*gr.height,160,20),i*80);

  setTimeout(()=>flashMessage(`✔  FLOOR ${state.floor} CLEARED  +${bonus}`,'#4ecca3'),1400);

  // Earn gems from run progress — scaled by run modifier multiplier
  const gemGain=Math.round((state.floor*3+2)*(state.runModMult||1)*(getSkillEffect('s_score5')?1.5:1)*(gems2xActive?2:1));
  gems+=gemGain;state.gemEarned+=gemGain;saveGems();updateMenuDisplay();

  // Earn EXP — base 10 per floor, scaled by multiplier
  const expGain=Math.round((10+state.floor*2)*(state.runModMult||1));
  playerExp+=expGain;saveExp();

  // Skip shop if no_shop run modifier
  if(state.noShop){
    setTimeout(()=>nextFloor(),2400);
  } else {
    setTimeout(()=>openShop(),2400);
  }
}

// ═══════════════════════════════════════════════════════════════
//  SHOP
// ═══════════════════════════════════════════════════════════════
function openShop(){
  state.usedConsumables=new Set();
  currentShopTab=0;setShopTab(0);
  document.getElementById('shop-subtitle').textContent=`Floor ${state.floor} cleared — spend wisely`;
  document.getElementById('next-floor-num').textContent=state.floor+1;
  document.getElementById('shop-gold-display').textContent=`💰 ${state.gold}`;

  const extra=skillShopExtra();
  buildShopSection('shop-perks',    pickRandom(PERKS,6+extra),       'perk-card',    buildPerkCard);
  buildShopSection('shop-relics', pickRandomRelics(3), 'relic-card', buildRelicCard);
  buildShopSection('shop-oneuse',   pickRandom(CONSUMABLES,6+extra), 'use-card',     buildUseCard);
  buildShopSection('shop-upgrades', pickRandom(UPGRADES,6+extra),    'upgrade-card', buildUpgradeCard);

  showScreen('shop-screen');
}

function pickRandom(arr,n){return arr.slice().sort(()=>Math.random()-.5).slice(0,n);}

// Relics: rare:true items only appear ~20% of the time
function pickRandomRelics(n){
  const pool=RELICS.filter(r=>!r.rare||Math.random()<0.20);
  return pool.slice().sort(()=>Math.random()-.5).slice(0,n);
}

function buildShopSection(id,items,cls,builder){
  const c=document.getElementById(id);c.innerHTML='';
  items.forEach(item=>c.appendChild(builder(item,cls)));
}

function makeCard(item,cls,extraHtml,onBuy){
  const owned=state.perks[item.id]||state.relics[item.id];
  const stacks=state.upgrades[item.id]||0;
  const maxed=item.maxStack&&stacks>=item.maxStack;
  const usedOnce=item.oneUse&&state.usedConsumables&&state.usedConsumables.has(item.id);
  const soldOut=owned||maxed||usedOnce;
  // Upgrades scale in cost: each stack adds 25% to base cost
  const scaledCost=item.maxStack?Math.round(item.cost*(1+stacks*0.25)):item.cost;
  // Bulk buy skill: upgrades 10% cheaper
  const discount=getSkillEffect('s_shop4')?0.9:1;
  const effectiveCost=Math.max(1,Math.round(scaledCost*discount));
  const canAfford=state.gold>=effectiveCost&&!soldOut;
  const card=document.createElement('div');
  card.className=`shop-card ${cls}${soldOut?' sold-out':''}${!canAfford&&!soldOut?' cant-afford':''}`;
  card.innerHTML=`
    <div class="card-top"><div class="card-icon">${item.icon}</div>
    <div><div class="card-name">${item.name}</div>
    <div class="card-tag">${soldOut?(owned?'OWNED':usedOnce?'USED':'MAXED'):item.tag||''}</div></div></div>
    <div class="card-desc">${item.desc}</div>
    ${extraHtml||''}
    <div class="card-footer">
      <div class="card-stack">${item.maxStack?`${stacks}/${item.maxStack}`:''}${stacks>0&&!item.maxStack?`x${stacks}`:''}</div>
      <button class="card-buy" ${canAfford?'':'disabled'}>${effectiveCost===0?'FREE':'💰'+effectiveCost}</button>
    </div>`;
  card.querySelector('.card-buy').addEventListener('click',(e)=>{
    if(state.gold<effectiveCost)return;
    state.gold-=effectiveCost;
    playsfx('buy');
    document.getElementById('shop-gold-display').textContent=`💰 ${state.gold}`;
    onBuy(item,card);
    refreshShopAffordability();
    // Buy VFX
    const btn=e.currentTarget;
    const r=btn.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    const hue=cls.includes('perk')?280:cls.includes('relic')?350:cls.includes('use')?160:45;
    canvasExplode(cx,cy,hue,18);
    shockwaves.push({x:cx,y:cy,r:4,speed:5,hue,life:.8});
    // Coin scatter
    for(let i=0;i<6;i++){
      const a=Math.random()*Math.PI*2,s=2+Math.random()*4;
      fxParticles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,r:3,hue:45,life:1,decay:.035});
    }
    btn.style.transform='scale(0.88)';
    setTimeout(()=>{btn.style.transform='';},150);
  });
  return card;
}

function buildPerkCard(item,cls){
  return makeCard(item,cls,'',(item,card)=>{
    state.perks[item.id]=true;
    if(item.id==='shield') state.shielded=true;
    // Mark card as owned
    card.classList.add('sold-out');
    const btn=card.querySelector('.card-buy');if(btn)btn.disabled=true;
    const tag=card.querySelector('.card-tag');if(tag)tag.textContent='OWNED';
  });
}
function buildRelicCard(item,cls){
  return makeCard(item,cls,`<div class="card-curse">⚠ ${item.curse}</div>`,(item,card)=>{
    state.relics[item.id]={effect:item.effect,downside:true};
    if(item.effect.startGold){state.gold+=item.effect.startGold;document.getElementById('shop-gold-display').textContent=`💰 ${state.gold}`;}
    if(item.effect.seeAll){state.grid.cells.forEach(c=>{if(c.mine)c._visible=true;});render();}
    if(item.downside&&item.downside.maxHp){state.maxHp=Math.min(state.maxHp,item.downside.maxHp);state.hp=Math.min(state.hp,state.maxHp);}
    card.classList.add('sold-out');
    const btn=card.querySelector('.card-buy');if(btn)btn.disabled=true;
    const tag=card.querySelector('.card-tag');if(tag)tag.textContent='OWNED';
  });
}
function buildUpgradeCard(item,cls){
  return makeCard(item,cls,'',(item,card)=>{
    state.upgrades[item.id]=(state.upgrades[item.id]||0)+1;
    const stacks=state.upgrades[item.id];
    const maxed=item.maxStack&&stacks>=item.maxStack;
    if(maxed){
      card.classList.add('sold-out');
      const btn=card.querySelector('.card-buy');if(btn)btn.disabled=true;
      const tag=card.querySelector('.card-tag');if(tag)tag.textContent='MAXED';
    } else {
      // Update button to show next stack cost
      const nextCost=Math.round(item.cost*(1+stacks*0.25)*(getSkillEffect('s_shop4')?0.9:1));
      const btn=card.querySelector('.card-buy');
      if(btn&&!btn.disabled) btn.textContent=`💰${nextCost}`;
    }
    const stackEl=card.querySelector('.card-stack');
    if(stackEl&&item.maxStack) stackEl.textContent=`${stacks}/${item.maxStack}`;
  });
}
function buildUseCard(item,cls){
  return makeCard(item,cls,'',(it,card)=>{
    if(it.oneUse) state.usedConsumables.add(it.id);

    // Deferred consumables — add to in-game bar
    if(it.deferred){
      state.deferredConsumables.push({id:it.id,item:it});
      addConsumableToBar(it);
      card.classList.add('sold-out');
      const btn=card.querySelector('.card-buy');if(btn)btn.disabled=true;
      const tag=card.querySelector('.card-tag');if(tag)tag.textContent='IN BAR';
      return;
    }

    // Instant consumables
    switch(it.id){
      case 'extra_life': state.hp=Math.min(state.hp+1,state.maxHp);break;
      case 'gold_rush':  state.gold+=60;document.getElementById('shop-gold-display').textContent=`💰 ${state.gold}`;break;
      case 'time_warp':  state.hp=Math.min(state.hp+1,state.maxHp);break;
    }
    if(it.oneUse&&card){
      card.classList.add('sold-out');
      const btn=card.querySelector('.card-buy');if(btn)btn.disabled=true;
      const tag=card.querySelector('.card-tag');if(tag)tag.textContent='USED';
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//  IN-GAME CONSUMABLE BAR
// ═══════════════════════════════════════════════════════════════
function addConsumableToBar(item){
  const bar=document.getElementById('consumable-bar');
  if(!bar)return;
  const btn=document.createElement('button');
  btn.className='consumable-btn';
  btn.title=`${item.name}: ${item.desc}`;
  btn.innerHTML=`<span class="cb-icon">${item.icon}</span><span class="cb-name">${item.name}</span>`;
  btn.addEventListener('click',()=>{
    if(state.dead||state.won)return;
    useConsumableInGame(item.id);
    btn.remove();
    // Remove from deferred list
    state.deferredConsumables=state.deferredConsumables.filter(e=>(e.id||e)!==item.id);
    flashMessage(`${item.icon} ${item.name} used!`,'#4ecca3');
    render();
  });
  bar.appendChild(btn);
}

function useConsumableInGame(id){
  const{cells}=state.grid;
  if(!cells)return;
  switch(id){
    case 'reveal_5':{const h=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);h.sort(()=>Math.random()-.5).slice(0,5).forEach(i=>{cells[i].revealed=true;});break;}
    case 'defuse_3':{const u=cells.map((_,i)=>i).filter(i=>cells[i].mine&&!cells[i].flagged);u.sort(()=>Math.random()-.5).slice(0,3).forEach(i=>{cells[i].flagged=true;});break;}
    case 'nuke':cells.forEach(c=>{if(!c.mine)c.revealed=true;});break;
    case 'reveal_row':{
      const cols=state.grid.cols;
      const safeRows=[...new Set(cells.map((_,i)=>Math.floor(i/cols)).filter(r=>{
        const rowCells=cells.slice(r*cols,(r+1)*cols);
        return !rowCells.some(c=>c.mine)&&rowCells.some(c=>!c.revealed);
      }))];
      if(safeRows.length){const row=safeRows[Math.floor(Math.random()*safeRows.length)];for(let c=0;c<cols;c++)cells[row*cols+c].revealed=true;}
      break;
    }
    case 'swap':{
      const mines=cells.map((_,i)=>i).filter(i=>cells[i].mine&&!cells[i].revealed&&!cells[i].flagged);
      const safe=cells.map((_,i)=>i).filter(i=>!cells[i].mine&&!cells[i].revealed);
      mines.sort(()=>Math.random()-.5).slice(0,2).forEach(mi=>{
        const si=safe.splice(Math.floor(Math.random()*safe.length),1)[0];
        if(si===undefined)return;
        cells[mi].mine=false;cells[si].mine=true;cells[mi].variant=null;
      });
      for(let i=0;i<cells.length;i++) if(!cells[i].mine) cells[i].adjacent=getNeighbors(i,state.grid.cols,state.grid.rows).filter(n=>cells[n].mine).length;
      break;
    }
  }
  checkFloorClear();
}

function clearConsumableBar(){
  const bar=document.getElementById('consumable-bar');
  if(bar) bar.innerHTML='';
}

function refreshShopAffordability(){
  document.querySelectorAll('.card-buy').forEach(btn=>{
    if(btn.disabled)return;
    const t=btn.textContent.trim();
    if(t==='FREE')return;
    const cost=parseInt(t.replace(/\D/g,''));
    if(state.gold<cost)btn.disabled=true;
  });
}

function nextFloor(){
  state.floor++;
  if(!state.noHpRegen) state.hp=Math.min(state.hp+1,state.maxHp);
  state.modifier=state.bossRush?rollBossModifier():(state.floor%3===0?rollBossModifier():rollModifier());
  showModifierScreen();
}

// ═══════════════════════════════════════════════════════════════
//  DEATH / WIN
// ═══════════════════════════════════════════════════════════════
function triggerDeath(){
  stopTimer();
  state.dead=true;
  state.grid.cells.forEach(c=>{if(c.mine)c.revealed=true;});
  render();
  const gr=document.getElementById('grid').getBoundingClientRect();
  for(let i=0;i<8;i++) setTimeout(()=>canvasExplode(gr.left+Math.random()*gr.width,gr.top+Math.random()*gr.height,350,22),i*60);
  setTimeout(()=>showEndScreen(false),900);
}

function showEndScreen(win){
  stopTimer();
  // Treasurer perk: convert gold to score (treasurerBoost = 30% instead of 20%)
  if(state.perks['treasurer']){const rate=state.treasurerBoost?.30:.20;const bonus=Math.floor(state.gold*rate);state.score+=bonus;}
  // Apply run modifier multiplier (poverty run reduces it by 0.3)
  const effectiveMult=state.noGold
    ? Math.max(0.1, state.runModMult-0.3)
    : state.runModMult;
  if(effectiveMult&&effectiveMult!==1){
    state.score=Math.round(state.score*effectiveMult);
  }
  if(state.score>bestScore){bestScore=state.score;localStorage.setItem('mf_best',bestScore);}

  // Track runs completed
  runsCompleted++;saveRuns();updateMenuDisplay();

  document.getElementById('end-icon').textContent=win?'🏆':'💀';
  const title=document.getElementById('end-title');
  title.textContent=win?'YOU WIN':'YOU DIED';title.className=win?'win':'death';
  document.getElementById('end-stats').innerHTML=`
    <div>Score &nbsp;<span>${state.score}</span>${state.runModMult>1?` <span style="color:var(--accent);font-size:.75rem">(×${state.runModMult.toFixed(1)} run mod)</span>`:''}</div>
    <div>Floor reached &nbsp;<span>${state.floor}</span></div>
    <div>Gold &nbsp;<span>💰${state.gold}</span></div>
    <div>Gems earned &nbsp;<span>💎${state.gemEarned}</span></div>
    <div>Best &nbsp;<span>${bestScore}</span></div>`;

  const perksEl=document.getElementById('end-perks-display');perksEl.innerHTML='';
  Object.keys(state.perks).forEach(k=>{
    const p=PERKS.find(i=>i.id===k);
    if(p){const t=document.createElement('div');t.className='end-perk-tag';t.textContent=`${p.icon} ${p.name}`;perksEl.appendChild(t);}
  });
  Object.keys(state.relics).forEach(k=>{
    const r=RELICS.find(i=>i.id===k);
    if(r){const t=document.createElement('div');t.className='end-relic-tag';t.textContent=`${r.icon} ${r.name}`;perksEl.appendChild(t);}
  });
  Object.keys(state.upgrades).forEach(k=>{
    const u=UPGRADES.find(i=>i.id===k);
    if(u){const t=document.createElement('div');t.className='end-perk-tag';t.textContent=`${u.icon} ${u.name} x${state.upgrades[k]}`;perksEl.appendChild(t);}
  });

  showScreen('end-screen');
  updateMenuDisplay();
}

// ═══════════════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════════════
function render(){
  if(!state.grid)return;
  const{cells,cols,mines}=state.grid;

  document.getElementById('hud-floor').textContent=state.floor;
  document.getElementById('hud-score').textContent=state.score.toLocaleString();
  document.getElementById('hud-mines').textContent=state.grid.mines;
  // HP as colored heart spans
  const hpEl=document.getElementById('hud-hp');
  hpEl.innerHTML='<span class="hearts-full">'+('♥'.repeat(Math.max(0,state.hp)))+'</span>'
    +'<span class="hearts-empty">'+('♡'.repeat(Math.max(0,state.maxHp-state.hp)))+'</span>';
  document.getElementById('hud-gold').textContent=`💰 ${state.gold}`;

  const gridEl=document.getElementById('grid');
  gridEl.style.gridTemplateColumns=`repeat(${cols},44px)`;

  if(gridEl.children.length!==cells.length){
    gridEl.innerHTML='';
    gridEl.style.transform=''; // reset mirror on rebuild
    for(let i=0;i<cells.length;i++){
      const el=document.createElement('div');el.className='cell';
      el.addEventListener('click',()=>onReveal(i));
      el.addEventListener('contextmenu',e=>{e.preventDefault();onFlag(i);});
      // Mobile touch support
      let touchTimer=null;
      el.addEventListener('touchstart',e=>{
        e.preventDefault();
        if(mobileFlagMode){onFlag(i);return;}
        touchTimer=setTimeout(()=>{touchTimer=null;onFlag(i);},400);
      },{passive:false});
      el.addEventListener('touchend',e=>{
        e.preventDefault();
        if(touchTimer){clearTimeout(touchTimer);touchTimer=null;onReveal(i);}
      },{passive:false});
      el.addEventListener('touchmove',e=>{
        if(touchTimer){clearTimeout(touchTimer);touchTimer=null;}
      },{passive:false});
      gridEl.appendChild(el);
    }
  }

  const foggy=(state.modifier&&state.modifier.id==='foggy')||state.fogAlways;
  const elite=state.modifier&&state.modifier.id==='elite';
  const darkness=(state.modifier&&state.modifier.id==='darkness')||state.lightsAlways;
  const mirrorField=(state.modifier&&state.modifier.id==='mirror')||state.mirrorAlways;

  // Mirror: flip the whole grid via CSS, individual cells counter-flip text
  gridEl.style.transform=mirrorField?'scaleX(-1)':'';

  cells.forEach((cell,i)=>{
    const el=gridEl.children[i];  // always use direct index — mirror is CSS-only
    if(!el)return;
    el.className='cell';el.textContent='';el.style.color='';el.style.fontSize='';el.style.opacity='';el.style.boxShadow='';el.style.pointerEvents='';
    if(mirrorField) el.style.transform='scaleX(-1)';
    else el.style.transform='';

    const ghostHidden=cell.mine&&cell.variant==='ghost'&&!cell.revealed&&!state.perks['bomb_sense']
      &&!getNeighbors(i,cols,state.grid.rows).some(n=>cells[n].revealed);

    // Elite / boss_phantom / elite_always: mines hidden until 1 tile away
    const eliteHidden=(elite||state.eliteAlways||(state.modifier&&state.modifier.id==='boss_phantom'))&&cell.mine&&!cell.revealed
      &&!getNeighbors(i,cols,state.grid.rows).some(n=>cells[n].revealed);

    // Darkness: ALL tiles fade by mouse distance — revealed/flagged included
    const darknessHidden=darkness&&(()=>{
      const r=el.getBoundingClientRect();
      if(!r.width)return true;
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      return Math.hypot(mouseX-cx,mouseY-cy)>130;
    })();
    const darknessDim=darkness&&!darknessHidden&&(()=>{
      const r=el.getBoundingClientRect();
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      return Math.hypot(mouseX-cx,mouseY-cy);
    })();

    // Cursed eye: show mines within 3 tiles of any revealed cell (nerfed — not full map)
    const revealedSet=new Set(cells.map((_,i)=>i).filter(i=>cells[i].revealed));
    const forceVisible=cell.mine&&(cell._adminVisible||(state.relics['cursed_eye']&&(()=>{
      const{cols,rows}=state.grid;
      const r=Math.floor(i/cols),c=i%cols;
      for(let dr=-3;dr<=3;dr++) for(let dc=-3;dc<=3;dc++){
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&revealedSet.has(nr*cols+nc))return true;
      }
      return false;
    })()));

    if(darknessHidden){
      el.classList.add('hidden');el.style.opacity='0';el.style.pointerEvents='none';
      return; // skip rest of rendering
    }

    // Apply torch glow based on distance
    if(darkness){
      const r2=el.getBoundingClientRect();
      const dist=Math.hypot(mouseX-(r2.left+r2.width/2),mouseY-(r2.top+r2.height/2));
      const t=Math.max(0,1-dist/130);
      el.style.opacity=String(0.08+t*0.92);
      el.style.boxShadow=t>0.15?`0 0 ${Math.round(t*20)}px #4ecca3${Math.round(t*110).toString(16).padStart(2,'0')}`:'';
    }

    if(cell.flagged&&!cell.revealed){
      el.classList.add('flagged');el.textContent='🚩';
    } else if(!cell.revealed||ghostHidden||eliteHidden){
      el.classList.add('hidden');
      if(forceVisible&&cell.mine){el.style.color='rgba(233,69,96,0.35)';el.style.fontSize='.8rem';el.textContent='💣';}
      else if(state.perks['detector']&&!cell.mine){
        const mc=getNeighbors(i,cols,state.grid.rows).filter(n=>cells[n].mine).length;
        if(mc>=3){el.style.boxShadow='inset 0 0 8px #e9456044';el.style.borderColor='#e9456033';}
      }
      // Admin: highlight safe tiles green
      if(state._highlightSafe&&!cell.mine&&!cell.flagged){
        el.style.boxShadow='inset 0 0 10px #4ecca366';el.style.borderColor='#4ecca344';
      }
      if(cell.mine&&cell.variant==='bounty'&&!ghostHidden&&!eliteHidden&&mod&&mod.id!=='boss_vault') el.classList.add('bounty');
    } else if(cell.mine){
      el.classList.add(state.dead?'mine-dead':'mine-explode');
      const vDef=cell.variant?BOMB_VARIANTS.find(v=>v.id===cell.variant):null;
      el.textContent=vDef?vDef.emoji:'💣';
    } else {
      el.classList.add('revealed');
      if(cell.adjacent>0){
        if(foggy||state.noNumbers){
          // Fog of war: show number ±1 (unreliable); no_numbers: hide entirely
          if(state.noNumbers){
            // blank — no number shown
          } else {
            const fuzz=Math.floor(Math.random()*3)-1;
            const shown=Math.max(1,Math.min(8,cell.adjacent+fuzz));
            el.textContent=shown;el.classList.add(NUM_COLORS[Math.min(shown,8)]);
            el.style.opacity='0.7';
          }
        } else {
          el.textContent=cell.adjacent;el.classList.add(NUM_COLORS[Math.min(cell.adjacent,8)]);
        }
      }
    }
  });
}

function updateBombLegend(){
  const legend=document.getElementById('bomb-legend');
  legend.innerHTML='<span style="color:var(--dim);margin-right:6px;font-size:.65rem">BOMBS:</span>'
    +'<span class="legend-item">💣 Standard</span>'
    +state.unlockedVariants.map(vid=>{
      const v=BOMB_VARIANTS.find(b=>b.id===vid);
      return v?`<span class="legend-item">${v.emoji} ${v.label}</span>`:'';
    }).join('');
}

function updateModifierBanner(){
  const el=document.getElementById('modifier-banner');
  const mod=state.modifier;
  if(!mod||mod.id==='normal'){el.textContent='';el.style.color='';el.className='';return;}
  el.textContent=`${mod.icon} ${mod.name}`;
  el.style.color=mod.color;
  el.className=mod.isBoss?'boss-banner':'';
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
function getCellEl(idx){return document.getElementById('grid').children[idx];}
function cellCenter(el){const r=el.getBoundingClientRect();return{cx:r.left+r.width/2,cy:r.top+r.height/2};}

function spawnPopup(x,y,text,color){
  const el=document.createElement('div');el.className='score-popup';el.textContent=text;
  el.style.left=(x-20)+'px';el.style.top=(y-20)+'px';el.style.color=color;
  document.body.appendChild(el);setTimeout(()=>el.remove(),1050);
}

let msgTimer=null;
function flashMessage(text,color='#f5a623'){
  const el=document.getElementById('message-bar');
  el.textContent=text;el.style.color=color;el.style.opacity='1';
  clearTimeout(msgTimer);
  msgTimer=setTimeout(()=>{el.style.opacity='0';},2200);
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN PANEL — MantleDB powered
// ═══════════════════════════════════════════════════════════════
const MANTLE_NS   = 'minefield-game-admin-2024';
const MANTLE_BASE = 'https://mantledb.sh/v2';
const MANTLE_KEY  = '14e998e2f49eff827ff0038869ba01adb583aa044019bd453950c7a5c911ef9b';
const BROADCAST_URL = `${MANTLE_BASE}/${MANTLE_NS}/broadcast`;

// ── Write broadcast (admin only) ─────────────────────────────
async function writeBroadcast(data){
  try{
    const r=await fetch(BROADCAST_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Mantle-Key':MANTLE_KEY},
      body:JSON.stringify({...data, ts:Date.now()})
    });
    const res=await r.json();
    // Auto-reset after 15s so new visitors don't see stale commands
    setTimeout(()=>{
      fetch(BROADCAST_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Mantle-Key':MANTLE_KEY},
        body:JSON.stringify({ts:0,type:'none'})
      }).catch(()=>{});
    },15000);
    return res;
  }catch(e){return{error:e.message};}
}

// ── Read broadcast (all clients) ─────────────────────────────
async function readBroadcast(){
  try{
    const r=await fetch(BROADCAST_URL,{cache:'no-store'});
    if(!r.ok)return null;
    return await r.json();
  }catch{return null;}
}

// mantlePost still used for poll votes
async function mantlePost(path,data){
  try{
    const r=await fetch(`${MANTLE_BASE}/${MANTLE_NS}/${path}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Mantle-Key':MANTLE_KEY},
      body:JSON.stringify(data)
    });
    return await r.json();
  }catch(e){return{error:e.message};}
}
async function mantleGet(path){
  try{
    const r=await fetch(`${MANTLE_BASE}/${MANTLE_NS}/${path}`,{cache:'no-store'});
    if(!r.ok)return null;
    return await r.json();
  }catch{return null;}
}

// ── Admin trigger — Konami code: ↑↑↓↓←→←→BA Enter ──────────
const KONAMI_SEQ=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a','Enter'];
let konamiIdx=0;
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key===KONAMI_SEQ[konamiIdx]){
    konamiIdx++;
    if(konamiIdx===KONAMI_SEQ.length){konamiIdx=0;openAdminPanel();}
  } else {
    konamiIdx=e.key===KONAMI_SEQ[0]?1:0;
  }
});

// ── Admin panel state ─────────────────────────────────────────
let adminOpen=false;
let adminLog=[];
let adminPollInterval=null;
let adminQuickAccess=localStorage.getItem('mf_admin_quick')==='1';

function openAdminPanel(){
  if(adminOpen)return;
  if(adminQuickAccess){
    _doOpenAdminPanel();
  } else {
    showAdminPasswordGate('open');
  }
}

function _doOpenAdminPanel(){
  adminOpen=true;
  const overlay=document.getElementById('admin-overlay');
  const panel=document.getElementById('admin-panel');
  overlay.classList.remove('hidden','closing');
  panel.classList.remove('closing');
  // Re-trigger panel animation by cloning (forces reflow)
  panel.style.animation='none';
  void panel.offsetWidth;
  panel.style.animation='';
  populateModifierSelect();
  refreshAdminPollResults();
  adminLog=JSON.parse(localStorage.getItem('mf_admin_log')||'[]');
  renderAdminLog();
  syncQuickAccessToggle();
}

// Quick-access button in menu (lightning bolt)
function updateQuickAccessBtn(){
  const btn=document.getElementById('btn-admin-quick');
  if(!btn)return;
  btn.style.display=adminQuickAccess?'flex':'none';
}
updateQuickAccessBtn();

// ── Admin password gate ───────────────────────────────────────
const ADMIN_PASSWORD='mango';
let adminPasswordInput='';
let adminPasswordMode='open'; // 'open' | 'enable_quick' | 'disable_quick'

function showAdminPasswordGate(mode='open'){
  adminPasswordMode=mode;
  const gate=document.getElementById('admin-password-gate');
  const subtitle=document.getElementById('pw-subtitle');
  adminPasswordInput='';
  updatePasswordDots();
  gate.dataset.mode=mode;
  if(mode==='enable_quick') subtitle.textContent='Confirm password to enable quick access';
  else if(mode==='disable_quick') subtitle.textContent='Confirm password to disable quick access';
  else subtitle.textContent='Enter password';
  gate.classList.remove('hidden');
  setTimeout(()=>gate.focus(),50);
}

function hideAdminPasswordGate(){
  document.getElementById('admin-password-gate').classList.add('hidden');
  adminPasswordInput='';
  updatePasswordDots();
}

function updatePasswordDots(){
  const dots=document.querySelectorAll('.pw-dot');
  dots.forEach((d,i)=>{
    d.classList.toggle('filled', i<adminPasswordInput.length);
  });
  document.getElementById('pw-error').textContent='';
}

function submitAdminPassword(){
  if(adminPasswordInput===ADMIN_PASSWORD){
    hideAdminPasswordGate();
    if(adminPasswordMode==='open'){
      _doOpenAdminPanel();
    } else if(adminPasswordMode==='enable_quick'){
      adminQuickAccess=true;
      localStorage.setItem('mf_admin_quick','1');
      updateQuickAccessBtn();
      syncQuickAccessToggle();
      showAnnouncement('⚡ Quick access enabled','success','⚡',3);
    } else if(adminPasswordMode==='disable_quick'){
      adminQuickAccess=false;
      localStorage.removeItem('mf_admin_quick');
      updateQuickAccessBtn();
      syncQuickAccessToggle();
      showAnnouncement('Quick access disabled','info','🔒',3);
    }
  } else {
    document.getElementById('pw-error').textContent='INCORRECT';
    adminPasswordInput='';
    updatePasswordDots();
    const dotsEl=document.getElementById('pw-dots');
    dotsEl.classList.add('pw-shake');
    setTimeout(()=>dotsEl.classList.remove('pw-shake'),500);
  }
}

function syncQuickAccessToggle(){
  const btn=document.getElementById('btn-admin-quick-toggle');
  if(!btn)return;
  btn.textContent=adminQuickAccess?'⚡ DISABLE QUICK ACCESS':'⚡ ENABLE QUICK ACCESS';
  btn.style.borderColor=adminQuickAccess?'#e94560':'#f5c842';
  btn.style.color=adminQuickAccess?'#e94560':'#f5c842';
}

// Password gate: cancel only closes if in quick-access mode (not blocking open)
document.getElementById('btn-pw-cancel').addEventListener('click',()=>{
  if(adminPasswordMode!=='open') hideAdminPasswordGate();
  // If mode is 'open', cancel does nothing — must enter password
});
// No overlay-click-to-close for password gate

document.getElementById('btn-privacy').addEventListener('click',e=>{
  e.preventDefault();
  document.getElementById('privacy-overlay').classList.remove('hidden');
});
document.getElementById('btn-privacy-close').addEventListener('click',()=>{
  document.getElementById('privacy-overlay').classList.add('hidden');
});
document.getElementById('btn-privacy-ok').addEventListener('click',()=>{
  document.getElementById('privacy-overlay').classList.add('hidden');
});
document.getElementById('privacy-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('privacy-overlay'))
    document.getElementById('privacy-overlay').classList.add('hidden');
});

// Password gate keyboard input
document.getElementById('admin-password-gate').addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.key==='Escape'){hideAdminPasswordGate();return;}
  if(e.key==='Enter'){submitAdminPassword();return;}
  if(e.key==='Backspace'){adminPasswordInput=adminPasswordInput.slice(0,-1);updatePasswordDots();return;}
  if(e.key.length===1&&adminPasswordInput.length<12){
    adminPasswordInput+=e.key.toLowerCase();
    updatePasswordDots();
  }
});

// Password keypad buttons
document.querySelectorAll('.pw-key').forEach(btn=>{
  btn.addEventListener('click',e=>{
    e.stopPropagation();
    const val=btn.dataset.val;
    if(val==='back'){adminPasswordInput=adminPasswordInput.slice(0,-1);}
    else if(val==='enter'){submitAdminPassword();return;}
    else if(adminPasswordInput.length<12){adminPasswordInput+=val.toLowerCase();}
    updatePasswordDots();
  });
});
function closeAdminPanel(){
  adminOpen=false;
  document.getElementById('admin-overlay').classList.add('hidden');
}

// Tab switching — admin panel cannot be closed, only minimized
document.querySelectorAll('.admin-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.admin-page').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`admin-page-${tab.dataset.tab}`).classList.add('active');
  });
});
// Close button — animate out then hide
document.getElementById('admin-close').addEventListener('click',()=>{
  const overlay=document.getElementById('admin-overlay');
  const panel=document.getElementById('admin-panel');
  panel.classList.add('closing');
  overlay.classList.add('closing');
  setTimeout(()=>{
    overlay.classList.add('hidden');
    overlay.classList.remove('closing');
    panel.classList.remove('closing');
    adminOpen=false;
  },240);
});

// ── Populate modifier select ──────────────────────────────────
function populateModifierSelect(){
  const sel=document.getElementById('admin-modifier-select');
  sel.innerHTML='';
  [...FLOOR_MODIFIERS,...BOSS_MODIFIERS].forEach(m=>{
    if(!m.id||m.id==='normal')return;
    const opt=document.createElement('option');
    opt.value=m.id;
    opt.textContent=`${m.icon||'⚡'} ${m.name||m.id}`;
    sel.appendChild(opt);
  });
}

// ── Broadcast helpers ─────────────────────────────────────────
function adminLogEntry(text){
  adminLog.unshift({text,time:Date.now()});
  if(adminLog.length>50)adminLog.pop();
  localStorage.setItem('mf_admin_log',JSON.stringify(adminLog));
  renderAdminLog();
}
function renderAdminLog(){
  const list=document.getElementById('admin-log-list');
  if(!list)return;
  list.innerHTML=adminLog.map(e=>`
    <div class="admin-log-entry sent">
      <span style="color:#3a3f55;font-size:.6rem">${new Date(e.time).toLocaleTimeString()}</span>
      ${e.text}
    </div>`).join('');
}

async function sendBroadcast(payload){
  const res=await writeBroadcast(payload);
  const footer=document.getElementById('admin-last-seen');
  if(res&&res.success){
    adminLogEntry(`✓ [${payload.type}] ${JSON.stringify(payload).slice(0,80)}`);
    if(footer) footer.textContent='Sent ✓ '+new Date().toLocaleTimeString();
  } else {
    const errMsg=res?.error||res?.message||JSON.stringify(res)||'network error';
    adminLogEntry(`❌ [${payload.type}] ${errMsg}`);
    if(footer) footer.textContent='❌ Failed: '+errMsg;
    showAnnouncement(`Send failed: ${errMsg}`,'danger','❌',5);
  }
  return res;
}

// ── Namespace setup helper ────────────────────────────────────
async function claimNamespace(){
  try{
    const r=await fetch(`${MANTLE_BASE}/claim/${MANTLE_NS}`);
    const d=await r.json();
    if(d.key){
      alert(`Namespace claimed!\nKey: ${d.key}\n\nPaste this into MANTLE_KEY in game.js and reload.`);
    } else if(d.error){
      alert(`Already claimed or error: ${d.error}`);
    }
  }catch(e){alert('Claim failed: '+e.message);}
}
// Test connectivity
async function testConnection(){
  const footer=document.getElementById('admin-last-seen');
  if(footer) footer.textContent='Testing...';
  const res=await writeBroadcast({type:'ping',msg:'🔌 Connection test from admin'});
  if(res&&res.success){
    if(footer) footer.textContent='✓ Connected '+new Date().toLocaleTimeString();
    adminLogEntry('✓ Connection test passed');
  } else {
    if(footer) footer.textContent='❌ Connection failed';
    adminLogEntry('❌ Connection test failed: '+(res?.error||'unknown'));
  }
}

// ── BROADCAST TAB ─────────────────────────────────────────────
const ANNOUNCE_ICONS={info:'ℹ️',warning:'⚠️',success:'✅',danger:'🚨',gold:'💰'};

document.getElementById('btn-admin-announce').addEventListener('click',async()=>{
  const text=document.getElementById('admin-announce-text').value.trim();
  if(!text)return;
  const style=document.getElementById('admin-announce-style').value;
  const duration=parseInt(document.getElementById('admin-announce-duration').value)||8;
  await sendBroadcast({type:'announcement',text,style,duration,icon:ANNOUNCE_ICONS[style]});
  document.getElementById('admin-announce-text').value='';
});

document.querySelectorAll('.admin-quick-btn').forEach(btn=>{
  btn.addEventListener('click',async()=>{
    const text=btn.dataset.msg;
    await sendBroadcast({type:'announcement',text,style:'warning',duration:8,icon:'⚠️'});
  });
});

// ── POLL TAB ─────────────────────────────────────────────────
document.getElementById('btn-admin-poll').addEventListener('click',async()=>{
  const q=document.getElementById('admin-poll-q').value.trim();
  if(!q)return;
  const opts=[...document.querySelectorAll('.admin-poll-opt')]
    .map(i=>i.value.trim()).filter(Boolean);
  if(opts.length<2){alert('Need at least 2 options');return;}
  const duration=parseInt(document.getElementById('admin-poll-duration').value)||60;
  const endsAt=Date.now()+duration*1000;
  // Reset votes — write zeroes for each option
  const zeroVotes={};
  opts.forEach(o=>{zeroVotes[o]=0;});
  await mantlePost('poll/votes',zeroVotes);
  await sendBroadcast({type:'poll',question:q,options:opts,endsAt,duration});
  document.getElementById('admin-poll-q').value='';
});

document.getElementById('btn-admin-poll-end').addEventListener('click',async()=>{
  await sendBroadcast({type:'poll_end',ts:Date.now()});
});

async function refreshAdminPollResults(){
  const votes=await mantleGet('poll/votes');
  const el=document.getElementById('admin-poll-results');
  if(!el)return;
  if(!votes||Object.keys(votes).length===0){el.innerHTML='<span style="color:#3a3f55;font-size:.7rem">No active poll votes</span>';return;}
  const total=Object.values(votes).reduce((a,b)=>a+b,0)||1;
  el.innerHTML=Object.entries(votes).map(([opt,count])=>`
    <div class="admin-poll-result-row">
      <span class="admin-poll-label">${opt}</span>
      <div class="admin-poll-bar-wrap"><div class="admin-poll-bar" style="width:${Math.round(count/total*100)}%"></div></div>
      <span class="admin-poll-count">${count} (${Math.round(count/total*100)}%)</span>
    </div>`).join('');
}
setInterval(refreshAdminPollResults,3000);

// ── GAME TAB ─────────────────────────────────────────────────
document.getElementById('btn-admin-modifier').addEventListener('click',async()=>{
  const id=document.getElementById('admin-modifier-select').value;
  await sendBroadcast({type:'force_modifier',modifierId:id});
});
document.getElementById('btn-admin-gold').addEventListener('click',async()=>{
  const amount=parseInt(document.getElementById('admin-gold-amount').value)||100;
  await sendBroadcast({type:'give_gold',amount});
});
document.getElementById('btn-admin-gems').addEventListener('click',async()=>{
  const amount=parseInt(document.getElementById('admin-gems-amount').value)||50;
  await sendBroadcast({type:'give_gems',amount});
});
document.getElementById('btn-admin-refresh').addEventListener('click',async()=>{
  const delay=parseInt(document.getElementById('admin-refresh-delay').value)||5;
  await sendBroadcast({type:'refresh',delay});
});

// ── ABUSE TAB ─────────────────────────────────────────────────
document.getElementById('btn-abuse-explode').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'explode'});
});
document.getElementById('btn-abuse-shake').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'shake'});
});
document.getElementById('btn-abuse-darkness').addEventListener('click',async()=>{
  await sendBroadcast({type:'force_modifier',modifierId:'darkness'});
});
document.getElementById('btn-abuse-bonus').addEventListener('click',async()=>{
  await sendBroadcast({type:'force_modifier',modifierId:'bonus'});
});
document.getElementById('btn-abuse-chaos').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'chaos'});
});
document.getElementById('btn-abuse-mines').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'double_mines'});
});
document.getElementById('btn-abuse-kill').addEventListener('click',async()=>{
  if(!confirm('Kill ALL active runs? This will end everyone\'s game.'))return;
  await sendBroadcast({type:'abuse',action:'kill_all'});
});
document.getElementById('btn-abuse-gems2x').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'gems2x',duration:300});
});
document.getElementById('btn-abuse-heal').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'heal',amount:1});
});
document.getElementById('btn-abuse-fullheal').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'heal',amount:99});
});
document.getElementById('btn-abuse-shield').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'shield_all'});
});
document.getElementById('btn-abuse-score2x').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'score2x'});
});
document.getElementById('btn-abuse-freeze').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'freeze_flags'});
});
document.getElementById('btn-abuse-reveal-bombs').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'reveal_bombs'});
});
document.getElementById('btn-abuse-highlight-safe').addEventListener('click',async()=>{
  await sendBroadcast({type:'abuse',action:'highlight_safe'});
});
document.getElementById('btn-abuse-drain').addEventListener('click',async()=>{
  if(!confirm('Drain everyone\'s gold to 0?'))return;
  await sendBroadcast({type:'abuse',action:'drain_gold'});
});

// ── LOG TAB ───────────────────────────────────────────────────
document.getElementById('btn-admin-clear-log').addEventListener('click',()=>{
  adminLog=[];localStorage.removeItem('mf_admin_log');renderAdminLog();
});
document.getElementById('btn-admin-test').addEventListener('click',testConnection);
document.getElementById('btn-admin-claim').addEventListener('click',claimNamespace);

// Quick access toggle
document.getElementById('btn-admin-quick-toggle').addEventListener('click',()=>{
  const mode=adminQuickAccess?'disable_quick':'enable_quick';
  showAdminPasswordGate(mode);
});

// Quick access menu button
document.getElementById('btn-admin-quick').addEventListener('click',()=>{
  if(!adminOpen) _doOpenAdminPanel();
});

// ═══════════════════════════════════════════════════════════════
//  CLIENT BROADCAST HANDLER — all players poll this
// ═══════════════════════════════════════════════════════════════
let lastBroadcastTs=0;
let forcedNextModifier=null;
let gems2xActive=false;
let playerPollVote=null;

async function pollBroadcast(){
  const data=await readBroadcast();
  // Ignore if null, no ts, ts=0 (reset), or already seen
  if(!data||!data.ts||data.ts===0||data.ts<=lastBroadcastTs)return;
  lastBroadcastTs=data.ts;

  // Route based on type or shorthand fields (following the guide pattern)
  if(data.msg) showAnnouncement(data.msg, data.style||'info', data.icon||'ℹ️', data.duration||8);
  if(data.refresh) setTimeout(()=>location.reload(), (data.delay||3)*1000);

  switch(data.type){
    case 'announcement':
      showAnnouncement(data.text||data.msg, data.style||'info', data.icon||'ℹ️', data.duration||8);
      break;
    case 'poll':
      showPoll(data.question, data.options, data.endsAt, data.duration);
      break;
    case 'poll_end':
      hidePoll();
      break;
    case 'force_modifier':
      forcedNextModifier=data.modifierId;
      showAnnouncement(`⚡ Next floor: ${data.modifierId.toUpperCase().replace(/_/g,' ')}!`,'warning','⚡',6);
      break;
    case 'give_gold':
      if(state&&state.gold!==undefined&&!state.dead){
        state.gold+=data.amount;
        if(document.getElementById('hud-gold'))
          document.getElementById('hud-gold').textContent=`💰 ${state.gold}`;
      }
      showAnnouncement(`💰 Admin gave everyone +${data.amount} gold!`,'gold','💰',6);
      break;
    case 'give_gems':
      gems+=data.amount;saveGems();updateMenuDisplay();
      showAnnouncement(`💎 Admin gave everyone +${data.amount} gems!`,'success','💎',6);
      break;
    case 'refresh':
      showAnnouncement(`🔄 Refreshing in ${data.delay||3}s...`,'warning','🔄',data.delay||3);
      setTimeout(()=>location.reload(),(data.delay||3)*1000);
      break;
    case 'abuse':
      handleAbuse(data);
      break;
  }
}

function handleAbuse(data){
  switch(data.action){
    case 'explode':
      for(let i=0;i<8;i++) setTimeout(()=>{
        canvasExplode(Math.random()*window.innerWidth,Math.random()*window.innerHeight,
          Math.random()*360,30);
      },i*80);
      showAnnouncement('💥 ADMIN SAYS BOOM','danger','💥',4);
      break;
    case 'shake':
      screenShake(20,800);
      showAnnouncement('📳 Admin shook your screen!','warning','📳',3);
      break;
    case 'chaos':
      forcedNextModifier='__chaos__';
      showAnnouncement('🎲 CHAOS MODE — your next floor is a surprise!','warning','🎲',5);
      break;
    case 'double_mines':
      if(state)state.doubleMines=true;
      showAnnouncement('💣 Admin doubled the mines on your next floor!','danger','💣',5);
      break;
    case 'kill_all':
      if(state&&!state.dead&&state.grid){
        state.hp=0;
        setTimeout(triggerDeath,500);
        showAnnouncement('☠️ Admin ended your run. Rude.','danger','☠️',5);
      }
      break;
    case 'gems2x':
      gems2xActive=true;
      setTimeout(()=>{gems2xActive=false;},( data.duration||300)*1000);
      showAnnouncement(`💎 2× GEMS active for ${Math.round((data.duration||300)/60)} minutes!`,'success','💎',6);
      break;
    case 'heal':
      if(state&&state.hp!==undefined&&!state.dead){
        const amt=Math.min(data.amount||1, state.maxHp-state.hp);
        state.hp=Math.min(state.hp+(data.amount||1),state.maxHp);
        render();
        showAnnouncement(`💚 Admin healed you +${data.amount>=99?'FULL':data.amount} HP!`,'success','💚',4);
      }
      break;
    case 'shield_all':
      if(state&&!state.dead){
        state.shielded=true;
        showAnnouncement('🛡️ Admin gave everyone a shield!','success','🛡️',4);
        flashMessage('🛡️ ADMIN SHIELD ACTIVATED','#4ecca3');
        render();
      }
      break;
    case 'score2x':
      if(state&&!state.dead){
        state._score2xFloor=true;
        showAnnouncement('📊 2× SCORE active this floor!','success','📊',5);
      }
      break;
    case 'freeze_flags':
      if(state&&!state.dead){
        state.frozenFloor=true;
        showAnnouncement('🧊 Admin froze your flags this floor!','warning','🧊',5);
        flashMessage('🧊 FLAGS FROZEN BY ADMIN','#7ecfff');
      }
      break;
    case 'drain_gold':
      if(state&&state.gold!==undefined){
        state.gold=0;
        if(document.getElementById('hud-gold'))
          document.getElementById('hud-gold').textContent='💰 0';
        showAnnouncement('💸 Admin drained your gold. Ouch.','danger','💸',5);
      }
      break;
    case 'reveal_bombs':
      if(state&&state.grid&&!state.dead){
        state.grid.cells.forEach(c=>{if(c.mine)c._adminVisible=true;});
        render();
        showAnnouncement('💣 Admin revealed all bomb positions!','warning','💣',8);
        // Auto-hide after 8s
        setTimeout(()=>{
          if(state&&state.grid) state.grid.cells.forEach(c=>{c._adminVisible=false;});
          if(!state.dead) render();
        },8000);
      }
      break;
    case 'highlight_safe':
      if(state&&state.grid&&!state.dead){
        state._highlightSafe=true;
        render();
        showAnnouncement('✅ Admin highlighted all safe tiles for 6 seconds!','success','✅',6);
        setTimeout(()=>{
          state._highlightSafe=false;
          if(!state.dead) render();
        },6000);
      }
      break;
  }
}

// Hook forced modifier into nextFloor / startGame
// forcedNextModifier is checked inside rollModifier (defined earlier in file)

// Hook gems2x into gem earning
const _origCheckFloorClear=checkFloorClear;
// (gems2x is applied inline — we patch the gem gain in the earn section via flag)

// ── Announcement UI ───────────────────────────────────────────
let announceTimer=null;
function showAnnouncement(text,style,icon,duration){
  const overlay=document.getElementById('announce-overlay');
  const box=document.getElementById('announce-box');
  const fill=document.getElementById('announce-bar-fill');
  document.getElementById('announce-icon').textContent=icon;
  document.getElementById('announce-text').textContent=text;
  box.className=`style-${style}`;
  overlay.classList.remove('hidden');
  fill.style.transition='none';fill.style.width='100%';
  requestAnimationFrame(()=>{
    fill.style.transition=`width ${duration}s linear`;
    fill.style.width='0%';
  });
  clearTimeout(announceTimer);
  announceTimer=setTimeout(()=>overlay.classList.add('hidden'),duration*1000);
}
// Close announcement on click
document.getElementById('announce-overlay').addEventListener('click',()=>{
  clearTimeout(announceTimer);
  document.getElementById('announce-overlay').classList.add('hidden');
});

// ── Poll UI ───────────────────────────────────────────────────
let pollTimerInterval=null;
let pollLiveInterval=null;

function showPoll(question,options,endsAt,duration){
  playerPollVote=null;
  const overlay=document.getElementById('poll-overlay');
  document.getElementById('poll-question').textContent=question;
  const optEl=document.getElementById('poll-options');

  function renderOptions(votes){
    const total=votes?Object.values(votes).reduce((a,b)=>a+b,0):0;
    optEl.innerHTML=options.map((o)=>{
      const count=votes?votes[o]||0:0;
      const pct=total>0?Math.round(count/total*100):0;
      const isVoted=playerPollVote===o;
      return `<button class="poll-option-btn${isVoted?' voted':''}" data-opt="${o}" ${playerPollVote?'disabled':''}>
        <span>${o}</span>
        <span class="poll-option-pct">${playerPollVote?pct+'%':''}</span>
      </button>
      ${playerPollVote?`<div class="poll-live-bar-wrap"><div class="poll-live-bar" style="width:${pct}%"></div></div>`:''}`;
    }).join('');

    if(!playerPollVote){
      optEl.querySelectorAll('.poll-option-btn').forEach(btn=>{
        btn.addEventListener('click',async()=>{
          if(playerPollVote)return;
          playerPollVote=btn.dataset.opt;
          // Atomic increment via MantleDB
          await fetch(`${MANTLE_BASE}/increment/${MANTLE_NS}/poll/votes`,{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({key:playerPollVote,by:1})
          }).catch(()=>{});
          // Re-fetch and re-render with results
          const updated=await mantleGet('poll/votes');
          renderOptions(updated);
        });
      });
    }
  }

  renderOptions(null);
  overlay.classList.remove('hidden');

  // Live results update every 2s after voting
  clearInterval(pollLiveInterval);
  pollLiveInterval=setInterval(async()=>{
    if(!playerPollVote)return;
    const votes=await mantleGet('poll/votes');
    if(votes) renderOptions(votes);
  },2000);

  // Countdown
  clearInterval(pollTimerInterval);
  pollTimerInterval=setInterval(()=>{
    const left=Math.max(0,Math.round((endsAt-Date.now())/1000));
    const timerEl=document.getElementById('poll-timer');
    if(timerEl) timerEl.textContent=`${left}s remaining`;
    if(left<=0){clearInterval(pollTimerInterval);clearInterval(pollLiveInterval);hidePoll();}
  },1000);
}

function hidePoll(){
  clearInterval(pollTimerInterval);
  clearInterval(pollLiveInterval);
  document.getElementById('poll-overlay').classList.add('hidden');
}

// ── Start polling ─────────────────────────────────────────────
setInterval(pollBroadcast,3000);
pollBroadcast(); // immediate first check
