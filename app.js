'use strict';
const $=s=>document.querySelector(s);
const icons={
 brush:'<path d="m10 17 9-12c2-2 5 0 3 2l-9 12" fill="url(#wood)"/><path d="m10 16 5 3-3 4-6-3z" fill="url(#metal)"/><path d="M6 20c-5 0-1 6-5 7 8 1 11-2 10-5" fill="currentColor"/>',
 eraser:'<path d="m5 20 10-15c1-2 3-2 5-1l7 5c1 1 1 2 0 3L17 27H9z" fill="url(#rubber)"/><path d="m9 14 12 8-4 5H9l-4-7z" fill="url(#metal)"/><path d="m10 16 9 6" opacity=".3"/>',
 bucket:'<path d="m8 8 12 12M9 6 3 14q-2 2 0 4l9 8q2 2 4 0l9-10z" fill="url(#metal)"/><path d="m3 14 13 1 9 1M7 4l7 7"/><path d="M26 20s-5 5-3 7c4 3 7-1 3-7" fill="currentColor"/>',
 ruler:'<path d="m3 21 18-18 8 8-18 18z" fill="url(#wood)"/><path d="m17 7 3 3m-7 1 5 5m-9-1 3 3m-7 1 5 5"/>',
 circle:'<circle cx="16" cy="16" r="10"/>',rectangle:'<rect x="6" y="6" width="20" height="20" rx="2"/>',
 star:'<path d="m16 3 4 8 9 2-7 6 2 10-8-5-8 5 2-10-7-6 9-2z"/>',
 arrow:'<path d="M5 26 26 5M13 5h13v13"/>',
 hand:'<path d="M10 16V8q0-4 3-2v9-11q3-3 4 0v11-9q3-3 4 1v9-7q4-1 4 3v10q-2 8-8 7-5 0-8-5l-5-7q-2-4 2-4z"/>',
 undo:'<path d="m12 5-7 7 7 7M6 12h12q9 0 8 10"/>',redo:'<path d="m20 5 7 7-7 7m6-7H14q-9 0-8 10"/>',
 settings:'<path d="m13 3 6 0 1 4 4 2 4-1 3 5-3 3v4l2 3-3 5-4-1-4 2-1 3h-5l-1-4-4-2-4 1-3-5 3-3v-4l-2-3 3-5 4 1 3-2z" transform="translate(1 -1) scale(.93)"/><circle cx="16" cy="16" r="5"/>'
};
const svg=name=>`<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><defs><linearGradient id="wood" x2="1" y2="1"><stop stop-color="#ffce8d"/><stop offset=".5" stop-color="#d87535"/><stop offset="1" stop-color="#a84924"/></linearGradient><linearGradient id="metal"><stop stop-color="#b6997b"/><stop offset=".45" stop-color="#fff0d6"/><stop offset="1" stop-color="#a88a70"/></linearGradient><linearGradient id="rubber"><stop stop-color="#ffb18a"/><stop offset="1" stop-color="#bc555c"/></linearGradient></defs>${icons[name]}</svg>`;
const toolNames={brush:'Brush',eraser:'Eraser',bucket:'Fill',ruler:'Ruler',circle:'Ellipse',rectangle:'Rectangle',star:'Star',arrow:'Arrow',hand:'Move'};
const keys={b:'brush',e:'eraser',f:'bucket',r:'ruler',o:'circle',u:'rectangle',s:'star',a:'arrow',h:'hand'};
for(const name of Object.keys(toolNames).filter(x=>x!=='hand')){const b=document.createElement('button');b.className='tool';b.dataset.tool=name;b.title=`${toolNames[name]} · ${Object.keys(keys).find(k=>keys[k]===name).toUpperCase()}`;b.setAttribute('aria-label',b.title);b.innerHTML=svg(name);b.onclick=()=>setTool(name);$('#tools').append(b)}
$('#hand').innerHTML=svg('hand');$('#hand').dataset.tool='hand';$('#hand').onclick=()=>setTool('hand');
for(const name of ['undo','redo','settings'])$('#'+name).innerHTML=svg(name);
const palette=[['Twinkle Pink','#ffb18a'],['Shadows','#3c001c'],['Barbera','#99051f'],['Kurama Orange','#d75000'],['Sunburst','#efae70'],['Butter Up','#f5e4c0'],['Paper','#fffdf8'],['Ink','#292126'],['Rose','#c85868'],['Clay','#b67752'],['Sage','#8d9772'],['Slate','#7c8b97']];
let tool='brush',color='#99051f',previousColor='#fffdf8',size=12,opacity=1,scene=[],undoStack=[],redoStack=[],paper='#fffdf8',filename='Untitled',dirty=false;
let settings={history:200,smoothing:45,smooth:true,wheelSpeed:.003,tolerance:45,motion:false,sound:true,volume:45};
try{settings={...settings,...JSON.parse(localStorage.getItem('sunset-settings')||'{}')}}catch{}
let W=0,H=0,dpr=window.devicePixelRatio||1,view={x:2048,y:2048,z:1},gesture=null,space=false,shift=false,raf=0,saveTimer,toastTimer;
const canvas=$('#canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true}),preview=$('#preview'),px=preview.getContext('2d');
const images=new Map();
const world=(x,y)=>({x:view.x+(x-W/2)/view.z,y:view.y+(y-H/2)/view.z});
const screen=(x,y)=>({x:(x-view.x)*view.z+W/2,y:(y-view.y)*view.z+H/2});
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2300)}
function setTool(name){if(gesture)return;tool=name;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===name));$('#tool-title').textContent=toolNames[name];$('#status-tool').textContent=toolNames[name];$('#tool-key').textContent=Object.keys(keys).find(k=>keys[k]===name).toUpperCase();$('#sample-label').textContent=name==='eraser'?'ROUND ERASER':name==='bucket'?'EDGE-AWARE FILL':name==='brush'?'ROUND BRUSH':toolNames[name].toUpperCase();$('#shape-options').hidden=!['circle','rectangle','star','arrow'].includes(name);preview.style.cursor=name==='hand'?'grab':name==='brush'||name==='eraser'?'none':'crosshair';$('#brush-cursor').style.display='none';}
function setColor(value){if(!/^#[0-9a-f]{6}$/i.test(value))return;previousColor=color;color=value.toLowerCase();$('#color').value=color;$('#hex').value=color.toUpperCase();$('#color-name').textContent=palette.find(p=>p[1]===color)?.[0]||'Custom color';$('#sample').style.color=color;document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('selected',b.dataset.color===color))}
for(const [name,value]of palette){const b=document.createElement('button');b.className='swatch';b.style.background=value;b.dataset.color=value;b.title=name;b.setAttribute('aria-label',name);b.onclick=()=>setColor(value);$('#palette').append(b)}
function range(id,fn){const e=$('#'+id);const update=()=>{e.style.setProperty('--progress',((e.value-e.min)/(e.max-e.min)*100)+'%');fn(+e.value)};e.oninput=update;update()}
range('size',v=>{size=v;$('#size-value').textContent=v+' px';$('#sample path').style.strokeWidth=Math.min(30,v);});range('opacity',v=>{opacity=v/100;$('#opacity-value').textContent=v+'%';$('#sample').style.opacity=opacity});
$('#smoothing').value=settings.smoothing;range('smoothing',v=>{settings.smoothing=v;$('#smoothing-value').textContent=v+'%';persistSettings()});$('#smooth').checked=settings.smooth;$('#smooth-control').style.opacity=settings.smooth?1:.4;$('#smooth').onchange=e=>{settings.smooth=e.target.checked;$('#smooth-control').style.opacity=settings.smooth?1:.4;persistSettings()};
function persistSettings(){localStorage.setItem('sunset-settings',JSON.stringify(settings))}
// Filtered transients and a short pitched body give each control a mechanical click.
let audioContext,lastPitch=0,clickNumber=0;
function clickSound(button){
 if(!settings.sound||settings.volume<=0)return;
 try{
  audioContext??=new AudioContext();if(audioContext.state==='suspended')audioContext.resume();
  const a=audioContext,t=a.currentTime,id=button.id||button.dataset.tool||button.title||button.textContent;
  let hash=0;for(const c of id)hash=(hash*31+c.charCodeAt(0))>>>0;
  let pitch=700+(hash%1050)+(++clickNumber%5)*57+(Math.random()-.5)*100;if(Math.abs(pitch-lastPitch)<100)pitch+=180;lastPitch=pitch;
  const master=a.createGain();master.gain.value=settings.volume/100*.45;master.connect(a.destination);
  const noise=a.createBuffer(1,Math.ceil(a.sampleRate*.055),a.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(a.sampleRate*.006));
  const source=a.createBufferSource();source.buffer=noise;source.playbackRate.value=pitch/1100;
  const filter=a.createBiquadFilter();filter.type='highpass';filter.frequency.value=1100;
  const envelope=a.createGain();envelope.gain.setValueAtTime(.75,t);envelope.gain.exponentialRampToValueAtTime(.001,t+.045);source.connect(filter).connect(envelope).connect(master);source.start(t);source.stop(t+.06);
  const body=a.createOscillator(),bodyGain=a.createGain();body.type='triangle';body.frequency.setValueAtTime(pitch,t);body.frequency.exponentialRampToValueAtTime(pitch*.42,t+.027);bodyGain.gain.setValueAtTime(.48,t);bodyGain.gain.exponentialRampToValueAtTime(.001,t+.035);body.connect(bodyGain).connect(master);body.start(t);body.stop(t+.04);
  const release=a.createBufferSource();release.buffer=noise;release.playbackRate.value=1.35;const releaseGain=a.createGain();releaseGain.gain.value=.2;release.connect(releaseGain).connect(master);release.start(t+.025);release.stop(t+.065);release.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();body.disconnect();bodyGain.disconnect();release.disconnect();releaseGain.disconnect();master.disconnect()};
 }catch{}
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled)clickSound(b)},true);
const soundRow=document.createElement('div');soundRow.className='setting-item';soundRow.innerHTML='<label for="click-sound">Click sounds<small>A little feedback from the controls</small></label><input id="click-sound" class="switch" type="checkbox">';
const volumeRow=document.createElement('div');volumeRow.className='setting-item sound-volume';volumeRow.innerHTML='<label for="click-volume">Volume <output id="click-volume-value"></output></label><input id="click-volume" type="range" min="0" max="100">';
$('#settings-dialog .shortcuts').before(soundRow,volumeRow);$('#click-sound').checked=settings.sound;$('#click-volume').value=settings.volume;$('#click-volume-value').textContent=settings.volume+'%';
$('#click-sound').onchange=e=>{settings.sound=e.target.checked;persistSettings();if(settings.sound)clickSound(e.target)};
$('#click-volume').oninput=e=>{settings.volume=+e.target.value;$('#click-volume-value').textContent=settings.volume+'%';persistSettings()};$('#click-volume').onchange=e=>clickSound(e.target);
$('#color').oninput=e=>setColor(e.target.value);$('#hex').onchange=e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))setColor(e.target.value);else e.target.value=color.toUpperCase()};$('#swap').onclick=()=>setColor(previousColor);
function drawMark(c,m,project){
 c.save();c.globalAlpha=m.opacity??1;c.strokeStyle=m.type==='eraser'?paper:m.color;c.fillStyle=m.type==='eraser'?paper:m.color;c.lineCap='round';c.lineJoin='round';
 const anchor=project(m.x,m.y);c.translate(anchor.x,anchor.y);const z=project.scale;c.lineWidth=m.width*z;
 if(m.type==='image'){const im=images.get(m.src);if(im?.complete)c.drawImage(im,0,0,m.w*z,m.h*z);c.restore();return}
 const pts=m.points;c.beginPath();
 if(m.type==='brush'||m.type==='eraser'){
  if(pts.length===1){c.arc(pts[0][0]*z,pts[0][1]*z,m.width*z/2,0,Math.PI*2);c.fill()}
  else{c.moveTo(pts[0][0]*z,pts[0][1]*z);if(m.smooth&&pts.length>2){for(let i=1;i<pts.length-1;i++)c.quadraticCurveTo(pts[i][0]*z,pts[i][1]*z,(pts[i][0]+pts[i+1][0])*z/2,(pts[i][1]+pts[i+1][1])*z/2);c.lineTo(pts.at(-1)[0]*z,pts.at(-1)[1]*z)}else for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0]*z,pts[i][1]*z);c.stroke()}
 }else if(m.type==='fill'){
  c.lineWidth=m.width*z;c.lineJoin='round';for(const loop of m.loops){c.moveTo(loop[0][0]*z,loop[0][1]*z);for(let i=1;i<loop.length;i++)c.lineTo(loop[i][0]*z,loop[i][1]*z);c.closePath()}c.fill('evenodd');c.stroke();
 }else{
  const [a,b]=pts, x=a[0]*z,y=a[1]*z,dx=(b[0]-a[0])*z,dy=(b[1]-a[1])*z;
  if(m.type==='circle')c.ellipse(x+dx/2,y+dy/2,Math.abs(dx/2),Math.abs(dy/2),0,0,Math.PI*2);
  if(m.type==='rectangle')c.rect(x,y,dx,dy);
  if(m.type==='ruler'||m.type==='arrow'){c.moveTo(x,y);c.lineTo(x+dx,y+dy);if(m.type==='arrow'){const angle=Math.atan2(dy,dx),len=Math.min(Math.hypot(dx,dy)*.4,Math.max(m.width*z*3,15*z/m.creationZoom));c.moveTo(x+dx-Math.cos(angle-.5)*len,y+dy-Math.sin(angle-.5)*len);c.lineTo(x+dx,y+dy);c.lineTo(x+dx-Math.cos(angle+.5)*len,y+dy-Math.sin(angle+.5)*len)}}
  if(m.type==='star'){const cx=x+dx/2,cy=y+dy/2;for(let i=0;i<10;i++){const t=i*Math.PI/5-Math.PI/2,r=i%2?.44:1;const sx=cx+Math.cos(t)*Math.abs(dx/2)*r,sy=cy+Math.sin(t)*Math.abs(dy/2)*r;i?c.lineTo(sx,sy):c.moveTo(sx,sy)}c.closePath()}
  if(m.filled&&m.type!=='ruler'&&m.type!=='arrow')c.fill();c.stroke();
 }c.restore();
}
function drawScene(c,project){for(const m of scene)drawMark(c,m,project)}
function projectView(x,y){return screen(x,y)}
function render(){raf=0;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);ctx.fillStyle='#cbb89e';ctx.fillRect(0,0,W,H);const a=screen(0,0),s=4096*view.z;ctx.save();ctx.shadowColor='#65402030';ctx.shadowBlur=20;ctx.shadowOffsetY=4;ctx.fillStyle=paper;ctx.fillRect(a.x,a.y,s,s);ctx.restore();ctx.save();ctx.beginPath();ctx.rect(a.x,a.y,s,s);ctx.clip();projectView.scale=view.z;drawScene(ctx,projectView);ctx.restore();drawPreview();$('#zoom-value').textContent=view.z>=10000?view.z.toExponential(1)+'×':Math.round(view.z*100)+'%';$('#depth').textContent=view.z>100?'Detail level '+Math.log2(view.z/minZoom()).toFixed(1):'Canvas at a glance'}
function requestRender(){if(!raf)raf=requestAnimationFrame(render)}
function drawPreview(){px.setTransform(dpr,0,0,dpr,0,0);px.clearRect(0,0,W,H);if(gesture?.mark){px.save();const a=screen(0,0);px.beginPath();px.rect(a.x,a.y,4096*view.z,4096*view.z);px.clip();projectView.scale=view.z;drawMark(px,gesture.mark,projectView);px.restore()}}
function minZoom(){return Math.min((W-96)/4096,(H-96)/4096)}
function fit(){view={x:2048,y:2048,z:minZoom()};requestRender()}
function clampView(){view.x=Math.max(0,Math.min(4096,view.x));view.y=Math.max(0,Math.min(4096,view.y))}
function zoom(factor,x=W/2,y=H/2){if(gesture)return;const before=world(x,y);view.z=Math.max(minZoom(),Math.min(1e12,view.z*factor));view.x=before.x-(x-W/2)/view.z;view.y=before.y-(y-H/2)/view.z;clampView();requestRender()}
new ResizeObserver(()=>{const oldMin=W?minZoom():0;const r=$('#stage').getBoundingClientRect();W=r.width;H=r.height;dpr=window.devicePixelRatio||1;for(const c of [canvas,preview]){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr)}if(!oldMin||view.z<=oldMin*1.02)fit();else requestRender()}).observe($('#stage'));
$('#zoom-in').onclick=()=>zoom(1.6);$('#zoom-out').onclick=()=>zoom(1/1.6);$('#fit').onclick=fit;$('#zoom-value').onclick=fit;
preview.addEventListener('wheel',e=>{e.preventDefault();const r=preview.getBoundingClientRect();zoom(Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*settings.wheelSpeed),e.clientX-r.left,e.clientY-r.top)},{passive:false});
function capture(){undoStack.push(scene.slice());if(undoStack.length>settings.history)undoStack.shift();redoStack=[]}
function commit(mark){capture();scene.push(mark);changed()}
function changed(){dirty=true;$('#filename').textContent=filename+' •';$('#mark-count').textContent=scene.length+' '+(scene.length===1?'mark':'marks');$('#undo').disabled=!undoStack.length;$('#redo').disabled=!redoStack.length;$('#save-state').innerHTML='<i></i> Saving locally…';requestRender();clearTimeout(saveTimer);saveTimer=setTimeout(autosave,500)}
function projectData(){return JSON.stringify({format:'sunset-paint',version:1,paper,scene,view})}
async function autosave(){try{await window.desktop.autosave(projectData());$('#save-state').innerHTML='<i></i> All changes saved locally'}catch{$('#save-state').textContent='Local recovery unavailable — save a project'}}
function undo(){if(gesture||!undoStack.length)return;redoStack.push(scene.slice());scene=undoStack.pop();changed()}
function redo(){if(gesture||!redoStack.length)return;undoStack.push(scene.slice());scene=redoStack.pop();changed()}
$('#undo').onclick=undo;$('#redo').onclick=redo;
function point(e){const r=preview.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
preview.onpointerdown=e=>{
 if(e.button!==0&&e.button!==1)return;const p=point(e);preview.setPointerCapture(e.pointerId);
 if(tool==='hand'||space||e.button===1){gesture={pan:true,start:p,x:view.x,y:view.y};preview.style.cursor='grabbing';return}
 const w=world(p.x,p.y);if(w.x<0||w.y<0||w.x>4096||w.y>4096)return;
 if(tool==='bucket'){fillAt(p.x,p.y);return}
 gesture={start:p,mark:{type:tool,x:w.x,y:w.y,points:[[0,0]],width:size/view.z,color,opacity:tool==='eraser'?1:opacity,smooth:settings.smooth,filled:$('#filled').checked,creationZoom:view.z}};
 if(!['brush','eraser'].includes(tool))gesture.mark.points.push([0,0]);drawPreview();
};
preview.onpointermove=e=>{const p=point(e),w=world(p.x,p.y),cursor=$('#brush-cursor');cursor.style.left=p.x+'px';cursor.style.top=p.y+'px';cursor.style.width=size+'px';cursor.style.height=size+'px';cursor.style.display=['brush','eraser'].includes(tool)&&!space?'block':'none';$('#position').textContent=`${Math.round(w.x)} , ${Math.round(w.y)}`;
 if(!gesture)return;if(gesture.pan){view.x=gesture.x-(p.x-gesture.start.x)/view.z;view.y=gesture.y-(p.y-gesture.start.y)/view.z;clampView();requestRender();return}
 const m=gesture.mark;
 if(['brush','eraser'].includes(m.type)){
  const events=e.getCoalescedEvents?.()||[e];for(const ev of events.length?events:[e]){const q=point(ev),v=world(q.x,q.y),last=m.points.at(-1);let x=v.x-m.x,y=v.y-m.y;if(m.smooth){const a=1-settings.smoothing/110;x=last[0]+(x-last[0])*a;y=last[1]+(y-last[1])*a}if(Math.hypot((x-last[0])*view.z,(y-last[1])*view.z)>.45)m.points.push([x,y])}
 }else{let dx=w.x-m.x,dy=w.y-m.y;if(e.shiftKey){if(m.type==='ruler'||m.type==='arrow'){const len=Math.hypot(dx,dy),a=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*Math.PI/4;dx=Math.cos(a)*len;dy=Math.sin(a)*len}else{const s=Math.max(Math.abs(dx),Math.abs(dy));dx=Math.sign(dx)*s;dy=Math.sign(dy)*s}}m.points[1]=[dx,dy]}
 drawPreview();
};
function finish(e){if(!gesture)return;const g=gesture;gesture=null;if(g.mark){if(g.mark.points.length===1||['brush','eraser'].includes(g.mark.type)||Math.hypot(...g.mark.points[1])*view.z>1)commit(g.mark)}preview.style.cursor=tool==='hand'?'grab':['brush','eraser'].includes(tool)?'none':'crosshair';drawPreview();if(e&&preview.hasPointerCapture(e.pointerId))preview.releasePointerCapture(e.pointerId)}
preview.onpointerup=finish;preview.onpointercancel=()=>{gesture=null;drawPreview()};preview.onlostpointercapture=()=>{if(gesture)finish()};preview.onpointerleave=()=>$('#brush-cursor').style.display='none';
// Flood a screen-resolution snapshot, then retain the region as vector contours.
// A small overlap below the original marks removes antialiasing seams.
function fillAt(sx,sy){
 const scale=Math.min(1,1600/W,1600/H),fw=Math.ceil(W*scale),fh=Math.ceil(H*scale),c=document.createElement('canvas');c.width=fw;c.height=fh;const fc=c.getContext('2d',{willReadFrequently:true});fc.drawImage(canvas,0,0,fw,fh);const data=fc.getImageData(0,0,fw,fh).data;
 const x=Math.max(0,Math.min(fw-1,Math.floor(sx*scale))),y=Math.max(0,Math.min(fh-1,Math.floor(sy*scale))),seed=(y*fw+x)*4,target=data.slice(seed,seed+3),mask=new Uint8Array(fw*fh),queue=new Int32Array(fw*fh);let tail=1,head=0;queue[0]=y*fw+x;mask[queue[0]]=1;
 const tol=settings.tolerance;const accepts=n=>{const i=n*4;return Math.max(Math.abs(data[i]-target[0]),Math.abs(data[i+1]-target[1]),Math.abs(data[i+2]-target[2]))<=tol};
 while(head<tail){const n=queue[head++],qx=n%fw,qy=(n/fw)|0;for(const next of [qx>0?n-1:-1,qx<fw-1?n+1:-1,qy>0?n-fw:-1,qy<fh-1?n+fw:-1]){if(next>=0&&!mask[next]&&accepts(next)){mask[next]=1;queue[tail++]=next}}}
 // Boundary edges are directed clockwise; opposite winding retains holes.
 const stride=fw+1,edges=new Map();const edge=(a,b)=>{let list=edges.get(a);if(!list)edges.set(a,list=[]);list.push(b)};
 for(let n=0;n<tail;n++){const i=queue[n],qx=i%fw,qy=(i/fw)|0,a=qy*stride+qx;if(qy===0||!mask[i-fw])edge(a,a+1);if(qx===fw-1||!mask[i+1])edge(a+1,a+stride+1);if(qy===fh-1||!mask[i+fw])edge(a+stride+1,a+stride);if(qx===0||!mask[i-1])edge(a+stride,a)}
 const origin=world(sx,sy),loops=[];let total=0;
 while(edges.size){const start=edges.keys().next().value;let cur=start,loop=[],guard=0;do{const a=edges.get(cur);if(!a?.length)break;loop.push([cur%stride,Math.floor(cur/stride)]);const next=a.pop();if(!a.length)edges.delete(cur);cur=next;if(++guard>fw*fh*4)break}while(cur!==start);
  if(loop.length<3)continue;const simple=loop.filter((p,i)=>{const a=loop[(i+loop.length-1)%loop.length],b=loop[(i+1)%loop.length];return(p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0])});
  if(simple.length<3)continue;total+=simple.length;if(total>350000){toast('This region is too complex. Zoom in and fill a smaller area.');return}loops.push(simple.map(p=>{const v=world(p[0]/scale,p[1]/scale);return[v.x-origin.x,v.y-origin.y]}));
 }
 if(!loops.length)return;
 const mark={type:'fill',x:origin.x,y:origin.y,loops,width:2.4/(scale*view.z),color,opacity};
 commit(mark);
}
async function loadImages(marks){await Promise.all(marks.filter(m=>m.type==='image').map(m=>new Promise((resolve,reject)=>{if(images.has(m.src)){resolve();return}const im=new Image();im.onload=()=>{images.set(m.src,im);resolve()};im.onerror=()=>reject(new Error('An image could not be loaded'));im.src=m.src})));}
document.addEventListener('paste',async e=>{if(/INPUT|TEXTAREA/.test(document.activeElement.tagName)||$('dialog[open]'))return;const file=Array.from(e.clipboardData?.items||[]).find(i=>i.type.startsWith('image/'))?.getAsFile();if(!file)return;e.preventDefault();try{const src=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});const im=new Image();await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=src});images.set(src,im);const factor=Math.min(W*.65/im.width,H*.65/im.height,1),w=im.width*factor/view.z,h=im.height*factor/view.z;commit({type:'image',src,x:Math.max(0,view.x-w/2),y:Math.max(0,view.y-h/2),w,h,opacity:1});toast('Image pasted · Ctrl Z to undo')}catch{toast('Could not paste that image')}});
function validateProject(p){if(!p||p.format!=='sunset-paint'||p.version!==1||!Array.isArray(p.scene)||p.scene.length>100000||!/^#[0-9a-f]{6}$/i.test(p.paper))throw Error('This is not a valid Sunset Paint project');for(const m of p.scene){if(!Object.keys(toolNames).concat(['image','fill']).includes(m.type)||![m.x,m.y].every(Number.isFinite))throw Error('Invalid drawing data');if(m.type==='image'){if(!/^data:image\/(png|jpeg|webp|gif);base64,/.test(m.src)||![m.w,m.h].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid image')}else{if(!Number.isFinite(m.width)||m.width<=0||!/^#[0-9a-f]{6}$/i.test(m.color))throw Error('Invalid stroke');const paths=m.type==='fill'?m.loops:[m.points];if(!Array.isArray(paths)||paths.some(a=>!Array.isArray(a)||a.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))))throw Error('Invalid path')}}return p}
async function applyProject(data,name){const p=validateProject(JSON.parse(data));await loadImages(p.scene);scene=p.scene;paper=p.paper;$('#paper').value=paper;undoStack=[];redoStack=[];filename=name||'Recovered canvas';$('#canvas-title').textContent=filename.replace(/\.sunset$/i,'').toUpperCase();if(p.view&&[p.view.x,p.view.y,p.view.z].every(Number.isFinite)&&p.view.z>0){view=p.view;view.z=Math.max(minZoom(),Math.min(1e12,view.z));clampView()}else fit();changed();dirty=false;$('#filename').textContent=filename}
async function save(){try{const name=await window.desktop.save(projectData(),'project');if(name){filename=name;dirty=false;$('#filename').textContent=name;$('#canvas-title').textContent=name.replace(/\.sunset$/i,'').toUpperCase();toast('Project saved');return true}}catch{toast('Could not save the project')}return false}
$('#save').onclick=save;
$('#open').onclick=async()=>{if(dirty){const choice=await askNew();if(choice==='cancel')return;if(choice==='save'&&!await save())return}try{const result=await window.desktop.open();if(result){await applyProject(result.data,result.name);toast('Project opened')}}catch(e){toast(e.message||'Could not open the project')}};
function askNew(){return new Promise(resolve=>{const d=$('#new-dialog');d.returnValue='cancel';d.showModal();d.addEventListener('close',()=>resolve(d.returnValue||'cancel'),{once:true})})}
$('#new').onclick=async()=>{if(scene.length){const choice=await askNew();if(choice==='cancel')return;if(choice==='save'&&!await save())return}scene=[];undoStack=[];redoStack=[];filename='Untitled';$('#canvas-title').textContent='UNTITLED CANVAS';fit();changed();dirty=false;$('#filename').textContent=filename;toast('Fresh canvas')};
$('#export').onclick=async()=>{const b=$('#export');b.disabled=true;try{const c=document.createElement('canvas');c.width=4096;c.height=4096;const out=c.getContext('2d');out.fillStyle=paper;out.fillRect(0,0,4096,4096);const p=(x,y)=>({x,y});p.scale=1;drawScene(out,p);const name=await window.desktop.save(c.toDataURL('image/png'),'png');if(name)toast('PNG exported · 4096 × 4096')}catch{toast('Could not export the image')}finally{b.disabled=false}};
$('#settings').onclick=()=>$('#settings-dialog').showModal();
$('#history').value=settings.history;$('#wheel-speed').value=settings.wheelSpeed;$('#fill-tolerance').value=settings.tolerance;$('#motion').checked=settings.motion;document.body.classList.toggle('no-motion',settings.motion);
$('#history').onchange=e=>{settings.history=Math.max(5,Math.min(2000,Number(e.target.value)||200));e.target.value=settings.history;undoStack=undoStack.slice(-settings.history);persistSettings()};$('#wheel-speed').onchange=e=>{settings.wheelSpeed=+e.target.value;persistSettings()};$('#fill-tolerance').onchange=e=>{settings.tolerance=Math.max(5,Math.min(160,+e.target.value||45));e.target.value=settings.tolerance;persistSettings()};$('#motion').onchange=e=>{settings.motion=e.target.checked;document.body.classList.toggle('no-motion',settings.motion);persistSettings()};$('#paper').onchange=e=>{paper=e.target.value;changed()};
document.querySelectorAll('[data-window]').forEach(b=>b.onclick=()=>window.desktop.window(b.dataset.window));window.desktop.onClosing(async()=>{clearTimeout(saveTimer);document.body.classList.add('closing');await Promise.all([window.desktop.autosave(projectData()).catch(()=>{}),new Promise(r=>setTimeout(r,220))]);window.desktop.closeReady()});
document.addEventListener('keydown',e=>{
 if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||$('dialog[open]'))return;
 const k=e.key.toLowerCase();if(e.ctrlKey||e.metaKey){if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k==='s'){e.preventDefault();save()}return}
 if(k===' '){space=true;preview.style.cursor='grab';$('#brush-cursor').style.display='none';e.preventDefault()}else if(keys[k])setTool(keys[k]);else if(k==='0')fit();else if(k==='x')setColor(previousColor);else if(k==='['||k===']'){$('#size').value=Math.max(1,Math.min(160,size+(k===']'?2:-2)));$('#size').dispatchEvent(new Event('input'))}else if(k==='escape'&&gesture){gesture=null;drawPreview()}
});
document.addEventListener('keyup',e=>{if(e.key===' '){space=false;preview.style.cursor=tool==='hand'?'grab':['brush','eraser'].includes(tool)?'none':'crosshair'}});window.addEventListener('blur',()=>{space=false;if(gesture)finish()});
setTool('brush');setColor(color);$('#undo').disabled=true;$('#redo').disabled=true;
async function init(){const loading=document.createElement('div');loading.className='loading-surface';loading.setAttribute('aria-label','Loading canvas');loading.innerHTML='<div class="loading-paper"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>';$('#stage').append(loading);try{const recovery=await window.desktop.recover();if(recovery){await applyProject(recovery,'Recovered canvas');toast('Your last canvas is back')}}catch{toast('Recovery could not be opened. Your saved projects are unaffected.')}finally{loading.remove()}}init();
