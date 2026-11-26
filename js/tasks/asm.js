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
/* ねじの頭（なべ小ねじ・十字穴）。up：浮き具合、rot：十字の向き、st：0 まだ／2 締め終わり */
function screwHead(c,x,y,up,rot,st,focus){c.save();
  /* 下穴（座ぐり） */const hg=c.createRadialGradient(x,y,1,x,y,8.2);hg.addColorStop(0,'#2a3038');hg.addColorStop(.85,'#59626c');hg.addColorStop(1,'#9aa4ae');c.fillStyle=hg;c.beginPath();c.arc(x,y,8.2,0,TAU);c.fill();
  const yy=y-up*.5;c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.arc(x+up*.5,y+up*.9,7,0,TAU);c.fill();
  const g2=c.createRadialGradient(x-2.2,yy-2.6,.4,x,yy,7);g2.addColorStop(0,'#ffffff');g2.addColorStop(.35,'#d7dde3');g2.addColorStop(.8,'#8c96a1');g2.addColorStop(1,'#59626c');c.fillStyle=g2;c.beginPath();c.arc(x,yy,7,0,TAU);c.fill();
  /* 十字のみぞ */c.translate(x,yy);c.rotate(rot);c.fillStyle='#20262d';c.beginPath();c.moveTo(-4.2,-.9);c.lineTo(-.9,-.9);c.lineTo(-.9,-4.2);c.lineTo(.9,-4.2);c.lineTo(.9,-.9);c.lineTo(4.2,-.9);c.lineTo(4.2,.9);c.lineTo(.9,.9);c.lineTo(.9,4.2);c.lineTo(-.9,4.2);c.lineTo(-.9,.9);c.lineTo(-4.2,.9);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.25;c.beginPath();c.moveTo(-4.2,.9);c.lineTo(-.9,.9);c.lineTo(-.9,4.2);c.stroke();c.restore();
  /* 状態の輪（緑：締め終わり） */c.save();if(st>0){c.strokeStyle=st>=2?'#4fd28f':'#f6c21c';c.lineWidth=.9;c.beginPath();c.arc(x,yy,8.6,0,TAU);c.stroke()}
  if(focus){c.strokeStyle=P.acc;c.lineWidth=1.3;c.beginPath();c.arc(x,yy,10,0,TAU);c.stroke()}c.restore()}
/* ねじを回しているドライバー（ななめ上から見たところ） */
function driver(c,x,y,rot){c.save();c.translate(x,y);
  c.fillStyle=Mt.cylGrad(c,-1.2,1.2,Mt.STEEL);c.beginPath();c.moveTo(-1.1,0);c.lineTo(1.1,0);c.lineTo(5.5,-14);c.lineTo(3.3,-14.6);c.closePath();c.fill();
  c.save();c.translate(6,-16);c.rotate(.3);const hg=Mt.cylGrad(c,-3.4,3.4,['#7a1a12','#e0473a','#ff9c8a','#c8372d','#6a140e']);c.fillStyle=hg;T.rr(-3.4,-15,6.8,15,3,null);c.fill();
  c.strokeStyle='rgba(60,10,6,.5)';c.lineWidth=.3;for(let k=0;k<4;k++){const xx=-2.4+((k*1.6+rot*2)%6.4+6.4)%6.4;c.beginPath();c.moveTo(xx,-14);c.lineTo(xx,-1);c.stroke()}c.restore();c.restore()}

