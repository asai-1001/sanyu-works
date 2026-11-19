/* =====================================================================
   三友ワークス Ver. 2.3 — ゲームの進行
   さんぽぽを1つ、設計開発 → 機械加工 → 組立調整 の順に作り上げる。
   一日コース・練習・作業の結果（クリア／時間切れ・★）・適職診断・アンケート・修了証・
   一時停止・イベントモード（放置でタイトルへ）・メインループ
   ===================================================================== */
(()=>{
'use strict';
const S=SW,D=S.DATA,T=S.T,esc=S.esc;
S.VERSION='2.6.0';
const $=S.$;
let curStage=null,curGame=null,mode=null,started=false;
const results={};                                  /* results[作業id] = {clear,stars,used,miss} */
const NT=()=>S.STAGES.length,MAXSTAR=()=>NT()*3;
const deptOf=st=>D.DEPTS.find(d=>d.id===st.dept);
const tasksOf=d=>S.STAGES.filter(s=>s.dept===d.id);
const starSum=()=>Object.values(results).reduce((a,r)=>a+(r.stars||0),0);
const clearSum=()=>Object.values(results).filter(r=>r.clear).length;
const timeSum=()=>Math.round(Object.values(results).reduce((a,r)=>a+(r.used||0),0));
const starStr=n=>'★'.repeat(n)+'☆'.repeat(3-n);
S.starStr=starStr;
function titleOf(st){const m=MAXSTAR();return st>=m?'ものづくりの匠':st>=m*.75?'頼れる若手技術者':st>=m*.4?'期待のルーキー':'見習い技術者'}
function hudStars(){S.setText('hudScore','★ '+starSum()+' / '+MAXSTAR())}
function hudButtons(){const on=!!curStage;$('btnHelp').disabled=!on;$('btnPause').disabled=!on}

/* ---------- 部門ごとのさんぽぽの衣装 ----------
   img/sanpopo_dev.png（書類）／ sanpopo_mc.png（保護めがね）／ sanpopo_as.png（ドライバー）／ sanpopo_help.png（スパナ） */
const MASCOT={dev:'img/sanpopo_dev.png',mc:'img/sanpopo_mc.png',as:'img/sanpopo_as.png',help:'img/sanpopo_help.png'};
S.mascotSrc='img/sanpopo.png';
S.setMascot=k=>{const src=MASCOT[k]||'img/sanpopo.png';if(src===S.mascotSrc)return;S.mascotSrc=src;$('face').src=S.asset(src);const ti=document.querySelector('#toast img');if(ti)ti.src=S.asset(src)};

/* ---------- 上の帯の「いまどの部門か」 ---------- */
function setSteps(now){
  const el=$('steps');if(now==null){el.hidden=true;return}
  el.hidden=false;el.innerHTML=D.DEPTS.map((d,i)=>`<li class="${i<now?'done':i===now?'now':''}"><i></i><span>${esc(d.short)}</span></li>`).join('');
}
S.setSteps=setSteps;

/* ---------- 部門の紹介・エンディングの背景（3つの部門の流れ＋立体のさんぽぽ） ---------- */
const flowScene={dept:0,done:0,finale:false,draw(t){
  const C=S.getCtx(),{R,jt}=S,P=T.PAL;T.bg();
  if(this.finale){const g=C.createRadialGradient(160,86,6,160,86,120);g.addColorStop(0,'rgba(246,194,28,.30)');g.addColorStop(1,'rgba(246,194,28,0)');C.fillStyle=g;C.fillRect(0,0,S.W,S.H);
    if(!S.reduceMotion)for(let i=0;i<26;i++){const a=S.hash(i,3)*S.TAU+t*.3,r=44+S.hash(i,5)*70,x=160+Math.cos(a)*r*1.3,y=84+Math.sin(a)*r*.7;S.circ(x,y,.5+S.hash(i,9)*.9,`rgba(255,236,170,${.3+.5*Math.abs(Math.sin(t*2+i))})`)}
    S.Sanpo.draw(C,90,6,140,132,{yaw:t*.7,base:true,glow:[1,1]});jt('完成！　さんぽぽ、出荷OK',160,8,P.acc,9,'center');return}
  /* 上：3つの部門の流れ */
  D.DEPTS.forEach((d,i)=>{const x=22+i*96,w=88,now=i===this.dept,done=i<this.done;
    C.beginPath();C.moveTo(x,12);C.lineTo(x+w-8,12);C.lineTo(x+w,24);C.lineTo(x+w-8,36);C.lineTo(x,36);C.lineTo(x+8,24);C.closePath();
    C.fillStyle=now?'#1f5fae':done?'#1d4a35':'#1b2937';C.fill();C.strokeStyle=now?P.acc:done?P.ok:P.line;C.lineWidth=now?1.1:.6;C.stroke();
    jt(d.name,x+w/2+2,19.5,now||done?'#fff':P.mut,7.2,'center');if(done)T.check(x+w-12,24,true)});
  /* 中：さんぽぽの今のすがた */
  const st=this.done;S.Sanpo.draw(C,96,40,128,112,Object.assign({yaw:Math.sin(t*.6)*.5},st===0?{ghost:true}:st===1?{ghost:true,glow:[.6,.6]}:st===2?{spikes:0,face:false,eyes:0}:{base:true,glow:[1,1]}));
  jt(['まだ、アイデアだけ','図面ができた！','体の部品ができた！','完成！'][st],160,142,P.mut,6,'center');
}};

/* ---------- 見出しカード ---------- */
let cardDone=null,cardTO=0;
S.cardOpen=false;
S.hideCard=()=>{clearTimeout(cardTO);$('card').hidden=true;S.cardOpen=false;cardDone=null};
function showCard(k,title,sub){
  const el=$('card');
  el.innerHTML=`<div class="card-in"><p class="card-k">${k}</p><h2>${esc(title)}</h2><p class="card-e">${esc(sub||'')}</p><span class="card-bar"></span></div>`;
  el.hidden=false;S.cardOpen=true;S.sfx.ok();
  return S.guard(new Promise(res=>{cardDone=()=>{const r=res;S.hideCard();r()};cardTO=setTimeout(()=>{if(cardDone)cardDone()},S.reduceMotion?1400:2100)}));
}
$('card').addEventListener('click',()=>{if(cardDone)cardDone()});

/* ---------- チュートリアルを見るか（設定が「毎回たずねる」なら、何回目でも聞く） ---------- */
const tutOf=(st,g)=>typeof st.tut==='function'?st.tut(g):st.tut;
function wantTutorial(st){
  if(S.settings.tut==='always')return Promise.resolve(true);
  if(S.settings.tut==='never')return Promise.resolve(false);
  return S.guard(new Promise(res=>{
    const p=S.panel(`<div class="pin narrow center pop">
      <img class="mini" src="${S.asset(MASCOT.help)}" alt=""><p class="kicker">${esc(deptOf(st).name)}　${esc(st.name)}</p>
      <h3>操作のチュートリアルを見る？</h3><p class="sub">はじめての人は見るのがおすすめ。チュートリアルのあいだ、制限時間は進まないよ。</p>
      <div class="btnrow center"><button type="button" class="btn" data-a="y">チュートリアルを見る</button><button type="button" class="btn ghost" data-a="n">見ないで始める</button></div>
      <p class="fine">あとからでも、右上の「？」ボタンでいつでも見られます<span class="kbd">（←→キーでえらんで Enter）</span></p></div>`,'ask');
    p.querySelector('[data-a="y"]').addEventListener('click',()=>{S.sfx.blip();S.closePanel();res(true)});
    p.querySelector('[data-a="n"]').addEventListener('click',()=>{S.sfx.blip();S.closePanel();res(false)});
    S.focusSoon(p.querySelector('[data-a="y"]'));
  }));
}

/* ---------- 1つの作業 ---------- */
async function runStage(st){
  await S.guard(S.fadeOut());
  if(curGame)curGame.dead=true;
  const d=deptOf(st),no=S.STAGES.indexOf(st)+1;S.setMascot(d.id);
  S.setClock(d.clock);S.setPlace(d.name+'　'+st.name);S.setTimer(null);S.setTag('');S.hideToast();S.setControls([]);
  setSteps(mode==='course'?D.DEPTS.indexOf(d):null);hudStars();
  const g=st.make();S.scene=g;curGame=g;started=false;
  S.setHint('');S.bgm('title');S.fadeIn();
  await showCard(`${esc(d.name)}　${mode==='course'?`作業 ${no} / ${NT()}`:'練習モード'}<span>制限時間 ${st.limit} 秒</span>`,st.name,'時間内に終わらせればクリア');
  curStage=st;hudButtons();
  S.setHint('Enterキー（または画面のクリック）で会話が進みます。');
  await S.say(D.LINES[st.lines]);
  const want=await wantTutorial(st);
  S.setHint(st.hint||'');
  if(want)await S.runTutorial(tutOf(st,g),{title:'チュートリアル',last:'はじめる'});
  S.bgm('work');started=true;S.setTimer(st.limit);if(st.hint)S.setHint(st.hint);
  const res=await S.guard(g.start());
  curStage=null;started=false;hudButtons();S.bgm('title');S.cv.style.cursor='default';
  S.setTimer(null);S.setTag('');S.setControls([]);S.hideToast();
  results[st.id]=res;hudStars();
  let isBest=false;
  if(res.clear){const best=S.store.get('best',{}),b=best[st.id];if(!b||res.stars>b.stars||(res.stars===b.stars&&res.used<b.used)){best[st.id]={stars:res.stars,used:res.used};S.store.set('best',best);isBest=!!b}}
  const act=await stageResult(st,res,isBest);
  S.closePanel();
  return act;
}
async function playStage(st){
  for(;;){
    let act;
    try{act=await runStage(st)}catch(e){if(e==='RETRY'){delete results[st.id];curStage=null;hudButtons();continue}throw e}
    if(act==='retry'){delete results[st.id];continue}
    return act;
  }
}
function stampSoon(){if(!S.reduceMotion)setTimeout(()=>S.sfx.stamp(),560)}
function stageResult(st,res,isBest){
  return S.guard(new Promise(done=>{
    const no=S.STAGES.indexOf(st)+1,d=deptOf(st),jobs=(D.JOB_OF_TASK[st.id]||[]).map(k=>D.JOBS[k]);
    const lastOfDept=tasksOf(d).slice(-1)[0]===st;
    const nextLabel=mode==='practice'?'作業えらびへ':res.clear?(lastOfDept?'部門クリア！ 次へ ▶':'次の作業へ ▶'):'先へ進む ▶';
    const p=S.panel(`<div class="pin pop">
      <div class="result">
        <div class="res-l">
          <p class="kicker">${esc(d.name)}　${mode==='course'?`作業 ${no} / ${NT()}`:'練習'}　${esc(st.name)}</p>
          <div class="res-head"><div><p class="res-label">結果${isBest?'<span class="badge">自己ベスト</span>':''}</p><p class="res-score ${res.clear?'clear':'fail'}">${res.clear?'クリア！':'時間切れ'}</p></div>
            ${res.clear?`<div class="stars big">${[1,2,3].map(i=>`<i class="${i<=res.stars?'on':''}" style="animation-delay:${.3+i*.18}s">★</i>`).join('')}</div>`:''}</div>
          <div class="statrow"><div><span>かかった時間</span><b>${res.clear?res.used.toFixed(1)+' 秒':'—'}</b><small>制限 ${st.limit} 秒</small></div><div><span>ミス</span><b>${res.miss} 回</b><small>${res.clear?(res.stars===3?'ミスなし・時間に余裕':res.stars===2?'ミス2回まで':'ミス3回以上'):''}</small></div></div>
          <p class="res-detail">${res.clear?esc(res.detail):'時間内に終わらなかった。「もう一度」で、やり直せるよ。操作にまよったら、チュートリアルを見てみよう。'}</p>
        </div>
        <div class="res-r">
          <p class="get-k">この作業に近い仕事</p>
          ${jobs.map(j=>`<div class="get"><span class="jobdot"></span><div><p class="get-n">${esc(j.n)}</p><p class="get-q">${esc(j.desc)}</p></div></div>`).join('')}
        </div>
      </div>
      <div class="btnrow">${res.clear?`<button type="button" class="btn" data-a="next">${nextLabel}</button><button type="button" class="btn ghost" data-a="retry">もう一度この作業</button>`
        :`<button type="button" class="btn" data-a="retry">もう一度この作業</button><button type="button" class="btn ghost" data-a="next">${nextLabel}</button>`}</div></div>`,'res');
    if(res.clear)stampSoon();
    S.setHint(res.clear?(res.stars===3?'すばらしい！ ★3つの最高評価です。':'クリア！ ミスを減らすと★が増えるよ。（←→キーでえらんで Enter）'):'「もう一度この作業」で、やり直せます。（←→キーでえらんで Enter）');
    p.querySelector('[data-a="next"]').addEventListener('click',()=>{S.sfx.blip();done('next')});
    p.querySelector('[data-a="retry"]').addEventListener('click',()=>{S.sfx.blip();done('retry')});
    S.focusSoon(p.querySelector('.btnrow .btn'));
  }));
}

/* ---------- 部門のはじめと終わり ---------- */
async function showFlow(deptIdx,done,finale){
  await S.guard(S.fadeOut());
  if(curGame){curGame.dead=true;curGame=null}
  flowScene.dept=deptIdx;flowScene.done=done;flowScene.finale=!!finale;S.scene=flowScene;
  S.setTimer(null);S.setTag('');S.setControls([]);S.bgm('title');S.fadeIn();
}
async function deptIntro(d){
  const i=D.DEPTS.indexOf(d);await showFlow(i,i);S.setMascot(d.id);
  S.setClock(d.clock);S.setPlace(d.name);setSteps(i);
  await showCard(`部門 ${i+1} / ${D.DEPTS.length}`,d.name,d.sub);
  S.setHint('Enterキー（または画面のクリック）で会話が進みます。');
  await S.say(D.LINES[d.intro]);
}
function gotPanel(title,cards,memos,btn){
  return S.guard(new Promise(done=>{
    const p=S.panel(`<div class="pin pop"><p class="kicker">${esc(title)}</p><h3>職種カードと技術ずかんが増えたよ</h3>
      <div class="gotgrid">${cards.map(id=>{const c=S.CARD_BY[id];return `<div class="get new"><span class="jobno">${String(c.no).padStart(2,'0')}</span><div><p class="get-k">職種カード</p><p class="get-n">${esc(c.name)}</p><p class="get-q">${esc(c.work)}</p></div></div>`}).join('')}
      ${memos.map(id=>{const m=S.MEMO_BY[id];return `<div class="zmini new"><span class="zi">${D.ICONS[m.icon]||''}</span><div><p class="get-k">技術ずかん</p><p class="zbig">${esc(m.big)}<small>${esc(m.unit)}</small></p><p class="get-n">${esc(m.title)}</p></div></div>`}).join('')}</div>
      <div class="btnrow"><button type="button" class="btn" data-a="next">${esc(btn)}</button></div></div>`,'res');
    S.sfx.fan();p.querySelector('[data-a="next"]').addEventListener('click',()=>{S.sfx.blip();S.closePanel();done()});S.focusSoon(p.querySelector('[data-a="next"]'));
  }));
}
async function deptClear(d){
  const i=D.DEPTS.indexOf(d);await showFlow(i,i+1);S.setMascot(d.id);S.setPlace(d.name);
  await S.say(D.LINES[d.clear]);
  d.cards.forEach(c=>S.unlock('cards',c));d.memos.forEach(m=>S.unlock('memos',m));
  S.setHint('タイトルの「職種カード」「技術ずかん」で、いつでも読めます。');
  await gotPanel(d.name+'　クリア',d.cards,d.memos,i<D.DEPTS.length-1?'次の部門へ ▶':'出荷へ ▶');
}

/* ---------- 一日コース ---------- */
function crash(e){if(e!=='TITLE'&&e!=='RETRY')console.error(e)}
function resetRun(){Object.keys(results).forEach(k=>delete results[k]);hudStars()}
S.startCourse=async function(){
  if(S.running)return;S.running=true;S.atTitle=false;mode='course';resetRun();
  const t0=Date.now();
  try{
    await S.guard(S.fadeOut());S.setMascot(null);S.scene=S.gateScene;S.gateScene.evening=false;S.setClock('AM 08:30');S.setPlace('三友製作所');setSteps(-1);S.setControls([]);S.fadeIn();
    S.setHint('Enterキー（または画面のクリック）で会話が進みます。');
    await S.say(D.LINES.opening,{name:S.playerName||'ゲスト'});
    for(const d of D.DEPTS){await deptIntro(d);for(const st of tasksOf(d))await playStage(st);await deptClear(d)}
    await ending(Math.round((Date.now()-t0)/1000));
  }catch(e){crash(e);S.running=false;curStage=null;hudButtons();S.showTitle()}
};
S.practice=async function(st){
  if(S.running)return;S.running=true;S.atTitle=false;mode='practice';resetRun();
  let toTitle=false;
  try{await playStage(st)}catch(e){crash(e);toTitle=true}
  S.running=false;curStage=null;hudButtons();if(toTitle)S.showTitle();else S.showPicker();
};

function ask(q,idx){return S.guard(new Promise(res=>{
  const p=S.panel(`<div class="pin narrow"><p class="kicker">適職診断　Q${idx+1} / ${D.QS.length}</p><div class="prog"><i style="width:${Math.round(idx/D.QS.length*100)}%"></i></div><h3>${esc(q.q)}</h3>
    <div class="opts">${q.a.map((a,i)=>`<button type="button" class="opt" data-i="${i}">${esc(a.t)}</button>`).join('')}</div></div>`,'survey');
  p.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();res(q.a[+b.dataset.i])},{once:true}));
  S.focusSoon(p.querySelector('.opt'))}))}

