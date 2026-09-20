import './style.css';

const STORAGE_KEY = 'amicale-bio-backoffice-v1';
const projectCatalog = [
  { id: 'tryhard', image: '/assets/teye3.png', title: '/assets/project-title-tryhard.svg', caption: 'dates à venir à <strong>Grenoble</strong><br />et <strong>Saint-Médard en<br />Jalles.</strong>' },
  { id: 'cyber-cafe', image: '/assets/teye4.png', title: '/assets/project-title-cyber.svg', caption: '' },
  { id: 'tiret-du-six', image: '/assets/teye2.png', title: '/assets/project-title-tiret.svg', caption: '' },
];

const seedPeople = {
  samuel_hackwill: {
    slug: 'samuel_hackwill', name: 'Samuel Hackwill', nameAsset: '/assets/title.svg', photo: '/assets/portrait.png',
    bio: `Samuel Hackwill est auteur et artiste associé à l’Amicale de production. Sa recherche est axée sur l’interaction directe avec le public dans le champ de la performance. Ses modes expressifs sont le code, la littérature et le jeu vidéo expérimental.

Après avoir étudié le design numérique aux beaux-arts de Saint-Étienne (son mémoire porte sur les installations interactives monumentales de Norman Bel Geddes aux USA dans les années 1920) et conçu une première performance numérique ([Les forêts peuvent muter](https://www.arte.tv/fr/videos/074719-025-A/samuel-hackwill/), prix révélation design ADAGP 2017) il rencontre Antoine Defoort en 2016 et rejoint l’Amicale à Lille. Il y crée deux performances interactives : [Le tiret du six](http://www.teaser.tiretdusix.art/), un jeu de lecture pour 30 ordinateurs (2021), et Tryhard (créé en 2025, lauréat prix SVSN 2024), un jeu de foule basé sur les CAPTCHAs, que le public résout à l’aide de 56 souris connectées au même écran.

Samuel Hackwill écrit une newsletter soi-disant biannuelle à [cette adresse](https://shh.ovh/). Il a également publié une bande dessinée sur l’action culturelle que vous pouvez [lire ici](https://bdval.shh.ovh/). Il collabore sur les autres projets de l’Amicale en qualité de dramaturge ou de technicien, ainsi qu’avec [le Club travail](https://www.instagram.com/club.travail/), avec [Joaquim Fossi & Suzanne Debaecque](https://www.instagram.com/club.tendre/), et avec [Stéphanie Aflalo](https://www.instagram.com/stephanie.aflalo/).`,
    faq: [['A quoi ressemblent les pièces de Samuel?', 'Des performances qui mêlent code, littérature, jeu vidéo expérimental et interaction directe avec le public.'], ['Est-ce que Samuel a travaillé sur d’autres projets à l’Amicale ou ailleurs?', 'Oui — il collabore aussi avec plusieurs artistes et projets de l’Amicale, comme dramaturge ou technicien.'], ['Avec qui Samuel travaille-t-il?', 'Avec des artistes, des auteur·ices, des technicien·nes et des publics curieux.'], ['Est-ce que Samuel est un nerd?', 'Disons qu’il sait faire dialoguer 56 souris avec un même écran.']],
    production: [['Bob McProd', 'mailto:bob@example.com'], ['Bob McDiff', 'mailto:bob@example.com']], links: [['site personnel', 'https://shh.ovh/'], ['instagram', 'https://www.instagram.com/']], projects: ['tryhard', 'cyber-cafe', 'tiret-du-six'],
  },
  mathilde_maillard: {
    slug: 'mathilde_maillard', name: 'Mathilde Maillard', nameAsset: '/assets/names/mathilde_maillard.svg', photo: '/assets/portrait.png',
    bio: `Mathilde Maillard est artiste associée à l’Amicale de production. Son travail se développe entre production, accompagnement et création.

Cette page est un exemple de profil éditable. Remplacez ce texte depuis le panneau d’édition pour tester les liens, l’*italique* et le **gras**.`,
    faq: [['Quel est le rôle de Mathilde?', 'Cette réponse peut être modifiée depuis le backoffice.'], ['Sur quels projets travaille-t-elle?', 'Une sélection de projets apparaît au bas de la page.']],
    production: [['Camille Bono', 'mailto:contact@example.com']], links: [['site personnel', '#'], ['instagram', '#']], projects: ['cyber-cafe', 'tryhard'],
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const readStorage = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } };
const querySlug = new URLSearchParams(window.location.search).get('person') || 'samuel_hackwill';
const stored = readStorage();
let person = stored[querySlug] || clone(seedPeople[querySlug] || seedPeople.samuel_hackwill);
let editorOpen = false;

