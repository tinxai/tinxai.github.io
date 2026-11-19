"""Render both project views from data/projects.json: python3 scripts/render_projects.py."""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GROUPS = [
    ('software', 'Software projects', 'Larger projects, from the interface to the backend.'),
    ('tools', 'Small tools & experiments', 'Focused utilities and ideas I wanted to try.'),
]
LABELS = {'github': 'Code', 'website': 'Website', 'paper': 'Paper', 'demo': 'Demo'}


def entry(project, level):
    compact = project['group'] == 'tools'
    classes = 'project-entry project-entry--compact' if compact else 'project-entry'
    parts = [f'<article class="{classes}" data-project="{escape(project["slug"])}">']
    teaser = project.get('teaser')
    if teaser:
        parts.extend([
            '<figure class="project-teaser">',
            f'<a href="{escape(teaser["src"])}" target="_blank" rel="noopener" aria-label="View {escape(project["title"])} teaser at full size">',
            f'<img src="{escape(teaser["src"])}" alt="{escape(teaser["alt"])}" width="{teaser["width"]}" height="{teaser["height"]}" loading="lazy">',
            '</a>',
            f'<figcaption>{escape(teaser["caption"])} <span aria-hidden="true">↗</span></figcaption>',
            '</figure>',
        ])
    parts.extend([
        '<div class="project-entry-body"><div class="project-entry-heading">',
        f'<h{level}>{escape(project["title"])}</h{level}>',
    ])
    if project.get('note'):
        parts.append(f'<p class="project-entry-note">{escape(project["note"])}</p>')
    parts.append(f'</div><p class="project-entry-description">{escape(project["description"])}</p>')
    if project.get('detail'):
        parts.append(f'<p class="project-entry-detail">{escape(project["detail"])}</p>')
    if project.get('techStack'):
        parts.append('<div class="project-stack" aria-label="Technology stack">')
        parts.extend(f'<span class="project-tag">{escape(tech)}</span>' for tech in project['techStack'])
        parts.append('</div>')
    if project.get('links'):
        parts.append('<div class="project-entry-links">')
        for kind, url in project['links'].items():
            parts.append(f'<a href="{escape(url)}" target="_blank" rel="noopener">{escape(LABELS.get(kind, kind))}<span class="project-link-arrow" aria-hidden="true">↗</span></a>')
        parts.append('</div>')
    parts.append('</div></article>')
    return '\n'.join(parts)


def render(projects, level):
    parts = ['<!-- Generated from data/projects.json by scripts/render_projects.py -->']
    for group, title, subtitle in GROUPS:
        parts.extend([
            f'<section class="project-group project-group--{group}">',
            f'<header class="project-group-heading"><h{level}>{escape(title)}</h{level}><p>{escape(subtitle)}</p></header>',
            '<div class="project-group-entries">',
        ])
        parts.extend(entry(project, level + 1) for project in projects if project['group'] == group)
        parts.append('</div></section>')
    return '\n'.join(parts)


if __name__ == '__main__':
    projects = json.loads((ROOT / 'data/projects.json').read_text())
    for filename, level in [('index.html', 3), ('projects.html', 2)]:
        path = ROOT / filename
        source = path.read_text()
        pattern = r'<!-- PROJECTS:START -->.*?<!-- PROJECTS:END -->'
        replacement = '<!-- PROJECTS:START -->\n' + render(projects, level) + '\n<!-- PROJECTS:END -->'
        result, count = re.subn(pattern, lambda match: replacement, source, flags=re.S)
        if count != 1:
            raise ValueError(f'Expected exactly one project region in {filename}')
        path.write_text(result)
