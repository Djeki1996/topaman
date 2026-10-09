/* RU / UZ switch for the legal pages; remembers the site language (tp_lang) */
(function(){
  let l='ru';try{l=new URLSearchParams(location.search).get('lang')||localStorage.getItem('tp_lang')||'ru'}catch(e){}
  function set(x){l=x==='uz'?'uz':'ru';document.documentElement.lang=l;
    document.querySelectorAll('article').forEach(a=>a.hidden=a.lang!==l);
    document.querySelectorAll('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===l));
    document.title=document.querySelector('article:not([hidden]) h1').textContent+' — Topaman.uz';
    try{localStorage.setItem('tp_lang',l)}catch(e){}}
  document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>set(b.dataset.l));
  set(l);
})();
