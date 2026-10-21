const base = new URL('./', import.meta.url);
const asset = path => new URL(path, base).href;
const mediaDialog = document.querySelector('#media-dialog');
const menuDialog = document.querySelector('#menu-dialog');
let opener;

document.querySelector('[data-menu-open]')?.addEventListener('click', () => menuDialog.showModal());
document.querySelector('[data-menu-close]')?.addEventListener('click', () => menuDialog.close());
menuDialog?.addEventListener('click', event => { if (event.target.closest('a')) menuDialog.close(); });
document.querySelector('[data-video-close]')?.addEventListener('click', () => mediaDialog.close());
mediaDialog?.addEventListener('click', event => {
  const box = mediaDialog.getBoundingClientRect();
  if (event.target === mediaDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) mediaDialog.close();
});
mediaDialog?.addEventListener('close', () => {
  const video = mediaDialog.querySelector('video');
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); video.remove(); }
  document.body.classList.remove('modal-open');
  opener?.focus();
});
menuDialog?.addEventListener('close', () => document.querySelector('[data-menu-open]')?.focus());

function openVideo(reel, button) {
  if (!reel.video) return;
  opener = button;
  const stage = mediaDialog.querySelector('.video-stage');
  stage.replaceChildren();
  mediaDialog.querySelector('#video-title').textContent = reel.title || reel.brand;
  const fallback = mediaDialog.querySelector('[data-video-fallback]');
  fallback.hidden = !reel.instagram;
  if (reel.instagram) fallback.href = reel.instagram;
  else fallback.removeAttribute('href');
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'none';
  video.poster = asset(reel.poster);
  video.setAttribute('aria-label', `${reel.brand} — ${reel.kind}`);
  video.src = asset(reel.video);
  stage.append(video);
  mediaDialog.showModal();
  document.body.classList.add('modal-open');
  video.play().catch(() => { /* Browser controls remain available if playback needs another tap. */ });
}

try {
  const response = await fetch(asset('content/reels.json'));
  if (!response.ok) throw new Error('Reel list unavailable');
  const reels = await response.json();
  document.querySelectorAll('[data-reel-grid]').forEach(grid => {
    grid.replaceChildren();
    for (const reel of reels.filter(item => item.video && item.poster && item.kind === 'Brand collaboration')) {
      const card = document.createElement('article'); card.className = 'reel-card';
      const button = document.createElement('button'); button.className = 'reel-cover'; button.dataset.play = reel.id;
      button.setAttribute('aria-label', `Play ${reel.title || reel.brand} collaboration video`);
      const image = document.createElement('img'); image.src = asset(reel.poster); image.alt = reel.posterAlt || `${reel.brand} collaboration`; image.width = 720; image.height = 1280; image.loading = 'lazy';
      const play = document.createElement('span'); play.className = 'play'; play.setAttribute('aria-hidden', 'true');
      const icon = document.createElement('span'); icon.textContent = '▶'; play.append(icon);
      const duration = document.createElement('span'); duration.className = 'reel-duration'; duration.textContent = reel.durationLabel || 'Watch film';
      button.append(image, play, duration);
      const caption = document.createElement('div'); caption.className = 'reel-description';
      const name = document.createElement('h3'); name.textContent = reel.brand;
      const detail = document.createElement('p'); detail.textContent = reel.label || 'Brand collaboration';
      caption.append(name, detail); card.append(button, caption); grid.append(card);
    }
  });
  document.querySelectorAll('[data-play]').forEach(button => {
    const reel = reels.find(item => item.id === button.dataset.play);
    if (reel?.video && reel?.poster) {
      button.addEventListener('click', () => openVideo(reel, button));
    } else {
      button.disabled = true;
      button.setAttribute('aria-label', 'Video unavailable');
    }
  });
} catch {
  document.querySelectorAll('[data-reel-grid]').forEach(grid => {
    const message = document.createElement('p');
    message.textContent = 'Films are temporarily unavailable. Explore my work on Instagram.';
    const link = document.createElement('a'); link.className = 'text-link';
    link.href = 'https://www.instagram.com/sonyajurane/'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Visit my Instagram ↗'; grid.replaceChildren(message, link);
  });
  document.querySelectorAll('[data-play]').forEach(button => {
    button.disabled = true;
    button.setAttribute('aria-label', 'Video unavailable. Use the Instagram link.');
  });
}

const amount = value => Number.isFinite(value) && value >= 0 ? value : null;
const percentage = value => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
const format = value => value >= 1e6 ? `${+(value / 1e6).toFixed(1)}M` : value >= 10000 ? `${+(value / 1000).toFixed(1)}K` : value.toLocaleString('en-US');
if (document.querySelector('[data-stat]')) {
  try {
    const response = await fetch(asset('content/stats.json'));
    if (!response.ok) throw new Error('Stats unavailable');
    const stats = await response.json();
    document.querySelectorAll('[data-stat]').forEach(node => {
      const value = amount(stats.headline?.[node.dataset.stat]);
      node.textContent = value === null ? '—' : format(value) + (node.dataset.plus === 'true' ? '+' : '');
    });
    const note = document.querySelector('[data-stats-note]');
    if (note) {
      const date = stats.updatedAt && /^\d{4}-\d{2}-\d{2}$/.test(stats.updatedAt) ? new Date(`${stats.updatedAt}T12:00:00Z`) : null;
      note.textContent = date && !Number.isNaN(date.getTime()) ? `Updated ${new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)}` : stats.sourceNote || 'Audience snapshot';
    }
    document.querySelectorAll('[data-breakdown]').forEach(container => {
      const list = stats[container.dataset.breakdown];
      container.replaceChildren();
      if (!Array.isArray(list)) return;
      for (const item of list) {
        const row = document.createElement('div'); row.className = 'data-row';
        const text = document.createElement('div'); text.className = 'data-label';
        const label = document.createElement('span'); label.textContent = item.label;
        const value = document.createElement('span'); value.textContent = `${percentage(item.value)}%`;
        text.append(label, value);
        const track = document.createElement('div'); track.className = 'track';
        const fill = document.createElement('span'); fill.style.width = `${percentage(item.value)}%`;
        track.append(fill); row.append(text, track); container.append(row);
      }
    });
  } catch {
    const note = document.querySelector('[data-stats-note]');
    if (note) note.textContent = 'Audience figures are being updated.';
  }
}
