/* =====================================================================
   三友ワークス — チュートリアル（スポットライト＋操作アニメ＋説明カード）
   step = { text, spot:[x,y,w,h], ctrl:['ボタンのキー'], anim:[{x,y,t,down}], card:'top'|'bottom' }
   座標はゲーム画面（横320×縦180）の値。
   ===================================================================== */
(()=>{
'use strict';
const S=SW;
let tut=null;
S.tutActive=false;

function clearSpots(){document.querySelectorAll('.cbtn.spot').forEach(b=>b.classList.remove('spot'))}
function runTutorial(steps,opts){
  opts=opts||{};
  return S.guard(new Promise(res=>{tut={steps,i:0,res,opts,t0:performance.now()/1000};S.tutActive=true;render()}));
}
function render(){
  const st=tut.steps[tut.i],n=tut.steps.length,el=S.$('tut');
  el.hidden=false;el.className='tut '+(st.card==='top'?'top':'bottom');
  el.innerHTML=`<img src="${S.asset(S.mascotSrc||'img/sanpopo.png')}" alt="">
    <div class="tut-body"><p class="tut-k">${S.esc(tut.opts.title||'チュートリアル')}${n>1?`　${tut.i+1} / ${n}`:''}</p><p class="tut-t">${S.esc(S.touchText(st.text))}</p></div>
    <div class="tut-btns">${tut.i>0?'<button type="button" class="btn ghost" data-a="prev">もどる</button>':''}<button type="button" class="btn" data-a="next">${tut.i<n-1?'つぎへ':S.esc(tut.opts.last||'はじめる')}</button>${n>1&&tut.i<n-1?'<button type="button" class="btn ghost" data-a="skip">スキップ</button>':''}</div>`;
  el.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();const a=b.dataset.a;
    if(a==='prev'){tut.i--;render()}else if(a==='next'&&tut.i<n-1){tut.i++;render()}else end()}));
  clearSpots();(st.ctrl||[]).forEach(k=>{const b=S.ctrlByKey(k);if(b)b.classList.add('spot')});
  tut.t0=performance.now()/1000;
  S.focusSoon(el.querySelector('[data-a="next"]'));
}
function end(){if(!tut)return;const r=tut.res;tut=null;S.tutActive=false;S.$('tut').hidden=true;clearSpots();r()}
S.tutEnd=()=>{if(!tut)return;tut=null;S.tutActive=false;S.$('tut').hidden=true;clearSpots()};

function drawHand(C,x,y,down){C.save();C.translate(x,y);C.beginPath();C.moveTo(0,0);C.lineTo(0,11);C.lineTo(3,8.2);C.lineTo(5.2,12.5);C.lineTo(7,11.6);C.lineTo(4.9,7.5);C.lineTo(8.5,7.5);C.closePath();C.fillStyle=down?'#f2c230':'#ffffff';C.fill();C.strokeStyle='#111';C.lineWidth=.8;C.stroke();C.restore()}
S.tutDraw=t=>{
  if(!tut)return;const st=tut.steps[tut.i],C=S.ctx;
  if(st.spot){const[x,y,w,h]=st.spot;C.save();C.fillStyle='rgba(0,0,0,.58)';C.beginPath();C.rect(0,0,S.W,S.H);C.rect(x,y,w,h);C.fill('evenodd');
    const p=S.reduceMotion?1:(Math.sin(t*5)+1)*.5;C.strokeStyle=`rgba(242,194,48,${.55+p*.45})`;C.lineWidth=1.2;C.strokeRect(x+.6,y+.6,w-1.2,h-1.2);C.restore()}
  else{C.fillStyle='rgba(0,0,0,.35)';C.fillRect(0,0,S.W,S.H)}
  if(st.anim&&st.anim.length){
    const A=st.anim,last=A[A.length-1].t,dur=last+.8;const tt=(performance.now()/1000-tut.t0)%dur;
    let k=0;while(k<A.length-1&&A[k+1].t<=tt)k++;const a=A[k],b=A[Math.min(k+1,A.length-1)];
    const f=b.t>a.t?S.clamp((tt-a.t)/(b.t-a.t),0,1):0;const x=a.x+(b.x-a.x)*f,y=a.y+(b.y-a.y)*f;const down=!!a.down&&tt<=last;
    if(down){C.fillStyle='rgba(242,194,48,.35)';C.beginPath();C.arc(x,y,5+(S.reduceMotion?0:Math.sin(t*10)),0,S.TAU);C.fill()}
    drawHand(C,x,y,down);
  }
};
S.runTutorial=runTutorial;
})();
