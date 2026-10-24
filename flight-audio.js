// Original procedural sound design: filtered turbulent air, rotor pulses,
// turbine harmonics and layered transients. No external audio services.
export function createFlightAudio(ctx,output){
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);let brown=0;
 const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++){const white=Math.random()*2-1;brown=(brown+white*.025)/1.025;samples[i]=white*.45+brown*2.8;}
 function bed(type,freq,q=.6){const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),pan=ctx.createStereoPanner();src.buffer=buffer;src.loop=true;filter.type=type;filter.frequency.value=freq;filter.Q.value=q;gain.gain.value=0;src.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(output);src.start(Math.random());return{src,filter,gain,pan};}
 function harmonic(freq,type='sine'){const src=ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner();src.type=type;src.frequency.value=freq;gain.gain.value=0;src.connect(gain);gain.connect(pan);pan.connect(output);src.start();return{src,gain,pan};}
 const wind=bed('lowpass',700),surf=bed('lowpass',520),jet=bed('bandpass',1000,.55),rotor=bed('lowpass',350),rocket=bed('bandpass',1700,.8),beam=bed('bandpass',620,4),laser=bed('bandpass',2000,3),engine=harmonic(48),turbine=harmonic(140),blade=harmonic(28);
 const rotorLfo=ctx.createOscillator(),rotorDepth=ctx.createGain();rotorLfo.frequency.value=17;rotorDepth.gain.value=.5;const rotorGate=ctx.createGain();rotorGate.gain.value=.5;rotor.src.disconnect();rotor.src.connect(rotorGate);rotorGate.connect(rotor.filter);rotorLfo.connect(rotorDepth);rotorDepth.connect(rotorGate.gain);rotorLfo.start();
 const all=[wind,surf,jet,rotor,rocket,beam,laser,engine,turbine,blade],lastDistance=new Map();let lastTime=0,lastEvent=-1,lastMix=-1;
 function set(node,value,tau=.10){node.setTargetAtTime(value,ctx.currentTime,tau);}
 function locate(item,p){if(!item)return{gain:0,pan:0,doppler:1};const dx=item.x-p.x,dz=item.z-p.z,dy=item.y-p.y,dist=Math.hypot(dx,dy,dz),prev=lastDistance.get(item.id);lastDistance.set(item.id,{dist,time:ctx.currentTime});const radial=prev?(dist-prev.dist)/Math.max(.02,ctx.currentTime-prev.time):0;return{gain:1/(1+(dist/330)**2),pan:clamp((dx*Math.cos(p.heading||0)-dz*Math.sin(p.heading||0))/Math.max(80,dist),-1,1),doppler:clamp(343/(343+radial*.35),.65,1.5)};}
 function update({active,muted,player:p,playerType='ufo',aircraft=[],missiles=[],laser:laserTarget,level=1,comms=false}={}){
  if(!active||muted||!p){for(const v of all)set(v.gain.gain,0,.07);lastDistance.clear();return;}
  if(ctx.currentTime-lastMix<1/30)return;lastMix=ctx.currentTime;const gravity=playerType==='ufo';
  const speed=Math.hypot(p.vx||0,p.vz||0),alt=Math.max(0,613-p.y),air=1-clamp((alt-1600)/5700,0,1),duck=comms?.65:1,t=ctx.currentTime;
  const nearest=list=>list.reduce((best,a)=>!best||Math.hypot(a.x-p.x,a.y-p.y,a.z-p.z)<Math.hypot(best.x-p.x,best.y-p.y,best.z-p.z)?a:best,null);
  const jets=locate(playerType!=='ufo'&&playerType!=='blackhawk'?{...p,id:'player-jet'}:nearest(aircraft.filter(a=>a.type!=='blackhawk'&&a.type!=='ufo')),p),heli=locate(playerType==='blackhawk'?{...p,id:'player-heli'}:nearest(aircraft.filter(a=>a.type==='blackhawk')),p),missile=locate(nearest(missiles.filter(a=>!a.rifle)),p);
  set(wind.gain.gain,(gravity?.002+clamp(speed/18000,0,.018):.035+clamp(speed/900,0,.28))*air*duck);set(wind.filter.frequency,350+speed*1.7);
  const coast=level===7||level===4,thermal=level===6;
  set(surf.gain.gain,(coast?.08+Math.sin(t*.35)*.025:thermal?.055:.015)*air*duck);set(surf.filter.frequency,coast?420:thermal?1450:260);
  set(engine.gain.gain,(gravity?.003+(p.dash>0?.002:0):0)*duck);set(engine.src.frequency,38+Math.sin(t*.4)*.4);
  set(jet.gain.gain,jets.gain*.52*air*duck);set(jet.filter.frequency,900*jets.doppler);set(jet.pan.pan,jets.pan);
  set(turbine.gain.gain,jets.gain*.12*air*duck);set(turbine.src.frequency,170*jets.doppler);set(turbine.pan.pan,jets.pan);
  set(rotor.gain.gain,heli.gain*.62*air*duck);set(rotor.pan.pan,heli.pan);set(rotorLfo.frequency,18*heli.doppler);set(blade.gain.gain,heli.gain*.075*air*duck);set(blade.src.frequency,36*heli.doppler);set(blade.pan.pan,heli.pan);
  set(rocket.gain.gain,missile.gain*.35*air);set(rocket.filter.frequency,1800*missile.doppler);set(rocket.pan.pan,missile.pan);
  set(beam.gain.gain,p.beam?.12:0);set(beam.filter.frequency,540+Math.sin(t*2)*95);
  set(laser.gain.gain,laserTarget?.10:0);set(laser.filter.frequency,2100+Math.sin(t*31)*130);
  if(t-lastTime>3){for(const[id,v]of lastDistance)if(t-v.time>2)lastDistance.delete(id);lastTime=t;}
 }
 function event(kind,origin,player,playerType='ufo'){
  if(ctx.state!=='running')return;const now=ctx.currentTime;if(now-lastEvent<.045&&kind==='hit')return;lastEvent=now;
  // Gravity propulsion has no exhaust or turbine. A brief, quiet field pulse only.
  if(kind==='dash'&&playerType==='ufo'){const field=ctx.createOscillator(),gain=ctx.createGain();field.type='sine';field.frequency.setValueAtTime(48,now);field.frequency.exponentialRampToValueAtTime(32,now+.45);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.018,now+.06);gain.gain.exponentialRampToValueAtTime(.0001,now+.6);field.connect(gain);gain.connect(output);field.start(now);field.stop(now+.65);field.onended=()=>{field.disconnect();gain.disconnect();};return;}
  const spatial=origin&&player?locate({...origin,id:'event'},player):{gain:1,pan:0};
  const explode=kind==='explosion'||kind==='hit',duration=explode?1.9:kind==='dash'?1.1:kind==='missile'?.65:.8;
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain(),pan=ctx.createStereoPanner();src.buffer=buffer;filter.type=explode?'lowpass':'bandpass';filter.Q.value=explode?.6:1.4;filter.frequency.setValueAtTime(explode?3200:kind==='missile'?2200:700,now);filter.frequency.exponentialRampToValueAtTime(explode?70:kind==='missile'?180:1400,now+duration);pan.pan.value=spatial.pan;
  const volume=(explode?.85:kind==='dash'?.5:kind==='missile'?.38:.17)*spatial.gain;amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(Math.max(.001,volume),now+.012);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
  src.connect(filter);filter.connect(amp);amp.connect(pan);pan.connect(output);src.start(now,Math.random()*.5);src.stop(now+duration+.05);
  const osc=ctx.createOscillator(),low=ctx.createGain();osc.frequency.setValueAtTime(explode?92:kind==='capture'||kind==='upgrade'?145:85,now);osc.frequency.exponentialRampToValueAtTime(explode?26:kind==='capture'||kind==='upgrade'?580:38,now+duration);low.gain.setValueAtTime(.0001,now);low.gain.exponentialRampToValueAtTime(Math.max(.001,(explode?.7:.14)*spatial.gain),now+.01);low.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(low);low.connect(pan);osc.start(now);osc.stop(now+duration+.05);
  src.onended=()=>{src.disconnect();filter.disconnect();amp.disconnect();};osc.onended=()=>{osc.disconnect();low.disconnect();pan.disconnect();};
 }
 return{update,event};
}
