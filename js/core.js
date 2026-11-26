/* =====================================================================
   三友ワークス — 共通の仕組み（描画・音・BGM・会話・入力・画面サイズ）
   ===================================================================== */
(()=>{
'use strict';
const SW=window.SW={};
const W=320,H=180,TAU=Math.PI*2;
let SC=2; /* キャンバスの拡大率。fit() が画面の大きさと画素密度に合わせて決める */
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
let C=ctx;
const reduceMotion=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 端末内の保存（ランキング・カード・設定） ---------- */
const PFX='sanyuWorks4.';   /* Ver. 2.0 から保存の名前を変更（古い版の記録とまざらないように） */
/* スマートフォンでファイルを直接開いたときなど、端末に保存できないブラウザでは、
   遊んでいるあいだだけメモリに覚えておく（ページを閉じると消える）。 */
const MEM={};
const store={
  get(k,d){try{const v=localStorage.getItem(PFX+k);return v?JSON.parse(v):d}catch(e){return (PFX+k) in MEM?JSON.parse(MEM[PFX+k]):d}},
  set(k,v){const j=JSON.stringify(v);try{localStorage.setItem(PFX+k,j)}catch(e){MEM[PFX+k]=j}},
  del(k){try{localStorage.removeItem(PFX+k)}catch(e){delete MEM[PFX+k]}}
};
/* 画像・音声の場所。1ファイル版（sanyu_works_1file.html）では、ファイルの中に埋め込んだデータを使う */
const asset=p=>(window.SW_EMBED&&SW_EMBED[p])||p;
const settings=Object.assign({sfx:true,bgm:true,voice:true,vol:2,tut:'ask',event:false},store.get('settings',{}));
const saveSettings=()=>store.set('settings',settings);

/* ---------- 描画 ---------- */
function R(x,y,w,h,c){C.fillStyle=c;C.fillRect(x,y,w,h)}
function circ(x,y,r,c){C.fillStyle=c;C.beginPath();C.arc(x,y,Math.max(0,r),0,TAU);C.fill()}
function ring(x,y,r,c,dash,lw){C.strokeStyle=c;C.lineWidth=lw||.5;C.setLineDash(dash||[]);C.beginPath();C.arc(x,y,Math.max(0,r),0,TAU);C.stroke();C.setLineDash([])}
function line(x1,y1,x2,y2,c,lw,dash){C.strokeStyle=c;C.lineWidth=lw||.5;C.setLineDash(dash||[]);C.beginPath();C.moveTo(x1,y1);C.lineTo(x2,y2);C.stroke();C.setLineDash([])}
function box(x,y,w,h,c,lw){C.strokeStyle=c;C.lineWidth=lw||.5;C.setLineDash([]);C.strokeRect(x+.25,y+.25,w-.5,h-.5)}
const FF='"SWSans","Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif';
function jt(s,x,y,col,size,align){C.font=((size||7)>=8?'700 ':'')+(size||7)+'px '+FF;C.fillStyle=col;C.textAlign=align||'left';C.textBaseline='top';C.fillText(String(s),x,y)}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(x,y){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v)}
function triPath(x,y,a,s){const ux=Math.cos(a),uy=Math.sin(a),vx=-uy,vy=ux;s=s||1;C.beginPath();C.moveTo(x+ux*8*s,y+uy*8*s);C.lineTo(x-ux*5*s+vx*7*s,y-uy*5*s+vy*7*s);C.lineTo(x-ux*5*s-vx*7*s,y-uy*5*s-vy*7*s);C.closePath()}
function lamp(x,y,on,col,label,lc){circ(x,y,2.6,on?col:'#4b525a');ring(x,y,2.6,'#20252b',null,.5);if(label)jt(label,x+5,y-3,lc||'#2a3038',5.5)}
function avatar(hair,shirt,style){
  const c=document.createElement('canvas');c.width=c.height=12;const g=c.getContext('2d');
  const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};const skin='#efc6a0';
  P(0,0,12,12,'#232a31');P(2,8,8,4,shirt);P(5,8,2,1,skin);P(3,2,6,6,skin);
  P(3,1,6,2,hair);P(2,2,1,style===1?5:3,hair);P(9,2,1,style===1?5:3,hair);
  if(style===2)P(3,0,6,1,hair);
  P(4,4,1,1,'#222');P(7,4,1,1,'#222');P(5,6,2,1,'#c06a5a');
  if(style===3){P(3,4,2,1,'#333');P(7,4,2,1,'#333');P(5,4,2,1,'#555')}
  return c.toDataURL();
}
const SANPO=new Image();SANPO.src=(window.SW_ASSETS&&SW_ASSETS.sanpopo)||asset('img/sanpopo.png');

/* ---------- 音（効果音・BGM・さんぽぽの声） ----------
   すべて master（全体の音量）を通る。効果音は sfxOut、BGM は bgmOut へ。 */
let actx=null,noiseBuf=null,master=null,sfxOut=null,bgmOut=null;
const VOLS=[0,.35,.7,1];
const volNow=()=>VOLS[clamp(settings.vol|0,0,3)];
function audio(){
  if(!actx){try{actx=new(window.AudioContext||window.webkitAudioContext)();
    master=actx.createGain();master.gain.value=volNow();master.connect(actx.destination);
    sfxOut=actx.createGain();sfxOut.gain.value=1;sfxOut.connect(master);
    const lp=actx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;lp.connect(master);
    bgmOut=actx.createGain();bgmOut.gain.value=settings.bgm?1:0;bgmOut.connect(lp);
  }catch(e){actx=null}}
  if(actx&&actx.state==='suspended')actx.resume().catch(()=>{});return actx}
function applyAudio(){if(SW.onAudioChange)try{SW.onAudioChange()}catch(e){}
  if(!actx)return;const t=actx.currentTime;master.gain.setTargetAtTime(volNow(),t,.05);bgmOut.gain.setTargetAtTime(settings.bgm&&!bgmHeld?bgmDuck:0,t,.15);if(vA)vA.volume=volNow()}
function tone(f,d,type,v,slide){if(!settings.sfx)return;const a=audio();if(!a)return;d=d||.08;const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.linearRampToValueAtTime(f+slide,t+d);g.gain.setValueAtTime(v||.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(sfxOut);o.start(t);o.stop(t+d+.02)}
function noise(d,v,freq){if(!settings.sfx)return;const a=audio();if(!a)return;if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*.5|0,a.sampleRate);const ch=noiseBuf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1}
  const s=a.createBufferSource();s.buffer=noiseBuf;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=freq||2500;const g=a.createGain();const t=a.currentTime;g.gain.setValueAtTime(v||.03,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(sfxOut);s.start(t);s.stop(t+d+.02)}
const sfx={
  blip:()=>tone(880,.05,'triangle',.06),
  type:()=>tone(1320,.015,'square',.010),
  click:()=>{tone(2400,.025,'square',.03);noise(.03,.02,3200)},
  tick:()=>tone(2800,.006,'square',.007),
  ok:()=>{tone(660,.07,'triangle',.07);setTimeout(()=>tone(990,.13,'triangle',.07),70)},
  ng:()=>tone(170,.2,'sawtooth',.045,-70),
  stamp:()=>{noise(.09,.07,500);tone(120,.12,'sine',.12,-50)},
  fan:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>{tone(f,.18,'triangle',.07);tone(f*2,.12,'sine',.02)},i*110))
};

