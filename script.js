/* INTERACTIVE_TERMINAL_V5 */
const tabs=[...document.querySelectorAll('.tab')];
const wins=[...document.querySelectorAll('.window')];
const desktop=document.getElementById('desktop');
const stage=document.querySelector('.windows');
let z=30;
let dragWindow=null;
let dragTab=null;

function bringToFront(w){
  z+=1;
  w.style.zIndex=z;
  wins.forEach(x=>x.classList.remove('focused'));
  w.classList.add('focused');
}
function openWindow(id){
  const w=document.getElementById(id);
  if(!w)return;
  w.classList.remove('hidden','minimizing');
  bringToFront(w);
  tabs.forEach(t=>t.classList.toggle('active',t.dataset.target===id));
}
function closeWindow(w){
  w.classList.add('minimizing');
  setTimeout(()=>w.classList.add('hidden'),170);
  const next=wins.find(x=>x!==w&&!x.classList.contains('hidden'));
  if(next)bringToFront(next);
}
function minimizeWindow(w){
  closeWindow(w);
}
function maximizeWindow(w){
  if(w.classList.contains('maximized')){
    w.classList.remove('maximized');
    const r=w.dataset.restore;
    if(r){
      const o=JSON.parse(r);
      Object.assign(w.style,{left:o.left,top:o.top,width:o.width,height:o.height});
    }
  }else{
    const r=w.getBoundingClientRect(), c=stage.getBoundingClientRect();
    w.dataset.restore=JSON.stringify({
      left:(r.left-c.left)+'px',top:(r.top-c.top)+'px',
      width:r.width+'px',height:r.height+'px'
    });
    w.classList.add('maximized');
  }
  bringToFront(w);
}
function resetPosition(w,left,top,width,height){
  Object.assign(w.style,{left,top,width,height,transform:'none'});
}

wins.forEach((w,i)=>{
  w.classList.add('hidden');
  w.addEventListener('pointerdown',()=>bringToFront(w));
  w.querySelectorAll('.control').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const action=btn.dataset.action;
      if(action==='close')closeWindow(w);
      if(action==='minimize')minimizeWindow(w);
      if(action==='maximize'){w.classList.remove('hidden');maximizeWindow(w);}
    });
  });

  const bar=w.querySelector('.titlebar');
  bar.addEventListener('dblclick',e=>{
    if(!e.target.closest('.traffic'))maximizeWindow(w);
  });
  bar.addEventListener('pointerdown',e=>{
    if(e.target.closest('.traffic')||w.classList.contains('maximized'))return;
    bringToFront(w);
    const c=stage.getBoundingClientRect(),r=w.getBoundingClientRect();
    const ox=e.clientX-r.left,oy=e.clientY-r.top;
    resetPosition(w,(r.left-c.left)+'px',(r.top-c.top)+'px',r.width+'px',r.height+'px');
    bar.setPointerCapture(e.pointerId);
    const move=ev=>{
      const maxX=c.width-90,maxY=c.height-45;
      w.style.left=Math.max(-w.offsetWidth+90,Math.min(maxX,ev.clientX-c.left-ox))+'px';
      w.style.top=Math.max(0,Math.min(maxY,ev.clientY-c.top-oy))+'px';
    };
    const up=()=>{
      bar.removeEventListener('pointermove',move);
      bar.removeEventListener('pointerup',up);
    };
    bar.addEventListener('pointermove',move);
    bar.addEventListener('pointerup',up,{once:true});
  });
});

/* Give each terminal window its own desktop position. */
function arrangeWindows(){
  const positions=[
    ['6%', '5%', '62%', '78%'],
    ['15%', '12%', '66%', '76%'],
    ['24%', '19%', '68%', '74%'],
    ['33%', '26%', '64%', '70%']
  ];
  wins.forEach((w,i)=>{
    const p=positions[i];
    resetPosition(w,p[0],p[1],p[2],p[3]);
  });
}
arrangeWindows();

/* Tabs are draggable/reorderable, but still work as window launchers. */
tabs.forEach(tab=>{
  let press=null;
  tab.addEventListener('click',()=>{
    if(tab.dataset.dragged==='1'){tab.dataset.dragged='0';return;}
    openWindow(tab.dataset.target);
  });
  tab.addEventListener('pointerdown',e=>{
    press={x:e.clientX,y:e.clientY,moved:false};
    tab.setPointerCapture(e.pointerId);
  });
  tab.addEventListener('pointermove',e=>{
    if(!press)return;
    if(Math.hypot(e.clientX-press.x,e.clientY-press.y)>8)press.moved=true;
    if(!press.moved)return;
    tab.dataset.dragged='1';
    tab.classList.add('dragging');
    const all=[...document.querySelectorAll('.tab')].filter(x=>x!==tab);
    all.forEach(x=>x.classList.remove('drop-target'));
    const target=all.find(x=>{const r=x.getBoundingClientRect();return e.clientX<r.left+r.width/2});
    (target||all[all.length-1])?.classList.add('drop-target');
  });
  tab.addEventListener('pointerup',e=>{
    if(!press)return;
    if(press.moved){
      const all=[...document.querySelectorAll('.tab')].filter(x=>x!==tab);
      const target=all.find(x=>{const r=x.getBoundingClientRect();return e.clientX<r.left+r.width/2});
      if(target)target.parentNode.insertBefore(tab,target);else tab.parentNode.appendChild(tab);
    }
    tab.classList.remove('dragging');document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
    press=null;
  });
});

/* On small screens, keep windows fluid and centered when first opened. */
window.addEventListener('resize',()=>{
  wins.filter(w=>w.classList.contains('maximized')).forEach(bringToFront);
});

