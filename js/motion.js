/*
 * Motion setting, read before the page paints.
 * Full motion by default on desktop (the brand is the motion). Phones and tablets
 * follow the system "reduce motion" switch. A visitor's own choice, made with the
 * faint button at the top right of the nav, is remembered and always wins.
 * Scroll-scrubbed scenes stay on in "reduce": they only move when the visitor scrolls.
 * Reduce turns off the self-running loops (gears, balance) and the entrance transitions.
 */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  var saved = null;
  try { saved = localStorage.getItem('horae.motion'); } catch (e) {}
  var touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var sysReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (saved === 'reduce' || (saved === null && touch && sysReduce)) d.classList.add('reduce');
  /* ?sync: testing aid for background tabs, where animation frames never fire */
  if (/[?&]sync\b/.test(location.search)) {
    window.requestAnimationFrame = function (f) { return setTimeout(function () { f(performance.now()); }, 16); };
    window.cancelAnimationFrame = clearTimeout;
  }
})();
