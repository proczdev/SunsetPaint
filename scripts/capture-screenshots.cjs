// Render a sample project in the real Electron renderer. No user projects are read.
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
app.setPath('userData',path.join(app.getPath('temp'),'sunset-paint-screenshots'));
ipcMain.handle('recover',()=>null);ipcMain.handle('autosave',()=>{});
const scene=[];
function poly(points,color){const [x,y]=points[0];scene.push({type:'fill',x,y,loops:[points.map(p=>[p[0]-x,p[1]-y])],width:1,color,opacity:1})}
function circle(x,y,r,color){scene.push({type:'circle',x:x-r,y:y-r,points:[[0,0],[r*2,r*2]],width:1,color,filled:true,opacity:1})}
function stroke(points,color,width){const [x,y]=points[0];scene.push({type:'brush',x,y,points:points.map(p=>[p[0]-x,p[1]-y]),width,color,opacity:1,smooth:true})}
poly([[350,450],[3746,450],[3746,3646],[350,3646]],'#ffb18a');
circle(2380,1590,650,'#d75000');
// The same small face is nested inside the right eye of the large sun.
circle(2170,1470,65,'#3c001c');circle(2570,1470,65,'#3c001c');
stroke(Array.from({length:50},(_,i)=>{const a=i/49*Math.PI;return[2370+190*Math.cos(a),1630+150*Math.sin(a)]}),'#3c001c',30);
circle(2570,1470,40,'#f5e4c0');circle(2556,1462,4,'#3c001c');circle(2584,1462,4,'#3c001c');stroke(Array.from({length:30},(_,i)=>{const a=i/29*Math.PI;return[2570+15*Math.cos(a),1473+12*Math.sin(a)]}),'#3c001c',3);
function hill(y,amp,phase,color){const p=Array.from({length:120},(_,i)=>{const x=350+i/119*3396;return[x,y+Math.sin(x/650+phase)*amp]});poly([...p,[3746,3646],[350,3646]],color)}
hill(2360,225,1.5,'#efae70');hill(2700,260,0,'#99051f');hill(3210,200,2.2,'#3c001c');
for(const [x,y,r]of [[870,1080,70],[1300,1620,42],[3250,970,58]]){const p=[];for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,s=i%2?.24:1;p.push([x+Math.cos(a)*r*s,y+Math.sin(a)*r*s])}poly(p,'#f5e4c0')}
for(let i=0;i<5;i++){const x=720+i*100,y=3200+(i%2)*80;stroke([[x,3550],[x+30,y+110],[x+70,y-220]],'#efae70',17);for(let j=0;j<4;j++){const yy=y-140+j*90;stroke([[x+55,yy+100],[x-60,yy+15]],'#efae70',25);stroke([[x+55,yy+100],[x+150,yy-5]],'#efae70',25)}}
const project={format:'sunset-paint',version:1,paper:'#fffdf8',scene,view:{x:2048,y:2048,z:.16}};
fs.mkdirSync(path.join(root,'examples'),{recursive:true});fs.writeFileSync(path.join(root,'examples','Sunset-study.sunset'),JSON.stringify(project));
app.whenReady().then(async()=>{let failed=false;const w=new BrowserWindow({width:1440,height:960,frame:false,show:false,webPreferences:{backgroundThrottling:false,preload:path.join(root,'preload.js'),contextIsolation:true}});const run=s=>w.webContents.executeJavaScript(s,true);const settle=()=>run('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
try{await w.loadFile(path.join(root,'index.html'));await settle();await run(`applyProject(${JSON.stringify(JSON.stringify(project))},'Sunset study.sunset').then(()=>{fit();render()})`);await settle();const dest=path.join(root,'website','assets');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'canvas.png'),(await w.webContents.capturePage()).toPNG());
await run('view={x:2570,y:1470,z:3.8};render()');await settle();fs.writeFileSync(path.join(dest,'detail.png'),(await w.webContents.capturePage()).toPNG());
await run("fit();render();document.querySelector('#settings').click()");await new Promise(r=>setTimeout(r,250));await settle();fs.writeFileSync(path.join(dest,'settings.png'),(await w.webContents.capturePage()).toPNG());console.log('Captured canvas, deep detail, and settings from the real app.');
}catch(e){failed=true;console.error(e)}finally{w.destroy();app.exit(failed?1:0)}});
