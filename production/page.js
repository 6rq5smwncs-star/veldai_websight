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

/* ============================================================
   VeldAI — review form (star picker + private follow-up funnel)
   Works on ANY host (Vercel, etc). Submissions go to whatever form
   endpoint you paste below — Formspree, Web3Forms, a /api route, etc.
   • 4-5 stars -> thank-you + optional "post on Google" button.
   • 1-3 stars -> private follow-up questions, routed only to you.
============================================================ */
(function () {
    'use strict';
    var form = document.getElementById('review-form');
    if (!form) return;

    /* >>> WHERE REVIEWS ARE SENT — paste your form endpoint here <<<
       Formspree example:  'https://formspree.io/f/abcdwxyz'
       Web3Forms example:  'https://api.web3forms.com/submit'  (also add your access_key as a hidden input)
       Leave blank to just show the thank-you without sending (good for previewing). */
    var REVIEW_ENDPOINT = '';

    /* Optional: paste your Google review link to send happy (4-5 star) reviewers there too. */
    var GOOGLE_REVIEW_URL = '';

    var rating = 0;
    var stars = Array.prototype.slice.call(form.querySelectorAll('.star-input button'));
    var ratingField = form.querySelector('input[name="rating"]');
    var box = form.querySelector('.star-input');
    var statusEl = document.getElementById('review-status');
    var thanks = document.getElementById('review-thanks');
    var followup = document.getElementById('review-followup');

    function paint(n) { stars.forEach(function (b, i) { b.classList.toggle('on', i < n); b.setAttribute('aria-checked', (i + 1) === rating ? 'true' : 'false'); }); }
    function toggleFollowup() { if (followup) followup.hidden = !(rating > 0 && rating < 4); }

    stars.forEach(function (b, i) {
        b.addEventListener('click', function () { rating = i + 1; ratingField.value = rating; paint(rating); statusEl.textContent = ''; toggleFollowup(); });
        b.addEventListener('mouseenter', function () { paint(i + 1); });
    });
    if (box) box.addEventListener('mouseleave', function () { paint(rating); });

    function showThanks() {
        var happy = rating >= 4;
        form.style.display = 'none';
        if (happy) {
            thanks.innerHTML = '<h3>Thank you — that means a lot.</h3>' +
                '<p>We\u2019d be grateful if you shared this publicly too, where it helps most.</p>' +
                (GOOGLE_REVIEW_URL ? '<a class="btn btn--primary" href="' + GOOGLE_REVIEW_URL + '" target="_blank" rel="noopener noreferrer">Post it on Google</a>' : '');
        } else {
            thanks.innerHTML = '<h3>Thank you for the honest feedback.</h3>' +
                '<p>This comes straight to us privately — someone will reach out personally to make it right.</p>';
        }
        thanks.style.display = 'block';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!rating) { statusEl.textContent = 'Please pick a star rating first.'; return; }
        if (!REVIEW_ENDPOINT) { showThanks(); return; }
        statusEl.textContent = 'Sending…';
        var btn = form.querySelector('button[type="submit"]'); if (btn) btn.disabled = true;
        fetch(REVIEW_ENDPOINT, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
            .then(function (r) { if (!r.ok) throw new Error('bad'); showThanks(); })
            .catch(function () { statusEl.textContent = 'Something went wrong — please try again, or WhatsApp us.'; if (btn) btn.disabled = false; });
    });
})();
