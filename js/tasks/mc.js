/* =====================================================================
   三友ワークス — 機械加工部門の作業
   4 加工・仕上げ（machine）／ 5 検査・寸法測定（measure）
   Ver. 2.3：バリ取りを「道具でふちをなぞって削る」操作に変更
   ===================================================================== */
(()=>{
'use strict';
const S=SW,T=S.T,P=T.PAL,Mt=S.Metal,{R,circ,ring,line,jt,TAU}=S;

/* ---------- 4 加工・仕上げ ---------- */
const MC_STEPS=['工具をえらぶ','材料を固定する','原点を合わせる','加工スタート','バリを取る','みがく'];
function MachineGame(){
  let ph=0,torque=0,wasHeld=false,gap=1.4+Math.floor(Math.random()*5)*.2,fast=true,cut=0,prog=0,spark=0;
  /* バリ取り（Ver. 2.3）：道具でふちをなぞって削る
     ・部品のふち（中心 BX,BY・半径 BR）の上を、道具が角度 ba の位置で動く
     ・バリは {a:ふちの角度, size:大きさ＝●の数(1〜3), hp:のこり}。道具がバリの上を通るたびに hp が1へる
     ・マウス／タッチ：ふちの上で押したまま、ぐるっとなぞる（ふちから大きくはなれると、道具がうく）
     ・キーボード：← → で道具をふちに沿って動かす（→ が時計回り。押しつづけると連続で動く） */
  const BX=219,BY=90,BR=40,TOL_IN=18,TOL_OUT=26,KSTEP=.12,KSPEED=2.4;
  const angN=a=>{a%=TAU;return a<0?a+TAU:a},angD=(a,b)=>{let d=angN(a)-angN(b);if(d>Math.PI)d-=TAU;if(d<=-Math.PI)d+=TAU;return d};
  const burrs=(()=>{const sz=T.shuffle([1,1,2,2,3]),base=Math.random()*TAU;return sz.map((size,i)=>({a:angN(base+i*TAU/5+(Math.random()-.5)*.5),size,hp:size,flash:0}))})();
  let ba=angN(burrs[0].a+TAU/10),bGrab=false,bLift=false,bDone=false,keyDir=0,keyT=0,scrapeT=0,chips=[],edgeTold=false;
  /* みがき：布の位置 cloth（0〜1）、3つの場所それぞれのみがき具合 zone、こすっている最中か rub */
  let cloth=.5,zone=[0,0,0],rub=false,lastX=0,shine=0;
  const PX=179,PW=80,PY=82;                 /* みがく部品の左はし・幅・中心の高さ */
  function rubBy(d){const z=Math.min(2,Math.floor(cloth*3));zone[z]=Math.min(1,zone[z]+Math.abs(d));prog=(zone[0]+zone[1]+zone[2])/3;shine=.25;if(Math.random()<.5)S.noise(.04,.012,3600+Math.random()*1200)}
  const tools=T.shuffle([{k:'end',name:'エンドミル Φ10',sub:'平らな刃で削る',ok:true},{k:'drill',name:'ドリル Φ3',sub:'細い穴をあける'},{k:'tap',name:'タップ M4',sub:'ねじ山を切る'}]);
  const g=T.make({limit:150,
    setup(g){enter(g,0)},
    key(g,k,rep){if(ph===6){if(k==='ArrowLeft'||k==='ArrowRight'){const dir=k==='ArrowRight'?1:-1;if(!rep||keyDir!==dir){keyDir=dir;keyT=0;bLift=false;scrape(g,dir*KSTEP)}return true}return k==='Enter'||k===' '||/^[1-9]$/.test(k)}
      if(ph===7){if(k==='ArrowLeft'||k==='ArrowRight'){const n=S.clamp(cloth+(k==='ArrowRight'?.1:-.1),0,1);if(n!==cloth){cloth=n;rubBy(.13)}return true}return false}
      if(ph!==2)return false;
      if(k==='ArrowRight'){move(g,-1);return true}if(k==='ArrowLeft'){move(g,1);return true}
      if(k==='ArrowUp'||k==='ArrowDown'){fast=!fast;S.sfx.tick();return true}
      if(k==='Enter'||k===' '){reg(g);return true}return false},
    update(g,dt){
      if(ph===1){if(g.held()){torque=Math.min(100,torque+42*dt);wasHeld=true;if(Math.random()<dt*14)S.sfx.tick()}
        else if(wasHeld){wasHeld=false;if(torque>75){g.miss1('締めすぎ！ 材料がゆがんでしまう。緑のところで手をはなそう。');torque=25}else if(torque>=60){g.good('ちょうどいい固定！');enter(g,2)}else S.toast('まだゆるいよ。緑のところまで締めよう。','',2500)}}
      if(ph===4){cut=Math.min(1,cut+dt/5.5);spark+=dt;if(spark>.12){spark=0;S.noise(.08,.02,1800+Math.random()*1500)}
        if(cut>=1){ph=5;S.sfx.ok();S.say(S.DATA.LINES.finish).then(()=>{if(!g.dead){g.frozen=false;enter(g,6)}}).catch(()=>{})}}
      if(ph===6){/* キーを押しつづけると、少し待ってから連続で動く */
        if(keyDir&&S.keys.has(keyDir>0?'ArrowRight':'ArrowLeft')){keyT+=dt;if(keyT>.22)scrape(g,keyDir*KSPEED*dt)}else keyDir=0;
        if(scrapeT>0)scrapeT-=dt;burrs.forEach(b=>{if(b.flash>0)b.flash-=dt})}
      if(chips.length){chips.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;p.life-=dt;p.rot=(p.rot||0)+(p.vr||0)*dt});chips=chips.filter(p=>p.life>0)}
      if(ph===7){if(shine>0)shine-=dt;
        if(prog>=1){g.frozen=true;ph=8;rub=false;g.setItems([]);S.sfx.ok();setTimeout(()=>g.win('工具・固定・原点の準備から、バリ取りとみがきまで完了。'),1100)}}
    },
    /* みがき：部品の上でマウス（指）を押したまま左右に動かすと、こすった分だけみがける */
    ptr(g,type,p,down){if(ph===6)return burrPtr(g,type,p,down);if(ph!==7)return false;
      const inside=p&&p.x>=PX-14&&p.x<=PX+PW+14&&p.y>=PY-50&&p.y<=PY+50;
      if(type==='down'){if(!inside)return true;rub=true;lastX=p.x;cloth=S.clamp((p.x-PX)/PW,0,1);return true}
      if(type==='move'){S.cv.style.cursor=inside?'grab':'default';if(rub&&down){const nx=S.clamp(p.x,PX,PX+PW),d=nx-lastX;if(d){cloth=(nx-PX)/PW;rubBy(Math.abs(d)/58);lastX=nx}}return true}
      rub=false;return true},
    draw(g,t){
      T.bg();T.panel(8,8,112,84,'作業指示書',true);
      ['品名：さんぽぽ 本体','材料：黄銅 C3604','荒加工：エンドミル Φ10','固定：バイス（緑のはんい）','原点：材料の左はし','仕上げ：バリ取り → みがき'].forEach((s,i)=>{const hl=(ph<=2?[2,3,4][ph]:ph>=6?5:-1)===i;if(hl)T.rr(11,21+i*11.4,106,11,2,'#fff3c4');jt(s,14,23+i*11.4,P.ink,5.6)});
      T.panel(8,96,112,76,'進み具合');T.steps(14,111,MC_STEPS,Math.min(ph>=6?ph-2:Math.min(ph,3),6),9.6);
      T.panel(126,8,186,164,ph<=4?'立形マシニングセンタ':'仕上げ台');const c=S.getCtx();
      if(ph===0){jt('指示書に合う工具を、1つえらぼう',219,24,P.txt,7,'center');g.items.forEach(it=>{const f=g.isFocus(it)&&g.active();
        T.rr(it.x,it.y,it.w,it.h,3,it.state==='ng'?'#4a2420':f?'#24384c':'#17222e',f?P.acc:P.line,f?1.1:.6);
        c.save();c.beginPath();c.rect(it.x+1,it.y+1,it.w-2,58);c.clip();const bg=Mt.vGrad(c,it.y,it.y+58,['#22303f','#141c26']);c.fillStyle=bg;c.fillRect(it.x+1,it.y+1,it.w-2,58);c.restore();
        toolIcon(it.x+it.w/2,it.y+8,it.tool.k,f?t:null);
        T.rr(it.x+3,it.y+3,9,9,2,f?P.acc:'#33455a');jt(String(it.n),it.x+7.5,it.y+3.9,f?'#1a1400':P.txt,6.2,'center');jt(it.tool.name,it.x+it.w/2,it.y+62,it.off?'#55626f':P.txt,5.8,'center');jt(it.tool.sub,it.x+it.w/2,it.y+72,P.mut,4.8,'center')})}
      if(ph===1){jt('バイスで材料をはさんで固定する',219,22,P.txt,6.8,'center');
        drawVise(c,t,Math.min(1,torque/8),torque*.09,torque);
        torqueGauge(c,t);g.items.forEach(it=>holdOpt(g,it))}
      if(ph===2){drawVise(c,t,1,9,70);drawEdgeFinder(c,t);g.items.forEach(it=>T.opt(g,it,{size:5.6,center:true}))}
      if(ph===3||ph===4||ph===5){drawEnclosure(c,t);
        if(ph===4){jt('加工中… '+Math.round(cut*100)+' %',219,134,P.acc,6.6,'center');T.gauge(150,146,138,7,cut,0,1,P.acc)}
        if(ph===3){jt('準備OK。扉を閉めて、加工をスタート！',219,136,P.txt,6.2,'center');g.items.forEach(it=>T.opt(g,it,{center:true}))}}
      if(ph===6){mat(c);jt('道具でふちをなぞって、バリ（とがり）をぜんぶ削り取ろう',219,22,P.txt,6.2,'center');
        Mt.turnedDisc(c,BX,BY,BR);
        /* なぞる道すじ（ふちの上の点線） */c.save();c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=.45;c.setLineDash([1.5,2.5]);c.beginPath();c.arc(BX,BY,BR+3.5,0,TAU);c.stroke();c.restore();
        burrs.forEach(b=>{const ca=Math.cos(b.a),sa=Math.sin(b.a);
          if(b.hp>0)drawBurr(c,b);
          /* ●の数＝バリの大きさ。削れたぶんは白ぬき */const dr=BR+19,dx=BX+ca*dr,dy=BY+sa*dr;
          if(b.hp<=0)T.check(dx,dy,true);else for(let k=0;k<b.size;k++){const x=dx+(k-(b.size-1)/2)*4.6;if(k<b.hp)circ(x,dy,1.7,P.acc);else ring(x,dy,1.7,P.mut,null,.45)}});
        /* 削りくず（くるっと丸まった細いくず） */chips.forEach(p=>{c.save();c.globalAlpha=Math.min(1,p.life*2.5);c.translate(p.x,p.y);c.rotate(p.rot||0);c.strokeStyle='#f3cf6a';c.lineWidth=.45;c.beginPath();c.arc(0,0,p.r*1.6,0,Math.PI*1.3);c.stroke();c.strokeStyle='rgba(255,250,220,.9)';c.lineWidth=.2;c.beginPath();c.arc(0,0,p.r*1.6,.2,.9);c.stroke();c.restore()});
        drawTool(c,t);
        if(bLift&&bGrab)jt('ふちに当てて、なぞろう',BX,BY-3,'#5a4410',5.6,'center');
        const left=burrs.filter(b=>b.hp>0).length;jt('のこり '+left+' か所',132,152,P.acc,7);
        jt('●の数＝バリの大きさ',306,150,P.mut,5,'right');jt('大きいバリは、何回かなぞる',306,158,P.mut,5,'right')}
      if(ph>=7){mat(c);jt('布でこすって、3か所ともピカピカにしよう',219,22,P.txt,6.6,'center');
        /* 部品（上から）。くもりは、場所ごとのみがき具合に合わせてうすくなる */
        Mt.turnedDisc(c,219,PY,40);
        c.save();c.beginPath();c.arc(219,PY,37,0,TAU);c.clip();
        for(let z=0;z<3;z++){const x0=PX+z*PW/3,a=1-zone[z];Mt.haze(c,x0,PY-42,PW/3+.5,84,a*.95,z*977+13);
          if(zone[z]>=1&&!S.reduceMotion){/* みがけたところは、光の帯がすっと流れる */const k=((t*.55+z*.33)%1),sx=x0-8+k*(PW/3+16);const gr=c.createLinearGradient(sx-6,0,sx+6,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(Math.max(x0,sx-6),PY-42,12,84)}}
        c.restore();
        /* 3つの場所の区切り（うすい線） */c.save();c.setLineDash([1,1.5]);for(let z=1;z<3;z++)line(PX+z*PW/3,PY-36,PX+z*PW/3,PY+36,'rgba(255,255,255,.18)',.3);c.restore();
        [0,1,2].forEach(z=>{const x0=PX+z*PW/3+PW/6;T.check(x0,PY+50,zone[z]>=1,false);jt(Math.round(zone[z]*100)+'%',x0,PY+55,zone[z]>=1?P.ok:P.mut,5,'center')});
        drawCloth(c,t);
        if(ph===7){jt('◀',PX-22,PY-4,P.mut,8);jt('▶',PX+PW+14,PY-4,P.mut,8)}
        jt('みがき具合',150,151,P.mut,5.4);T.gauge(190,151,98,7,prog,0,1,P.acc)}
    }});
  /* 道具を d（ラジアン）だけ動かし、通りすぎたバリを削る */
  function scrape(g,d){if(bDone||!d)return;const from=ba;let hit=false;
    burrs.forEach(b=>{if(b.hp<=0)return;const r=angD(b.a,from);if((d>0&&r>0&&r<=d)||(d<0&&r<0&&r>=d)){hitBurr(g,b);hit=true}});
    ba=angN(from+d);if(!hit&&scrapeT<=0){scrapeT=.09;S.noise(.035,.008,5200+Math.random()*1500)}
    if(!burrs.some(b=>b.hp>0)){bDone=true;bGrab=false;keyDir=0;S.cv.style.cursor='default';g.good('バリ取り完了！');setTimeout(()=>{if(!g.dead&&!g.done&&ph===6)enter(g,7)},650)}}
  function hitBurr(g,b){b.hp--;b.flash=.18;const x=BX+Math.cos(b.a)*(BR+3),y=BY+Math.sin(b.a)*(BR+3),n=S.reduceMotion?3:5+b.size*2;
    for(let k=0;k<n;k++){const a=b.a+(Math.random()-.5)*1.6,v=25+Math.random()*45;chips.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-15,r:.5+Math.random()*.7,life:.5+Math.random()*.5,rot:Math.random()*TAU,vr:(Math.random()-.5)*30})}
    S.noise(.07,.05,2400+Math.random()*1400);if(b.hp<=0){S.tone(1500,.06,'triangle',.05);setTimeout(()=>S.sfx.click(),40)}else S.sfx.tick()}
  /* マウス・タッチ：ふちの上で押したまま、なぞる */
  function burrPtr(g,type,p){if(!p)return true;const dx=p.x-BX,dy=p.y-BY,r=Math.hypot(dx,dy),on=r>=BR-TOL_IN&&r<=BR+TOL_OUT,a=Math.atan2(dy,dx);
    if(bDone){S.cv.style.cursor='default';return true}
    if(type==='down'){if(on){bGrab=true;bLift=false;ba=angN(a);S.cv.style.cursor='grabbing'}
      else if(!edgeTold){edgeTold=true;S.toast('部品のふち（金色の輪）の上で押したまま、ぐるっとなぞろう。','',3000)}return true}
    if(type==='move'){if(!bGrab){S.cv.style.cursor=on?'grab':'default';return true}
      if(r<6)return true;                       /* 中心の近くは向きが定まらないので動かさない */
      if(!on){bLift=true;ba=angN(a);return true} /* ふちからはなれた：道具がうく（削れない） */
      if(bLift){bLift=false;ba=angN(a);return true}
      scrape(g,angD(a,ba));return true}
    bGrab=false;bLift=false;S.cv.style.cursor=on?'grab':'default';return true}
  /* バリ取りの道具（刃先がふちに当たり、持ち手が外へのびる） */
  function drawTool(c,t){const lift=bLift?5:0,ca=Math.cos(ba),sa=Math.sin(ba);c.save();c.translate(BX+ca*(BR+lift),BY+sa*(BR+lift));c.rotate(ba+1.0);
    if(bLift)c.globalAlpha=.6;
    /* 刃（フックになった、回るバリ取りカッター） */c.strokeStyle='#5f6a76';c.lineWidth=1.1;c.lineCap='round';c.beginPath();c.moveTo(6,0);c.quadraticCurveTo(1.5,-.2,.6,-2.2);c.stroke();
    c.strokeStyle='#e4e9ee';c.lineWidth=.45;c.beginPath();c.moveTo(6,-.2);c.quadraticCurveTo(1.6,-.4,.8,-2.2);c.stroke();
    /* 軸 */c.fillStyle=Mt.vGrad(c,-.8,.8,Mt.STEEL);c.fillRect(5.6,-.8,9,1.6);
    /* 口金 */c.fillStyle=Mt.vGrad(c,-1.8,1.8,['#6d7884','#e9eef2','#7d8892']);c.fillRect(14.4,-1.8,3.6,3.6);
    /* にぎり（オレンジのゴム） */const gg=Mt.vGrad(c,-3,3,['#a8401c','#ff8f52','#e0602a','#8c3212']);T.rr(18,-3,18,6,2.6,null);c.fillStyle=gg;c.fill();
    c.strokeStyle='rgba(80,24,6,.6)';c.lineWidth=.35;for(let k=0;k<5;k++){c.beginPath();c.moveTo(21+k*3,-2.6);c.lineTo(21+k*3,2.6);c.stroke()}
    c.restore()}
  /* ---------- 絵の部品（Ver. 2.4） ---------- */
  /* 締める強さのメーター：緑＝ちょうどいい（60〜75%）、赤＝締めすぎ */
  function torqueGauge(c,t){const x=160,y=140,w=140,h=7,lo=.6,hi=.75,v=torque/100;
    jt('締める強さ',134,y+.6,P.mut,4.4);
    T.rr(x,y,w,h,h/2,'#0a0f15',P.line);
    c.save();T.rr(x,y,w,h,h/2,null);c.clip();c.fillStyle='rgba(240,98,79,.3)';c.fillRect(x+w*hi,y,w*(1-hi),h);
      const pulse=S.reduceMotion?.6:.5+.3*Math.sin(t*5);c.fillStyle=`rgba(79,210,143,${pulse})`;c.fillRect(x+w*lo,y,w*(hi-lo),h);
      if(v>0){c.fillStyle=v>hi?'#f0624f':v>=lo?'#4fd28f':'#f6c21c';c.fillRect(x,y+1.5,w*Math.min(1,v),h-3)}c.restore();
    c.strokeStyle='#4fd28f';c.lineWidth=.8;c.strokeRect(x+w*lo,y-.6,w*(hi-lo),h+1.2);
    /* 今の位置の針 */const nx=x+w*Math.min(1,v);c.fillStyle='#ffffff';c.beginPath();c.moveTo(nx,y+h+.4);c.lineTo(nx-1.8,y+h+2.8);c.lineTo(nx+1.8,y+h+2.8);c.closePath();c.fill();
    /* 説明（メーターの下） */jt('▲ 緑で手をはなす',x+w*(lo+hi)/2,y+h+3,'#7fe0ad',4.2,'center');jt('締めすぎ',x+w*.9,y+h+3,'#f0a090',4,'center');
    jt(Math.round(torque)+' %',x+2,y+h+3,v>=lo&&v<=hi?P.ok:v>hi?P.ng:P.txt,4.4)}
  /* 仕上げ台のゴムマット */
  function mat(c){c.save();const g2=Mt.vGrad(c,20,170,['#24332d','#18231f']);c.fillStyle=g2;c.fillRect(128,20,182,150);c.strokeStyle='rgba(180,220,200,.07)';c.lineWidth=.3;c.beginPath();for(let x=132;x<310;x+=8){c.moveTo(x,20);c.lineTo(x,170)}for(let y=24;y<170;y+=8){c.moveTo(128,y);c.lineTo(310,y)}c.stroke();c.restore()}
  /* マシニングセンタのテーブルとバイス。closing：あごの閉じ具合（0〜1）、crank：ハンドルの角度、tq：締める強さ */
  const VB={x0:176,x1:262,top:58,bot:106};
  function drawVise(c,t,closing,crank,tq){
    /* テーブル（T溝つき） */Mt.block(c,132,128,176,9,{pal:'dark',top:4,lines:false});for(let x=146;x<300;x+=26){c.fillStyle='#14181d';c.fillRect(x,128.6,7,8.2);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(x,128.6,7,.6)}
    /* バイスの土台 */Mt.block(c,146,116,152,12,{pal:'dark',top:3,lines:false});
    /* 固定側のあご */Mt.block(c,150,80,26,36,{pal:'dark',top:3,lines:false});jawPlate(c,173,80,true);
    /* 平行台 */Mt.block(c,VB.x0+2,VB.bot,VB.x1-VB.x0-4,10,{pal:'steel',top:2});
    /* 材料（黄銅） */Mt.block(c,VB.x0,VB.top,VB.x1-VB.x0,VB.bot-VB.top,{pal:'brass',top:4});
    if(ph<=2){c.save();c.font='700 5.4px '+S.FF;c.fillStyle='rgba(90,60,10,.55)';c.textAlign='center';c.fillText('材料（黄銅 C3604）',(VB.x0+VB.x1)/2,84);c.restore()}
    /* 動く側のあご（締めるほど左へ） */const mx=VB.x1+(1-closing)*9;Mt.block(c,mx,80,26,36,{pal:'dark',top:3,lines:false});jawPlate(c,mx,80,false);
    /* 送りねじとハンドル */c.save();c.fillStyle=Mt.vGrad(c,95,101,Mt.STEEL);c.fillRect(mx+26,95,306-mx-26,6);for(let x=mx+27;x<304;x+=1.6)line(x,95,x+.8,101,'rgba(40,46,54,.35)',.25);c.restore();
    c.save();c.translate(306,98);c.rotate(crank);c.fillStyle=Mt.cylGrad(c,-3,3,Mt.STEEL);c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU;c.lineTo(Math.cos(a)*3.4,Math.sin(a)*3.4)}c.closePath();c.fill();c.strokeStyle='#3e454d';c.lineWidth=.35;c.stroke();
      c.fillStyle=Mt.vGrad(c,-1.2,1.2,Mt.STEEL);c.fillRect(0,-1.1,-17,2.2);c.restore();
    const ka=crank+Math.PI,kx=306+Math.cos(ka)*17,ky=98+Math.sin(ka)*17;const kg=c.createRadialGradient(kx-1,ky-1,.3,kx,ky,3);kg.addColorStop(0,'#ff8a6a');kg.addColorStop(1,'#9b2a14');c.fillStyle=kg;c.beginPath();c.arc(kx,ky,2.8,0,TAU);c.fill();
    /* 締めすぎの注意（あごが赤くなる） */if(tq>75){const a=Math.min(.5,(tq-75)/30)*(.6+.4*Math.sin(t*12));c.fillStyle=`rgba(240,70,50,${a})`;c.fillRect(VB.x0-1,VB.top,3,VB.bot-VB.top);c.fillRect(VB.x1-2,VB.top,3,VB.bot-VB.top)}
    /* はさむ力の矢印 */if(closing>=1&&tq>8&&ph===1){const k=Math.min(1,(tq-8)/60);c.save();c.globalAlpha=.85;c.fillStyle=tq>=60&&tq<=75?P.ok:tq>75?P.ng:P.acc;[[VB.x1-6,-1],[VB.x0+6,1]].forEach(([x,d])=>{c.beginPath();c.moveTo(x,74);c.lineTo(x-d*5*k-d*2,71);c.lineTo(x-d*5*k-d*2,77);c.closePath();c.fill()});c.restore()}}
  function jawPlate(c,x,y,left){c.save();c.fillStyle=Mt.cylGrad(c,x,x+3,['#8e99a4','#e6ebef','#7b8691']);c.fillRect(x,y,3,26);c.strokeStyle='rgba(30,36,44,.5)';c.lineWidth=.25;for(let yy=y+1;yy<y+26;yy+=1.2){c.beginPath();c.moveTo(x,yy);c.lineTo(x+3,yy+.6);c.stroke()}
    c.fillStyle='#2c333b';for(const yy of[y+6,y+19]){c.beginPath();c.arc(x+1.5,yy,.8,0,TAU);c.fill()}c.restore()}
  /* エッジファインダー：回しながら近づけると、先のブレがだんだん小さくなり、材料にふれた瞬間に横へ「ずれる」 */
  function drawEdgeFinder(c,t){const SC=14,tipR=4,edge=VB.x0,cx=edge-tipR-Math.max(-.5,gap)*SC,ecc=1.7;
    let off=0,blur=0;if(gap>.3){off=Math.sin(t*34)*ecc;blur=ecc}else if(gap>0){const k=gap/.3;off=Math.sin(t*34)*ecc*k;blur=ecc*k}else off=-2.6;
    const tipX=Math.min(edge-tipR,cx+off);
    /* 主軸（スピンドル）とコレット */Mt.block(c,cx-11,20,22,16,{pal:'dark',top:0,lines:false});c.fillStyle=Mt.cylGrad(c,cx-11,cx+11,Mt.DARK);c.fillRect(cx-11,34,22,4);
    Mt.shank(c,cx-7,38,14,6,{cols:['#3a424b','#8a95a0','#c9d1d8','#6d7884','#2f363e']});for(let x=cx-6;x<cx+7;x+=2.2)line(x,38,x,44,'rgba(0,0,0,.25)',.25);
    /* シャンク（回っている） */Mt.shank(c,cx-tipR,44,tipR*2,16,{spin:t,rpm:9});
    /* 先（プローブ）：ブレているあいだは、ぶれた残像も描く */
    if(blur>.05&&!S.reduceMotion){c.save();c.globalAlpha=.28;Mt.shank(c,cx-tipR-blur,61,tipR*2,15,{});Mt.shank(c,Math.min(edge-tipR*2,cx-tipR+blur),61,tipR*2,15,{});c.restore()}
    c.fillStyle='#1a1f25';c.fillRect(Math.min(cx,tipX)-1.6,60,Math.abs(tipX-cx)+3.2,1.2);
    Mt.shank(c,tipX-tipR,61,tipR*2,15,{spin:t,rpm:9,cols:gap<=0?['#6b5410','#d9b13a','#fff1b0','#e2b43c','#7a5d12']:Mt.STEEL});
    if(gap<=0&&!S.reduceMotion){const a=.5+.5*Math.sin(t*10);ring(tipX,68,9+a*2,`rgba(246,194,28,${.5*a})`,null,.6)}
    /* 状態の文字 */const st=gap>.3?['先が回りながらブレている','#c7d2dc']:gap>0?['材料にふれて、ブレが小さくなってきた','#ffe9a6']:['ずれた！ ここが材料のはし（エッジ）',P.acc];
    T.rr(132,21,120,17,2,'rgba(8,12,18,.78)',P.line,.4);jt('エッジファインダーを、材料の左はしに当てる',135,22.5,P.txt,5.2);jt(st[0],135,30,st[1],5);
    /* DRO（今の位置と、1回に動く量） */Mt.lcd(c,262,21,46,10,(-(147.66+gap)).toFixed(3),{label:'X',size:6.2});Mt.lcd(c,262,31.5,46,8,fast?'0.200':'0.020',{label:'1回の送り',size:5,col:fast?'#ffd36b':'#5dff9a'});
    /* 拡大図 */const ix=287,iy=56,ir=12,Z=4.2;c.save();c.beginPath();c.arc(ix,iy,ir,0,TAU);c.fillStyle='#0b1118';c.fill();c.clip();
      const sx=v=>ix+(v-edge)*Z;   /* 拡大図の中の x */
      c.fillStyle=Mt.vGrad(c,iy-ir,iy+ir,['#f7d478','#c38a22']);c.fillRect(sx(edge),iy-ir,ir*2,ir*2);c.strokeStyle='rgba(255,248,220,.8)';c.lineWidth=.4;c.beginPath();c.moveTo(sx(edge),iy-ir);c.lineTo(sx(edge),iy+ir);c.stroke();
      const tx0=sx(tipX+tipR);c.fillStyle=Mt.cylGrad(c,tx0-30,tx0,gap<=0?['#7a5d12','#e2b43c','#fff1b0','#d9b13a','#6b5410']:Mt.STEEL);c.fillRect(tx0-30,iy-ir,30,ir*2);
      if(blur>.05&&!S.reduceMotion){c.globalAlpha=.3;c.fillStyle='#c9d1d8';c.fillRect(tx0,iy-ir,Math.min(sx(edge)-tx0,blur*Z*2),ir*2);c.globalAlpha=1}
      c.restore();ring(ix,iy,ir,'#7f8e9c',null,.7);
    jt(gap>0?'すき間 '+gap.toFixed(2)+' mm':'ふれた',ix,iy+ir+1.5,gap>0?'#c7d2dc':P.acc,4.4,'center');jt('拡大',ix-ir-7,iy-3,'#7f8e9c',3.8)}
  /* 加工中のマシニングセンタ（扉の窓ごしに見る） */
  function drawEnclosure(c,t){const bgG=Mt.vGrad(c,20,132,['#1b2633','#0a1018']);c.fillStyle=bgG;c.fillRect(128,20,182,112);
    S.Sanpo.draw(c,160,26,118,104,{yaw:.5+t*.25,cut:ph===3?0:cut,block:ph===3,spikes:0,face:false,limbs:false,eyes:0,dist:8.2,ty:-.1});
    const tyB=ph===4?40+cut*62:30,x=219;
    /* 主軸ヘッド */c.fillStyle=Mt.cylGrad(c,x-9,x+9,['#1d232a','#4d5864','#8796a5','#3c4651','#1a1f25']);c.fillRect(x-9,20,18,tyB-20);c.fillStyle='rgba(246,194,28,.6)';c.fillRect(x-9,tyB-9,18,1.2);c.fillStyle=Mt.cylGrad(c,x-7,x+7,Mt.DARK);c.fillRect(x-7,tyB-4,14,4);
    Mt.shank(c,x-5,tyB,10,5,{cols:['#3a424b','#8a95a0','#c9d1d8','#6d7884','#2f363e']});
    Mt.shank(c,x-3,tyB+5,6,6,{spin:t,rpm:14});Mt.flutes(c,x-3,tyB+11,6,11,{n:4,spin:ph===4?t:null,rpm:6});
    if(ph===4&&!S.reduceMotion){/* 切削液と、とびちる切りくず */for(let i=0;i<10;i++){const a=Math.random()*TAU,d=Math.random()*12;circ(x+Math.cos(a)*d,tyB+22+Math.sin(a)*3,.5,'rgba(150,210,255,.55)')}
      for(let i=0;i<5;i++){const a=Math.random()*Math.PI,d=6+Math.random()*16;c.save();c.translate(x+Math.cos(a)*d*(Math.random()<.5?-1:1),tyB+20-Math.sin(a)*d*.5);c.rotate(Math.random()*TAU);c.strokeStyle='#f3cf6a';c.lineWidth=.4;c.beginPath();c.arc(0,0,1,0,4);c.stroke();c.restore()}}
    /* 扉のガラス（映りこみ） */c.save();c.strokeStyle='#3d4b5a';c.lineWidth=2.4;c.strokeRect(129.5,21.5,179,109);c.globalAlpha=.06;c.fillStyle='#ffffff';c.beginPath();c.moveTo(150,22);c.lineTo(178,22);c.lineTo(140,130);c.lineTo(129,130);c.lineTo(129,74);c.closePath();c.fill();c.beginPath();c.moveTo(186,22);c.lineTo(194,22);c.lineTo(156,130);c.lineTo(148,130);c.closePath();c.fill();c.restore()}
  /* バリ：ふちから外へはみ出した、うすい金属のめくれ */
  function drawBurr(c,b){const n=b.hp,base=BR-1.5;c.save();
    for(let k=0;k<n;k++){const a=b.a+(k-(n-1)/2)*.11,len=3.2+n*2.2-(k%2)*1.2,wd=.06+n*.025,curl=(k%2?-1:1)*.06;
      const p0=[BX+Math.cos(a-wd)*base,BY+Math.sin(a-wd)*base],p1=[BX+Math.cos(a+wd)*base,BY+Math.sin(a+wd)*base],tip=[BX+Math.cos(a+curl)*(BR+len),BY+Math.sin(a+curl)*(BR+len)],mid=[BX+Math.cos(a+curl*.4)*(BR+len*.55),BY+Math.sin(a+curl*.4)*(BR+len*.55)];
      const gr=c.createLinearGradient(BX+Math.cos(a)*BR,BY+Math.sin(a)*BR,tip[0],tip[1]);gr.addColorStop(0,b.flash>0?'#ffffff':'#d9a333');gr.addColorStop(.6,b.flash>0?'#ffffff':'#ffe9a0');gr.addColorStop(1,'#fff8dc');
      c.fillStyle=gr;c.beginPath();c.moveTo(p0[0],p0[1]);c.quadraticCurveTo(mid[0]+Math.cos(a-1.57)*wd*6,mid[1]+Math.sin(a-1.57)*wd*6,tip[0],tip[1]);c.quadraticCurveTo(mid[0]+Math.cos(a+1.57)*wd*6,mid[1]+Math.sin(a+1.57)*wd*6,p1[0],p1[1]);c.closePath();c.fill();
      c.strokeStyle='rgba(110,74,12,.75)';c.lineWidth=.25;c.stroke()}
    c.restore()}
  /* みがき布 */
  function drawCloth(c,t){const cx=PX+cloth*PW,cy=PY+(rub||shine>0?Math.sin(t*40)*1:0);c.save();c.translate(cx,cy);c.rotate(Math.sin(t*2)*.05);
    c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(2,3,13,10,0,0,TAU);c.fill();
    const gr=c.createRadialGradient(-4,-4,1,0,0,14);gr.addColorStop(0,'#ffffff');gr.addColorStop(.7,'#e7ebef');gr.addColorStop(1,'#b9c2cb');c.fillStyle=gr;
    c.beginPath();c.moveTo(-12,-7);c.quadraticCurveTo(-4,-11,6,-9);c.quadraticCurveTo(13,-8,12,0);c.quadraticCurveTo(13,8,4,9);c.quadraticCurveTo(-6,11,-11,6);c.quadraticCurveTo(-14,0,-12,-7);c.closePath();c.fill();
    c.strokeStyle='rgba(120,132,145,.6)';c.lineWidth=.35;c.stroke();
    c.strokeStyle='rgba(140,152,165,.5)';c.lineWidth=.45;[[-8,-4,6,-5],[-9,1,7,0],[-6,5,5,5]].forEach(([a,b,d,e])=>{c.beginPath();c.moveTo(a,b);c.quadraticCurveTo((a+d)/2,b+2,d,e);c.stroke()});
    c.setLineDash([.8,.8]);c.strokeStyle='rgba(31,95,174,.45)';c.lineWidth=.3;c.beginPath();c.moveTo(-10,-5.6);c.quadraticCurveTo(-4,-9,5,-7.6);c.stroke();c.restore()}
  function holdOpt(g,it){const h=g.held();T.rr(it.x,it.y+(h?1:0),it.w,it.h,4,h?P.acc:'#2a7a50',h?'#fff':'#44a673',.8);jt(it.label,it.x+it.w/2,it.y+it.h/2-4+(h?1:0),h?'#1a1400':'#fff',6.6,'center')}
  /* 工具の絵（ホルダー＋刃）。spin：えらんでいる工具は回して見せる */
  function toolIcon(x,y,k,spin){const c=S.getCtx();
    /* ツールホルダー（BT） */c.fillStyle=Mt.cylGrad(c,x-7,x+7,Mt.DARK);c.beginPath();c.moveTo(x-6,y);c.lineTo(x+6,y);c.lineTo(x+7,y+6);c.lineTo(x-7,y+6);c.closePath();c.fill();
    c.fillStyle=Mt.cylGrad(c,x-7.5,x+7.5,['#3a424b','#9aa5b0','#dfe5ea','#7c8792','#30373f']);c.fillRect(x-7.5,y+6,15,4);
    Mt.shank(c,x-4.5,y+10,9,6,{cols:['#3a424b','#8a95a0','#c9d1d8','#6d7884','#2f363e']});
    if(k==='end'){Mt.shank(c,x-4,y+16,8,10,{spin,rpm:3});Mt.flutes(c,x-4,y+26,8,20,{n:4,spin,rpm:1.5});c.fillStyle='#c9d1d8';c.fillRect(x-4,y+45.6,8,.8)}
    if(k==='drill'){Mt.shank(c,x-1.6,y+16,3.2,10,{spin,rpm:3});Mt.flutes(c,x-1.6,y+26,3.2,18,{n:6,helix:1.4,spin,rpm:1.5});c.fillStyle=Mt.cylGrad(c,x-1.6,x+1.6,Mt.STEEL);c.beginPath();c.moveTo(x-1.6,y+44);c.lineTo(x+1.6,y+44);c.lineTo(x,y+46.4);c.closePath();c.fill()}
    if(k==='tap'){Mt.shank(c,x-2.6,y+16,5.2,12,{spin,rpm:3});c.fillStyle=Mt.cylGrad(c,x-2.6,x+2.6,Mt.STEEL);c.fillRect(x-2.6,y+28,5.2,16);
      c.strokeStyle='rgba(30,36,44,.65)';c.lineWidth=.3;for(let i=0;i<12;i++){const yy=y+29+i*1.25;c.beginPath();c.moveTo(x-3.2,yy);c.lineTo(x+3.2,yy+.5);c.stroke()}
      c.fillStyle='#16202a';c.fillRect(x-.6,y+28,1.2,16);c.fillStyle=Mt.cylGrad(c,x-2.6,x+2.6,Mt.STEEL);c.beginPath();c.moveTo(x-2.6,y+44);c.lineTo(x+2.6,y+44);c.lineTo(x+1.4,y+46);c.lineTo(x-1.4,y+46);c.closePath();c.fill()}}
  function move(g,d){gap=Math.round((gap+d*(fast?.2:.02))*100)/100;gap=Math.min(gap,3);S.sfx.tick();if(gap<=0&&gap>-.021)S.sfx.click();
    if(gap<-.3){g.miss1('押しつけすぎ！ 先がこわれてしまう。少しもどしてやり直そう。');gap=.4}}
  function reg(g){if(gap>0){g.miss1('まだ材料に当たっていないよ。先が横に「ピタッ」とずれるまで近づけよう。');return}
    if(gap<-.06){g.miss1('行きすぎているよ。少しはなして、ずれた直後で登録しよう。');return}g.good('原点を登録！');enter(g,3)}
  function enter(g,p){ph=p;
    if(p===0){g.setItems(tools.map((tl,i)=>({id:'t'+i,n:i+1,x:132+i*60,y:38,w:56,h:86,tool:tl,ok:!!tl.ok,on(it){if(it.ok){g.good();enter(g,1)}else{it.state='ng';it.off=true;g.miss1('指示書を見てみよう。荒加工に使うのは「エンドミル Φ10」だよ。')}}})));S.setTag('いまやること：指示書に合う工具をえらぶ');S.setHint('矢印キー：えらぶ　Enter：決定　数字キー：番号でえらぶ　（クリックでもOK）')}
    if(p===1){g.setItems([{id:'hold',hold:true,x:174,y:155,w:110,h:15,label:'締める（押しつづける）'}]);S.setTag('いまやること：緑のはんいまで締めて、手をはなす');S.setHint('Enter または Space を押しつづける（ボタンを押しつづけてもOK）。緑のはんいで手をはなす。')}
    if(p===2){g.setItems([{id:'back',repeat:true,rate:.16,x:132,y:144,w:40,h:20,label:'◀ はなす',on(){move(g,1)}},{id:'fwd',repeat:true,rate:.16,x:174,y:144,w:44,h:20,label:'近づける ▶',on(){move(g,-1)}},{id:'spd',x:220,y:144,w:44,h:20,label:'速さ切りかえ',on(){fast=!fast}},{id:'reg',x:266,y:144,w:40,h:20,label:'登録',on(){reg(g)}}]);g.fi=1;
      S.setTag('いまやること：先が「ピタッ」とずれた直後に登録');S.setHint('→：近づける　←：はなす（押しつづけると連続で動く）　↑↓：速さ切りかえ　Enter：登録　（下のボタンでもOK）')}
    if(p===3){g.setItems([{id:'go',n:1,x:164,y:146,w:110,h:22,label:'サイクルスタート',on(){ph=4;g.frozen=true;g.setItems([]);S.setTag('加工中…（このあいだ、時間は止まっています）');S.setHint('機械がプログラムどおりに削っています。')}}]);S.setTag('いまやること：サイクルスタートを押す');S.setHint('Enter：決定　（クリックでもOK）')}
    if(p===6){g.setItems([]);bGrab=false;bLift=false;keyDir=0;
      S.setTag('いまやること：道具でふちをなぞって、バリをぜんぶ取る');S.setHint('マウス：ふちの上で押したまま、ぐるっとなぞる　／　キーボード：← → で道具をふちに沿って動かす（押しつづけると連続）。●が多いバリは、何回かなぞると取れる')}
    if(p===7){g.setItems([]);S.setTag('いまやること：布で左右にこすって、3か所ともみがく');S.setHint('マウス：部品の上で押したまま、左右に動かしてこする　／　キーボード：← → を交互に押してこする')}}
  g.dbg=()=>({ph,torque,gap,fast,cut,prog,cloth,zone:zone.slice(),ok:g.items.findIndex(i=>i.ok),ba,burrs:burrs.map(b=>({a:b.a,size:b.size,hp:b.hp})),BX,BY,BR});
  g.dbgJump=p=>enter(g,p);   /* 動作確認用（index.html?debug のときだけ使う） */
  return g}