async function ending(durationSec){
  curStage=null;hudButtons();
  await showFlow(2,3,true);S.setMascot(null);S.setClock('PM 04:30');S.setPlace('出荷');setSteps(D.DEPTS.length);S.sfx.fan();
  S.setHint('Enterキー（または画面のクリック）で会話が進みます。');
  await S.say(D.LINES.ending);
  S.setHint('いちばん近いものを選んでください。正解・不正解はありません。（矢印キーでえらんで Enter）');
  const aff={};Object.keys(D.JOBS).forEach(k=>aff[k]=0);
  for(let i=0;i<D.QS.length;i++){const a=await ask(D.QS[i],i);for(const k in a.p)aff[k]+=a.p[k]}
  for(const id in D.JOB_OF_TASK){const r=results[id];if(r)D.JOB_OF_TASK[id].forEach(k=>aff[k]+=(r.stars||0)/3*.9)}
  const ranked=Object.keys(aff).sort((a,b)=>aff[b]-aff[a]);const J=D.JOBS[ranked[0]],mx=Math.max(...Object.values(aff))||1;
  D.END_CARDS.forEach(c=>S.unlock('cards',c));D.END_MEMOS.forEach(m=>S.unlock('memos',m));
  const c=S.CARD_BY[J.card];S.sfx.fan();
  const p=S.panel(`<div class="pin pop"><div class="result">
      <div class="res-l"><p class="kicker">適職診断の結果</p><h3>あなたに向いていそうなのは<br><span class="hl">「${esc(J.n)}」</span></h3><p>${esc(J.desc)}</p>
        <p class="res-detail"><b>向いているポイント：</b>${esc(J.good)}<br><b>入社後に覚えていくこと：</b>${esc(J.learn)}</p></div>
      <div class="res-r"><div class="bars">${ranked.map((k,i)=>`<div class="bar${i===0?' top':''}"><span>${esc(D.JOBS[k].n)}</span><i><b style="width:${Math.round(aff[k]/mx*100)}%"></b></i></div>`).join('')}</div>
        <div class="get"><span class="jobno">${String(c.no).padStart(2,'0')}</span><div><p class="get-k">職種カード</p><p class="get-n">${esc(c.name)}</p><p class="get-q">${esc(c.pts[0])}</p></div></div></div>
    </div><div class="btnrow"><button type="button" class="btn" id="nx">次へ</button></div></div>`,'res');
  S.setHint('アンケートの答えと、作業の成績から診断しています。ほかの職種との相性も表示しています。');
  await S.waitClick(p.querySelector('#nx'));S.closePanel();
  const stars=starSum(),clears=clearSum(),time=timeSum();
  const list=S.store.get('rank',[]);const d=new Date();
  const entry={name:S.playerName||'ゲスト',stars,clears,time,title:titleOf(stars),job:J.n,date:`${d.getMonth()+1}/${d.getDate()}`,id:Date.now()+'-'+Math.random().toString(36).slice(2,6)};
  list.push(entry);list.sort((a,b)=>b.stars-a.stars||a.time-b.time);const pos=list.indexOf(entry)+1;S.store.set('rank',list.slice(0,50));
  await S.say(D.LINES.survey);
  S.setHint('選択肢を押すと次の質問に進みます。（矢印キーでえらんで Enter）');
  const sc={};S.STAGES.forEach(s=>{sc[s.id]=results[s.id]?results[s.id].stars:0});
  await S.runSurvey({mode:'course',total:stars,clears,time,scores:sc,job:J.n,durationSec});
  S.running=false;S.finalShown=false;
  S.lastRun={entry,pos,results:JSON.parse(JSON.stringify(results)),job:J,date:d};
  S.showFinal();
}

