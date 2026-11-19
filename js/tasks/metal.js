/* =====================================================================
   三友ワークス — 金属・工具の絵（Ver. 2.4）
   のっぺりしないように、光の当たり方（グラデーション）や加工のあとを描くための部品。
   SW.Metal.xxx(c, …) で使う。座標はゲーム画面（横320×縦180）の値。
   ===================================================================== */
(()=>{
'use strict';
const S=SW,TAU=Math.PI*2;
const STEEL=['#4b535c','#9aa5b0','#eef3f7','#b6c0ca','#6d7884','#3e454d'];
const DARK=['#20262d','#3d4752','#6a7684','#47525e','#262d35'];
const BRASS=['#7a5410','#c8902a','#ffe7a0','#e9b742','#a7761b','#6e4a0c'];
/* 横方向に丸みのある金属（円柱を正面から見た形）のグラデーション */
function cylGrad(c,x0,x1,cols){const g=c.createLinearGradient(x0,0,x1,0),n=cols.length;cols.forEach((col,i)=>g.addColorStop(i/(n-1),col));return g}
function vGrad(c,y0,y1,cols){const g=c.createLinearGradient(0,y0,0,y1),n=cols.length;cols.forEach((col,i)=>g.addColorStop(i/(n-1),col));return g}
/* 金属の板・かたまり（上の面＋正面）。top：上の面の奥行き */
function block(c,x,y,w,h,o){o=o||{};const top=o.top==null?3:o.top,pal=o.pal||'steel';
  const front=pal==='brass'?['#f7d478','#e2ad3c','#c38a22','#9a6a14']:pal==='dark'?['#56616d','#3c4550','#2b323a','#20262d']:['#d9e0e6','#b3bdc7','#97a2ad','#77828d'];
  const topc=pal==='brass'?['#fff2c0','#f3cf6a']:pal==='dark'?['#6f7b88','#55606c']:['#f4f7fa','#cdd5dc'];
  c.save();
  if(top>0){c.fillStyle=vGrad(c,y-top,y,topc);c.beginPath();c.moveTo(x,y);c.lineTo(x+top*.8,y-top);c.lineTo(x+w+top*.8,y-top);c.lineTo(x+w,y);c.closePath();c.fill();
    c.fillStyle=vGrad(c,y-top,y+h,pal==='brass'?['#c18a20','#7a540f']:['#7c8792','#454d55']);c.beginPath();c.moveTo(x+w,y);c.lineTo(x+w+top*.8,y-top);c.lineTo(x+w+top*.8,y+h-top);c.lineTo(x+w,y+h);c.closePath();c.fill()}
  c.fillStyle=vGrad(c,y,y+h,front);c.fillRect(x,y,w,h);
  /* 加工のあと（細い横すじ） */
  if(o.lines!==false){c.globalAlpha=pal==='brass'?.18:.12;c.strokeStyle=pal==='brass'?'#fff6d6':'#ffffff';c.lineWidth=.25;for(let yy=y+1.2;yy<y+h;yy+=1.6){c.beginPath();c.moveTo(x+.5,yy);c.lineTo(x+w-.5,yy);c.stroke()}c.globalAlpha=1}
  c.strokeStyle=pal==='brass'?'rgba(110,74,12,.7)':'rgba(30,36,44,.6)';c.lineWidth=.35;c.strokeRect(x,y,w,h);
  /* 面取り（角のハイライト） */c.strokeStyle=pal==='brass'?'rgba(255,248,220,.75)':'rgba(255,255,255,.6)';c.lineWidth=.4;c.beginPath();c.moveTo(x+.3,y+h-.3);c.lineTo(x+.3,y+.3);c.lineTo(x+w-.3,y+.3);c.stroke();
  c.restore()}
/* 正面から見た円柱（工具のシャンクなど）。spin：回転中なら時間を入れる（縞が流れる） */
function shank(c,x,y,w,h,o){o=o||{};c.save();c.fillStyle=cylGrad(c,x,x+w,o.cols||STEEL);c.fillRect(x,y,w,h);
  if(o.spin!=null&&!S.reduceMotion){c.globalAlpha=.18;c.fillStyle='#ffffff';const ph=(o.spin*o.rpm)%1;for(let k=0;k<3;k++){const xx=x+((ph+k/3)%1)*w;c.fillRect(xx-.3,y,.6,h)}c.globalAlpha=1}
  c.strokeStyle='rgba(20,24,30,.55)';c.lineWidth=.3;c.strokeRect(x,y,w,h);c.restore()}
/* ねじれ刃（エンドミル・ドリルの刃の部分）。helix：らせんの傾き */
function flutes(c,x,y,w,h,o){o=o||{};const n=o.n||5,ph=o.spin!=null&&!S.reduceMotion?(o.spin*(o.rpm||4))%1:0;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  c.fillStyle=cylGrad(c,x,x+w,o.cols||STEEL);c.fillRect(x,y,w,h);
  const pitch=h/n,sl=w*(o.helix||.9);
  for(let k=-1;k<=n+1;k++){const y0=y+(k+ph)*pitch;
    c.fillStyle='rgba(20,26,34,.55)';c.beginPath();c.moveTo(x,y0);c.lineTo(x+w,y0-sl);c.lineTo(x+w,y0-sl+pitch*.42);c.lineTo(x,y0+pitch*.42);c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=.3;c.beginPath();c.moveTo(x,y0+pitch*.42);c.lineTo(x+w,y0-sl+pitch*.42);c.stroke()}
  c.restore();c.save();c.strokeStyle='rgba(20,24,30,.6)';c.lineWidth=.3;c.strokeRect(x,y,w,h);c.restore()}
/* 上から見た、旋盤で削った丸い部品（同心円の削りあと＋光の帯）。haze：くもり 0〜1 */
function turnedDisc(c,x,y,r,o){o=o||{};c.save();
  /* 影 */c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x+2.5,y+3.5,r+1,r*.98+1,0,0,TAU);c.fill();
  /* 面取りの輪 */const ch=o.chamfer==null?3:o.chamfer;
  const rg=c.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r);rg.addColorStop(0,'#fff0b8');rg.addColorStop(.6,'#d9a333');rg.addColorStop(1,'#8a5f12');c.fillStyle=rg;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  /* 上の平らな面：円すい形のグラデーションで、金属のつやを出す */
  const ir=r-ch;
  if(c.createConicGradient){const cg=c.createConicGradient(-.6,x,y);[['#b47f1d',0],['#ffeaa8',.08],['#e2ab38',.2],['#a8741a',.33],['#f6d37a',.5],['#fff3c8',.58],['#d39b2c',.72],['#9c6b15',.86],['#b47f1d',1]].forEach(([col,s])=>cg.addColorStop(s,col));c.fillStyle=cg}
  else{const g2=c.createRadialGradient(x-ir*.3,y-ir*.3,2,x,y,ir);g2.addColorStop(0,'#ffeaa8');g2.addColorStop(1,'#b47f1d');c.fillStyle=g2}
  c.beginPath();c.arc(x,y,ir,0,TAU);c.fill();
  /* 同心円の削りあと */c.lineWidth=.22;for(let rr=2;rr<ir;rr+=1.15){c.strokeStyle=(rr*7|0)%3?'rgba(255,248,220,.13)':'rgba(90,60,10,.16)';c.beginPath();c.arc(x,y,rr,0,TAU);c.stroke()}
  /* 中心のセンター穴 */c.fillStyle='rgba(80,52,8,.5)';c.beginPath();c.arc(x,y,1.1,0,TAU);c.fill();
  /* 面取りの線 */c.strokeStyle='rgba(255,246,210,.85)';c.lineWidth=.45;c.beginPath();c.arc(x,y,ir,Math.PI*.95,Math.PI*1.7);c.stroke();
  c.strokeStyle='rgba(90,60,10,.8)';c.lineWidth=.45;c.beginPath();c.arc(x,y,ir,-.2,Math.PI*.8);c.stroke();
  c.strokeStyle='rgba(70,45,5,.9)';c.lineWidth=.5;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
  c.restore()}
