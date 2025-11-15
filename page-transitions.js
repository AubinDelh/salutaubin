// page-transitions.js
(function () {
    var DUR = 350; // doit matcher la durée CSS
    var prefersReduced = false;
    try { prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}
  
    // ---- FADE-IN (page d'arrivée)
    function enter() {
      // En cas d'historique (bfcache), retire l'état "sortie"
      document.body.classList.remove('page-out');
  
      if (prefersReduced) {
        document.body.classList.add('page-in'); // pas d'anim
        return;
      }
      // Laisse le temps au navigateur de peindre l'état initial (opacity:0),
      // puis déclenche le passage à opacity:1
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.body.classList.add('page-in');
        });
      });
    }
  
    // Déclenche le fade-in à l'arrivée (chargement + retour historique)
    document.addEventListener('DOMContentLoaded', enter);
    window.addEventListener('pageshow', enter);
  
    if (prefersReduced) return;
  
    // ---- FADE-OUT (page de départ)
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
  
      var href = a.getAttribute('href') || '';
      var target = a.getAttribute('target') || '';
  
      // Liens à ignorer
      if (target === '_blank') return;
      if (!href || href === '#' || href.startsWith('#')) return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
  
      // Résout l'URL et filtre l'externe / même page
      var url; try { url = new URL(href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search && !url.hash) return;
  
      e.preventDefault();
      document.body.classList.remove('page-in');
      document.body.classList.add('page-out');
  
      setTimeout(function () { location.href = url.href; }, DUR);
    });
  })();
  