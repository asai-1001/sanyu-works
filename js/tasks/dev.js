/* =====================================================================
   三友ワークス — 設計開発部門の作業
   1 仕様決め（spec）／ 2 設計（design）／ 3 検査・検図（review）
   ===================================================================== */
(()=>{
'use strict';
const S=SW,T=S.T,P=T.PAL,{R,circ,ring,line,jt,TAU}=S;
const KEYS='矢印キー：えらぶ　Enter：決定　数字キー：番号でえらぶ　（マウスのクリックでもOK）';

/* ---------- 1 仕様決め ---------- */
const SPEC_Q=[
  {k:'大きさ',req:'机の上に置ける、手のひらサイズがいい',q:'高さをどれくらいにする？',opts:['60 mm','600 mm','6 m'],why:'手のひらサイズは、数センチから10センチくらいだよ。'},
  {k:'体の材料',req:'体は、金色にかがやく金属にしたい',q:'体の材料をえらぼう',opts:['黄銅（しんちゅう）','アルミニウム','鉄'],why:'金色の金属は黄銅（しんちゅう）。アルミと鉄は銀色なんだ。'},
  {k:'目の部品',req:'暗い場所で、目が光ってほしい',q:'目に入れる部品は？',opts:['LED（発光ダイオード）','モーター','スピーカー'],why:'光る部品はLED。モーターは回る部品、スピーカーは音が出る部品だよ。'},
  {k:'電源',req:'コンセントのない場所でも使いたい',q:'電源をどうする？',opts:['ボタン電池','コンセント（AC100V）','電源なし'],why:'コンセントがなくても動くのは電池。電源なしではLEDは光らないよ。'}
];
function SpecGame(){
  let qi=0,phase='q',chosen=[],opts=[];
  const g=T.make({limit:60,
    setup(g){ask(g)},
    draw(g,t){
      T.bg();
      T.panel(8,8,138,84,'お客様の要望',true);
      SPEC_Q.forEach((q,i)=>{const y=23+i*16.5,now=phase==='q'&&i===qi;if(now)T.rr(11,y-2,132,15,2,'#fff3c4');T.check(16,y+5,i<qi,now);T.wrap('「'+q.req+'」',22,y,118,5.6,P.ink,7)});
      T.panel(8,96,138,76,'仕様書　SPP-001',true);
      SPEC_Q.forEach((q,i)=>{const y=111+i*14;jt(q.k,14,y,P.inkmut,5.6);jt(chosen[i]||'― 未決定 ―',58,y,chosen[i]?P.ink:'#b3ac98',6.2);line(12,y+10,142,y+10,'#d8d2bd',.4)});
      T.panel(154,8,158,164,phase==='q'?`仕様決め　${qi+1} / ${SPEC_Q.length}`:'デザインレビュー');
      S.Sanpo.draw(S.getCtx(),196,18,74,60,{yaw:Math.sin(t*.8)*.5,ghost:chosen.length<4,glow:chosen[2]?[.8,.8]:[0,0],spikes:5});
      if(phase==='q'){jt(SPEC_Q[qi].q,160,80,P.txt,7.2);g.items.forEach(it=>T.opt(g,it))}
      else{T.wrap('決めた仕様を、みんなで確かめ合う会議だよ。左の「要望」と「仕様書」を見くらべて、合っていたら承認しよう。',160,80,146,6,P.txt,9);g.items.forEach(it=>T.opt(g,it,{center:true}))}
    }});
  function ask(g){const q=SPEC_Q[qi];opts=T.shuffle(q.opts.map((o,i)=>({o,ok:i===0})));
    g.setItems(opts.map((o,i)=>({id:'o'+i,n:i+1,x:160,y:94+i*25,w:146,h:21,label:o.o,ok:o.ok,on(it){
      if(it.ok){chosen[qi]=it.label;g.good();qi++;if(qi>=SPEC_Q.length){phase='dr';g.setItems([{id:'ok',n:1,x:176,y:140,w:114,h:24,label:'この仕様で承認する',on(){g.win('お客様の要望4つを、すべて仕様に落としこめた。')}}]);S.setTag('いまやること：仕様を確かめて「承認」')}else{ask(g);tag()}}
      else{it.state='ng';it.off=true;g.miss1(q.why)}}})));tag()}
  function tag(){S.setTag('いまやること：要望に合う「'+SPEC_Q[Math.min(qi,3)].k+'」をえらぶ')}
  g.dbg=()=>({phase,qi,ok:g.items.findIndex(i=>i.ok)});
  return g}
S.STAGES.push({id:'spec',dept:'dev',name:'仕様決め',limit:60,lines:'spec',hint:KEYS,make:SpecGame,
  tut:[
    {text:'操作のきほん。矢印キーでえらんで、Enterキーで決定。数字キーなら番号で直接えらべるよ。マウスでクリックしてもOK！'},
    {text:'左上が、お客様の要望。黄色い行が、いま考える要望だよ。',spot:[8,8,138,84],card:'bottom'},
    {text:'右の3つから、要望に合うものを1つえらぼう。決めた内容は、左下の仕様書に書きこまれるよ。',spot:[154,76,158,96],card:'top'},
    {text:'困ったら右上の「？」でこの説明をもう一度、「‖」（Escキー）で一時停止できるよ。制限時間は60秒！'}
  ]});

/* ---------- 2 設計 ----------
   Ver. 2.4 から、本物の3D CADのようにドラッグとクリックで形を作る作業になりました（Ver. 2.5 でピンの工程を追加し、完成品と同じ形・寸法に）。中身は js/tasks/cad.js */
S.STAGES.push({id:'design',dept:'dev',name:'設計',limit:210,lines:'design',hint:'ツール：数字キー 1〜6 ／ ドラッグの代わり：矢印キーで値を変えて Enter　（マウスのドラッグ・クリックで操作）',make:()=>S.CadGame(),
  tut:[
    {text:'設計は、本物の3D CADと同じように作るよ。上のツールバーでツールをえらび、3Dの画面で形をクリックしたり、ドラッグしたりして作るんだ。',spot:[126,19,186,20],card:'bottom'},
    {text:'左上の「設計指示書」が、作るもののきまり。寸法（幅 65 mm・高さ 60 mm、厚さ 4 mm など）をよく見てね。左下の「設計ツリー」には、作った手順が記録されていくよ。',spot:[8,8,112,164],card:'bottom'},
    {text:'3Dの画面の下に、いまやることが出るよ。何もないところをドラッグすると、形をぐるっと回して見られる。ホイールで拡大もできるよ。',spot:[128,39,182,131],card:'top',anim:[{x:205,y:120,t:0,down:false},{x:205,y:120,t:.5,down:true},{x:250,y:100,t:1.6,down:true},{x:250,y:100,t:2,down:false}]},
    {text:'キーボードなら、数字キーでツール、矢印キーでえらぶ・値を変える、Enterで決定。前半は形を作る「機械設計」、後半は回路を作る「電気設計」。制限時間は210秒！'}
  ]});

/* ---------- 3 検査（検図） ---------- */
const REV_SPEC=['材料：黄銅 C3604','三角パーツ：5つ','目の穴：Φ6（左右同じ）','高さ：60 mm　幅：65 mm','足：体とぶつからない','個数：1'];
function ReviewGame(){
  const pool=T.shuffle(['mat','tri','eye','h','foot']),bad=new Set(pool.slice(0,3)),found=new Set();
  const cx=92,cy=84,r=30;
  const spots=[
    {id:'tri',x:50,y:20,w:84,h:13,what:'三角パーツの数が6つになっていた（仕様は5つ）。'},
    {id:'eyeL',x:58,y:66,w:30,h:16},{id:'eye',x:96,y:66,w:30,h:16,what:'右目の穴だけΦ9になっていた（仕様は左右ともΦ6）。'},
    {id:'h',x:140,y:60,w:22,h:40,what:'高さの寸法が書かれていなかった（寸法のぬけ）。'},
    {id:'w',x:68,y:126,w:48,h:12},
    {id:'foot',x:62,y:104,w:60,h:18,what:'足が体にくいこんでいた（部品どうしのぶつかり）。'},
    {id:'mat',x:14,y:146,w:74,h:20,what:'材料がアルミになっていた（仕様は黄銅）。'},
    {id:'qty',x:92,y:146,w:44,h:20}];
  const g=T.make({limit:60,
    setup(g){g.setItems(spots.map(s=>Object.assign(s,{on(it){if(found.has(it.id))return;
      if(bad.has(it.id)){found.add(it.id);it.state='ok';g.good('見つけた！ '+it.what);if(found.size>=3){g.frozen=true;setTimeout(()=>g.win('図面のまちがいを3か所すべて見つけた。'),900)}}
      else g.miss1('そこは仕様どおりだよ。右の仕様書と、もう一度見くらべてみよう。')}})));S.setTag('いまやること：図面のまちがいを3か所見つける')},
    draw(g,t){
      T.bg();T.panel(8,8,164,164,'図面　SPP-001　さんぽぽ 本体',true);const c=S.getCtx();
      /* 三角パーツ */const n=bad.has('tri')?6:5;for(let i=0;i<n;i++){const a=(190-i*200/(n-1))*Math.PI/180,x=cx+Math.cos(a)*(r+13),y=cy-Math.sin(a)*(r+12);c.save();c.translate(x,y);c.rotate(-a+Math.PI/2);c.strokeStyle=P.ink;c.lineWidth=.7;c.beginPath();c.moveTo(-5,5);c.lineTo(5,5);c.lineTo(0,-6);c.closePath();c.stroke();c.restore()}
      jt('三角パーツ ×'+n+'　等間隔',92,23,P.ink,5.6,'center');
      /* 体・足 */const fy=bad.has('foot')?cy+r-9:cy+r+1;for(const sx of[-1,1]){c.strokeStyle=P.ink;c.lineWidth=.7;c.beginPath();c.ellipse(cx+sx*12,fy,7,4,0,0,TAU);c.stroke()}
      c.strokeStyle=P.ink;c.lineWidth=.9;c.beginPath();c.ellipse(cx,cy,r*65/60,r,0,0,TAU);c.stroke();   /* 体：幅 65・高さ 60 */line(cx-r-6,cy,cx+r+6,cy,'#9aa3ad',.3,[4,1.5,1,1.5]);line(cx,cy-r-6,cx,cy+r+14,'#9aa3ad',.3,[4,1.5,1,1.5]);
      /* 目 */ring(cx-11,cy-8,3,P.ink,null,.7);ring(cx+11,cy-8,bad.has('eye')?4.5:3,P.ink,null,.7);jt('Φ6',cx-22,cy-21,P.ink,5.2);jt(bad.has('eye')?'Φ9':'Φ6',cx+14,cy-21,P.ink,5.2);
      /* 寸法線 */line(146,cy-r,146,cy+r,P.ink,.4);line(cx,cy-r,150,cy-r,P.ink,.3);line(cx,cy+r,150,cy+r,P.ink,.3);if(!bad.has('h'))jt('60',149,cy-3,P.ink,5.6);
      {const rw=r*65/60;line(cx-rw,130,cx+rw,130,P.ink,.4);line(cx-rw,cy,cx-rw,134,P.ink,.3);line(cx+rw,cy,cx+rw,134,P.ink,.3);jt('65',cx,131.5,P.ink,5.6,'center')}
      /* 表題欄 */c.strokeStyle=P.ink;c.lineWidth=.5;c.strokeRect(14,146,122,20);line(88,146,88,166,P.ink,.5);jt('材料',17,148,P.inkmut,4.6);jt(bad.has('mat')?'アルミ A5052':'黄銅 C3604',17,155,P.ink,6);jt('個数',95,148,P.inkmut,4.6);jt('1',95,155,P.ink,6);
      /* えらべる場所 */g.items.forEach(it=>{const f=g.isFocus(it)&&g.active();if(found.has(it.id)){c.strokeStyle='#d0392b';c.lineWidth=1.2;c.beginPath();c.ellipse(it.x+it.w/2,it.y+it.h/2,it.w/2+1,it.h/2+1,0,0,TAU);c.stroke()}
        else{T.rr(it.x,it.y,it.w,it.h,2,f?'rgba(246,194,28,.28)':null,f?'#c79a00':'rgba(18,63,124,.28)',f?1.1:.4)}});
      T.panel(178,8,134,108,'仕様書（正しい内容）');REV_SPEC.forEach((s,i)=>jt(s,184,24+i*13.5,P.txt,6.2));
      T.panel(178,120,134,52,'見つけたまちがい');for(let i=0;i<3;i++){T.check(190+i*16,140,i<found.size,i===found.size)}jt(found.size+' / 3',240,135,P.acc,9);
      T.wrap(S.TOUCH?'図面と仕様書を見くらべて、ちがうところをタップ。':'図面と仕様書を見くらべて、ちがうところをえらんでEnter。',184,150,122,5.4,P.mut,7.4);
    }});
  g.dbg=()=>({bad:[...bad],found:[...found],ids:g.items.map(i=>i.id)});
  return g}
S.STAGES.push({id:'review',dept:'dev',name:'検査（検図）',limit:60,lines:'review',hint:'矢印キー：見る場所を動かす　Enter：まちがいとして印をつける　（マウスのクリックでもOK）',make:ReviewGame,
  tut:[
    {text:'左が、設計した図面。右上が、正しい仕様書だよ。',spot:[8,8,164,164],card:'bottom'},
    {text:'図面の中の、四角で囲まれたところを順に見て、仕様書とちがうところでEnter（またはクリック）。まちがいは3か所あるよ。',spot:[178,8,134,108],card:'bottom'},
    {text:'合っているところに印をつけるとミスになる。あわてず見くらべよう。制限時間は60秒！'}
  ]});
})();