/* くもり（みがく前の、細かいキズでにごった面）。clip 済みの領域に描く */
function haze(c,x,y,w,h,a,seed){if(a<=0)return;c.save();c.globalAlpha=a;c.fillStyle='rgba(120,98,58,.62)';c.fillRect(x,y,w,h);
  let s=seed||1;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647};
  c.strokeStyle='rgba(60,44,14,.45)';c.lineWidth=.22;for(let k=0;k<70;k++){const x0=x+rnd()*w,y0=y+rnd()*h,l=2+rnd()*7,an=rnd()*Math.PI;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+Math.cos(an)*l,y0+Math.sin(an)*l);c.stroke()}
  c.strokeStyle='rgba(255,240,200,.25)';for(let k=0;k<40;k++){const x0=x+rnd()*w,y0=y+rnd()*h,l=1+rnd()*4,an=rnd()*Math.PI;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+Math.cos(an)*l,y0+Math.sin(an)*l);c.stroke()}
  c.restore()}
/* 7セグメント風の数字表示（DRO・デジタルノギス） */
function lcd(c,x,y,w,h,txt,o){o=o||{};c.save();c.fillStyle=o.bg||'#0d1a12';c.strokeStyle='#4c5a66';c.lineWidth=.5;c.beginPath();c.rect(x,y,w,h);c.fill();c.stroke();
  c.fillStyle=o.glow||'rgba(80,255,150,.08)';c.fillRect(x+1,y+1,w-2,h-2);
  c.font='700 '+(o.size||7)+'px ui-monospace,Consolas,monospace';c.textAlign='right';c.textBaseline='middle';c.fillStyle=o.col||'#5dff9a';c.fillText(txt,x+w-2.5,y+h/2+.4);
  if(o.label){c.font=(o.ls||3.6)+'px '+S.FF;c.textAlign='left';c.fillStyle=o.lc||'#8fb39d';c.fillText(o.label,x+2,y+h/2+.3)}
  c.restore()}
S.Metal={STEEL,DARK,BRASS,cylGrad,vGrad,block,shank,flutes,turnedDisc,haze,lcd};
})();
