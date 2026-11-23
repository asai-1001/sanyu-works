/* =====================================================================
   三友ワークス Ver. 2.3 — タイトルとメニュー画面（スクロールせずに画面の中で切りかえ）
   タイトル／作業えらび／職種カード／技術ずかん／ランキング／遊び方／設定／
   クレジット／スタッフメニュー（アンケートの集計と書き出し）
   Ver. 2.2：職種カードに社員紹介（インタビュー・一日のスケジュール・Vlog）を追加。中身は js/staff.js
   Ver. 2.3：アンケートの CSV に「感想」の列（計算式にならない対策つき）、スタッフメニューに新しい感想を5件まで表示
   ===================================================================== */
(()=>{
'use strict';
const S=SW,D=S.DATA,esc=S.esc;
const CARD_BY=Object.fromEntries(D.CARDS.map(c=>[c.id,c]));
const MEMO_BY=Object.fromEntries(D.MEMOS.map((m,i)=>[m.id,Object.assign({i},m)]));
S.CARD_BY=CARD_BY;S.MEMO_BY=MEMO_BY;
S.playerName='';S.atTitle=true;

S.unlock=(kind,id)=>{const a=S.store.get(kind,[]);if(!a.includes(id)){a.push(id);S.store.set(kind,a);return true}return false};
const owned=kind=>new Set(S.store.get(kind,[]));

function back(){return '<button type="button" class="btn ghost back" data-a="title">← タイトルへ</button>'}
function wireBack(p){p.querySelectorAll('[data-a="title"]').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();S.showTitle()}))
  /* Ver. 2.9.4 試作：空の画面の「名前を入れて一日コースへ」ボタン → タイトルの名前の欄へ */
  p.querySelectorAll('[data-a="course"]').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();S.showTitle();S.focusSoon(document.getElementById('pname'))}))}
/* Ver. 2.9.4 試作：まだ何も持っていないときに、どこで手に入るかを見せる */
function collectGuide(kind,got,head){
  const rows=D.DEPTS.map(d=>[d.name+'をクリア',d[kind]||[]]).concat([['一日コースを最後まで遊ぶ',kind==='cards'?D.END_CARDS:D.END_MEMOS]]).filter(r=>r[1].length);
  return `<div class="guide"><img src="${S.asset('img/sanpopo.png')}" alt=""><p class="guide-h">${head}</p>
    <ul class="guide-list">${rows.map(([l,ids])=>`<li><span>${esc(l)}</span><b>${ids.filter(i=>got.has(i)).length} / ${ids.length}</b></li>`).join('')}</ul>
    <button type="button" class="btn" data-a="course">名前を入れて一日コースへ</button></div>`}
/* タイトルとメニューの背景：会社の前の風景＋立体のさんぽぽ */
const titleScene={show3d:false,draw(t){S.gateScene.draw(t);if(this.show3d&&S.G3.ok)S.Sanpo.draw(S.getCtx(),26,96,92,78,{yaw:t*.8})}};
function idle(){if(S.setMascot)S.setMascot(null);titleScene.show3d=false;S.scene=titleScene;S.atTitle=false;S.setControls([]);S.setTimer(null);S.setTag('');S.hideToast();S.setSteps(null);S.bgm('title');S.fadeIn();S.cv.style.cursor='default'}
/* ファイルとして保存（CSVなど） */
function download(name,text,type){try{const b=new Blob([text],{type:type||'text/plain'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);return true}catch(e){return false}}

/* ---------- タイトル ---------- */
S.showTitle=function(){
  idle();titleScene.show3d=true;S.atTitle=true;S.gateScene.evening=false;S.setClock('AM 08:25');S.setPlace('三友製作所');
  S.setHint('名前を入れて「一日コースで遊ぶ」でスタート。矢印キーでえらんで Enter でも操作できます。');
  const nCard=owned('cards').size,nMemo=owned('memos').size,co=D.COMPANY||{};
  const p=S.panel(`<div class="title-grid">
    <div class="title-l">
      <p class="brand">${esc(co.name||'株式会社三友製作所')}<span>ものづくり体験ゲーム</span></p>
      <h1 class="logo"><span>三友</span>ワークス</h1>
      <p class="tagline">新人として、さんぽぽを設計から出荷まで作ろう</p>
      <ol class="route">${D.DEPTS.map(d=>`<li>${esc(d.name)}</li>`).join('')}<li>出荷</li></ol>
      ${S.G3.ok?'<span class="title-3d" aria-hidden="true"></span>':'<img class="title-mascot" src="'+S.asset('img/sanpopo.png')+'" alt="案内係のさんぽぽ">'}
    </div>
    <div class="title-r">
      <label class="lbl" for="pname">あなたの名前（ランキングと修了証に使います・8文字まで）</label>
      <input id="pname" maxlength="8" autocomplete="off" placeholder="ゲスト" value="${esc(S.playerName)}">
      <button type="button" class="btn start" id="go">一日コースで遊ぶ<small>3部門・${S.STAGES.length}つの作業　約10分</small></button>
      <button type="button" class="btn ghost" id="pick">作業をえらんで練習する</button>
      <div class="menu">
        <button type="button" class="mbtn" data-go="book"><b>職種カード</b><small>${nCard} / ${D.CARDS.length}</small></button>
        <button type="button" class="mbtn" data-go="zukan"><b>技術ずかん</b><small>${nMemo} / ${D.MEMOS.length}</small></button>
        <button type="button" class="mbtn" data-go="rank"><b>ランキング</b><small>TOP 10</small></button>
        <button type="button" class="mbtn" data-go="howto"><b>遊び方</b></button>
        <button type="button" class="mbtn" data-go="settings"><b>設定</b></button>
        <button type="button" class="mbtn" data-go="credits"><b>クレジット</b></button>
      </div>
    </div></div>
    <p class="ver">Ver. ${esc(S.VERSION||'')}${S.settings.event?'　イベントモード':''}</p>
    ${D.VOICE_READY&&D.VOICE_CREDIT?`<p class="vcredit">さんぽぽの声　${esc(D.VOICE_CREDIT)}</p>`:''}`,'title');
  const nameOf=()=>{S.playerName=(p.querySelector('#pname').value||'').trim().slice(0,8)};
  const go=()=>{nameOf();S.audio();S.sfx.ok();S.closePanel();S.startCourse()};
  p.querySelector('#go').addEventListener('click',go);
  p.querySelector('#pname').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&e.keyCode!==229){e.preventDefault();go()}});
  p.querySelector('#pick').addEventListener('click',()=>{nameOf();S.audio();S.sfx.blip();S.showPicker()});
  p.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{nameOf();S.audio();S.sfx.blip();({book:S.showBook,zukan:S.showZukan,rank:S.showRanking,howto:S.showHowto,settings:S.showSettings,credits:S.showCredits})[b.dataset.go]()}));
  S.focusSoon(p.querySelector('#go'));
};

