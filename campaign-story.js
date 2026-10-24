// Nine operations follow one rescue, with numeric goal definitions shared by flight and briefing.
export const CAMPAIGN_MISSIONS = [
 {
  "name": "FIRST CONTACT",
  "text": "Calibrate on 4 cattle and 2 humans. Scan the distress echo, then extract.",
  "time": 210,
  "cow": 4,
  "human": 2,
  "intel": 1
 },
 {
  "name": "THE RECOVERY ROUTE",
  "text": "Recover 4 witnesses, capture a Black Hawk intact, and scan the convoy relay.",
  "time": 240,
  "human": 4,
  "blackhawk": 1,
  "intel": 1
 },
 {
  "name": "BORROWED WINGS",
  "text": "Capture 2 fighters intact. Scan both identification relays, then extract.",
  "time": 270,
  "fighter": 2,
  "intel": 2
 },
 {
  "name": "BREAK THE SILENCE",
  "text": "Disable 3 SAM batteries and scan the jamming hub. Open a channel to the crew.",
  "time": 270,
  "sam": 3,
  "intel": 1
 },
 {
  "name": "BLACKBIRD PROTOCOL",
  "text": "Capture the SR-71 intact and scan the archive terminal. Find the crash approach.",
  "time": 330,
  "sr71": 1,
  "intel": 1
 },
 {
  "name": "COLD CIRCUIT",
  "text": "Disable 2 SAM batteries. Scan both geothermal control stations to sever the containment grid.",
  "time": 420,
  "sam": 2,
  "intel": 2
 },
 {
  "name": "THE HUMAN SIGNAL",
  "text": "Recover 4 island engineers and 2 Black Hawk recorders. Scan the offshore transmission link.",
  "time": 450,
  "human": 4,
  "blackhawk": 2,
  "intel": 1
 },
 {
  "name": "THE LAST HORIZON",
  "text": "Capture 3 patrol fighters and disable 4 SAM batteries. Scan the launch authorization to open the rescue corridor.",
  "time": 480,
  "fighter": 3,
  "sam": 4,
  "intel": 1
 },
 {
  "name": "NO ONE LEFT BEHIND",
  "text": "Rescue all 6 Asterion crew. Evade or disable the recovery troops, then extract together.",
  "time": 420,
  "alien": 6
 }
];
export const CREW_ROSTER = [
 {
  "name": "NEM",
  "role": "PATHFINDER",
  "character": 1,
  "rescueLine": "I KEPT THE BEACON LIT. I KNEW SOMEONE WOULD HEAR."
 },
 {
  "name": "VEK",
  "role": "ENGINEER",
  "character": 2,
  "rescueLine": "THE DRIVE IS GONE. THE CREW IS WHAT MATTERS."
 },
 {
  "name": "SERA",
  "role": "MEDIC",
  "character": 3,
  "rescueLine": "EVERYONE IS ALIVE. KEEP THE EXTRACTION CHANNEL OPEN."
 },
 {
  "name": "LIO",
  "role": "NAVIGATOR",
  "character": 4,
  "rescueLine": "I HAVE OUR STAR CHARTS. WE CAN STILL FIND OUR WAY HOME."
 },
 {
  "name": "ORR",
  "role": "PILOT",
  "character": 5,
  "rescueLine": "I COULD NOT SAVE THE SHIP. THANK YOU FOR COMING FOR US."
 },
 {
  "name": "TAL",
  "role": "SIGNALS OFFICER",
  "character": 6,
  "rescueLine": "LAST SIGNAL ACCOUNTED FOR. THERE IS NO ONE LEFT BELOW."
 }
];
export const CAMPAIGN_STORY = [
 {
  "title": "Six voices in the noise",
  "chapter": "01 / THE DISTRESS CALL",
  "brief": "The Asterion has fallen to Earth. Six crew survived, but a military jammer hides their location. Calibrate your bioscanner on local life, then read the faint distress echo before the recovery teams erase it.",
  "outcome": "Six living crew confirmed. The echo contains a convoy call sign: BLACKPINE. Your search now has a direction.",
  "intelLabel": "DISTRESS ECHO",
  "intelBrief": "CALIBRATE 4 CATTLE AND 2 HUMANS. THEN HOLD SPACE WITHIN 150 M OF THE ECHO, BELOW 500 M AGL.",
  "objectiveDetails": {
   "cow": "4 REQUIRED. THESE LARGE LIFE SIGNS CALIBRATE THE RESCUE SCANNER.",
   "human": "2 REQUIRED. ISOLATE HUMAN SIGNATURES FROM THE SIX ALIEN LIFE SIGNS.",
   "intel": "SCAN THE MARKED DISTRESS ECHO TO IDENTIFY THE RECOVERY CONVOY."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "SIX CREW ARE STILL ALIVE. CALIBRATE THE SCANNER; WE ARE BRINGING THEM HOME."
  },
  "intelComms": [
   {
    "speaker": "SHIP SYSTEMS",
    "line": "ECHO DECODED: BLACKPINE CONVOY. SIX ALIEN SIGNALS CONFIRMED."
   }
  ],
  "progressComms": {
   "cow": {
    "speaker": "SHIP SYSTEMS",
    "line": "LARGE-LIFE CALIBRATION LOCKED. HUMAN SIGNATURES WILL REMOVE THE REMAINING NOISE."
   },
   "human": {
    "speaker": "COMMANDER ARA",
    "line": "SURVIVAL, NOT SPECIMENS. EVERY CONTACT HELPS US FIND OUR PEOPLE."
   }
  },
  "readyComms": {
   "speaker": "COMMANDER ARA",
   "line": "WE HAVE A CONVOY CALL SIGN. TAKE THE BLUE EXTRACTION ROUTE TO BLACKPINE."
  }
 },
 {
  "title": "A trail through Blackpine",
  "chapter": "02 / FOLLOW THE CONVOY",
  "brief": "A recovery convoy carried Asterion debris through Blackpine. Four witnesses hold the missing route; a Black Hawk flight recorder can verify it. Copy the convoy relay to find where the military sent the wreckage.",
  "outcome": "The recorder places the wreck in a sealed mountain basin. Two fighter identification keys can open the military relay network.",
  "intelLabel": "CONVOY RELAY",
  "intelBrief": "RECOVER 4 WITNESSES AND THE BLACK HAWK RECORDER. THEN HOLD SPACE OVER THE CONVOY RELAY.",
  "objectiveDetails": {
   "human": "4 REQUIRED. RECONSTRUCT THE CONVOY ROUTE FROM WITNESS CONTACTS.",
   "blackhawk": "1 REQUIRED, INTACT. STAY CLOSE WITH THE TRACTOR BEAM TO RECOVER ITS FLIGHT RECORDER.",
   "intel": "COPY THE CONVOY RELAY AT THE MARKED SCAN SITE."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "THE CONVOY LEFT A TRAIL. FIND THE WITNESSES AND TAKE THAT BLACK HAWK INTACT."
  },
  "intelComms": [
   {
    "speaker": "SHIP SYSTEMS",
    "line": "RELAY COPIED. THE WRECK WAS MOVED INTO A SEALED MOUNTAIN SECTOR."
   }
  ],
  "progressComms": {
   "human": {
    "speaker": "SHIP SYSTEMS",
    "line": "WITNESS ROUTE RECONSTRUCTED. CHECK IT AGAINST THE HELICOPTER RECORDER."
   },
   "blackhawk": {
    "speaker": "COMMANDER ARA",
    "line": "FLIGHT RECORDER SECURED. OUR CREW WERE ALIVE WHEN THE CONVOY ARRIVED."
   }
  },
  "readyComms": {
   "speaker": "COMMANDER ARA",
   "line": "THE TRAIL ENDS BEHIND MILITARY IDENTIFICATION CHECKS. NEXT, WE BORROW THEIR WINGS."
  }
 },
 {
  "title": "Two keys to a locked sky",
  "chapter": "03 / INFILTRATE THE NETWORK",
  "brief": "The military network rejects our signal. Capture two fighters for separate identification keys, then copy both relay nodes. Together they will reveal which transmitter is silencing the Asterion crew.",
  "outcome": "The two relays agree: Port Halcyon is jamming the basin. Silence its defenses and the survivors can speak to us.",
  "intelLabel": "IDENTIFICATION RELAYS",
  "intelBrief": "CAPTURE BOTH FIGHTER IDENTIFICATION KEYS. THEN SCAN BOTH MARKED RELAYS; EACH NODE COUNTS ONCE.",
  "objectiveDetails": {
   "fighter": "2 REQUIRED, INTACT. CAPTURE THEIR IDENTIFICATION KEYS WITH THE TRACTOR BEAM.",
   "intel": "2 RELAYS REQUIRED. HOLD SPACE NEAR EACH MARKED NODE TO COPY ITS NETWORK DATA."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "TWO FIGHTERS, TWO KEYS. THEIR OWN NETWORK WILL LEAD US TO THE JAMMER."
  },
  "intelComms": [
   {
    "speaker": "SHIP SYSTEMS",
    "line": "FIRST RELAY COPIED. A SECOND NODE WILL TRIANGULATE THE JAMMER."
   },
   {
    "speaker": "SHIP SYSTEMS",
    "line": "SECOND RELAY COPIED. JAMMING SOURCE: PORT HALCYON."
   }
  ],
  "progressComms": {
   "fighter": {
    "speaker": "COMMANDER ARA",
    "line": "BOTH IDENTIFICATION KEYS SECURED. THE RELAY NETWORK CAN NO LONGER HIDE."
   }
  },
  "readyComms": {
   "speaker": "COMMANDER ARA",
   "line": "PORT HALCYON IS THE LOCK. WE NOW HAVE THE KEYS. EXTRACT AND REGROUP."
  }
 },
 {
  "title": "The first answer",
  "chapter": "04 / RESTORE CONTACT",
  "brief": "Port Halcyon shields its jammer with three SAM batteries. Disable them and copy the jamming hub. For the first time since the crash, we may hear the crew answer.",
  "outcome": "NEM: “Six of us. The beacon is failing. Please hurry.” The crew are in Obsidian Basin; a Blackbird archive holds the safe approach.",
  "intelLabel": "JAMMING HUB",
  "intelBrief": "DISABLE THE THREE SAM BATTERIES AND COPY THE MARKED JAMMING HUB.",
  "objectiveDetails": {
   "sam": "3 REQUIRED. USE F FOR LASER OR R FOR MISSILES; AUTOMATIC FLARES HELP AGAINST LOCK-ONS.",
   "intel": "HOLD SPACE AT THE JAMMING HUB TO RECOVER THE CREW CHANNEL."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "THOSE SAMS GUARD THE JAMMER. BREAK THE DEFENSES AND GET OUR CREW BACK ON THE AIR."
  },
  "intelComms": [
   {
    "speaker": "NEM / BROKEN SIGNAL",
    "line": "ARA? SIX OF US. OBSIDIAN BASIN. THE BEACON IS FAILING. PLEASE HURRY."
   }
  ],
  "progressComms": {
   "sam": {
    "speaker": "SHIP SYSTEMS",
    "line": "ALL THREE SAM BATTERIES DISABLED. THE JAMMING HUB IS EXPOSED."
   }
  },
  "readyComms": {
   "speaker": "COMMANDER ARA",
   "line": "WE HEARD YOU, NEM. HOLD TOGETHER. WE ARE FINDING A WAY IN."
  }
 },
 {
  "title": "Catch the impossible",
  "chapter": "05 / FIND THE APPROACH",
  "brief": "The crash basin is ringed by an automated containment network. Capture the SR-71 intact and copy its archive to identify the system protecting the perimeter. Coordinates alone will not get our people home.",
  "outcome": "The Blackbird survey exposes a three-part containment network: geothermal power, an island relay, and a salt-flat launch complex. We found the crew. Now we must open a route they can survive.",
  "intelLabel": "RECON ARCHIVE",
  "intelBrief": "CAPTURE THE SR-71 INTACT, THEN COMPLETE THE ARCHIVE SCAN. BOTH OBJECTIVES ARE REQUIRED.",
  "objectiveDetails": {
   "sr71": "1 REQUIRED, INTACT. INTERCEPT ITS PATH, BOOST TO CLOSE, AND HOLD SPACE TO MAINTAIN THE CAPTURE.",
   "intel": "COPY THE MARKED ARCHIVE TERMINAL TO COMPLETE THE CRASH APPROACH CHART."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "THE BLACKBIRD HAS OUR WAY IN. INTERCEPT ITS PATH; DO NOT CHASE FROM FAR BEHIND."
  },
  "intelComms": [
   {
    "speaker": "SHIP SYSTEMS",
    "line": "ARCHIVE COPIED. COMBINE IT WITH THE BLACKBIRD SURVEY TO RESOLVE THE APPROACH."
   }
  ],
  "progressComms": {
   "sr71": {
    "speaker": "COMMANDER ARA",
    "line": "BLACKBIRD SECURED. ITS SURVEY SHOWS WHERE THE CORDON GETS ITS POWER."
   }
  },
  "readyComms": {
   "speaker": "VEK / CREW CHANNEL",
   "line": "YOUR CHART IS RIGHT. BUT THE CORDON WILL FIRE ON OUR LIFE SIGNS. CUT ITS POWER FIRST."
  }
 },
 {
  "title": "The heat beneath the silence",
  "chapter": "06 / CUT THE POWER",
  "brief": "Below Krafla Reach, a geothermal plant feeds the containment grid around our crew. Remove two SAM guards, then upload shutdown commands at both control stations. Vek can hold the damaged life-support system together, but not against a second energy surge.",
  "outcome": "The containment fence is dark. Vek stabilizes life support. A human engineer has broken radio silence from Pelagos Key; she knows why the Asterion was targeted.",
  "intelLabel": "GEOTHERMAL CONTROLS",
  "intelBrief": "DISABLE TWO SAMS. SCAN BOTH WHITE CONTROL BEACONS BELOW 500 M AGL. THE SECOND SCAN SHUTS DOWN THE GRID.",
  "objectiveDetails": {
   "sam": "2 REQUIRED. DESTROY THE SAM GUARDS WITH F OR R TO EXPOSE THE CONTROL CHANNEL.",
   "intel": "2 REQUIRED. HOLD SPACE AT EACH GEOTHERMAL CONTROL; EACH STATION COUNTS ONCE."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "VEK NEEDS THAT GRID OFFLINE. CLEAR THE SAM GUARDS; THEN COPY THE TWO SHUTDOWN NODES."
  },
  "intelComms": [
   {
    "speaker": "VEK / ENGINEER",
    "line": "FIRST CIRCUIT IS DOWN. THE CABIN LIGHTS ARE STEADY AGAIN. ONE MORE NODE."
   },
   {
    "speaker": "TAL / SIGNALS",
    "line": "THE FENCE IS DARK. INCOMING HUMAN TRANSMISSION: PELAGOS KEY. SHE SAYS SHE CAN HELP."
   }
  ],
  "progressComms": {
   "sam": {
    "speaker": "SHIP SYSTEMS",
    "line": "GUARD BATTERIES SILENCED. BOTH CONTROL STATIONS ARE NOW ACCESSIBLE."
   }
  },
  "readyComms": {
   "speaker": "COMMANDER ARA",
   "line": "LIFE SUPPORT IS STABLE. FOLLOW THE ENGINEER TO PELAGOS. SOMEONE ON EARTH WANTS US TO SUCCEED."
  }
 },
 {
  "title": "Someone on the other side",
  "chapter": "07 / FIND AN ALLY",
  "brief": "Dr. Mara Vale and three relay engineers are stranded on Pelagos Key. They refused to erase the Asterion distress call. Bring four engineers aboard and recover both Black Hawk recorders to authenticate their evidence, then transmit their evacuation codes through the island relay.",
  "outcome": "Vale confirms the truth: an automated defense system mistook the Asterion rescue beacon for a weapon. The salt-flat launch complex is preparing a strike. Its patrol keys and launch terminal can still cancel it.",
  "intelLabel": "ISLAND UPLINK",
  "intelBrief": "RECOVER FOUR ENGINEERS AND TWO BLACK HAWKS INTACT. THEN SCAN THE ISLAND UPLINK TO AUTHENTICATE VALE’S CODES.",
  "objectiveDetails": {
   "human": "4 REQUIRED. FOLLOW HUMAN MARKERS; HOLD SPACE TO BRING ENGINEERS ABOARD.",
   "blackhawk": "2 REQUIRED, INTACT. TRACTOR CAPTURE THEIR FLIGHT RECORDERS.",
   "intel": "HOLD SPACE AT THE WHITE UPLINK AFTER BOTH RECOVERY GOALS."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "THOSE ENGINEERS RISKED EVERYTHING TO KEEP THE CHANNEL OPEN. GET THEM ABOARD. WE LEAVE NO ONE BEHIND."
  },
  "intelComms": [
   {
    "speaker": "DR. MARA VALE",
    "line": "IT WAS AN AUTOMATED STRIKE ORDER. THE SYSTEM STILL THINKS YOUR BEACON IS A WEAPON. I CAN HELP YOU CANCEL IT."
   }
  ],
  "progressComms": {
   "human": {
    "speaker": "SHIP SYSTEMS",
    "line": "ALL FOUR ENGINEERS ARE ABOARD. AUTHENTICATE THEIR STORY WITH THE TWO FLIGHT RECORDERS."
   },
   "blackhawk": {
    "speaker": "SHIP SYSTEMS",
    "line": "BOTH RECORDERS MATCH. THE ENGINEERS WERE TELLING THE TRUTH. OPEN THE ISLAND UPLINK."
   }
  },
  "readyComms": {
   "speaker": "SERA / MEDIC",
   "line": "FOUR HUMAN PASSENGERS SAFE. VALE IS WITH TAL ON THE LINK. WE CAN DO THIS TOGETHER."
  }
 },
 {
  "title": "An open sky",
  "chapter": "08 / BREAK THE CORDON",
  "brief": "The Glass Meridian launch complex controls the final air-defense corridor. Capture three fighter authorization keys and disable four SAM batteries. Then let Vale and Tal cancel the strike through the launch terminal. When the sky opens, our next flight brings everyone home.",
  "outcome": "STRIKE CANCELLED. The corridor is open. Nem has lit six emergency beacons around the Asterion wreck. For the first time, the crew can hear your engines instead of the sirens.",
  "intelLabel": "LAUNCH TERMINAL",
  "intelBrief": "CAPTURE THREE FIGHTERS INTACT AND DISABLE FOUR SAMS. THEN SCAN THE LAUNCH TERMINAL TO CANCEL THE STRIKE.",
  "objectiveDetails": {
   "fighter": "3 REQUIRED, INTACT. TRACTOR CAPTURE THE PATROL AUTHORIZATION KEYS.",
   "sam": "4 REQUIRED. USE F FOR LASERS OR R FOR GUIDED MISSILES.",
   "intel": "HOLD SPACE AT THE WHITE TERMINAL AFTER BOTH DEFENSE GOALS."
  },
  "openingComms": {
   "speaker": "COMMANDER ARA",
   "line": "THIS IS THE LAST LOCK. THREE KEYS, FOUR BATTERIES, ONE TRANSMISSION. MAKE THE SKY SAFE FOR OUR CREW."
  },
  "intelComms": [
   {
    "speaker": "TAL / SIGNALS",
    "line": "VALE’S CODE IS ACCEPTED. STRIKE CANCELLED. NEM, LIGHT EVERY BEACON. WE ARE COMING."
   }
  ],
  "progressComms": {
   "fighter": {
    "speaker": "SHIP SYSTEMS",
    "line": "ALL THREE PATROL KEYS SECURED. LAUNCH AUTHORIZATION IS OURS."
   },
   "sam": {
    "speaker": "SHIP SYSTEMS",
    "line": "CORRIDOR DEFENSES DISABLED. TRANSMIT THE STAND-DOWN AT THE WHITE TERMINAL."
   }
  },
  "readyComms": {
   "speaker": "NEM / PATHFINDER",
   "line": "SIX LIGHTS AROUND THE WRECK. SIX OF US WAITING. THE SKY IS QUIET NOW."
  }
 },
 {
  "title": "No one left behind",
  "chapter": "09 / THE ASTERION RESCUE",
  "brief": "The power grid is down. Vale and Tal have cancelled the strike. Nem, Vek, Sera, Lio, Orr, and Tal wait around the Asterion wreck, but the local recovery troops have not stood down. Bring every named survivor aboard, then reach extraction together. Nine operations. One promise.",
  "outcome": "All six crew are aboard. Their names replace the distress signals. The Asterion is lost; her people are going home.",
  "intelLabel": "CREW BEACONS",
  "intelBrief": "FOLLOW THE SIX VIOLET RESCUE MARKERS. HOLD SPACE TO BRING EACH SURVIVOR ABOARD.",
  "objectiveDetails": {
   "alien": "6 REQUIRED: NEM, VEK, SERA, LIO, ORR, AND TAL. HOLD SPACE OVER EACH VIOLET CREW MARKER."
  },
  "openingComms": {
   "speaker": "NEM / CREW CHANNEL",
   "line": "WE CAN SEE YOU. SIX OF US AROUND THE WRECK. PLEASE DO NOT LEAVE ANYONE BEHIND."
  },
  "intelComms": [],
  "progressComms": {},
  "readyComms": {
   "speaker": "COMMANDER ARA",
   "line": "SIX ABOARD. EVERYONE ACCOUNTED FOR. TAKE US HOME."
  }
 }
];
export const RESCUE_DIALOGUE = [
 {
  "speaker": "SERA / MEDICAL OFFICER",
  "character": 3,
  "line": "COMMANDER… SIX LIFE SIGNS. ALL ACCOUNTED FOR. YOU KEPT YOUR PROMISE."
 },
 {
  "speaker": "NEM / PATHFINDER",
  "character": 1,
  "line": "WE WATCHED THE SKY UNTIL THE BEACON DIED. THEN WE SAW YOUR LIGHT. I KNEW YOU HAD FOUND US."
 },
 {
  "speaker": "VEK / ENGINEER",
  "character": 2,
  "line": "THE ASTERION IS GONE. BUT HER CREW IS HERE. THAT’S WHAT WE WERE TRYING TO SAVE."
 },
 {
  "speaker": "COMMANDER ARA",
  "character": 0,
  "line": "WE HEARD YOU. ALL SIX OF YOU. WE’RE GOING HOME."
 }
];