/* ---------- 6 組立（Ver. 2.9.6：ねじ締めは1回だけ・ドライバーを回して締める／配線は基板の端子の名前を見てつなぐ） ---------- */
/* 線の色と、つなぐ先（基板に印刷してある端子の名前）。配線図・基板・ランプがみんな同じ名前を使う */
const WIRES=[{n:'赤',c:'#e0463a',hi:'#ff9a8c',to:'電池 ＋',sym:'bat+'},{n:'黒',c:'#2b323a',hi:'#7c8794',to:'電池 −',sym:'bat-'},{n:'黄',c:'#e8b61e',hi:'#fff0a6',to:'左目 LED',sym:'ledL'},{n:'青',c:'#3a7fd9',hi:'#a9cdff',to:'右目 LED',sym:'ledR'}];
/* 基板（コネクタ）。端子台は左はし、ラベルは端子の右に白い文字で印刷 */
const PCB={x:198,y:24,w:108,h:118},TB={x:198,w:20},TY=tm=>38+tm*25,WIN=tm=>({x:TB.x-2,y:TY(tm)}),WEND=k=>({x:170,y:40+k*25});
function pcb(c,t,termFn,conn,focusTm){
  c.save();c.fillStyle='rgba(0,0,0,.4)';T.rr(PCB.x+3,PCB.y+3,PCB.w,PCB.h,4,null);c.fill();
  const g=c.createLinearGradient(PCB.x,PCB.y,PCB.x+PCB.w,PCB.y+PCB.h);g.addColorStop(0,'#1f6a45');g.addColorStop(1,'#134a30');c.fillStyle=g;T.rr(PCB.x,PCB.y,PCB.w,PCB.h,4,null);c.fill();
  c.strokeStyle='#0d3824';c.lineWidth=.6;c.stroke();
  /* 取りつけ穴 */[[PCB.x+6,PCB.y+6],[PCB.x+PCB.w-6,PCB.y+6],[PCB.x+6,PCB.y+PCB.h-6],[PCB.x+PCB.w-6,PCB.y+PCB.h-6]].forEach(([x,y])=>{circ(x,y,2.6,'#c9a43c');circ(x,y,1.4,'#0b1d14')});
  /* マイコン（黒い部品）と、そこへのびる銅の配線パターン */
  const ic={x:PCB.x+66,y:PCB.y+40,w:26,h:30};
  c.strokeStyle='rgba(214,180,84,.55)';c.lineWidth=1.1;c.lineJoin='round';
  [0,1,2,3].forEach(tm=>{const y=TY(tm)+5,py=ic.y+5+tm*6.5;c.beginPath();c.moveTo(TB.x+TB.w,y);c.lineTo(PCB.x+40+tm*3,y);c.lineTo(PCB.x+52+tm*2,py);c.lineTo(ic.x,py);c.stroke()});
  c.fillStyle='#16191d';T.rr(ic.x,ic.y,ic.w,ic.h,1.2,null);c.fill();for(let k=0;k<5;k++){R(ic.x-2.2,ic.y+3+k*5.6,2.2,1.4,'#c9ccd1');R(ic.x+ic.w,ic.y+3+k*5.6,2.2,1.4,'#c9ccd1')}
  circ(ic.x+4,ic.y+4,1,'#3a3f46');jt('MCU',ic.x+ic.w/2,ic.y+ic.h/2-2,'#7d848c',4.2,'center');
  /* 電源ランプ（電池の＋と−がそろうと緑に光る） */
  const pw=conn.some((w,tm)=>w===0)&&conn.some((w,tm)=>w===1);ledDot(c,ic.x+ic.w/2,PCB.y+PCB.h-14,pw?'#5dff9a':null,t);jt('電源',ic.x+ic.w/2+5,PCB.y+PCB.h-16.5,'#e8efe9',4.4);
  /* 端子台（青い樹脂）と、端子ごとのねじ・線の入口・名前・ランプ */
  c.fillStyle=Mt.cylGrad(c,TB.x,TB.x+TB.w,['#1d4f8a','#3d7bc4','#2a62a6','#173f70']);T.rr(TB.x,TY(0)-7,TB.w,TY(3)-TY(0)+20,2,null);c.fill();c.strokeStyle='#0f2c50';c.lineWidth=.5;c.stroke();
  [0,1,2,3].forEach(tm=>{const y=TY(tm),fn=termFn[tm],w=conn[tm],f=focusTm===tm;
    if(tm)line(TB.x,y-6,TB.x+TB.w,y-6,'#0f2c50',.5);
    /* 線の入口（四角い穴） */R(TB.x-1,y+1.5,4,7,'#0a1420');
    /* 締めつけねじ */const sx=TB.x+12,sy=y+5;circ(sx,sy,4.2,'#0f2c50');const hg=c.createRadialGradient(sx-1.2,sy-1.4,.3,sx,sy,3.6);hg.addColorStop(0,'#ffffff');hg.addColorStop(.5,'#c7cdd3');hg.addColorStop(1,'#6e7882');c.fillStyle=hg;c.beginPath();c.arc(sx,sy,3.6,0,TAU);c.fill();
    c.save();c.translate(sx,sy);c.rotate(w>=0?.9:.2);R(-2.6,-.45,5.2,.9,'#2a3038');c.restore();
    /* 名前（白いシルク印刷） */jt(WIRES[fn].to,TB.x+TB.w+5,y+1.5,'#eef5ef',5.6);
    /* LED の端子は、つなぐと小さなランプが光る */
    if(fn>=2)ledDot(c,TB.x+TB.w+50,y+4.5,w>=0?'#ffe27a':null,t);
    if(f){c.save();c.strokeStyle=P.acc;c.lineWidth=1.1;T.rr(TB.x-6,y-5,TB.w+58,20,3,null);c.stroke();c.restore()}});
  c.restore()}
function ledDot(c,x,y,on,t){c.save();if(on){const gl=c.createRadialGradient(x,y,0,x,y,7);gl.addColorStop(0,on);gl.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.75+.25*Math.sin(t*6);c.fillStyle=gl;c.beginPath();c.arc(x,y,7,0,TAU);c.fill();c.globalAlpha=1}
  R(x-2.2,y-1.4,4.4,2.8,on||'#d8dde2');R(x-2.2,y-1.4,1,2.8,'#b9a35a');R(x+1.2,y-1.4,1,2.8,'#b9a35a');c.restore()}