/* ---------- 作業をえらぶ ---------- */
S.showPicker=function(){
  idle();const best=S.store.get('best',{});
  S.setHint('練習したい作業をえらんでください。自己ベスト（★と時間）が記録されます。（矢印キーでえらんで Enter）');
  const p=S.panel(`<div class="pin">
    <div class="phead">${back()}<h2>作業をえらんで練習</h2><span class="count">練習はランキングに記録されません</span></div>
    <div class="pick3">${D.DEPTS.map(d=>`<section><h3>${esc(d.name)}</h3>${S.STAGES.map((s,i)=>s.dept!==d.id?'':`<button type="button" class="opt" data-i="${i}"><span class="num">作業 ${i+1}　制限 ${s.limit}秒</span><b>${esc(s.name)}</b><span class="best">${best[s.id]?`自己ベスト <i class="st">${S.starStr(best[s.id].stars)}</i><b>${best[s.id].used.toFixed(1)}秒</b>`:'まだ記録なし'}</span></button>`).join('')}</section>`).join('')}</div></div>`,'pmenu');
  wireBack(p);
  p.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>{S.sfx.ok();S.closePanel();S.practice(S.STAGES[+b.dataset.i])}));
  S.focusSoon(p.querySelector('.opt'));
};

/* ---------- 社員紹介（中身は js/staff.js） ---------- */
const STAFF=(()=>{
  const src=Array.isArray(D.STAFF)?D.STAFF:[],seen=new Set(),out=[];
  if(!Array.isArray(D.STAFF))console.warn('[三友ワークス] js/staff.js が読みこめませんでした。社員紹介は「準備中」と表示します。');
  const str=v=>v==null?'':String(v).trim();
  src.forEach((s,n)=>{
    if(!s||typeof s!=='object'||s.hidden===true)return;
    const id=str(s.id)||('staff'+(n+1));
    if(!CARD_BY[s.job]){console.warn('[三友ワークス] staff.js：'+id+' の job「'+s.job+'」という職種カードはありません');return}
    if(seen.has(id))console.warn('[三友ワークス] staff.js：id「'+id+'」が重なっています');seen.add(id);
    out.push({id,job:s.job,initial:str(s.initial),dept:str(s.dept),role:str(s.role),joined:parseInt(s.joined,10)||0,
      interview:(Array.isArray(s.interview)?s.interview:[]).filter(x=>x&&(str(x.q)||str(x.a))).map(x=>({q:str(x.q),a:str(x.a)})),
      schedule:(Array.isArray(s.schedule)?s.schedule:[]).filter(x=>x&&(str(x.time)||str(x.text))).map(x=>({time:str(x.time),text:str(x.text)})),
      vlog:s.vlog==null?id+'.mp4':str(s.vlog)});
  });
  return out;
})();
S.STAFF=STAFF;
const staffOf=job=>STAFF.filter(s=>s.job===job);
const staffName=s=>(s.initial||'社員')+'さん';
const vlogSrc=f=>'movie/'+f.split('/').map(encodeURIComponent).join('/');
/* Vlog の動画ファイルがあるかを調べる（ok / none / 未確認） */
const vlogState=new Map();
function probeVlog(file,cb){
  if(!file){cb('none');return}
  try{const v=document.createElement('video');v.preload='metadata';v.muted=true;let done=false;
    const fin=r=>{if(done)return;done=true;vlogState.set(file,r);v.removeAttribute('src');try{v.load()}catch(_){}cb(r)};
    v.addEventListener('loadedmetadata',()=>fin('ok'),{once:true});
    v.addEventListener('error',()=>fin('none'),{once:true});
    v.src=vlogSrc(file);
  }catch(e){cb('none')}
}

