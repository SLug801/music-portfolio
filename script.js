// ===== 네비게이션: 최상단=상단바, 스크롤 시=좌측 스파이 =====
const sidenav = document.getElementById('sidenav');
const navToggle = document.getElementById('navToggle');
const topbarLinks = document.getElementById('topbarLinks');

const sections = Array.from(document.querySelectorAll('section[id]'));
const spyLinks = Array.from(sidenav.querySelectorAll('a'));

function onScroll() {
  document.body.classList.toggle('scrolled', window.scrollY > 80);
  const line = window.scrollY + window.innerHeight * 0.35;
  let currentId = '';
  for (const sec of sections) {
    if (sec.offsetTop <= line) currentId = sec.id;
  }
  spyLinks.forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

navToggle.addEventListener('click', () => topbarLinks.classList.toggle('open'));
topbarLinks.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => topbarLinks.classList.remove('open'));
});

// ===== 작업물 모달 + 30초 미리듣기 =====
const modal = document.getElementById('workModal');
const modalTitle = document.getElementById('modalTitle');
const modalMeta = document.getElementById('modalMeta');
const modalDesc = document.getElementById('modalDesc');
const modalFull = document.getElementById('modalFull');
const modalPlay = document.getElementById('modalPlay');
const modalFill = document.getElementById('modalFill');
const modalTime = document.getElementById('modalTime');
const modalHint = document.getElementById('modalHint');
const PREVIEW_SECONDS = 30;
let modalAudio = null;

const fmt = (t) => `0:${String(Math.max(0, Math.floor(t))).padStart(2, '0')}`;

function stopModalAudio() {
  if (modalAudio) { modalAudio.pause(); modalAudio.src = ''; modalAudio = null; }
  modalPlay.textContent = '▶';
  modalPlay.classList.remove('playing');
  modalFill.style.width = '0%';
  modalTime.textContent = `0:00 / ${fmt(PREVIEW_SECONDS)}`;
}

function openWorkModal(el) {
  modalTitle.textContent = el.dataset.title || '';
  modalMeta.textContent = el.dataset.meta || '';
  modalDesc.textContent = el.dataset.desc || '';
  modalFull.href = el.dataset.full || '#';

  stopModalAudio();
  const src = el.dataset.audio || '';
  modalPlay.disabled = !src;
  modalPlay.dataset.src = src;
  modalHint.textContent = src ? `${PREVIEW_SECONDS}초 미리듣기` : '미리듣기 준비중';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeWorkModal() {
  stopModalAudio();
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('.work:not(.work--more)').forEach((w) => {
  w.addEventListener('click', () => openWorkModal(w));
  w.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWorkModal(w); }
  });
});

modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeWorkModal));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeWorkModal();
});

modalPlay.addEventListener('click', () => {
  const src = modalPlay.dataset.src;
  if (!src) return;

  if (modalAudio && !modalAudio.paused) {
    modalAudio.pause();
    modalPlay.textContent = '▶';
    modalPlay.classList.remove('playing');
    return;
  }

  if (!modalAudio) {
    modalAudio = new Audio(src);
    modalAudio.addEventListener('timeupdate', () => {
      const t = modalAudio.currentTime;
      if (t >= PREVIEW_SECONDS) {  // 30초에서 컷
        modalAudio.pause();
        modalAudio.currentTime = 0;
        modalFill.style.width = '0%';
        modalPlay.textContent = '▶';
        modalPlay.classList.remove('playing');
        modalTime.textContent = `0:00 / ${fmt(PREVIEW_SECONDS)}`;
        return;
      }
      modalFill.style.width = (t / PREVIEW_SECONDS) * 100 + '%';
      modalTime.textContent = `${fmt(t)} / ${fmt(PREVIEW_SECONDS)}`;
    });
    modalAudio.addEventListener('ended', () => {
      modalPlay.textContent = '▶';
      modalPlay.classList.remove('playing');
      modalFill.style.width = '0%';
    });
  }
  modalAudio.play();
  modalPlay.textContent = '❚❚';
  modalPlay.classList.add('playing');
});

// ===== 문의 폼: 백엔드(/api/contact)로 전송 =====
const form = document.getElementById('contactForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const original = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '전송 중...';

  try {
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert('문의가 정상적으로 전송되었습니다. 감사합니다!');
      form.reset();
    } else {
      const info = await res.json().catch(() => ({}));
      alert(info.error || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  } catch (err) {
    alert('네트워크 오류로 전송하지 못했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = original;
  }
});

// ===== 스크롤 리빌 =====
const revealEls = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));
}
