const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

// V1.13: On desktop, make the left hero composition exactly as tall as the
// approved concept-art image. This keeps eyebrow → headline → description →
// buttons in normal document flow while aligning the button-row bottom with
// the artwork bottom. Tablet/mobile use the existing responsive flow.
(() => {
  const copy = document.querySelector('.overview-page .hero-copy');
  const art = document.querySelector('.overview-page .hero-art img');
  if (!copy || !art) return;

  const syncHeroComposition = () => {
    if (window.matchMedia('(min-width: 1051px)').matches) {
      const artHeight = art.getBoundingClientRect().height;
      if (artHeight > 0) copy.style.height = `${artHeight}px`;
    } else {
      copy.style.height = '';
    }
  };

  if (art.complete) syncHeroComposition();
  else art.addEventListener('load', syncHeroComposition, { once: true });

  window.addEventListener('resize', syncHeroComposition);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(syncHeroComposition);
    ro.observe(art);
  }
})();
