// Sacred Forge Systems — shared behavior

// theme: dark default, remembered
(function(){
  var root=document.documentElement;
  var saved='dark';
  try{saved=localStorage.getItem('sfs-theme')||'dark'}catch(e){}
  root.setAttribute('data-theme',saved);
})();

document.addEventListener('DOMContentLoaded',function(){
  // mobile nav
  var toggle=document.getElementById('navToggle'),links=document.getElementById('navLinks');
  if(toggle&&links){
    toggle.addEventListener('click',function(){links.classList.toggle('open')});
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){
        // let dropdown parents open on mobile without closing the whole menu
        if(a.getAttribute('href')&&a.getAttribute('href')!=='#')links.classList.remove('open');
      });
    });
  }

  // theme toggle button
  var root=document.documentElement,btn=document.getElementById('themeToggle');
  function paint(){
    var t=root.getAttribute('data-theme');
    var i=document.getElementById('themeIcon'),l=document.getElementById('themeLabel');
    if(i)i.textContent=t==='dark'?'☾':'☀';
    if(l)l.textContent=t==='dark'?'Dark':'Light';
  }
  paint();
  if(btn){btn.addEventListener('click',function(){
    var t=root.getAttribute('data-theme')==='dark'?'light':'dark';
    root.setAttribute('data-theme',t);
    try{localStorage.setItem('sfs-theme',t)}catch(e){}
    paint();
  });}

  // reveal on scroll (progressive enhancement — content is visible without JS)
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.12});
  document.querySelectorAll('.sec-head,.card,.step,.plan,.case,.qa,.cta,.pill,.quote,.post,.pcard').forEach(function(el,i){
    el.classList.add('reveal');el.style.transitionDelay=(i%6*40)+'ms';io.observe(el);
  });

  // contact / project form — client-side demo (no backend wired yet)
  var form=document.getElementById('leadForm');
  if(form){form.addEventListener('submit',function(e){
    e.preventDefault();
    var ok=document.getElementById('formOk');
    form.style.display='none';
    if(ok)ok.style.display='block';
  });}
});
