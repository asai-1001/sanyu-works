/* =====================================================================
   三友ワークス — 設計（Ver. 2.4 で作り直し、Ver. 2.5 で完成品と同じ形・寸法に）
   本物の3D CADのように、ツールをえらび、形をクリックでえらび、ドラッグで寸法を決めて作る。
   寸法は js/model.js（立体のさんぽぽ）・検図の図面・寸法測定とそろえてある。
   【機械設計】
     1 スケッチ  … 「正面」をえらび、原点からドラッグして半だ円をかく（幅 65 mm・高さ 60 mm）
     2 回転      … 半だ円を中心線のまわりに 360° 回して体にする
     3 押し出し  … 円（Φ2）をえらび、矢印をドラッグしてピン（棒）を長さ 14 mm にする
     4 押し出し  … ピンの先の三角形をえらび、厚さ 4 mm の板にする
     5 円形パターン … ピンと三角パーツの組をえらび、個数を 5 にして OK（50° おき）
     6 穴あけ    … 目の穴（Φ6）の位置（中心から横 6 mm・上 6 mm）をクリック
     7 ミラー    … 穴をえらび、まん中のたての面「右側面」で左右対称にコピー
   【電気設計】
     8 スイッチと抵抗を、部品の棚から回路図へドラッグ
     9 LED をクリックして向きを合わせ、「回路チェック」
   ・マウス（タッチ）でも、キーボードでも最後までできる。
     ツール … 数字キー／矢印＋Enter　　ドラッグの代わり … 矢印キーで値を変えて Enter
   ・3D は SW.G3（WebGL）で描く。
   ===================================================================== */
(()=>{
'use strict';
const S=SW,T=S.T,P=T.PAL,{R,circ,ring,line,jt,TAU}=S,G=S.G3,M=G.M;
const VP={x:128,y:39,w:182,h:131};             /* 3D の画面（ビューポート） */
const MM=1/32.5;                                /* 1 mm（体の横の半径 32.5 mm を 1 とする。model.js と同じ） */
const KY=60/65;                                 /* 高さ÷幅 */
const W_T=65,H_T=60,PIN_L=14,TRI_T=4,EYE_X=6,EYE_Y=6;   /* 指示書の寸法（mm） */
const SPK=[190,140,90,40,-10].map(d=>d*Math.PI/180);   /* 三角パーツの向き（円形パターン 5 組・50° おき） */
const CADCOL=[.66,.75,.86],SELCOL=[1,.62,.18],PREVCOL=[.37,.8,1];
const ST={SK:0,RV:1,PIN:2,TRI:3,PAT:4,HOLE:5,MIR:6,ELEC:7,LED:8,DONE:9};

/* ---------- 3D の形（キャッシュ） ---------- */
const meshCache={};
/* 半だ円（x≥0、横の半径 1・高さの半径 KY）を Y 軸のまわりに 0〜A 度回した立体 */
function sector(A){A=Math.max(0,Math.min(360,Math.round(A/10)*10));if(meshCache['s'+A]!==undefined)return meshCache['s'+A];
  if(!G.ok||A<=0)return meshCache['s'+A]=null;
  const rings=22,seg=Math.max(1,A/10),P2=[],N2=[],I2=[],ar=A*Math.PI/180;
  for(let r=0;r<=rings;r++){const v=r/rings*Math.PI,y=Math.cos(v)*KY,s=Math.sin(v);for(let k=0;k<=seg;k++){const u=k/seg*ar,x=Math.cos(u)*s,z=Math.sin(u)*s;P2.push(x,y,z);const nx=x,ny=y/(KY*KY),nz=z,l=Math.hypot(nx,ny,nz)||1;N2.push(nx/l,ny/l,nz/l)}}
  for(let r=0;r<rings;r++)for(let k=0;k<seg;k++){const a=r*(seg+1)+k,b=a+seg+1;I2.push(a,a+1,b,b,a+1,b+1)}
  if(A<360){for(const u of[0,ar]){const nx=-Math.sin(u),nz=Math.cos(u),c=P2.length/3;P2.push(0,0,0);N2.push(nx,0,nz);
    for(let r=0;r<=rings;r++){const v=r/rings*Math.PI;P2.push(Math.cos(u)*Math.sin(v),Math.cos(v)*KY,Math.sin(u)*Math.sin(v));N2.push(nx,0,nz)}
    for(let r=0;r<rings;r++)I2.push(c,c+1+r,c+2+r)}}
  return meshCache['s'+A]=G.mesh(P2,N2,I2)}
function prismMesh(){if(meshCache.prism!==undefined)return meshCache.prism;if(!G.ok)return meshCache.prism=null;
  const Tq=[[-.5,0],[.5,0],[0,1]],P2=[],N2=[],I2=[];
  for(const z of[.5,-.5]){const b=P2.length/3;Tq.forEach(t=>{P2.push(t[0],t[1],z);N2.push(0,0,Math.sign(z))});I2.push(b,b+1,b+2)}
  for(let k=0;k<3;k++){const a=Tq[k],c=Tq[(k+1)%3],ex=c[0]-a[0],ey=c[1]-a[1],l=Math.hypot(ex,ey),nx=ey/l,ny=-ex/l,b=P2.length/3;
    P2.push(a[0],a[1],.5,c[0],c[1],.5,c[0],c[1],-.5,a[0],a[1],-.5);for(let q=0;q<4;q++)N2.push(nx,ny,0);I2.push(b,b+1,b+2,b,b+2,b+3)}
  return meshCache.prism=G.mesh(P2,N2,I2)}
function cylMesh(){if(meshCache.cyl!==undefined)return meshCache.cyl;if(!G.ok)return meshCache.cyl=null;
  const seg=24,P2=[],N2=[],I2=[];for(let k=0;k<=seg;k++){const u=k/seg*TAU,x=Math.cos(u),z=Math.sin(u);P2.push(x,-.5,z,x,.5,z);N2.push(x,0,z,x,0,z)}
  for(let k=0;k<seg;k++){const a=k*2;I2.push(a,a+1,a+2,a+2,a+1,a+3)}
  for(const y of[-.5,.5]){const c=P2.length/3;P2.push(0,y,0);N2.push(0,Math.sign(y),0);for(let k=0;k<=seg;k++){const u=k/seg*TAU;P2.push(Math.cos(u),y,Math.sin(u));N2.push(0,Math.sign(y),0)}for(let k=0;k<seg;k++)I2.push(c,c+1+k,c+2+k)}
  return meshCache.cyl=G.mesh(P2,N2,I2)}
function boxMesh(){if(meshCache.box!==undefined)return meshCache.box;if(!G.ok)return meshCache.box=null;
  const P2=[],N2=[],I2=[];[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]].forEach(n=>{const u=[n[1],n[2],n[0]],v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]],b=P2.length/3;
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,c])=>{P2.push((n[0]+u[0]*a+v[0]*c)/2,(n[1]+u[1]*a+v[1]*c)/2,(n[2]+u[2]*a+v[2]*c)/2);N2.push(...n)});I2.push(b,b+1,b+2,b,b+2,b+3)});
  return meshCache.box=G.mesh(P2,N2,I2)}

/* ---------- 部品の置き方（js/model.js と同じ式） ---------- */
/* ピン：中心 (cos a×1.16, sin a×1.1＋.02)、向き (cos a, sin a)。長さ len mm（根もとから伸びる） */
function pinBase(a){const c=Math.cos(a),s=Math.sin(a),L=PIN_L*MM;return[c*1.16-c*L/2,s*1.1+.02-s*L/2,0]}
function pinM(a,len){const c=Math.cos(a),s=Math.sin(a),b=pinBase(a),l=Math.max(.001,len*MM);return M.chain(M.t(b[0]+c*l/2,b[1]+s*l/2,0),M.rz(a-Math.PI/2),M.s(1*MM,l,1*MM))}
/* 三角パーツ：model.js と同じ位置・大きさ。厚さ t mm */
function triM(a,t){return M.chain(M.t(Math.cos(a)*1.36,Math.sin(a)*1.36*.96+.02,0),M.rz(a-Math.PI/2),M.s(.46,.5,Math.max(.002,t*MM)))}
function triPts(a){const Mx=triM(a,0);return[[-.5,0],[.5,0],[0,1]].map(([x,y])=>[Mx[0]*x+Mx[4]*y+Mx[12],Mx[1]*x+Mx[5]*y+Mx[13],0])}
const surfZ=(x,y)=>Math.sqrt(Math.max(0,1-x*x-(y/KY)**2));
function holeM(xm,ym){const x=xm*MM,y=ym*MM,z=surfZ(x,y);let nx=x,ny=y/(KY*KY),nz=z;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
  return M.chain(M.t(x,y,z),M.ry(Math.atan2(nx,nz)),M.rx(-Math.asin(ny)),M.rx(Math.PI/2),M.t(0,-.06,0),M.s(3*MM,.16,3*MM))}

/* ---------- 部品の棚（電気設計） ---------- */
const PARTS=[{k:'sw',name:'スイッチ'},{k:'r',name:'抵抗'},{k:'c',name:'コンデンサ'},{k:'m',name:'モーター'}];
const SLOT_WHY={
  sw:{r:'抵抗は、電流の量をおさえる部品。つないだり切ったりするのは「スイッチ」だよ。',c:'コンデンサは電気をためる部品。LEDをつけたり消したりするのは「スイッチ」だよ。',m:'モーターは回る部品。LEDをつけたり消したりするのは「スイッチ」だよ。'},
  r:{sw:'スイッチは、つないだり切ったりする部品。電流をおさえるのは「抵抗」だよ。',c:'コンデンサは電気をためる部品。LEDに流れる電流をおさえるのは「抵抗」だよ。',m:'モーターは回る部品。LEDに流れる電流をおさえるのは「抵抗」だよ。'}};