/* Boot sequence */
const bootLines=[
  ['info','[  OK  ] BIOS :: terminal interface detected'],
  ['info','[  OK  ] mounting /aditya-portfolio'],
  ['ok','[  OK  ] loading Python ML runtime'],
  ['ok','[  OK  ] loading RAG + vector search modules'],
  ['ok','[  OK  ] initializing MCP enterprise connectors'],
  ['ok','[  OK  ] checking ServiceNow / Jira / Jenkins adapters'],
  ['ok','[  OK  ] indexing experience.log'],
  ['ok','[  OK  ] indexing projects/'],
  ['info','[ RUN ] starting interactive desktop shell...'],
  ['ok','[  OK  ] portfolio environment ready']
];
let bootIndex=0;
let bootFinished=false;
const bootLog=document.getElementById('boot-log');
const bootBar=document.getElementById('boot-bar');
const bootStatus=document.getElementById('boot-status');
const bootScreen=document.getElementById('boot-screen');

function finishBoot(){
  if(bootFinished)return;
  bootFinished=true;
  bootBar.style.width='100%';
  bootStatus.textContent='launching interactive portfolio...';
  desktop.classList.add('ready');
  setTimeout(()=>{
    bootScreen.classList.add('done');
    openWindow('about');
  },500);
}
function runBoot(){
  if(bootFinished)return;
  if(bootIndex<bootLines.length){
    const [kind,msg]=bootLines[bootIndex++];
    const line=document.createElement('div');
    line.className='boot-line '+kind;
    line.textContent=msg;
    bootLog.appendChild(line);
    bootBar.style.width=Math.round((bootIndex/bootLines.length)*100)+'%';
    bootStatus.textContent=bootIndex<bootLines.length?'executing startup commands...':'finalizing shell...';
    setTimeout(runBoot,210+Math.random()*180);
  }else{
    setTimeout(finishBoot,450);
  }
}
document.getElementById('skip-boot').addEventListener('click',finishBoot);
runBoot();
document.getElementById('year').textContent=new Date().getFullYear();

/* Drag a tab vertically onto the window controls: drop on minimize/maximize zones. */
(function(){
 const tabs2=[...document.querySelectorAll('.tab')];
 tabs2.forEach(tab=>{
  tab.addEventListener('pointermove',e=>{
   if(tab.dataset.dragged!=='1')return;
   const w=document.getElementById(tab.dataset.target); if(!w)return;
   const max=w.querySelector('[data-action="maximize"]'), min=w.querySelector('[data-action="minimize"]');
   [max,min].forEach(x=>x?.classList.remove('drop-zone'));
   const hit=document.elementFromPoint(e.clientX,e.clientY);
   const ctrl=hit?.closest('.control');
   if(ctrl&&(ctrl.dataset.action==='maximize'||ctrl.dataset.action==='minimize'))ctrl.classList.add('drop-zone');
  });
  tab.addEventListener('pointerup',e=>{
   const w=document.getElementById(tab.dataset.target);if(!w)return;
   const hit=document.elementFromPoint(e.clientX,e.clientY),ctrl=hit?.closest('.control');
   if(ctrl?.dataset.action==='maximize')maximizeWindow(w);
   if(ctrl?.dataset.action==='minimize')minimizeWindow(w);
   document.querySelectorAll('.drop-zone').forEach(x=>x.classList.remove('drop-zone'));
  });
 });
})();

/* Ambient background shell: continuously simulates low-priority terminal activity behind the portfolio windows. */
(function(){
 const host=document.createElement('div');
 host.id='ambient-terminal';
 host.setAttribute('aria-hidden','true');
 host.innerHTML='<div class="ambient-head">aditya@earth:~$ tail -f /var/log/portfolio-runtime.log</div><div id="ambient-stream"></div>';
 document.getElementById('desktop').appendChild(host);
 const stream=host.querySelector('#ambient-stream');
 const commands=[
  ['ml-runtime','loading feature batch','features=128','latency=18ms'],
  ['rag-engine','embedding document chunk','vectors=768','status=ok'],
  ['mcp-gateway','refreshing tool registry','tools=14','status=ready'],
  ['postgres','querying experience_index','rows=24','status=ok'],
  ['vector-db','nearest-neighbor search','k=8','score=0.91'],
  ['api-gateway','GET /health','200','12ms'],
  ['python','model inference','LightGBM','memory=42MB'],
  ['docker','container heartbeat','portfolio-ui','healthy'],
  ['git','checking workspace','branch=main','clean'],
  ['security','token scope check','OAuth/PAT','passed'],
  ['jenkins','pipeline status','build #184','success'],
  ['jira','syncing issue metadata','issues=17','updated'],
  ['servicenow','retrieving incidents','scope=read','complete'],
  ['linux','process monitor','load=0.42','stable'],
  ['system','render pipeline','fps=60','stable']
 ];
 let n=0;
 function addLine(){
   const [name,action,a,b]=commands[Math.floor(Math.random()*commands.length)];
   const line=document.createElement('div'); line.className='ambient-line';
   const time=new Date().toLocaleTimeString([], {hour12:false});
   line.innerHTML='<span class="num">['+time+']</span> <span class="cmd">'+name+'</span> :: '+action+' <span class="ok">['+a+' | '+b+']</span>';
   stream.appendChild(line); n++;
   while(stream.children.length>13)stream.firstElementChild.remove();
   setTimeout(()=>line.scrollIntoView({block:'nearest'}),0);
   setTimeout(addLine,520+Math.random()*900);
 }
 for(let i=0;i<9;i++) setTimeout(addLine,i*180);
})();
