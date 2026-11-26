/* =====================================================================
   三友ワークス — 立体の「金属のさんぽぽ」
   球・円柱・三角の板などの基本の形を組み合わせて、プログラムで作っています。
   SW.Sanpo.draw(C,x,y,w,h,opts) で、ゲーム画面の好きな場所に描けます。
   同じ形は 制作資料の model/sanpopo.obj にも入っています（Blenderなどで開けます）。
   ===================================================================== */
(()=>{
'use strict';
const S=SW,G=S.G3,M=G.M,TAU=Math.PI*2;

/* ---------- 基本の形 ---------- */
function sphere(seg,rings,flat){const P=[],N=[],I=[];
  for(let r=0;r<=rings;r++){const v=r/rings*Math.PI,y=Math.cos(v),s=Math.sin(v);for(let k=0;k<=seg;k++){const u=k/seg*TAU,x=Math.cos(u)*s,z=Math.sin(u)*s;P.push(x,y,z);N.push(x,y,z)}}
  for(let r=0;r<rings;r++)for(let k=0;k<seg;k++){const a=r*(seg+1)+k,b=a+seg+1;I.push(a,a+1,b,b,a+1,b+1)}
  return flat?facet(P,I):{P,N,I}}
/* 面ごとに法線をそろえて、カクカクした見た目にする（荒削り用） */
function facet(P,I){const p=[],n=[],idx=[];for(let i=0;i<I.length;i+=3){const a=I[i]*3,b=I[i+1]*3,c=I[i+2]*3;
  const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
  let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
  /* 球は外向きが正しいので、内向きなら反転 */
  const cx=P[a]+P[b]+P[c],cy=P[a+1]+P[b+1]+P[c+1],cz=P[a+2]+P[b+2]+P[c+2];if(nx*cx+ny*cy+nz*cz<0){nx=-nx;ny=-ny;nz=-nz}
  for(const k of[a,b,c]){p.push(P[k],P[k+1],P[k+2]);n.push(nx,ny,nz)}idx.push(i,i+1,i+2)}return{P:p,N:n,I:idx}}
function cyl(seg){const P=[],N=[],I=[];
  for(let k=0;k<=seg;k++){const u=k/seg*TAU,x=Math.cos(u),z=Math.sin(u);P.push(x,-.5,z,x,.5,z);N.push(x,0,z,x,0,z)}
  for(let k=0;k<seg;k++){const a=k*2;I.push(a,a+1,a+2,a+2,a+1,a+3)}
  for(const y of[-.5,.5]){const c=P.length/3;P.push(0,y,0);N.push(0,Math.sign(y),0);for(let k=0;k<=seg;k++){const u=k/seg*TAU;P.push(Math.cos(u),y,Math.sin(u));N.push(0,Math.sign(y),0)}for(let k=0;k<seg;k++)I.push(c,c+1+k,c+2+k)}
  return{P,N,I}}
function boxG(){const P=[],N=[],I=[];const F=[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]];
  F.forEach(n=>{const u=[n[1],n[2],n[0]],v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];const b=P.length/3;
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,c])=>{P.push((n[0]+u[0]*a+v[0]*c)/2,(n[1]+u[1]*a+v[1]*c)/2,(n[2]+u[2]*a+v[2]*c)/2);N.push(...n)});I.push(b,b+1,b+2,b,b+2,b+3)});
  return{P,N,I}}
/* 三角の板：底辺が x=-0.5〜0.5（y=0）、頂点が (0,1)。厚みは z=-0.5〜0.5 */
function prism(){const T=[[-.5,0],[.5,0],[0,1]],P=[],N=[],I=[];
  for(const z of[.5,-.5]){const b=P.length/3;T.forEach(t=>{P.push(t[0],t[1],z);N.push(0,0,Math.sign(z))});I.push(b,b+1,b+2)}
  for(let k=0;k<3;k++){const a=T[k],c=T[(k+1)%3],ex=c[0]-a[0],ey=c[1]-a[1],l=Math.hypot(ex,ey),nx=ey/l,ny=-ex/l,b=P.length/3;
    P.push(a[0],a[1],.5,c[0],c[1],.5,c[0],c[1],-.5,a[0],a[1],-.5);for(let q=0;q<4;q++)N.push(nx,ny,0);I.push(b,b+1,b+2,b,b+2,b+3)}
  return{P,N,I}}
