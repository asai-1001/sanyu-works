/* =====================================================================
   三友ワークス — アンケート
   ・質問は SW.SURVEY.questions を書きかえると変えられます。
     type:'single'（1つえらぶ）／'scale'（5段階）／'text'（自由記述。max で字数の上限、csv で CSV の列名）
   ・回答の保存先は SW.surveyStore です。今はこの端末（ブラウザ）に保存しています。
     将来ダッシュボードで集計するときは、surveyStore.save() の中身を
     サーバーへ送る処理に差し替えるだけで済むようにしてあります（README参照）。
   ===================================================================== */
(()=>{
'use strict';
const S=SW;

S.SURVEY={
  schema:'sanyu-works-survey/3',   /* Ver. 2.3 で 3 に（answers に comment〈感想〉が入ることがある） */
  questions:[
    {id:'occupation',type:'single',q:'あなたの今の立場を教えてください',
     options:['高校生','高専生','専門学校生','大学生','大学院生','社会人（転職を考えている）','その他']},
    {id:'age',type:'single',q:'年齢を教えてください',
     options:['18歳以下','19〜22歳','23〜25歳','26〜29歳','30歳以上']},
    {id:'understand_work',type:'scale',q:'三友製作所の仕事の内容がイメージできた'},
    {id:'understand_tech',type:'scale',q:'三友製作所の技術や設備の特徴が分かった'},
    {id:'understand_flow',type:'scale',q:'設計から出荷までの仕事の流れがイメージできた'},
    /* Ver. 2.3：感想（自由記述・任意）。空のままでも送信できる */
    {id:'comment',type:'text',q:'感想があれば、自由に書いてください',csv:'感想',max:200,
     placeholder:'例：機械で削るところが楽しかった／検査の仕事に興味を持った　など'}
  ],
  /* 5段階（1〜5）の目盛り */
  scale:[{v:1,t:'まったく\nそう思わない'},{v:2,t:'あまり\nそう思わない'},{v:3,t:'どちらとも\nいえない'},{v:4,t:'ややそう思う'},{v:5,t:'とても\nそう思う'}]
};

/* ---------- 保存先（差し替えポイント） ----------
   save(record) は Promise を返す。list() は保存済みの回答の配列を返す。 */
S.surveyStore={
  save(record){const a=S.store.get('survey',[]);a.push(record);S.store.set('survey',a);return Promise.resolve(true)},
  list(){return Promise.resolve(S.store.get('survey',[]))},
  clear(){S.store.del('survey');return Promise.resolve(true)}
};

/* 文字数は、絵文字なども1字として数える */
const chars=v=>Array.from(String(v||''));
const clip=(v,max)=>chars(v).slice(0,max).join('');

function uid(){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}

/* 回答画面。context はゲームの成績（ダッシュボード用に一緒に保存する） */
S.runSurvey=function(context){
  const Q=S.SURVEY.questions,ans={};let i=0;
  return S.guard(new Promise(res=>{
    function finish(skipped){
      if(skipped){res(null);return}
      const record={schema:S.SURVEY.schema,id:uid(),answeredAt:new Date().toISOString(),answers:ans,game:context||{},client:{app:'sanyu-works',version:S.VERSION||''}};
      S.surveyStore.save(record).then(()=>res(record),()=>res(record));
    }
    function render(){
      const q=Q[i];
      if(q.type==='text'){renderText(q);return}
      const opts=q.type==='scale'
        ?`<div class="scale">${S.SURVEY.scale.map(s=>`<button type="button" class="chip${ans[q.id]===s.v?' on':''}" data-v="${s.v}"><b>${s.v}</b><span>${S.esc(s.t)}</span></button>`).join('')}</div>`
        :`<div class="chips">${q.options.map((o,k)=>`<button type="button" class="chip${ans[q.id]===o?' on':''}" data-k="${k}">${S.esc(o)}</button>`).join('')}</div>`;
      const p=S.panel(`<div class="pin narrow">
        <p class="kicker">アンケート　${i+1} / ${Q.length}</p>
        <div class="prog"><i style="width:${Math.round(i/Q.length*100)}%"></i></div>
        <h3>${S.esc(q.q)}</h3>${opts}
        <div class="btnrow">${i>0?'<button type="button" class="btn ghost" data-a="back">もどる</button>':''}<button type="button" class="btn ghost" data-a="skip">回答しないで進む</button></div>
        <p class="fine">回答は、この端末に名前なしで保存されます。</p></div>`,'survey');
      p.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{S.sfx.blip();
        ans[q.id]=q.type==='scale'?+b.dataset.v:q.options[+b.dataset.k];
        i++;if(i>=Q.length)finish(false);else render()}));
      const bk=p.querySelector('[data-a="back"]');if(bk)bk.addEventListener('click',()=>{S.sfx.blip();i--;render()});
      p.querySelector('[data-a="skip"]').addEventListener('click',()=>{S.sfx.blip();finish(true)});
      S.focusSoon(p.querySelector('.chip'));
    }
    /* 自由記述（感想）。任意なので、空のままでも送信できる。
       入力中は、矢印・Enter・Space は文字の入力に使われる（Tab で送信ボタンへ。Ctrl＋Enter でそのまま送信） */
    function renderText(q){
      const max=q.max||200,last=i===Q.length-1;
      const p=S.panel(`<div class="pin narrow">
        <p class="kicker">アンケート　${i+1} / ${Q.length}　<span class="opt-tag">任意</span></p>
        <div class="prog"><i style="width:${Math.round(i/Q.length*100)}%"></i></div>
        <h3>${S.esc(q.q)}</h3>
        <div class="free"><textarea id="svText" rows="4" spellcheck="false" aria-label="${S.esc(q.q)}（任意・${max}字まで）" placeholder="${S.esc(q.placeholder||'')}"></textarea>
          <p class="cnt"><span>${max}字まで。書かなくても${last?'送信でき':'先へ進め'}ます。</span><b id="svCnt">0 / ${max}</b></p></div>
        <div class="btnrow">${i>0?'<button type="button" class="btn ghost" data-a="back">もどる</button>':''}<button type="button" class="btn" data-a="send">${last?'送信する':'次へ'}</button></div>
        <p class="fine kbd">入力中は、矢印・Enter・Space は文字の入力に使います。<b>Tab</b> で${last?'送信':'次へ'}ボタンへ、<b>Ctrl＋Enter</b> でそのまま${last?'送信':'次へ'}。</p>
        <p class="fine">回答は、この端末に名前なしで保存されます。</p></div>`,'survey');
      const ta=p.querySelector('#svText'),cnt=p.querySelector('#svCnt');
      ta.value=typeof ans[q.id]==='string'?ans[q.id]:'';
      const sync=()=>{if(chars(ta.value).length>max){const pos=ta.selectionStart;ta.value=clip(ta.value,max);try{ta.setSelectionRange(pos,pos)}catch(_){}}
        const n=chars(ta.value).length;cnt.textContent=n+' / '+max;cnt.classList.toggle('full',n>=max);ans[q.id]=ta.value};
      ta.addEventListener('input',e=>{if(!e.isComposing)sync();else{const n=chars(ta.value).length;cnt.textContent=n+' / '+max;cnt.classList.toggle('full',n>=max)}});
      ta.addEventListener('compositionend',sync);
      const send=()=>{sync();const v=clip(ta.value.replace(/\r\n?/g,'\n').trim(),max);if(v)ans[q.id]=v;else delete ans[q.id];S.sfx.blip();i++;if(i>=Q.length)finish(false);else render()};
      const sb=p.querySelector('[data-a="send"]');
      ta.addEventListener('keydown',e=>{if(e.isComposing||e.keyCode===229)return;
        if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send();return}
        if(e.key==='Tab'&&!e.shiftKey&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();sb.focus()}});   /* Tab：送信（次へ）ボタンへ */
      sb.addEventListener('click',send);
      const bk=p.querySelector('[data-a="back"]');if(bk)bk.addEventListener('click',()=>{sync();S.sfx.blip();i--;render()});
      sync();S.focusSoon(ta);
    }
    render();
  }));
};
})();