/* 1本の電線：被覆（色・つや）と、むいた先の銅線 */
function wireLine(c,x0,y0,x1,y1,w,endDir){const W=WIRES[w],mx=x0+(x1-x0)*.55;
  const path=()=>{c.beginPath();c.moveTo(x0,y0);c.bezierCurveTo(mx,y0,x1-14*endDir,y1,x1-4*endDir,y1)};
  c.save();c.lineCap='round';c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=3.4;c.translate(.8,1.2);path();c.stroke();c.translate(-.8,-1.2);
  c.strokeStyle=W.c;c.lineWidth=2.8;path();c.stroke();c.strokeStyle=W.hi;c.globalAlpha=.55;c.lineWidth=.7;c.translate(0,-.7);path();c.stroke();c.restore();
  /* むいた先（銅線の束） */c.save();c.translate(x1,y1);const g=c.createLinearGradient(0,-1.3,0,1.3);g.addColorStop(0,'#ffd7a0');g.addColorStop(.5,'#d18a3a');g.addColorStop(1,'#8a4f16');c.fillStyle=g;c.fillRect(endDir>0?-4:0,-1.2,4,2.4);
  c.strokeStyle='rgba(90,45,10,.6)';c.lineWidth=.2;for(let k=0;k<3;k++){c.beginPath();c.moveTo(endDir>0?-4:0,-.8+k*.8);c.lineTo(endDir>0?0:4,-.8+k*.8);c.stroke()}c.restore()}
/* 配線図の記号：電池・LED */
function symBat(c,x,y){/* 縦向きの電池：上が＋（長い線）、下が−（短い太い線）。上下から線がのびて、赤・黒の線へ */
  line(x-5,y-2,x+5,y-2,P.ink,.8);line(x-2.8,y+2,x+2.8,y+2,P.ink,1.6);line(x,y-2,x,y-12.5,P.ink,.6);line(x,y-12.5,x+12,y-12.5,P.ink,.6);line(x,y+2,x,y+12.5,P.ink,.6);line(x,y+12.5,x+12,y+12.5,P.ink,.6);
  jt('＋',x+5,y-8,P.ink,4.4);jt('−',x+5,y+3.4,P.ink,4.4)}
function symLed(c,x,y){c.save();c.fillStyle=P.ink;c.beginPath();c.moveTo(x-3,y-4);c.lineTo(x-3,y+4);c.lineTo(x+3,y);c.closePath();c.fill();line(x+3,y-4,x+3,y+4,P.ink,.9);line(x-8,y,x-3,y,P.ink,.6);line(x+3,y,x+12,y,P.ink,.6);
  [[0,0],[2.4,1.6]].forEach(([dx,dy])=>{line(x+1+dx,y-5-dy,x+4+dx,y-8-dy,P.ink,.45)});c.restore()}