function saveStorage() { const all = readStorage(); all[person.slug] = person; localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); }
function escapeHtml(value = '') { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function renderMarkdown(markdown = '') {
  return markdown.split(/\n\s*\n/).map((paragraph) => {
    let html = escapeHtml(paragraph).replace(/\n/g, '<br />');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a class="link body-link" href="$2">$1</a>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return `<p>${html}</p>`;
  }).join('');
}
function link(label, href = '#', extra = '') { return `<a class="link ${extra}" href="${href}" ${href.startsWith('#') ? '' : 'target="_blank" rel="noreferrer"'}>${label}</a>`; }
function projectMarkup() { return person.projects.map((id) => projectCatalog.find((project) => project.id === id)).filter(Boolean).map((project) => `<article class="project"><div class="project-media"><div class="project-mask"><img src="${project.image}" alt="" /></div></div><div class="project-copy"><img class="project-title" src="${project.title}" alt="" />${project.caption ? `<p>${project.caption}</p>` : ''}</div></article>`).join(''); }
function imageMarkup() { return `<img class="name" src="${person.nameAsset}" alt="${escapeHtml(person.name)}" onerror="this.hidden=true;this.nextElementSibling.hidden=false" /><span class="name-fallback" hidden>${escapeHtml(person.name)}</span>`; }

function editorMarkup() {
  return `<div class="editor-head"><div><span class="editor-kicker">Demo backoffice</span><h2>${escapeHtml(person.name)}</h2></div><button class="editor-close" type="button" aria-label="Fermer">×</button></div>
    <label>Nom<input data-field="name" value="${escapeHtml(person.name)}" /></label>
    <label>Photo<input data-field="photoFile" type="file" accept="image/*" /><small>Conservée dans ce navigateur.</small></label>
    <label>Bio <small>Markdown limité : liens, *italique*, **gras**.</small><button class="insert-link" type="button" data-action="insert-link">Ajouter un lien</button><textarea data-field="bio" rows="13">${escapeHtml(person.bio)}</textarea></label>
    <div class="editor-preview"><span>Preview</span><div>${renderMarkdown(person.bio)}</div></div>
    <div class="editor-repeat"><div class="editor-row-title"><strong>FAQ</strong><button type="button" data-add="faq">Ajouter</button></div>${person.faq.map(([question, answer], index) => `<div class="repeat-card"><input data-list="faq" data-index="${index}" data-part="0" value="${escapeHtml(question)}" /><textarea data-list="faq" data-index="${index}" data-part="1" rows="3">${escapeHtml(answer)}</textarea><button type="button" data-remove="faq" data-index="${index}">Supprimer</button></div>`).join('')}</div>
    <div class="editor-repeat"><div class="editor-row-title"><strong>Liens</strong><button type="button" data-add="links">Ajouter</button></div>${person.links.map(([label, href], index) => `<div class="repeat-card two"><input data-list="links" data-index="${index}" data-part="0" value="${escapeHtml(label)}" /><input data-list="links" data-index="${index}" data-part="1" value="${escapeHtml(href)}" /><button type="button" data-remove="links" data-index="${index}">Supprimer</button></div>`).join('')}</div>
    <div class="editor-repeat"><div class="editor-row-title"><strong>Projets du bas de page</strong></div>${projectCatalog.map((project) => `<label class="check-row"><input type="checkbox" data-project="${project.id}" ${person.projects.includes(project.id) ? 'checked' : ''} /> <span>${project.id}</span></label>`).join('')}</div>
    <div class="editor-actions"><button type="button" data-action="save">Enregistrer</button><button type="button" data-action="reset">Réinitialiser ce profil</button></div>`;
}

function pageMarkup() {
  return `<div class="page"><header class="topbar">${link('Projets', '#projects')}${link('Calendrier', '#calendar')}<span>${link('L’Amicale', '#amicale')} <span class="muted">→ ${escapeHtml(person.name)}</span></span>${link('Blog', '#blog')}<span class="theme-button" aria-hidden="true"><img src="/assets/theme.svg" alt="" /></span></header>
    <section class="intro" id="amicale"><div class="identity"><div class="logo-stack"><img class="logo-base" src="/assets/logo-mark.svg" alt="" /><img class="logo-art" src="/assets/logo.png" alt="L’Amicale" /></div>${imageMarkup()}</div><div class="bio">${renderMarkdown(person.bio)}</div></section>
    <aside class="sidebar"><div class="portrait-wrap"><div class="portrait-mask"><img src="${person.photo}" alt="Portrait de ${escapeHtml(person.name)}" /></div></div><section class="side-section faq-section"><div class="section-title"><img src="/assets/faq.svg" alt="" /><span>FAQ :</span></div><div class="faq-list">${person.faq.map(([question, answer]) => `<details><summary>↓ ${escapeHtml(question)}</summary><div class="faq-answer">${renderMarkdown(answer)}</div></details>`).join('')}</div></section><section class="side-section contact"><div class="section-title wide"><img src="/assets/production.svg" alt="" /><span>production / diffusion :</span></div>${person.production.map(([label, href]) => link(`✉ ${escapeHtml(label)}`, href)).join('')}</section><section class="side-section contact links-section"><div class="section-title"><img src="/assets/links.svg" alt="" /><span>liens :</span></div>${person.links.map(([label, href]) => link(`↗ ${escapeHtml(label)}`, href)).join('')}</section></aside>
    <section class="projects" id="projects">${projectMarkup()}</section>
    <footer class="footer" id="footer"><div class="footer-newsletter"><div class="socials"><span>◎</span><span>●</span><span>▣</span></div><p>Au fait on a une newsletter semestrielle à laquelle vous pouvez vous inscrire ici (+5000 abonné·e·s) ↘</p><div class="fake-field">Adresse mail</div><div class="fake-input">jeanbob@gmail.com</div><div class="fake-field">Région / Pays</div><div class="fake-input">Hauts-de-France <span>⌄</span></div><div class="submit-button">Allez c’est parti</div></div><div class="footer-column"><strong>Navigation</strong>${['Accueil', 'L’Amicale', 'Calendrier', 'Blog'].map((label) => link(label)).join('')}<br /><strong>Associés</strong>${['Julien Fournet', 'Joaquim Fossi', 'Samuel Hackwill', 'Antoine Defoort', 'Louise Siffert', 'Sebastien Vial', 'Sofia Teillet'].map((label) => link(label)).join('')}</div><div class="footer-column"><strong>Projets</strong>${projectCatalog.map((project) => link(project.id)).join('')}</div><div class="footer-column"><strong>Les thermes</strong>${['On va bâtir une île [...]', 'Big Data Yoyo', 'Le jeu de l’oie [...]', 'Corps diplomatique', 'Germinal', 'Collectif Jambe', 'Bonjour Concert', 'Cheval'].map((label) => link(label)).join('')}</div><div class="footer-address"><div class="footer-address-text">L’Amicale<br />34 Rue Louis Bergot<br />59000 Lille</div><div class="footer-logo"><img class="footer-logo-bg" src="/assets/footer-logo.svg" alt="" /><img class="footer-logo-art" src="/assets/footer-logo.png" alt="L’Amicale" /></div></div><div class="footer-credits">admin ↗ ✉ Basile Lemasson　 co-direction ↗ ✉ Sebastien Vial &amp; Samuel Hackwill</div></footer>
    <button class="editor-tab" type="button" aria-expanded="${editorOpen}">Editer ce profil</button><aside class="editor-panel ${editorOpen ? 'is-open' : ''}" aria-hidden="${!editorOpen}">${editorMarkup()}</aside></div>`;
}

function render() { document.querySelector('#app').innerHTML = pageMarkup(); bindEvents(); }
function bindEvents() {
  document.querySelector('.editor-tab').addEventListener('click', () => { editorOpen = true; render(); });
  document.querySelector('.editor-close').addEventListener('click', () => { editorOpen = false; render(); });
  document.querySelectorAll('.link').forEach((anchor) => anchor.addEventListener('click', (event) => event.preventDefault()));
  const bioField = document.querySelector('[data-field="bio"]');
  bioField?.addEventListener('input', () => { document.querySelector('.editor-preview div').innerHTML = renderMarkdown(bioField.value); });
  document.querySelector('[data-action="insert-link"]')?.addEventListener('click', () => {
    const snippet = '[texte du lien](https://exemple.com)';
    const start = bioField.selectionStart ?? bioField.value.length;
    const end = bioField.selectionEnd ?? start;
    bioField.value = `${bioField.value.slice(0, start)}${snippet}${bioField.value.slice(end)}`;
    bioField.focus();
    bioField.setSelectionRange(start + 1, start + 14);
    bioField.dispatchEvent(new Event('input', { bubbles: true }));
  });
  document.querySelector('[data-field="photoFile"]')?.addEventListener('change', (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { person.photo = reader.result; }; reader.readAsDataURL(file); });
  document.querySelectorAll('[data-list]').forEach((field) => field.addEventListener('input', () => { person[field.dataset.list][Number(field.dataset.index)][Number(field.dataset.part)] = field.value; }));
  document.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => { person[button.dataset.add].push(button.dataset.add === 'faq' ? ['Question', 'Réponse'] : ['Nouveau lien', '#']); editorOpen = true; render(); }));
  document.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { person[button.dataset.remove].splice(Number(button.dataset.index), 1); editorOpen = true; render(); }));
  document.querySelectorAll('[data-project]').forEach((checkbox) => checkbox.addEventListener('change', () => { const id = checkbox.dataset.project; person.projects = checkbox.checked ? [...new Set([...person.projects, id])] : person.projects.filter((projectId) => projectId !== id); editorOpen = true; render(); }));
  document.querySelector('[data-action="save"]')?.addEventListener('click', () => { person.name = document.querySelector('[data-field="name"]').value.trim() || person.name; person.bio = bioField.value; saveStorage(); editorOpen = false; render(); });
  document.querySelector('[data-action="reset"]')?.addEventListener('click', () => { person = clone(seedPeople[person.slug] || seedPeople.samuel_hackwill); saveStorage(); editorOpen = true; render(); });
}

render();