/* ---------- 職種カード ----------
   opt：{tab:'job'|'talk'|'day'|'vlog', who:何人目, q:何問目, focus:最初にえらぶボタン} */
const TABS=[['job','仕事内容'],['talk','インタビュー'],['day','一日のスケジュール'],['vlog','Vlog']];
let bookTab='job';
S.showBook=function(sel,fromFinal,opt){
  idle();const got=owned('cards');opt=opt||{};
  S.setHint('部門をクリアすると、その部門の職種カードがもらえます。「インタビュー」「一日のスケジュール」「Vlog」で、その職種の社員を紹介しています。');
  if(!sel||!got.has(sel))sel=D.CARDS.find(c=>got.has(c.id))?.id||null;
  if(opt.tab)bookTab=opt.tab;if(!TABS.some(t=>t[0]===bookTab))bookTab='job';
  const c=sel?CARD_BY[sel]:null,people=c?staffOf(c.id):[];
  const who=Math.min(Math.max(0,opt.who|0),Math.max(0,people.length-1)),st=people[who]||null;
  const how={mech:'設計開発部門',elec:'設計開発部門',operator:'機械加工部門',finish:'機械加工部門',inspector:'機械加工部門',assembler:'組立調整部門',pm:'組立調整部門',se:'一日コース',soumu:'一日コース'};
  let body='',qi=0;
  if(c&&bookTab==='job'){
    body=`<p class="zone">${esc(c.work)}</p><ul class="zpts">${c.pts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
     <p class="fine">ゲームで体験した作業：${esc(c.game)}</p><p class="fine">出典：会社の募集職種の資料</p>`;
  }else if(c&&!st){
    body=`<div class="empty">この職種の社員紹介は<br>準備中です。</div>`;
  }else if(c){
    const pick=people.length>1?`<div class="chips who" role="group" aria-label="紹介する社員">${people.map((p,i)=>`<button type="button" class="chip${i===who?' on':''}" data-who="${i}" aria-pressed="${i===who}">${esc(staffName(p))}</button>`).join('')}</div>`:'';
    const head=`<div class="shead"><span class="sini" aria-hidden="true">${esc(st.initial||'？')}</span><div><p>${esc([st.dept,st.role].filter(Boolean).join('　'))}</p><p class="sname">${st.joined?esc(st.joined+'年入社')+'　':''}<b>${esc(staffName(st))}</b></p></div></div>`;
    let sec='';
    if(bookTab==='talk'){
      const n=st.interview.length;qi=Math.min(Math.max(0,opt.q|0),Math.max(0,n-1));
      sec=!n?`<div class="empty">インタビューは準備中です。</div>`:
        `<div class="qa1"><p class="qno">Q${qi+1}<small> / ${n}</small></p><h4>${esc(st.interview[qi].q)}</h4><p class="ans">${esc(st.interview[qi].a||'（準備中です）')}</p></div>
         ${n>1?`<div class="qnav"><button type="button" class="btn ghost" data-q="${qi-1}"${qi<=0?' disabled':''}>◀ 前の質問</button><button type="button" class="btn ghost" data-q="${qi+1}"${qi>=n-1?' disabled':''}>次の質問 ▶</button></div>`:''}`;
    }else if(bookTab==='day'){
      sec=!st.schedule.length?`<div class="empty">一日のスケジュールは準備中です。</div>`:
        `<ol class="sched day${st.schedule.length>6?' two':''}"${st.schedule.length>6?` style="grid-template-rows:repeat(${Math.ceil(st.schedule.length/2)},auto)"`:''}>${st.schedule.map(x=>`<li><time>${esc(x.time)}</time><span>${esc(x.text)}</span></li>`).join('')}</ol>`;
    }else{
      const stt=st.vlog?vlogState.get(st.vlog):'none';
      sec=`<div class="vbox${stt==='none'?' none':''}" data-vfile="${esc(st.vlog)}">${stt==='none'
        ?`<p class="vsoon">Vlogは準備中です。</p>`
        :`<button type="button" class="btn vplay" data-a="vlog"><span aria-hidden="true">▶</span> ${esc(staffName(st))}のVlogを見る</button><p class="fine vmsg">${esc(staffName(st))}の仕事や一日を、動画で紹介します。</p>`}</div>`;
    }
    body=pick+head+`<div class="ssec">${sec}</div>`;
  }
  const detail=!c?collectGuide('cards',got,'職種カードは、一日コースで部門をクリアするともらえるよ。'):
    `<div class="dhead"><span class="jobno big">${String(c.no).padStart(2,'0')}</span><div><h3>${esc(c.name)}</h3><p class="sub">${esc(c.dept)}${people.length?`<span class="sbadge">社員紹介 ${people.length}人</span>`:''}</p></div></div>
     <div class="tabs" role="group" aria-label="表示する内容">${TABS.map(([k,l])=>`<button type="button" class="tab" data-tab="${k}" aria-pressed="${k===bookTab}">${l}</button>`).join('')}</div>
     <div class="dbody">${body}</div>`;
  const bk=fromFinal&&S.lastRun?'<button type="button" class="btn ghost back" data-a="final">← 成績へもどる</button>':back();
  const p=S.panel(`<div class="pin">
    <div class="phead">${bk}<h2>職種カード</h2><span class="count">${got.size} / ${D.CARDS.length}</span></div>
    <div class="split">
      <div class="cards">${D.CARDS.map(k=>got.has(k.id)
        ?`<button type="button" class="card" data-id="${k.id}" aria-pressed="${k.id===sel}"><span class="jobno">${String(k.no).padStart(2,'0')}</span><span><b>${esc(k.name)}</b><small>${esc(k.dept)}${staffOf(k.id).length?'<i class="hasstaff">社員紹介</i>':''}</small></span></button>`
        :`<div class="card locked"><span class="lockbox">?</span><span><b>？？？</b><small>${how[k.id]}をクリア</small></span></div>`).join('')}</div>
      <div class="detail">${detail}</div>
    </div></div>`,'pmenu');
  const again=o=>S.showBook(sel,fromFinal,Object.assign({who},o));
  wireBack(p);const f=p.querySelector('[data-a="final"]');if(f)f.addEventListener('click',()=>{S.sfx.blip();S.showFinal()});
  p.querySelectorAll('.card[data-id]').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();S.showBook(b.dataset.id,fromFinal,{focus:'.card[data-id="'+b.dataset.id+'"]'})}));
  p.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();again({tab:b.dataset.tab,focus:'[data-tab="'+b.dataset.tab+'"]'})}));
  p.querySelectorAll('[data-who]').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();again({who:+b.dataset.who,focus:'[data-who="'+b.dataset.who+'"]'})}));
  p.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();const q=+b.dataset.q,fw=q>qi?1:-1;again({q,focus:['[data-q="'+(q+fw)+'"]:not(:disabled)','[data-q="'+(q-fw)+'"]']})}));
  const vb=p.querySelector('[data-a="vlog"]');
  if(vb)vb.addEventListener('click',()=>{S.sfx.blip();S.showVlog(st,()=>S.showBook(sel,fromFinal,{tab:'vlog',who,focus:['[data-a="vlog"]','[data-tab="vlog"]']}))});
  /* Vlog タブ：動画ファイルがあるかを確かめて、なければ「準備中です」に切りかえる */
  const box=p.querySelector('.vbox[data-vfile]');
  if(box&&st&&st.vlog)probeVlog(st.vlog,r=>{if(!box.isConnected)return;
    if(r==='none'&&!box.classList.contains('none')){const had=document.activeElement===vb;box.classList.add('none');box.innerHTML='<p class="vsoon">Vlogは準備中です。</p>';if(had)S.focusSoon(p.querySelector('[data-tab="vlog"]'))}});
  const pickF=()=>{for(const q of [].concat(opt.focus||[])){const e=p.querySelector(q);if(e)return e}return null};
  S.focusSoon(pickF()||p.querySelector('.card[aria-pressed="true"]')||p.querySelector('.back'));
};

