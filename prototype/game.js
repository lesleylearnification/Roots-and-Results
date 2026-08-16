const defs={
  irrigation:{name:"Irrigation Expansion",icon:"💦",color:"#52c7ff",tip:"Move water where it is needed.",food:-5,nature:-9,equity:2,econ:5,support:0,aff:["food","nature"]},
  drought:{name:"Drought-Resistant Crops",icon:"🌾",color:"#e8bd4f",tip:"Feed more with less water.",food:-3,nature:5,equity:2,econ:1,support:1,aff:["food","nature"]},
  reuse:{name:"Water Reuse & Recycling",icon:"🪷",color:"#4fe1b5",tip:"Every drop can work twice.",food:-1,nature:8,equity:1,econ:-1,support:1,aff:["nature","econ"]},
  support:{name:"Smallholder Support",icon:"🌺",color:"#ff9f62",tip:"Strong farmers, strong communities.",food:-1,nature:0,equity:8,econ:1,support:8,aff:["equity","support"]},
  reserve:{name:"Strategic Grain Reserve",icon:"🏛️",color:"#a98cff",tip:"Stability when shocks arrive.",food:-3,nature:0,equity:3,econ:7,support:1,aff:["food","econ"]},
  watershed:{name:"Watershed Protection",icon:"🌳",color:"#84d66b",tip:"Healthy lands sustain everything.",food:0,nature:11,equity:1,econ:0,support:3,aff:["nature","support"]}
};
const seedOrder=Object.keys(defs);
const initial={screen:"intro",phase:"playing",planted:[],energy:5,metrics:{food:24,equity:48,econ:42,nature:38,support:46},harvestReady:false,testing:false,ended:false};
let state=structuredClone(initial);
let drag=null;

const $=s=>document.querySelector(s);
const stage=$("#stage"), plantLayer=$("#plantLayer"), seedList=$("#seedList"), energyDrops=$("#energyDrops"), connectionLayer=$("#connectionLayer");
const actionZone=$("#actionZone"), progressAction=$("#progressAction"), progressText=$("#progressText"), harvestBtn=$("#harvestBtn"), liveRegion=$("#liveRegion");


function sizeFixedStage(){
  const world=$("#worldShell");
  if(!world || state.screen!=="game") return;
  const w=world.clientWidth, h=world.clientHeight;
  const size=Math.floor(Math.min(500, w*0.68, h*0.82));
  stage.style.width=size+"px";
  stage.style.height=size+"px";
}

function dispatch(action){
  if(state.ended && action.type!=="REPLAY") return;
  switch(action.type){
    case "ENTER": state.screen="game"; break;
    case "PLANT":{
      if(state.phase!=="playing" || state.planted.some(p=>p.type===action.seed)) return;
      state.planted.push({type:action.seed,x:action.x,y:action.y,level:1,grafts:[]});
      if(state.planted.length===6){state.phase="ready";state.harvestReady=true;}
      break;
    }
    case "GROW":{
      const p=state.planted[action.index];
      if(!p || state.energy<=0 || p.level>=3 || state.phase!=="playing") return;
      p.level++; state.energy--; break;
    }
    case "MOVE":{
      const p=state.planted[action.index];
      if(!p || state.phase!=="playing") return;
      p.x=action.x;p.y=action.y;break;
    }
    case "GRAFT":{
      const a=state.planted[action.a],b=state.planted[action.b];
      if(!a||!b||state.phase!=="playing")return;
      const pair=[a.type,b.type].sort().join("+");
      const valid=["irrigation+reuse","drought+irrigation","support+watershed","reserve+support","drought+watershed"];
      if(valid.includes(pair) && !a.grafts.includes(action.b)){a.grafts.push(action.b);b.grafts.push(action.a);}
      break;
    }
    case "HARVEST":
      if(!state.harvestReady || state.testing)return;
      state.testing=true;state.phase="testing";break;
    case "RESULTS": state.screen="results";state.phase="results";state.ended=true;break;
    case "REPLAY": state=structuredClone(initial);break;
  }
  deriveMetrics();
  render();
  requestAnimationFrame(sizeFixedStage);
}