const TOOLS=[{k:'sketch',name:'スケッチ'},{k:'revolve',name:'回転'},{k:'extrude',name:'押し出し'},{k:'pattern',name:'円形パターン'},{k:'hole',name:'穴あけ'},{k:'mirror',name:'ミラー'}];
const TOOL_WHY={sketch:'まずは「スケッチ」で、体のもとになる形をかこう。',revolve:'半だ円を中心線のまわりにぐるっと回すと体の形になる。「回転」を使おう。',extrude:'平らなスケッチを、棒や板にのばすのは「押し出し」だよ。',
  pattern:'同じ形を円のようにならべるのは「円形パターン」だよ。',hole:'穴をあけるのは「穴あけ」だよ。',mirror:'左右対称にコピーするのは「ミラー」だよ。'};
const STEP_TOOL=['sketch','revolve','extrude','extrude','pattern','hole','mirror'];
const REF=['体：幅 65・高さ 60 mm（回転体）','ピン：Φ2・長さ 14 mm','三角パーツ：厚さ 4 mm','ピン＋三角：5組（円形パターン）','目の穴：Φ6 横 6・上 6 mm（左右対称）','回路：電池・スイッチ・抵抗・LED×2'];
const REF_OF=[0,0,1,2,3,4,4,5,5,5];
/* 基準面の説明（カードに出す） */
const PLANE={front:{n:'正面',sub:'顔が見える向きの面'},top:{n:'平面',sub:'上から見た向きの面'},right:{n:'右側面',sub:'右から見た向きの面'}};
const PLANE_MIR={right:'まん中で、左と右を分ける面',top:'まん中で、上と下を分ける面'};