/* ---------- Vlog を見る（movie フォルダの動画） ----------
   キーボード：Enter で再生／一時停止のボタン、←→ でシークバー、Esc でもどる */
S.vlogStop=null;
S.showVlog=function(st,onBack){
  idle();
  S.setHint('動画をクリックするか「再生」で再生／一時停止。Esc か「もどる」で職種カードにもどります。');
  const name=staffName(st);
  const p=S.panel(`<div class="pin vlog">
    <div class="phead"><button type="button" class="btn ghost back" data-a="vback">← もどる</button><h2>${esc(name)}のVlog</h2><span class="count">${esc([st.dept,st.role].filter(Boolean).join('　'))}</span></div>
    <div class="vstage"><video playsinline preload="auto"></video>
      <div class="vover" data-s="load"><p>読みこみ中…</p></div></div>
    <div class="vbar">
      <button type="button" class="btn vpp" data-a="pp" disabled>▶ 再生</button>
      <button type="button" class="btn ghost" data-a="rw" disabled>◀◀ 10秒</button>
      <button type="button" class="btn ghost" data-a="ff" disabled>10秒 ▶▶</button>
      <input type="range" class="vseek" min="0" max="1000" value="0" step="1" aria-label="再生位置" disabled>
      <span class="vtime">0:00 / 0:00</span>
    </div></div>`,'pmenu');
  S.bgmHold(true);
  const v=p.querySelector('video'),ov=p.querySelector('.vover'),pp=p.querySelector('[data-a="pp"]'),seek=p.querySelector('.vseek'),tm=p.querySelector('.vtime');
  const ctl=[...p.querySelectorAll('.vbar button,.vbar input')];
  const fmt=t=>{t=Math.max(0,Math.floor(t||0));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
  const vol=()=>{const n=S.volNow?S.volNow():1;v.volume=Math.min(1,Math.max(0,n));v.muted=n<=0};
  const sync=()=>{const d=v.duration||0;pp.textContent=v.paused?'▶ 再生':'❚❚ 一時停止';tm.textContent=fmt(v.currentTime)+' / '+fmt(d);if(!seeking&&d)seek.value=String(Math.round(v.currentTime/d*1000))};
  let seeking=false,alive=true;
  const toggle=()=>{if(v.readyState<1)return;if(v.paused||v.ended){vol();const r=v.play();if(r&&r.catch)r.catch(()=>{})}else v.pause()};
  const soon=()=>{alive=false;v.pause();ov.dataset.s='none';ov.innerHTML='<p class="vsoon">Vlogは準備中です。</p><p class="fine">動画のファイルが、まだ入っていません。</p>';ov.hidden=false;ctl.forEach(x=>x.disabled=true);vlogState.set(st.vlog,'none');S.focusSoon(p.querySelector('[data-a="vback"]'))};
  v.addEventListener('loadedmetadata',()=>{vlogState.set(st.vlog,'ok');ov.hidden=true;ctl.forEach(x=>x.disabled=false);sync();S.focusSoon(pp)});
  v.addEventListener('error',soon);
  ['play','pause','timeupdate','ended','durationchange'].forEach(ev=>v.addEventListener(ev,sync));
  v.addEventListener('click',()=>{S.sfx.blip();toggle()});
  pp.addEventListener('click',toggle);
  p.querySelector('[data-a="rw"]').addEventListener('click',()=>{v.currentTime=Math.max(0,v.currentTime-10);sync()});
  p.querySelector('[data-a="ff"]').addEventListener('click',()=>{v.currentTime=Math.min(v.duration||0,v.currentTime+10);sync()});
  seek.addEventListener('input',()=>{seeking=true;const d=v.duration||0;if(d)v.currentTime=d*seek.value/1000;tm.textContent=fmt(v.currentTime)+' / '+fmt(d)});
  seek.addEventListener('change',()=>{seeking=false;sync()});
  const goBack=()=>{S.sfx.blip();onBack()};
  p.querySelector('[data-a="vback"]').addEventListener('click',goBack);
  S.vlogBack=goBack;
  S.vlogPlaying=()=>alive&&!v.paused&&!v.ended;
  S.onAudioChange=vol;
  S.vlogStop=()=>{S.vlogStop=null;S.vlogBack=null;S.vlogPlaying=null;S.onAudioChange=null;alive=false;try{v.pause();v.removeAttribute('src');v.load()}catch(_){}S.bgmHold(false)};
  if(!st.vlog){soon();return}
  vol();v.src=vlogSrc(st.vlog);
  S.focusSoon(p.querySelector('[data-a="vback"]'));
};

/* ---------- 技術ずかん ---------- */
function memoTile(m,on,selId){return on
  ?`<button type="button" class="ztile" data-id="${m.id}" aria-pressed="${m.id===selId}"><span class="zi">${D.ICONS[m.icon]||''}</span><span class="zb">${esc(m.big)}<small>${esc(m.unit)}</small></span><span class="zt">${esc(m.title)}</span></button>`
  :`<div class="ztile locked"><span class="zi">?</span><span class="zt">？？？</span></div>`}
S.memoCard=m=>`<div class="zcard"><div class="zcard-top"><span class="zi big">${D.ICONS[m.icon]||''}</span><div><p class="zbig">${esc(m.big)}<small>${esc(m.unit)}</small></p><h3>${esc(m.title)}</h3></div></div>
  <p class="zone">${esc(m.one)}</p><ul class="zpts">${m.points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="fine">出典：${esc(m.src)}</p></div>`;
S.showZukan=function(sel){
  idle();const got=owned('memos');
  S.setHint('三友製作所の技術と設備を、数字で紹介するずかんです。部門をクリアすると増えていきます。');
  if(!sel||!got.has(sel))sel=D.MEMOS.find(m=>got.has(m.id))?.id||null;
  const m=sel?MEMO_BY[sel]:null;
  const p=S.panel(`<div class="pin">
    <div class="phead">${back()}<h2>技術ずかん</h2><span class="count">${got.size} / ${D.MEMOS.length}</span></div>
    <div class="split">
      <div class="zgrid">${D.MEMOS.map(x=>memoTile(x,got.has(x.id),sel)).join('')}</div>
      <div class="detail">${m?S.memoCard(m):collectGuide('memos',got,'技術ずかんは、一日コースで部門をクリアするたびに、ページが増えていくよ。')}</div>
    </div></div>`,'pmenu');
  wireBack(p);
  p.querySelectorAll('.ztile[data-id]').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();S.showZukan(b.dataset.id)}));
  S.focusSoon(p.querySelector('.ztile[aria-pressed="true"]')||p.querySelector('.back'));
};

