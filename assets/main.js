/* ===================================================================
   HACKATHON IT SCHOOL — shared front-end behaviour
=================================================================== */
window.HITS_CONFIG = {
  SUPABASE_URL: 'https://hadgkmvlazkvhhmuxljg.supabase.co',
  SUPABASE_KEY: 'sb_publishable_vfAvrYTF0mNa2wbIP_O0Xw_y_ME4F3f',
  // SHA-256 hash of '1234' is '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
  ADMIN_PASSWORD_HASH: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
};

(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: scroll shadow + mobile menu ---------- */
  function initNav(){
    const nav = document.querySelector('.nav-bar');
    if(!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});

    const burger = document.querySelector('.nav-burger');
    const mobile = document.querySelector('.nav-mobile');
    if(burger && mobile){
      burger.addEventListener('click', () => mobile.classList.toggle('open'));
      mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobile.classList.remove('open')));
    }
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal(){
    const items = document.querySelectorAll('.reveal');
    if(!items.length) return;
    if(reduceMotion){ items.forEach(el => el.classList.add('visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -40px 0px'});
    items.forEach((el,i) => {
      const group = el.closest('.reveal-stagger');
      if(group){
        const siblings = [...group.querySelectorAll('.reveal')];
        el.style.setProperty('--i', siblings.indexOf(el));
      }
      io.observe(el);
    });
  }

  /* ---------- Button ripple ---------- */
  function initRipple(){
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function(e){
        const rect = this.getBoundingClientRect();
        const r = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        r.className = 'ripple';
        r.style.width = r.style.height = size + 'px';
        r.style.left = (e.clientX - rect.left - size/2) + 'px';
        r.style.top = (e.clientY - rect.top - size/2) + 'px';
        this.appendChild(r);
        setTimeout(() => r.remove(), 560);
      });
    });
  }

  /* ---------- Animated counters (data-count) ---------- */
  function initCounters(){
    const els = document.querySelectorAll('[data-count]');
    if(!els.length) return;
    const animate = (el) => {
      const text = el.dataset.count;
      const match = text.match(/[\d.]+/);
      if(!match) return; // non-numeric labels stay static
      const target = parseFloat(match[0]);
      const suffix = text.slice(match.index + match[0].length);
      const prefix = text.slice(0, match.index);
      const dur = 900;
      const start = performance.now();
      function tick(now){
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = (target * eased);
        el.textContent = prefix + (Number.isInteger(target) ? Math.round(val) : val.toFixed(1)) + suffix;
        if(p < 1) requestAnimationFrame(tick);
      }
      if(reduceMotion){ el.textContent = text; return; }
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting){ animate(e.target); io.unobserve(e.target); } });
    }, {threshold:.6});
    els.forEach(el => io.observe(el));
  }

  /* ---------- Network canvas (hero signature animation) ---------- */
  function initNetworkCanvas(){
    const canvas = document.querySelector('.hero-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, nodes = [], dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    let running = !reduceMotion;
    const NODE_COUNT_BASE = 46;

    function resize(){
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.max(18, Math.round(NODE_COUNT_BASE * (w / 1200)));
      nodes = Array.from({length: count}, () => ({
        x: Math.random()*w, y: Math.random()*h,
        vx: (Math.random()-.5)*0.18, vy: (Math.random()-.5)*0.18,
        r: Math.random()*1.6 + 1
      }));
    }

    function step(){
      ctx.clearRect(0,0,w,h);
      const linkDist = Math.min(150, w*0.13);
      for(const n of nodes){
        n.x += n.vx; n.y += n.vy;
        if(n.x < 0 || n.x > w) n.vx *= -1;
        if(n.y < 0 || n.y > h) n.vy *= -1;
      }
      for(let i=0;i<nodes.length;i++){
        for(let j=i+1;j<nodes.length;j++){
          const a = nodes[i], b = nodes[j];
          const dx = a.x-b.x, dy = a.y-b.y;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if(dist < linkDist){
            const op = (1 - dist/linkDist) * 0.5;
            ctx.strokeStyle = `rgba(224,160,47,${op*0.55})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          }
        }
      }
      for(const n of nodes){
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(143,227,220,0.85)';
        ctx.fill();
      }
      if(running) requestAnimationFrame(step);
    }

    resize();
    if(reduceMotion){ step(); } else { requestAnimationFrame(step); }
    window.addEventListener('resize', () => { resize(); }, {passive:true});

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        running = e.isIntersecting && !reduceMotion;
        if(running) requestAnimationFrame(step);
      });
    }, {threshold:0});
    io.observe(canvas);
  }

  /* ---------- Phone number formatter (+998 XX XXX XX XX) ---------- */
  window.formatUzPhone = function(input){
    let digits = input.value.replace(/\D/g,'');
    if(digits.startsWith('998')) digits = digits.slice(3);
    digits = digits.slice(0,9);
    let out = '+998';
    if(digits.length>0) out += ' ' + digits.slice(0,2);
    if(digits.length>2) out += ' ' + digits.slice(2,5);
    if(digits.length>5) out += ' ' + digits.slice(5,7);
    if(digits.length>7) out += ' ' + digits.slice(7,9);
    input.value = out;
  };

  /* ---------- Toast utility (shared) ---------- */
  window.hitsToast = function(message, type){
    let stack = document.querySelector('.toast-stack');
    if(!stack){
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    const icon = type === 'danger' ? '⚠️' : (type === 'success' ? '✅' : 'ℹ️');
    t.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    stack.appendChild(t);
    setTimeout(() => { t.classList.add('fading'); setTimeout(() => t.remove(), 320); }, 4200);
  };

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initRipple();
    initCounters();
    initNetworkCanvas();
  });
})();