/* ---------- BGM（音声ファイルを使わず、その場で音を鳴らして作る） ----------
   mood: 'title'（ゆったり） / 'work'（少し軽快） / null（止める） */
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const BGM={
  title:{bpm:84,prog:[[48,[60,64,67,72]],[43,[59,62,67,71]],[45,[57,60,64,69]],[40,[55,59,64,67]],[41,[57,60,65,69]],[48,[55,60,64,67]],[38,[57,62,65,69]],[43,[55,59,62,67]]],pat:[0,1,2,3,2,1,2,1],hat:false},
  work:{bpm:108,prog:[[48,[60,64,67,72]],[45,[57,60,64,69]],[41,[57,60,65,69]],[43,[59,62,67,71]],[48,[60,64,67,72]],[45,[57,60,64,69]],[38,[57,62,65,69]],[43,[55,59,62,67]]],pat:[0,2,1,2,3,2,1,2],hat:true}
};
let bgmMood=null,bgmStep=0,bgmNext=0,bgmTimer=0,bgmDuck=1,bgmHeld=false;
function bgmNote(f,t,d,type,v){const o=actx.createOscillator(),g=actx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(bgmOut);o.start(t);o.stop(t+d+.05)}
function bgmTick(){
  if(!bgmMood||!actx||!settings.bgm||bgmHeld||SW.paused||document.hidden)return;
  const M=BGM[bgmMood],e=60/M.bpm/2; /* 8分音符の長さ */
  if(bgmNext<actx.currentTime)bgmNext=actx.currentTime+.06;
  while(bgmNext<actx.currentTime+.25){
    const bar=Math.floor(bgmStep/8)%M.prog.length,i=bgmStep%8,[bass,ch]=M.prog[bar];
    bgmNote(NOTE(ch[M.pat[i]]),bgmNext,e*1.7,'sine',.05);
    if(i===0)bgmNote(NOTE(bass),bgmNext,e*3.6,'triangle',.09);
    if(i===4)bgmNote(NOTE(bass+(bgmMood==='work'?7:12)),bgmNext,e*2.4,'triangle',.06);
    if(i===0&&bar%2===0)bgmNote(NOTE(ch[3]+12),bgmNext,e*5,'sine',.022);
    if(M.hat&&i%2===1&&noiseBuf){const s=actx.createBufferSource();s.buffer=noiseBuf;const f=actx.createBiquadFilter();f.type='highpass';f.frequency.value=6000;const g=actx.createGain();g.gain.setValueAtTime(.012,bgmNext);g.gain.exponentialRampToValueAtTime(.0001,bgmNext+.04);s.connect(f).connect(g).connect(bgmOut);s.start(bgmNext);s.stop(bgmNext+.06)}
    bgmNext+=e;bgmStep++;
  }
}
function bgm(mood){
  if(mood===bgmMood)return;bgmMood=mood;bgmStep=0;bgmNext=0;
  if(mood&&!bgmTimer)bgmTimer=setInterval(bgmTick,80);
  if(mood&&settings.bgm&&actx&&!noiseBuf){noiseBuf=actx.createBuffer(1,actx.sampleRate*.5|0,actx.sampleRate);const ch=noiseBuf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1}
}
function duck(on){bgmDuck=on?.35:1;if(actx&&bgmOut)bgmOut.gain.setTargetAtTime(settings.bgm&&!bgmHeld?bgmDuck:0,actx.currentTime,.2)}
/* Vlog の再生画面のあいだは BGM を止める（v2.2） */
function bgmHold(on){on=!!on;if(on===bgmHeld)return;bgmHeld=on;bgmNext=0;if(actx&&bgmOut)bgmOut.gain.setTargetAtTime(settings.bgm&&!on?bgmDuck:0,actx.currentTime,.08)}

/* ---------- さんぽぽの声（voice/001.mp3 〜） ----------
   起動時に、どの番号の音声ファイルがあるかを調べる。
   場面（オープニング・設計課…）のセリフが全部そろっている場面だけ声を出す。
   → 一部だけ収録した状態でも、途中で急に声が消えることがない。 */
let vA=null;const voiceHave=new Set();let voiceProbed=false;
function voiceProbe(){
  if(voiceProbed)return;voiceProbed=true;const D=SW.DATA;if(!D||!D.VOICE_READY)return;
  D.VOICE_ORDER.forEach((id,i)=>{try{const a=new Audio();a.preload='metadata';a.addEventListener('loadedmetadata',()=>voiceHave.add(i+1),{once:true});a.addEventListener('error',()=>{},{once:true});a.src=asset('voice/'+String(i+1).padStart(3,'0')+'.mp3')}catch(e){}});
}
function voiceSceneOK(id){const D=SW.DATA,k=id.replace(/_\d+$/,''),L=D.LINES[k];return !!L&&L.every(l=>voiceHave.has(D.voiceNo(l.id)))}
const voiceCount=()=>voiceHave.size;
function voiceStop(){if(vA){try{vA.pause()}catch(e){}vA=null}duck(false)}
function voicePlay(id){voiceStop();const D=SW.DATA;if(!settings.voice||!D||!D.VOICE_READY||!id||!volNow())return;const no=D.voiceNo(id);if(!no||!voiceSceneOK(id))return;
  try{const a=new Audio(asset('voice/'+String(no).padStart(3,'0')+'.mp3'));a.volume=volNow();vA=a;duck(true);a.addEventListener('ended',()=>{if(vA===a){vA=null;duck(false)}});const p=a.play();if(p&&p.catch)p.catch(()=>{if(vA===a){vA=null;duck(false)}})}catch(e){}}

/* ---------- 画面の部品 ---------- */
const uiCache={};
function setText(id,v){if(uiCache[id]!==v){uiCache[id]=v;$(id).textContent=v}}
const setClock=s=>setText('hudClock',s);
const setPlace=s=>setText('hudPlace',s);
const setScore=n=>setText('hudScore','SCORE '+String(Math.max(0,Math.round(n))).padStart(4,'0'));
function setTimer(v,label){const el=$('hudTimer');if(v==null){el.hidden=true;uiCache.hudTimer=null;return}el.hidden=false;setText('hudTimer',label||('残り '+Math.max(0,Math.ceil(v))+' 秒'))}
/* ---------- スマートフォン・タブレット（指で操作する端末） ----------
   指で操作する端末では、画面の下の説明から「キーボード」「マウス」の話を外し、
   「クリック」を「タップ」、「ホイール」を「2本の指」に言いかえる。 */
/* スマートフォン：指で操作できて、画面の短い辺が 600px 以下（または スマホのブラウザ）。?phone でスマホ版、?pc でパソコン版にできる */
const QS=location.search;
const PHONE=!/[?&]pc\b/.test(QS)&&(/[?&]phone\b/.test(QS)||(()=>{try{
  const short=Math.min(screen.width||9999,screen.height||9999)<=600;
  const touch=(navigator.maxTouchPoints||0)>0||('ontouchstart' in window)||matchMedia('(pointer:coarse)').matches;
  return short&&(touch||/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent))}catch(e){return false}})());
