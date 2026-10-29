// Local brand assets shared by the home panel and standalone projects page.
const projectStackIcons = {
    'Python': ['python.svg'],
    'FastAPI': ['fastapi.svg'],
    'SQLite': ['sqlite.svg'],
    'Qwen': ['qwen.svg'],
    'Tinker API': ['tinker.png'],
    'pandas': ['pandas.svg'],
    'Java': ['java.svg'],
    'Spring Boot': ['springboot.svg'],
    'React': ['react.svg'],
    'React Native': ['react.svg'],
    'TypeScript': ['typescript.svg'],
    'JavaScript': ['javascript.svg'],
    'Vite': ['vite.svg'],
    'Tailwind CSS': ['tailwindcss.svg'],
    'PostgreSQL': ['postgresql.svg'],
    'Redis': ['redis.svg'],
    'LiveKit': ['livekit.png'],
    'Next.js': ['nextdotjs.svg'],
    'Expo': ['expo.svg'],
    'SQLAlchemy': ['sqlalchemy.svg'],
    'TanStack Query': ['reactquery.svg'],
    'Semantic Scholar API': ['semanticscholar.svg'],
    'Lua': ['lua.svg'],
    'Hammerspoon': ['hammerspoon.png'],
    'OpenRouter': ['openrouter.svg'],
    'AnkiConnect': ['anki.svg'],
    'HTML / CSS': ['html5.svg', 'css.svg'],
    'Chrome Extensions': ['googlechrome.svg'],
    'Gemini': ['googlegemini.svg']
};

// Protocols and tools without an available brand asset use a descriptive symbol.
const projectStackSymbols = {
    'WebSocket / STOMP': 'fa-plug',
    'Canvas': 'fa-paintbrush',
    'Web App': 'fa-globe'
};

function addProjectStackIcons(root = document) {
    root.querySelectorAll('.project-tag').forEach(tag => {
        if (tag.querySelector('.project-stack-icon')) return;
        const label = tag.textContent.trim();
        const logos = projectStackIcons[label];
        if (logos) {
            logos.slice().reverse().forEach(file => {
                const icon = document.createElement('img');
                icon.className = 'project-stack-icon';
                icon.src = `assets/icons/${file}`;
                icon.alt = '';
                icon.width = 14;
                icon.height = 14;
                tag.prepend(icon);
            });
        } else if (projectStackSymbols[label]) {
            const icon = document.createElement('i');
            icon.className = `project-stack-icon fas ${projectStackSymbols[label]}`;
            icon.setAttribute('aria-hidden', 'true');
            tag.prepend(icon);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => addProjectStackIcons());