/* ---------- ランキング ---------- */
S.showRanking=function(hl){
  idle();const list=S.store.get('rank',[]).slice(0,10);
  S.setHint('一日コースを最後まで遊ぶと、ここに記録されます。★が多い順、同じなら作業時間が短い順です。');
  const bk=S.lastRun&&hl?'<button type="button" class="btn ghost back" data-a="final">← 成績へもどる</button>':back();
  const p=S.panel(`<div class="pin">
    <div class="phead">${bk}<h2>ランキング</h2><span class="count">この端末の一日コース（★ ${S.STAGES.length*3} が満点）</span></div>
    ${list.length?`<div class="tablebox"><table><thead><tr><th>順位</th><th>なまえ</th><th class="num">★</th><th class="num">クリア</th><th class="num">作業時間</th><th>称号</th><th>適職診断</th><th>日付</th></tr></thead><tbody>${
      list.map((e,i)=>`<tr${e.id===hl?' class="me"':''}><td class="pos">${i<3?`<span class="medal m${i+1}">${i+1}</span>`:i+1}</td><td>${esc(e.name)}</td><td class="num">${e.stars}</td><td class="num">${e.clears} / ${S.STAGES.length}</td><td class="num">${e.time} 秒</td><td>${esc(e.title||'')}</td><td>${esc(e.job||'')}</td><td>${esc(e.date||'')}</td></tr>`).join('')}</tbody></table></div>`
      :`<div class="guide"><img src="${S.asset('img/sanpopo.png')}" alt=""><p class="guide-h">まだ記録がありません。一日コースを最後まで遊ぶと、ここにのります。</p><p class="guide-s">★が多い順。同じなら、作業時間が短い順です。</p><button type="button" class="btn" data-a="course">名前を入れて一日コースへ</button></div>`}</div>`,'pmenu');
  wireBack(p);
  const f=p.querySelector('[data-a="final"]');if(f)f.addEventListener('click',()=>{S.sfx.blip();S.showFinal()});
  S.focusSoon(p.querySelector('.back'));
};