const TOUCH=PHONE||(()=>{try{if(/[?&]touch\b/.test(QS))return true;return matchMedia('(pointer:coarse)').matches&&!matchMedia('(any-pointer:fine)').matches}catch(e){return false}})();
if(TOUCH)document.documentElement.classList.add('touch');
if(PHONE)document.documentElement.classList.add('phone');   /* タブレットはパソコンと同じ画面のまま */
const IOS=/iP(hone|od|ad)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const TOUCH_MAP={
  'Enterキー（または画面のクリック）で会話が進みます。':'画面をタップすると会話が進みます。',
  '操作のきほん。矢印キーでえらんで、Enterキーで決定。数字キーなら番号で直接えらべるよ。マウスでクリックしてもOK！':'操作のきほん。えらびたいものを、指でタップするだけだよ。',
  '困ったら右上の「？」でこの説明をもう一度、「‖」（Escキー）で一時停止できるよ。制限時間は60秒！':'困ったら「？」でこの説明をもう一度、「‖」で一時停止できるよ。制限時間は60秒！',
  '3Dの画面の下に、いまやることが出るよ。何もないところをドラッグすると、形をぐるっと回して見られる。ホイールで拡大もできるよ。':'いまやることは、画面の上の帯に出るよ。3Dの画面の何もないところを指でなぞると、形をぐるっと回して見られる。2本の指で広げると拡大できるよ。',
  'キーボードなら、数字キーでツール、矢印キーでえらぶ・値を変える、Enterで決定。前半は形を作る「機械設計」、後半は回路を作る「電気設計」。制限時間は210秒！':'前半は形を作る「機械設計」、後半は回路を作る「電気設計」。制限時間は210秒！',
  '図面の中の、四角で囲まれたところを順に見て、仕様書とちがうところでEnter（またはクリック）。まちがいは3か所あるよ。':'図面の中の、四角で囲まれたところを順に見て、仕様書とちがうところをタップ。まちがいは3か所あるよ。',
  '外観検査では、←→キーでさんぽぽを回して、1周ぜんぶ見る。白い線（キズ）や黒い点（よごれ）が正面に見えたら「記録」。':'外観検査では、ボタンでさんぽぽを回して、1周ぜんぶ見る。白い線（キズ）や黒い点（よごれ）が正面に見えたら「記録」。',
  '「押しつづける」ボタンは、EnterかSpaceを押しつづけてもOK。緑のはんいで手をはなすのがコツ。':'「押しつづける」ボタンを指で押しつづけて、緑のはんいで手をはなすのがコツ。',
  '削り終わったら、後半は仕上げ。まずバリ取り。マウスなら、部品のふちの上で押したまま、道具でぐるっとなぞる。キーボードなら←→で道具をふちに沿って動かす（押しつづけると連続で動く）。':'削り終わったら、後半は仕上げ。まずバリ取り。部品のふちの上を指で押したまま、道具でぐるっとなぞる。',
  'バリの横の●の数が、バリの大きさ。大きいバリは何回かなぞると取れるよ。そのあと布で左右にこすってみがく（マウスは押したまま左右、キーボードは←→を交互）。制限時間は通しで150秒！':'バリの横の●の数が、バリの大きさ。大きいバリは何回かなぞると取れるよ。そのあと布を指で左右にこすってみがく。制限時間は通しで150秒！',
  'まず、EnterかSpaceを押しつづけて、測定器で部品をはさむ。':'まず、ボタンを押しつづけて、測定器で部品をはさむ。',
  'ツール：数字キー 1〜6 ／ ドラッグの代わり：矢印キーで値を変えて Enter　（マウスのドラッグ・クリックで操作）':'指でタップ・ドラッグして操作します。2本の指で拡大・縮小できます。',
  '矢印キー：見る場所を動かす　Enter：まちがいとして印をつける　（マウスのクリックでもOK）':'まちがいだと思う場所をタップして印をつける',
  '矢印キー：えらぶ　Enter：決定　数字キー：番号でえらぶ　（マウスのクリックでもOK）':'えらびたいものをタップ',
  '矢印キー：えらぶ　Enter：決定　数字キー：番号でえらぶ　（クリックでもOK）':'えらびたいものをタップ',
  'Enter：決定　（クリックでもOK）':'タップで決定',
  'マウス：体の表面をクリックして穴をあける（X・Y の数字を見ながら）　／　キーボード：矢印で動かして Enter':'指で押したまま動かすと、指の少し上に穴の印と X・Y の数字が出る。合ったところで指をはなすと穴があく',
  '目の穴の位置をクリック':'指で押したまま位置を合わせて、はなすと穴があく',
  'いまやること：目の穴の位置をクリック（中心から横 6 mm・上 6 mm）':'いまやること：目の穴の位置をえらぶ（中心から横 6 mm・上 6 mm）',
  '←→：えらぶ　Enter：決定　数字キー 1：合格　2：不合格　（クリックでもOK）':'「合格」か「不合格」をタップ',
  '←→：回す（押しつづけると連続で回る）　↑↓：ボタンをえらぶ　Enter：決定　数字キー 1：記録　2：ぜんぶ見た　（ボタンも長押しできます）':'ボタンで回して、キズやよごれが見えたら「記録」（ボタンは長押しできます）',
  '→：近づける　←：はなす（押しつづけると連続で動く）　↑↓：速さ切りかえ　Enter：登録　（下のボタンでもOK）':'ボタンで近づける・はなす（押しつづけると連続で動く）。速さの切りかえと「登録」もボタンで',
  'Enter または Space を押しつづける（ボタンを押しつづけてもOK）。緑のはんいで手をはなす。':'ボタンを指で押しつづける。緑のはんいで手をはなす。',
  'Enter または Space を押しつづける（ボタンを押しつづけてもOK）。':'ボタンを指で押しつづける。',
  /* Ver. 2.9.6：組立（ねじは円をえがいて締める・配線は端子の名前）と、調整（つまみを回す） */
  'まずは、ねじ締め。右の図のねじを1本えらんだら、そのまわりで、ドライバーを回すように右回りに円をえがいて締めるよ。キーボードなら、Enterを押しつづけると回る。':'まずは、ねじ締め。右の図のねじを1本タップしたら、そのまわりを指で右回りにぐるぐるなぞって締めるよ。「回す」ボタンを押しつづけてもOK。',
  'ねじが終わったら配線。左の配線図で線の色をさがして、基板に印刷された同じ名前の端子まで、線の先を引っぱってつなぐよ。キーボードなら、↑↓で線をえらんでEnter、つぎに端子をえらんでEnter。制限時間は120秒！':'ねじが終わったら配線。左の配線図で線の色をさがして、基板に印刷された同じ名前の端子まで、線の先を指で引っぱってつなぐよ。制限時間は120秒！',
  'つまみを押したまま回してね（ホイールでもOK）。キーボードなら、↑↓で左目・右目を切りかえて、←→で回す。':'つまみを指で押さえたまま、ぐるっと回してね。',
  '左右とも緑のはんい（68〜72%）に入ったら、Enterで確定。部品には個体差があるから、つまみの位置は左右でちがってくるよ。制限時間は60秒！':'左右とも緑のはんい（68〜72%）に入ったら「確定」。部品には個体差があるから、つまみの位置は左右でちがってくるよ。制限時間は60秒！',
  'マウス・指：つまみを押したまま回す（ホイールでもOK）　／　キーボード：↑↓ 左目・右目の切りかえ　←→ 回す　Enter 確定':'つまみを指で押さえたまま回す。合ったら「確定」',
  '矢印キー：ねじをえらぶ　Enter：決定してそのまま押しつづけると回る　（マウス・指：ねじを押して、まわりで円をえがく）':'締めるねじをタップ。そのまわりを指で右回りになぞると締まる',
  'マウス・指：ねじのまわりで、右回りに円をえがく　／　キーボード：Enter・Space・→ を押しつづける':'ねじのまわりを指で右回りになぞる（「回す」ボタンを押しつづけてもOK）',
  'マウス・指：線の先（銅線）を押したまま、端子まで引っぱってはなす　／　キーボード：↑↓で線をえらんでEnter → ↑↓で端子をえらんでEnter':'線の先（銅線）を指で押さえたまま、端子まで引っぱってはなす',
};
function touchText(s){
  if(!TOUCH||!s)return s;if(TOUCH_MAP[s])return TOUCH_MAP[s];
  if(s.includes('マウス：')&&s.includes('／')){   /* 「マウス：…　／　キーボード：…」→ マウスの方だけ */
    s=s.split(/\s*／\s*/).map(p=>p.startsWith('キーボード：')?(p.indexOf('。')>=0?p.slice(p.indexOf('。')+1):''):p.replace(/^マウス：/,'')).filter(Boolean).join('。')}
  return s.replace(/（[^（）]*(キー|Enter|矢印|マウス|クリックでもOK)[^（）]*）/g,'')
    .replace(/[^。]*(矢印キー|PageUp)[^。]*。/g,'').replace(/Esc か/g,'')
    .replace(/ホイールで拡大/g,'2本の指で拡大').replace(/ダブルクリック/g,'ダブルタップ').replace(/クリック/g,'タップ');
}
/* スマートフォン：「いまやること」と説明は、画面の下のカードに数秒だけ出す */
let mtTag='',mtHint='',mtTO=0,mtPend=false,mtEl=null,mtBtn=null;
const mtBusy=()=>!!dlg||panelOpen()||!!SW.tutActive||!!SW.paused||!!SW.cardOpen;
function mtHide(){if(mtEl){clearTimeout(mtTO);mtEl.classList.add('off')}}
function mtShow(ms){
  if(!mtEl||!mtTag)return;
  mtEl.querySelector('b').textContent=mtTag;mtEl.querySelector('p').textContent=mtHint;
  if(mtBusy()){mtPend=true;return}
  mtPend=false;mtEl.classList.remove('off');clearTimeout(mtTO);mtTO=setTimeout(mtHide,ms||4500);
}
const setTag=s=>{const t=touchText(s||'');setText('tag',t);
  if(!PHONE||t===mtTag)return;mtTag=t;if(mtBtn)mtBtn.hidden=!t;if(t)mtShow();else{mtPend=false;mtHide()}};
