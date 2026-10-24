// Save data is plain JSON and portable between the browser and native Mac app.
const counts={targets:250,lights:20,aircraft:40,aliens:40,missiles:200,wrecks:80,intelSites:8};
function safeTree(value,depth=0){
 if(depth>8)return false;if(value===null||typeof value==='boolean')return true;
 if(typeof value==='number')return Number.isFinite(value)&&Math.abs(value)<1e12;
 if(typeof value==='string')return value.length<=1000;
 if(Array.isArray(value))return value.length<=2000&&value.every(v=>safeTree(v,depth+1));
 if(value&&typeof value==='object')return Object.keys(value).length<=150&&Object.entries(value).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&safeTree(v,depth+1));return false;
}
export function validateFlightSave(data){
 if(!data||data.schema!==1||!safeTree(data)||!Number.isInteger(data.level)||data.level<1||data.level>9||!['abduct','intercept'].includes(data.missionType)||!['arcade','explorer'].includes(data.mode))return null;
 if(!data.player||['x','y','z','hull','shield','maxShield','tech','weapon'].some(k=>!Number.isFinite(data.player[k])))return null;
 if(data.player.hull<=0||data.player.hull>100||data.player.maxShield<60||data.player.maxShield>135||data.player.shield<0||data.player.shield>data.player.maxShield||Math.abs(data.player.x)>2e6||Math.abs(data.player.z)>2e6||data.player.y< -12000||data.player.y>1000)return null;
 for(const key of ['score','credits','captures','totalCaptures','remaining','elapsed','quota','entityId','missileAmmo','completedOperations','combo','comboTimer','bestCombo','threat','missileCooldown','missileReload','flareCooldown','responseCooldown','srTimer','stageStartScore','stageStartCredits','stageStartTotal','stageStartTech','stageStartWeapon','stageDamageTaken'])if(!Number.isFinite(data[key])||(['score','credits','captures','totalCaptures','remaining','elapsed','quota','entityId','missileAmmo','completedOperations'].includes(key)&&data[key]<0))return null;
 if(!Number.isFinite(data.fireCooldown))return null;if(data.remaining<=0||data.remaining>1000||data.elapsed>10000||data.missileAmmo>16)return null;
 if(!Object.entries(data.player).every(([k,v])=>k==='beam'?typeof v==='boolean':typeof v==='number'&&Number.isFinite(v)))return null;
 if(!Object.values(data.missionStats||{}).every(v=>Number.isInteger(v)&&v>=0&&v<=10000))return null;
 if(!data.upgrades||['beam','shield','engine'].some(k=>!Number.isInteger(data.upgrades[k])||data.upgrades[k]<0||data.upgrades[k]>3)||!data.missionStats)return null;
 const ids=new Set();for(const[key,max]of Object.entries(counts)){
  if(!Array.isArray(data[key])||data[key].length>max)return null;
  for(const actor of data[key]){if(!actor||!Number.isInteger(actor.id)||ids.has(actor.id)||['x','y','z'].some(k=>!Number.isFinite(actor[k])))return null;ids.add(actor.id);}
 }
 if(!Number.isInteger(data.entityId)||data.entityId<=Math.max(0,...ids))return null;
 if(!['classic','tr3b'].includes(data.ufoModel)||!['fighter','blackhawk','sr71'].includes(data.selectedAircraft)||!Array.isArray(data.commsSeen))return null;
 const result=JSON.parse(JSON.stringify(data));if(result.campaignVersion!==9&&result.level===6){result.level=9;result.commsSeen=result.commsSeen.map(id=>String(id).replace(/^6:/,'9:'));}result.campaignVersion=9;return result;
}
export const TRANSFER_KEYS=['ap-campaign-layout','ap-best-v1','ap-tr3b-unlocked','ap-tr3b-research','ap-ufo-model','ap-campaign-v2','ap-flight-v1','ap-mission-records-v1','ap-evidence-v1'];
export function encodeBackup(storage){
 const entries={};for(const k of TRANSFER_KEYS){const value=storage.getItem(k);if(value!==null&&value!=='null')entries[k]=value;}
 return JSON.stringify({format:'ABDUCTION-PROTOCOL',version:1,entries},null,2);
}
export function decodeBackup(text){
 if(typeof text!=='string'||text.length>2e6)throw Error('SAVE FILE IS TOO LARGE.');
 let data;try{data=JSON.parse(text);}catch{throw Error('THIS IS NOT A VALID JSON SAVE.');}
 if(data?.format!=='ABDUCTION-PROTOCOL'||data.version!==1||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries)||Object.keys(data.entries).length===0)throw Error('CHOOSE AN ABDUCTION PROTOCOL SAVE FILE.');
 const entries={};for(const[key,value]of Object.entries(data.entries)){
  if(!TRANSFER_KEYS.includes(key)||typeof value!=='string'||value.length>1e6)throw Error('SAVE FILE CONTAINS UNSUPPORTED DATA.');entries[key]=value;
 }
 if(entries['ap-campaign-layout']!==undefined&&entries['ap-campaign-layout']!=='9')throw Error('CAMPAIGN LAYOUT IS INVALID.');
 if(entries['ap-flight-v1']&&!validateFlightSave(JSON.parse(entries['ap-flight-v1'])))throw Error('THE FLIGHT CHECKPOINT IS INCOMPLETE.');
 if(entries['ap-evidence-v1']!==undefined){let evidence;try{evidence=JSON.parse(entries['ap-evidence-v1']);}catch{throw Error('CREW FILE DATA IS INVALID.');}if(!evidence||typeof evidence!=='object'||Array.isArray(evidence)||Object.entries(evidence).some(([k,v])=>!['1','2','3','4','5','6','7','8','9'].includes(k)||v!==true))throw Error('CREW FILE DATA IS INVALID.');}
 for(const key of ['ap-best-v1','ap-tr3b-research'])if(entries[key]!==undefined&&(!Number.isFinite(Number(entries[key]))||Number(entries[key])<0||Number(entries[key])>1e9))throw Error('RESEARCH OR SCORE DATA IS INVALID.');
 if(entries['ap-tr3b-unlocked']&&!['true','false'].includes(entries['ap-tr3b-unlocked']))throw Error('AIRFRAME UNLOCK DATA IS INVALID.');
 if(entries['ap-ufo-model']&&!['classic','tr3b'].includes(entries['ap-ufo-model']))throw Error('AIRFRAME DATA IS INVALID.');
 if(entries['ap-campaign-v2']){const c=JSON.parse(entries['ap-campaign-v2']);if(!c||!Number.isInteger(c.level)||c.level<2||c.level>10||!safeTree(c)||['score','credits','totalCaptures','completedOperations','tech','weapon'].some(k=>!Number.isFinite(c[k])||c[k]<0)||!c.upgrades||['beam','shield','engine'].some(k=>!Number.isInteger(c.upgrades[k])||c.upgrades[k]<0||c.upgrades[k]>3))throw Error('CAMPAIGN CHECKPOINT IS INVALID.');}
 if(entries['ap-mission-records-v1']){const records=JSON.parse(entries['ap-mission-records-v1']);if(!records||Array.isArray(records)||Object.entries(records).some(([k,v])=>!['1','2','3','4','5','6','7','8','9'].includes(k)||!v||!Number.isInteger(v.stars)||v.stars<1||v.stars>3||!Number.isFinite(v.score)||v.score<0||!Number.isFinite(v.time)||v.time<0))throw Error('MISSION RECORDS ARE INVALID.');}
 return entries;
}
