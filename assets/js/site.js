(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Toast + clipboard */
  const toastEl = $('.toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  };
  const copy = async (text, msg = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast(msg);
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy, 'Email copied')));

  /* Theme */
  const setTheme = (t) => {
    root.dataset.theme = t;
    localStorage.setItem('theme', t);
  };
  const toggleTheme = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  $('#theme-toggle').addEventListener('click', toggleTheme);

  /* Nav: scrolled state, progress bar, active link, mobile menu */
  const nav = $('.nav');
  const progress = $('.progress');
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 10);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav-links a');
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  navLinks.forEach((a) => {
    const s = $(a.getAttribute('href'));
    if (s) sectionObs.observe(s);
  });

  const menuBtn = $('#menu-toggle');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* Reveal on scroll */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 70}ms`;
    revealObs.observe(el);
  });

  /* Typed headline: types once, then holds */
  const typed = $('.typed');
  if (typed) {
    const text = typed.dataset.text;
    if (reduceMotion) {
      typed.textContent = text;
    } else {
      let i = 0;
      const step = () => {
        typed.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 55);
      };
      step();
    }
  }

  /* Card spotlight + photo tilt */
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  const frame = $('.photo-frame');
  if (frame && !reduceMotion && matchMedia('(pointer: fine)').matches) {
    const hero = $('.hero');
    hero.addEventListener('pointermove', (e) => {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      frame.style.setProperty('--rx', `${x * 10}deg`);
      frame.style.setProperty('--ry', `${-y * 10}deg`);
    });
    hero.addEventListener('pointerleave', () => {
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
    });
  }

  /* Hero particle network */
  const canvas = $('.hero-canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const mouse = { x: -1e4, y: -1e4 };
    let pts = [], w = 0, h = 0, dpr = 1, running = true, raf;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    };
    const draw = () => {
      const rgb = getComputedStyle(root).getPropertyValue('--particle').trim();
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { p.x += dx * 0.012; p.y += dy * 0.012; }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(${rgb},${(1 - d / 130) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 180) {
          ctx.strokeStyle = `rgba(${rgb},${(1 - md / 180) * 0.45})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = `rgba(${rgb},0.7)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(draw);
    };
    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
    new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting && !document.hidden;
      if (vis && !running) { running = true; raf = requestAnimationFrame(draw); }
      else if (!vis) { running = false; cancelAnimationFrame(raf); }
    }).observe(hero);
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
    raf = requestAnimationFrame(draw);
  }

  /* Filters */
  const setupFilter = (btnSel, itemSel, attr, datasetKey) => {
    const btns = $$(btnSel);
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        const v = b.dataset[attr];
        btns.forEach((x) => {
          x.classList.toggle('is-active', x === b);
          x.setAttribute('aria-pressed', x === b);
        });
        $$(itemSel).forEach((el) => {
          const show = v === 'all' || el.dataset[datasetKey].split(' ').includes(v);
          el.classList.toggle('is-hidden', !show);
          el.classList.remove('pop');
          if (show) { void el.offsetWidth; el.classList.add('pop'); el.classList.add('visible'); }
        });
      })
    );
  };
  setupFilter('.pfilter', '.pub', 'topic', 'topic');

  /* Citations */
  const citeDlg = $('#cite-dialog');
  const citeOut = $('#cite-out');
  let citeData = null, citeFmt = 'apa';
  const initials = (given) => given.split(/[\s-]+/).filter(Boolean).map((g) => g[0] + '.').join(' ');
  const apa = (d) => {
    const names = d.authors.map(([fam, giv]) => `${fam}, ${initials(giv)}`);
    let au;
    if (names.length === 1) au = names[0];
    else if (names.length <= 20) au = names.slice(0, -1).join(', ') + ', & ' + names.at(-1);
    else au = names.slice(0, 19).join(', ') + ', … ' + names.at(-1);
    const vol = d.volume ? `, ${d.volume}${d.number ? `(${d.number})` : ''}` : '';
    const pages = d.pages ? `, ${d.pages.replace('-', '–')}` : '';
    return `${au} (${d.year}). ${d.title}. ${d.venue}${vol}${pages}. https://doi.org/${d.doi}`;
  };
  const bib = (d) => {
    const esc = (s) => s.replace(/&/g, '\\&');
    const venueKey = d.type === 'inproceedings' ? 'booktitle' : 'journal';
    const fields = [
      ['title', `{${esc(d.title)}}`],
      ['author', d.authors.map(([f, g]) => `${f}, ${g}`).join(' and ')],
      [venueKey, esc(d.venue)],
      ['year', d.year],
      d.volume && ['volume', d.volume],
      d.number && ['number', d.number],
      d.pages && ['pages', d.pages.replace('-', '--')],
      ['doi', d.doi],
    ].filter(Boolean);
    return `@${d.type}{${d.key},\n` + fields.map(([k, v]) => `  ${k} = {${v}}`).join(',\n') + '\n}';
  };
  const renderCite = () => { citeOut.textContent = citeFmt === 'apa' ? apa(citeData) : bib(citeData); };
  $$('[data-cite]').forEach((b) =>
    b.addEventListener('click', () => {
      const el = b.closest('.pub');
      const ds = el.dataset;
      citeData = {
        type: ds.type, key: ds.key, year: ds.year, doi: ds.doi, venue: ds.venue,
        volume: ds.volume, number: ds.number, pages: ds.pages,
        title: $('.pub-title', el).textContent.trim(),
        authors: ds.authors.split(';').map((a) => a.trim().split(',').map((s) => s.trim())),
      };
      renderCite();
      citeDlg.showModal();
    })
  );
  $$('.tab', citeDlg).forEach((t) =>
    t.addEventListener('click', () => {
      citeFmt = t.dataset.fmt;
      $$('.tab', citeDlg).forEach((x) => {
        x.classList.toggle('is-active', x === t);
        x.setAttribute('aria-selected', x === t);
      });
      renderCite();
    })
  );
  $('#cite-copy').addEventListener('click', () => copy(citeOut.textContent, 'Citation copied'));
  [citeDlg, $('#palette')].forEach((d) =>
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); })
  );

  /* Command palette */
  const palette = $('#palette');
  const pInput = $('#palette-input');
  const pList = $('#palette-list');
  const go = (id) => () => $(id).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  const open = (url) => () => window.open(url, '_blank', 'noopener');
  const commands = [
    ['Focus: trustworthy AI agents', 'Section', go('#focus')],
    ['Experience', 'Section', go('#experience')],
    ['About', 'Section', go('#about')],
    ['Skills', 'Section', go('#skills')],
    ['Publications', 'Section', go('#publications')],
    ['Education', 'Section', go('#education')],
    ['Contact', 'Section', go('#contact')],
    ['Toggle light / dark theme', 'Action', toggleTheme],
    ['Copy email address', 'Action', () => copy('cocozhao321@gmail.com', 'Email copied')],
    ['Send an email', 'Link', () => { location.href = 'mailto:cocozhao321@gmail.com'; }],
    ['Open LinkedIn', 'Link', open('https://www.linkedin.com/in/coco-zhao-8555b3126/')],
    ['Open Google Scholar', 'Link', open('https://scholar.google.com/citations?user=1sRV25IAAAAJ&hl=en')],
  ].map(([label, kind, run]) => ({ label, kind, run }));
  let filtered = commands, sel = 0;
  const renderPalette = () => {
    const q = pInput.value.trim().toLowerCase();
    filtered = commands.filter((c) => (c.label + ' ' + c.kind).toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    pList.innerHTML = '';
    if (!filtered.length) {
      pList.innerHTML = '<li class="empty">No results</li>';
      return;
    }
    filtered.forEach((c, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = `cmd-${i}`;
      li.setAttribute('aria-selected', i === sel);
      li.innerHTML = `<span></span><small>${c.kind}</small>`;
      li.firstChild.textContent = c.label;
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; renderPalette(); } });
      li.addEventListener('click', () => runCmd(c));
      pList.append(li);
    });
    pInput.setAttribute('aria-activedescendant', `cmd-${sel}`);
    $(`#cmd-${sel}`)?.scrollIntoView({ block: 'nearest' });
  };
  const runCmd = (c) => { palette.close(); c.run(); };
  const openPalette = () => {
    if (palette.open) return;
    pInput.value = '';
    sel = 0;
    renderPalette();
    palette.showModal();
    pInput.focus();
  };
  pInput.addEventListener('input', () => { sel = 0; renderPalette(); });
  pInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, filtered.length); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); renderPalette(); }
    else if (e.key === 'Enter' && filtered[sel]) { e.preventDefault(); runCmd(filtered[sel]); }
  });
  $$('[data-open-palette]').forEach((b) => b.addEventListener('click', openPalette));
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.open ? palette.close() : openPalette(); }
    else if (e.key === '/' && !typing && !palette.open) { e.preventDefault(); openPalette(); }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform)) $$('kbd').forEach((k) => { if (k.textContent === '⌘K') k.textContent = 'Ctrl K'; });
})();
