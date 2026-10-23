const fs=require('node:fs/promises');
const sharp=require('/Users/bethrooney/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
// Source-image centerlines: silver/white channels are traced as well as cyan ones.
// Each point is measured in the 1672 x 941 original photograph. Paths stop at
// component pads or the crop; no invented wire is drawn over an opaque component.
const definitions=[];
const add=(id,branch,sourceComponent,delayMs,strength,points)=>definitions.push({id,branch,sourceComponent,delayMs,strength,points});

// West-facing GPU contacts and the broad channels running toward the left edge.
add('gpu-west-1','west','gpu',0,.8,[[1149,450],[1129,461],[1114,466],[1080,466],[1058,462],[1034,451],[1018,444],[995,440],[953,438],[842,438],[816,431],[796,414],[745,368]]);
add('gpu-west-2','west','gpu',32,.8,[[1166,465],[1141,476],[1122,481],[1085,481],[1058,478],[1033,468],[1009,456],[981,449],[941,447],[831,447],[810,442],[791,429],[751,397]]);
add('gpu-west-3','west','gpu',64,.85,[[1182,480],[1157,491],[1139,497],[1100,497],[1064,496],[1035,500],[1012,509],[966,535],[837,611],[737,674],[704,695],[677,704],[640,707],[591,705],[559,710],[534,720],[483,751],[393,811],[278,885],[238,911],[199,927],[150,936],[86,941]]);
add('gpu-west-4','west','gpu',96,.75,[[1197,493],[1167,508],[1142,515],[1119,516],[1083,511],[1054,513],[1026,522],[982,548],[851,626],[758,684],[719,711],[684,727],[653,735],[617,735],[586,734],[562,743],[540,760],[493,797],[444,829],[364,883],[278,941]]);

// Rear perimeter: long channels pass around the GPU and disappear into depth.
add('rear-perimeter-1','rear','rear-hub',160,.48,[[786,354],[832,391],[868,412],[898,418],[939,420],[978,416],[1008,408],[1047,388],[1135,340],[1208,301],[1233,286],[1242,275],[1240,263],[1225,248],[1146,192],[1054,125],[960,58],[884,0]]);
add('rear-perimeter-2','rear','rear-hub',190,.52,[[775,374],[822,413],[854,433],[879,439],[923,440],[979,438],[1024,430],[1062,415],[1154,361],[1246,308],[1271,291],[1282,275],[1286,257],[1283,240],[1272,225],[1197,171],[1100,101],[964,0]]);
add('rear-perimeter-3','rear','rear-hub',220,.48,[[810,424],[849,441],[889,445],[976,445],[1026,441],[1064,429],[1176,365],[1277,307],[1296,292],[1304,277],[1306,255],[1304,239],[1297,225],[1285,214],[1183,141],[1074,63],[985,0]]);
add('rear-local-1','rear','rear-hub',250,.65,[[1137,427],[1199,391],[1272,349],[1309,327],[1319,317],[1323,302],[1324,280]]);
add('rear-local-2','rear','rear-hub',280,.62,[[1151,436],[1240,384],[1309,345],[1333,330],[1345,315],[1346,299]]);

// Rear and north-east parallel traces. These share the processor electrically;
// their connection runs underneath the processor package and is intentionally hidden.
add('gpu-north-1','north','gpu',0,.7,[[1424,310],[1423,285],[1425,276],[1433,268],[1463,249],[1472,240],[1475,227],[1475,172]]);
add('gpu-north-2','north','gpu',28,.85,[[1437,322],[1436,289],[1439,278],[1448,269],[1478,251],[1487,241],[1490,230],[1490,175]]);
add('gpu-north-3','north','gpu',56,1,[[1454,332],[1447,326],[1445,318],[1445,290],[1448,278],[1462,265],[1484,251],[1493,240],[1496,229],[1496,200],[1500,191],[1511,184]]);
add('gpu-north-4','north','gpu',84,.8,[[1470,341],[1470,304],[1473,290],[1481,281],[1511,264],[1520,253],[1524,239],[1524,192]]);
add('gpu-north-5','north','gpu',112,.65,[[1487,323],[1514,305],[1526,292],[1530,279],[1530,269]]);
add('north-satellite-1','north','north-hub',310,.45,[[1288,192],[1316,186],[1342,169],[1359,151],[1372,134],[1396,119],[1432,98],[1468,76]]);
add('north-satellite-2','north','north-hub',340,.42,[[1299,202],[1324,194],[1354,174],[1371,157],[1384,141],[1404,128],[1439,108],[1483,82]]);
add('north-satellite-3','north','north-hub',370,.42,[[1401,234],[1433,216],[1453,204],[1462,193],[1466,180],[1466,132]]);

// East-facing contacts: each visible pin has its own channel, not a shared stripe.
add('gpu-east-1','east','gpu',0,.9,[[1558,515],[1605,547],[1632,560],[1650,563],[1671,563]]);
add('gpu-east-2','east','gpu',28,.9,[[1545,528],[1597,564],[1625,577],[1644,579],[1671,580]]);
add('gpu-east-3','east','gpu',56,1,[[1531,540],[1588,580],[1619,591],[1640,592],[1671,594]]);
add('gpu-east-4','east','gpu',84,.9,[[1516,550],[1576,592],[1613,608],[1638,612],[1671,613]]);
add('gpu-east-5','east','gpu',112,.85,[[1501,559],[1543,589],[1586,622],[1627,653],[1671,686]]);
add('gpu-east-6','east','gpu',140,.8,[[1486,570],[1529,601],[1575,635],[1620,669],[1651,691]]);
add('gpu-east-7','east','gpu',168,.7,[[1470,582],[1510,611],[1558,648],[1606,684],[1640,711]]);
add('east-upper-1','east','east-hub',240,.65,[[1609,444],[1624,452],[1632,462],[1634,475],[1634,486],[1641,495],[1671,518]]);
add('east-upper-2','east','east-hub',270,.65,[[1624,449],[1640,454],[1643,464],[1643,480],[1650,489],[1671,505]]);
add('east-upper-3','east','east-hub',300,.55,[[1634,432],[1661,450],[1671,457]]);
add('east-rear-1','east','east-hub',330,.5,[[1536,347],[1584,319],[1625,295],[1671,266]]);
add('east-rear-2','east','east-hub',360,.5,[[1550,362],[1597,334],[1635,312],[1671,291]]);
add('east-rear-3','east','east-hub',390,.48,[[1565,376],[1614,347],[1647,327],[1671,311]]);

// South-west fan from the processor pins: the original bright cyan route is
// extended through its actual silver continuation to the lower board perimeter.
add('gpu-south-1','south','gpu',0,.75,[[1227,532],[1227,564],[1225,601],[1220,622],[1207,641],[1185,659],[1127,697],[1068,734],[1015,769],[974,800],[950,820],[930,839],[914,864],[894,881],[868,896],[825,923],[798,941]]);
add('gpu-south-2','south','gpu',28,.75,[[1247,549],[1237,558],[1235,573],[1234,601],[1234,615]]);
add('gpu-south-3','south','gpu',56,.85,[[1264,563],[1255,571],[1253,585],[1253,617],[1251,641],[1243,655],[1224,671],[1171,705],[1107,746],[1056,781],[1031,806],[1021,828],[1019,850],[1010,871],[988,888],[952,912],[910,941]]);
add('gpu-south-4','south','gpu',84,1,[[1280,579],[1271,589],[1270,607],[1268,637],[1263,652],[1251,665],[1211,693],[1179,716],[1141,744],[1103,771],[1081,792],[1072,813],[1068,845],[1065,873],[1058,894],[1044,910],[1019,926],[996,941]]);
add('gpu-south-5','south','gpu',112,.85,[[1298,592],[1286,599],[1282,612],[1281,639],[1278,658],[1266,678],[1234,701],[1179,742],[1139,771],[1110,794],[1099,815],[1095,845],[1091,881],[1085,903],[1066,923],[1042,941]]);
add('gpu-south-6','south','gpu',140,.8,[[1413,604],[1412,632],[1404,650],[1386,667],[1353,690],[1323,717],[1297,741],[1290,755]]);
add('gpu-south-7','south','gpu',168,.8,[[1434,610],[1433,638],[1425,659],[1408,674],[1360,707],[1329,730],[1317,745],[1316,759]]);

// Local branches power the satellite devices and continue below the cropped image.
add('west-satellite-1','west','west-hub',290,.75,[[1161,587],[1147,597],[1103,626],[1061,654],[1046,668],[1030,680],[995,704],[957,730],[928,753],[910,770],[890,787],[868,802],[847,810],[823,813],[792,811],[747,808],[681,809],[614,809],[563,809],[539,814],[512,827],[443,870],[333,941]]);
add('gpu-west-inner-1','west','west-hub',128,.8,[[1137,515],[1161,530],[1186,550],[1207,570],[1221,590],[1218,611],[1209,636],[1189,655],[1139,687],[1085,722],[1044,748],[1000,777],[972,802],[951,823],[932,835],[909,844],[874,848],[825,847],[775,837],[733,827],[688,826],[620,825],[571,826],[539,837],[482,871],[378,941]]);
add('gpu-west-inner-2','west','west-hub',160,.72,[[1119,516],[1138,526],[1158,541],[1177,558],[1190,578],[1196,606],[1192,626],[1181,645],[1157,664],[1106,698],[1051,732],[1012,755],[967,785],[935,812],[909,825],[881,832],[843,834],[804,831],[768,822],[731,817],[663,816],[607,815],[563,819],[539,828],[494,857],[363,941]]);
add('west-local-terminal','west','west-hub',350,.42,[[434,818],[466,791],[506,756],[527,743],[546,743],[573,751],[601,765],[631,775],[658,778],[686,774],[722,759],[763,737],[802,717],[848,705],[892,703]]);
add('south-satellite-1','south','south-hub',310,.65,[[1378,656],[1347,677],[1318,701],[1290,722],[1269,740],[1253,754],[1217,780],[1189,799]]);
add('south-satellite-2','south','south-hub',340,.75,[[1195,801],[1186,814],[1180,835],[1175,858],[1175,878],[1173,888],[1166,897],[1141,916],[1107,941]]);
add('south-satellite-3','south','south-hub',370,.7,[[1160,815],[1153,837],[1152,858],[1147,879],[1135,894],[1108,913],[1070,941]]);
add('south-satellite-4','south','south-hub',400,.65,[[1467,648],[1448,650],[1430,661],[1419,675],[1416,690],[1415,717],[1415,742],[1421,756],[1451,780],[1498,816],[1551,858],[1613,906],[1657,941]]);
add('south-satellite-5','south','south-hub',430,.6,[[1387,693],[1383,710],[1384,741],[1389,756],[1404,772],[1444,805],[1498,847],[1551,890],[1615,941]]);
add('south-satellite-6','south','south-hub',460,.55,[[1323,753],[1346,770],[1362,783],[1373,797],[1376,815],[1376,848],[1374,876],[1368,899],[1351,916],[1321,941]]);

function smooth(points){
 const result=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  const steps=Math.max(4,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/3));
  for(let j=0;j<steps;j++){
   const t=j/steps,t2=t*t,t3=t2*t;
   result.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));
  }
 }
 result.push(points.at(-1));return result;
}
function resample(points){
 const distance=[0];for(let i=1;i<points.length;i++)distance.push(distance[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 const total=distance.at(-1);let segment=1;
 return {length:+total.toFixed(1),points:Array.from({length:121},(_,i)=>{
  const desired=total*i/120;while(segment<distance.length-1&&distance[segment]<desired)segment++;
  const t=(desired-distance[segment-1])/(distance[segment]-distance[segment-1]||1),a=points[segment-1],b=points[segment];
  return [+(Math.max(0,Math.min(1671,a[0]+(b[0]-a[0])*t))).toFixed(1),+(Math.max(0,Math.min(940,a[1]+(b[1]-a[1])*t))).toFixed(1)];
 })};
}
(async()=>{
 const fragments=JSON.parse(await fs.readFile('work/circuit-cyan-fragments.json','utf8')).routes;
 // Retain the exact colour-derived centerline on the original strong cyan paths.
 const refine=(id,points)=>{definitions.find(route=>route.id===id).points=points;};
 refine('gpu-north-3',[...fragments[0].slice().reverse(),[1506,185],[1511,184]]);
 refine('gpu-south-4',[[1280,579],[1278,592],[1277,612],...fragments[1],[1158,747],[1120,774],[1091,798],[1078,819],[1075,848],[1071,878],[1064,901],[1049,918],[1022,936],[1014,941]]);
 refine('gpu-east-3',[[1531,540],[1541,541],...fragments[2]]);
 refine('south-satellite-2',[[1195,801],[1186,814],...fragments[3]]);
 const routes=[],routeMetadata=[];
 for(const definition of definitions){const {points,...meta}=definition,{points:sampled,length}=resample(smooth(points));routes.push(sampled);routeMetadata.push({...meta,length});}
 const result={sourceWidth:1672,sourceHeight:941,routeMetadata,routes};
 await fs.writeFile('images/assembly/circuit-paths.json',JSON.stringify(result));
 const colors={west:'#fd3177',rear:'#9661e5',north:'#1776ff',east:'#ed7112',south:'#13a566'};
 const strokes=routes.map((points,i)=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${colors[routeMetadata[i].branch]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${points[0][0]}" cy="${points[0][1]}" r="3" fill="${colors[routeMetadata[i].branch]}"/>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941">${strokes}</svg>`;
 await fs.writeFile('work/circuit-network-overlay.svg',svg);
 await sharp('sources/technology-white-original.png').composite([{input:Buffer.from(svg)}]).png().toFile('work/circuit-network-review.png');
 await fs.writeFile('work/circuit-network-review.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Measured circuit network</title></head><body style="margin:0;background:#fff"><div style="position:relative"><img src="../sources/technology-white-original.png" style="width:100%;display:block" alt="Source board"><img src="circuit-network-overlay.svg" style="position:absolute;inset:0;width:100%" alt="Visible groove centerlines"></div><p>${routes.length} routes. Red = west, purple = rear perimeter, blue = north, orange = east, green = south.</p></body></html>`);
 console.log(JSON.stringify({routes:routes.length,samples:routes[0].length,branches:Object.fromEntries(Object.keys(colors).map(branch=>[branch,routeMetadata.filter(r=>r.branch===branch).length])),bytes:JSON.stringify(result).length}));
})();
