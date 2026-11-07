import { ICONS } from './icons';

export function Hero(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'pt-24 pb-20 reveal';
  section.innerHTML = `
    <div class="max-w-3xl">
      <div class="inline-flex items-center gap-2.5 px-4 py-2 mb-7 rounded-full border border-border bg-surface text-xs font-medium text-text-muted backdrop-blur-xl">
        <span class="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgb(var(--primary))] animate-pulse"></span>
        <span>v3.0 · 32 языка · публичный API</span>
      </div>

      <h1 class="text-[clamp(38px,6.5vw,76px)] font-black tracking-[-0.045em] leading-[1.02] mb-6">
        <span class="block">Удалите комментарии</span>
        <span class="block bg-[linear-gradient(120deg,rgb(var(--primary)),rgb(var(--accent)),rgb(var(--primary)))] bg-[length:200%_auto] bg-clip-text text-transparent animate-shine">в коде за одну секунду</span>
      </h1>

      <p class="text-[17px] text-text-muted max-w-xl leading-relaxed mb-9">
        Python, JavaScript, TypeScript, Java, C, C#, C++, Ruby, Go, Rust, PHP,
        HTML, CSS и другие. Строки, шаблоны и регулярки остаются нетронутыми.
      </p>

      <div class="flex flex-wrap gap-3 mb-14">
        <a href="#tool" class="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold rounded-sm bg-gradient-to-br from-primary to-primary-2 text-[#08090d] shadow-[0_4px_20px_rgb(var(--primary)/0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgb(var(--primary)/0.4)]">
          ${ICONS.arrowRight} Начать
        </a>
        <a href="#api" class="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold rounded-sm border border-border bg-surface text-text backdrop-blur-xl transition-all hover:border-primary hover:text-primary hover:-translate-y-0.5">
          ${ICONS.code} API
        </a>
      </div>

      <div class="inline-flex items-center gap-7 px-7 py-4 rounded-md border border-border bg-surface backdrop-blur-xl">
        <div class="flex flex-col gap-0.5">
          <span class="text-[22px] font-extrabold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent" data-counter="32">0</span>
          <span class="text-[11px] text-text-muted uppercase tracking-wider font-semibold">языков</span>
        </div>
        <div class="w-px h-8 bg-border"></div>
        <div class="flex flex-col gap-0.5">
          <span class="text-[22px] font-extrabold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent" data-counter="9">0</span>
          <span class="text-[11px] text-text-muted uppercase tracking-wider font-semibold">API</span>
        </div>
        <div class="w-px h-8 bg-border"></div>
        <div class="flex flex-col gap-0.5">
          <span class="text-[22px] font-extrabold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">100%</span>
          <span class="text-[11px] text-text-muted uppercase tracking-wider font-semibold">privacy</span>
        </div>
      </div>
    </div>
  `;
  return section;
}

export function animateCounters(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-counter]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      const target = Number(el.dataset.counter ?? 0);
      const start = performance.now();
      const dur = 1200;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toString();
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    }
  }, { threshold: 0.5 });
  els.forEach((el) => io.observe(el));
}