/* ---------- 一日コースの最終結果 ---------- */
S.showFinal=function(){
  const L=S.lastRun;if(!L){S.showTitle();return}
  const {entry,pos}=L;
  flowScene.finale=true;S.scene=flowScene;S.setControls([]);S.setTimer(null);S.setTag('');S.atTitle=false;
  const co=D.COMPANY||{};
  const p=S.panel(`<div class="pin pop">
    <p class="kicker">${esc(entry.name)}さん　今日の成績</p>
    <div class="res-head"><div><p class="res-label">クリアした作業</p><p class="res-score">${entry.clears}<small> / ${NT()}</small></p></div>
      <div><p class="res-label">★の合計</p><p class="res-score star">${entry.stars}<small> / ${MAXSTAR()}</small></p></div>
      <div class="final-meta"><p>称号<b>${esc(entry.title)}</b></p><p>作業時間の合計<b>${entry.time} 秒</b></p><p>この端末のランキング<b>${pos}位</b></p></div></div>
    <div class="sum d3">${D.DEPTS.map(d=>`<div class="sumdept"><p>${esc(d.name)}</p><div>${tasksOf(d).map(s=>{const r=L.results[s.id]||{};return `<span><em>${esc(s.name)}</em><b class="${r.clear?'':'off'}">${r.clear?starStr(r.stars):'時間切れ'}</b></span>`}).join('')}</div></div>`).join('')}</div>
    <p class="sub">おつかれさまでした！ 体験の記念に「修了証」を画像で保存できます。</p>
    <div class="btnrow"><button type="button" class="btn" data-a="cert">修了証を見る</button><button type="button" class="btn ghost" data-a="book">職種カード</button><button type="button" class="btn ghost" data-a="rank">ランキング</button>${co.url&&!S.settings.event?`<a class="btn ghost" href="${esc(co.url)}" target="_blank" rel="noopener">${esc(co.linkLabel||'採用ページ')} ↗</a>`:''}<button type="button" class="btn ghost" data-a="title">タイトルへ</button></div></div>`,'res');
  if(!S.finalShown){S.finalShown=true;S.sfx.fan()}
  S.setHint('おつかれさまでした！ 三友製作所の仕事に興味がわいたら、職種カードもぜひ読んでみてね。');
  p.querySelector('[data-a="title"]').addEventListener('click',()=>{S.sfx.blip();S.showTitle()});
  p.querySelector('[data-a="book"]').addEventListener('click',()=>{S.sfx.blip();S.showBook(null,true)});
  p.querySelector('[data-a="rank"]').addEventListener('click',()=>{S.sfx.blip();S.showRanking(entry.id)});
  p.querySelector('[data-a="cert"]').addEventListener('click',()=>{S.sfx.blip();showCertificate()});
  S.focusSoon(p.querySelector('[data-a="cert"]'));
};

