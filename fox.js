// Custom Dora-nichov chibi using page-mascot: two 3x3 sprite sheets, one of head directions
// and one of expressions. The head turns toward the cursor; clicking plays a reaction. Vanilla port of
// the skill's mascot.tsx.
(function () {
    const btn = document.querySelector('.mascot');
    if (!btn) return;
    const dirLayer = btn.querySelector('.mascot-dir');
    const reactLayer = btn.querySelector('.mascot-react');
    const squash = btn.querySelector('.mascot-squash');
    dirLayer.style.backgroundImage = 'url(' + btn.dataset.directions + ')';
    reactLayer.style.backgroundImage = 'url(' + btn.dataset.reactions + ')';

    const DIRECTIONS = ['up-left', 'up', 'up-right', 'left', 'center', 'right', 'down-left', 'down', 'down-right'];
    const REACTIONS = ['blink', 'heart', 'sparkle', 'surprised', 'wink', 'bashful', 'sleepy', 'dizzy', 'delighted'];
    const CLOCKWISE = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    const SECTOR = (Math.PI * 2) / CLOCKWISE.length, HYSTERESIS = 0.12, DEAD_ZONE = 70;
    const PAYOFFS = ['heart', 'sparkle', 'delighted'];
    const SQUASH = [
        { transform: 'scale(1, 1)', easing: 'ease-in' },
        { transform: 'scale(1.10, 0.86)', offset: 0.18, easing: 'ease-out' },
        { transform: 'scale(0.95, 1.08)', offset: 0.45, easing: 'ease-in-out' },
        { transform: 'scale(1.03, 0.97)', offset: 0.72, easing: 'ease-in-out' },
        { transform: 'scale(1, 1)' },
    ];
    // each sheet cell is a 0/50/100% step because the sheet is drawn at 300% size
    const cell = i => (i % 3) * 50 + '% ' + Math.floor(i / 3) * 50 + '%';
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

    function setDirection(name) { dirLayer.style.backgroundPosition = cell(DIRECTIONS.indexOf(name)); }
    function setReaction(name) {
        btn.classList.toggle('is-reacting', !!name);
        if (name) reactLayer.style.backgroundPosition = cell(REACTIONS.indexOf(name));
    }
    setDirection('center');
    setReaction(null);

    // head follows the pointer (fine pointers only)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let sector = -1, pointer = null;
        const aim = () => {
            if (!pointer) return;
            const r = btn.getBoundingClientRect();
            const dx = pointer.x - (r.left + r.width / 2), dy = pointer.y - (r.top + r.height / 2);
            if (Math.hypot(dx, dy) < DEAD_ZONE) { sector = -1; setDirection('center'); return; }
            const angle = Math.atan2(dy, dx);
            if (sector !== -1 && Math.abs(wrap(angle - sector * SECTOR)) < SECTOR / 2 + HYSTERESIS) return;
            sector = (Math.round(angle / SECTOR) + CLOCKWISE.length) % CLOCKWISE.length;
            setDirection(CLOCKWISE[sector]);
        };
        window.addEventListener('pointermove', e => { pointer = { x: e.clientX, y: e.clientY }; aim(); }, { passive: true });
        window.addEventListener('scroll', aim, { passive: true });
    }

    // click: blink, then a payoff expression; poke it fast four times and it gets dizzy
    let timers = [], boops = { count: 0, at: 0 };
    btn.addEventListener('click', () => {
        timers.forEach(clearTimeout); timers = [];
        const later = (ms, next) => timers.push(setTimeout(() => setReaction(next), ms));
        const now = Date.now();
        boops.count = now - boops.at < 1600 ? boops.count + 1 : 1;
        boops.at = now;
        if (boops.count >= 4) {
            boops.count = 0;
            setReaction('dizzy'); later(1100, null);
        } else {
            setReaction('blink');
            later(120, PAYOFFS[(boops.count - 1) % PAYOFFS.length]);
            later(560, null);
        }
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            squash.getAnimations().forEach(animation => animation.cancel());
            squash.animate(SQUASH, { duration: 420, easing: 'linear' });
        }
    });
})();