function deriveMetrics(){
  const m={food:24,equity:48,econ:42,nature:38,support:46};
  state.planted.forEach(p=>{
    const d=defs[p.type],n=p.level;
    m.food+=d.food*n;m.equity+=d.equity*n;m.econ+=d.econ*n;m.nature+=d.nature*n;m.support+=d.support*n;
  });
  const grafts=state.planted.reduce((n,p)=>n+p.grafts.length,0)/2;
  m.food-=grafts;m.equity+=grafts*2;m.econ+=grafts*3;m.nature+=grafts*5;m.support+=grafts*4;
  state.metrics=m;
}

function render(){
  $("#intro").hidden=state.screen!=="intro";
  $("#game").hidden=state.screen!=="game";
  $("#results").hidden=state.screen!=="results";

  renderSeeds();renderEnergy();renderPlants();renderMetrics();renderAction();

  if(state.screen==="results") renderResults();
}

function renderSeeds(){
  seedList.innerHTML="";
  seedOrder.forEach((type,i)=>{
    const d=defs[type],used=state.planted.some(p=>p.type===type);
    const el=document.createElement("div");
    el.className="seed"+(used?" used":"")+(i===0&&state.planted.length===0?" first":"")+(i>0&&state.planted.length===0?" locked":"");
    el.dataset.seed=type;
    el.innerHTML=`<span class="icon">${d.icon}</span><div><b>${d.name}</b><small>${d.tip}</small></div>`;
    if(!used && !(i>0&&state.planted.length===0)) bindDrag(el,"seed",type);
    seedList.append(el);
  });
}

function renderEnergy(){
  energyDrops.innerHTML="";
  for(let i=0;i<state.energy;i++){
    const el=document.createElement("span");el.className="energy-drop";el.textContent="💧";el.tabIndex=0;el.setAttribute("role","button");el.setAttribute("aria-label","Growth Energy. Drag onto a planted intervention.");
    bindDrag(el,"energy",i);energyDrops.append(el);
  }
}

function renderPlants(){
  plantLayer.innerHTML="";connectionLayer.innerHTML="";
  state.planted.forEach((p,i)=>{
    const d=defs[p.type],size=82+(p.level-1)*20;
    const el=document.createElement("div");el.className="plant"+(p.grafts.length?" grafted":"");el.dataset.index=i;el.style.left=p.x+"%";el.style.top=p.y+"%";el.style.width=size+"px";el.style.height=size+"px";el.style.setProperty("--c",d.color);
    el.innerHTML=`<span class="icon">${d.icon}</span><b>${d.name}</b>`;bindDrag(el,"plant",i);plantLayer.append(el);
  });
  state.planted.forEach((p,i)=>p.grafts.forEach(j=>{if(j<i)return;const q=state.planted[j];const line=document.createElementNS("http://www.w3.org/2000/svg","line");line.setAttribute("x1",p.x*10);line.setAttribute("y1",p.y*10);line.setAttribute("x2",q.x*10);line.setAttribute("y2",q.y*10);line.setAttribute("class","connection");connectionLayer.append(line)}));
}

function renderMetrics(){
  const m=state.metrics;
  [["food","topFood","foodNodeValue"],["equity","topEquity","equityNodeValue"],["econ","topEcon","econNodeValue"],["nature","topNature","natureNodeValue"],["support","topSupport","supportNodeValue"]].forEach(([k,t,n])=>{$("#"+t).textContent=Math.round(m[k])+"%";$("#"+n).textContent=Math.round(m[k])+"%"});
  document.querySelectorAll(".metric").forEach(el=>{const k=el.dataset.metric;el.classList.toggle("danger",k!=="food"&&m[k]<45);el.classList.toggle("critical",k!=="food"&&m[k]<40)});
}

