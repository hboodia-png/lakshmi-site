(function(){
  document.getElementById('yr').textContent = new Date().getFullYear();
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header shrink
  var hdr = document.getElementById('hdr');
  addEventListener('scroll', function(){
    hdr.classList.toggle('scrolled', scrollY > 40);
  }, {passive:true});

  // mobile nav
  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');
  burger.addEventListener('click', function(){
    var open = mnav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.textContent = open ? 'CLOSE' : 'MENU';
  });
  mnav.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){
      mnav.classList.remove('open');
      burger.setAttribute('aria-expanded','false');
      burger.textContent = 'MENU';
    }
  });

  // scrollspy
  var navLinks = document.querySelectorAll('nav.main a[href^="#"]:not(.btn)');
  var map = {};
  navLinks.forEach(function(a){ map[a.getAttribute('href').slice(1)] = a; });
  if('IntersectionObserver' in window){
    var spy = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(en.isIntersecting){
          navLinks.forEach(function(a){ a.classList.remove('on'); });
          var a = map[en.target.id]; if(a) a.classList.add('on');
        }
      });
    }, {rootMargin:'-40% 0px -55% 0px'});
    Object.keys(map).forEach(function(id){
      var s = document.getElementById(id); if(s) spy.observe(s);
    });
  }

  // product filter
  var fbtns = document.querySelectorAll('.fbtn');
  var cards = document.querySelectorAll('.pcard');
  fbtns.forEach(function(b){
    b.addEventListener('click', function(){
      fbtns.forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      var f = b.getAttribute('data-f');
      cards.forEach(function(c){
        c.classList.toggle('hide', f !== 'all' && c.getAttribute('data-cat') !== f);
      });
    });
  });

  // lightbox
  var lb = document.getElementById('lb');
  var lbimg = document.getElementById('lbimg');
  var lbcap = document.getElementById('lbcap');
  document.querySelectorAll('.zoom img, .pimg img').forEach(function(img){
    img.parentElement.addEventListener('click', function(){
      lbimg.src = img.currentSrc || img.src;
      lbimg.alt = img.alt || '';
      lbcap.textContent = img.getAttribute('data-cap') || img.alt || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLb(){
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbimg.src = '';
  }
  lb.addEventListener('click', function(e){ if(e.target === lb || e.target === lbimg) closeLb(); });
  document.getElementById('lbclose').addEventListener('click', closeLb);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && lb.classList.contains('open')) closeLb();
  });

  // reveal + counters
  function countUp(el){
    var target = parseInt(el.getAttribute('data-count'), 10);
    if(reduced || !target){ return; }
    var dur = 1400, t0 = null;
    function fmt(n){ return n.toLocaleString('en-US'); }
    function step(t){
      if(!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased));
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var seen = new WeakSet();
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          en.target.classList.add('in');
          en.target.querySelectorAll('[data-count]').forEach(function(el){
            if(!seen.has(el)){ seen.add(el); countUp(el); }
          });
          if(en.target.hasAttribute('data-count') && !seen.has(en.target)){
            seen.add(en.target); countUp(en.target);
          }
          io.unobserve(en.target);
        }
      });
    }, {threshold:0, rootMargin:'0px 0px -64px 0px'});
    document.querySelectorAll('.rv, .hero-stats').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function(el){ el.classList.add('in'); });
  }

  // RFQ form -> FormSubmit AJAX with mailto fallback
  var form = document.getElementById('rfq');
  var sendBtn = document.getElementById('f-send');
  var status = document.getElementById('f-status');
  var ENDPOINT = 'https://formsubmit.co/ajax/heman.boodia@mahalakshmi.co.ke';
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var g = function(id){ return document.getElementById(id).value.trim(); };
    var name = g('f-name'), company = g('f-company'), email = g('f-email'), msg = g('f-msg');
    status.className = 'form-status';
    if(!name || !company || !email || !msg){
      status.textContent = 'Please fill in name, company, email and your enquiry.';
      status.className = 'form-status err';
      return;
    }
    if(g('f-honey')){ return; }
    var payload = {
      name: name, company: company, email: email,
      country: g('f-country') || '-',
      category: g('f-cat'), volume: g('f-vol'),
      message: msg,
      _subject: 'Quote request — ' + company,
      _template: 'table', _captcha: 'false'
    };
    sendBtn.disabled = true; sendBtn.textContent = 'Sending…';
    fetch(ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify(payload)
    }).then(function(r){
      if(!r.ok) throw new Error('bad status');
      return r.json();
    }).then(function(){
      form.reset();
      status.textContent = 'Enquiry sent. We reply within two business days.';
      status.className = 'form-status ok';
    }).catch(function(){
      var body = 'Name: ' + name + '\nCompany: ' + company + '\nEmail: ' + email +
        '\nCountry: ' + (g('f-country') || '-') + '\nProduct category: ' + g('f-cat') +
        '\nEstimated annual volume: ' + g('f-vol') + '\n\nEnquiry:\n' + msg + '\n';
      location.href = 'mailto:heman.boodia@mahalakshmi.co.ke?subject=' +
        encodeURIComponent('Quote request — ' + company) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Direct sending was blocked by your network — we opened your email app instead with everything pre-filled.';
      status.className = 'form-status err';
    }).finally(function(){
      sendBtn.disabled = false; sendBtn.textContent = 'Send enquiry';
    });
  });
})();
