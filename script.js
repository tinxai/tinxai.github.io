// Toggle research details expand/collapse
function toggleResearch() {
    const details = document.getElementById('researchDetails');
    const hint = document.getElementById('toggleHint');
    details.classList.toggle('expanded');
    hint.textContent = details.classList.contains('expanded') ? '[click to collapse]' : '[click to expand]';
}

// Publication filter
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.pub-card');
    const links = document.querySelectorAll('.pub-filter-link');
    const countFav = document.getElementById('count-favorites');
    const countPatents = document.getElementById('count-patents');
    const countAll = document.getElementById('count-all');

    if (!links.length) return;

    // Each card belongs to exactly one tab: patents, favorites, or others.
    const categoryOf = card =>
        card.dataset.patent === 'true' ? 'patents'
        : card.dataset.featured === 'true' ? 'favorites'
        : 'others';
    const countOf = cat => [...cards].filter(c => categoryOf(c) === cat).length;
    if (countFav) countFav.textContent = countOf('favorites');
    if (countPatents) countPatents.textContent = countOf('patents');
    if (countAll) countAll.textContent = countOf('others');

    function applyFilter(filter) {
        cards.forEach(card => {
            card.style.display = categoryOf(card) === filter ? '' : 'none';
        });
        links.forEach(l => l.classList.toggle('active', l.dataset.filter === filter));
    }

    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            applyFilter(link.dataset.filter);
        });
    });

    applyFilter('favorites');
});

// Main-panel page switcher (Home / Education / Work Experience / Honors & Awards / Skills / Projects / Resources)
document.addEventListener('DOMContentLoaded', () => {
    const mainColumn = document.querySelector('.main-column');
    const quickBtns = document.querySelectorAll('.resume-quick-btn[data-panel]');
    if (!mainColumn || !quickBtns.length) return;

    const views = mainColumn.querySelectorAll(':scope > .page-view');

    function showPage(name) {
        views.forEach(v => v.classList.toggle('is-active', v.dataset.page === name));
        quickBtns.forEach(b => b.classList.toggle('is-active', b.dataset.panel === name));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => showPage(btn.dataset.panel));
    });

    const initialPanel = new URLSearchParams(window.location.search).get('panel');
    if ([...views].some(view => view.dataset.page === initialPanel)) showPage(initialPanel);
});

// Publication media sliders (e.g. HoT teaser images)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pub-media-slider').forEach(media => {
        const slides = Array.from(media.querySelectorAll('.pub-media-slide'));
        const prevBtn = media.querySelector('.pub-media-nav--prev');
        const nextBtn = media.querySelector('.pub-media-nav--next');
        const dotsWrap = media.querySelector('.pub-media-dots');
        if (slides.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }

        let index = slides.findIndex(s => s.classList.contains('is-active'));
        if (index < 0) index = 0;

        const dots = slides.map((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'pub-media-dot';
            dot.setAttribute('aria-label', `Go to image ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(dot);
            return dot;
        });

        function update() {
            slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
            dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
        }

        function goTo(i) {
            index = (i + slides.length) % slides.length;
            update();
        }

        prevBtn.addEventListener('click', () => goTo(index - 1));
        nextBtn.addEventListener('click', () => goTo(index + 1));

        update();
    });
});

// Scroll-reveal for elements with class "fade-in"
document.addEventListener('DOMContentLoaded', () => {
    const faders = document.querySelectorAll('.fade-in');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        faders.forEach(el => observer.observe(el));
    } else {
        // Fallback: show everything immediately
        faders.forEach(el => el.classList.add('visible'));
    }
});