/* ---------- 修了証（画像として保存できる） ---------- */
function drawCertificate(L,noImg){
  const Wc=1600,Hc=1000,c=document.createElement('canvas');c.width=Wc;c.height=Hc;const x=c.getContext('2d');
  const F=(w,px)=>`${w} ${px}px "SWSans","Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif`;
  const Tx=(s,px,py,font,col,al)=>{x.font=font;x.fillStyle=col;x.textAlign=al||'left';x.textBaseline='alphabetic';x.fillText(String(s),px,py)};
  const NAVY='#123f7c',INK='#1c2530',GOLD='#f2c230',MUTE='#6b7682';
  x.fillStyle='#fbf8ee';x.fillRect(0,0,Wc,Hc);
  x.strokeStyle='rgba(18,63,124,.06)';x.lineWidth=1;for(let i=40;i<Wc;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i,Hc);x.stroke()}for(let j=40;j<Hc;j+=40){x.beginPath();x.moveTo(0,j);x.lineTo(Wc,j);x.stroke()}
  x.strokeStyle=NAVY;x.lineWidth=10;x.strokeRect(35,35,Wc-70,Hc-70);x.lineWidth=2;x.strokeRect(56,56,Wc-112,Hc-112);
  x.fillStyle=GOLD;[[35,35],[Wc-75,35],[35,Hc-75],[Wc-75,Hc-75]].forEach(([a,b])=>x.fillRect(a,b,40,40));
  x.fillStyle=NAVY;x.fillRect(100,100,12,96);
  Tx('三友製作所 ものづくり体験ゲーム「三友ワークス」',132,132,F(500,30),MUTE);
  Tx('体験修了証',128,192,F(700,64),NAVY);
  const name=L.entry.name||'ゲスト';
  Tx(name,128,312,F(700,84),INK);const nw=(x.font=F(700,84),x.measureText(name).width);Tx('さん',128+nw+18,312,F(500,40),INK);
  x.fillStyle=NAVY;x.fillRect(128,334,Math.max(420,nw+120),3);
  Tx('あなたは、三友製作所の3つの部門（設計開発・機械加工・組立調整）と、それぞれの検査を体験し、',128,392,F(400,28),INK);
  Tx('さんぽぽを1つ、設計から出荷まで作り上げました。ここに修了を証します。',128,434,F(400,28),INK);
  /* 左：まとめ */
  Tx('クリアした作業',128,520,F(700,24),MUTE);Tx(L.entry.clears,128,612,F(700,100),INK);const tw=(x.font=F(700,100),x.measureText(String(L.entry.clears)).width);Tx(`/ ${NT()}`,128+tw+14,612,F(500,34),MUTE);
  Tx('★の合計',400,520,F(700,24),MUTE);Tx(L.entry.stars,400,612,F(700,100),'#b07d00');const sw=(x.font=F(700,100),x.measureText(String(L.entry.stars)).width);Tx(`/ ${MAXSTAR()}`,400+sw+14,612,F(500,34),MUTE);
  Tx('称号',128,690,F(500,24),MUTE);Tx(L.entry.title,128,738,F(700,42),NAVY);
  Tx('向いていそうな仕事（適職診断）',128,800,F(500,24),MUTE);Tx(`「${L.job.n}」`,112,850,F(700,42),NAVY);
  /* 中：部門ごとの成績 */
  let y=498;const bx=720;
  D.DEPTS.forEach(d=>{Tx(d.name,bx,y+18,F(700,24),NAVY);x.fillStyle=NAVY;x.fillRect(bx,y+26,470,2);y+=34;
    tasksOf(d).forEach(s=>{const r=L.results[s.id]||{};Tx(s.name,bx+14,y+21,F(500,23),INK);Tx(r.clear?starStr(r.stars):'時間切れ',bx+470,y+21,F(700,24),r.clear?'#b07d00':MUTE,'right');y+=30});y+=10});
  /* 右：完成したさんぽぽ */
  let drew=false;
  if(!noImg&&S.G3.ok){try{const k=S.G3;k.render(S.Sanpo.list({yaw:.45,base:true,glow:[1,1]}),{yaw:0,pitch:.12,dist:7.4,target:[0,.12,0],fov:.5},640,600);x.drawImage(k.canvas,1215,470,320,300);drew=true}catch(e){drew=false}}
  if(!drew&&!noImg&&S.SANPO.complete&&S.SANPO.naturalWidth){x.imageSmoothingEnabled=true;x.drawImage(S.SANPO,1262,520,228,180)}
  Tx('あなたが作ったさんぽぽ',1375,790,F(500,22),MUTE,'center');
  const d=L.date||new Date();
  x.fillStyle=NAVY;x.fillRect(128,896,1364,2);
  Tx(`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`,128,932,F(500,26),INK);
  Tx('案内係　さんぽぽ',1180,932,F(500,24),MUTE,'right');
  Tx((D.COMPANY&&D.COMPANY.name)||'株式会社三友製作所',1492,932,F(700,30),INK,'right');
  return c;
}
function showCertificate(){
  const L=S.lastRun;if(!L)return;
  let url='';try{url=drawCertificate(L).toDataURL('image/png')}catch(e){try{url=drawCertificate(L,true).toDataURL('image/png')}catch(e2){console.error(e2)}}
  const p=S.panel(`<div class="pin cert">
    <div class="phead"><button type="button" class="btn ghost back" data-a="back">← もどる</button><h2>体験修了証</h2><span class="count">画像として保存して、記念に持ち帰れます</span></div>
    <div class="certbox">${url?`<img src="${url}" alt="体験修了証">`:'<div class="empty">修了証を作れませんでした。</div>'}</div>
    <div class="btnrow center">${url?`<a class="btn" download="三友ワークス_修了証.png" href="${url}">画像を保存する</a>`:''}</div></div>`,'pmenu');
  S.setHint('「画像を保存する」でPNG画像をダウンロードできます。');
  p.querySelector('[data-a="back"]').addEventListener('click',()=>{S.sfx.blip();S.showFinal()});
  S.focusSoon(p.querySelector('a.btn')||p.querySelector('[data-a="back"]'));
}
S.drawCertificate=drawCertificate;

