import { quotes } from '../data/quotes.js';

export class TechQuote {
  constructor() {
    this.quotes = quotes;
    this.quoteText = document.getElementById('quoteText');
    this.quoteAuthor = document.getElementById('quoteAuthor');
    this.refreshBtn = document.getElementById('quoteRefresh');
    this._init();
  }

  _init() {
    this._showRandomQuote();
    this.refreshBtn?.addEventListener('click', () => this._showRandomQuote());
  }

  _showRandomQuote() {
    const quote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    if (this.quoteText) this.quoteText.textContent = quote.text;
    if (this.quoteAuthor) this.quoteAuthor.textContent = `— ${quote.author}`;
  }
}
