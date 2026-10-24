/* Pure weapon tuning shared by local and orbital combat.
 * tier: 0 = classic saucer, >=1 = earned TR-3B level.
 * altitude: positive metres above the mission datum, clamped to the 12 km flight ceiling.
 * laserDamage is damage per second; missileDamage is one direct hit.
 * Range checks use 3D distance and must not reject a surface target just for altitude.
 */
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

export function weaponProfile({tier=0,altitude=0,weaponLevel=1}={}) {
 const level=clamp(Math.floor(finite(tier)),0,10000);
 const height=clamp(finite(altitude),0,12000);
 const weapon=clamp(finite(weaponLevel,1),1,20);
 const baseLaser=30+weapon*13,baseMissile=70+weapon*8;
 if(level===0)return {
  tier:0,orbital:false,lockRange:1200,laserRange:850,laserDamage:baseLaser,
  missileCapacity:4,missileReload:9,missileDamage:baseMissile,missileSpeed:820,
  missileLifetime:9,missileBlastRadius:0
 };
 const power=Math.log2(level),heightFactor=height/12000;
 const missileSpeed=Math.round(Math.min(4200,900+power*110+height*.15));
 const lockRange=20000;
 return {
  tier:level,orbital:height>=7000,lockRange,laserRange:lockRange,
  laserDamage:Math.round(Math.min(360,(baseLaser+Math.min(145,(level-1)*8))*(1+heightFactor*.35))),
  missileCapacity:Math.min(16,4+Math.floor((level-1)/2)),
  missileReload:Math.max(2.8,9-power*.85),
  missileDamage:Math.round(Math.min(500,(baseMissile+Math.min(220,(level-1)*9))*(1+heightFactor*.5))),
  missileSpeed,
  // Enough for a full-range descent, acceleration and turning, even at minimum tier.
  missileLifetime:Math.max(14,Math.ceil(lockRange/missileSpeed*1.5+4)),
  missileBlastRadius:Math.round(Math.min(220,32+power*24+heightFactor*84))
 };
}

/** Return secondary blast damage only; apply direct-hit damage separately and once.
 * Caller chooses hostile contacts and excludes the direct target, civilians and crew.
 */
export function splashDamage(distance,radius,damage) {
 const d=Number(distance),r=Number(radius),power=Number(damage);
 if(!Number.isFinite(d)||!Number.isFinite(r)||!Number.isFinite(power)||d<0||r<=0||power<=0||d>=r)return 0;
 return power*.7*Math.pow(1-d/r,1.2);
}

/** Swept collision distance for a fast missile segment; avoids skipping a target
 * between frames. Same coordinates as game entities, independent of Y-up/down.
 */
export function closestSegmentDistance(start,end,target) {
 const xyz=p=>[Number(p?.x),Number(p?.y),Number(p?.z??0)];
 const a=xyz(start),b=xyz(end),p=xyz(target);
 if([...a,...b,...p].some(v=>!Number.isFinite(v)))return Infinity;
 const delta=b.map((v,i)=>v-a[i]),lengthSq=delta.reduce((sum,v)=>sum+v*v,0);
 const fraction=lengthSq?clamp(p.reduce((sum,v,i)=>sum+(v-a[i])*delta[i],0)/lengthSq,0,1):0;
 return Math.hypot(...p.map((v,i)=>v-a[i]-delta[i]*fraction));
}