/* ---------- 一時停止・ヘルプ ---------- */
function openPause(){
  if(!curStage||S.paused||S.panelOpen())return;S.paused=true;S.sfx.blip();
  const p=S.panel(`<div class="pin narrow center pop"><p class="kicker">一時停止中（時間は止まっています）</p><h3>${esc(deptOf(curStage).name)}　${esc(curStage.name)}</h3>
    <div class="menu col">
      <button type="button" class="btn" data-a="resume">つづける</button>
      <button type="button" class="btn ghost" data-a="help">この作業の操作を見る</button>
      <button type="button" class="btn ghost" data-a="retry">この作業をはじめからやり直す</button>
      <button type="button" class="btn ghost" data-a="title">タイトルへもどる</button></div>
    <p class="fine">${mode==='course'?'タイトルへもどると、一日コースの記録は残りません':'練習モード'}<span class="kbd">　（↑↓キーでえらんで Enter）</span></p></div>`,'pause');
  const resume=()=>{S.paused=false;S.closePanel()};
  p.querySelector('[data-a="resume"]').addEventListener('click',()=>{S.sfx.blip();resume()});
  p.querySelector('[data-a="help"]').addEventListener('click',()=>{S.sfx.blip();resume();openHelp()});
  p.querySelector('[data-a="retry"]').addEventListener('click',()=>{S.sfx.blip();S.abortFlow('RETRY')});
  p.querySelector('[data-a="title"]').addEventListener('click',()=>{S.sfx.blip();S.abortFlow('TITLE')});
  S.focusSoon(p.querySelector('[data-a="resume"]'));
}
function openHelp(){
  if(!curStage||S.tutActive||S.panelOpen())return;
  S.runTutorial(tutOf(curStage,curGame),{title:'操作のおさらい',last:'もどる'}).catch(()=>{});
}
$('btnPause').addEventListener('click',openPause);
$('btnHelp').addEventListener('click',openHelp);
S.onEscape=()=>{if(S.vlogBack){S.vlogBack();return}if(S.paused){S.paused=false;S.closePanel()}else openPause()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.vlogPlaying&&S.vlogPlaying()){const v=$('panel').querySelector('video');if(v)v.pause()}if(document.hidden&&started&&!S.tutActive)openPause()});

