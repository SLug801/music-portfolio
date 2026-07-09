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

// ===== 문의 폼: 파일 첨부 + 백엔드(/api/contact) 전송 =====
const form = document.getElementById('contactForm');
const filesInput = document.getElementById('contactFiles');
const dropzone = document.getElementById('dropzone');
const fileNames = document.getElementById('fileNames');
const fileList = document.getElementById('fileList');
const ATTACH_CAP = 3.5 * 1024 * 1024; // 이메일 첨부 총합 상한. 초과분/큰 파일은 드라이브로.
let selectedFiles = [];

const fmtSize = (b) => (b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB');

// selectedFiles 배열을 실제 input.files와 동기화
function syncInput() {
  const dt = new DataTransfer();
  selectedFiles.forEach((f) => dt.items.add(f));
  filesInput.files = dt.files;
}

function renderFiles() {
  const total = selectedFiles.reduce((s, f) => s + f.size, 0);
  const hasBig = total > ATTACH_CAP || selectedFiles.some((f) => f.size > ATTACH_CAP);

  if (!selectedFiles.length) {
    fileNames.textContent = '여기로 파일을 끌어다 놓거나 클릭하세요';
    fileNames.classList.remove('over', 'has');
  } else {
    fileNames.textContent = `${selectedFiles.length}개 · ${fmtSize(total)}` + (hasBig ? ' · 큰 파일은 드라이브 업로드' : '');
    fileNames.classList.remove('over');
    fileNames.classList.add('has');
  }

  fileList.innerHTML = '';
  selectedFiles.forEach((f, i) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.innerHTML = '<span class="file-item__name"></span><span class="file-item__size"></span><button type="button" class="file-item__remove" aria-label="삭제">✕</button>';
    li.querySelector('.file-item__name').textContent = f.name;
    li.querySelector('.file-item__size').textContent = fmtSize(f.size);
    li.querySelector('.file-item__remove').addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFiles.splice(i, 1);
      syncInput();
      renderFiles();
    });
    fileList.appendChild(li);
  });
}

function addFiles(list) {
  Array.from(list).forEach((f) => {
    const dup = selectedFiles.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified);
    if (!dup) selectedFiles.push(f);
  });
  syncInput();
  renderFiles();
}

if (dropzone && filesInput) {
  dropzone.addEventListener('click', () => filesInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filesInput.click(); }
  });
  filesInput.addEventListener('change', () => addFiles(filesInput.files));

  ['dragenter', 'dragover'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); })
  );
  ['dragleave', 'dragend'].forEach((ev) =>
    dropzone.addEventListener(ev, () => dropzone.classList.remove('dragover'))
  );
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });
}

const readAsBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1]);
  r.onerror = reject;
  r.readAsDataURL(file);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  const original = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '전송 중...';

  try {
    // 파일 분류: 작은 것은 메일 첨부, 초과분/큰 것은 드라이브 업로드
    let attachTotal = 0;
    const toAttach = [];
    const toBlob = [];
    selectedFiles.forEach((f) => {
      if (f.size <= ATTACH_CAP && attachTotal + f.size <= ATTACH_CAP) {
        toAttach.push(f);
        attachTotal += f.size;
      } else {
        toBlob.push(f);
      }
    });

    // 큰 파일 → 드라이브(Blob) 직접 업로드
    let links = [];
    if (toBlob.length) {
      if (typeof window.__blobUpload !== 'function') {
        alert('대용량 업로드 준비가 안 됐어요. 잠시 후 다시 시도해주세요.');
        submitBtn.disabled = false; submitBtn.textContent = original; return;
      }
      submitBtn.textContent = '업로드 중 0%';
      const totalBytes = toBlob.reduce((s, f) => s + f.size, 0);
      const loadedMap = new Array(toBlob.length).fill(0);
      let shownPct = 0; // 뒤로 안 가게 (단조 증가)
      try {
        links = await Promise.all(toBlob.map(async (f, idx) => {
          const blob = await window.__blobUpload(f, (ev) => {
            loadedMap[idx] = typeof ev.loaded === 'number' ? ev.loaded : ((ev.percentage || 0) / 100) * f.size;
            const loaded = loadedMap.reduce((a, b) => a + b, 0);
            const pct = totalBytes ? Math.min(100, Math.round((loaded / totalBytes) * 100)) : 0;
            if (pct > shownPct) {
              shownPct = pct;
              submitBtn.textContent = `업로드 중 ${shownPct}%`;
            }
          });
          return { name: f.name, url: blob.url, size: f.size };
        }));
      } catch (err) {
        console.error('Blob 업로드 실패:', err);
        alert('큰 파일 업로드에 실패했어요.\n' + (err && err.message ? '원인: ' + err.message : '파일 스토리지(Blob) 설정을 확인해주세요.'));
        submitBtn.disabled = false; submitBtn.textContent = original; return;
      }
      submitBtn.textContent = '전송 중...';
    }

    // 작은 파일 → base64 메일 첨부
    const attachments = await Promise.all(toAttach.map(async (f) => ({
      filename: f.name,
      content: await readAsBase64(f),
      contentType: f.type || undefined,
    })));

    const data = { ...Object.fromEntries(new FormData(form)), attachments, links };
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      alert('문의가 정상적으로 전송되었습니다. 감사합니다!');
      form.reset();
      selectedFiles = [];
      syncInput();
      renderFiles();
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

// ===== 메일 주소 클릭 → 복사 =====
const mailCopy = document.getElementById('mailCopy');
if (mailCopy) {
  mailCopy.addEventListener('click', async () => {
    const email = mailCopy.dataset.email || mailCopy.textContent.trim();
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = email; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    const original = mailCopy.textContent;
    mailCopy.textContent = '복사됨!';
    mailCopy.classList.add('copied');
    setTimeout(() => {
      mailCopy.textContent = original;
      mailCopy.classList.remove('copied');
    }, 1400);
  });
}

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
