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

function motionReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function presentDialog(dialog) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  if (motionReduced() || typeof dialog.animate !== 'function') return;
  dialog.animate(
    [
      { opacity: 0, transform: 'translateY(18px) scale(.985)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    { duration: 360, easing: 'cubic-bezier(.22,.8,.2,1)', fill: 'both' },
  );
}

function dismissDialog(dialog) {
  if (!dialog.open && !dialog.hasAttribute('open')) return;
  const finish = () => {
    dialog.removeAttribute('data-dialog-closing');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };
  if (motionReduced() || typeof dialog.animate !== 'function') {
    finish();
    return;
  }
  if (dialog.dataset.dialogClosing === 'true') return;
  dialog.dataset.dialogClosing = 'true';
  dialog.animate(
    [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(12px) scale(.985)' },
    ],
    { duration: 240, easing: 'ease-in', fill: 'both' },
  ).finished.then(finish, finish);
}

function projectCard(project, index = 0) {
  const article = element('article', 'project-card');
  article.dataset.project = project.id || '';
  article.dataset.projectIndex = String(index + 1).padStart(2, '0');
  article.dataset.domain = project.domain || '';
  const meta = element('div', 'project-card__meta');
  meta.append(
    element('span', 'project-card__index', String(index + 1).padStart(2, '0')),
    element('span', 'project-card__kind', project.domain || project.caseStudy?.label || 'Selected build'),
  );
  const heading = element('div');
  const title = element('div');
  const titleLink = project.url ? externalLink(project.url, project.title, 'project-card__title') : element('h3', '', project.title);
  if (project.url) titleLink.setAttribute('aria-label', `Open ${project.title} on GitHub`);
  const titleHeading = project.url ? element('h3') : titleLink;
  if (project.url) titleHeading.append(titleLink);
  title.append(element('small', '', project.eyebrow), titleHeading);
  heading.append(title);
  if (project.url) heading.append(element('span', 'project-card__arrow', '↗'));
  const actions = element('div', 'project-card__actions');
  if (project.caseStudy) {
    const details = element('button', 'project-card__details', 'View case study ↗');
    details.type = 'button';
    details.dataset.caseStudy = project.id;
    details.setAttribute('aria-label', `View ${project.title} case study`);
    details.setAttribute('aria-haspopup', 'dialog');
    details.setAttribute('aria-controls', 'caseStudyDialog');
    actions.append(details);
  }
  if (project.url) actions.append(externalLink(project.url, 'GitHub ↗', 'project-card__github'));
  const stack = stackList(project.stack);
  stack.className = 'project-card__stack';
  article.append(meta, heading, element('p', '', project.description), stack, actions);
  return article;
}

function featuredProject(project, index = 0) {
  const article = element('article', 'feature-project project-card');
  article.dataset.project = project.id || '';
  article.dataset.projectIndex = String(index + 1).padStart(2, '0');
  article.dataset.domain = project.domain || '';
  const meta = element('div', 'project-card__meta');
  meta.append(
    element('span', 'project-card__index', String(index + 1).padStart(2, '0')),
    element('span', 'project-card__kind', project.domain || project.caseStudy?.label || 'Featured build'),
  );
  const heading = element('div', 'feature-project__top');
  heading.append(
    element('small', '', project.eyebrow),
    element('span', 'project-card__kind', project.meta || ''),
  );
  if (project.url) heading.append(element('span', 'project-card__arrow', '↗'));
  const title = project.url ? externalLink(project.url, project.title, 'feature-project__title') : element('h3', '', project.title);
  if (project.url) title.setAttribute('aria-label', `Open ${project.title} on GitHub`);
  const titleHeading = project.url ? element('h3') : title;
  if (project.url) titleHeading.append(title);
  const stack = stackList(project.stack);
  stack.className = 'project-card__stack feature-project__stack';
  article.append(meta, heading, titleHeading, element('p', '', project.description), stack);

  const signal = element('div', 'signal-strip');
  signal.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 7; index += 1) signal.append(element('i'));
  article.append(signal);
  const actions = element('div', 'feature-project__actions');
  if (project.caseStudy) {
    const details = element('button', 'project-card__details', 'View case study ↗');
    details.type = 'button';
    details.dataset.caseStudy = project.id;
    details.setAttribute('aria-label', `View ${project.title} case study`);
    details.setAttribute('aria-haspopup', 'dialog');
    details.setAttribute('aria-controls', 'caseStudyDialog');
    actions.append(details);
  }
  if (project.url) actions.append(externalLink(project.url, 'Open on GitHub ↗', 'project-card__github'));
  article.append(actions);
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
    this.renderGithubBuilds();
    this.renderSocials();
    this.bindCaseStudies();
    this.renderResume();
  }

  renderProjectList(targetId, projects = []) {
    const target = document.getElementById(targetId);
    projects.forEach((project, index) => target.append(projectCard(project, index)));
  }

  renderFeatured(targetId, projects = []) {
    const target = document.getElementById(targetId);
    [...projects]
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .forEach((project, index) => target.append(project.featured ? featuredProject(project, index) : projectCard(project, index)));
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

  renderGithubBuilds() {
    const target = document.getElementById('githubBuildLog');
    if (!target) return;
    const builds = this.content.githubBuilds || [];
    const status = target.parentElement?.querySelector('.profile-builds__header > span');
    if (status) status.textContent = `${builds.length} builds · static snapshot`;
    builds.forEach(build => {
      const article = element('article', 'github-build');
      const header = element('div', 'github-build__header');
      header.append(element('small', '', build.period), externalLink(build.url, 'GitHub ↗', 'github-build__link'));
      article.append(header);
      const title = element('h3');
      title.append(externalLink(build.url, build.title, 'github-build__title'));
      article.append(title, element('p', '', build.detail));
      target.append(article);
    });
  }

  renderSocials() {
    const target = document.getElementById('socialLinks');
    this.content.socials.forEach(item => {
      target.append(externalLink(item.url, `${item.label} ↗`));
    });
  }

  bindCaseStudies() {
    const dialog = document.getElementById('caseStudyDialog');
    if (!dialog) return;
    const projects = [...this.content.projects.surface, ...this.content.projects.signal, ...this.content.projects.core];
    const byId = new Map(projects.filter(project => project.id).map(project => [project.id, project]));
    document.querySelectorAll('[data-case-study]').forEach(trigger => trigger.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const project = byId.get(trigger.dataset.caseStudy);
      if (!project?.caseStudy) return;
      this.caseStudyTrigger = trigger;
      this.renderCaseStudy(dialog, project);
      presentDialog(dialog);
      dialog.querySelector('.case-study-dialog__close')?.focus();
    }));
    dialog.addEventListener('click', event => { if (event.target === dialog) this.closeCaseStudy(dialog); });
    dialog.addEventListener('cancel', event => { event.preventDefault(); this.closeCaseStudy(dialog); });
    dialog.addEventListener('close', () => this.caseStudyTrigger?.focus());
  }

  renderCaseStudy(dialog, project) {
    const target = document.getElementById('caseStudyContent');
    target.replaceChildren();
    dialog.setAttribute('aria-labelledby', 'caseStudyTitle');
    dialog.removeAttribute('aria-label');
    const sheet = element('div', 'case-study-sheet');
    const header = element('header', 'case-study-sheet__header');
    const identity = element('div');
    const projects = [...this.content.projects.surface, ...this.content.projects.signal, ...this.content.projects.core];
    const projectIndex = projects.findIndex(item => item.id === project.id);
    const index = element('span', 'case-study-sheet__index', `${String(projectIndex + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`);
    const caseStudyTitle = element('h2', '', project.title);
    caseStudyTitle.id = 'caseStudyTitle';
    identity.append(index, element('small', '', `Selected work · ${project.caseStudy.label}`), caseStudyTitle, element('p', '', project.eyebrow));
    if (project.stack?.length) {
      const stack = element('ul', 'case-study-stack');
      project.stack.forEach(item => stack.append(element('li', '', item)));
      identity.append(stack);
    }
    const close = element('button', 'case-study-dialog__close', 'Close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close case study');
    close.addEventListener('click', () => this.closeCaseStudy(dialog));
    header.append(identity, close);
    sheet.append(header);
    [['01', 'Problem', project.caseStudy.problem], ['02', 'Approach', project.caseStudy.approach], ['03', 'Result', project.caseStudy.result]].forEach(([number, title, copy]) => {
      const block = element('section', `case-study-block case-study-block--${title.toLowerCase()}`);
      const heading = element('h3');
      heading.append(element('span', 'case-study-block__index', number), document.createTextNode(title));
      block.append(heading, element('p', '', copy));
      sheet.append(block);
    });
    const actions = element('div', 'case-study-sheet__actions');
    if (project.url) actions.append(externalLink(project.url, 'Open repository ↗', 'action action--primary'));
    sheet.append(actions);
    target.append(sheet);
  }

  closeCaseStudy(dialog) {
    dismissDialog(dialog);
  }

  renderResume() {
    const target = document.getElementById('cvContent');
    if (!target || !this.content.cv) return;

    const cv = this.content.cv;
    const sheet = element('div', 'cv-sheet');
    const header = element('header', 'cv-sheet__header');
    const identity = element('div');
    const cvTitle = element('h2', '', cv.name);
    cvTitle.id = 'cvTitle';
    identity.append(element('small', '', 'CV · Selected snapshot'), cvTitle, element('p', 'cv-sheet__role', `${cv.role} · ${cv.location}`));
    const close = element('button', 'cv-dialog__close', 'Close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close CV snapshot');
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
    const print = element('button', 'action action--quiet', 'Print / save PDF ↗');
    print.type = 'button';
    print.setAttribute('data-cv-print', '');
    const download = element('a', 'action action--primary cv-download', 'Download PDF ↓');
    download.href = cv.pdf;
    download.download = 'muhammad-mukarram-raza-cv.pdf';
    download.setAttribute('aria-label', 'Download CV PDF');
    actions.append(print, download, externalLink(cv.github, 'GitHub ↗', 'action action--quiet'), externalLink(cv.linkedin, 'LinkedIn ↗', 'action action--quiet'));
    sheet.append(actions);
    target.append(sheet);

    const dialog = document.getElementById('cvDialog');
    const trigger = document.getElementById('cvTrigger');
    if (!dialog || !trigger) return;
    const closeDialog = () => dismissDialog(dialog);
    trigger.addEventListener('click', () => {
      presentDialog(dialog);
      dialog.querySelector('.cv-dialog__close')?.focus();
    });
    close.addEventListener('click', closeDialog);
    print.addEventListener('click', () => window.print());
    dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
    dialog.addEventListener('close', () => trigger.focus());
  }
}
