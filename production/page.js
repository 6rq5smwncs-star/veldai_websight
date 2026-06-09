/* ============================================================
   VeldAI — page logic (vanilla)
   • business-hours open/closed indicator (CAT, UTC+2)
   • reveal-on-scroll
   • applyVeldTweaks(): single source of truth for theme/accent/headline,
     called by the React Tweaks panel (app.jsx)
============================================================ */
(function () {
    'use strict';

    /* ---- Headline variants (driven by the Tweaks panel) ---- */
    var HEADLINES = {
        'found-booked':
            'Websites and AI that get healthcare practices<br>' +
            '<span class="accent-italic">found and fully booked.</span>',
        'impossible':
            'Make your practice<br>' +
            '<span class="accent-italic">impossible to miss</span> — online and in AI search.',
        'more-less':
            '<span class="accent-italic">More patients.</span><br>' +
            'Less admin. Zero empty chairs.'
    };

    /* ---- Apply tweaks to the DOM (exposed globally) ---- */
    window.applyVeldTweaks = function (t) {
        if (!t) return;
        var root = document.documentElement;
        if (t.direction) root.setAttribute('data-direction', t.direction);
        if (t.accent) root.style.setProperty('--accent', t.accent);
        var h = document.querySelector('[data-headline]');
        if (h && t.headline && HEADLINES[t.headline]) h.innerHTML = HEADLINES[t.headline];
    };

    /* ---- Business hours status ---- */
    function updateBusinessStatus() {
        var el = document.getElementById('business-status');
        if (!el) return;
        var cat = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Harare' }));
        var day = cat.getDay();
        var mins = cat.getHours() * 60 + cat.getMinutes();
        var OPEN = 9 * 60, CLOSE_WK = 17 * 60, CLOSE_SAT = 12 * 60;
        var open = false;
        if (day >= 1 && day <= 5) open = mins >= OPEN && mins < CLOSE_WK;
        else if (day === 6) open = mins >= OPEN && mins < CLOSE_SAT;
        el.className = 'status-indicator ' + (open ? 'status-indicator--open' : 'status-indicator--closed');
        el.innerHTML = '<span class="status-dot" aria-hidden="true"></span>&nbsp;' + (open ? 'Open now' : 'Closed');
    }
    updateBusinessStatus();
    setInterval(updateBusinessStatus, 60000);

    /* ---- Reveal on scroll ---- */
    function initReveal() {
        var items = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window) || !items.length) {
            items.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
        items.forEach(function (el) { io.observe(el); });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReveal);
    } else {
        initReveal();
    }
})();