const setHint=s=>{const t=touchText(s||'');setText('hint',t);
  if(!PHONE)return;mtHint=t;if(mtEl)mtEl.querySelector('p').textContent=t};
let flashTO=0;
function flash(txt,kind){const f=$('flash');f.textContent=txt;f.className='flash '+(kind||'');f.hidden=false;void f.offsetWidth;f.classList.add('go');clearTimeout(flashTO);flashTO=setTimeout(()=>{f.hidden=true},1150)}
let toastTO=0;
function toast(text,kind,ms){if(PHONE)mtHide();const t=$('toast');$('toastText').textContent=touchText(text);t.className='toast '+(kind||'');t.hidden=false;clearTimeout(toastTO);toastTO=setTimeout(()=>{t.hidden=true},ms||4500)}
function hideToast(){clearTimeout(toastTO);$('toast').hidden=true}
function btn(label,cls,onClick,key){const b=document.createElement('button');b.type='button';b.className='cbtn '+(cls||'');b.textContent=label;if(key)b.dataset.k=key;if(onClick)b.addEventListener('click',()=>{if(!b.disabled)onClick()});return b}
function sep(){const s=document.createElement('span');s.className='sep';return s}
function holdBtn(label,on,off,aria,repeatMs,key){const b=btn(label,'hold',null,key);if(aria)b.setAttribute('aria-label',aria);let held=false,iv=0;
  const up=()=>{if(!held)return;held=false;clearInterval(iv);if(off)off();b.classList.remove('on')};
  b.addEventListener('pointerdown',e=>{if(b.disabled||busy())return;e.preventDefault();held=true;try{b.setPointerCapture(e.pointerId)}catch(_){}on();if(repeatMs)iv=setInterval(()=>{if(!busy())on()},repeatMs);b.classList.add('on')});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,up));
  b.addEventListener('click',e=>{if(e.detail===0&&!b.disabled&&!busy()){on();setTimeout(()=>{if(off)off()},160)}});return b}
function radio(labels,init,onSel,keys){const bs=labels.map((l,i)=>{const b=btn(l,'',()=>{bs.forEach((x,j)=>x.setAttribute('aria-pressed',String(j===i)));onSel(i)},keys&&keys[i]);b.setAttribute('aria-pressed',String(i===init));return b});return bs}
function setControls(nodes){$('ctrls').replaceChildren(...(nodes||[]))}
const ctrlByKey=k=>$('ctrls').querySelector(`[data-k="${k}"]`);
const panelOpen=()=>!$('panel').hidden;
function panel(html,cls){if(SW.vlogStop)SW.vlogStop();const p=$('panel');p.className='panel '+(cls||'');p.innerHTML=html;p.hidden=false;p.scrollTop=0;return p}
function closePanel(){if(SW.vlogStop)SW.vlogStop();const p=$('panel');p.hidden=true;p.innerHTML='';p.className='panel'}
function focusSoon(el){setTimeout(()=>{if(el)try{el.focus({preventScroll:true})}catch(_){}},40)}

/* ---------- 進行の中断（タイトルへ／やり直し） ---------- */
let abortRej=null,abortP=null;
function newFlow(){abortP=new Promise((_,rej)=>{abortRej=rej});abortP.catch(()=>{})}
newFlow();
const guard=p=>Promise.race([p,abortP]);
function waitClick(el){return guard(new Promise(r=>{el.addEventListener('click',()=>{sfx.blip();r()},{once:true});focusSoon(el)}))}

/* ---------- 会話 ---------- */
let dlg=null;
function say(lines,vars){return guard(new Promise(res=>{
  dlg={lines:lines.map(l=>typeof l==='string'?{t:l}:l).map(l=>({id:l.id,t:l.t.replace(/\{(\w+)\}/g,(_,k)=>vars&&vars[k]!=null?vars[k]:''),})),i:0,shown:0,full:'',res,tick:0};
  $('dialog').hidden=false;showLine()}))}
const talk=on=>$('dialog').classList.toggle('talking',!!on);
function showLine(){const L=dlg.lines[dlg.i];dlg.full=L.t;dlg.shown=0;$('line').textContent='';$('dlgCount').textContent=(dlg.i+1)+' / '+dlg.lines.length;talk(true);voicePlay(L.id)}
function dlgAdvance(){if(!dlg)return;
  if(Math.floor(dlg.shown)<dlg.full.length){dlg.shown=dlg.full.length;$('line').textContent=dlg.full;talk(false);return}
  sfx.blip();voiceStop();dlg.i++;
  if(dlg.i>=dlg.lines.length){const r=dlg.res;dlg=null;$('dialog').hidden=true;r()}else showLine()}
function dlgSkip(){if(!dlg)return;voiceStop();const r=dlg.res;dlg=null;$('dialog').hidden=true;sfx.blip();r()}
function dlgUpdate(dt){if(!dlg)return;const n=dlg.full.length;if(dlg.shown<n){const before=Math.floor(dlg.shown);dlg.shown=Math.min(n,dlg.shown+dt*40);const now=Math.floor(dlg.shown);if(now!==before){$('line').textContent=dlg.full.slice(0,now);dlg.tick++;if(dlg.tick%3===0&&!vA)sfx.type();if(now>=n)talk(false)}}}
$('dialog').addEventListener('click',e=>{if(e.target.closest('#dlgSkip'))return;dlgAdvance()});
$('dlgSkip').addEventListener('click',e=>{e.stopPropagation();dlgSkip()});

function abortFlow(reason){
  dlg=null;$('dialog').hidden=true;closePanel();if(SW.scene)SW.scene.dead=true;if(SW.hideCard)SW.hideCard();if(SW.tutEnd)SW.tutEnd();setControls([]);voiceStop();hideToast();
  SW.paused=false;setTimer(null);setTag(null);
  const r=abortRej;newFlow();if(r)r(reason);
}

/* ---------- 入力 ---------- */
const keys=new Set(),pointer={down:false};
let lastInput=performance.now();const touchInput=()=>{lastInput=performance.now()};
['pointerdown','keydown','wheel','touchstart'].forEach(ev=>window.addEventListener(ev,touchInput,{passive:true,capture:true}));
const idleSec=()=>(performance.now()-lastInput)/1000;
function busy(){return !!dlg||panelOpen()||!!SW.tutActive||!!SW.paused||!!SW.cardOpen||!!SW.menuOpen}
function toCanvas(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}
/* 指2本：ピンチで拡大・縮小。スマホは画面そのものを拡大・移動、タブレットはマウスのホイールと同じ扱い */
const touches=new Map();let pinch=null;
const tDist=()=>{const[a,b]=[...touches.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
const phoneLand=()=>PHONE&&isLand();
cv.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')touches.set(e.pointerId,{x:e.clientX,y:e.clientY,e});
  const sc=SW.scene;
  if(touches.size>=2){e.preventDefault();
    if(pointer.down){pointer.down=false;const f=[...touches.values()][0];
      if(sc){if(sc.onCancel)sc.onCancel(toCanvas(f.e));else if(sc.onUp)sc.onUp(toCanvas(f.e))}}
    if(phoneLand()){if(!gest)gestStart()}
    else if(!pinch&&sc&&sc.onWheel&&!busy()&&!dlg)pinch={d:tDist()};
    return}
  if(dlg){dlgAdvance();e.preventDefault();return}
  if(busy()||!sc||!sc.onDown)return;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
  pointer.down=true;sc.onDown(toCanvas(e));e.preventDefault();
});
cv.addEventListener('pointermove',e=>{
  if(touches.has(e.pointerId))touches.set(e.pointerId,{x:e.clientX,y:e.clientY,e});
  const sc=SW.scene;
  if(gest){gestMove();return}
  if(pinch){if(touches.size>=2&&sc&&sc.onWheel&&!busy()){const d=tDist(),r=d/Math.max(1,pinch.d);
      if(r>1.1){sc.onWheel(-1);pinch.d=d}else if(r<.9){sc.onWheel(1);pinch.d=d}}
    return}
  if(sc&&sc.onMove&&!busy())sc.onMove(toCanvas(e),pointer.down)});