function AssembleGame(){
  let ph=0,order=[],cur=-1,fin=0;
  const NEED=TAU*2.25;                        /* 1本のねじを締めるのに必要な回転（約2回転） */
  const turn=[0,0,0,0],done=[0,0,0,0];
  const SC_POS=[[166,48],[272,48],[272,116],[166,116]],DIAG=[2,3,0,1];
  let flashT=0,flashI=-1,tickAcc=0,dragA=null;
  const termFn=T.shuffle([0,1,2,3]);           /* termFn[端子] = その端子につなぐ線（基板の上での順番は毎回ちがう） */
  const conn=[-1,-1,-1,-1];                  /* conn[端子] = つないだ線 */
  let held=-1,drag=false,mx=0,my=0,moved=0;
  const HOLD={id:'turn',hold:true,x:164,y:150,w:110,h:17,label:'回す（押しつづける）'};
  const wireAt=p=>WIRES.findIndex((w,k)=>!conn.includes(k)&&p.x>=138&&p.x<=184&&Math.abs(p.y-WEND(k).y)<=10);
  const termAt=p=>[0,1,2,3].findIndex(tm=>p.x>=TB.x-10&&p.x<=TB.x+TB.w+54&&p.y>=TY(tm)-6&&p.y<=TY(tm)+16);
  const screwAt=p=>SC_POS.findIndex(([x,y])=>Math.hypot(p.x-x,p.y-y)<=12);
  const angD=(a,b)=>{let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d};
  const g=T.make({limit:120,
    setup(g){screws(g)},
    key(g,k){if(ph===0&&k==='ArrowRight'&&cur>=0)return true;return false},
    update(g,dt){
      if(flashT>0)flashT-=dt;
      /* キーボード：Enter・Space・→ を押しつづけると回る（ボタンを押しつづけてもOK） */
      if(ph===0&&cur>=0&&(g.held()||S.keys.has('ArrowRight')))spin(g,dt*TAU*1.5);
      if(ph===2){fin=Math.min(1,fin+dt/2.4);if(fin>=1&&!g.done)g.win('ねじ4本を「ななめ向かい」の順に締めて、配線4本を完了。')}},
    ptr(g,type,p,down){
      if(ph===0){
        if(type==='down'){if(p.x>=HOLD.x&&p.x<=HOLD.x+HOLD.w&&p.y>=HOLD.y&&p.y<=HOLD.y+HOLD.h&&cur>=0)return false;
          const i=screwAt(p);if(i>=0&&i!==cur){pick(g,i)}
          if(cur>=0&&p.x>=128&&p.y>=20){const[x,y]=SC_POS[cur];dragA=Math.atan2(p.y-y,p.x-x)}return true}
        if(type==='move'){S.cv.style.cursor=dragA!=null?'grabbing':screwAt(p)>=0?'pointer':cur>=0?'grab':'default';
          if(dragA!=null&&down&&cur>=0){const[x,y]=SC_POS[cur];if(Math.hypot(p.x-x,p.y-y)>3){const a=Math.atan2(p.y-y,p.x-x),d=angD(a,dragA);dragA=a;if(d>0&&d<1.4)spin(g,d)}}return true}
        dragA=null;return true}
      if(ph!==1)return false;
      if(type==='down'){const tm=termAt(p);if(held>=0&&tm>=0){connect(g,tm);return true}
        const k=wireAt(p);if(k>=0){held=k;drag=true;moved=0;mx=p.x;my=p.y;S.sfx.click();showTerms(g)}return true}
      if(type==='move'){if(held>=0&&(drag&&down||!drag)){moved+=Math.abs(p.x-mx)+Math.abs(p.y-my);mx=p.x;my=p.y}
        S.cv.style.cursor=held>=0?(drag?'grabbing':'pointer'):wireAt(p)>=0?'grab':'default';const tm=termAt(p);if(held>=0&&tm>=0){const i=g.items.findIndex(it=>it.tm===tm);if(i>=0)g.fi=i}return true}
      if(drag){drag=false;const tm=termAt(p);if(tm>=0)connect(g,tm);else if(moved>12){held=-1;showWires(g)}}return true},
    cancel(g){dragA=null;if(ph===1&&drag){drag=false;held=-1;showWires(g)}},
    draw(g,t){
      T.bg();const c=S.getCtx();
      T.panel(8,8,112,164,ph===0?'組立図　ねじ締め':'配線図',true);
      if(ph===0){T.wrap('土台のねじ4本を締める。',13,23,102,5.8,P.ink,8);T.wrap('きまり：1本締めたら、次は「ななめ向かい」のねじ。かたよって締めると、土台がゆがむよ。',13,34,102,5.6,P.ink,7.8);
        c.strokeStyle=P.ink;c.lineWidth=.6;c.strokeRect(34,78,60,40);[[40,84],[88,84],[88,112],[40,112]].forEach(([x,y],i)=>{if(done[i])circ(x,y,3,'#4fd28f');ring(x,y,3,P.ink,null,.6)});line(40,84,88,112,'#c8372d',.6,[2,1.5]);line(88,84,40,112,'#1f5fae',.6,[2,1.5]);jt('ななめ向かいがペア',64,121,P.inkmut,5,'center');
        T.wrap('締め方：ねじをえらんだら、ドライバーをぐるぐる回すように、円をえがく。',13,134,102,5.4,P.ink,7.4);jt('締めたねじ　'+order.length+' / 4',13,158,P.ink,6)}
      else{c.save();jt('どの色の線を、基板のどの端子へ',13,22,P.inkmut,5);
        WIRES.forEach((w,k)=>{const y=40+k*25,now=ph===1&&k===held;if(now)T.rr(10,y-11,108,22,2,'#fff3c4')});
        /* 電池（＋と−の2本）と、左右の目のLED。記号から色の線がのびて、つなぐ先の名前へ */
        symBat(c,22,52.5);symLed(c,22,90);symLed(c,22,115);jt('電池',11,50,P.inkmut,4.4);jt('左目',22,97,P.inkmut,4.4,'center');jt('右目',22,122,P.inkmut,4.4,'center');
        WIRES.forEach((w,k)=>{const y=40+k*25,now=ph===1&&k===held;
          R(34,y-1.3,22,2.6,w.c);jt(w.n,45,y-9,P.ink,5,'center');line(56,y,62,y,P.ink,.5);jt(w.to,64,y-3.2,P.ink,6.4);T.check(112,y,conn.includes(k),now)});
        c.restore();T.wrap('線の色を図でさがして、基板に印刷された同じ名前の端子につなごう。',13,138,102,5.4,P.ink,7.4)}
      T.panel(126,8,186,164,ph===0?'土台（上から見た図）':ph===1?'コネクタ基板':'組立完了　通電テスト');
      if(ph===0){basePlate(c);bodyTop(c,219,82,33);jt('さんぽぽ 本体',219,78,'rgba(90,60,10,.75)',5.6,'center');
        g.items.forEach(it=>{if(it.i==null)return;const f=g.isFocus(it)&&g.active(),[x,y]=SC_POS[it.i],k=Math.min(1,turn[it.i]/NEED),up=(1-k)*2.6,on=cur===it.i;
          screwHead(c,x,y,up,turn[it.i],done[it.i]?2:0,f&&!on);
          if(on){/* 回す向きの案内（時計回りの矢印）と、締まり具合の弧 */c.save();c.translate(x,y);c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=.6;c.setLineDash([1.6,2]);c.beginPath();c.arc(0,0,15,0,TAU);c.stroke();c.setLineDash([]);
            /* 右回りの矢印（3つ、ゆっくり回る） */const a0=-Math.PI/2+(S.reduceMotion?0:t*1.2);c.fillStyle='rgba(255,255,255,.7)';
            for(let q=0;q<3;q++){const a=a0+q*TAU/3;c.save();c.rotate(a);c.translate(15,0);c.beginPath();c.moveTo(-2.4,-1.6);c.lineTo(2.4,-1.6);c.lineTo(0,2.8);c.closePath();c.fill();c.restore()}
            c.strokeStyle=P.acc;c.lineWidth=1.6;c.beginPath();c.arc(0,0,11.5,-Math.PI/2,-Math.PI/2+k*TAU);c.stroke();c.restore();
            driver(c,x,y-up*.5,turn[it.i])}
          if(flashT>0&&flashI===it.i){ring(x,y,7+(.45-flashT)*26,`rgba(79,210,143,${flashT*2})`,null,1.2);jt('カチッ',x,y-21,P.ok,6,'center')}
          const o=order.indexOf(it.i);if(o>=0)jt(String(o+1),x,y+9,P.ok,5.6,'center')});
        jt(cur>=0?'円をえがいて回そう（右回り）':order.length?'次は、どのねじ？':'どのねじから始めてもOK',219,138,cur>=0?P.acc:P.txt,6.4,'center');
        if(cur>=0){const h=g.held()||S.keys.has('ArrowRight');T.rr(HOLD.x,HOLD.y+(h?1:0),HOLD.w,HOLD.h,4,h?P.acc:'#2a7a50',h?'#fff':'#44a673',.8);jt(HOLD.label,HOLD.x+HOLD.w/2,HOLD.y+HOLD.h/2-3.4+(h?1:0),h?'#1a1400':'#fff',6,'center')}}
      if(ph===1){const it=g.items[g.fi],ft=held>=0&&it&&it.tm!=null&&g.active()?it.tm:-1;pcb(c,t,termFn,conn,ft);
        /* 線の束（被覆チューブ）。下からのびて、4本に分かれる */
        const bx=146,by=158;c.save();c.lineCap='round';c.strokeStyle='#1a1f25';c.lineWidth=6.5;c.beginPath();c.moveTo(130,172);c.quadraticCurveTo(134,160,bx,by);c.stroke();c.strokeStyle='#4a535d';c.lineWidth=5;c.stroke();c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=1;c.stroke();c.restore();
        /* つないだ線 → まだの線 → つかんでいる線 */
        conn.forEach((w,tm)=>{if(w<0)return;const e=WIN(tm);wireLine(c,bx,by,e.x+3,e.y+5,w,1)});
        WIRES.forEach((w,k)=>{if(conn.includes(k)||k===held)return;const e=WEND(k),f=held<0&&g.items[g.fi]&&g.items[g.fi].wk===k&&g.active();wireLine(c,bx,by,e.x,e.y,k,1);T.rr(e.x-26,e.y-4.5,11,9,2,'#0c121a',w.c,.7);jt(w.n,e.x-20.5,e.y-3,P.txt,5.4,'center');if(f){c.save();c.strokeStyle=P.acc;c.lineWidth=1;T.rr(e.x-29,e.y-8,37,16,3,null);c.stroke();c.restore()}});
        if(held>=0){let ex=mx,ey=my;if(!drag&&moved<1){const it2=g.items[g.fi];if(it2&&it2.tm!=null){const e=WIN(it2.tm);ex=e.x-1;ey=e.y+5}else{ex=WEND(held).x+8;ey=WEND(held).y}}
          wireLine(c,bx,by,ex,ey,held,1);ring(ex,ey,4.5,'#fff',null,.6)}
        jt(held>=0?'「'+WIRES[held].n+'」の線を、「'+WIRES[held].to+'」の端子へ':'線の先（銅線のところ）を、つかもう',219,149,P.txt,6,'center')}
      if(ph===2){R(128,20,182,150,'#0a1118');const lit=fin>.55?Math.min(1,(fin-.55)*3):0;S.Sanpo.draw(c,150,24,138,130,{yaw:(1-Math.min(1,fin*1.6))*2.2+Math.sin(t*.9)*.25,explode:Math.max(0,1-fin*1.8)**2,base:true,glow:[lit,lit]});jt(fin<.55?'部品を組み合わせて…':'電池をつないだら、両目が光った！',219,156,P.acc,6.6,'center')}
    }});
  function spin(g,d){if(cur<0)return;const i=cur;turn[i]+=d;tickAcc+=d;if(tickAcc>.42){tickAcc=0;S.tone(300+turn[i]/NEED*240,.03,'square',.03);S.noise(.025,.02,900)}
    if(turn[i]>=NEED){turn[i]=NEED;done[i]=1;cur=-1;dragA=null;order.push(i);flashT=.5;flashI=i;S.sfx.click();S.tone(1500,.05,'square',.05);
      if(order.length<4){g.good(order.length===1?'1本目OK！ 次は、ななめ向かいのねじ。':'締めた！');screws(g)}else{g.good('ねじ締め完了！');ph=1;showWires(g)}}}
  function pick(g,i){if(done[i]){S.toast('そのねじは、もう締めてあるよ。','',2000);return}
    if(cur>=0&&turn[cur]>0&&!done[cur]){S.toast('いま回しているねじを、先に最後まで締めよう。','',2400);return}
    if(order.length===1&&i!==DIAG[order[0]]){g.miss1('次は「ななめ向かい」のねじだよ。となりを先に締めると、土台がゆがんでしまう。');return}
    if(order.length===3&&i!==DIAG[order[2]]){g.miss1('最後は「ななめ向かい」のねじだよ。');return}
    cur=i;S.sfx.click();screws(g);g.fi=g.items.findIndex(it=>it.i===i);
    S.setTag('いまやること：ドライバーで円をえがいて、ねじを締める');S.setHint('マウス・指：ねじのまわりで、右回りに円をえがく　／　キーボード：Enter・Space・→ を押しつづける')}
  function screws(g){g.setItems(SC_POS.map(([x,y],i)=>done[i]?null:({id:'s'+i,i,n:i+1,x:x-11,y:y-11,w:22,h:22,on(it){if(it.i!==cur)pick(g,it.i)}})).filter(Boolean).concat(cur>=0?[HOLD]:[]),true);
    if(cur<0){S.setTag('いまやること：締めるねじをえらぶ（1本目のあとは「ななめ向かい」）');S.setHint('矢印キー：ねじをえらぶ　Enter：決定してそのまま押しつづけると回る　（マウス・指：ねじを押して、まわりで円をえがく）')}}
  function showWires(g){held=-1;drag=false;g.setItems(WIRES.map((w,k)=>conn.includes(k)?null:{id:'w'+k,wk:k,n:k+1,x:150,y:WEND(k).y-11,w:30,h:22,on(it){held=it.wk;moved=0;S.sfx.click();showTerms(g)}}).filter(Boolean));
    S.setTag('いまやること：線の先をつかむ');S.setHint('マウス・指：線の先（銅線）を押したまま、端子まで引っぱってはなす　／　キーボード：↑↓で線をえらんでEnter → ↑↓で端子をえらんでEnter');S.cv.style.cursor='default'}
  function showTerms(g){g.setItems([0,1,2,3].map(tm=>({id:'t'+tm,tm,n:tm+1,x:TB.x-6,y:TY(tm)-5,w:TB.w+58,h:20,on(it){connect(g,it.tm)}})));
    S.setTag('いまやること：「'+WIRES[held].n+'」の線を、「'+WIRES[held].to+'」の端子につなぐ')}
  function connect(g,tm){if(held<0)return;const w=held;
    if(conn[tm]>=0){S.toast('その端子は、もうつないであるよ。','',2000);held=-1;showWires(g);return}
    if(termFn[tm]!==w){g.miss1('配線図を見てみよう。「'+WIRES[w].n+'」の線は「'+WIRES[w].to+'」につなぐよ。この端子は「'+WIRES[termFn[tm]].to+'」。');held=-1;showWires(g);return}
    conn[tm]=w;held=-1;drag=false;S.sfx.click();S.tone(900,.06,'triangle',.05);
    if(conn.every(x=>x>=0)){g.good('配線完了！');ph=2;g.frozen=true;g.setItems([]);S.setTag('組立完了！ 通電テスト');S.cv.style.cursor='default'}else showWires(g)}
  g.dbg=()=>({ph,order:order.slice(),cur,turn:turn.slice(),done:done.slice(),held,termFn:termFn.slice(),conn:conn.slice()});
  return g}