/* ---------- 遊び方 ---------- */
S.showHowto=function(){
  idle();S.setHint('困ったときは、右上の「？」と「‖」を押してください。');
  const p=S.panel(`<div class="pin">
    <div class="phead">${back()}<h2>遊び方</h2></div>
    <div class="how">
      <section><h3>すすめ方</h3><ol><li>さんぽぽを1つ、設計から出荷まで作る</li><li>部門は3つ。設計開発 → 機械加工 → 組立調整</li><li>それぞれの部門の最後に「検査」がある</li><li>作業は制限時間内に終わらせればクリア</li><li>ミスが少なく、早いほど★が増える（最大3つ）</li><li>最後に適職診断とアンケート、修了証</li></ol></section>
      <section><h3>操作</h3><ul><li class="kbd"><b>キーボード</b>：矢印キーでえらぶ、Enter（または Space）で決定</li><li class="kbd">数字キーで、番号のついたボタンを直接えらべる</li><li><b>マウス・タッチ</b>：画面のボタンをクリック（タップ）</li><li class="tch">ドラッグは指でなぞる。CADの拡大は2本の指で広げる</li><li class="kbd">「押しつづける」は、Enter か Space を押しつづけてもOK</li><li>会話は<span class="kbd"> Enter か、</span>画面のクリック（タップ）で進む</li></ul></section>
      <section><h3>困ったとき</h3><ul><li><b>？</b>：その作業の操作をもう一度見る</li><li><b>‖</b><span class="kbd">（Esc キー）</span>：一時停止・やり直し・タイトルへ</li><li>チュートリアルと一時停止のあいだ、時間は止まる</li><li>スピーカーのボタンで音を消せる</li><li>四角い矢印のボタンで全画面にできる</li></ul></section>
    </div></div>`,'pmenu');
  wireBack(p);S.focusSoon(p.querySelector('.back'));
};