const pUp=e=>{touches.delete(e.pointerId);
  if(gest){if(touches.size===0){gest=null;phoneBacking()}return}
  if(pinch){if(touches.size===0)pinch=null;return}
  if(!pointer.down)return;pointer.down=false;const sc=SW.scene;if(sc&&sc.onUp)sc.onUp(toCanvas(e))};
cv.addEventListener('pointerup',pUp);cv.addEventListener('pointercancel',pUp);
cv.addEventListener('wheel',e=>{const sc=SW.scene;if(sc&&sc.onWheel&&!busy()){e.preventDefault();sc.onWheel(e.deltaY)}},{passive:false});
window.addEventListener('keydown',e=>{
  const tgt=e.target;if(tgt&&(tgt.tagName==='INPUT'||tgt.tagName==='TEXTAREA'))return;
  if(e.isComposing||e.keyCode===229)return;
  if(e.key==='Escape'){if(SW.onEscape)SW.onEscape();return}
  if(dlg&&(e.key==='Enter'||e.key===' ')){e.preventDefault();dlgAdvance();return}
  if(tgt&&tgt.tagName==='BUTTON'&&(e.key==='Enter'||e.key===' '))return;
  const sc=SW.scene;
  if(sc&&sc.active&&sc.active()&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
  keys.add(e.key);if(sc&&sc.onKey&&!busy())sc.onKey(e.key,e.repeat);   /* e.repeat：押しつづけによる自動のくり返し */
});
window.addEventListener('keyup',e=>keys.delete(e.key));
window.addEventListener('blur',()=>keys.clear());

function grain(){} /* v1.0：ビデオ風のノイズは廃止（高精細表示にしたため） */

/* ---------- 会社の前（タイトル・オープニング・エンディング） ---------- */
const gateScene={evening:false,mascot:false,draw(t){
  const ev=this.evening,rm=reduceMotion;
  const g=C.createLinearGradient(0,0,0,112);
  if(ev){g.addColorStop(0,'#1a2040');g.addColorStop(.45,'#5a3a60');g.addColorStop(.78,'#c8644e');g.addColorStop(1,'#f0a558')}
  else{g.addColorStop(0,'#4f8fd6');g.addColorStop(.6,'#9cc6ea');g.addColorStop(1,'#e4f0f4')}
  C.fillStyle=g;C.fillRect(0,0,W,112);
  if(ev){for(let i=0;i<26;i++){const x=hash(i,1)*W,y=hash(i,2)*48,a=.35+.4*Math.abs(Math.sin(t*.8+i));R(x,y,.7,.7,`rgba(255,255,255,${rm?.6:a})`)}
    const sg=C.createRadialGradient(248,104,2,248,104,70);sg.addColorStop(0,'rgba(255,214,140,.75)');sg.addColorStop(1,'rgba(255,214,140,0)');C.fillStyle=sg;C.fillRect(170,40,150,80);circ(248,102,9,'#ffd98a')}
  else{const sg=C.createRadialGradient(302,16,2,302,16,40);sg.addColorStop(0,'rgba(255,255,240,.9)');sg.addColorStop(1,'rgba(255,255,240,0)');C.fillStyle=sg;C.fillRect(250,0,70,60);circ(302,16,6,'#fffbe0')}
  /* 雲 */
  const cloud=(x,y,s,a)=>{C.fillStyle=ev?`rgba(250,190,160,${a*.6})`:`rgba(255,255,255,${a})`;for(const[dx,dy,r]of[[0,0,7],[8,-3,9],[18,-1,8],[27,1,6],[12,3,8]]){C.beginPath();C.ellipse(x+dx*s,y+dy*s,r*s*1.25,r*s*.62,0,0,TAU);C.fill()}};
  const dr=rm?0:t*1.6;
  [[20,22,1,.9],[130,14,.7,.75],[210,34,.85,.8],[300,18,.6,.7]].forEach(([x,y,s,a],i)=>cloud(((x+dr*(.6+i*.15))%(W+80))-40,y,s,a));
  /* 山なみ（遠く・近く） */
  const hill=(base,amp,f,ph,col)=>{C.fillStyle=col;C.beginPath();C.moveTo(0,112);for(let x=0;x<=W;x+=4)C.lineTo(x,base+Math.sin(x*f+ph)*amp+Math.sin(x*f*2.7+ph*2)*amp*.4);C.lineTo(W,112);C.closePath();C.fill()};
  hill(84,7,.021,1,ev?'#3a3458':'#86aacb');hill(92,6,.034,2.2,ev?'#2a2c44':'#5f8f78');hill(100,4,.05,.4,ev?'#22283a':'#4a7d5e');
  R(0,108,W,30,ev?'#22283a':'#4a7d5e');   /* 山と地面のあいだを塗る（前の画面が残らないように） */
  /* 社屋（Ver. 2.9.6：本社工場の写真に合わせた。左が紫がかった灰色の波板の建物、右が角の丸い赤い建物に白い「SUNYOU」） */
  const D2=(day,eve)=>ev?eve:day;
  const ribs=(x0,x1,y0,y1,col,step)=>{for(let x=x0+1;x<x1;x+=step)R(x,y0,.35,y1-y0,col)};
  /* 地面（駐車場のアスファルト） */
  R(0,136,W,44,D2('#5b6153','#2b2f2e'));R(0,136,W,2,D2('#7f8a72','#3c4240'));R(30,137,250,23,D2('#8a8d8c','#3c3f41'));
  /* 左はしの小さな建物（オレンジの屋根・白いかべ） */
  R(38,118,34,18,D2('#e9e9e4','#77757e'));C.fillStyle=D2('#d9532e','#6b3326');C.beginPath();C.moveTo(34,119);C.lineTo(73,113);C.lineTo(73,117);C.lineTo(34,122);C.closePath();C.fill();
  for(let y=121;y<136;y+=2.4)R(38,y,32,.3,D2('#c9cac6','#5f5d66'));
  /* 左の建物（3階建て・波板） */
  const LX=70,LR=178,LT=36;
  R(LX,LT,LR-LX,136-LT,D2('#8f8189','#58515d'));R(LX,LT,LR-LX,2.2,D2('#b3a5ad','#6c6470'));ribs(LX,LR,LT+2,98,D2('rgba(60,45,55,.22)','rgba(20,15,25,.3)'),2.1);
  R(LX,LT,3,136-LT,D2('rgba(255,255,255,.08)','rgba(255,255,255,.04)'));
  /* 2階の窓（緑がかったガラス・白い枠） */
  [86,110,134].forEach((x,i)=>{R(x-1,74,17,15,D2('#f2f2ef','#8a8794'));const lit=ev&&i!==1;R(x,75,15,13,lit?'#f6dd8c':D2('#8fcfb6','#3a4c58'));R(x+7.2,75,.6,13,D2('#f2f2ef','#8a8794'));
    if(!lit){C.fillStyle='rgba(255,255,255,.22)';C.beginPath();C.moveTo(x+1,88);C.lineTo(x+5,75);C.lineTo(x+7,75);C.lineTo(x+3,88);C.closePath();C.fill()}});
  R(128,46,3,3,D2('#5a4f57','#3a3440'));
  /* 青いひさし */
  C.fillStyle=D2('#4d6f86','#2f4250');C.beginPath();C.moveTo(64,97);C.lineTo(LR,95);C.lineTo(LR,98.5);C.lineTo(64,100.5);C.closePath();C.fill();R(64,100.5,LR-64,.6,D2('#2f4a5c','#1d2a33'));
  /* 1階：暗い入口・白いシャッター・ドア */
  R(LX,101,LR-LX,35,D2('#6f646c','#433d48'));R(LX+2,103,30,33,D2('#3f3a40','#24212a'));
  R(106,104,46,32,D2('#eceeec','#8b8a92'));for(let y=106;y<136;y+=1.6)R(106,y,46,.3,D2('#c3c6c4','#6d6c74'));R(106,104,46,1.4,D2('#9da2a2','#5e5d66'));
  R(93,112,9,24,D2('#5c3e2c','#3a2a22'));R(94,113,7,8,D2('#9fb7c4','#e3c47a'));
  /* 右の建物（赤い波板・左の角が丸い） */
  const RX=176,RR=262,RT=20,RB=106;
  C.save();C.beginPath();C.moveTo(RX,RB);C.lineTo(RX,RT+10);C.quadraticCurveTo(RX,RT,RX+10,RT);C.lineTo(RR,RT);C.lineTo(RR,RB);C.closePath();C.clip();
  const rg=C.createLinearGradient(RX,0,RR,0);rg.addColorStop(0,D2('#9e1216','#5c1216'));rg.addColorStop(.12,D2('#d01c22','#7c1a1e'));rg.addColorStop(.55,D2('#e2262b','#8a1f22'));rg.addColorStop(1,D2('#c71c21','#761a1d'));
  C.fillStyle=rg;C.fillRect(RX,RT,RR-RX,RB-RT);ribs(RX,RR,RT,RB,D2('rgba(90,0,0,.25)','rgba(30,0,0,.35)'),2.1);
  C.fillStyle=D2('rgba(255,255,255,.12)','rgba(255,255,255,.05)');C.fillRect(RX+4,RT,5,RB-RT);C.restore();
  C.strokeStyle=D2('#f4f4f2','#9b98a2');C.lineWidth=.9;C.beginPath();C.moveTo(RX,RT+10);C.quadraticCurveTo(RX,RT,RX+10,RT);C.lineTo(RR,RT);C.stroke();
  /* 奥へのびる右の面（少し暗い赤） */C.fillStyle=D2('#a8171c','#5e1417');C.beginPath();C.moveTo(RR,RT);C.lineTo(RR+6,RT+4);C.lineTo(RR+6,136);C.lineTo(RR,136);C.closePath();C.fill();
  /* 白い「SUNYOU」の文字 */jt('SUNYOU',(RX+RR)/2+2,RT+3.5,ev?'#fff6d8':'#ffffff',9.5,'center');
  /* 赤い建物の窓 */[[190,20],[226,22]].forEach(([x,w])=>{R(x-1,58,w+2,16,D2('#f2f2ef','#9b98a2'));R(x,59,w,14,ev?'#f6dd8c':D2('#4b5a66','#33404c'));R(x+w/2-.3,59,.6,14,D2('#f2f2ef','#9b98a2'));if(!ev){C.fillStyle='rgba(255,255,255,.2)';C.beginPath();C.moveTo(x+2,73);C.lineTo(x+7,59);C.lineTo(x+9,59);C.lineTo(x+4,73);C.closePath();C.fill()}});
  R(RX,RB,RR-RX,1.2,D2('#f4f4f2','#9b98a2'));
  /* 赤い建物の1階（灰色のかべ・ドア・窓・自動販売機） */
  R(RX,RB+1.2,RR-RX,136-RB-1.2,D2('#a3a1a6','#5c5a63'));ribs(RX,RR,RB+1.2,136,D2('rgba(0,0,0,.1)','rgba(0,0,0,.2)'),2.1);
  R(186,114,12,22,D2('#6a4a36','#3a2a22'));R(206,112,20,12,ev?'#e8c878':D2('#3b4650','#2a323b'));
  R(232,117,9,19,D2('#f4f6f8','#9c9aa4'));R(233,119,7,8,D2('#c9372d','#7a2a24'));R(233.5,128,6,1.4,'#2a3038');
  if(ev){const dg=C.createRadialGradient(192,136,2,192,136,30);dg.addColorStop(0,'rgba(255,220,140,.3)');dg.addColorStop(1,'rgba(255,220,140,0)');C.fillStyle=dg;C.fillRect(160,110,70,40)}
  /* 松の木（手入れされた庭木） */
  {const x=174,sw=rm?0:Math.sin(t*1.1)*.4;R(x-1,96,2.2,42,D2('#5a4130','#33261e'));
    [[0,90,9,4.2],[-6,99,8,3.8],[6,105,8.5,3.8],[-4,113,9,4],[3,121,7.5,3.4]].forEach(([dx,y,rx,ry])=>{C.fillStyle=D2('#2f5d36','#1b3322');C.beginPath();C.ellipse(x+dx+sw,y,rx,ry,0,0,TAU);C.fill();C.fillStyle=D2('#41794a','#25432d');C.beginPath();C.ellipse(x+dx+sw-1,y-1.2,rx*.75,ry*.55,0,0,TAU);C.fill()})}
  /* 白い軽トラック */
  {const x=216,y=124,bd=D2('#f4f6f7','#a3a2aa'),sh=D2('#cdd2d6','#7e7d86');
    R(x,y+3,30,8,bd);R(x,y+3,30,1,sh);R(x,y+10,30,1.2,sh);for(let k=1;k<4;k++)R(x+k*7.5,y+3.6,.4,6.4,sh);
    C.fillStyle=bd;C.beginPath();C.moveTo(x+30,y+11);C.lineTo(x+30,y-2);C.lineTo(x+39,y-2);C.lineTo(x+44,y+5);C.lineTo(x+44,y+11);C.closePath();C.fill();
    C.fillStyle=ev?'#e8c878':D2('#5f7f97','#3a4652');C.beginPath();C.moveTo(x+32,y);C.lineTo(x+38.5,y);C.lineTo(x+42.5,y+5);C.lineTo(x+32,y+5);C.closePath();C.fill();
    R(x+30,y+11,14,1,sh);R(x+43,y+7,1.4,2,ev?'#fff0b8':'#f2c94c');
    for(const wx of[x+8,x+37]){circ(wx,y+12,3.4,'#1c1f23');circ(wx,y+12,1.6,'#8d949b')}}
  /* 道 */
  R(0,160,W,20,ev?'#34383b':'#6d7275');for(let x=-10;x<W;x+=28)R(x,169,14,1.6,ev?'#6b6f66':'#d9dcd2');
  /* まわりの木と街灯 */
  for(const x of[22,300]){const sw=rm?0:Math.sin(t*1.3+x)*.8;R(x-1.5,118,3,20,'#4a3524');circ(x+sw,108,14,ev?'#1c3024':'#2c6a3d');circ(x-5+sw,103,8,ev?'#274233':'#3b8650');circ(x+6+sw,112,7,ev?'#213a2b':'#347846')}
  for(const x of[42,284]){R(x-.6,112,1.2,26,'#39424b');circ(x,111,2.4,ev?'#ffe9a8':'#dfe6ea');if(ev){const lg=C.createRadialGradient(x,112,1,x,112,22);lg.addColorStop(0,'rgba(255,233,168,.35)');lg.addColorStop(1,'rgba(255,233,168,0)');C.fillStyle=lg;C.fillRect(x-22,90,44,44)}}
  /* さんぽぽ */
  if(this.mascot&&SANPO.complete&&SANPO.naturalWidth){const b=rm?0:Math.abs(Math.sin(t*3))*2.2;C.fillStyle='rgba(0,0,0,.28)';C.beginPath();C.ellipse(160,163,14-b,2.6,0,0,TAU);C.fill();C.imageSmoothingEnabled=true;C.drawImage(SANPO,134,124-b,52,41)}
}};

/* ---------- 画面を16:9でウィンドウに収める（スクロールなし）＋高精細化 ---------- */
/* =====================================================================
   スマートフォン専用の画面（Ver. 2.8）… PHONE のときだけ動く。パソコンには関係しない
   ・ゲーム画面は、見切れない範囲でいちばん大きく（Ver. 2.9.4 試作）。2本の指で広げる・つまむ・動かすと、拡大・縮小・移動
   ・最初に「タップしてスタート」で全画面・横向きにする
   ===================================================================== */
const VIEW={z:1,tx:0,ty:0,w:0,h:0,cw:0,ch:0,anim:0,mode:'all'};   /* mode: all=見切れない範囲でいちばん大きく（ふだん）  free=指で動かした。fill（上下を少し隠して横幅いっぱい）は Ver. 2.9.4 試作から使わない */
const ZMAX=3;
const isLand=()=>innerWidth>=innerHeight;
function phoneFit(wrap,sc,w,h){
  sc.style.width=w+'px';sc.style.height=h+'px';
  const cw=Math.min(w,h*16/9),ch=cw*9/16;VIEW.w=w;VIEW.h=h;VIEW.cw=cw;VIEW.ch=ch;
  cv.style.width=cw+'px';cv.style.height=ch+'px';cv.style.transformOrigin='0 0';
  document.documentElement.style.setProperty('--pfs',Math.max(9,Math.min(h*.0288*1.15,w*.0166)).toFixed(2)+'px');
  cancelAnimationFrame(VIEW.anim);
  if(VIEW.mode!=='free')Object.assign(VIEW,viewTarget(VIEW.mode));
  viewClamp();viewApply();phoneBacking();
}
/* 「画面いっぱい」：横幅いっぱいまで大きくする。はみ出すのは上下あわせて最大 20（ゲーム画面の高さ 180 のうち）。
   上の見出しの帯を多めに、下を少なめに隠す（下にはボタンが多いので） */
function viewTarget(mode){const v=VIEW;
  if(mode==='all')return{z:1,tx:(v.w-v.cw)/2,ty:(v.h-v.ch)/2};
  const z=Math.max(1,Math.min(v.w/v.cw,180/160)),H2=v.ch*z,hid=Math.max(0,H2-v.h);
  return{z,tx:(v.w-v.cw*z)/2,ty:H2<=v.h?(v.h-H2)/2:-hid*13/20}}
function phoneUnfit(sc){cv.style.width=cv.style.height=cv.style.transform='';VIEW.z=1;document.documentElement.classList.remove('zoomed')}
function phoneBacking(){
  const dpr=Math.min(window.devicePixelRatio||1,3);
  const bw=Math.round(clamp(VIEW.cw*Math.min(VIEW.z,2.2)*dpr,640,3200)/16)*16,bh=bw*9/16;
  if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh}SC=bw/W;
}
function viewClamp(){
  const v=VIEW,W2=v.cw*v.z,H2=v.ch*v.z;
  v.tx=W2<=v.w?(v.w-W2)/2:clamp(v.tx,v.w-W2,0);
  v.ty=H2<=v.h?(v.h-H2)/2:clamp(v.ty,v.h-H2,0);
}
function viewApply(){
  cv.style.transform=`translate(${VIEW.tx.toFixed(1)}px,${VIEW.ty.toFixed(1)}px) scale(${VIEW.z.toFixed(4)})`;
  document.documentElement.classList.toggle('zoomed',VIEW.z>1.02);
}
function viewSet(mode){
  const v=VIEW,a={z:v.z,tx:v.tx,ty:v.ty},b=viewTarget(mode),t0=performance.now();v.mode=mode;cancelAnimationFrame(v.anim);
  const step=t=>{const k=Math.min(1,(t-t0)/240),e=1-Math.pow(1-k,3);v.z=a.z+(b.z-a.z)*e;v.tx=a.tx+(b.tx-a.tx)*e;v.ty=a.ty+(b.ty-a.ty)*e;viewClamp();viewApply();
    if(k<1)v.anim=requestAnimationFrame(step);else phoneBacking()};
  v.anim=requestAnimationFrame(step);
}
const viewReset=()=>viewSet('all');
/* 拡大率 z にして、画面の点 (sx,sy) にある場所を動かさない */
function viewZoomAt(z,sx,sy){const v=VIEW,z0=v.z;z=clamp(z,1,ZMAX);v.tx=sx-(sx-v.tx)*z/z0;v.ty=sy-(sy-v.ty)*z/z0;v.z=z;viewClamp();viewApply()}
/* 2本の指のジェスチャー */
let gest=null;
function gestPts(){const sr=$('screen').getBoundingClientRect();const[a,b]=[...touches.values()];
  return{d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2-sr.left,my:(a.y+b.y)/2-sr.top}}
