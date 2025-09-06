// MIT License
import { Game } from './game.js';

const canvas = document.getElementById('game');
const settings = JSON.parse(localStorage.getItem('settings') || '{}');
settings.volume = settings.volume ?? 0.5;
settings.botCount = settings.botCount ?? 40;
settings.quality = settings.quality || 'medium';

document.getElementById('volume').value = settings.volume;
document.getElementById('botCount').value = settings.botCount;
document.getElementById('quality').value = settings.quality;
['volume','botCount','quality'].forEach(id=>{
  document.getElementById(id).addEventListener('change',()=>{
    settings.volume=parseFloat(document.getElementById('volume').value);
    settings.botCount=parseInt(document.getElementById('botCount').value);
    settings.quality=document.getElementById('quality').value;
    localStorage.setItem('settings', JSON.stringify(settings));
  });
});

const input={x:0,y:0,boost:false,spawn:false,touch:false,baseX:0,baseY:0};
let dpr=1;
function resize(){
  dpr=window.devicePixelRatio||1;
  canvas.width=window.innerWidth*dpr;
  canvas.height=window.innerHeight*dpr;
  canvas.style.width=window.innerWidth+'px';
  canvas.style.height=window.innerHeight+'px';
  if(game){
    game.camera.w=canvas.width;
    game.camera.h=canvas.height;
    game.camera.scale=dpr;
  }
}
window.addEventListener('resize',resize);
resize();
input.x=canvas.width/2;input.y=canvas.height/2;

function updatePointer(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  input.x=(clientX-rect.left)*dpr;
  input.y=(clientY-rect.top)*dpr;
}
window.addEventListener('mousemove',e=>{updatePointer(e.clientX,e.clientY);});
window.addEventListener('mousedown',e=>{if(e.button===0){input.boost=true;input.spawn=true;}});
window.addEventListener('mouseup',e=>{if(e.button===0){input.boost=false;input.spawn=false;}});
window.addEventListener('keydown',e=>{if(e.key==='Shift')input.boost=true;});
window.addEventListener('keyup',e=>{if(e.key==='Shift')input.boost=false;});

canvas.addEventListener('touchstart',e=>{
  const t=e.touches[0];
  updatePointer(t.clientX,t.clientY);
  input.baseX=input.x;input.baseY=input.y;
  input.touch=true;input.spawn=true;input.boost=false;
  input.boostTimeout=setTimeout(()=>{input.boost=true;},300);
},{passive:false});
canvas.addEventListener('touchmove',e=>{const t=e.touches[0];updatePointer(t.clientX,t.clientY);},{passive:false});
canvas.addEventListener('touchend',()=>{input.touch=false;input.boost=false;input.spawn=false;clearTimeout(input.boostTimeout);});

let game=new Game(canvas,input,settings);
game.camera.scale=dpr;
game.start();