/* 点をつないだ細い管（口・ひげ・キズ用） */
function tube(pts,r,seg){seg=seg||6;const P=[],N=[],I=[];
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];let dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
    let ux=-dy,uy=dx,uz=0;if(Math.hypot(ux,uy)<1e-4){ux=1;uy=0}const ul=Math.hypot(ux,uy,uz);ux/=ul;uy/=ul;uz/=ul;
    const vx=dy*uz-dz*uy,vy=dz*ux-dx*uz,vz=dx*uy-dy*ux,base=P.length/3;
    for(let k=0;k<=seg;k++){const t=k/seg*TAU,c=Math.cos(t),s=Math.sin(t),nx=ux*c+vx*s,ny=uy*c+vy*s,nz=uz*c+vz*s;
      P.push(a[0]+nx*r,a[1]+ny*r,a[2]+nz*r,b[0]+nx*r,b[1]+ny*r,b[2]+nz*r);N.push(nx,ny,nz,nx,ny,nz)}
    for(let k=0;k<seg;k++){const q=base+k*2;I.push(q,q+1,q+2,q+2,q+1,q+3)}}
  return{P,N,I}}
const geo={sphere:sphere(28,18),rough:sphere(9,6,true),cyl:cyl(22),box:boxG(),prism:prism()};

/* ---------- さんぽぽの寸法（体の横の半径を1とした大きさ。1 = 32.5 mm） ----------
   体：幅 65 mm・高さ 60 mm の回転体（設計のCADで、半だ円を回して作る形と同じ）
   ピン：Φ2・長さ 14 mm　三角パーツ：厚さ 4 mm（5組を 50° おきに円形パターン）
   目の穴：Φ6、中心から横 6 mm・上 6 mm（左右対称。中に LED が入る）
   ※ 検図の図面、寸法測定の値、設計指示書は、すべてこの寸法にそろえています */
const MM=1/32.5;
const BODY=[1,60/65,1];
const surf=(x,y)=>BODY[2]*Math.sqrt(Math.max(0,1-(x/BODY[0])**2-(y/BODY[1])**2));
const SPIKE_A=[190,140,90,40,-10].map(d=>d*Math.PI/180);   /* 三角パーツ5つの向き */
const EYE=[[-6*MM,6*MM],[6*MM,6*MM]];
function faceLines(){const L=[];
  for(const sx of[-1,1]){const arc=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI,x=sx*.085+Math.cos(a)*.085,y=.0+Math.sin(a)*.075;arc.push([x,y,surf(x,y)+.012])}L.push(arc);   /* ω の口 */
    L.push([[sx*.13,.345],[sx*.25,.345]].map(([x,y])=>[x,y,surf(x,y)+.012]));                                                                                              /* まゆ */
    for(const[y0,y1]of[[.1,.19],[0,0],[-.1,-.19]]){const w=[];for(let i=0;i<=4;i++){const x=sx*(.45+i/4*.4),y=y0+(y1-y0)*i/4;w.push([x,y,surf(x,y)+.012])}L.push(w)}}   /* ひげ */
  return L}
geo.face=(()=>{const P=[],N=[],I=[];faceLines().forEach(l=>{const t=tube(l,.017),b=P.length/3;P.push(...t.P);N.push(...t.N);t.I.forEach(i=>I.push(i+b))});return{P,N,I}})();
const mesh={};
if(G.ok)for(const k in geo)mesh[k]=G.mesh(geo[k].P,geo[k].N,geo[k].I);

const COL={brass:[.96,.72,.19],copper:[.92,.36,.2],steel:[.74,.77,.82],dark:[.13,.1,.07],alu:[.8,.82,.86],led:[1,.93,.55],ghost:[.37,.8,1],dirt:[.16,.13,.1],blue:[.25,.5,.9]};
const TRS=(t,r,s)=>M.chain(M.t(...t),r||M.id(),M.s(...s));

/* opts:
   yaw,pitch   向き（ラジアン）
   body,limbs,face,pins,base   それぞれ表示するか（body は 'rough' で荒削り）
   spikes      三角パーツの数（0〜5）
   eyes        目の数（0〜2）  glow:[左,右] 0〜1（LEDの明るさ）
   cut         0〜1。材料のかたまりから上から順に削り出す途中を表す（1で完成）
   block       材料のかたまりだけを表示
   explode     0〜1。部品をばらして見せる
   screws      土台のねじの数（0〜4）
   marks       [{a:向き(度), y:高さ, k:'scratch'|'dirt'}]  キズ・よごれ
   ghost       うすく表示する（これから作る形のお手本用）
   tool        {x,y,z,spin,chips:[{x,y,z,k}]}  加工中のエンドミル（Ver. 2.9.6）。x,y,z は刃先の位置。
               3Dの中に描くので、材料の中に入った刃先や、さんぽぽの裏に回ったところは隠れる */