const comm=(speaker,line)=>({speaker,line});
export function campaignComms(level,event,context={}) {
 const stage=CAMPAIGN_STORY[level-1];if(!stage)return null;
 let message=null,id=`${level}:${event}`,priority=1;
 if(event==='launch')message=stage.openingComms;
 else if(event==='intel'){
  const index=Math.max(0,Math.floor(Number(context.current)||1)-1);
  message=stage.intelComms[index];id+=`:${index+1}`;priority=2;
 }else if(event==='progress'){
  const required=Number(context.required)||CAMPAIGN_MISSIONS[level-1][context.key];
  const current=Number(context.current);
  if(!(required>0)||!Number.isFinite(current)||current<required)return null;
  message=stage.progressComms[context.key];id+=`:${context.key}`;
 }else if(event==='ready'){message=stage.readyComms;priority=3;}
 else if(event==='crew'){
  const index=Number.isInteger(context.crewIndex)?context.crewIndex:Math.floor(Number(context.current)||1)-1;
  const crew=CREW_ROSTER[index];if(level!==CAMPAIGN_MISSIONS.length||!crew)return null;
  message=comm(`${crew.name} / ${crew.role}`,crew.rescueLine);id+=`:${index}`;priority=3;
 }else if(event==='critical'){
  message=comm('SHIP SYSTEMS','HULL CRITICAL. BREAK CONTACT AND BOOST CLEAR. WE NEED THIS SHIP TO BRING THE CREW HOME.');priority=4;
 }else if(event==='time'){
  const remaining=Number(context.remaining);if(!Number.isFinite(remaining)||remaining>60||remaining<=0)return null;
  message=comm('COMMANDER ARA',level===CAMPAIGN_MISSIONS.length?'ONE MINUTE. CHECK THE CREW TRACKER; EVERY SURVIVOR MUST BE ABOARD BEFORE EXTRACTION.':'ONE MINUTE. CHECK YOUR REMAINING GOALS. ONCE COMPLETE, FLY TO THE BLUE EXTRACTION BEACON.');priority=2;
 }
 return message?{id,...message,priority}:null;
}
