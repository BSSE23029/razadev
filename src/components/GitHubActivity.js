import { GITHUB_USERNAME } from '../data/config.js';
import { getTimeAgo } from '../utils/helpers.js';

export class GitHubActivity {
  constructor() {
    this.username = GITHUB_USERNAME;
    this.container = document.getElementById('commitsContainer');
    this._initCommitsFeed();
    this._updateWidgets();
  }

  async _initCommitsFeed() {
    await this._fetchCommits();
  }

  async _fetchCommits() {
    try {
      const response = await fetch(
        `https://api.github.com/users/${this.username}/events/public?per_page=30`
      );
      const events = await response.json();

      const pushEvents = events.filter((event) => event.type === 'PushEvent').slice(0, 5);
      this._displayCommits(pushEvents);
    } catch (error) {
      if (this.container) {
        this.container.innerHTML =
          '<p style="text-align: center; color: var(--text-secondary);">Unable to load commits. Please check back later.</p>';
      }
    }
  }

  _displayCommits(events) {
    if (!this.container) return;

    if (events.length === 0) {
      this.container.innerHTML =
        '<p style="text-align: center; color: var(--text-secondary);">No recent commits found.</p>';
      return;
    }

    const commitsHTML = events
      .map((event) => {
        const commit = event.payload.commits[0];
        const timeAgo = getTimeAgo(new Date(event.created_at));
        const sha = commit.sha.substring(0, 7);

        return `
          <div class="commit-item" onclick="window.open('https://github.com/${event.repo.name}', '_blank')">
            <div class="commit-header">
              <span class="commit-repo">
                <i class="fab fa-github"></i>
                ${event.repo.name.split('/')[1]}
              </span>
              <span class="commit-time">${timeAgo}</span>
            </div>
            <div class="commit-message">${commit.message}</div>
            <div class="commit-meta">
              <span class="commit-sha">${sha}</span>
              <span><i class="fas fa-code-branch"></i> ${event.payload.ref.split('/').pop()}</span>
            </div>
          </div>
        `;
      })
      .join('');

    this.container.innerHTML = commitsHTML;
  }

  _updateWidgets() {
    const textColor = 'FFFFFF';
    const chartColor = '007AFF';
    const cardTheme = 'github_dark';

    const statsImg = document.getElementById('githubStatsImg');
    if (statsImg) {
      statsImg.src = `https://github-readme-stats.vercel.app/api?username=${this.username}&show_icons=true&theme=transparent&hide_border=true&title_color=${chartColor}&icon_color=${chartColor}&text_color=${textColor}&bg_color=00000000`;
    }

    const langsImg = document.getElementById('githubLangsImg');
    if (langsImg) {
      langsImg.src = `https://github-readme-stats.vercel.app/api/top-langs/?username=${this.username}&layout=compact&theme=transparent&hide_border=true&title_color=${chartColor}&text_color=${textColor}&bg_color=00000000`;
    }

    const profileSummary = document.getElementById('githubProfileSummary');
    if (profileSummary) {
      profileSummary.src = `https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=${this.username}&theme=${cardTheme}`;
    }

    const commitTime = document.getElementById('githubCommitTime');
    if (commitTime) {
      commitTime.src = `https://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=${this.username}&theme=${cardTheme}`;
    }

    const repoPerLang = document.getElementById('githubRepoPerLang');
    if (repoPerLang) {
      repoPerLang.src = `https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${this.username}&theme=${cardTheme}`;
    }

    const contribImg = document.getElementById('githubContribImg');
    if (contribImg) {
      contribImg.src = `https://ghchart.rshah.org/${chartColor}/${this.username}`;
    }

    const streakImg = document.getElementById('githubStreakImg');
    if (streakImg) {
      streakImg.src = `https://github-readme-streak-stats.herokuapp.com/?user=${this.username}&theme=transparent&hide_border=true&ring=${chartColor}&fire=${chartColor}&currStreakLabel=${textColor}&sideLabels=${textColor}&dates=${textColor}&currStreakNum=${chartColor}&sideNums=${chartColor}`;
    }
  }
}