S.STAGES.push({id:'assemble',dept:'as',name:'組立',limit:120,lines:'assemble',hint:KEYS,make:AssembleGame,
  tut:[
    {text:'まずは、ねじ締め。右の図のねじを1本えらんだら、そのまわりで、ドライバーを回すように右回りに円をえがいて締めるよ。キーボードなら、Enterを押しつづけると回る。',spot:[126,8,186,164],card:'bottom'},
    {text:'きまりは1つ。1本締めたら、次は「ななめ向かい」のねじ。かたよって締めると、土台がゆがむよ。',spot:[8,8,112,164],card:'bottom'},
    {text:'ねじが終わったら配線。左の配線図で線の色をさがして、基板に印刷された同じ名前の端子まで、線の先を引っぱってつなぐよ。キーボードなら、↑↓で線をえらんでEnter、つぎに端子をえらんでEnter。制限時間は120秒！'}
  ]});

/* ---------- 7 調整（Ver. 2.9.6：つまみを回して、目の明るさを合わせる） ---------- */
const KN=[{x:204,y:76,lab:'左目'},{x:272,y:76,lab:'右目'}],KR=17,KA0=Math.PI*.75,KSW=Math.PI*1.5;   /* つまみの位置・半径。0 が左下、100 が右下（270度） */
const kAng=v=>KA0+v/100*KSW;
function knob(c,x,y,v,f,t,lab){
  c.save();
  /* 目もり（パネルに印刷）：10ごと、0・50・100に数字 */
  for(let k=0;k<=20;k++){const a=kAng(k*5),big=k%2===0,r0=KR+3,r1=KR+(big?6.5:4.8);line(x+Math.cos(a)*r0,y+Math.sin(a)*r0,x+Math.cos(a)*r1,y+Math.sin(a)*r1,big?'#2c3440':'#5a6470',big?.6:.4)}
  [[0,'0'],[50,'50'],[100,'100']].forEach(([v2,s])=>{const a=kAng(v2);jt(s,x+Math.cos(a)*(KR+11),y+Math.sin(a)*(KR+11)-2.4,'#2c3440',4.4,'center')});
  /* 影 → 台座のリング → ギザギザのつまみ → 上面 → 指し線 */
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.arc(x+1.6,y+2.4,KR+.5,0,TAU);c.fill();
  const sk=c.createRadialGradient(x-5,y-6,1,x,y,KR+1);sk.addColorStop(0,'#f4f6f8');sk.addColorStop(.6,'#aeb6be');sk.addColorStop(1,'#5f6871');c.fillStyle=sk;c.beginPath();c.arc(x,y,KR+1,0,TAU);c.fill();
  const a=kAng(v);c.fillStyle='#1b1f24';c.beginPath();c.arc(x,y,KR-2.5,0,TAU);c.fill();
  c.strokeStyle='#4a525b';c.lineWidth=.7;for(let k=0;k<28;k++){const q=a+k*TAU/28;c.beginPath();c.moveTo(x+Math.cos(q)*(KR-5.5),y+Math.sin(q)*(KR-5.5));c.lineTo(x+Math.cos(q)*(KR-2.6),y+Math.sin(q)*(KR-2.6));c.stroke()}
  const tp=c.createRadialGradient(x-4,y-5,.5,x,y,KR-6);tp.addColorStop(0,'#5c656f');tp.addColorStop(1,'#23282e');c.fillStyle=tp;c.beginPath();c.arc(x,y,KR-6,0,TAU);c.fill();
  c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=.3;for(let r=2;r<KR-6;r+=1.2){c.beginPath();c.arc(x,y,r,0,TAU);c.stroke()}
  c.strokeStyle='#ffd23a';c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(x+Math.cos(a)*3,y+Math.sin(a)*3);c.lineTo(x+Math.cos(a)*(KR-3),y+Math.sin(a)*(KR-3));c.stroke();
  jt(lab,x,y+KR+12,'#2c3440',6,'center');c.restore()}