function gestStart(){cancelAnimationFrame(VIEW.anim);const p=gestPts();gest={d0:Math.max(20,p.d),z0:VIEW.z,mx:p.mx,my:p.my,tx:VIEW.tx,ty:VIEW.ty,used:false}}
function gestMove(){if(touches.size<2)return;const p=gestPts(),g=gest;
  const z=clamp(g.z0*p.d/g.d0,1,ZMAX);
  /* はじめの2本指の真ん中にあった場所が、いまの真ん中に来るように */
  VIEW.mode='free';VIEW.z=z;VIEW.tx=p.mx-(g.mx-g.tx)*z/g.z0;VIEW.ty=p.my-(g.my-g.ty)*z/g.z0;viewClamp();viewApply();
  if(Math.abs(z-g.z0)>.03||Math.hypot(p.mx-g.mx,p.my-g.my)>6)g.used=true}
/* 指の位置からどれだけ上を「ねらう点」にするか（CADの穴あけなど、細かい場所をえらぶとき） */
function fingerOff(){const r=cv.getBoundingClientRect();return 34/(r.width/W||1)}
/* 全画面 */
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
function lockLand(){try{const o=screen.orientation;if(o&&o.lock){const p=o.lock('landscape');if(p&&p.catch)p.catch(()=>{})}}catch(e){}}
function goFull(){try{const el=document.documentElement,f=el.requestFullscreen||el.webkitRequestFullscreen;if(!f){lockLand();return}
  const r=f.call(el,{navigationUI:'hide'});if(r&&r.then)r.then(lockLand,()=>{});else lockLand()}catch(e){}}