function list(o){
  o=o||{};const out=[],root=M.mul(M.ry(o.yaw||0),M.rx(o.pitch||0)),ex=o.explode||0,al=o.ghost?.34:1;
  /* ghost（お手本・まだ作っていない形）は、図面のような水色の半透明で描く */
  const add=(m,Ml,col,metal,extra)=>out.push(Object.assign({m:mesh[m],M:M.mul(root,Ml),col:o.ghost?COL.ghost:col,metal:o.ghost?0:metal,alpha:al},extra||{},o.ghost?{emis:.45}:null));
  if(o.tool)toolObjs(o.tool,out);
  const clipTop=o.cut!=null&&o.cut<1?{clip:(()=>{const yc=1.15-o.cut*2.5;const n=[root[4],root[5],root[6]];return[n[0],n[1],n[2],-yc]})()}:null;
  if(o.block||clipTop){const yc=clipTop?1.15-o.cut*2.5:9;
    out.push({m:mesh.box,M:M.mul(root,TRS([0,-.1,0],null,[2.5,2.45,2.1])),col:COL.alu,metal:.7,alpha:1,clip:clipTop?[-root[4],-root[5],-root[6],yc]:null});
    if(o.block&&!clipTop)return out}
  const bodyOn=o.body!==false&&o.body!==0;
  const bm=o.body==='rough'?.5:o.dull!=null?.86-.5*o.dull:.86;   /* dull：みがく前のくもり（0〜1） */
  if(bodyOn)add(o.body==='rough'?'rough':'sphere',TRS([0,0,0],null,BODY),COL.brass,bm,clipTop);
  if(bodyOn&&o.limbs!==false){for(const sx of[-1,1]){add('sphere',TRS([sx*.42,-.86-ex*.5,.08],null,[.24,.17,.27]),COL.brass,.86,clipTop);add('sphere',TRS([sx*.97+sx*ex*.4,-.3,.05],null,[.16,.12,.13]),COL.brass,.86,clipTop)}}
  const ns=o.spikes==null?5:o.spikes;
  for(let i=0;i<ns;i++){const a=SPIKE_A[i],r=1.36+ex*.75,cx=Math.cos(a)*r,cy=Math.sin(a)*r*.96+.02;
    add('prism',M.chain(M.t(cx,cy,0),M.rz(a-Math.PI/2),M.s(.46,.5,4*MM)),COL.copper,.8,clipTop);
    if(o.pins!==false&&!ex)add('cyl',M.chain(M.t(Math.cos(a)*1.16,Math.sin(a)*1.1+.02,0),M.rz(a-Math.PI/2),M.s(1*MM,14*MM,1*MM)),COL.steel,.9,clipTop)}
  const ne=o.eyes==null?2:o.eyes,glow=o.glow||[0,0];
  for(let i=0;i<ne;i++){const[x,y]=EYE[i],z=surf(x,y)+ex*.7,g=S.clamp(glow[i]||0,0,1);
    /* 光るのは目の部品だけ（まわりには光を広げない） */
    add('sphere',TRS([x,y,z-.02],null,[.072,.085,.06]),g>0?COL.led.map((c,k)=>COL.dark[k]+(c-COL.dark[k])*Math.min(1,g*1.15)):COL.dark,.2,{emis:Math.min(1,g)})}
  if(bodyOn&&o.face!==false&&!clipTop)add('face',M.id(),COL.dark,.15);
  if(o.base){const by=-1.12-ex*.9;add('cyl',TRS([0,by,0],null,[1.25,.14,1.0]),COL.steel,.9);
    const nsc=o.screws==null?4:o.screws;[[-1,-1],[1,1],[1,-1],[-1,1]].slice(0,nsc).forEach(([sx,sz])=>add('cyl',TRS([sx*.92,by+.09,sz*.68],null,[.07,.06,.07]),COL.dark,.6))}
  (o.marks||[]).forEach(mk=>{const a=mk.a*Math.PI/180,y=mk.y||0,rr=Math.sqrt(Math.max(0,1-(y/BODY[1])**2)),x=Math.sin(a)*rr*BODY[0],z=Math.cos(a)*rr*BODY[2];
    const Mm=M.chain(M.t(x*1.005,y,z*1.005),M.ry(a),mk.k==='dirt'?M.s(.11,.09,.02):M.chain(M.rz(.6),M.s(.2,.022,.02)));
    out.push({m:mesh.sphere,M:M.mul(root,Mm),col:mk.k==='dirt'?COL.dirt:[.98,.95,.85],metal:mk.k==='dirt'?0:.2,emis:mk.k==='dirt'?0:.5,alpha:1})});
  return out}

