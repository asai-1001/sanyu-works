/* =====================================================================
   三友ワークス — 8つの作業に共通の仕組み
   ・制限時間、ミスの数、クリア／時間切れ、★の評価
   ・えらべる場所（items）の管理：マウスのクリックでも、キーボードでも同じように操作できる
       矢印キー … えらぶ場所を動かす　　Enter / Space … 決定　　数字キー … 番号で直接えらぶ
   ・絵を描くための小さな部品（パネル、ボタン、文字の折り返し、ゲージ）
   ===================================================================== */
(()=>{
'use strict';
const S=SW,{W,H,R,circ,line,jt,TAU}=S;
const PAL={bg:'#0c121a',panel:'#15202c',panel2:'#1b2937',line:'#2e3e50',txt:'#eef2f5',mut:'#93a1b0',acc:'#f6c21c',ok:'#4fd28f',ng:'#f0624f',blue:'#1f5fae',cad:'#5fd0ff',paper:'#f5f2e7',ink:'#1c2530',inkmut:'#6b7682'};
const C=()=>S.getCtx();
function rr(x,y,w,h,r,fill,stroke,lw){const c=C();r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
  if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||.6;c.setLineDash([]);c.stroke()}}
function bg(){const c=C(),g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#101924');g.addColorStop(1,'#0a1017');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(95,208,255,.045)';c.lineWidth=.4;c.beginPath();for(let x=0;x<=W;x+=16){c.moveTo(x,0);c.lineTo(x,H)}for(let y=0;y<=H;y+=16){c.moveTo(0,y);c.lineTo(W,y)}c.stroke()}
/* 見出しつきの箱。light=true で紙（図面・指示書）の色 */
function panel(x,y,w,h,title,light){rr(x,y,w,h,3,light?PAL.paper:PAL.panel,light?'#cfc9b4':PAL.line);
  if(title){rr(x,y,w,11,3,light?'#123f7c':PAL.panel2);R(x,y+6,w,5,light?'#123f7c':PAL.panel2);jt(title,x+5,y+2,light?'#fff':PAL.acc,6.2)}}
/* 文字を幅に合わせて折り返して描く。描き終わったあとの y を返す */
function wrap(s,x,y,maxW,size,col,lh){const c=C();size=size||6;lh=lh||size*1.5;c.font=(size>=8?'700 ':'')+size+'px '+S.FF;let ln='';
  for(const ch of String(s)){if(ch==='\n'){jt(ln,x,y,col,size);y+=lh;ln='';continue}if(c.measureText(ln+ch).width>maxW&&ln){jt(ln,x,y,col,size);y+=lh;ln=ch}else ln+=ch}
  if(ln){jt(ln,x,y,col,size);y+=lh}return y}
function gauge(x,y,w,h,v,lo,hi,col){rr(x,y,w,h,h/2,'#0a0f15',PAL.line);R(x+w*lo,y+.5,w*(hi-lo),h-1,'rgba(79,210,143,.35)');
  const vv=S.clamp(v,0,1);if(vv>0)rr(x+.6,y+.6,Math.max(h-1.2,(w-1.2)*vv),h-1.2,(h-1.2)/2,col||(v>=lo&&v<=hi?PAL.ok:v>hi?PAL.ng:PAL.acc));
  line(x+w*lo,y-1,x+w*lo,y+h+1,PAL.ok,.5);line(x+w*hi,y-1,x+w*hi,y+h+1,PAL.ok,.5)}
function check(x,y,done,now){circ(x,y,3,done?PAL.ok:now?PAL.acc:'#2a3644');if(done){const c=C();c.strokeStyle='#0a1a10';c.lineWidth=1;c.beginPath();c.moveTo(x-1.6,y);c.lineTo(x-.4,y+1.3);c.lineTo(x+1.8,y-1.4);c.stroke()}}
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};

/* ---------- 作業の土台 ----------
   def = { limit:秒, setup(g), update(g,dt), draw(g,t), key(g,k,rep)→true で自前処理（rep：押しつづけによるくり返し） }
   g.setItems([{id,x,y,w,h,label,sub,n,on(),hold,state,draw}])  … えらべる場所を入れかえる
   g.miss1(msg) ミス　／　g.good(msg) 正解　／　g.win(detail) 完了 */
function make(def){
  const g={time:def.limit,limit:def.limit,miss:0,items:[],fi:0,frozen:false,run:false,done:false,T:0,ptr:false,shake:0,def};
  let res=null,warned=false,hover=-1,rep=null;   /* rep：長押しでくり返しているボタン */
  g.setItems=(arr,keep)=>{g.items=arr||[];if(!keep||g.fi>=g.items.length)g.fi=0;hover=-1};
  g.focusId=()=>g.items[g.fi]&&g.items[g.fi].id;
  g.isFocus=it=>g.items[g.fi]===it;
  g.held=()=>g.run&&!g.done&&(g.ptr||S.keys.has(' ')||S.keys.has('Enter'));
  g.voice=k=>{try{S.voicePlay(k+'_1')}catch(e){}};
  g.miss1=msg=>{g.miss++;g.shake=.35;S.sfx.ng();if(msg)S.toast(msg,'ng',3800);if(Math.random()<.5)g.voice('re_wrong')};
  g.good=msg=>{S.sfx.ok();if(msg)S.toast(msg,'ok',2600);if(Math.random()<.2)g.voice('re_good')};
  const stars=()=>g.miss===0&&g.time>=g.limit*.25?3:g.miss<=2?2:1;
  function finish(clear,detail){if(g.done)return;g.done=true;g.run=false;g.setItems([]);S.hideToast();
    const used=Math.round((g.limit-Math.max(0,g.time))*10)/10,st=clear?stars():0;
    S.flash(clear?'クリア！':'時間切れ…',clear?'ok':'ng');if(clear){S.sfx.fan();g.voice(st===3?'re_perfect':'re_clear')}else{S.sfx.ng();g.voice('re_timeout')}
    setTimeout(()=>{if(!g.dead&&res)res({clear,stars:st,used,miss:g.miss,left:Math.max(0,Math.ceil(g.time)),detail:detail||''})},1500)}
  g.win=d=>finish(true,d);g.lose=()=>finish(false,'');
  /* 準備のときに作業が出した「いまやること」と操作の説明は、スタートのときにもう一度出す（会話やチュートリアルで上書きされるため） */
  const cap={};
  g.start=()=>new Promise(r=>{res=r;g.run=true;t0=performance.now();if(cap.tag!=null)S.setTag(cap.tag);if(cap.hint!=null)S.setHint(cap.hint);S.flash('スタート！','ok');S.sfx.ok()});
  g.active=()=>g.run&&!g.done;
  g.update=dt=>{g.T+=dt;if(g.shake>0)g.shake-=dt;if(!g.run||g.done)return;
    if(!g.frozen){g.time-=dt;S.setTimer(g.time);if(!warned&&g.time<=10){warned=true;g.voice('re_hurry');S.sfx.tick()}if(g.time<=0){g.time=0;g.lose();return}}
    if(rep){if(!g.ptr2)rep=null;else{rep.t-=dt;if(rep.t<=0){rep.t=rep.it.rate||.085;if(rep.it.on&&!rep.it.off)rep.it.on(rep.it)}}}
    if(def.update)def.update(g,dt)};
  g.draw=t=>{const c=C();c.save();if(g.shake>0&&!S.reduceMotion)c.translate(Math.sin(g.T*70)*g.shake*3,0);def.draw(g,t);c.restore()};
  const hit=p=>g.items.findIndex(it=>!it.off&&p.x>=it.x&&p.x<=it.x+it.w&&p.y>=it.y&&p.y<=it.y+it.h);
  /* スタート直後の0.5秒は決定を受けつけない（会話を Enter 連打で進めた勢いで、まちがって選ばないように） */
  let t0=0;
  const fire=it=>{if(!it||it.off||!g.run||g.done)return;if(it.hold)return;if(performance.now()-t0<500)return;S.sfx.click();it.on&&it.on(it)};
  /* def.ptr(g,'down'|'move'|'up',p) が true を返したら、その作業が自分でマウス操作を処理する（つかんで動かす操作など）
     it.repeat のボタンは、押しつづけるとくり返す */
  g.onDown=p=>{if(!g.run||g.done)return;g.ptr2=true;if(def.ptr&&def.ptr(g,'down',p))return;const i=hit(p);if(i<0)return;g.fi=i;const it=g.items[i];if(it.hold)g.ptr=true;else{fire(it);if(it.repeat)rep={it,t:.36}}};
  g.onMove=(p,down)=>{if(def.ptr&&g.run&&!g.done&&def.ptr(g,'move',p,down))return;const i=hit(p);if(i>=0&&i!==hover){g.fi=i}hover=i;S.cv.style.cursor=i>=0?'pointer':'default'};
  g.onWheel=d=>{if(def.wheel&&g.run&&!g.done)def.wheel(g,d)};   /* マウスのホイール（CADの拡大・縮小など） */
  g.onUp=p=>{g.ptr=false;g.ptr2=false;rep=null;if(def.ptr&&g.run&&!g.done)def.ptr(g,'up',p)};
  g.onKey=(k,rep)=>{if(!g.run||g.done)return;if((k==='Enter'||k===' ')&&performance.now()-t0<500)return;if(def.key&&def.key(g,k,rep))return;
    if(k==='Enter'||k===' '){fire(g.items[g.fi]);return}
    if(/^[1-9]$/.test(k)){const i=g.items.findIndex(it=>String(it.n)===k&&!it.off);if(i>=0){g.fi=i;fire(g.items[i])}return}
    const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(!d||!g.items.length)return;
    const cur=g.items[g.fi],cx=cur.x+cur.w/2,cy=cur.y+cur.h/2;let best=-1,bs=1e9;
    g.items.forEach((it,i)=>{if(i===g.fi||it.off)return;const dx=it.x+it.w/2-cx,dy=it.y+it.h/2-cy,along=dx*d[0]+dy*d[1];if(along<=1)return;const across=Math.abs(dx*d[1])+Math.abs(dy*d[0]),sc=along+across*2.5;if(sc<bs){bs=sc;best=i}});
    if(best<0){const n=g.items.length;let i=g.fi;for(let q=0;q<n;q++){i=(i+(d[0]+d[1]>0?1:-1)+n)%n;if(!g.items[i].off){best=i;break}}}
    if(best>=0&&best!==g.fi){g.fi=best;S.sfx.tick()}};
  if(def.setup){const oT=S.setTag,oH=S.setHint;S.setTag=s=>{cap.tag=s;oT(s)};S.setHint=s=>{cap.hint=s;oH(s)};try{def.setup(g)}finally{S.setTag=oT;S.setHint=oH}}
  return g}

/* えらべるボタンを描く（番号つき）。it.state: 'ok' | 'ng' | 'done' */
function opt(g,it,o){o=o||{};const f=g.isFocus(it)&&g.active(),x=it.x,y=it.y,w=it.w,h=it.h,c=C();
  const fill=it.state==='ok'||it.state==='done'?'#1d4a35':it.state==='ng'?'#4a2420':it.off?'#141c26':f?'#2a3b4f':'#1d2a39';
  if(f&&!S.reduceMotion){c.save();c.shadowColor='rgba(246,194,28,.65)';c.shadowBlur=6*S.SC;rr(x,y,w,h,3,fill);c.restore()}
  rr(x,y,w,h,3,fill,f?PAL.acc:it.state==='ok'||it.state==='done'?PAL.ok:PAL.line,f?1.1:.6);
  let tx=x+5;if(it.n!=null){rr(x+3,y+h/2-4.5,9,9,2,f?PAL.acc:'#33455a');jt(String(it.n),x+7.5,y+h/2-3.6,f?'#1a1400':PAL.txt,6.2,'center');tx=x+16}
  const col=it.off?'#55626f':PAL.txt,size=o.size||6.6;
  if(it.sub){jt(it.label,tx,y+h/2-size*1.05,col,size);jt(it.sub,tx,y+h/2+.8,PAL.mut,5)}
  else if(o.center)jt(it.label,x+w/2,y+h/2-size*.6,col,size,'center');else jt(it.label,tx,y+h/2-size*.6,col,size)}
/* 進み具合の一覧（左のパネル用）。steps=['文',…]、now=いまの番号 */
function steps(x,y,list,now,lh){lh=lh||11;list.forEach((s,i)=>{check(x+3,y+i*lh+3.6,i<now,i===now);jt(s,x+10,y+i*lh,i<now?PAL.mut:i===now?PAL.txt:'#64717f',6)})}
S.T={PAL,rr,bg,panel,wrap,gauge,check,shuffle,make,opt,steps};
})();
