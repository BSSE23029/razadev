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

function projectCard(project) {
  const article = element('article');
  const heading = element('div');
  heading.append(element('small', '', project.eyebrow), element('h3', '', project.title));
  article.append(heading, element('p', '', project.description), stackList(project.stack));
  return article;
}

function featuredProject(project) {
  const article = element('article', 'feature-project');
  const heading = element('div', 'feature-project__top');
  heading.append(element('small', '', project.eyebrow), element('span', '', project.meta || ''));
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
    const link = element('a', '', detail);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    definition.append(link);
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
      detail: `${item.organization} · ${item.period}`,
    })));
    this.content.profileFacts.forEach(fact => target.append(factRow(fact)));
  }

  renderSocials() {
    const target = document.getElementById('socialLinks');
    this.content.socials.forEach(item => {
      const link = element('a', '', `${item.label} ↗`);
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      target.append(link);
    });
  }
}