/* エンドミル（Φ10・4枚刃）とホルダー・主軸。工作物と別に、機械に固定された向きで描く */
function toolObjs(T,out){const x=T.x,y=T.y,z=T.z,sp=T.spin||0,R=.13;
  const at=(cx,cy,cz,r,h,col,metal,rot)=>out.push({m:mesh.cyl,M:M.chain(M.t(cx,cy,cz),rot||M.id(),M.s(r,h,r)),col,metal,alpha:1});
  /* 刃の部分：芯と、回っている4枚の刃（ねじれた帯を、高さごとに少しずつ回して表す） */
  at(x,y+.3,z,R*.78,.6,[.55,.58,.62],.95);
  for(let k=0;k<6;k++){const yy=y+.05+k*.1;for(let f=0;f<2;f++)out.push({m:mesh.box,M:M.chain(M.t(x,yy,z),M.ry(sp+f*Math.PI/2+k*.45),M.s(R*2,.085,R*.42)),col:[.82,.85,.9],metal:.95,alpha:1})}
  /* シャンク（つかむところ）・ホルダー・主軸 */
  at(x,y+.85,z,R,.5,[.78,.8,.84],.95);
  at(x,y+1.22,z,R*1.7,.25,[.3,.33,.37],.8);
  at(x,y+1.5,z,R*2.2,.32,[.22,.24,.27],.7);
  at(x,y+1.68,z,R*2.35,.04,[.96,.76,.11],.4);
  at(x,y+4.66,z,R*2.6,5.9,[.2,.22,.25],.6);
  /* 削りくず（黄銅）と切削液 */
  (T.chips||[]).forEach(p=>out.push({m:mesh.sphere,M:M.chain(M.t(p.x,p.y,p.z),M.s(p.k?.022:.032,p.k?.022:.018,p.k?.022:.032)),col:p.k?[.6,.85,1]:[.98,.8,.3],metal:p.k?.1:.9,emis:p.k?.35:.1,alpha:1}))}

/* ゲーム画面の (x,y,w,h) に描く。3Dが使えない端末では、さんぽぽの絵で代用する */
function draw(C,x,y,w,h,o){
  o=o||{};
  if(G.ok){const k=Math.min(S.SC,4);G.render(list(o),{yaw:0,pitch:o.camPitch==null?.12:o.camPitch,dist:o.dist||7.4,target:[0,o.ty==null?.12:o.ty,0],fov:.5},w*k,h*k);return G.blit(C,x,y,w,h)}
  const im=S.SANPO;if(im.complete&&im.naturalWidth&&!o.block){const s=Math.min(w/220,h/172)*.8,iw=220*s,ih=172*s;C.save();C.globalAlpha=o.ghost?.3:1;C.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);C.restore()}
  return false}

/* OBJ形式の文字列にする（Blenderなどで開ける） */
function toOBJ(){let s='# Sanpopo (Sanyu Works) - generated\n',vo=1;const root=M.id();
  const parts=list({base:true});
  parts.forEach((p,pi)=>{if(!p.m||p.alpha<1)return;const g=p.m,Mx=p.M,Nm=M.nrm(Mx);s+=`o part${pi}\n`;
    for(let i=0;i<g.P.length;i+=3){const x=g.P[i],y=g.P[i+1],z=g.P[i+2];s+=`v ${(Mx[0]*x+Mx[4]*y+Mx[8]*z+Mx[12]).toFixed(5)} ${(Mx[1]*x+Mx[5]*y+Mx[9]*z+Mx[13]).toFixed(5)} ${(Mx[2]*x+Mx[6]*y+Mx[10]*z+Mx[14]).toFixed(5)}\n`}
    for(let i=0;i<g.N.length;i+=3){const x=g.N[i],y=g.N[i+1],z=g.N[i+2];let nx=Nm[0]*x+Nm[3]*y+Nm[6]*z,ny=Nm[1]*x+Nm[4]*y+Nm[7]*z,nz=Nm[2]*x+Nm[5]*y+Nm[8]*z;const l=Math.hypot(nx,ny,nz)||1;s+=`vn ${(nx/l).toFixed(4)} ${(ny/l).toFixed(4)} ${(nz/l).toFixed(4)}\n`}
    for(let i=0;i<g.I.length;i+=3){const a=g.I[i]+vo,b=g.I[i+1]+vo,c=g.I[i+2]+vo;s+=`f ${a}//${a} ${b}//${b} ${c}//${c}\n`}
    vo+=g.P.length/3});
  return s}
S.Sanpo={list,draw,toOBJ,COL,EYE,SPIKE_A,BODY,MM};
})();