const standalone=()=>{try{return matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}};
let pstart=null,pstartMode='';
function phoneStart(mode){
  if(!pstart){pstart=document.createElement('div');pstart.className='pstart';pstart.setAttribute('role','dialog');document.body.append(pstart);
    pstart.addEventListener('click',e=>{const keep=e.target.closest('[data-a=keep]');pstart.hidden=true;if(!keep&&!standalone())goFull()})}
  pstartMode=mode;const canFS=!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
  pstart.innerHTML=mode==='first'
    ?`<div class="ps-in"><img src="${asset('img/sanpopo.png')}" alt=""><b>三友ワークス</b><p class="ps-go">画面をタップしてスタート</p>
      <small>${canFS?'全画面・横向きで遊びます。':(IOS&&!standalone()?'iPhone は、共有ボタン →「ホーム画面に追加」から開くと、全画面で遊べます。':'スマホを横向きにして遊んでね。')}<br>2本の指で広げると、画面を拡大できます。</small><small class="ps-ver">スマホ版　Ver. ${SW.VERSION||''}</small></div>`
    :`<div class="ps-in"><p class="ps-go">タップして全画面にもどる</p><button type="button" class="btn ghost" data-a="keep">このまま続ける</button></div>`;
  pstart.hidden=false;
}
/* ☰ メニュー（スマホだけ）：時間・★・音量・全体を見る・説明・一時停止・全画面を、ゲーム画面の左上の1つのボタンにまとめる */
let pm=null,pmBtn=null;
function pmSync(){if(!pm)return;
  const tm=$('hudTimer'),sc=$('hudScore');
  pm.querySelector('.pm-time').textContent=tm&&!tm.hidden&&tm.textContent?tm.textContent:'';
  pm.querySelector('.pm-score').textContent=sc&&!sc.hidden&&sc.textContent?sc.textContent:'';
  pm.querySelectorAll('[data-v]').forEach(b=>b.classList.toggle('on',+b.dataset.v===(settings.vol|0)));
  /* 2本の指で拡大・移動したときだけ「元の大きさにもどす」を出す */
  {const vb=pm.querySelector('[data-a=view]');vb.textContent='元の大きさにもどす';vb.hidden=VIEW.mode!=='free'}
  pm.querySelector('[data-a=full]').textContent=fsEl()?'全画面をやめる':'全画面にする';
  pm.querySelector('[data-a=full]').hidden=!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
  pm.querySelector('[data-a=task]').hidden=!mtTag;
  pm.querySelector('[data-a=help]').disabled=$('btnHelp').disabled;pm.querySelector('[data-a=pause]').disabled=$('btnPause').disabled}