/* ---------- キーボードだけでも、メニューやパネルのボタンをえらべるようにする ----------
   矢印キーで、開いているパネル（またはチュートリアル）の中のボタンを順に移動。Enter で決定。 */
window.addEventListener('keydown',e=>{
  if(e.isComposing||e.keyCode===229)return;
  if(e.target&&e.target.tagName==='TEXTAREA')return;   /* 感想の入力中は、矢印・PageUp/Down などのキーを文字の入力に使う */
  /* PageUp / PageDown：パネルの中の長い文（職種カードのスケジュールなど）をスクロール */
  if((e.key==='PageDown'||e.key==='PageUp')&&S.panelOpen()){const sc=[...$('panel').querySelectorAll('.detail,.pin')].reverse().concat([$('panel')]).find(el=>el.scrollHeight>el.clientHeight+2);if(sc){e.preventDefault();sc.scrollBy({top:(e.key==='PageDown'?1:-1)*sc.clientHeight*.8,behavior:'smooth'})}return}
  if(S.cardOpen&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(cardDone)cardDone();return}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  const tg=e.target;if(tg&&tg.tagName==='INPUT'&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))return;
  const box=S.tutActive?$('tut'):S.panelOpen()?$('panel'):null;if(!box)return;
  const els=[...box.querySelectorAll('button:not([disabled]),a.btn,input')].filter(el=>el.offsetParent!==null);if(!els.length)return;
  e.preventDefault();const cur=els.indexOf(document.activeElement);
  if(cur<0){els[0].focus();return}
  /* 画面上の位置がいちばん近い方向のボタンへ */
  const r0=els[cur].getBoundingClientRect(),cx=r0.left+r0.width/2,cy=r0.top+r0.height/2,d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
  let best=-1,bs=1e9;els.forEach((el,i)=>{if(i===cur)return;const r=el.getBoundingClientRect(),dx=r.left+r.width/2-cx,dy=r.top+r.height/2-cy,al=dx*d[0]+dy*d[1];if(al<=2)return;const sc=al+(Math.abs(dx*d[1])+Math.abs(dy*d[0]))*2.5;if(sc<bs){bs=sc;best=i}});
  if(best<0)best=(cur+(d[0]+d[1]>0?1:-1)+els.length)%els.length;
  els[best].focus();
},true);

