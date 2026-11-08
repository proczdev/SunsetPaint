const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
let win;
app.setAppUserModelId('local.sunset.paint');
app.whenReady().then(() => {
  win = new BrowserWindow({width:1440,height:960,minWidth:1000,minHeight:700,frame:false,backgroundColor:'#f5e4c0',icon:path.join(__dirname,'icon.ico'),show:false,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});
  win.loadFile('index.html');
  win.once('ready-to-show',()=>win.show());
  let closing=false;
  ipcMain.on('close-ready',()=>{closing=true;win.close()});
  win.on('close',e=>{if(!closing){e.preventDefault();win.webContents.send('closing');setTimeout(()=>{if(!win.isDestroyed()){closing=true;win.close()}},2000)}});
});
ipcMain.on('window',(_,action)=>{if(action==='close')win.close();if(action==='minimize')win.minimize();if(action==='maximize')win.isMaximized()?win.unmaximize():win.maximize()});
ipcMain.handle('save',async(_,data,type)=>{
  const isPNG=type==='png';
  const result=await dialog.showSaveDialog(win,{defaultPath:isPNG?'Sunset drawing.png':'Untitled.sunset',filters:[{name:isPNG?'PNG image':'Sunset Paint project',extensions:[isPNG?'png':'sunset']}]});
  if(result.canceled)return null;
  fs.writeFileSync(result.filePath,isPNG?Buffer.from(data.split(',')[1],'base64'):data);
  return path.basename(result.filePath);
});
ipcMain.handle('open',async()=>{const result=await dialog.showOpenDialog(win,{filters:[{name:'Sunset Paint project',extensions:['sunset']}],properties:['openFile']});if(result.canceled)return null;return {name:path.basename(result.filePaths[0]),data:fs.readFileSync(result.filePaths[0],'utf8')}});
ipcMain.handle('recover',()=>{try{return fs.readFileSync(path.join(app.getPath('userData'),'recovery.sunset'),'utf8')}catch{return null}});
ipcMain.handle('autosave',(_,data)=>fs.promises.writeFile(path.join(app.getPath('userData'),'recovery.sunset'),data));
app.on('window-all-closed',()=>app.quit());