function renderAction(){
  const count=state.planted.length;
  progressText.textContent=`INTERVENTIONS ${count}/6`;
  if(state.phase==="ready"){
    progressAction.hidden=true;harvestBtn.hidden=false;harvestBtn.disabled=false;harvestBtn.classList.remove("testing");
    harvestBtn.querySelector("span").textContent="SYSTEM READY";harvestBtn.querySelector("strong").textContent="HARVEST";harvestBtn.querySelector("small").textContent="Let the Ripple test your system";
    liveRegion.textContent="System ready. Harvest available.";
  }else if(state.phase==="testing"){
    progressAction.hidden=true;harvestBtn.hidden=false;harvestBtn.disabled=true;harvestBtn.classList.add("testing");
    harvestBtn.querySelector("span").textContent="HARVEST RECEIVED";harvestBtn.querySelector("strong").textContent="THE RIPPLE IS TESTING…";harvestBtn.querySelector("small").textContent="Following every connection and trade-off";
  }else if(state.screen==="game"){
    progressAction.hidden=false;harvestBtn.hidden=true;
  }
}

function renderResults(){
  const m=state.metrics,roots=[m.equity,m.econ,m.nature,m.support],good=m.food<=15&&Math.min(...roots)>=40;
  $("#resultTitle").textContent=good?"THE LIVING NETWORK":m.food<=15?"THE BORROWED HARVEST":"THE EMPTY HARVEST";
  $("#resultSummary").textContent=good?"The Ripple pulls at your connections. They stretch, but they hold.":"The Ripple found the weakness your policy package left behind.";
  $("#resultMetrics").innerHTML=[["Food insecurity",m.food],["Livelihoods & equity",m.equity],["Economic stability",m.econ],["Natural resources",m.nature],["Political feasibility",m.support]].map(([l,v])=>`<div>${l}<b>${Math.round(v)}%</b></div>`).join("");
  const ranked=state.planted.map(p=>({name:defs[p.type].name,score:-defs[p.type].food+Math.max(0,defs[p.type].nature)+Math.max(0,defs[p.type].equity)+Math.max(0,defs[p.type].econ)+Math.max(0,defs[p.type].support)})).sort((a,b)=>b.score-a.score);
  const weak=Object.entries({equity:m.equity,economy:m.econ,nature:m.nature,feasibility:m.support}).sort((a,b)=>a[1]-b[1])[0];
  $("#compareText").textContent=`Your strongest system-building choices were ${ranked[0]?.name||"your interventions"} and ${ranked[1]?.name||"your combinations"}. Your biggest remaining trade-off was ${weak[0]} at ${Math.round(weak[1])}%.`;
  $("#takeRootText").textContent=good?"Resilience came from reinforcing connections rather than maximizing one outcome.":"A first-order gain is not enough. A resilient package keeps supporting roots above their breaking thresholds.";
}

function bindDrag(el,kind,data){
  el.addEventListener("pointerdown",ev=>{
    if(state.phase==="ready"||state.phase==="testing")return;
    ev.preventDefault();drag={kind,data};
    const ghost=el.cloneNode(true);ghost.id="dragGhost";Object.assign(ghost.style,{position:"fixed",zIndex:"9999",pointerEvents:"none",left:ev.clientX+"px",top:ev.clientY+"px",transform:"translate(-50%,-50%)",opacity:".95",width:kind==="energy"?"50px":"170px"});document.body.append(ghost);
    const move=e=>{ghost.style.left=e.clientX+"px";ghost.style.top=e.clientY+"px"};
    const up=e=>{handleDrop(e.clientX,e.clientY);ghost.remove();document.removeEventListener("pointermove",move);document.removeEventListener("pointerup",up);drag=null};
    document.addEventListener("pointermove",move);document.addEventListener("pointerup",up,{once:true});
  });
}

function stagePoint(x,y){
  const b=stage.getBoundingClientRect();return {inside:Math.hypot(x-(b.left+b.width/2),y-(b.top+b.height/2))<b.width*.42,x:(x-b.left)/b.width*100,y:(y-b.top)/b.height*100};
}