/* ---------- 音のON/OFF・全画面 ---------- */
let volBefore=S.settings.vol||2;
$('btnSound').addEventListener('click',()=>{S.audio();if(S.settings.vol>0){volBefore=S.settings.vol;S.settings.vol=0}else S.settings.vol=volBefore||2;S.saveSettings();S.applyAudio();syncSound();S.sfx.blip()});
function syncSound(){const b=$('btnSound'),on=S.settings.vol>0;b.classList.toggle('off',!on);b.setAttribute('aria-pressed',String(on));const l=on?'音：オン（押すと消音）':'音：オフ（押すとオン）';b.setAttribute('aria-label',l);b.title=l}
S.syncSound=syncSound;
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const bf=$('btnFull'),root=document.documentElement;
if(!(root.requestFullscreen||root.webkitRequestFullscreen))bf.hidden=true;
const lockLand=()=>{try{const o=screen.orientation;if(S.TOUCH&&o&&o.lock){const p=o.lock('landscape');if(p&&p.catch)p.catch(()=>{})}}catch(e){}};
const goFull=()=>{try{const f=root.requestFullscreen||root.webkitRequestFullscreen;if(!f)return;const r=f.call(root,{navigationUI:'hide'});if(r&&r.then)r.then(lockLand,()=>{});else lockLand()}catch(e){}};
bf.addEventListener('click',()=>{try{if(fsEl())(document.exitFullscreen||document.webkitExitFullscreen).call(document);else goFull()}catch(e){}});
/* スマートフォン：最初にボタンを押したとき、全画面＋横向き固定にする（ブラウザのバーで画面がせまくならないように） */
if(S.TOUCH){let asked=false;document.addEventListener('click',e=>{if(asked||fsEl()||!e.target.closest||!e.target.closest('button'))return;if(e.target.closest('#btnFull'))return;asked=true;goFull()},true)}
window.addEventListener('pointerdown',()=>S.audio(),{once:true});
window.addEventListener('keydown',()=>S.audio(),{once:true});
syncSound();hudButtons();hudStars();