const TAGS=['スケッチで、体のもとになる半だ円をかく','半だ円を「回転」させて体を作る','円を「押し出し」て、ピン（棒）を作る','ピンの先の三角形を「押し出し」て、厚さ 4 mm の板にする','ピンと三角パーツの組を「円形パターン」で 5 つにならべる','「穴あけ」で目の穴をあける','「ミラー」で、目の穴を反対側にもコピーする'];
function CadGame(){
  let step=ST.SK,sub='tool',tool=null,tree=[],cam={yaw:.62,pitch:.42,zoom:1},camT=null,anim=0,flash=0;
  let sk={w:0,h:0,drawing:false},rv={a:0,drag:null},pn={l:0,drag:null},ex={t:0,drag:null},pt={n:1,drag:null},holes=[],hov=null,hole={x:0,y:0,on:false},render=0;
  let orbit=null,elec={sw:null,r:null,led:[0,0],flipA:[0,0],carry:null,drag:null,erc:false,flow:0},kbdHole=false;
  elec.led=Math.random()<.5?[1,0]:[1,1];elec.flipA=elec.led.map(v=>v*Math.PI);
  const g=T.make({limit:210,
    setup(g){enterStep(g)},
    update(g,dt){anim+=dt;if(flash>0)flash-=dt;if(render>0)render-=dt;
      if(camT){const k=1-Math.pow(.0009,dt);cam.yaw+=(camT.yaw-cam.yaw)*k;cam.pitch+=(camT.pitch-cam.pitch)*k;cam.zoom+=(camT.zoom-cam.zoom)*k;
        if(Math.abs(camT.yaw-cam.yaw)<.002&&Math.abs(camT.pitch-cam.pitch)<.002&&Math.abs(camT.zoom-cam.zoom)<.002){cam={...camT};camT=null}}
      for(let i=0;i<2;i++){const tg=elec.led[i]*Math.PI;elec.flipA[i]+=(tg-elec.flipA[i])*Math.min(1,dt*14)}
      if(elec.erc)elec.flow+=dt},
    draw(g,t){drawAll(g,t)},
    key(g,k,rep){return onKey(g,k,rep)},
    ptr(g,type,p,down){return onPtr(g,type,p,down)},
    cancel(g){onCancel(g)},loupe(){return step===ST.ELEC},
    wheel(g,d){if(step<ST.ELEC&&!locked()){cam.zoom=S.clamp(cam.zoom*(d>0?1.1:.91),.6,1.7);camT=null}}
  });

  /* ---------- カメラと座標の変換 ---------- */
  const locked=()=>(step===ST.SK&&sub==='draw')||(step===ST.HOLE&&sub==='place');
  const front=()=>{camT={yaw:0,pitch:0,zoom:1}};
  const iso=()=>{camT={yaw:.62,pitch:.42,zoom:1}};
  function camObj(){return{yaw:cam.yaw,pitch:cam.pitch,dist:9.2*cam.zoom,target:[0,.16,0],fov:.5}}
  function vpMat(){const c=camObj(),cp=Math.cos(c.pitch),eye=[Math.sin(c.yaw)*cp*c.dist,c.target[1]+Math.sin(c.pitch)*c.dist,Math.cos(c.yaw)*cp*c.dist];
    return M.mul(M.persp(c.fov,VP.w/VP.h,.5,60),M.look(eye,c.target))}
  let VPM=null;
  function proj(p){const m=VPM||(VPM=vpMat()),x=p[0],y=p[1],z=p[2];
    const cx=m[0]*x+m[4]*y+m[8]*z+m[12],cy=m[1]*x+m[5]*y+m[9]*z+m[13],cw=m[3]*x+m[7]*y+m[11]*z+m[15];
    return[VP.x+(cx/cw*.5+.5)*VP.w,VP.y+(1-(cy/cw*.5+.5))*VP.h]}
  const pxPerUnit=()=>{const a=proj([0,0,0]),b=proj([1,0,0]);return Math.hypot(b[0]-a[0],b[1]-a[1])};
  const inVP=p=>p.x>=VP.x&&p.x<=VP.x+VP.w&&p.y>=VP.y&&p.y<=VP.y+VP.h;
  const inRect=(p,it)=>it&&it.w>0&&p.x>=it.x&&p.x<=it.x+it.w&&p.y>=it.y&&p.y<=it.y+it.h;

  /* ---------- 段階の切りかえ ---------- */
  function addTree(s){tree.push(s);flash=.6}
  function enterStep(g){tool=null;sub='tool';
    if(step===ST.PIN&&!tree.some(s=>s.startsWith('スケッチ2')))addTree('スケッチ2（円 Φ2）');
    if(step===ST.TRI&&!tree.some(s=>s.startsWith('スケッチ3')))addTree('スケッチ3（三角形）');
    if(step<ST.ELEC){toolItems(g);S.setTag('いまやること：'+TAGS[step]);
      S.setHint('上のツールバーからツールをえらぶ（数字キー 1〜6 でもOK）。3Dの画面は、何もないところをドラッグすると回せる／ホイールで拡大');}
    else if(step===ST.ELEC){elecItems(g);S.setTag('いまやること：スイッチと抵抗を、回路図の「？」の場所へドラッグ');
      S.setHint('マウス：上の部品を、回路図の「？」までドラッグ　／　キーボード：数字キーで部品をえらんで、矢印で場所をえらんで Enter')}
    else if(step===ST.LED){ledItems(g);S.setTag('いまやること：LEDの向きを合わせて「回路チェック」');
      S.setHint('LEDをクリック（または数字キー）すると向きが変わる。合わせたら「回路チェック」')}}
  function toolItems(g,extra){const its=TOOLS.map((tl,i)=>({id:'t_'+tl.k,n:i+1,x:129+i*30,y:21,w:29,h:16,label:tl.name,tool:tl.k,on(it){pickTool(g,it.tool)}}));
    g.setItems(its.concat(extra||[]),true);if(extra&&extra.length)g.fi=TOOLS.length;else if(sub==='tool'&&g.fi>=TOOLS.length)g.fi=0}
  function pickTool(g,k){if(sub!=='tool'&&k===tool)return;
    if(k!==STEP_TOOL[step]){g.miss1(TOOL_WHY[STEP_TOOL[step]]);return}
    if(sub!=='tool')return;
    tool=k;S.sfx.blip();
    if(step===ST.SK){sub='plane';toolItems(g,planeCards(['front','top','right']));S.setTag('いまやること：スケッチをかく面「正面」をえらぶ');S.setHint('左上のカードから、スケッチをかく面をクリック（矢印でえらんで Enter でもOK）。さんぽぽの顔は「正面」に向いている')}
    else if(step===ST.RV){sub='drag';rv.a=0;toolItems(g);S.setTag('いまやること：横にドラッグして、360° 回す');S.setHint('マウス：3Dの画面を横にドラッグ　／　キーボード：← → で角度を変える（Enter で決定）')}
    else if(step===ST.PIN){sub='sel';toolItems(g,[selItem('pin','スケッチ2')]);S.setTag('いまやること：押し出す円（Φ2）のスケッチをクリック');S.setHint('体の上の、青い円をクリック（矢印でえらんで Enter でもOK）')}
    else if(step===ST.TRI){sub='sel';toolItems(g,[selItem('tri','スケッチ3')]);S.setTag('いまやること：押し出す三角形のスケッチをクリック');S.setHint('ピンの先の、三角形の点線をクリック（矢印でえらんで Enter でもOK）')}
    else if(step===ST.PAT){sub='sel';toolItems(g,[selItem('spike','押し出し1・2')]);S.setTag('いまやること：ならべる「ピンと三角パーツ」をクリック');S.setHint('ピンと三角パーツの組をクリック（矢印でえらんで Enter でもOK）')}
    else if(step===ST.HOLE){sub='place';kbdHole=false;front();toolItems(g);S.setTag('いまやること：目の穴の位置をクリック（中心から横 6 mm・上 6 mm）');S.setHint('マウス：体の表面をクリックして穴をあける（X・Y の数字を見ながら）　／　キーボード：矢印で動かして Enter')}
    else if(step===ST.MIR){sub='sel';iso();toolItems(g,[selItem('hole','穴1')]);S.setTag('いまやること：コピーする目の穴をクリック');S.setHint('目の穴をクリック（矢印でえらんで Enter でもOK）')}}
  function selItem(k,label){return{id:'sel_'+k,label,sel:k,x:0,y:0,w:0,h:0,on(){selected(g,k)}}}
  /* 面をえらぶカード（左上にたてにならべる） */
  function planeCards(ks){return ks.map((k,i)=>({id:'pl_'+k,label:PLANE[k].n,plane:k,x:VP.x+3,y:VP.y+3+i*24,w:66,h:22,on(it){planePicked(g,it.plane)}}))}
  function selected(g,k){S.sfx.blip();
    if(step===ST.PIN&&k==='pin'){pn.l=0;sub='drag';toolItems(g);S.setTag('いまやること：矢印をドラッグして、ピンの長さを 14 mm にする');S.setHint('マウス：3Dの画面を、矢印の向きにドラッグ　／　キーボード：↑ ↓ で長さを変えて Enter')}
    else if(step===ST.TRI&&k==='tri'){ex.t=0;sub='drag';toolItems(g);S.setTag('いまやること：矢印をドラッグして、厚さを 4 mm にする');S.setHint('マウス：3Dの画面を、矢印の向きにドラッグ　／　キーボード：↑ ↓ で厚さを変えて Enter')}
    else if(step===ST.PAT&&k==='spike'){pt.n=1;sub='count';toolItems(g,[{id:'pt_ok',label:'OK',x:VP.x+46,y:VP.y+30,w:22,h:10,on(){patternOk(g)}}]);
      S.setTag('いまやること：個数のつまみをドラッグして 5 にし、OK');S.setHint('マウス：「個数」のつまみを左右にドラッグして OK　／　キーボード：← → で個数を変えて Enter')}
    else if(step===ST.MIR&&k==='hole'){sub='plane';toolItems(g,planeCards(['right','top']));S.setTag('いまやること：左右対称にするための面をえらぶ');S.setHint('左上のカードから面をクリック（矢印でえらんで Enter でもOK）')}}
  function planePicked(g,k){
    if(step===ST.SK){if(k!=='front'){g.miss1('さんぽぽの顔が見える向きの面は「正面」だよ。体の形は、正面にかくんだ。');return}
      S.sfx.blip();sub='draw';sk.w=sk.h=0;front();toolItems(g);S.setTag('いまやること：原点からドラッグして半だ円をかく（幅 65・高さ 60 mm）');S.setHint('マウス：原点（＋の印）から右上へドラッグして、幅 65・高さ 60 になったらはなす　／　キーボード：← → で幅、↑ ↓ で高さ、Enter で決定')}
    else if(step===ST.MIR){if(k!=='right'){g.miss1('左右にコピーするには、まん中で左と右を分ける面「右側面」を使うよ。');return}
      holes.push({x:-holes[0].x,y:holes[0].y});addTree('ミラー1（右側面）');g.good('左右対称にコピーできた！');
      g.setItems([]);render=2.2;S.setTag('機械設計 完了！　レンダリングで見た目を確かめよう');
      setTimeout(()=>{if(g.dead||g.done)return;step=ST.ELEC;tree=['BT1　電池','SW1　スイッチ','R1　抵抗','D1　LED（左目）','D2　LED（右目）'];enterStep(g)},2400)}}
  function next(g,msg){g.good(msg);step++;enterStep(g)}

  /* ---------- 値の決定 ---------- */
  const skW=()=>Math.round(sk.w*2/MM),skH=()=>Math.round(sk.h*2/MM);
  function sketchDone(g){const w=skW(),h=skH();if(Math.abs(w-W_T)<=1&&Math.abs(h-H_T)<=1){sk.w=1;sk.h=KY;addTree('スケッチ1（半だ円 65×60）');iso();next(g,'幅 65・高さ 60 mm の半だ円がかけた！')}
    else if(w>0||h>0)S.toast(`指示書は幅 65・高さ 60 mm。いまは 幅 ${w}・高さ ${h} mm。もう一度ドラッグしよう。`,'',2800)}
  function revolveDone(g){if(rv.a>=355){rv.a=360;addTree('回転1（360°）');next(g,'体ができた！')}else if(rv.a>0)S.toast(`まだ ${Math.round(rv.a)}°。ぐるっと 360° まで回そう。`,'',2400)}
  function pinDone(g){if(pn.l===PIN_L){addTree('押し出し1（ピン 14 mm）');next(g,'長さ 14 mm のピンができた！')}else if(pn.l>0)S.toast(`指示書は長さ 14 mm。いまは ${pn.l} mm。`,'',2400)}
  function extrudeDone(g){if(Math.abs(ex.t-TRI_T)<.01){addTree('押し出し2（三角 4 mm）');next(g,'厚さ 4 mm の三角パーツができた！')}else if(ex.t>0)S.toast(`指示書は厚さ 4 mm。いまは ${ex.t.toFixed(1)} mm。`,'',2400)}
  function patternOk(g){if(pt.n!==5){g.miss1('指示書を見てみよう。ピンと三角パーツは 5 組だよ。');return}addTree('円形パターン1（5組）');next(g,'5組ならんだ！')}
  function holePlace(g,x,y){if(Math.abs(Math.abs(x)-EYE_X)<=1&&Math.abs(y-EYE_Y)<=1){holes=[{x:Math.sign(x)*EYE_X,y:EYE_Y}];addTree('穴1（Φ6）');iso();next(g,'目の穴があいた！')}
    else g.miss1(`指示書の位置は「中心から横に 6 mm・上に 6 mm」。いまは 横 ${Math.abs(x)}・上 ${y} mm だよ。`)}
  /* 正面から見た画面の点 → 体の表面の (x,y) mm（いちばん近い 1 mm 目もり） */
  function pickSurface(px,py){let best=null,bd=1e9;for(let x=-26;x<=26;x++)for(let y=-24;y<=24;y++){if((x*MM)**2+(y*MM/KY)**2>.85)continue;const s=proj([x*MM,y*MM,surfZ(x*MM,y*MM)]),d=(s[0]-px)**2+(s[1]-py)**2;if(d<bd){bd=d;best={x,y}}}return bd<64?best:null}

  /* ---------- 電気設計 ---------- */
  const SLOT={sw:{x:184,y:62},r:{x:232,y:62}},LEDX=[262,290],LEDY=102,RAIL_T=62,RAIL_B=140,BATX=148;
  function elecItems(g){const its=PARTS.map((p,i)=>({id:'p_'+p.k,n:i+1,x:129+i*45,y:21,w:44,h:16,label:p.name,part:p.k,off:(elec.sw===p.k||elec.r===p.k),on(it){elec.carry=it.part;S.sfx.blip();S.toast('「'+it.label+'」を持ったよ。入れる場所（？）をえらぼう。','',2200);slotFocus(g)}}));
    ['sw','r'].forEach(k=>{if(!elec[k])its.push({id:'slot_'+k,label:'？',slot:k,x:SLOT[k].x-14,y:SLOT[k].y-9,w:28,h:18,on(it){if(elec.carry)drop(g,elec.carry,it.slot);else S.toast('上の部品の棚から、部品をドラッグしてここに入れよう。','',2200)}})});
    g.setItems(its,true)}
  function slotFocus(g){const i=g.items.findIndex(it=>it.slot);if(i>=0)g.fi=i}
  function drop(g,part,slot){elec.carry=null;elec.drag=null;
    if(part!==slot){g.miss1(SLOT_WHY[slot][part]||'その場所には入らないよ。');elecItems(g);return}
    elec[slot]=part;S.sfx.ok();S.toast((slot==='sw'?'スイッチ':'抵抗')+'をつないだ！','ok',1800);
    if(elec.sw&&elec.r){step=ST.LED;enterStep(g)}else elecItems(g)}
  function ledItems(g){g.setItems([0,1].map(i=>({id:'led'+i,n:i+1,label:'D'+(i+1),x:LEDX[i]-9,y:LEDY-10,w:18,h:20,on(){elec.led[i]^=1;S.sfx.click()}})).concat([{id:'erc',n:3,label:'回路チェック',x:VP.x+VP.w-52,y:VP.y+VP.h-17,w:48,h:13,on(){erc(g)}}]),true)}
  function erc(g){if(elec.led.some(v=>v)){g.miss1('LEDには向きがあるよ。三角の向きが、電流の流れ（＋から−へ）と同じになるようにしよう。');return}
    elec.erc=true;g.setItems([]);g.frozen=true;step=ST.DONE;S.sfx.ok();S.setTag('設計完了！');
    setTimeout(()=>g.win('機械設計 7 ステップと、電気設計の回路を完成させた。'),1500)}

  /* ---------- マウス・タッチ ---------- */
  /* スマホ：2本目の指が来たら、とちゅうの操作を「決定しないで」もとにもどす */
  let holeAim=false;
  function onCancel(g){holeAim=false;if(step===ST.HOLE)hole.on=false;
    if(sk.drawing){sk.drawing=false;sk.w=sk.h=0}if(rv.drag){rv.a=rv.drag.a;rv.drag=null}if(pn.drag){pn.l=pn.drag.l;pn.drag=null}
    if(ex.drag){ex.t=ex.drag.t;ex.drag=null}pt.drag=false;orbit=null;elec.drag=null}
  /* 指で細かい場所をえらぶとき（スケッチ・穴あけ）は、指の少し上をねらう点にする（指で隠れないように） */
  const aimUp=()=>S.TOUCH&&((step===ST.SK&&sub==='draw')||(step===ST.HOLE&&sub==='place'));
  function onPtr(g,type,p){VPM=null;
    if(aimUp())p={x:p.x,y:p.y-S.fingerOff()};
    if(step===ST.ELEC){if(type==='down'){const it=g.items.find(i=>i.part&&!i.off&&inRect(p,i));if(it){elec.drag={part:it.part,x:p.x,y:p.y,sx:p.x,sy:p.y};S.sfx.blip();S.cv.style.cursor='grabbing';return true}
        if(elec.carry){const slot=slotAt(p);if(slot){drop(g,elec.carry,slot);return true}}return false}
      if(type==='move'&&elec.drag){elec.drag.x=p.x;elec.drag.y=p.y;return true}
      if(type==='up'&&elec.drag){const d=elec.drag;elec.drag=null;S.cv.style.cursor='default';const slot=slotAt(p);
        if(slot)drop(g,d.part,slot);else if(Math.hypot(p.x-d.sx,p.y-d.sy)<3){elec.carry=d.part;S.toast('「'+PARTS.find(q=>q.k===d.part).name+'」を持ったよ。入れる場所（？）をクリックしよう。','',2200)}
        return true}
      return false}
    if(step>=ST.LED)return false;
    const onItem=g.items.some(it=>!it.off&&inRect(p,it));
    if(type==='down'){
      if(!inVP(p)||onItem)return false;
      if(step===ST.SK&&sub==='draw'){sk.drawing=true;setWH(p);return true}
      if(step===ST.RV&&sub==='drag'){rv.drag={x:p.x,a:rv.a};S.cv.style.cursor='ew-resize';return true}
      if(step===ST.PIN&&sub==='drag'){pn.drag={p0:[p.x,p.y],l:pn.l};return true}
      if(step===ST.TRI&&sub==='drag'){ex.drag={p0:[p.x,p.y],t:ex.t};return true}
      if(step===ST.PAT&&sub==='count'){const s=slider();if(p.x>=s.x-3&&p.x<=s.x+s.w+3&&Math.abs(p.y-s.y)<=5){pt.drag=true;setCount(p.x);return true}}
      if(step===ST.HOLE&&sub==='place'){const h=pickSurface(p.x,p.y);
        /* 指：押したまま動かして位置を合わせ、指をはなしたところに穴をあける */
        if(S.TOUCH){holeAim=true;hole.on=!!h;if(h){hole.x=h.x;hole.y=h.y}return true}
        if(h)holePlace(g,h.x,h.y);return true}
      if(!locked()){orbit={x:p.x,y:p.y,yaw:cam.yaw,pitch:cam.pitch};camT=null;S.cv.style.cursor='move';return true}
      return true}
    if(type==='move'){
      if(sk.drawing){setWH(p);return true}
      if(rv.drag){rv.a=S.clamp(rv.drag.a+Math.abs(p.x-rv.drag.x)*5,0,360);rv.a=Math.round(rv.a/5)*5;if(rv.a>=360){rv.drag=null;revolveDone(g)}return true}
      if(pn.drag){const h=arrowOf(pinTipPt(),dirPin()),along=alongOf(p,pn.drag.p0,h.dir);pn.l=S.clamp(Math.round(pn.drag.l+along/2.2),0,30);return true}
      if(ex.drag){const h=arrowOf(triCenter(ex.t),[0,0,1]),along=alongOf(p,ex.drag.p0,h.dir);ex.t=S.clamp(Math.round((ex.drag.t+along/4)*2)/2,0,10);return true}
      if(pt.drag){setCount(p.x);return true}
      if(orbit){cam.yaw=orbit.yaw-(p.x-orbit.x)*.03;cam.pitch=S.clamp(orbit.pitch+(p.y-orbit.y)*.03,-1.2,1.2);return true}
      if(step===ST.HOLE&&sub==='place'&&(inVP(p)||holeAim)){const h=pickSurface(p.x,p.y);hole.on=!!h;if(h){hole.x=h.x;hole.y=h.y}S.cv.style.cursor=h?'crosshair':'default';return true}
      if(inVP(p)&&!onItem){S.cv.style.cursor=(step===ST.RV&&sub==='drag')?'ew-resize':(step===ST.SK&&sub==='draw')?'crosshair':(sub==='drag')?'move':locked()?'default':'grab';return false}
      return false}
    if(type==='up'){
      if(holeAim){holeAim=false;if(hole.on)holePlace(g,hole.x,hole.y);else S.toast('体の表面の上で指をはなしてね','',1600);return true}
      if(sk.drawing){sk.drawing=false;sketchDone(g);return true}
      if(rv.drag){rv.drag=null;revolveDone(g);return true}
      if(pn.drag){pn.drag=null;pinDone(g);return true}
      if(ex.drag){ex.drag=null;extrudeDone(g);return true}
      if(pt.drag){pt.drag=false;return true}
      if(orbit){orbit=null;S.cv.style.cursor='grab';return true}
      return false}
    return false}
  function slotAt(p){return['sw','r'].find(k=>!elec[k]&&Math.abs(p.x-SLOT[k].x)<=16&&Math.abs(p.y-SLOT[k].y)<=12)}
  function setWH(p){const o=proj([0,0,0]),u=pxPerUnit();sk.w=Math.min(1.5,Math.round(Math.abs(p.x-o[0])/u/MM*2)/2*MM);sk.h=Math.min(1.5,Math.round(Math.abs(p.y-o[1])/u/MM*2)/2*MM)}
  function alongOf(p,p0,dir){const l=Math.hypot(dir[0],dir[1])||1;return((p.x-p0[0])*dir[0]+(p.y-p0[1])*dir[1])/l}
  const dirPin=()=>[Math.cos(SPK[2]),Math.sin(SPK[2]),0];
  function pinTipPt(){const b=pinBase(SPK[2]),d=dirPin(),l=pn.l*MM;return[b[0]+d[0]*l,b[1]+d[1]*l,0]}
  function triCenter(t){const p=triPts(SPK[2]);return[(p[0][0]+p[1][0]+p[2][0])/3,(p[0][1]+p[1][1]+p[2][1])/3,t*MM/2]}
  /* 3D の点 pt から、向き d（3D）へのびる矢印（画面の座標） */
  function arrowOf(pt,d){const base=proj(pt),tip=proj([pt[0]+d[0]*.32,pt[1]+d[1]*.32,pt[2]+d[2]*.32]);return{base,tip,dir:[tip[0]-base[0],tip[1]-base[1]]}}
  function rvHandle(){const a=rv.a*Math.PI/180;return proj([Math.cos(a)*1.25,-1.05,Math.sin(a)*1.25])}
  function slider(){return{x:VP.x+8,y:VP.y+24,w:34}}
  function setCount(px){const s=slider();pt.n=S.clamp(1+Math.round((px-s.x)/s.w*8),1,9)}

  /* ---------- キーボード ---------- */
  function onKey(g,k){const L=k==='ArrowLeft',Rr=k==='ArrowRight',U=k==='ArrowUp',D=k==='ArrowDown',E=k==='Enter'||k===' ';
    if(step===ST.SK&&sub==='draw'){if(L||Rr){sk.w=S.clamp((skW()+(Rr?1:-1))/2*MM,0,1.5);S.sfx.tick();return true}if(U||D){sk.h=S.clamp((skH()+(U?1:-1))/2*MM,0,1.5);S.sfx.tick();return true}if(E){sketchDone(g);return true}return false}
    if(step===ST.RV&&sub==='drag'){if(L||Rr){rv.a=S.clamp(rv.a+(Rr?15:-15),0,360);S.sfx.tick();if(rv.a>=360)revolveDone(g);return true}if(E){revolveDone(g);return true}return false}
    if(step===ST.PIN&&sub==='drag'){if(L||Rr||U||D){pn.l=S.clamp(pn.l+(Rr||U?1:-1),0,30);S.sfx.tick();return true}if(E){pinDone(g);return true}return false}
    if(step===ST.TRI&&sub==='drag'){if(L||Rr||U||D){ex.t=S.clamp(ex.t+(Rr||U?.5:-.5),0,10);S.sfx.tick();return true}if(E){extrudeDone(g);return true}return false}
    if(step===ST.PAT&&sub==='count'){if(L||Rr){pt.n=S.clamp(pt.n+(Rr?1:-1),1,9);S.sfx.tick();return true}if(E){patternOk(g);return true}return false}
    if(step===ST.HOLE&&sub==='place'){if(L||Rr||U||D){if(!kbdHole){kbdHole=true;hole={x:0,y:0,on:true}}hole.x=S.clamp(hole.x+(Rr?1:L?-1:0),-20,20);hole.y=S.clamp(hole.y+(U?1:D?-1:0),-20,20);hole.on=true;S.sfx.tick();return true}
      if(E&&hole.on){holePlace(g,hole.x,hole.y);return true}return false}
    return false}

  /* ---------- 描く ---------- */
  function drawAll(g,t){VPM=null;const c=S.getCtx();T.bg();
    const hv0=hov;if(!hov&&g.active()){const f=g.items[g.fi];if(f&&f.sel)hov=f.sel;else if(f&&f.plane)hov='pl_'+f.plane}
    /* 左上：設計指示書 */
    T.panel(8,8,112,84,'設計指示書',true);
    REF.forEach((s,i)=>{const y=20.5+i*11.8,now=REF_OF[Math.min(step,9)]===i&&step<ST.DONE;if(now)T.rr(11,y-1.4,106,11.4,2,'#fff3c4');jt(s,14,y,P.ink,s.length>18?4.6:5)});
    /* 左下：設計ツリー */
    T.panel(8,96,112,76,step>=ST.ELEC?'回路図　SCH-001':'設計ツリー　さんぽぽ本体');
    if(step<ST.ELEC){const items=['原点・正面・平面・右側面'].concat(tree);const lh=Math.min(8.4,60/items.length);items.forEach((s,i)=>{const y=109+i*lh;const last=i===items.length-1&&i>0&&flash>0;
        if(last)T.rr(11,y-.8,106,lh-.2,1.5,`rgba(246,194,28,${flash/.6*.35})`);treeIcon(c,14,y+lh*.38,i===0?'origin':s);jt(s,20,y,i===0?P.mut:P.txt,Math.min(5.2,lh*.72))})}
    else{tree.forEach((s,i)=>{const y=110+i*10,on=i===0||(i===1&&elec.sw)||(i===2&&elec.r)||(i>=3&&step>=ST.LED);circ(14,y+3.2,1.8,on?P.ok:'#3a4858');jt(s,20,y,on?P.txt:'#6b7888',5.6)});
      if(step>=ST.DONE)jt('回路チェック：エラーなし',14,160,P.ok,5.4)}
    /* 右：CAD の窓 */
    T.panel(126,8,186,164,step>=ST.ELEC?'電気設計　回路図エディタ':'機械設計　3D CAD');
    R(127,19,184,19,'#18232f');line(127,38,311,38,P.line,.5);
    if(step<ST.ELEC)drawTools(g,c);else drawParts(g,c);
    c.save();c.beginPath();c.rect(VP.x,VP.y,VP.w,VP.h);c.clip();
    if(step<ST.ELEC)drawModel(g,c,t);else drawCircuit(g,c,t);
    c.restore();
    if(step===ST.ELEC&&(elec.drag||elec.carry)){const k=elec.drag?elec.drag.part:elec.carry,fi=g.items[g.fi],x=elec.drag?elec.drag.x:fi&&fi.slot?SLOT[fi.slot].x:VP.x+VP.w/2,y=elec.drag?elec.drag.y:fi&&fi.slot?SLOT[fi.slot].y-16:VP.y+18;
      c.save();c.globalAlpha=.9;T.rr(x-15,y-9,30,18,3,'rgba(255,255,255,.92)','#c79a00',.7);partSym(c,k,x,y-1.5,P.ink);jt(PARTS.find(q=>q.k===k).name,x,y+3.6,P.ink,4,'center');c.restore()}
    hov=hv0}
  function treeIcon(c,x,y,s){const col=s==='origin'?'#93a1b0':s.startsWith('スケッチ')?'#5fd0ff':s.startsWith('回転')?'#f6c21c':s.startsWith('押し出し')?'#f0a24f':s.startsWith('円形')?'#b48cff':s.startsWith('穴')?'#4fd28f':'#f06fa0';
    if(s==='origin'){line(x-2,y,x+2,y,col,.5);line(x,y-2,x,y+2,col,.5);ring(x,y,1.3,col,null,.4);return}
    T.rr(x-2.2,y-2.2,4.4,4.4,1,col)}
  function drawTools(g,c){TOOLS.forEach((tl,i)=>{const it=g.items.find(q=>q.tool===tl.k);const x=129+i*30,y=21,f=it&&g.isFocus(it)&&g.active(),act=tool===tl.k;
      T.rr(x,y,29,16,2,act?'#3b3215':f?'#2a3b4f':'#1d2a39',act?P.acc:f?P.acc:P.line,f||act?.9:.5);
      toolIcon(c,tl.k,x+14.5,y+6.2,act||f?P.acc:'#cfe3f5');jt(tl.name,x+14.5,y+10.6,act?P.acc:P.mut,tl.name.length>4?3.5:4,'center');jt(String(i+1),x+2,y+1.3,'#5d6b7a',3.4)})}
  function toolIcon(c,k,x,y,col){c.save();c.strokeStyle=col;c.fillStyle=col;c.lineWidth=.6;c.setLineDash([]);
    if(k==='sketch'){c.beginPath();c.ellipse(x-1,y+.5,3.4,3.2,0,-Math.PI/2,Math.PI/2);c.stroke();line(x-1,y-3,x-1,y+4,col,.5,[1,.8]);c.beginPath();c.moveTo(x+2.8,y-3.4);c.lineTo(x+4.4,y-2);c.lineTo(x+1.4,y+1);c.lineTo(x+.6,y+1.2);c.lineTo(x+.8,y+.4);c.closePath();c.fill()}
    else if(k==='revolve'){c.beginPath();c.ellipse(x,y+.5,4.6,1.8,0,.3,TAU-.5);c.stroke();c.beginPath();c.moveTo(x+4.1,y-1.3);c.lineTo(x+5.2,y+.6);c.lineTo(x+3,y+.4);c.fill();line(x,y-3.6,x,y+4,col,.5,[1,.8])}
    else if(k==='extrude'){c.strokeRect(x-4,y-.5,6,3.8);line(x-4,y-.5,x-2,y-2.5,col,.5);line(x+2,y-.5,x+4,y-2.5,col,.5);line(x-2,y-2.5,x+4,y-2.5,col,.5);line(x+4,y-2.5,x+4,y+1.3,col,.5);line(x+2,y+3.3,x+4,y+1.3,col,.5)}
    else if(k==='pattern'){for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.75,px=x+Math.cos(a)*3.6,py=y+1.2+Math.sin(a)*3.6;c.beginPath();c.moveTo(px+Math.cos(a)*1.6,py+Math.sin(a)*1.6);c.lineTo(px+Math.cos(a+2.2)*1,py+Math.sin(a+2.2)*1);c.lineTo(px+Math.cos(a-2.2)*1,py+Math.sin(a-2.2)*1);c.fill()}circ(x,y+1.2,1,col)}
    else if(k==='hole'){c.strokeRect(x-4.5,y-2.5,9,6);c.beginPath();c.ellipse(x,y+.5,2,1.4,0,0,TAU);c.fill();line(x,y-4,x,y-2.6,col,.5)}
    else if(k==='mirror'){line(x,y-3.6,x,y+4.2,col,.5,[1,.8]);c.beginPath();c.moveTo(x-1.2,y-2);c.lineTo(x-4.6,y+.4);c.lineTo(x-1.2,y+2.8);c.closePath();c.fill();c.beginPath();c.moveTo(x+1.2,y-2);c.lineTo(x+4.6,y+.4);c.lineTo(x+1.2,y+2.8);c.closePath();c.stroke()}
    c.restore()}
  function drawParts(g,c){PARTS.forEach((p,i)=>{const it=g.items.find(q=>q.part===p.k),x=129+i*45,y=21,used=elec.sw===p.k||elec.r===p.k,f=it&&g.isFocus(it)&&g.active(),carry=elec.carry===p.k||(elec.drag&&elec.drag.part===p.k);
      T.rr(x,y,44,16,2,used?'#141c26':carry?'#3b3215':f?'#2a3b4f':'#1d2a39',f||carry?P.acc:P.line,f||carry?.9:.5);
      c.save();if(used)c.globalAlpha=.35;R(x+3,y+3,13,10,'#f5f2e7');partSym(c,p.k,x+9.5,y+8,P.ink);jt(p.name,x+18,y+5.4,P.txt,p.name.length>4?4:4.6);c.restore();
      if(step===ST.ELEC)jt(String(i+1),x+40,y+1.3,'#5d6b7a',3.4)})}
  /* 回路図の記号 */
  function partSym(c,k,x,y,col,sc){sc=sc||1;const lw=sc>1?.75:.55;c.save();c.translate(x,y);c.scale(sc,sc);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=lw/sc;c.setLineDash([]);
    const L=(a,b,d,e,w)=>{c.lineWidth=(w||lw)/sc;c.beginPath();c.moveTo(a,b);c.lineTo(d,e);c.stroke()};
    if(k==='sw'){L(-5,0,-2.6,0);c.beginPath();c.arc(-2.2,0,.7,0,TAU);c.fill();c.beginPath();c.arc(2.2,0,.7,0,TAU);c.fill();L(-2,-.2,2.4,-2.4);L(2.6,0,5,0)}
    else if(k==='r'){L(-5,0,-3.2,0);c.lineWidth=lw/sc;c.strokeRect(-3.2,-1.3,6.4,2.6);L(3.2,0,5,0)}
    else if(k==='c'){L(-5,0,-.8,0);L(-.8,-2.4,-.8,2.4,lw*1.3);L(.8,-2.4,.8,2.4,lw*1.3);L(.8,0,5,0)}
    else if(k==='m'){L(-5,0,-2.6,0);c.lineWidth=lw/sc;c.beginPath();c.arc(0,0,2.6,0,TAU);c.stroke();c.font='700 3.2px '+S.FF;c.textAlign='center';c.textBaseline='middle';c.fillText('M',0,.1);L(2.6,0,5,0)}
    c.restore()}

  /* ---------- 3D モデル ---------- */
  function drawModel(g,c,t){
    const bgG=c.createLinearGradient(0,VP.y,0,VP.y+VP.h);bgG.addColorStop(0,'#2a3a4e');bgG.addColorStop(1,'#0e1621');c.fillStyle=bgG;c.fillRect(VP.x,VP.y,VP.w,VP.h);
    VPM=null;
    /* 床の目もり */c.save();c.globalAlpha=.55;for(let i=-4;i<=4;i++){const a=proj([i*.4,-1.15,-1.6]),b=proj([i*.4,-1.15,1.6]),a2=proj([-1.6,-1.15,i*.4]),b2=proj([1.6,-1.15,i*.4]);const col=i?'rgba(140,175,210,.16)':'rgba(140,175,210,.3)';line(a[0],a[1],b[0],b[1],col,.35);line(a2[0],a2[1],b2[0],b2[1],col,.35)}c.restore();
    if(render>0&&step===ST.MIR){drawRender(g,c,t);return}
    const L=[],cad={col:CADCOL,metal:.25},prm=prismMesh(),cy=cylMesh();
    const body=step>=ST.PIN?sector(360):step===ST.RV?sector(rv.a):null;if(body)L.push(Object.assign({m:body,M:M.id()},cad));
    const hiSpike=hov==='spike'||(step===ST.PAT&&sub==='count');
    /* ピン */
    if(step===ST.PIN&&pn.l>0)L.push({m:cy,M:pinM(SPK[2],pn.l),col:[.82,.86,.9],metal:.6});
    if(step>=ST.TRI)L.push(Object.assign({m:cy,M:pinM(SPK[2],PIN_L)},{col:hiSpike?SELCOL:[.82,.86,.9],metal:.6,emis:hiSpike?.18:0}));
    /* 三角パーツ */
    if(step>=ST.PAT||(step===ST.TRI&&ex.t>0))L.push(Object.assign({m:prm,M:triM(SPK[2],step>=ST.PAT?TRI_T:ex.t)},cad,hiSpike?{col:SELCOL,emis:.18}:null));
    if(step>=ST.HOLE)SPK.forEach((a,i)=>{if(i!==2){L.push({m:cy,M:pinM(a,PIN_L),col:[.82,.86,.9],metal:.6});L.push(Object.assign({m:prm,M:triM(a,TRI_T)},cad))}});
    if(step===ST.PAT&&sub==='count')patAngles(pt.n).forEach(a=>{if(Math.abs(a-SPK[2])>.01){L.push({m:cy,M:pinM(a,PIN_L),col:PREVCOL,emis:.45,alpha:.55});L.push({m:prm,M:triM(a,TRI_T),col:PREVCOL,emis:.45,alpha:.55})}});
    /* 目の穴 */
    holes.forEach((h,i)=>{const hl=i===0&&(hov==='hole');L.push({m:cy,M:holeM(h.x,h.y),col:hl?SELCOL:[.07,.08,.1],metal:.1,emis:hl?.3:0})});
    if(step===ST.HOLE&&sub==='place'&&hole.on)L.push({m:cy,M:holeM(hole.x,hole.y),col:PREVCOL,emis:.5,alpha:.8});
    if(step===ST.MIR&&sub==='plane'&&holes[0]&&!holes[1])L.push({m:cy,M:holeM(-holes[0].x,holes[0].y),col:PREVCOL,emis:.5,alpha:.5});
    /* 基準面：えらんでいる（マウスが乗っている）面だけを、はっきり見せる */
    const planes=(step===ST.SK||step===ST.MIR)&&sub==='plane'?(step===ST.SK?['front','top','right']:['right','top']):[];
    const bx=boxMesh(),PL={front:M.s(2.6,2.6,.004),top:M.s(2.6,.004,2.6),right:M.s(.004,2.6,2.6)};
    const hp=planes.find(k=>hov==='pl_'+k);
    planes.forEach(k=>{const h=k===hp;L.push({m:bx,M:PL[k],col:h?SELCOL:[.35,.6,.95],emis:h?.4:.15,alpha:h?.48:.07})});
    if(L.length&&G.ok){const k=Math.min(S.SC,4);G.render(L,camObj(),VP.w*k,VP.h*k);G.blit(c,VP.x,VP.y,VP.w,VP.h)}
    else if(L.length)fallback(c);
    overlay(g,c,t,planes,hp);
    triad(c,VP.x+12,VP.y+VP.h-21);
    const vn=Math.abs(cam.yaw)<.03&&Math.abs(cam.pitch)<.03?'正面から見た図':'ななめから見た図';jt(vn,VP.x+VP.w-4,VP.y+3,'rgba(220,235,250,.7)',4.4,'right');
    prompt(c)}
  function patAngles(n){if(n<=1)return[SPK[2]];const span=SPK[0]-SPK[4],st=span/(n-1);return Array.from({length:n},(_,i)=>SPK[4]+i*st)}
  function fallback(c){const o=proj([0,0,0]),r=pxPerUnit();if(step>=ST.RV){const gr=c.createRadialGradient(o[0]-r*.35,o[1]-r*.4,r*.1,o[0],o[1],r);gr.addColorStop(0,'#d8e4f0');gr.addColorStop(1,'#56708c');c.fillStyle=gr;c.beginPath();c.ellipse(o[0],o[1],r,r*KY,0,0,TAU);c.fill()}}
  function overlay(g,c,t,planes,hp){
    const o=proj([0,0,0]);
    /* 原点 */
    if(step<=ST.RV){line(o[0]-3,o[1],o[0]+3,o[1],'#f0624f',.5);line(o[0],o[1]-3,o[0],o[1]+3,'#4fd28f',.5);ring(o[0],o[1],1.6,'#ffffff',null,.4)}
    /* スケッチ1：半だ円と中心線 */
    if((step===ST.SK&&sub==='draw')||step===ST.RV){const a=proj([0,-1.3,0]),b=proj([0,1.3,0]);line(a[0],a[1],b[0],b[1],'rgba(255,255,255,.75)',.45,[3,1,.6,1]);
      const rw=step===ST.RV?1:sk.w,rh=step===ST.RV?KY:sk.h;
      if(rw>0&&rh>0){c.save();c.lineWidth=.8;
        if(step===ST.SK){c.strokeStyle='rgba(95,208,255,.35)';c.setLineDash([1.5,1.5]);c.beginPath();for(let i=0;i<=40;i++){const v=Math.PI/2+i/40*Math.PI,p=proj([Math.cos(v)*rw,Math.sin(v)*rh,0]);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])}c.stroke();c.setLineDash([])}
        c.strokeStyle='#5fd0ff';c.beginPath();for(let i=0;i<=40;i++){const v=-Math.PI/2+i/40*Math.PI,p=proj([Math.cos(v)*rw,Math.sin(v)*rh,0]);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])}c.stroke();
        const p0=proj([0,-rh,0]),p1=proj([0,rh,0]);line(p0[0],p0[1],p1[0],p1[1],'#5fd0ff',.8);c.restore();
        if(step===ST.SK){const w=skW(),h=skH(),okW=Math.abs(w-W_T)<=1,okH=Math.abs(h-H_T)<=1,pr=proj([rw,0,0]),pl=proj([-rw,0,0]),pt=proj([0,rh,0]),pb=proj([0,-rh,0]);
          /* 幅の寸法（中心線をはさんで両側） */const yy=Math.max(VP.y+12,pt[1]-7);line(pl[0],yy,pr[0],yy,'#f6e7a0',.4);line(pr[0],pr[1],pr[0],yy-2,'#f6e7a0',.3,[1,1]);line(pl[0],pl[1],pl[0],yy-2,'#f6e7a0',.3,[1,1]);
          T.rr(o[0]-15,yy-5,30,9,2,okW?'#1d4a35':'#3b3215',okW?P.ok:P.acc,.6);jt('幅 '+w,o[0],yy-4.2,okW?'#c9f5dd':'#ffe9a6',5.6,'center');
          /* 高さの寸法 */const xx=Math.min(VP.x+VP.w-22,pr[0]+8);line(xx,pt[1],xx,pb[1],'#f6e7a0',.4);line(o[0],pt[1],xx+2,pt[1],'#f6e7a0',.3,[1,1]);line(o[0],pb[1],xx+2,pb[1],'#f6e7a0',.3,[1,1]);
          T.rr(xx+2,o[1]-4.5,30,9,2,okH?'#1d4a35':'#3b3215',okH?P.ok:P.acc,.6);jt('高さ '+h,xx+17,o[1]-3.7,okH?'#c9f5dd':'#ffe9a6',5.6,'center');
          circ(pr[0],pr[1],1.1,'#ffffff');circ(pt[0],pt[1],1.1,'#ffffff')}}}
    if(step===ST.SK&&sub==='draw'&&!sk.w&&!sk.h){T.rr(o[0]+6,o[1]-16,62,11,2,'rgba(10,16,24,.85)',P.acc,.4);jt('ここから右上へドラッグ',o[0]+37,o[1]-14.4,'#ffe9a6',5,'center');
      const k=(anim*1.2)%1;ring(o[0],o[1],2+k*8,`rgba(246,194,28,${1-k})`,null,.6)}
    /* 回転：角度 */
    if(step===ST.RV&&sub==='drag'){const h=rvHandle(),a0=proj([1.25,-1.05,0]);c.save();c.strokeStyle='rgba(246,194,28,.5)';c.lineWidth=.5;c.beginPath();for(let i=0;i<=36;i++){const a=i/36*TAU,p=proj([Math.cos(a)*1.25,-1.05,Math.sin(a)*1.25]);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])}c.stroke();
        c.strokeStyle=P.acc;c.lineWidth=1.1;c.beginPath();const n=Math.max(1,Math.round(rv.a/5));for(let i=0;i<=n;i++){const a=i/n*rv.a*Math.PI/180,p=proj([Math.cos(a)*1.25,-1.05,Math.sin(a)*1.25]);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])}c.stroke();c.restore();
      circ(a0[0],a0[1],1.2,P.acc);const pulse=rv.drag?0:(Math.sin(anim*5)+1)/2;circ(h[0],h[1],3.6+pulse,'rgba(246,194,28,.25)');circ(h[0],h[1],3,P.acc);ring(h[0],h[1],3,'#5a4410',null,.5);
      T.rr(h[0]+5,h[1]-4,30,8,2,'rgba(10,16,24,.85)',P.acc,.4);jt('角度 '+Math.round(rv.a)+'°',h[0]+20,h[1]-3.2,'#ffe9a6',5,'center');
      if(!rv.drag&&rv.a===0){T.rr(VP.x+VP.w/2-38,VP.y+14,76,10,2,'rgba(10,16,24,.85)',P.acc,.4);jt('↔ 横にドラッグして回す',VP.x+VP.w/2,VP.y+15.6,'#ffe9a6',5,'center')}}
    /* ピン：円のスケッチ・矢印 */
    if(step===ST.PIN){const b=pinBase(SPK[2]),d=dirPin(),sp=proj([b[0]+d[0]*.03,b[1]+d[1]*.03,0]),hl=hov==='pin'||sub==='drag';
      const it=g.items.find(i=>i.sel==='pin');if(it){it.x=sp[0]-8;it.y=sp[1]-8;it.w=16;it.h=16}
      if(sub!=='drag'||pn.l===0){c.save();c.strokeStyle=hl?'#ffb347':'#5fd0ff';c.lineWidth=.8;c.setLineDash(sub==='drag'?[]:[1.2,.8]);c.beginPath();c.ellipse(sp[0],sp[1],2.6,1.2,0,0,TAU);c.stroke();c.restore();
        if(sub==='sel'){const pulse=(Math.sin(anim*5)+1)/2;ring(sp[0],sp[1],5+pulse*1.5,hl?'#ffb347':'rgba(95,208,255,.6)',[1.5,1],.5);T.rr(sp[0]+8,sp[1]-12,38,9,2,'rgba(10,16,24,.85)','#5fd0ff',.4);jt('円 Φ2',sp[0]+27,sp[1]-10.6,'#bfe9ff',4.8,'center')}}
      if(sub==='drag')drawArrow(c,arrowOf(pinTipPt(),d),'長さ '+pn.l+' mm',pn.l===PIN_L)}
    /* 三角形のスケッチ／矢印 */
    if(step===ST.TRI){const pts=triPts(SPK[2]).map(proj),hl=hov==='tri'||sub==='drag';
      if(sub!=='drag'||ex.t===0){c.save();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(hl){c.fillStyle='rgba(246,162,40,.35)';c.fill()}c.strokeStyle=hl?'#ffb347':'#5fd0ff';c.lineWidth=.8;c.setLineDash(sub==='drag'?[]:[2,1.2]);c.stroke();c.restore()}
      const it=g.items.find(i=>i.sel==='tri');if(it){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);it.x=Math.min(...xs)-2;it.y=Math.min(...ys)-2;it.w=Math.max(...xs)-it.x+2;it.h=Math.max(...ys)-it.y+2}
      if(sub==='drag')drawArrow(c,arrowOf(triCenter(ex.t),[0,0,1]),'厚さ '+ex.t.toFixed(1)+' mm',Math.abs(ex.t-TRI_T)<.01)}
    /* 円形パターン */
    if(step===ST.PAT&&sub==='sel'){const it=g.items.find(i=>i.sel==='spike');if(it){const pts=triPts(SPK[2]).concat([pinBase(SPK[2])]).map(proj),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);it.x=Math.min(...xs)-3;it.y=Math.min(...ys)-3;it.w=Math.max(...xs)-it.x+3;it.h=Math.max(...ys)-it.y+3}}
    if(step===ST.PAT&&sub==='count'){const b={x:VP.x+3,y:VP.y+3,w:70,h:40};T.rr(b.x,b.y,b.w,b.h,2,'rgba(16,24,34,.92)',P.line,.5);jt('円形パターン',b.x+4,b.y+3,P.acc,5.2);
      const s=slider();jt('個数',b.x+4,b.y+13,P.mut,4.6);jt(String(pt.n),b.x+b.w-6,b.y+12,pt.n===5?P.ok:'#ffe9a6',7,'right');
      R(s.x,s.y-.6,s.w,1.2,'#33455a');for(let i=0;i<=8;i++)line(s.x+i*s.w/8,s.y+1.5,s.x+i*s.w/8,s.y+2.6,'#5d6b7a',.3);const kx=s.x+(pt.n-1)/8*s.w;circ(kx,s.y,2.6,P.acc);ring(kx,s.y,2.6,'#5a4410',null,.4);
      jt('角度 200°（等間隔）',b.x+4,b.y+28.5,P.mut,4.2);const okb=g.items.find(i=>i.id==='pt_ok');if(okb){const f=g.isFocus(okb);okb.x=b.x+b.w-24;okb.y=b.y+b.h-12;T.rr(okb.x,okb.y,okb.w,okb.h,2,f?'#2f6a4a':'#1d4a35',f?P.acc:P.ok,f?.8:.5);jt('OK',okb.x+okb.w/2,okb.y+2.2,'#e9fff2',5,'center')}}
    /* 穴あけ：位置の読み取り */
    if(step===ST.HOLE&&sub==='place'){const ch=proj([0,0,1]);line(ch[0]-70,ch[1],ch[0]+70,ch[1],'rgba(255,255,255,.18)',.3,[1.5,1.5]);line(ch[0],ch[1]-60,ch[0],ch[1]+60,'rgba(255,255,255,.18)',.3,[1.5,1.5]);
      if(hole.on){const p=proj([hole.x*MM,hole.y*MM,surfZ(hole.x*MM,hole.y*MM)]);line(ch[0],p[1],p[0],p[1],'#f6e7a0',.35);line(p[0],ch[1],p[0],p[1],'#f6e7a0',.35);
        T.rr(p[0]+5,p[1]-11,36,9,2,'rgba(10,16,24,.88)',P.acc,.4);jt(`X ${hole.x}　Y ${hole.y}`,p[0]+23,p[1]-10,'#ffe9a6',4.8,'center');line(p[0]-4,p[1],p[0]+4,p[1],'#ffffff',.4);line(p[0],p[1]-4,p[0],p[1]+4,'#ffffff',.4)}}
    /* ミラー：穴のえらぶ枠 */
    if(step===ST.MIR&&sub==='sel'){const it=g.items.find(i=>i.sel==='hole');if(it&&holes[0]){const p=proj([holes[0].x*MM,holes[0].y*MM,surfZ(holes[0].x*MM,holes[0].y*MM)]);it.x=p[0]-6;it.y=p[1]-6;it.w=12;it.h=12;
      const f=g.isFocus(it)||hov==='hole';ring(p[0],p[1],5+(f?0:Math.sin(anim*5)*.8),f?P.acc:'rgba(246,194,28,.6)',[1.5,1],.6)}}
    /* 面をえらぶカード */
    if(planes.length){planes.forEach(k=>{const it=g.items.find(i=>i.plane===k);if(!it)return;const f=g.isFocus(it)||hov==='pl_'+k;
        T.rr(it.x,it.y,it.w,it.h,2,f?'#4a3512':'rgba(14,24,38,.92)',f?'#ffb347':'#5d7fa6',f?.9:.5);planeIcon(c,it.x+10,it.y+11,k,f);
        jt(PLANE[k].n,it.x+20,it.y+3,f?'#ffe2b0':'#dcebff',6);jt(step===ST.MIR?PLANE_MIR[k]:PLANE[k].sub,it.x+20,it.y+12.5,f?'#ffd9a0':'#9fb6cf',3.7)});
      if(step===ST.SK){/* 顔の向き（正面）の目印 */const a=proj([0,0,0]),b=proj([0,0,1.25]);line(a[0],a[1],b[0],b[1],'#ffd36b',.6);const an=Math.atan2(b[1]-a[1],b[0]-a[0]);c.save();c.fillStyle='#ffd36b';c.beginPath();c.moveTo(b[0]+Math.cos(an)*3,b[1]+Math.sin(an)*3);c.lineTo(b[0]+Math.cos(an+2.5)*2.4,b[1]+Math.sin(an+2.5)*2.4);c.lineTo(b[0]+Math.cos(an-2.5)*2.4,b[1]+Math.sin(an-2.5)*2.4);c.fill();c.restore();jt('顔の向き',b[0]+3,b[1]+1,'#ffd36b',4.4)}
      if(hp){jt('→ 「'+PLANE[hp].n+'」がオレンジ色の面',VP.x+VP.w-4,VP.y+12,'#ffd9a0',4.4,'right')}}
  }
  /* 面のアイコン（立方体の、その面だけ色をつける） */
  function planeIcon(c,x,y,k,f){const s=5,col=f?'#ffb347':'#7fb3ff',dim='rgba(160,190,225,.18)';c.save();c.lineWidth=.4;c.strokeStyle='rgba(200,220,240,.7)';
    const F=[[x-s,y-s*.3],[x+s*.3,y-s*.3],[x+s*.3,y+s],[x-s,y+s]],Tp=[[x-s,y-s*.3],[x-s*.4,y-s],[x+s*.9,y-s],[x+s*.3,y-s*.3]],Rt=[[x+s*.3,y-s*.3],[x+s*.9,y-s],[x+s*.9,y+s*.3],[x+s*.3,y+s]];
    [['front',F],['top',Tp],['right',Rt]].forEach(([kk,pts])=>{c.fillStyle=kk===k?col:dim;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.stroke()});c.restore()}
  function drawArrow(c,h,label,ok){line(h.base[0],h.base[1],h.tip[0],h.tip[1],P.acc,1);const ang=Math.atan2(h.dir[1],h.dir[0]);c.save();c.fillStyle=P.acc;c.beginPath();c.moveTo(h.tip[0]+Math.cos(ang)*3.4,h.tip[1]+Math.sin(ang)*3.4);c.lineTo(h.tip[0]+Math.cos(ang+2.4)*2.6,h.tip[1]+Math.sin(ang+2.4)*2.6);c.lineTo(h.tip[0]+Math.cos(ang-2.4)*2.6,h.tip[1]+Math.sin(ang-2.4)*2.6);c.fill();c.restore();
    T.rr(h.tip[0]+5,h.tip[1]-9,36,8,2,ok?'#1d4a35':'rgba(10,16,24,.85)',ok?P.ok:P.acc,.4);jt(label,h.tip[0]+23,h.tip[1]-8.2,ok?'#c9f5dd':'#ffe9a6',5,'center')}
  function triad(c,x,y){const o=proj([0,0,0]);[[1,0,0,'#f0624f','X'],[0,1,0,'#4fd28f','Y'],[0,0,1,'#5fd0ff','Z']].forEach(a=>{const p=proj([a[0]*.25,a[1]*.25,a[2]*.25]),dx=(p[0]-o[0])*1.4,dy=(p[1]-o[1])*1.4;line(x,y,x+dx,y+dy,a[3],.6);jt(a[4],x+dx*1.25,y+dy*1.25-2,a[3],3.8,'center')})}
  function prompt(c){const T2={tool:'ツールバーの「'+({sketch:'スケッチ',revolve:'回転',extrude:'押し出し',pattern:'円形パターン',hole:'穴あけ',mirror:'ミラー'})[STEP_TOOL[step]]+'」をクリック'};
    const s=sub==='tool'?T2.tool:step===ST.SK?(sub==='plane'?'左上のカードから、スケッチをかく面をクリック':'原点から右上へドラッグして半だ円をかく'):step===ST.RV?'横にドラッグして、ぐるっと回す':
      step===ST.PIN?(sub==='sel'?'体の上の、青い円（Φ2）をクリック':'矢印の向きにドラッグして、ピンをのばす'):step===ST.TRI?(sub==='sel'?'ピンの先の、三角形の点線をクリック':'矢印の向きにドラッグして、厚さを決める'):
      step===ST.PAT?(sub==='sel'?'ピンと三角パーツの組をクリック':'「個数」のつまみをドラッグして OK'):step===ST.HOLE?'目の穴の位置をクリック':(sub==='sel'?'コピーする目の穴をクリック':'左上のカードから、左右対称の基準になる面をクリック');
    R(VP.x,VP.y+VP.h-9,VP.w,9,'rgba(6,10,16,.72)');jt('▶ '+S.touchText(s),VP.x+4,VP.y+VP.h-7.8,'#e8eef4',4.8)}
  function drawRender(g,c,t){const k=1-render/2.2;S.Sanpo.draw(c,VP.x,VP.y+2,VP.w,VP.h-6,{yaw:.5-k*.9,face:false,limbs:false,spikes:5,eyes:2,glow:[0,0]});
    T.rr(VP.x+4,VP.y+4,74,10,2,'rgba(10,16,24,.85)',P.acc,.4);jt('レンダリング：黄銅（しんちゅう）',VP.x+41,VP.y+5.6,'#ffe9a6',4.6,'center')}

  /* ---------- 回路図 ---------- */
  function drawCircuit(g,c,t){R(VP.x,VP.y,VP.w,VP.h,'#f5f2e7');
    c.save();c.strokeStyle='rgba(28,37,48,.06)';c.lineWidth=.3;c.beginPath();for(let x=VP.x;x<VP.x+VP.w;x+=6){c.moveTo(x,VP.y);c.lineTo(x,VP.y+VP.h)}for(let y=VP.y;y<VP.y+VP.h;y+=6){c.moveTo(VP.x,y);c.lineTo(VP.x+VP.w,y)}c.stroke();c.restore();
    const ink=P.ink,w=.7,ok=step>=ST.DONE;
    line(BATX,RAIL_T,SLOT.sw.x-11,RAIL_T,ink,w);line(SLOT.sw.x+11,RAIL_T,SLOT.r.x-11,RAIL_T,ink,w);line(SLOT.r.x+11,RAIL_T,LEDX[1],RAIL_T,ink,w);
    line(BATX,RAIL_B,LEDX[1],RAIL_B,ink,w);line(BATX,RAIL_T,BATX,96,ink,w);line(BATX,108,BATX,RAIL_B,ink,w);
    LEDX.forEach(x=>{line(x,RAIL_T,x,LEDY-6,ink,w);line(x,LEDY+6,x,RAIL_B,ink,w);circ(x,RAIL_T,1,ink);circ(x,RAIL_B,1,ink)});
    /* 電池 */line(BATX-6,96,BATX+6,96,ink,.9);line(BATX-3.5,100,BATX+3.5,100,ink,1.8);line(BATX-6,104,BATX+6,104,ink,.9);line(BATX-3.5,108,BATX+3.5,108,ink,1.8);
    jt('＋',BATX-11,90,'#c0392b',6);jt('−',BATX-10,104,'#1f5fae',6);jt('BT1　電池 3V',BATX+8,98,P.inkmut,4.4);
    if(!ok){c.save();c.fillStyle='rgba(192,57,43,.7)';for(const x of[166,214]){c.beginPath();c.moveTo(x+3,RAIL_T-4);c.lineTo(x-1,RAIL_T-6);c.lineTo(x-1,RAIL_T-2);c.fill()}c.restore();jt('電流の向き',158,RAIL_T-12,'rgba(192,57,43,.8)',4)}
    ['sw','r'].forEach(k=>{const s=SLOT[k],it=g.items.find(i=>i.slot===k);
      if(elec[k]){R(s.x-12,s.y-6,24,12,'#f5f2e7');partSym(c,k,s.x,s.y,ink,2.2);jt(k==='sw'?'SW1':'R1',s.x,s.y-12,P.inkmut,4.4,'center')}
      else{const f=it&&(g.isFocus(it)||(elec.drag&&Math.abs(elec.drag.x-s.x)<=16&&Math.abs(elec.drag.y-s.y)<=12));const pulse=(Math.sin(anim*4)+1)/2;
        T.rr(s.x-12,s.y-8,24,16,2,f?'#ffe7a8':'#fff3c4',f?'#c77d00':'#c79a00',f?.9:.6);c.save();c.setLineDash([1.5,1]);c.strokeStyle=`rgba(199,154,0,${.4+pulse*.4})`;c.lineWidth=.4;c.strokeRect(s.x-14,s.y-10,28,20);c.restore();
        jt('？',s.x,s.y-4.4,'#c79a00',8,'center');jt(k==='sw'?'つなぐ・切る':'電流をおさえる',s.x,s.y+10,P.inkmut,4,'center')}});
    LEDX.forEach((x,i)=>{const it=g.items.find(q=>q.id==='led'+i),f=it&&g.isFocus(it)&&step===ST.LED,lit=ok&&!elec.led[i];
      if(f)T.rr(x-10,LEDY-11,20,22,2,'rgba(246,194,28,.18)','#c79a00',.6);
      if(lit&&!S.reduceMotion){const a=.35+.2*Math.sin(t*6);const gr=c.createRadialGradient(x,LEDY,0,x,LEDY,13);gr.addColorStop(0,`rgba(255,214,60,${a+.3})`);gr.addColorStop(1,'rgba(255,214,60,0)');c.fillStyle=gr;c.beginPath();c.arc(x,LEDY,13,0,TAU);c.fill()}
      c.save();c.translate(x,LEDY);c.rotate(elec.flipA[i]);c.fillStyle=lit?'#ffd23c':'#ffffff';c.strokeStyle=ink;c.lineWidth=.7;c.beginPath();c.moveTo(-4.5,-4);c.lineTo(4.5,-4);c.lineTo(0,3.5);c.closePath();c.fill();c.stroke();line(-4.5,3.5,4.5,3.5,ink,.9);
      line(4,-1,6.5,-3.2,ink,.4);line(5.2,1,7.7,-1.2,ink,.4);c.restore();
      jt('D'+(i+1),x-9,LEDY-3,P.inkmut,4.2,'right');jt(i?'右目':'左目',x+9.5,LEDY+7,P.inkmut,3.8)});
    if(step===ST.LED){jt('LEDは、三角の向きに電流が流れる',VP.x+4,VP.y+VP.h-17,P.inkmut,4.4);jt('（三角の平らな側＝アノードを＋側へ）',VP.x+4,VP.y+VP.h-11,P.inkmut,4.2);
      const it=g.items.find(i=>i.id==='erc');if(it){const f=g.isFocus(it);T.rr(it.x,it.y,it.w,it.h,2,f?'#2f6a4a':'#1d4a35',f?P.acc:P.ok,f?.9:.5);jt('回路チェック',it.x+it.w/2,it.y+3.4,'#e9fff2',5,'center')}}
    if(ok){const path=[[BATX,96],[BATX,RAIL_T],[LEDX[0],RAIL_T],[LEDX[0],RAIL_B],[BATX,RAIL_B],[BATX,108]];const segs=[];let tot=0;for(let i=0;i<path.length-1;i++){const l=Math.hypot(path[i+1][0]-path[i][0],path[i+1][1]-path[i][1]);segs.push(l);tot+=l}
      for(let q=0;q<14;q++){let d=((elec.flow*40+q*tot/14)%tot);for(let i=0;i<segs.length;i++){if(d<=segs[i]){const a=path[i],b=path[i+1],k=d/segs[i];circ(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,1,'#e67e22');break}d-=segs[i]}}
      T.rr(VP.x+VP.w-70,VP.y+VP.h-16,66,12,2,'#1d4a35',P.ok,.6);jt('回路チェック：OK',VP.x+VP.w-37,VP.y+VP.h-13.4,'#e9fff2',5,'center')}
    if(step===ST.ELEC){R(VP.x,VP.y+VP.h-9,VP.w,9,'rgba(6,10,16,.72)');jt('▶ 上の部品を、回路図の「？」へドラッグ',VP.x+4,VP.y+VP.h-7.8,'#e8eef4',4.8)}}

  /* マウスが乗っているもの（光らせる） */
  const baseMove=g.onMove;g.onMove=(p,down)=>{hov=null;if(g.run&&!g.done&&inVP(p)){const it=g.items.find(i=>!i.off&&inRect(p,i));if(it){hov=it.sel||(it.plane?'pl_'+it.plane:null)}}baseMove(p,down)};
  g.dbg=()=>({step,sub,tool,skW:skW(),skH:skH(),rv:rv.a,pin:pn.l,ex:ex.t,pt:pt.n,holes:holes.slice(),hole:{...hole},elec:{sw:elec.sw,r:elec.r,led:elec.led.slice()},tree:tree.slice(),cam:{...cam},
    O:proj([0,0,0]),ppu:pxPerUnit(),rvH:rvHandle(),pinH:arrowOf(pinTipPt(),dirPin()),exH:arrowOf(triCenter(ex.t),[0,0,1]),slider:slider(),slot:SLOT,ledx:LEDX,ledy:LEDY,VP,items:g.items.map(i=>({id:i.id,x:i.x,y:i.y,w:i.w,h:i.h}))});
  g.dbgHoleAt=(x,y)=>{VPM=null;return proj([x*MM,y*MM,surfZ(x*MM,y*MM)])};
  g.dbgAt=(x,y)=>{VPM=null;const o=proj([0,0,0]),u=pxPerUnit();return[o[0]+x*MM*u,o[1]-y*MM*u]};
  return g}
S.CadGame=CadGame;
})();