function AdjustGame(){
  let v=[25+(Math.random()*20|0),88+(Math.random()*10|0)],sel=0,drag=-1,lastA=0,acc=0;
  const bright=()=>[Math.round(v[0]),Math.round(v[1]*.8+8)],LO=68,HI=72;
  const inBand=b=>b>=LO&&b<=HI;
  const knobAt=p=>KN.findIndex(k=>Math.hypot(p.x-k.x,p.y-k.y)<=KR+8);
  const g=T.make({limit:60,
    setup(g){g.setItems([...KN.map((k,e)=>({id:'k'+e,e,x:k.x-KR-6,y:k.y-KR-6,w:KR*2+12,h:KR*2+12,on(){sel=e}})),{id:'ok',n:1,x:186,y:148,w:112,h:19,label:'これで確定する',on(){confirm(g)}}]);g.fi=0;
      S.setTag('いまやること：つまみを回して、左右の目の明るさをどちらも 68〜72 % に合わせる');S.setHint('マウス・指：つまみを押したまま回す（ホイールでもOK）　／　キーボード：↑↓ 左目・右目の切りかえ　←→ 回す　Enter 確定')},
    key(g,k){if(k==='ArrowUp'||k==='ArrowDown'){sel=1-sel;g.fi=sel;S.sfx.tick();return true}if(k==='ArrowLeft'){adj(-1);return true}if(k==='ArrowRight'){adj(1);return true}if(k==='Enter'||k===' '){confirm(g);return true}return false},
    wheel(g,d){adj(d>0?-1:1)},
    ptr(g,type,p,down){
      if(type==='down'){const e=knobAt(p);if(e<0)return false;sel=e;g.fi=e;drag=e;lastA=Math.atan2(p.y-KN[e].y,p.x-KN[e].x);S.sfx.tick();return true}
      if(type==='move'){S.cv.style.cursor=drag>=0?'grabbing':knobAt(p)>=0?'grab':'default';
        if(drag>=0&&down){const k=KN[drag],a=Math.atan2(p.y-k.y,p.x-k.x);let d=a-lastA;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;lastA=a;if(Math.hypot(p.x-k.x,p.y-k.y)>4){acc+=d/KSW*100;const n=Math.trunc(acc);if(n){acc-=n;adj(n)}}return true}return drag>=0}
      const was=drag>=0;drag=-1;acc=0;return was},
    cancel(g){drag=-1;acc=0},
    draw(g,t){
      T.bg();const b=bright(),c=S.getCtx();
      T.panel(8,8,150,164,'さんぽぽ（点灯中）');R(10,20,146,150,'#070b10');S.Sanpo.draw(c,12,24,142,132,{yaw:Math.sin(t*.6)*.25,base:true,glow:[Math.pow(b[0]/100,1.6),Math.pow(b[1]/100,1.6)],dist:6.9});
      jt('左目',50,158,P.mut,5.6,'center');jt('右目',116,158,P.mut,5.6,'center');
      T.panel(164,8,148,164,'調整　目の明るさ');
      /* 調整用の操作パネル（ヘアラインのアルミ板・四すみのねじ） */
      const px=168,py=22,pw=140,ph=100;c.save();c.fillStyle='rgba(0,0,0,.35)';T.rr(px+2,py+2,pw,ph,3,null);c.fill();c.fillStyle=Mt.vGrad(c,py,py+ph,['#e9edf0','#cdd3d9','#b9c1c8','#d8dde2']);T.rr(px,py,pw,ph,3,null);c.fill();
      c.save();T.rr(px,py,pw,ph,3,null);c.clip();c.globalAlpha=.25;c.strokeStyle='#fff';c.lineWidth=.2;for(let y=py;y<py+ph;y+=.9){c.beginPath();c.moveTo(px,y);c.lineTo(px+pw,y+.2);c.stroke()}c.restore();
      c.strokeStyle='#7d8792';c.lineWidth=.5;T.rr(px,py,pw,ph,3,null);c.stroke();[[px+5,py+5],[px+pw-5,py+5],[px+5,py+ph-5],[px+pw-5,py+ph-5]].forEach(([x,y])=>{circ(x,y,1.8,'#8a949e');line(x-1.2,y-1.2,x+1.2,y+1.2,'#3c444c',.4)});c.restore();
      KN.forEach((k,e)=>{if(sel===e&&g.active())T.rr(k.x-32,k.y-30,64,66,6,'rgba(246,194,28,.16)',P.acc,.9);knob(c,k.x,k.y,v[e],false,t,k.lab)});
      /* 明るさの表示（左右）：数字と、ねらいのはんい */
      [0,1].forEach(e=>{const x=KN[e].x,y=128,ok=inBand(b[e]);T.rr(x-26,y-2,52,14,2,'#0a0f15',sel===e?P.acc:P.line,sel===e?.9:.5);jt(b[e]+' %',x-3,y+.6,ok?P.ok:P.txt,8,'right');T.gauge(x+1,y+3.2,22,5,b[e]/100,LO/100,HI/100)});
      jt('ねらい：左右とも 68〜72 %',238,142,P.acc,5.6,'center');
      g.items.forEach(it=>{if(it.id==='ok')T.opt(g,it,{center:true})});
    }});
  function adj(d){const nv=S.clamp(v[sel]+d,0,100);if(nv===v[sel])return;v[sel]=nv;S.tone(500+v[sel]*6,.03,'triangle',.03)}
  function confirm(g){const b=bright();if(inBand(b[0])&&inBand(b[1])){g.frozen=true;g.setItems([]);S.setTag('調整完了！');setTimeout(()=>g.win('左目 '+b[0]+'%、右目 '+b[1]+'% にそろえた。'),700)}
    else g.miss1((!inBand(b[0])?'左目':'右目')+'が、まだ緑のはんいに入っていないよ。68〜72%に合わせよう。')}
  g.dbg=()=>({v:v.slice(),b:bright(),sel});
  g.dbgSet=(e,x)=>{v[e]=x};
  return g}
S.STAGES.push({id:'adjust',dept:'as',name:'調整',limit:60,lines:'adjust',hint:'',make:AdjustGame,
  tut:[
    {text:'左が、いま光っているさんぽぽ。右の2つのつまみで、左右の目の明るさを変えられるよ。',spot:[8,8,150,164],card:'bottom'},
    {text:'つまみを押したまま回してね（ホイールでもOK）。キーボードなら、↑↓で左目・右目を切りかえて、←→で回す。',spot:[164,8,148,134],card:'bottom'},
    {text:'左右とも緑のはんい（68〜72%）に入ったら、Enterで確定。部品には個体差があるから、つまみの位置は左右でちがってくるよ。制限時間は60秒！'}
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
