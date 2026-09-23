const tabs=[...document.querySelectorAll('.tab')],wins=[...document.querySelectorAll('.window')],desktop=document.getElementById('desktop');
let z=20, dragging=null, tabDragging=null;

function bringToFront(w){z+=1;w.style.zIndex=z}
function activate(id,focus=true){
  const w=document.getElementById(id); if(!w)return;
  tabs.forEach(t=>t.classList.toggle('active',t.dataset.target===id));
  wins.forEach(x=>x.classList.toggle('active',x===w && !x.classList.contains('hidden')));
  w.classList.remove('hidden');
  bringToFront(w);
  if(focus) history.replaceState(null,'','#'+id);
}
function hideWindow(w){w.classList.add('hidden');w.classList.remove('active');}
function toggleMaximize(w){
  if(w.classList.contains('maximized')){
    w.classList.remove('maximized');
    const s=w.dataset.restore;
    if(s){const o=JSON.parse(s);w.style.left=o.left;w.style.top=o.top;w.style.width=o.width;w.style.height=o.height;w.style.transform='none';}
  }else{
    const r=w.getBoundingClientRect(), c=document.querySelector('.windows').getBoundingClientRect();
    w.dataset.restore=JSON.stringify({left:(r.left-c.left)+'px',top:(r.top-c.top)+'px',width:r.width+'px',height:r.height+'px'});
    w.classList.add('maximized');
  }
  bringToFront(w);
}
function centerFresh(w){w.style.left='50%';w.style.top='50%';w.style.width='';w.style.height='';w.style.transform='translate(-50%,-50%)'}
wins.forEach((w,i)=>{w.dataset.restore='';if(i) w.classList.remove('active'); w.addEventListener('pointerdown',()=>bringToFront(w));});

document.querySelectorAll('.traffic').forEach(group=>group.addEventListener('pointerdown',e=>e.stopPropagation()));
document.querySelectorAll('.control').forEach(btn=>btn.addEventListener('click',e=>{
  e.stopPropagation();const w=btn.closest('.window'),a=btn.dataset.action;
  if(a==='close'){hideWindow(w);}
  if(a==='minimize'){hideWindow(w);}
  if(a==='maximize'){w.classList.remove('hidden','active');activate(w.id,false);toggleMaximize(w);}
}));

document.querySelectorAll('.titlebar').forEach(bar=>{
  let moved=false;
  bar.addEventListener('dblclick',e=>{if(!e.target.closest('.traffic'))toggleMaximize(bar.closest('.window'));});
  bar.addEventListener('pointerdown',e=>{
    if(e.target.closest('.traffic'))return;
    const w=bar.closest('.window'); if(w.classList.contains('maximized'))return;
    bringToFront(w);
    const c=document.querySelector('.windows').getBoundingClientRect(),r=w.getBoundingClientRect();
    const ox=e.clientX-r.left,oy=e.clientY-r.top;
    w.style.transform='none'; w.style.left=(r.left-c.left)+'px';w.style.top=(r.top-c.top)+'px';
    moved=true; bar.setPointerCapture(e.pointerId);
    const move=ev=>{
      if(!moved)return;
      w.style.left=Math.max(-w.offsetWidth+80,Math.min(c.width-80,ev.clientX-c.left-ox))+'px';
      w.style.top=Math.max(0,Math.min(c.height-42,ev.clientY-c.top-oy))+'px';
    };
    const up=()=>{moved=false;bar.removeEventListener('pointermove',move);bar.removeEventListener('pointerup',up)};
    bar.addEventListener('pointermove',move);bar.addEventListener('pointerup',up,{once:true});
  });
});

tabs.forEach(t=>{
  t.addEventListener('click',()=>{if(t.dataset.moved==='1'){t.dataset.moved='0';return}activate(t.dataset.target)});
  t.addEventListener('pointerdown',e=>{
    tabDragging={t,startX:e.clientX,startY:e.clientY,lastX:e.clientX,moved:false};
    t.setPointerCapture(e.pointerId);
  });
  t.addEventListener('pointermove',e=>{
    if(!tabDragging||tabDragging.t!==t)return;
    const dx=e.clientX-tabDragging.startX,dy=e.clientY-tabDragging.startY;
    if(Math.abs(dx)>7||Math.abs(dy)>7)tabDragging.moved=true;
    if(tabDragging.moved){t.dataset.moved='1';t.style.transform='translateY(-3px) scale(1.02)';}
  });
  t.addEventListener('pointerup',e=>{
    if(!tabDragging||tabDragging.t!==t)return;
    t.style.transform='';const x=e.clientX, others=[...document.querySelectorAll('.tab')].filter(a=>a!==t);
    if(tabDragging.moved){
      let placed=false;
      for(const o of others){const r=o.getBoundingClientRect();if(x<r.left+r.width/2){o.parentNode.insertBefore(t,o);placed=true;break}}
      if(!placed)t.parentNode.appendChild(t);
    }
    tabDragging=null;
  });
});

window.addEventListener('resize',()=>wins.filter(w=>w.classList.contains('maximized')).forEach(w=>bringToFront(w)));

const bootLines=[
  ['info','[  OK  ] powering up terminal shell'],
  ['info','[  OK  ] mounting /portfolio filesystem'],
  ['ok','[  OK  ] loading python.ml.rag.mcp modules'],
  ['ok','[  OK  ] connecting enterprise adapters: ServiceNow / Jira / Jenkins'],
  ['ok','[  OK  ] indexing project catalog'],
  ['ok','[  OK  ] loading experience.log'],
  ['warn','[ RUN ] starting graphical shell...'],
  ['ok','[  OK  ] ADITYA S ACHAR portfolio ready']
];
let bi=0, skip=false;
const bootLog=document.getElementById('boot-log'),bar=document.getElementById('boot-bar'),status=document.getElementById('boot-status'),boot=document.getElementById('boot-screen');
function finishBoot(){if(skip)return;skip=true;bar.style.width='100%';status.textContent='launching portfolio...';desktop.classList.add('ready');setTimeout(()=>{boot.classList.add('done');activate(location.hash?location.hash.slice(1):'about',false)},450)}
function nextBoot(){
  if(skip)return;
  if(bi<bootLines.length){const [kind,text]=bootLines[bi++],p=document.createElement('div');p.className='boot-line '+kind;p.textContent=text;bootLog.appendChild(p);bar.style.width=Math.round((bi/bootLines.length)*92)+'%';status.textContent=bi<bootLines.length?'running startup sequence...':'finalizing...';setTimeout(nextBoot,260+Math.random()*260)}
  else setTimeout(finishBoot,450);
}
document.getElementById('skip-boot').addEventListener('click',()=>{skip=false;finishBoot()});
nextBoot();
document.getElementById('year').textContent=new Date().getFullYear();
