import './style.css';
import { applyTheme, getTheme } from './lib/theme';
import { mountApp } from './views/App';

applyTheme(getTheme());

const root = document.getElementById('app');
if (!root) throw new Error('#app not found');

mountApp(root);

/* Reveal on scroll */
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* Cursor glow */
const glow = document.createElement('div');
glow.className = 'cursor-glow';
document.body.appendChild(glow);

let tx = 0, ty = 0, cx = 0, cy = 0;
document.addEventListener('mousemove', (e) => {
  tx = e.clientX;
  ty = e.clientY;
  glow.style.opacity = '1';
});
(function loop() {
  cx += (tx - cx) * 0.15;
  cy += (ty - cy) * 0.15;
  glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
  requestAnimationFrame(loop);
})();