S.STAGES.push({id:'machine',dept:'mc',name:'加工・仕上げ',limit:150,lines:'cut',hint:'',make:MachineGame,
  tut:[
    {text:'左上が作業指示書。使う工具や、固定のしかたが書いてあるよ。左下で、いまどこまで進んだかが分かる。',spot:[8,8,112,164],card:'bottom'},
    {text:'前半は加工。工具をえらぶ → 材料を固定する → 原点を合わせる → スタート、の順に進むよ。',spot:[126,8,186,164],card:'bottom'},
    {text:'「押しつづける」ボタンは、EnterかSpaceを押しつづけてもOK。緑のはんいで手をはなすのがコツ。'},
    {text:'削り終わったら、後半は仕上げ。まずバリ取り。マウスなら、部品のふちの上で押したまま、道具でぐるっとなぞる。キーボードなら←→で道具をふちに沿って動かす（押しつづけると連続で動く）。'},
    {text:'バリの横の●の数が、バリの大きさ。大きいバリは何回かなぞると取れるよ。そのあと布で左右にこすってみがく（マウスは押したまま左右、キーボードは←→を交互）。制限時間は通しで150秒！'}
  ]});

/* ---------- 5 検査（寸法測定） ---------- */
function MeasureGame(){
  const defs=[{name:'体の高さ',tool:'ノギス',nom:60,tol:.3,res:.1,dec:1,ok:[-2,-1,0,1,2],ng:[5,6]},{name:'体の幅',tool:'ノギス',nom:65,tol:.3,res:.1,dec:1,ok:[-2,-1,0,1,2],ng:[5,6]},{name:'三角パーツの厚さ',tool:'マイクロメータ',nom:4,tol:.05,res:.01,dec:2,ok:[-3,-2,-1,0,1,2,3],ng:[8,9,10]}];
  const nNg=[0,1,1,1,2][Math.random()*5|0],ngSet=new Set(T.shuffle([0,1,2]).slice(0,nNg));
  const pick=a=>a[Math.random()*a.length|0];
  const its=defs.map((d,i)=>{const bad=ngSet.has(i),off=bad?pick(d.ng)*(Math.random()<.5?-1:1):pick(d.ok);return Object.assign({},d,{bad,val:Math.round((d.nom+off*d.res)*1000)/1000,res_:null})});
  let i=0,ph='close',jaw=1,right=0;
  const g=T.make({limit:90,
    setup(g){enter(g)},
    update(g,dt){if(ph==='close'&&g.held()){jaw=Math.max(0,jaw-dt*.9);if(Math.random()<dt*12)S.sfx.tick();if(jaw<=0){S.sfx.click();ph='judge';
      g.setItems([{id:'ok',n:1,x:150,y:146,w:66,h:22,label:'合格',on(){judge(g,true)}},{id:'ng',n:2,x:222,y:146,w:66,h:22,label:'不合格',on(){judge(g,false)}}]);S.setTag('いまやること：目もりを読んで、合格か不合格かを決める');S.setHint('←→：えらぶ　Enter：決定　数字キー 1：合格　2：不合格　（クリックでもOK）')}}},
    draw(g,t){
      T.bg();T.panel(8,8,128,164,'検査表',true);jt('検査するところ',13,23,P.inkmut,4.8);jt('合格のはんい',74,23,P.inkmut,4.8);
      its.forEach((d,k)=>{const y=33+k*30,now=k===i&&ph!=='end';if(now)T.rr(11,y-2,122,27,2,'#fff3c4');jt(d.name,13,y,P.ink,6);jt(d.tool,13,y+9,P.inkmut,4.8);
        jt((d.nom-d.tol).toFixed(d.dec)+' 〜 '+(d.nom+d.tol).toFixed(d.dec),74,y,P.ink,6);jt('（'+d.nom.toFixed(d.dec)+' ±'+d.tol+'）',74,y+9,P.inkmut,4.8);
        if(d.res_){jt('測定値 '+d.val.toFixed(d.dec),13,y+17,P.ink,5.2);jt(d.bad?'不合格':'合格',74,y+17,d.bad?'#c8372d':'#1d7a4a',5.6);jt(d.res_==='ok'?'○ 判定 正解':'× 判定ミス',100,y+17,d.res_==='ok'?'#1d7a4a':'#c8372d',4.8)}});
      T.wrap('測った値が「合格のはんい」に入っていれば合格。目もりは、赤い線のところを読むよ。',13,128,118,5.4,P.inkmut,7.6);
      const d=its[Math.min(i,2)];T.panel(142,8,170,164,d.tool+'　'+d.name);const c=S.getCtx();
      /* 測定器と部品。左のあご（固定）の右はしが x=176。右のあごは、部品の右はしにちょうど当たるところで止まる */
      const hw=[25,27,13][Math.min(i,2)],px0=176,px1=px0+hw*2,jx=px1+jaw*18;
      if(i<2)drawCaliper(c,t,px0,px1,jx,hw);else drawMicrometer(c,t,px0,px1,jx,hw);
      if(ph!=='close'){const yy=i<2?77:70;line(px0,yy-4,px0,yy+2,P.acc,.6);line(px1,yy-4,px1,yy+2,P.acc,.6);line(px0,yy,px1,yy,P.acc,.6);jt('ぴったり当たった',px0+hw,yy+1.5,P.acc,4.4,'center')}
      if(ph==='close'){jt(i<2?'右のあごを動かして、部品をはさむ':'シンブルを回して、部品をはさむ',227,96,P.txt,6.6,'center');g.items.forEach(it=>{const h=g.held();T.rr(it.x,it.y+(h?1:0),it.w,it.h,4,h?P.acc:'#2a7a50',h?'#fff':'#44a673',.8);jt(it.label,it.x+it.w/2,it.y+it.h/2-4+(h?1:0),h?'#1a1400':'#fff',6.6,'center')})}
      else{/* 目もりの拡大 */T.rr(148,86,158,54,3,'#f5f2e7','#cfc9b4');jt('目もり（拡大）',152,88.5,P.inkmut,4.8);const px=10,x0=227,v=d.val,k0=Math.round(v/d.res);
        c.save();c.beginPath();c.rect(149,96,156,42);c.clip();for(let k=k0-9;k<=k0+9;k++){const x=x0+(k-k0)*px,big=k%5===0;line(x,116,x,big?104:109,P.ink,big?.8:.5);if(big)jt((k*d.res).toFixed(d.dec),x,120,P.ink,6.4,'center')}line(149,116,305,116,P.ink,.6);c.restore();
        line(x0,98,x0,118,'#d0392b',1);c.fillStyle='#d0392b';c.beginPath();c.moveTo(x0-3,96);c.lineTo(x0+3,96);c.lineTo(x0,101);c.fill();jt('1目もり＝'+d.res+' mm',301,131,P.inkmut,4.8,'right');
        if(ph==='judge')g.items.forEach(it=>T.opt(g,it,{center:true}))}
    }});
  /* ノギス：本尺（目もり）、固定のあご、すべるあご（親指のローラーつき） */
  function drawCaliper(c,t,px0,px1,jx,hw){const cy=52;
    /* 部品（黄銅の体） */drawBall(c,px0+hw,cy,hw);
    /* 本尺 */c.fillStyle=Mt.vGrad(c,22,31,['#f2f5f7','#c9d0d6','#9aa4ad','#d5dbe0']);c.fillRect(150,22,162,9);c.strokeStyle='rgba(40,46,54,.6)';c.lineWidth=.3;c.strokeRect(150,22,162,9);
    for(let k=0;k<=34;k++){const x=px0+k*4;if(x>310)break;line(x,22,x,k%5?24:25.6,'#2b333b',.3);if(k%10===0&&k)jt(String(k),x,25.8,'#2b333b',2.8,'center')}
    /* 固定のあご */jawShape(c,px0,22,cy+hw+4,-1);
    /* すべるあご＋スライダー */jawShape(c,jx,22,cy+hw+4,1);
    c.fillStyle=Mt.vGrad(c,19,34,['#e8ecef','#aeb7bf','#8a949e','#c5ccd2']);T.rr(jx-1,19,34,15,2,null);c.fill();c.strokeStyle='rgba(40,46,54,.6)';c.lineWidth=.3;c.stroke();
    c.fillStyle='rgba(20,26,32,.85)';c.fillRect(jx+3,23,18,7);for(let k=0;k<=10;k++)line(jx+4+k*1.6,23,jx+4+k*1.6,k%5?25:26.4,'#d9e0e6',.25);
    /* 親指のローラー */const rx=jx+27,ry=36;c.fillStyle=Mt.cylGrad(c,rx-3,rx+3,Mt.STEEL);c.fillRect(rx-3,ry-2.5,6,5);for(let k=0;k<7;k++){const xx=rx-3+((k+t*(ph==='close'&&g.held()?6:0))%7)*6/7;line(xx,ry-2.5,xx,ry+2.5,'rgba(30,36,44,.5)',.25)}
    jt('ノギス',300,34,'#7f8e9c',4,'right')}
  function jawShape(c,x,y0,y1,dir){/* dir=-1：左のあご（部品は右側）、1：右のあご */const w=8;c.save();c.beginPath();
    if(dir<0){c.moveTo(x-w,y0);c.lineTo(x,y0);c.lineTo(x,y1-6);c.lineTo(x-1.5,y1);c.lineTo(x-w,y1-10);}
    else{c.moveTo(x,y0);c.lineTo(x+w,y0);c.lineTo(x+w,y1-10);c.lineTo(x+1.5,y1);c.lineTo(x,y1-6);}
    c.closePath();c.fillStyle=Mt.cylGrad(c,x-(dir<0?w:0),x+(dir<0?0:w),dir<0?['#7b8691','#d8dfe5','#f3f6f8','#a9b3bc']:['#a9b3bc','#f3f6f8','#d8dfe5','#7b8691']);c.fill();
    c.strokeStyle='rgba(40,46,54,.6)';c.lineWidth=.3;c.stroke();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=.35;c.beginPath();c.moveTo(x,y0+9);c.lineTo(x,y1-6);c.stroke();c.restore()}
  function drawBall(c,x,y,r){c.save();c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x+2,y+r*.95,r*.8,r*.18,0,0,TAU);c.fill();
    const gr=c.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);gr.addColorStop(0,'#fff6cf');gr.addColorStop(.25,'#f6cf63');gr.addColorStop(.7,'#c58f22');gr.addColorStop(1,'#6e4a0c');c.fillStyle=gr;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    c.globalAlpha=.25;c.strokeStyle='#fff3c8';c.lineWidth=.25;for(let k=1;k<6;k++){c.beginPath();c.ellipse(x,y,r*k/6,r,0,0,TAU);c.stroke()}c.restore()}
  /* マイクロメータ：アンビル（左）とスピンドル（右）ではさむ。フレームはC字形 */
  function drawMicrometer(c,t,px0,px1,jx,hw){const cy=50,Fx=px1+22;
    /* フレーム */c.save();c.fillStyle=Mt.vGrad(c,44,82,['#3f5f8a','#2b4466','#1d3049']);c.beginPath();c.moveTo(px0-14,44);c.lineTo(px0-6,44);c.lineTo(px0-6,56);c.quadraticCurveTo(px0-6,74,px0+hw,76);c.lineTo(Fx-18,76);c.quadraticCurveTo(Fx,76,Fx,58);c.lineTo(Fx,46);c.lineTo(Fx+8,46);c.lineTo(Fx+8,62);c.quadraticCurveTo(Fx+8,84,Fx-18,84);c.lineTo(px0+hw,84);c.quadraticCurveTo(px0-14,84,px0-14,58);c.closePath();c.fill();
      c.strokeStyle='rgba(10,16,26,.7)';c.lineWidth=.35;c.stroke();c.fillStyle='rgba(220,230,240,.12)';c.fillRect(px0+hw-14,77,28,5);c.restore();
    /* アンビル */c.fillStyle=Mt.vGrad(c,cy-4,cy+4,Mt.STEEL);c.fillRect(px0-6,cy-4,6,8);
    /* 部品（三角パーツ・銅色）を横から */c.save();const gr=Mt.cylGrad(c,px0,px1,['#7a2a10','#e0663a','#ffb08a','#c84a22','#6a240e']);c.fillStyle=gr;c.beginPath();c.moveTo(px0,cy+12);c.lineTo(px1,cy+12);c.lineTo(px0+hw,cy-22);c.closePath();c.fill();c.strokeStyle='rgba(70,20,6,.8)';c.lineWidth=.35;c.stroke();c.restore();
    /* スピンドル・スリーブ・シンブル・ラチェット */c.fillStyle=Mt.vGrad(c,cy-4,cy+4,Mt.STEEL);c.fillRect(jx,cy-4,Math.max(0,Fx-jx),8);
    const sx=Fx+8;c.fillStyle=Mt.vGrad(c,cy-5.5,cy+5.5,['#dde3e8','#f6f8fa','#a9b2bb']);c.fillRect(sx,cy-5.5,22,11);line(sx,cy,sx+22,cy,'#2b333b',.35);for(let k=0;k<=10;k++)line(sx+1+k*2,cy,sx+1+k*2,cy-(k%5?1.6:2.6),'#2b333b',.25);
    const tx=sx+10+jaw*10;c.fillStyle=Mt.vGrad(c,cy-7,cy+7,['#c9d0d6','#f3f6f8','#8f99a3']);c.fillRect(tx,cy-7,18,14);for(let k=0;k<9;k++)line(tx+.6,cy-7+k*1.75,tx+3,cy-7+k*1.75,'#2b333b',.25);
    for(let k=0;k<12;k++){const xx=tx+6+((k+jaw*20)%12);if(xx<tx+18)line(xx,cy-7,xx,cy+7,'rgba(30,36,44,.35)',.25)}
    c.fillStyle=Mt.vGrad(c,cy-4,cy+4,Mt.STEEL);c.fillRect(tx+18,cy-4,6,8);jt('マイクロメータ',300,88,'#7f8e9c',4,'right')}
  function enter(g){ph='close';jaw=1;g.setItems([{id:'hold',hold:true,x:172,y:146,w:110,h:22,label:'はさむ（押しつづける）'}]);S.setTag('いまやること：'+its[i].tool+'で「'+its[i].name+'」をはさむ');S.setHint('Enter または Space を押しつづける（ボタンを押しつづけてもOK）。')}
  function judge(g,sayOk){const d=its[i],correct=sayOk!==d.bad;d.res_=correct?'ok':'ng';const rng=(d.nom-d.tol).toFixed(d.dec)+'〜'+(d.nom+d.tol).toFixed(d.dec);
    if(correct){right++;g.good('正解！ 測定値は '+d.val.toFixed(d.dec)+' mm。'+(d.bad?'はんいの外だから不合格。':'はんいの中だから合格。'))}
    else g.miss1('測定値は '+d.val.toFixed(d.dec)+' mm。合格のはんいは '+rng+' だから、'+(d.bad?'不合格':'合格')+'だよ。');
    g.setItems([]);ph='wait';g.frozen=true;setTimeout(()=>{if(g.dead||g.done)return;g.frozen=false;i++;if(i>=3){ph='end';i=2;g.win('3か所を測定。判定の正解 '+right+' / 3。')}else enter(g)},1300)}
  g.dbg=()=>({i,ph,bad:its[Math.min(i,2)].bad});
  return g}
S.STAGES.push({id:'measure',dept:'mc',name:'検査（寸法測定）',limit:90,lines:'measure',hint:'',make:MeasureGame,
  tut:[
    {text:'左の検査表に、測るところと「合格のはんい」が書いてあるよ。黄色い行が、いま測るところ。',spot:[8,8,128,164],card:'bottom'},
    {text:'まず、EnterかSpaceを押しつづけて、測定器で部品をはさむ。',spot:[142,8,170,164],card:'bottom'},
    {text:'はさむと目もりが大きく出る。赤い線のところの数字を読んで、はんいに入っていれば「合格」、はずれていれば「不合格」をえらぼう。'},
    {text:'測るのは3か所。不良は、あるかもしれないし、ないかもしれない。制限時間は90秒！'}
  ]});
})();