/* ---------- 設定 ---------- */
S.showSettings=function(){
  idle();const st=S.settings;S.setHint('設定はこの端末に保存されます。');
  const tg=(k,v,l)=>`<button type="button" class="chip${st[k]===v?' on':''}" data-k="${k}" data-v="${String(v)}">${l}</button>`;
  const total=D.VOICE_ORDER.length,have=S.voiceCount();
  const vc=D.VOICE_CREDIT?'　'+D.VOICE_CREDIT:'';
  const vnote=!D.VOICE_READY?'音声ファイルを入れると話します':have>=total?vc.trim():`収録ずみ ${have} / ${total}（そろっている場面だけ話します）${vc}`;
  const p=S.panel(`<div class="pin">
    <div class="phead">${back()}<h2>設定</h2><span class="count">Ver. ${esc(S.VERSION||'')}</span></div>
    <div class="settings">
      <div class="srow"><span>音量</span><div class="chips">${tg('vol',0,'消音')}${tg('vol',1,'小')}${tg('vol',2,'中')}${tg('vol',3,'大')}</div></div>
      <div class="srow"><span>BGM</span><div class="chips">${tg('bgm',true,'ON')}${tg('bgm',false,'OFF')}</div></div>
      <div class="srow"><span>効果音</span><div class="chips">${tg('sfx',true,'ON')}${tg('sfx',false,'OFF')}</div></div>
      <div class="srow"><span>さんぽぽの声${vnote?`<small>${vnote}</small>`:''}</span><div class="chips">${tg('voice',true,'ON')}${tg('voice',false,'OFF')}</div></div>
      <div class="srow"><span>チュートリアル</span><div class="chips">${tg('tut','ask','毎回たずねる')}${tg('tut','always','いつも見る')}${tg('tut','never','見ない')}</div></div>
      <div class="srow"><span>イベントモード<small>展示会・説明会用。90秒さわらないとタイトルにもどり、名前を消します</small></span><div class="chips">${tg('event',true,'ON')}${tg('event',false,'OFF')}</div></div>
      <div class="srow"><span>この端末の記録<small>ランキング・自己ベスト・職種カード・ずかん</small></span><div class="chips"><button type="button" class="chip danger" id="reset">リセット</button></div></div>
      <div class="srow"><span>スタッフメニュー<small>アンケートの集計と書き出し（社員の方向け）</small></span><div class="chips"><button type="button" class="chip hold" id="staff"><i></i>長押しで開く</button></div></div>
    </div></div>`,'pmenu');
  wireBack(p);
  p.querySelectorAll('.chip[data-k]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.k;let v=b.dataset.v;if(v==='true')v=true;else if(v==='false')v=false;else if(k==='vol')v=+v;st[k]=v;S.saveSettings();S.audio();S.applyAudio();S.syncSound();if(k==='voice'&&!v)S.voiceStop();S.sfx.blip();S.showSettings()}));
  let arm=0;const rb=p.querySelector('#reset');
  rb.addEventListener('click',()=>{if(Date.now()-arm<4000){['rank','best','cards','memos'].forEach(k=>S.store.del(k));rb.textContent='リセットしました';arm=0;S.sfx.ok();return}arm=Date.now();rb.textContent='もう一度押すと消えます';S.sfx.blip();setTimeout(()=>{if(arm&&Date.now()-arm>=3900)rb.textContent='リセット'},4000)});
  /* 来場者がまちがって開かないよう、1.2秒の長押しで開く */
  const sb=p.querySelector('#staff');let ht=0;
  const up=()=>{clearTimeout(ht);sb.classList.remove('holding')};
  sb.addEventListener('pointerdown',()=>{sb.classList.add('holding');ht=setTimeout(()=>{S.sfx.ok();S.showStaff()},1200)});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>sb.addEventListener(ev,up));
  sb.addEventListener('keydown',e=>{if(e.key==='Enter'){S.sfx.ok();S.showStaff()}});
  S.focusSoon(p.querySelector('.back'));
};

