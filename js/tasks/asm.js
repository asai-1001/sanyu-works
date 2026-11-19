/* =====================================================================
   三友ワークス — 組立調整部門の作業
   6 組立（assemble）／ 7 調整（adjust）／ 8 検査・出荷検査（ship）
   ===================================================================== */
(()=>{
'use strict';
const S=SW,T=S.T,P=T.PAL,{R,circ,ring,line,jt,TAU}=S;
const KEYS='矢印キー：えらぶ　Enter：決定　数字キー：番号でえらぶ　（マウスのクリックでもOK）';

/* ---------- 絵の部品（Ver. 2.4：金属の質感） ---------- */
const Mt=S.Metal;
/* 土台の板（ステンレスのヘアライン仕上げ） */
function basePlate(c){c.save();c.fillStyle='rgba(0,0,0,.35)';T.rr(153,35,138,100,7,null);c.fill();
  c.fillStyle=Mt.vGrad(c,32,132,['#e6ebef','#c3cbd2','#aab3bc','#cfd6dc']);T.rr(150,32,138,100,7,null);c.fill();c.save();T.rr(150,32,138,100,7,null);c.clip();
  c.globalAlpha=.22;c.strokeStyle='#ffffff';c.lineWidth=.2;for(let y=33;y<132;y+=.9){c.beginPath();c.moveTo(150,y);c.lineTo(288,y+.3);c.stroke()}c.globalAlpha=1;
  const gl=c.createLinearGradient(150,32,288,132);gl.addColorStop(0,'rgba(255,255,255,.25)');gl.addColorStop(.45,'rgba(255,255,255,0)');gl.addColorStop(.7,'rgba(255,255,255,.12)');gl.addColorStop(1,'rgba(0,0,0,.1)');c.fillStyle=gl;c.fillRect(150,32,138,100);c.restore();
  c.strokeStyle='#7d8792';c.lineWidth=.6;T.rr(150,32,138,100,7,null);c.stroke();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.4;T.rr(151.2,33.2,135.6,97.6,6,null);c.stroke();c.restore()}
/* 上から見たさんぽぽの体（黄銅の球） */
function bodyTop(c,x,y,r){c.save();c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.arc(x+2,y+2.5,r+.5,0,TAU);c.fill();
  const gr=c.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);gr.addColorStop(0,'#fff6cf');gr.addColorStop(.25,'#f6cf63');gr.addColorStop(.75,'#c58f22');gr.addColorStop(1,'#7a540f');c.fillStyle=gr;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  c.strokeStyle='rgba(110,74,12,.7)';c.lineWidth=.4;c.stroke();c.restore()}
/* ねじの頭（なべ小ねじ・十字穴）。up：浮き具合、rot：十字の向き、st：0 まだ／1 仮締め／2 本締め */
function screwHead(c,x,y,up,rot,st,focus){c.save();
  /* 下穴（座ぐり） */const hg=c.createRadialGradient(x,y,1,x,y,8.2);hg.addColorStop(0,'#2a3038');hg.addColorStop(.85,'#59626c');hg.addColorStop(1,'#9aa4ae');c.fillStyle=hg;c.beginPath();c.arc(x,y,8.2,0,TAU);c.fill();
  const yy=y-up*.5;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.arc(x+up*.5,y+up*.9,7,0,TAU);c.fill();
  const g2=c.createRadialGradient(x-2.2,yy-2.6,.4,x,yy,7);g2.addColorStop(0,'#ffffff');g2.addColorStop(.35,'#d7dde3');g2.addColorStop(.8,'#8c96a1');g2.addColorStop(1,'#59626c');c.fillStyle=g2;c.beginPath();c.arc(x,yy,7,0,TAU);c.fill();
  /* 十字のみぞ */c.translate(x,yy);c.rotate(rot);c.fillStyle='#20262d';c.beginPath();c.moveTo(-4.2,-.9);c.lineTo(-.9,-.9);c.lineTo(-.9,-4.2);c.lineTo(.9,-4.2);c.lineTo(.9,-.9);c.lineTo(4.2,-.9);c.lineTo(4.2,.9);c.lineTo(.9,.9);c.lineTo(.9,4.2);c.lineTo(-.9,4.2);c.lineTo(-.9,.9);c.lineTo(-4.2,.9);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.25;c.beginPath();c.moveTo(-4.2,.9);c.lineTo(-.9,.9);c.lineTo(-.9,4.2);c.stroke();c.restore();
  /* 状態の輪（黄色：仮締め、緑：本締め） */c.save();if(st>0){c.strokeStyle=st>=2?'#4fd28f':'#f6c21c';c.lineWidth=.9;c.beginPath();c.arc(x,yy,8.6,0,TAU);c.stroke()}
  if(focus){c.strokeStyle=P.acc;c.lineWidth=1.3;c.beginPath();c.arc(x,yy,10,0,TAU);c.stroke()}c.restore()}
/* ねじを回しているドライバー（ななめ上から見たところ） */
function driver(c,x,y,rot){c.save();c.translate(x,y);
  c.fillStyle=Mt.cylGrad(c,-1.2,1.2,Mt.STEEL);c.beginPath();c.moveTo(-1.1,0);c.lineTo(1.1,0);c.lineTo(5.5,-14);c.lineTo(3.3,-14.6);c.closePath();c.fill();
  c.save();c.translate(6,-16);c.rotate(.3);const hg=Mt.cylGrad(c,-3.4,3.4,['#7a1a12','#e0473a','#ff9c8a','#c8372d','#6a140e']);c.fillStyle=hg;T.rr(-3.4,-15,6.8,15,3,null);c.fill();
  c.strokeStyle='rgba(60,10,6,.5)';c.lineWidth=.3;for(let k=0;k<4;k++){const xx=-2.4+((k*1.6+rot*2)%6.4+6.4)%6.4;c.beginPath();c.moveTo(xx,-14);c.lineTo(xx,-1);c.stroke()}c.restore();c.restore()}
/* コネクタの箱 */
function connBox(c){c.save();c.fillStyle='rgba(0,0,0,.35)';T.rr(258,32,36,104,3,null);c.fill();c.fillStyle=Mt.cylGrad(c,256,292,['#1f2a35','#3a4858','#2c3846','#1b242e']);T.rr(256,30,36,104,3,null);c.fill();
  c.strokeStyle='#59646f';c.lineWidth=.5;c.stroke();c.fillStyle='rgba(255,255,255,.06)';c.fillRect(257,31,34,3);c.restore()}

/* ---------- 6 組立 ---------- */
const WIRES=[{n:'赤',c:'#e0463a',use:'電池 ＋'},{n:'黒',c:'#39424d',use:'電池 －'},{n:'黄',c:'#e8b61e',use:'左目のLED'},{n:'青',c:'#3a7fd9',use:'右目のLED'}];
function AssembleGame(){
  let ph=0,pass=0,order=[],tight=[0,0,0,0],fin=0;
  const map=T.shuffle([0,1,2,3]);            /* map[端子] = つなぐ線の番号 */
  const conn=[-1,-1,-1,-1];                  /* conn[端子] = つないだ線 */
  const SC_POS=[[166,48],[272,48],[272,116],[166,116]],DIAG=[2,3,0,1];
  /* ねじ締めの動き：turn=回した角度、anim=いま回しているねじ */
  const turn=[0,0,0,0],sink=[0,0,0,0];let anim=null,flashT=0,flashI=-1;
  /* 配線：held=いまつかんでいる線、drag=マウスで引っぱっている最中か、mx,my=線の先の位置 */
  let held=-1,drag=false,mx=0,my=0,moved=0;
  const WY=k=>44+k*24,WX=158,TR=tm=>({x:226,y:36+tm*24,w:62,h:19});
  const wireAt=p=>WIRES.findIndex((w,k)=>!conn.includes(k)&&p.x>=128&&p.x<=182&&Math.abs(p.y-WY(k))<=10);
  const termAt=p=>[0,1,2,3].findIndex(tm=>{const r=TR(tm);return p.x>=r.x-8&&p.x<=r.x+r.w+4&&p.y>=r.y-3&&p.y<=r.y+r.h+3});
  const g=T.make({limit:120,
    setup(g){screws(g)},
    update(g,dt){
      if(flashT>0)flashT-=dt;
      if(anim){anim.t+=dt;const k=Math.min(1,anim.t/anim.dur),i=anim.i;turn[i]=anim.a0+k*anim.da;sink[i]=anim.s0+k*.5;
        anim.tick-=dt;if(anim.tick<=0){anim.tick=pass?.11:.07;S.tone(pass?220+k*260:520,.03,'square',.03);S.noise(.03,.02,pass?700:1500)}
        if(k>=1){const p2=anim.pass;anim=null;tight[i]=p2+1;flashT=.45;flashI=i;if(p2){S.sfx.click();S.tone(1500,.05,'square',.05)}else S.sfx.tick();afterScrew(g)}}
      if(ph===2){fin=Math.min(1,fin+dt/1.8);if(fin>=1&&!g.done)g.win('ねじ締め8回と、配線4本を完了。')}},
    /* 配線：線のはしをつかんで、端子まで引っぱってはなす（クリック → クリックでもつなげる） */
    ptr(g,type,p,down){if(ph!==1)return false;
      if(type==='down'){const tm=termAt(p);if(held>=0&&tm>=0){connect(g,tm);return true}
        const k=wireAt(p);if(k>=0){held=k;drag=true;moved=0;mx=p.x;my=p.y;S.sfx.click();showTerms(g)}return true}
      if(type==='move'){if(held>=0&&(drag&&down||!drag)){moved+=Math.abs(p.x-mx)+Math.abs(p.y-my);mx=p.x;my=p.y}
        S.cv.style.cursor=held>=0?(drag?'grabbing':'pointer'):wireAt(p)>=0?'grab':'default';const tm=termAt(p);if(held>=0&&tm>=0){const i=g.items.findIndex(it=>it.tm===tm);if(i>=0)g.fi=i}return true}
      if(drag){drag=false;const tm=termAt(p);if(tm>=0)connect(g,tm);else if(moved>12){held=-1;showWires(g)}}return true},
    draw(g,t){
      T.bg();const c=S.getCtx();
      T.panel(8,8,112,164,ph===0?'組立図　ねじ締め':'配線図',true);
      if(ph===0){T.wrap('土台のねじ4本を締める。',13,23,102,5.8,P.ink,8);T.wrap('きまり：1本締めたら、次は「ななめ向かい」のねじ。かたよって締めると、土台がゆがむよ。',13,34,102,5.6,P.ink,7.8);
        c.strokeStyle=P.ink;c.lineWidth=.6;c.strokeRect(34,78,60,40);[[40,84],[88,84],[88,112],[40,112]].forEach(([x,y])=>{ring(x,y,3,P.ink,null,.6)});line(40,84,88,112,'#c8372d',.6,[2,1.5]);line(88,84,40,112,'#1f5fae',.6,[2,1.5]);jt('ななめ向かいがペア',64,124,P.inkmut,5,'center');
        jt('1回目：仮締め（軽く）',13,138,pass===0?P.ink:P.inkmut,5.8);jt('2回目：本締め（しっかり）',13,148,pass===1?P.ink:P.inkmut,5.8);T.check(108,141,pass>0,pass===0);T.check(108,151,ph>0,pass===1&&ph===0)}
      else{jt('端子',16,24,P.inkmut,5);jt('線の色',44,24,P.inkmut,5);jt('つなぐ先',78,24,P.inkmut,5);
        map.forEach((w,tm)=>{const y=36+tm*20,now=ph===1&&w===held;if(now)T.rr(11,y-3,106,17,2,'#fff3c4');jt(String(tm+1),20,y,P.ink,8,'center');R(44,y+1,14,7,WIRES[w].c);jt(WIRES[w].n,62,y,P.ink,6.4);jt(WIRES[w].use,78,y+1,P.inkmut,5);T.check(110,y+5,conn[tm]>=0,false)});
        T.wrap('線をつかんだら、その色をこの表でさがそう。その行の番号の端子まで、線をのばしてつなぐよ。',13,120,102,5.6,P.ink,7.8)}
      T.panel(126,8,186,164,ph===0?'土台（上から見た図）　'+(pass===0?'仮締め':'本締め'):ph===1?'コネクタ':'組立完了');
      if(ph===0){basePlate(c);bodyTop(c,219,82,33);jt('さんぽぽ 本体',219,78,'rgba(90,60,10,.75)',5.6,'center');
        g.items.forEach(it=>{const f=g.isFocus(it)&&g.active(),[x,y]=SC_POS[it.i],st=tight[it.i],up=(1-Math.min(1,sink[it.i]))*2.4,on=anim&&anim.i===it.i;
          /* ねじ穴 → 影 → ねじの頭（締めるほど沈んで、十字のみぞが回る） */
          screwHead(c,x,y,up,turn[it.i],st,f);
          if(on){/* ドライバーと、回っているしるし */c.save();c.translate(x,y-up*.5);c.strokeStyle=P.acc;c.lineWidth=1;c.beginPath();c.arc(0,0,10.5,turn[it.i],turn[it.i]+4.2);c.stroke();const a=turn[it.i]+4.2;c.fillStyle=P.acc;c.beginPath();c.moveTo(Math.cos(a)*10.5-Math.sin(a)*-3,Math.sin(a)*10.5+Math.cos(a)*-3);c.lineTo(Math.cos(a)*13,Math.sin(a)*13);c.lineTo(Math.cos(a)*8,Math.sin(a)*8);c.fill();c.restore();
            driver(c,x,y-up*.5,turn[it.i])}
          if(flashT>0&&flashI===it.i){ring(x,y,7+(.45-flashT)*26,`rgba(${st>=2?'79,210,143':'246,194,28'},${flashT*2})`,null,1.2);if(st>=2)jt('カチッ',x,y-19,P.ok,6,'center')}
          const k=order.indexOf(it.i);if(k>=0)jt(String(k+1),x,y+9,P.ok,5.6,'center');jt(String(it.n),x+(it.i%3?10:-10),y-12,f?P.acc:P.mut,5.6,'center')});
        jt(anim?(pass?'しっかり締めている…':'軽く締めている…'):order.length?'次は、どのねじ？':'どのねじから始めてもOK',219,140,anim?P.acc:P.txt,6.4,'center')}
      if(ph===1){connBox(c);
        /* つないだ線 */conn.forEach((w,tm)=>{if(w<0)return;const r=TR(tm),y=r.y+r.h/2;wire(c,WX,WY(w),r.x+6,y,WIRES[w].c)});
        /* 線の束（左） */WIRES.forEach((w,k)=>{const y=WY(k),used=conn.includes(k),f=held<0&&g.items[g.fi]&&g.items[g.fi].wk===k&&g.active();R(132,y-2,26,4,used?'#39424d':w.c);jt(w.n,134,y-11,used?'#55626f':P.txt,5.6);
          if(!used&&k!==held){circ(WX+2,y,3.4,w.c);ring(WX+2,y,3.4,'#fff',null,.7);if(f)T.rr(129,y-13,36,20,3,null,P.acc,1)}});
        /* 端子 */[0,1,2,3].forEach(tm=>{const r=TR(tm),y=r.y+r.h/2,it=g.items.find(i=>i.tm===tm),f=it&&g.isFocus(it)&&g.active();T.rr(r.x,r.y,r.w,r.h,3,conn[tm]>=0?'#1d4a35':f?'#2a3b4f':'#1d2a39',f?P.acc:P.line,f?1.1:.6);circ(r.x+9,y,3.2,conn[tm]>=0?WIRES[conn[tm]].c:'#0a0f15');ring(r.x+9,y,3.2,'#8a94a0',null,.5);jt('端子 '+(tm+1),r.x+16,y-3.6,P.txt,6.4)});
        /* つかんでいる線（マウスの位置、またはキーボードでえらんでいる端子までのびる） */
        if(held>=0){let ex=mx,ey=my;if(!drag&&moved<1){const it=g.items[g.fi];if(it&&it.tm!=null){const r=TR(it.tm);ex=r.x-2;ey=r.y+r.h/2}else{ex=WX+26;ey=WY(held)}}
          wire(c,WX,WY(held),ex,ey,WIRES[held].c);circ(ex,ey,3.6,WIRES[held].c);ring(ex,ey,3.6,'#fff',null,.8)}
        jt(held>=0?'「'+WIRES[held].n+'」の線を、配線図どおりの端子へ':'線のはしを、つかもう',191,142,P.txt,6.2,'center')}
      if(ph===2){R(128,20,182,150,'#0a1118');S.Sanpo.draw(c,150,24,138,130,{yaw:.5+t*.4,explode:(1-fin)*(1-fin),base:true});jt('部品を組み合わせて…',219,156,P.acc,6.6,'center')}
    }});
  function wire(c,x0,y0,x1,y1,col){c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2.6;c.beginPath();c.moveTo(x0,y0+1);c.bezierCurveTo(x0+(x1-x0)*.5,y0+1,x0+(x1-x0)*.5,y1+1,x1,y1+1);c.stroke();c.strokeStyle=col;c.lineWidth=1.8;c.beginPath();c.moveTo(x0,y0);c.bezierCurveTo(x0+(x1-x0)*.5,y0,x0+(x1-x0)*.5,y1,x1,y1);c.stroke()}
  function screws(g){order=[];g.setItems(SC_POS.map(([x,y],i)=>({id:'s'+i,i,n:i+1,x:x-11,y:y-11,w:22,h:22,on(it){
      if(anim||order.includes(it.i))return;
      if(order.length===1&&it.i!==DIAG[order[0]]){g.miss1('次は「ななめ向かい」のねじだよ。となりを先に締めると、土台がゆがんでしまう。');return}
      order.push(it.i);anim={i:it.i,pass,t:0,dur:pass?.85:.5,a0:turn[it.i],da:pass?Math.PI*1.5:Math.PI*4,s0:sink[it.i],tick:0}}})),true);
    S.setTag('いまやること：ねじを「ななめ向かい」の順に締める（'+(pass===0?'仮締め':'本締め')+'）');S.setHint(KEYS)}
  function afterScrew(g){if(order.length<4)return;if(pass===0){pass=1;g.good('仮締めOK。次は、同じ考え方で本締め！');screws(g)}else{g.good('ねじ締め完了！');ph=1;showWires(g)}}
  /* キーボードでは、まず線をえらび（つかむ）、次に端子をえらぶ */
  function showWires(g){held=-1;drag=false;g.setItems(WIRES.map((w,k)=>conn.includes(k)?null:{id:'w'+k,wk:k,n:k+1,x:128,y:WY(k)-12,w:54,h:22,on(it){held=it.wk;moved=0;S.sfx.click();showTerms(g)}}).filter(Boolean));
    S.setTag('いまやること：線のはしをつかむ');S.setHint('マウス：線のはしを押したまま、端子まで引っぱってはなす　／　キーボード：↑↓で線をえらんでEnter → ↑↓で端子をえらんでEnter');S.cv.style.cursor='default'}
  function showTerms(g){g.setItems([0,1,2,3].map(tm=>Object.assign(TR(tm),{id:'t'+tm,tm,n:tm+1,on(it){connect(g,it.tm)}})));
    S.setTag('いまやること：「'+WIRES[held].n+'」の線を、配線図どおりの端子につなぐ')}
  function connect(g,tm){if(held<0)return;const w=held;
    if(conn[tm]>=0){S.toast('その端子は、もうつないであるよ。','',2000);held=-1;showWires(g);return}
    if(map[tm]!==w){g.miss1('配線図を見てみよう。「'+WIRES[w].n+'」の線は、端子 '+(map.indexOf(w)+1)+' につなぐよ。');held=-1;showWires(g);return}
    conn[tm]=w;held=-1;drag=false;S.sfx.click();S.tone(900,.06,'triangle',.05);
    if(conn.every(x=>x>=0)){g.good('配線完了！');ph=2;g.frozen=true;g.setItems([]);S.setTag('組立完了！');S.cv.style.cursor='default'}else showWires(g)}
  g.dbg=()=>({ph,pass,order:order.slice(),anim:!!anim,held,map:map.slice(),conn:conn.slice()});
  return g}
S.STAGES.push({id:'assemble',dept:'as',name:'組立',limit:120,lines:'assemble',hint:KEYS,make:AssembleGame,
  tut:[
    {text:'まずは、ねじ締め。右の図の4本のねじを、矢印キーでえらんでEnter（またはクリック）で締めるよ。',spot:[126,8,186,164],card:'bottom'},
    {text:'きまりは1つ。1本締めたら、次は「ななめ向かい」のねじ。仮締めと本締めで、2まわり締めるよ。',spot:[8,8,112,164],card:'bottom'},
    {text:'ねじが終わったら配線。線のはしをつかんで、配線図どおりの番号の端子まで引っぱってつなぐよ。キーボードなら、↑↓で線をえらんでEnter、つぎに端子をえらんでEnter。制限時間は120秒！'}
  ]});

/* ---------- 7 調整 ---------- */
function AdjustGame(){
  let v=[25+(Math.random()*20|0),88+(Math.random()*10|0)],sel=0;
  const bright=()=>[v[0],Math.round(v[1]*.8+8)],LO=68,HI=72;
  const inBand=b=>b>=LO&&b<=HI;
  const g=T.make({limit:60,
    setup(g){const row=e=>[[-5,'−5'],[-1,'−1'],[1,'＋1'],[5,'＋5']].map(([d,l],k)=>({id:'e'+e+k,e,repeat:true,x:176+k*33,y:e?116:66,w:30,h:17,label:l,on(){sel=e;adj(d)}}));
      g.setItems([...row(0),...row(1),{id:'ok',n:1,x:186,y:146,w:112,h:20,label:'これで確定する',on(){confirm(g)}}]);g.fi=2;
      S.setTag('いまやること：左右の目の明るさを、どちらも緑のはんい（68〜72%）に合わせる');S.setHint('↑↓：左目・右目を切りかえ　←→：明るさを変える（押しつづけると連続で変わる）　Enter：確定　（ボタンも長押しできます）')},
    key(g,k){if(k==='ArrowUp'||k==='ArrowDown'){sel=1-sel;S.sfx.tick();return true}if(k==='ArrowLeft'){adj(-1);return true}if(k==='ArrowRight'){adj(1);return true}if(k==='Enter'||k===' '){confirm(g);return true}return false},
    draw(g,t){
      T.bg();const b=bright(),c=S.getCtx();
      T.panel(8,8,150,164,'さんぽぽ（点灯中）');R(10,20,146,150,'#070b10');S.Sanpo.draw(c,12,24,142,132,{yaw:Math.sin(t*.6)*.25,base:true,glow:[Math.pow(b[0]/100,1.6),Math.pow(b[1]/100,1.6)],dist:6.9});
      jt('左目',50,158,P.mut,5.6,'center');jt('右目',116,158,P.mut,5.6,'center');
      T.panel(164,8,148,164,'調整　目の明るさ');jt('ねらい：左右とも 68〜72 %',170,23,P.acc,6);
      [0,1].forEach(e=>{const y=e?86:36,on=sel===e;if(on)T.rr(167,y-3,142,49,3,'rgba(246,194,28,.08)',P.acc,.7);jt((e?'右目':'左目')+'の明るさ',172,y,on?P.txt:P.mut,6.4);jt(b[e]+' %',304,y-1,inBand(b[e])?P.ok:P.txt,8,'right');T.gauge(172,y+12,132,8,b[e]/100,LO/100,(HI+.9)/100);jt('つまみ '+v[e],172,y+22.5,P.mut,4.8)});
      g.items.forEach(it=>{if(it.id==='ok')T.opt(g,it,{center:true});else{const f=g.isFocus(it)&&g.active();T.rr(it.x,it.y,it.w,it.h,3,f?'#2a3b4f':'#1d2a39',f?P.acc:P.line,f?1:.6);jt(it.label,it.x+it.w/2,it.y+5,P.txt,6.2,'center')}});
      jt('同じつまみの数字でも、左右で明るさがちがうよ',238,136,P.mut,4.8,'center');
    }});
  function adj(d){v[sel]=S.clamp(v[sel]+d,0,100);S.tone(500+v[sel]*6,.03,'triangle',.03)}
  function confirm(g){const b=bright();if(inBand(b[0])&&inBand(b[1])){g.frozen=true;g.setItems([]);S.setTag('調整完了！');setTimeout(()=>g.win('左目 '+b[0]+'%、右目 '+b[1]+'% にそろえた。'),700)}
    else g.miss1((!inBand(b[0])?'左目':'右目')+'が、まだ緑のはんいに入っていないよ。68〜72%に合わせよう。')}
  g.dbg=()=>({v:v.slice(),b:bright(),sel});
  return g}
S.STAGES.push({id:'adjust',dept:'as',name:'調整',limit:60,lines:'adjust',hint:'',make:AdjustGame,
  tut:[
    {text:'左が、いま光っているさんぽぽ。右のつまみで、左右の目の明るさを変えられるよ。',spot:[8,8,150,164],card:'bottom'},
    {text:'↑↓キーで左目・右目を切りかえて、←→キーで明るさを変える。ボタンのクリックでもOK。',spot:[164,8,148,134],card:'bottom'},
    {text:'左右とも緑のはんい（68〜72%）に入ったら、Enterで確定。部品には個体差があるから、つまみの数字は左右でちがってくるよ。制限時間は60秒！'}
  ]});

/* ---------- 8 検査（出荷検査） ---------- */
function ShipGame(){
  const lightBad=Math.random()<.25,nm=[0,1,1,2][Math.random()*4|0];
  const marks=T.shuffle([0,60,120,180,240,300]).slice(0,nm).map(a=>({a:a+(Math.random()*16-8),y:Math.random()*.7-.35,k:Math.random()<.5?'scratch':'dirt',found:false}));
  let ph=0,on=false,view=0,seen=new Set([0]);
  const wrapD=d=>((d+540)%360)-180;
  const g=T.make({limit:60,
    setup(g){g.setItems([{id:'sw',n:1,x:186,y:120,w:112,h:22,label:'スイッチを入れる',on(){on=true;S.sfx.click();S.tone(880,.2,'sine',.05);
      g.setItems([{id:'y',n:1,x:170,y:112,w:138,h:20,label:'両目とも明るく光った',on(){lightJ(g,true)}},{id:'n',n:2,x:170,y:136,w:138,h:20,label:'光り方がおかしい',on(){lightJ(g,false)}}]);S.setTag('いまやること：両目がちゃんと光ったか、見て答える')}}]);
      S.setTag('いまやること：スイッチを入れて、点灯試験をする');S.setHint('矢印キー：えらぶ　Enter：決定　数字キー：番号でえらぶ　（マウスのクリックでもOK）')},
    key(g,k){if(ph!==1)return false;if(k==='ArrowLeft'){rot(-10);return true}if(k==='ArrowRight'){rot(10);return true}return false},
    draw(g,t){
      T.bg();const c=S.getCtx();
      T.panel(8,8,150,164,'検査台');R(10,20,146,150,'#0a1118');
      S.Sanpo.draw(c,12,22,142,134,{yaw:-view*Math.PI/180,base:true,glow:on?(lightBad?[1,.06]:[1,1]):[0,0],marks:ph>=1?marks:[],dist:6.6});
      if(ph===1){jt('◀',16,84,P.mut,9);jt('▶',144,84,P.mut,9);jt('向き '+(((Math.round(view)%360)+360)%360)+'°',83,158,P.mut,5.6,'center')}
      T.panel(164,8,148,164,'出荷検査表');
      T.steps(170,24,['点灯試験','外観検査（キズ・よごれ）','合格・不合格の判定'],ph,11);
      if(ph===0)T.wrap(on?'両方の目が、同じように明るく光っているかな？':'まず、スイッチを入れて、目が光るかを確かめよう。',170,64,136,6,P.txt,9);
      if(ph===1){T.wrap('←→キーで回して、ぐるっと1周ぜんぶ見よう。キズ（白い線）やよごれ（黒い点）が正面に見えたら「記録」。',170,60,136,5.8,P.txt,8.4);
        jt('記録した数：'+marks.filter(m=>m.found).length,170,96,P.acc,6.6);const pct=Math.round(seen.size/18*100);jt('見たはんい',240,96,P.mut,5);T.gauge(270,96,36,6,seen.size/18,0,1,P.cad)}
      if(ph===2)T.wrap('点灯試験と外観検査の結果から、このまま出荷してよいかを決めよう。',170,64,136,6,P.txt,9);
      g.items.forEach(it=>T.opt(g,it,{size:6.2}));
    }});
  function rot(d){view+=d;seen.add((((Math.round(view/20)%18)+18)%18));S.sfx.tick()}
  function lightJ(g,sayOk){if(sayOk===!lightBad)g.good(lightBad?'そのとおり。右目が暗い。記録しておこう。':'OK！ 両目とも正常に点灯。');else g.miss1(lightBad?'よく見て。右目がほとんど光っていないよ。':'両目とも、同じ明るさで光っているよ。');
    ph=1;g.setItems([{id:'l',repeat:true,x:170,y:108,w:30,h:18,label:'◀ 回す',on(){rot(-10)}},{id:'r',repeat:true,x:204,y:108,w:30,h:18,label:'回す ▶',on(){rot(10)}},{id:'rec',n:1,x:170,y:130,w:66,h:20,label:'ここを記録',on(){rec(g)}},{id:'nx',n:2,x:240,y:130,w:66,h:20,label:'ぜんぶ見た',on(){next(g)}}]);g.fi=2;
    S.setTag('いまやること：回して1周見て、キズやよごれを記録する');S.setHint('←→：回す（押しつづけると連続で回る）　↑↓：ボタンをえらぶ　Enter：決定　数字キー 1：記録　2：ぜんぶ見た　（ボタンも長押しできます）')}
  function rec(g){const m=marks.find(m=>!m.found&&Math.abs(wrapD(m.a-view))<=32);if(m){m.found=true;g.good((m.k==='dirt'?'よごれ':'キズ')+'を記録！')}
    else if(marks.some(m=>m.found&&Math.abs(wrapD(m.a-view))<=32))S.toast('そこは、もう記録してあるよ。','',2000);else g.miss1('ここには、キズもよごれも見当たらないよ。');}
  function next(g){if(seen.size<14){S.toast('まだ見ていない向きがあるよ。ぐるっと1周、回してみよう。','',2600);return}
    ph=2;g.setItems([{id:'ok',n:1,x:170,y:108,w:138,h:20,label:'合格：このまま出荷する',on(){fin(g,true)}},{id:'ng',n:2,x:170,y:132,w:138,h:20,label:'不合格：手直しに回す',on(){fin(g,false)}}]);S.setTag('いまやること：合格か不合格かを判定する');S.setHint('矢印キー：えらぶ　Enter：決定　数字キー：番号でえらぶ　（マウスのクリックでもOK）')}
  function fin(g,sayOk){const bad=lightBad||marks.length>0,missed=marks.filter(m=>!m.found).length;
    if(sayOk===!bad)g.good(bad?'正しい判定！ 手直しをして、もう一度検査。合格になったよ。':'正しい判定！ 不良なし。');else g.miss1(bad?'見のがしがあったよ。'+(lightBad?'右目が暗い。':'')+(marks.length?'キズ・よごれが'+marks.length+'か所。':'')+'手直しに回そう。':'不良は見つかっていないよ。合格で出荷できる。');
    g.frozen=true;g.setItems([]);setTimeout(()=>g.win(bad?'不良'+((lightBad?1:0)+marks.length)+'件（見つけた数 '+((lightBad?1:0)+marks.length-missed)+'）。手直しのあと合格。':'不良なし。合格で出荷。'),1100)}
  g.dbg=()=>({ph,on,lightBad,view,marks:marks.map(m=>({a:m.a,found:m.found})),seen:seen.size});
  return g}
S.STAGES.push({id:'ship',dept:'as',name:'検査（出荷検査）',limit:60,lines:'ship',hint:KEYS,make:ShipGame,
  tut:[
    {text:'出荷検査は3つの順番。点灯試験 → 外観検査 → 合格・不合格の判定だよ。',spot:[164,8,148,164],card:'bottom'},
    {text:'外観検査では、←→キーでさんぽぽを回して、1周ぜんぶ見る。白い線（キズ）や黒い点（よごれ）が正面に見えたら「記録」。',spot:[8,8,150,164],card:'bottom'},
    {text:'不良は、あるかもしれないし、ないかもしれない。何もないところを記録するとミスになるよ。制限時間は60秒！'}
  ]});
})();
