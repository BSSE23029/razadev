import { publications } from '../data/publications.js';

export class Publications {
  constructor() {
    this.publications = publications;
    this.container = document.getElementById('publicationsList');
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';

    if (this.publications.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: var(--space-8);">
          No publications added yet. Check back soon!
        </div>
      `;
      return;
    }

    this.publications.forEach((pub) => {
      const pubElement = document.createElement('div');
      pubElement.className = 'publication-card';
      pubElement.innerHTML = `
        <h3 class="publication-title">${pub.title}</h3>
        <p class="publication-authors">${pub.authors}</p>
        <div class="publication-venue">
          <i class="fas fa-book-open" style="color: var(--primary);"></i>
          <span class="venue-name">${pub.venue} &bull; ${pub.year}</span>
        </div>
        <div class="publication-footer">
          <div class="publication-metrics">
            <span title="Citations"><i class="fas fa-quote-right" style="margin-right: 4px;"></i>${pub.citations} Citations</span>
          </div>
          <a href="${pub.link}" target="_blank" rel="noopener noreferrer" class="publication-link">
            View Paper <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      `;
      this.container.appendChild(pubElement);
    });
  }
}
