import { createRescueCinematic } from './bridge-cinematic.js?v=30.3';
import { createStoryVoice } from './story-voice.js?v=30.3';
import { RESCUE_DIALOGUE } from './campaign-story.js?v=30.3';
const $=id=>document.getElementById(id),voice=createStoryVoice(),scene=createRescueCinematic($('storySceneCanvas'),{quality:'native'}),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
let index=0,started=false,muted=false,last=performance.now(),elapsed=0;
scene.start({reduced,beatDuration:11});
function show(i){index=i;elapsed=0;const line=RESCUE_DIALOGUE[i];scene.setBeat(i);scene.setSpeaker(line.character);$('storySpeaker').textContent=line.speaker;$('storyDialogue').textContent=line.line;$('storyBeat').textContent=String(i+1).padStart(2,'0')+' / 04';$('previewStart').textContent=i===3?'REPLAY SCENE →':'NEXT LINE →';$('previous').disabled=i===0;voice.play(i,muted);}
$('previewStart').onclick=()=>{started=true;show(index===3?0:($('storyBeat').textContent==='ENDING SCENE PREVIEW'?0:index+1));};
$('previous').onclick=()=>show(Math.max(0,index-1));$('voiceMute').onclick=()=>{muted=!muted;$('voiceMute').textContent=muted?'UNMUTE':'MUTE';$('voiceMute').setAttribute('aria-pressed',String(muted));if(muted)voice.stop();else if(started)voice.play(index);};
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(started){scene.update(dt);elapsed+=dt;if(elapsed>=11&&index<3)show(index+1);}else scene.update(0);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{voice.stop();scene.dispose();});
