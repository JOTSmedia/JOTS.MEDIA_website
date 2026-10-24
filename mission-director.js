// Narrative prerequisites are gameplay rules, not extra numeric quota fields.
export function scanPrerequisite(level,stats={}) {
 const rules={1:[['cow',4,'CALIBRATE ON FOUR CATTLE'],['human',2,'ISOLATE TWO HUMAN SIGNATURES']],2:[['human',4,'RECOVER FOUR WITNESS CONTACTS'],['blackhawk',1,'CAPTURE THE BLACK HAWK RECORDER']],3:[['fighter',2,'CAPTURE BOTH FIGHTER IDENTIFICATION KEYS']],4:[['sam',3,'DISABLE THE THREE SAM BATTERIES']],5:[['sr71',1,'CAPTURE THE BLACKBIRD SURVEY INTACT']],6:[['sam',2,'DISABLE TWO GRID DEFENSE BATTERIES']],7:[['human',4,'RECOVER FOUR RELAY ENGINEERS'],['blackhawk',2,'RECOVER BOTH BLACK HAWK RECORDERS']],8:[['fighter',3,'CAPTURE THREE PATROL KEYS'],['sam',4,'DISABLE FOUR CORRIDOR BATTERIES']]};
 for(const[key,required,instruction]of rules[level]||[])if((stats[key]||0)<required)return{ready:false,key,required,instruction};
 return{ready:true,key:'intel',instruction:'SIGNAL CHANNEL OPEN • HOLD BEAM TO COPY'};
}
export function missionMedal({damage=0,hull=0,remaining=0,time=1}={}) {
 const efficiency=Math.max(0,Math.min(1,remaining/Math.max(1,time)));
 const stars=hull>=65&&damage<=50&&efficiency>=.2?3:hull>=30&&efficiency>.05?2:1;
 return {stars,name:stars===3?'GHOST OPERATOR':stars===2?'RESCUE SPECIALIST':'MISSION SURVIVOR',detail:stars===3?'CLEAN EXTRACTION • HIGH HULL • TIME TO SPARE':stars===2?'CREW FIRST • OPERATION SECURED':'YOU BROUGHT THE SIGNAL HOME'};
}
export function standardGamepad(pad) {
 const axis=i=>{const n=Number(pad?.axes?.[i])||0;return Math.abs(n)<.16?0:Math.sign(n)*(Math.abs(n)-.16)/.84;};
 const button=i=>!!pad?.buttons?.[i]?.pressed;
 return {x:axis(0),z:axis(1),climb:axis(3),beam:button(0),laser:button(2),missile:button(1),boost:button(3),lock:button(4),airframe:button(5),pause:button(9)};
}
