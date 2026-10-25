// Dynamic background about grounding answers in evidence: in the side margins, a question gets an
// answer whose claims are then traced to highlighted evidence in a source: a bird photo, code from
// a coding agent, a CSV file, and a PDF.
(function () {
    // Deliberately not gated on prefers-reduced-motion: this background is meant to move, it is
    // slow and sits in the margins. Add ?still to the URL to freeze it.
    const reduceMotion = /[?&]still\b/.test(location.search);
    const CONTENT_W = 1100;
    const CYCLE = 11; // seconds per question -> answer -> evidence
    const rnd = (a, b) => a + Math.random() * (b - a);
    const clamp = v => Math.max(0, Math.min(1, v));
    const ease = (a, b, p) => { const x = clamp((p - a) / (b - a)); return x * x * (3 - 2 * x); };

    const cv = document.createElement('canvas');
    cv.className = 'bg-canvas';
    cv.setAttribute('aria-hidden', 'true');
    document.body.prepend(cv);
    const ctx = cv.getContext('2d');

    let W = 0, H = 0, cards = [];

    function rr(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    const rgba = (c, a) => 'rgba(' + c + ',' + a + ')';

    function bar(x, y, w, h, color) { rr(x, y, Math.max(0, w), h, h / 2); ctx.fillStyle = color; ctx.fill(); }

    // blue-ish rounded highlight with a dark outline, like the annotations in my papers
    function evidenceBox(x, y, w, h, col, a) {
        ctx.globalAlpha *= a;
        rr(x, y, w, h, 6);
        ctx.fillStyle = rgba(col, 0.16); ctx.fill();
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(25,25,35,0.6)'; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgb(' + col + ')'; ctx.stroke();
        ctx.globalAlpha /= a || 1;
    }

    function badge(x, y, n, col, a) {
        if (a <= 0) return;
        const s = 0.6 + 0.4 * a, r = 8 * s;
        ctx.globalAlpha *= a;
        ctx.fillStyle = 'rgb(' + col + ')';
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 ' + Math.round(10 * s) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n, x, y + 0.5);
        ctx.globalAlpha /= a;
    }

    // dashed curve from a claim to its evidence, drawn progressively with an arrow head at the end
    function link(x0, y0, x1, y1, col, prog) {
        if (prog <= 0) return;
        const cx = x0 - 34, cy = (y0 + y1) / 2;
        const pt = t => [
            (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1,
            (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1,
        ];
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgb(' + col + ')'; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(x0, y0);
        for (let t = 0.04; t <= prog + 1e-6; t += 0.04) { const p = pt(Math.min(t, prog)); ctx.lineTo(p[0], p[1]); }
        ctx.stroke(); ctx.setLineDash([]);
        if (prog > 0.97) {
            const e = pt(1), b = pt(0.92), ang = Math.atan2(e[1] - b[1], e[0] - b[0]);
            ctx.fillStyle = 'rgb(' + col + ')';
            ctx.beginPath(); ctx.moveTo(e[0], e[1]);
            ctx.lineTo(e[0] - 8 * Math.cos(ang - 0.5), e[1] - 8 * Math.sin(ang - 0.5));
            ctx.lineTo(e[0] - 8 * Math.cos(ang + 0.5), e[1] - 8 * Math.sin(ang + 0.5));
            ctx.closePath(); ctx.fill();
        }
    }

    // ---- the four kinds of source ---------------------------------------------------------
    // Each draws its content inside the source card (x, y, w, h) and returns two evidence regions
    // [x, y, w, h] that the answer's two claims point to.

    const SOURCES = {
        text(x, y, w, h, c, k) {
            const rows = 6, rh = (h - 20) / rows;
            const widths = k.widths;
            for (let i = 0; i < rows; i++) bar(x + 10, y + 12 + i * rh, (w - 20) * widths[i], 4, rgba(c.pale, 0.9));
            const r1 = [x + 8 + (w - 20) * 0.1, y + 8 + k.r1 * rh, (w - 20) * 0.5, 13];
            const r2 = [x + 8 + (w - 20) * 0.3, y + 8 + k.r2 * rh, (w - 20) * 0.45, 13];
            return [r1, r2];
        },
        image(x, y, w, h, c) {
            const g = ctx.createLinearGradient(x, y, x, y + h);
            g.addColorStop(0, rgba(c.pale, 0.55)); g.addColorStop(1, rgba(c.pale, 0.2));
            rr(x + 6, y + 6, w - 12, h - 12, 6); ctx.fillStyle = g; ctx.fill();
            const bx = x + w * 0.46, by = y + h * 0.56;
            ctx.fillStyle = rgba(c.accent, 0.55);                       // body
            ctx.beginPath(); ctx.ellipse(bx, by, w * 0.2, h * 0.17, -0.3, 0, 6.283); ctx.fill();
            ctx.fillStyle = rgba(c.dot, 0.6);                           // head
            ctx.beginPath(); ctx.arc(bx + w * 0.17, by - h * 0.16, h * 0.09, 0, 6.283); ctx.fill();
            ctx.fillStyle = 'rgba(232,160,40,0.8)';                     // beak
            ctx.beginPath(); ctx.moveTo(bx + w * 0.17 + h * 0.08, by - h * 0.18);
            ctx.lineTo(bx + w * 0.17 + h * 0.18, by - h * 0.15); ctx.lineTo(bx + w * 0.17 + h * 0.08, by - h * 0.12); ctx.fill();
            ctx.strokeStyle = rgba(c.pale, 1); ctx.lineWidth = 3;      // branch
            ctx.beginPath(); ctx.moveTo(x + 6, y + h * 0.82); ctx.lineTo(x + w - 6, y + h * 0.76); ctx.stroke();
            const head = [bx + w * 0.17 - h * 0.12, by - h * 0.28, h * 0.3, h * 0.24];
            const wing = [bx - w * 0.2, by - h * 0.12, w * 0.3, h * 0.24];
            return [head, wing];
        },
        page(x, y, w, h, c) {
            const cols = 3, rows = 2, gw = (w - 24) / cols, gh = (h - 40) / rows;
            for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
                rr(x + 8 + i * (gw + 4), y + 8 + j * (gh + 4), gw, gh, 4);
                ctx.fillStyle = rgba(c.pale, (i + j) % 2 ? 0.45 : 0.28); ctx.fill();
            }
            bar(x + 10, y + h - 20, w * 0.55, 5, rgba(c.pale, 0.9));
            ctx.fillStyle = 'rgb(' + c.accent + ')';                    // pin
            ctx.beginPath(); ctx.arc(x + 8 + gw * 0.5, y + 8 + gh * 0.45, 4, 0, 6.283); ctx.fill();
            const lot = [x + 8 + (gw + 4) * 2 + 3, y + 8 + gh + 4 + 4, gw - 6, gh - 8];
            const row = [x + 6, y + h - 25, w * 0.55 + 8, 15];
            return [lot, row];
        },
        csv(x, y, w, h, c, k) {
            const cols = 3, rows = 5, cw = (w - 20) / cols, rh = (h - 22) / rows;
            for (let j = 0; j < rows; j++) {
                if (j === 0) { rr(x + 10, y + 10, w - 20, rh, 3); ctx.fillStyle = rgba(c.pale, 0.6); ctx.fill(); }
                for (let i = 0; i < cols; i++) {
                    bar(x + 10 + i * cw + 6, y + 10 + j * rh + rh / 2 - 2, cw * (0.35 + 0.3 * ((i + j * 2 + k.r1) % 3) / 2), 4, rgba(c.pale, j === 0 ? 1 : 0.85));
                }
                ctx.strokeStyle = rgba(c.pale, 0.7); ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(x + 10, y + 10 + (j + 1) * rh); ctx.lineTo(x + w - 10, y + 10 + (j + 1) * rh); ctx.stroke();
            }
            for (let i = 1; i < cols; i++) { ctx.beginPath(); ctx.moveTo(x + 10 + i * cw, y + 10); ctx.lineTo(x + 10 + i * cw, y + 10 + rows * rh); ctx.stroke(); }
            return [
                [x + 10 + cw + 2, y + 10 + 2 * rh + 1, cw - 4, rh - 2],            // one cell
                [x + 12, y + 10 + 4 * rh + 1, w - 24, rh - 2],                      // a whole row
            ];
        },
        pdf(x, y, w, h, c, k) {
            ctx.fillStyle = 'rgb(' + c.dot + ')';                       // PDF tag
            rr(x + 8, y + 7, 26, 11, 3); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; bar(x + 13, y + 11.5, 16, 2.5, 'rgba(255,255,255,0.95)');
            ctx.fillStyle = rgba(c.pale, 0.9);                          // dog-ear
            ctx.beginPath(); ctx.moveTo(x + w - 20, y); ctx.lineTo(x + w, y + 20); ctx.lineTo(x + w - 20, y + 20); ctx.closePath(); ctx.fill();
            bar(x + 42, y + 11, w * 0.35, 5, rgba(c.pale, 1));          // title
            const colW = (w - 30) / 2;
            for (let col = 0; col < 2; col++) for (let i = 0; i < 6; i++) {
                bar(x + 10 + col * (colW + 10), y + 26 + i * 9, colW * (i % 4 === 3 ? 0.6 : 0.95), 3.5, rgba(c.pale, 0.9));
            }
            bar(x + w - 44, y + h - 11, 34, 4, rgba(c.pale, 0.9));      // page number
            return [
                [x + 8, y + 24 + (1 + k.r1 % 2) * 9, colW * 0.9, 12],        // a sentence in the text
                [x + 10 + colW + 10 - 2, y + 24 + 3 * 9, colW + 2, 30],      // a table / figure block
            ];
        },
        code(x, y, w, h, c, k) {
            [0, 1, 2].forEach(i => { ctx.fillStyle = rgba(c.pale, 1); ctx.beginPath(); ctx.arc(x + 12 + i * 9, y + 9, 2.5, 0, 6.283); ctx.fill(); });
            y += 8; h -= 8;
            const rows = 7, rh = (h - 20) / rows;
            for (let i = 0; i < rows; i++) {
                const ind = k.indent[i] * 12;
                bar(x + 10 + ind, y + 12 + i * rh, (w - 30 - ind) * k.widths[i], 4, rgba(c.pale, 0.95));
            }
            return [
                [x + 8 + k.indent[k.r1] * 12, y + 8 + k.r1 * rh, (w - 30) * 0.7, 13],
                [x + 8 + k.indent[k.r2] * 12, y + 8 + k.r2 * rh, (w - 30) * 0.6, 13],
            ];
        },
    };

    // ---- one question -> answer -> evidence card ----------------------------------------
    function randomize(card) {
        card.k = {
            widths: Array.from({ length: 7 }, () => rnd(0.55, 0.95)),
            indent: Array.from({ length: 7 }, () => Math.floor(rnd(0, 3))),
            r1: Math.floor(rnd(1, 3)), r2: Math.floor(rnd(4, 6)),
        };
    }

    function drawCard(card, c, p) {
        const { x, y, w } = card;
        const fade = Math.min(ease(0, 0.06, p), 1 - ease(0.93, 1, p));
        if (fade <= 0) return;
        ctx.globalAlpha = fade * 0.95;

        // question (right) and answer (left)
        const qw = w * 0.6;
        rr(x + w - qw, y, qw, 20, 9); ctx.fillStyle = rgba(c.pale, 0.55); ctx.fill();
        bar(x + w - qw + 9, y + 8, qw * 0.7 * ease(0.02, 0.1, p), 4, rgba('255,255,255', 0.95));

        const aw = w * 0.9, ay = y + 28, ah = 50;
        rr(x, ay, aw, ah, 9);
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(c.pale, 1); ctx.stroke();
        const grow = ease(0.1, 0.38, p);
        bar(x + 10, ay + 12, (aw - 20) * 0.9 * clamp(grow * 3), 4, rgba(c.pale, 0.95));
        bar(x + 10, ay + 24, (aw - 20) * 0.6 * clamp(grow * 3 - 1), 4, rgba(c.pale, 0.95));
        bar(x + 10, ay + 36, (aw - 20) * 0.75 * clamp(grow * 3 - 2), 4, rgba(c.pale, 0.95));
        // two claims in the answer that need grounding
        const claims = [[x + aw * 0.55, ay + 21, c.dot], [x + aw * 0.3, ay + 45, c.accent]];
        const chipA = ease(0.34, 0.42, p);
        claims.forEach(cl => {
            if (chipA <= 0) return;
            ctx.globalAlpha = fade * chipA;
            rr(cl[0] - 16, cl[1] - 5, 32, 10, 5); ctx.fillStyle = rgba(cl[2], 0.35); ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgb(' + cl[2] + ')'; ctx.stroke();
        });
        ctx.globalAlpha = fade * 0.95;

        // the source
        const sy = y + 104, sh = 100, sa = ease(0.36, 0.5, p);
        ctx.globalAlpha = fade * sa;
        rr(x, sy, w, sh, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(c.pale, 1); ctx.stroke();
        const regions = SOURCES[c.source](x, sy, w, sh, c, card.k);

        // trace each claim to its evidence
        const times = [[0.52, 0.66], [0.68, 0.82]];
        claims.forEach((cl, i) => {
            const prog = ease(times[i][0], times[i][1], p);
            ctx.globalAlpha = fade;
            const [rx, ry, rw] = regions[i];
            link(cl[0], cl[1] + 6, rx + rw, ry + 6, cl[2], prog);
            const hl = ease(times[i][1] - 0.04, times[i][1] + 0.04, p);
            if (hl > 0) {
                ctx.globalAlpha = fade * hl;
                evidenceBox(rx, ry, regions[i][2], regions[i][3], cl[2], 1);
                badge(rx + rw + 2, ry - 1, i + 1, cl[2], hl);
            }
        });
        ctx.globalAlpha = 1;
    }

    // ---- four different sources, each with its own colors -----------------------------------
    const PALETTES = {
        image: { source: 'image', dot: '16,146,152', pale: '160,208,208', accent: '188,42,140' },   // bird photo
        code:  { source: 'code',  dot: '110,70,220', pale: '190,180,230', accent: '11,127,230' },   // coding agent
        csv:   { source: 'csv',   dot: '34,150,90',  pale: '170,214,186', accent: '232,114,14' },   // spreadsheet
        pdf:   { source: 'pdf',   dot: '200,60,60',  pale: '238,190,190', accent: '11,95,216' },    // paper
    };
    // two cards per side; which side gets which flips at random on each visit
    const SIDES = Math.random() < 0.5 ? [['image', 'code'], ['csv', 'pdf']] : [['csv', 'pdf'], ['image', 'code']];

    // ---- layout + loop ------------------------------------------------------------------
    function layout() {
        const dpr = window.devicePixelRatio || 1;
        W = window.innerWidth; H = window.innerHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const m = (W - Math.min(CONTENT_W, W)) / 2, pad = 18;
        cards = [];
        if (m < 130) return;
        const zw = m - 2 * pad, cw = Math.min(zw, 250);
        [pad + (zw - cw) / 2, W - m + pad + (zw - cw) / 2].forEach((x, zi) => {
            SIDES[zi].forEach((src, i) => {
                const card = { x, y: (i + 0.5) * (H / 2) - 105, w: cw, c: PALETTES[src], off: (i * 0.5 + zi * 0.25) * CYCLE, cycle: -1 };
                randomize(card);
                cards.push(card);
            });
        });
    }

    function frame(ms) {
        ctx.clearRect(0, 0, W, H);
        const t = ms / 1000;
        cards.forEach(card => {
            const k = (t + card.off) / CYCLE, cyc = Math.floor(k);
            if (cyc !== card.cycle) { card.cycle = cyc; randomize(card); }
            drawCard(card, card.c, reduceMotion ? 0.86 : k - cyc);
        });
        if (!reduceMotion) requestAnimationFrame(frame);
    }

    layout();
    requestAnimationFrame(frame);
    let rz;
    window.addEventListener('resize', () => {
        clearTimeout(rz);
        rz = setTimeout(() => { layout(); if (reduceMotion) requestAnimationFrame(frame); }, 150);
    });
})();
