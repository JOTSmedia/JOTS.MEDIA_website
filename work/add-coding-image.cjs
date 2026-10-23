const fs=require('fs');
const sharp=require('/Users/bethrooney/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{fs.copyFileSync('work/coding-source.jpg','sources/coding-3840.jpg');for(const width of [640,960,1600,2560,3840])await sharp('sources/coding-3840.jpg').resize({width,withoutEnlargement:true}).webp({quality:80,effort:5}).toFile(`images/editorial/coding-${width}.webp`);console.log('Coding photograph optimized at five adaptive sizes.');})();