function pmOpen(){pmSync();pm.hidden=false;SW.menuOpen=true;mtHide()}
function pmClose(){pm.hidden=true;SW.menuOpen=false}
function phoneUI(){
  pmBtn=document.createElement('button');pmBtn.type='button';pmBtn.className='pm-btn';pmBtn.setAttribute('aria-label','メニュー');
  pmBtn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  pm=document.createElement('div');pm.className='pm';pm.hidden=true;pm.setAttribute('role','dialog');pm.setAttribute('aria-label','メニュー');
  pm.innerHTML=`<div class="pm-sheet">
    <div class="pm-info"><span class="pm-time"></span><span class="pm-score"></span></div>
    <button type="button" data-a="task">いまやることを見る</button>
    <button type="button" data-a="view"></button>
    <div class="pm-vol"><span>音量</span><button type="button" data-v="0">消音</button><button type="button" data-v="1">小</button><button type="button" data-v="2">中</button><button type="button" data-v="3">大</button></div>
    <button type="button" data-a="help">操作の説明</button>
    <button type="button" data-a="pause">一時停止・やり直し</button>
    <button type="button" data-a="full"></button>
    <button type="button" data-a="close" class="pm-close">とじる</button></div>`;
  $('screen').append(pmBtn,pm);
  pmBtn.addEventListener('click',()=>{audio();pm.hidden?pmOpen():pmClose()});
  pm.addEventListener('click',e=>{
    if(e.target===pm){pmClose();return}
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.v!=null){audio();settings.vol=+b.dataset.v;saveSettings();applyAudio();pmSync();sfx.blip();return}
    const a=b.dataset.a;pmClose();
    if(a==='task')mtShow(8000);
    else if(a==='view')viewSet('all');
    else if(a==='help')$('btnHelp').click();
    else if(a==='pause')$('btnPause').click();
    else if(a==='full'){try{if(fsEl())(document.exitFullscreen||document.webkitExitFullscreen).call(document);else goFull()}catch(_){}}
  });
  /* パネル（タイトル・結果など）や説明が出ているあいだは、☰ をかくす（パネルには自分のボタンがある） */
  setInterval(()=>{const hide=panelOpen()||!!SW.tutActive||!!SW.cardOpen||(pstart&&!pstart.hidden);pmBtn.hidden=hide;if(hide&&!pm.hidden)pmClose()},250);
  phoneStart('first');
  window.addEventListener('load',()=>{const v=pstart&&pstart.querySelector('.ps-ver');if(v)v.textContent='スマホ版　Ver. '+(SW.VERSION||'')});
  const onFS=()=>{if(!fsEl()&&pstart&&pstart.hidden&&!standalone()&&(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen))phoneStart('back')};
  document.addEventListener('fullscreenchange',onFS);document.addEventListener('webkitfullscreenchange',onFS);
  /* スマホでは、ページそのものの拡大（ダブルタップ・ピンチ）を止める */
  document.addEventListener('gesturestart',e=>e.preventDefault());
  document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
}
if(PHONE)phoneUI();
function fit(){const wrap=$('stagewrap'),sc=$('screen');const w=wrap.clientWidth,h=wrap.clientHeight;
  if(PHONE){if(w>=h){phoneFit(wrap,sc,w,h);return}phoneUnfit(sc)}
  const sw=Math.max(240,Math.min(w,h*16/9));sc.style.width=sw+'px';sc.style.height=(sw*9/16)+'px';
  const dpr=Math.min(window.devicePixelRatio||1,3);const bw=Math.round(clamp(sw*dpr,640,2560)/16)*16,bh=bw*9/16;
  if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh}SC=bw/W}
if(PHONE){
  /* 時計・残り時間・★を左の列へ、「やること」ボタンを追加。説明のカードを作る */
  const ms=document.createElement('div');ms.className='mside';ms.append($('hudTimer'),$('hudScore'));
  mtBtn=document.createElement('button');mtBtn.type='button';mtBtn.className='mtask-btn';mtBtn.textContent='やること';mtBtn.hidden=true;
  mtBtn.setAttribute('aria-label','いまやることと操作の説明を見る');
  mtBtn.addEventListener('click',()=>{if(mtEl&&!mtEl.classList.contains('off'))mtHide();else mtShow(8000)});
  ms.append(mtBtn);document.querySelector('.hb-l').append(ms);
  mtEl=document.createElement('div');mtEl.className='mtask off';mtEl.setAttribute('aria-live','polite');mtEl.innerHTML='<b></b><p></p>';$('screen').append(mtEl);
  /* カードはさわれない（下のボタンをそのまま押せる）。ゲーム画面をさわると消える */
  cv.addEventListener('pointerdown',()=>{if(!mtPend)mtHide()},true);
  setInterval(()=>{if(mtBusy()){if(!mtEl.classList.contains('off')){mtHide();mtPend=true}}else if(mtPend)mtShow()},300);
}
window.addEventListener('resize',fit);if(window.ResizeObserver)new ResizeObserver(fit).observe($('stagewrap'));fit();
try{if(document.fonts){document.fonts.load('12px "SWSans"').catch(()=>{});document.fonts.load('700 12px "SWSans"').catch(()=>{})}}catch(e){}

/* ---------- 画面の切りかえ（暗転） ---------- */
function fadeOut(ms){const f=$('fade');if(reduceMotion){return Promise.resolve()}f.hidden=false;void f.offsetWidth;f.classList.add('on');return new Promise(r=>setTimeout(r,ms||260))}
function fadeIn(){const f=$('fade');f.classList.remove('on');setTimeout(()=>{if(!f.classList.contains('on'))f.hidden=true},320)}

Object.defineProperty(SW,'SC',{get:()=>SC});
Object.assign(SW,{asset,PHONE,fingerOff,viewReset,W,H,TAU,$,cv,ctx,reduceMotion,clamp,esc,store,settings,saveSettings,
  setCtx:c=>{C=c},getCtx:()=>C,
  R,circ,ring,line,box,jt,FF,mulberry,hash,gauss,triPath,lamp,avatar,SANPO,
  audio,applyAudio,volNow,bgmHold,tone,noise,sfx,bgm,voicePlay,voiceStop,voiceProbe,voiceCount,idleSec,touchInput,fadeOut,fadeIn,
  TOUCH,touchText,setText,setClock,setPlace,setScore,setTimer,setTag,setHint,flash,toast,hideToast,btn,sep,holdBtn,radio,setControls,ctrlByKey,panel,closePanel,panelOpen,focusSoon,
  guard,waitClick,abortFlow,say,dlgUpdate,keys,pointer,busy,grain,gateScene,fit,
  scene:null,paused:false,running:false,total:0,STAGES:[]});
})();
