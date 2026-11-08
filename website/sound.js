// The click synthesis below is shared verbatim with app.js. No audio files or requests.
(() => {
 const settings={sound:true,volume:45};
 try{Object.assign(settings,JSON.parse(localStorage.getItem('sunset-site-sound')||'{}'))}catch{}
 function persist(){try{localStorage.setItem('sunset-site-sound',JSON.stringify(settings))}catch{}}
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

 window.SunsetSound={click:clickSound,get enabled(){return settings.sound},set enabled(v){settings.sound=!!v;persist()},get volume(){return settings.volume},set volume(v){settings.volume=Math.min(100,Math.max(0,Number(v)||0));persist()}};
})();