function handleDrop(x,y){
  if(!drag)return;const pt=stagePoint(x,y);const target=document.elementFromPoint(x,y)?.closest(".plant");
  if(drag.kind==="seed"&&pt.inside){const before=state.planted.length;dispatch({type:"PLANT",seed:drag.data,x:pt.x,y:pt.y});if(state.planted.length>before){log(`${defs[drag.data].name} takes root.`);showConsequence(drag.data);if(state.planted.length===1){$("#tutorial").innerHTML="<b>THE RIPPLE</b><span>Every choice travels through the system.</span>"}}}
  else if(drag.kind==="energy"&&target){dispatch({type:"GROW",index:Number(target.dataset.index)});log("Growth Energy applied.");}
  else if(drag.kind==="plant"&&target&&Number(target.dataset.index)!==drag.data){dispatch({type:"GRAFT",a:drag.data,b:Number(target.dataset.index)});log("Graft tested.");}
  else if(drag.kind==="plant"&&pt.inside){dispatch({type:"MOVE",index:drag.data,x:pt.x,y:pt.y});}
}

function showConsequence(type){
  const p=state.planted.find(x=>x.type===type);if(!p)return;
  const targetKey=defs[type].aff[0],node=document.querySelector(`[data-metric="${targetKey}"]`);if(!node)return;
  const sb=stage.getBoundingClientRect(),nb=node.getBoundingClientRect();const line=document.createElementNS("http://www.w3.org/2000/svg","line");line.setAttribute("x1",p.x*10);line.setAttribute("y1",p.y*10);line.setAttribute("x2",((nb.left+nb.width/2-sb.left)/sb.width)*1000);line.setAttribute("y2",((nb.top+nb.height/2-sb.top)/sb.height)*1000);line.setAttribute("class","consequence-line");connectionLayer.append(line);setTimeout(()=>line.remove(),1300);
}

function log(t){const el=document.createElement("div");el.className="log-item";el.textContent=t;$("#eventLog").prepend(el)}

$("#enterBtn").addEventListener("click",()=>dispatch({type:"ENTER"}));
$("#resetBtn").addEventListener("click",()=>location.reload());
$("#replayBtn").addEventListener("click",()=>location.reload());
harvestBtn.addEventListener("click",()=>{
  dispatch({type:"HARVEST"});
  setTimeout(()=>dispatch({type:"RESULTS"}),900);
});

render();
window.addEventListener("resize",sizeFixedStage);

/* RELEASE SELF-TEST: activated only with ?selftest=1 */
async function runSelfTest(){
  const report={geometry:[],steps:[],passed:false};
  dispatch({type:"ENTER"});
  const rect=()=>{const r=stage.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
  const baseline=rect();report.geometry.push({n:0,...baseline});
  const positions=[[42,34],[58,35],[34,49],[65,50],[40,65],[59,66]];
  seedOrder.forEach((seed,i)=>{dispatch({type:"PLANT",seed,x:positions[i][0],y:positions[i][1]});report.geometry.push({n:i+1,...rect()});});
  const stable=report.geometry.every(g=>g.x===baseline.x&&g.y===baseline.y&&g.w===baseline.w&&g.h===baseline.h);
  report.steps.push({name:"six-plants",ok:state.planted.length===6});
  report.steps.push({name:"harvest-visible",ok:!harvestBtn.hidden&&state.phase==="ready"});
  report.steps.push({name:"geometry-stable",ok:stable});
  harvestBtn.click();
  report.steps.push({name:"testing-feedback",ok:state.phase==="testing"&&harvestBtn.textContent.includes("THE RIPPLE IS TESTING")});
  await new Promise(r=>setTimeout(r,1100));
  report.steps.push({name:"results-visible",ok:state.screen==="results"&&!$("#results").hidden});
  report.steps.push({name:"replay-control",ok:!!$("#replayBtn")});
  report.passed=report.steps.every(s=>s.ok);
  document.body.setAttribute("data-selftest",report.passed?"PASS":"FAIL");
  const out=document.createElement("pre");out.id="selfTestResult";out.textContent=JSON.stringify(report,null,2);document.body.append(out);
}
if(new URLSearchParams(location.search).get("selftest")==="1")runSelfTest();
