function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stackList(items = []) {
  const list = element('ul');
  items.forEach(item => list.append(element('li', '', item)));
  return list;
}

function externalLink(url, label, className = '') {
  const link = element('a', className, label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer noopener';
  return link;
}

function projectCard(project) {
  const article = project.url ? element('a', 'project-card') : element('article');
  if (project.url) {
    article.href = project.url;
    article.target = '_blank';
    article.rel = 'noreferrer noopener';
    article.setAttribute('aria-label', `Open ${project.title} on GitHub`);
  }
  const heading = element('div');
  const title = element('div');
  title.append(element('small', '', project.eyebrow), element('h3', '', project.title));
  heading.append(title);
  if (project.url) heading.append(element('span', 'project-card__arrow', '↗'));
  article.append(heading, element('p', '', project.description), stackList(project.stack));
  return article;
}

function featuredProject(project) {
  const article = project.url ? element('a', 'feature-project project-card') : element('article', 'feature-project');
  if (project.url) {
    article.href = project.url;
    article.target = '_blank';
    article.rel = 'noreferrer noopener';
    article.setAttribute('aria-label', `Open ${project.title} on GitHub`);
  }
  const heading = element('div', 'feature-project__top');
  heading.append(element('small', '', project.eyebrow), element('span', '', project.meta || ''));
  if (project.url) heading.append(element('span', 'project-card__arrow', '↗'));
  article.append(heading, element('h3', '', project.title), element('p', '', project.description));

  const signal = element('div', 'signal-strip');
  signal.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 7; index += 1) signal.append(element('i'));
  article.append(signal);
  return article;
}

function factRow({ label, value, detail, url }) {
  const row = element('div');
  const definition = element('dd');
  definition.append(document.createTextNode(value), element('br'));
  if (url) {
    definition.append(externalLink(url, detail));
  } else {
    definition.append(element('span', '', detail));
  }
  row.append(element('dt', '', label), definition);
  return row;
}

export class PortfolioContent {
  constructor(content) {
    this.content = content;
  }

  render() {
    this.renderProjectList('surfaceProjects', this.content.projects.surface);
    this.renderFeatured('signalProjects', this.content.projects.signal);
    this.renderProjectList('coreProjects', this.content.projects.core);
    this.renderProfile();
    this.renderSocials();
    this.renderResume();
  }

  renderProjectList(targetId, projects = []) {
    const target = document.getElementById(targetId);
    projects.forEach(project => target.append(projectCard(project)));
  }

  renderFeatured(targetId, projects = []) {
    const target = document.getElementById(targetId);
    projects.forEach(project => target.append(project.featured ? featuredProject(project) : projectCard(project)));
  }

  renderProfile() {
    const target = document.getElementById('profileFacts');
    this.content.experience.forEach(item => target.append(factRow({
      label: 'Experience',
      value: item.role,
      detail: `${item.organization} · ${item.period}${item.detail ? ` · ${item.detail}` : ''}`,
    })));
    this.content.profileFacts.forEach(fact => target.append(factRow(fact)));
  }

  renderSocials() {
    const target = document.getElementById('socialLinks');
    this.content.socials.forEach(item => {
      target.append(externalLink(item.url, `${item.label} ↗`));
    });
  }

  renderResume() {
    const target = document.getElementById('cvContent');
    if (!target || !this.content.cv) return;

    const cv = this.content.cv;
    const sheet = element('div', 'cv-sheet');
    const header = element('header', 'cv-sheet__header');
    const identity = element('div');
    identity.append(element('small', '', 'CV · Selected snapshot'), element('h2', '', cv.name), element('p', 'cv-sheet__role', `${cv.role} · ${cv.location}`));
    const close = element('button', 'cv-dialog__close', 'Close');
    close.type = 'button';
    close.setAttribute('data-cv-close', '');
    header.append(identity, close);
    sheet.append(header, element('p', 'cv-sheet__summary', cv.summary));

    const highlights = element('dl', 'cv-highlights');
    cv.highlights.forEach(item => {
      const row = element('div');
      row.append(element('dt', '', item.label), element('dd', '', item.value));
      highlights.append(row);
    });
    sheet.append(highlights);

    const columns = element('div', 'cv-sheet__columns');
    cv.sections.forEach(section => {
      const block = element('section', 'cv-section');
      block.append(element('h3', '', section.title));
      const list = element('ul');
      section.items.forEach(item => list.append(element('li', '', item)));
      block.append(list);
      columns.append(block);
    });
    sheet.append(columns);

    const actions = element('div', 'cv-sheet__actions');
    const print = element('button', 'action action--primary', 'Print / save PDF ↗');
    print.type = 'button';
    print.setAttribute('data-cv-print', '');
    const download = element('a', 'action action--quiet', 'Download CV ↓');
    download.href = cv.pdf;
    download.download = 'muhammad-mukarram-raza-cv.pdf';
    actions.append(print, download, externalLink(cv.github, 'GitHub ↗', 'action action--quiet'), externalLink(cv.linkedin, 'LinkedIn ↗', 'action action--quiet'));
    sheet.append(actions);
    target.append(sheet);

    const dialog = document.getElementById('cvDialog');
    const trigger = document.getElementById('cvTrigger');
    if (!dialog || !trigger) return;
    const closeDialog = () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    };
    trigger.addEventListener('click', () => {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
    close.addEventListener('click', closeDialog);
    print.addEventListener('click', () => window.print());
    dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener('close', () => trigger.focus());
  }
}