/* ---------- イベントモード（展示会・説明会用）：放置されたらタイトルへ ---------- */
const IDLE_WARN=90,IDLE_OUT=110;
function idleCheck(){
  const el=$('idle');
  if(!S.settings.event){if(!el.hidden)el.hidden=true;return}
  if(S.vlogPlaying&&S.vlogPlaying())S.touchInput(); /* Vlog を再生しているあいだは「操作なし」にしない */
  const s=S.idleSec(),busyHere=S.running||!S.atTitle;
  if(!busyHere){el.hidden=true;const i=$('pname');if(s>IDLE_WARN&&i&&i.value){i.value='';S.playerName=''}return}
  if(s>=IDLE_OUT){el.hidden=true;S.touchInput();S.playerName='';S.lastRun=null;if(S.running)S.abortFlow('TITLE');else S.showTitle();return}
  if(s>=IDLE_WARN){el.hidden=false;S.setText('idleN',String(Math.ceil(IDLE_OUT-s)))}
  else if(!el.hidden)el.hidden=true;
}

/* ---------- メインループ ---------- */
let last=performance.now(),Tm=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;Tm+=dt;
  S.dlgUpdate(dt);
  const ctx=S.ctx;S.setCtx(ctx);ctx.setTransform(S.SC,0,0,S.SC,0,0);ctx.imageSmoothingEnabled=true;
  const sc=S.scene;
  if(sc){if(sc.update&&!S.busy())sc.update(dt);sc.draw(Tm);S.setCtx(ctx);ctx.setTransform(S.SC,0,0,S.SC,0,0)}
  S.tutDraw(Tm);idleCheck();
  requestAnimationFrame(frame);
}
S.voiceProbe();
S.showTitle();
requestAnimationFrame(frame);
document.body.classList.add('ready');
if(/[?&]debug\b/.test(location.search))window.__sanyuDebug={get scene(){return S.scene},S,
  finish:()=>{S.STAGES.forEach((s,i)=>results[s.id]={clear:i!==4,stars:i!==4?1+i%3:0,used:20+i*7,miss:i%3});const J=D.JOBS.mech;
    S.lastRun={entry:{name:S.playerName||'ゲスト',stars:starSum(),clears:clearSum(),time:timeSum(),title:titleOf(starSum()),job:J.n,id:'x'},pos:1,results:JSON.parse(JSON.stringify(results)),job:J,date:new Date()};S.showFinal()}};
})();
