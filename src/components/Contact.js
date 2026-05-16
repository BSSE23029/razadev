import { CONTACT_EMAIL } from '../data/config.js';

export class Contact {
  constructor() {
    this.copyBtn = document.getElementById('copyEmailBtn');
    this.emailText = CONTACT_EMAIL;
    this._initCopyEmail();
  }

  _initCopyEmail() {
    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => this._copyEmail());
    }
  }

  async _copyEmail() {
    try {
      await navigator.clipboard.writeText(this.emailText);
      this._showToast('Email copied to clipboard!');

      this.copyBtn.classList.add('copied');
      const icon = this.copyBtn.querySelector('i');
      icon.className = 'fas fa-check';

      setTimeout(() => {
        this.copyBtn.classList.remove('copied');
        icon.className = 'fas fa-copy';
      }, 2000);
    } catch (err) {
      this._showToast('Failed to copy email', 'error');
    }
  }

  _showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i class="toast-icon fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