/* ---------- スタッフメニュー（アンケートの集計・CSV書き出し） ---------- */
function surveyCsv(list){
  const Q=S.SURVEY.questions,ids=S.STAGES.map(s=>s.id);
  const head=['回答ID','回答日時',...Q.map(q=>q.csv||q.q),'モード','★の合計','クリアした作業の数','作業時間の合計（秒）','適職診断','プレイ時間（秒）',...S.STAGES.map(s=>s.name+'の★（0は時間切れ）'),'バージョン'];
  /* Excel で開いたとき、「=」「+」「-」「@」などで始まる文が計算式として動かないように、先頭に ' を付ける（Ver. 2.3） */
  const safe=v=>typeof v==='string'&&/^[=+\-@\t\r]/.test(v)?"'"+v:v;
  const cell=v=>{v=v==null?'':String(safe(v));return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const rows=list.map(r=>{const g=r.game||{},sc=g.scores||{},a=r.answers||{};return[r.id,r.answeredAt,...Q.map(q=>a[q.id]),g.mode,g.total,g.clears,g.time,g.job,g.durationSec,...ids.map(k=>sc[k]),(r.client||{}).version]});
  return '﻿'+[head,...rows].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
}
S.surveyCsv=surveyCsv;
S.showStaff=function(){
  idle();S.setHint('アンケートの回答は、この端末のブラウザの中に保存されています。CSVはExcelでそのまま開けます。感想が長いときは PageUp / PageDown でスクロールできます。');
  S.surveyStore.list().then(list=>{
    const Q=S.SURVEY.questions,n=list.length;
    const scaleRows=Q.filter(q=>q.type==='scale').map(q=>{const v=list.map(r=>(r.answers||{})[q.id]).filter(x=>typeof x==='number');const avg=v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
      return `<div class="bar wide"><span>${esc(q.q)}</span><i><b style="width:${Math.round(avg/5*100)}%"></b></i><em>${v.length?avg.toFixed(2):'—'}</em></div>`}).join('');
    const single=Q.filter(q=>q.type==='single').map(q=>{const cnt={};list.forEach(r=>{const a=(r.answers||{})[q.id];if(a!=null)cnt[a]=(cnt[a]||0)+1});
      return `<div class="tally"><p class="get-k">${esc(q.q)}</p><p>${q.options.filter(o=>cnt[o]).map(o=>`${esc(o)} <b>${cnt[o]}</b>`).join('　／　')||'—'}</p></div>`}).join('');
    const scores=list.map(r=>(r.game||{}).total).filter(x=>typeof x==='number');
    /* 感想（Ver. 2.3）：新しい順に5件まで */
    const txtQ=Q.filter(q=>q.type==='text');
    const when=s=>{const d=new Date(s);return isNaN(d)?'':`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
    const comments=txtQ.map(q=>{const all=list.filter(r=>{const v=(r.answers||{})[q.id];return typeof v==='string'&&v.trim()}).sort((a,b)=>String(b.answeredAt||'').localeCompare(String(a.answeredAt||'')));
      return `<div class="tally"><p class="get-k">${esc(q.csv||q.q)}　<small>${all.length} 件${all.length>5?'（新しい5件を表示）':''}</small></p>${all.length?`<ul class="cmts">${all.slice(0,5).map(r=>`<li><time>${esc(when(r.answeredAt))}</time><p>${esc(r.answers[q.id])}</p></li>`).join('')}</ul>`:'<p>—</p>'}</div>`}).join('');
    const p=S.panel(`<div class="pin">
      <div class="phead"><button type="button" class="btn ghost back" data-a="set">← 設定へ</button><h2>スタッフメニュー</h2><span class="count">アンケート回答 ${n} 件${scores.length?`　★の平均 ${(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)}`:''}</span></div>
      <div class="split staff">
        <div class="detail"><p class="get-k">理解度（5点満点の平均）</p><div class="bars">${scaleRows}</div>${single}${comments}</div>
        <div class="detail">
          <p class="get-k">書き出し</p>
          <p class="sub">回答とゲームの成績を、1行1件のCSVファイルにします。名前は入っていません。</p>
          <div class="btnrow"><button type="button" class="btn" id="csv"${n?'':' disabled'}>CSVで書き出す（${n} 件）</button></div>
          <p class="get-k" style="margin-top:.8em">消去</p>
          <p class="sub">書き出したあとで消すと、次のイベントを0件から始められます。</p>
          <div class="btnrow"><button type="button" class="chip danger" id="clr"${n?'':' disabled'}>回答をすべて消す</button></div>
          <p class="fine">別の端末・別のブラウザの回答は、それぞれの端末で書き出してください。</p>
        </div>
      </div></div>`,'pmenu');
    p.querySelector('[data-a="set"]').addEventListener('click',()=>{S.sfx.blip();S.showSettings()});
    const d=new Date(),stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    p.querySelector('#csv').addEventListener('click',()=>{const ok=download(`三友ワークス_アンケート_${stamp}.csv`,surveyCsv(list),'text/csv');ok?S.sfx.ok():S.sfx.ng();S.setHint(ok?'CSVファイルを保存しました（ダウンロードフォルダを確認してください）。':'書き出しに失敗しました。別のブラウザでお試しください。')});
    let arm=0;const cb=p.querySelector('#clr');
    cb.addEventListener('click',()=>{if(Date.now()-arm<4000){S.surveyStore.clear().then(()=>{S.sfx.ok();S.showStaff()});return}arm=Date.now();cb.textContent='もう一度押すと消えます（元にもどせません）';S.sfx.blip();setTimeout(()=>{if(cb.isConnected&&Date.now()-arm>=3900)cb.textContent='回答をすべて消す'},4000)});
  });
};

/* ---------- クレジット ---------- */
S.showCredits=function(){
  idle();S.setHint('このゲームについて。');
  const rows=(D.CREDITS||[]).filter(r=>r[1]);
  const p=S.panel(`<div class="pin">
    <div class="phead">${back()}<h2>クレジット</h2><span class="count">三友ワークス　Ver. ${esc(S.VERSION||'')}</span></div>
    <div class="split credits">
      <div class="detail"><dl class="cred">${rows.map(r=>`<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl></div>
      <div class="detail"><p class="get-k">このゲームについて</p><ul class="zpts">${(D.NOTES||[]).map(n=>`<li>${esc(n)}</li>`).join('')}</ul>
        <p class="get-k" style="margin-top:.6em">保存されるデータ</p><p class="sub">ランキング・自己ベスト・職種カード・設定・アンケートの回答は、この端末のブラウザの中だけに保存されます。インターネットへは送信しません。</p></div>
    </div></div>`,'pmenu');
  wireBack(p);S.focusSoon(p.querySelector('.back'));
};
})();
