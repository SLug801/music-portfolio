'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // ===== 네비게이션: 최상단=상단바, 스크롤 시=좌측 스파이 =====
    const sidenav = document.getElementById('sidenav');
    const navToggle = document.getElementById('navToggle');
    const topbarLinks = document.getElementById('topbarLinks');
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const spyLinks = sidenav ? Array.from(sidenav.querySelectorAll('a')) : [];

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

    const onToggle = () => topbarLinks && topbarLinks.classList.toggle('open');
    if (navToggle) navToggle.addEventListener('click', onToggle);
    const closeMenu = () => topbarLinks && topbarLinks.classList.remove('open');
    if (topbarLinks) topbarLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

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
      if (modalPlay) { modalPlay.textContent = '▶'; modalPlay.classList.remove('playing'); }
      if (modalFill) modalFill.style.width = '0%';
      if (modalTime) modalTime.textContent = `0:00 / ${fmt(PREVIEW_SECONDS)}`;
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
    const workEls = Array.from(document.querySelectorAll('.work:not(.work--more)'));
    const workClick = (w) => () => openWorkModal(w);
    const workKey = (w) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWorkModal(w); } };
    workEls.forEach((w) => {
      w.addEventListener('click', workClick(w));
      w.addEventListener('keydown', workKey(w));
    });
    if (modal) modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeWorkModal));
    const onEsc = (e) => { if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeWorkModal(); };
    document.addEventListener('keydown', onEsc);
    const onModalPlay = () => {
      const src = modalPlay.dataset.src;
      if (!src) return;
      if (modalAudio && !modalAudio.paused) {
        modalAudio.pause(); modalPlay.textContent = '▶'; modalPlay.classList.remove('playing'); return;
      }
      if (!modalAudio) {
        modalAudio = new Audio(src);
        modalAudio.addEventListener('timeupdate', () => {
          const t = modalAudio.currentTime;
          if (t >= PREVIEW_SECONDS) {
            modalAudio.pause(); modalAudio.currentTime = 0; modalFill.style.width = '0%';
            modalPlay.textContent = '▶'; modalPlay.classList.remove('playing');
            modalTime.textContent = `0:00 / ${fmt(PREVIEW_SECONDS)}`; return;
          }
          modalFill.style.width = (t / PREVIEW_SECONDS) * 100 + '%';
          modalTime.textContent = `${fmt(t)} / ${fmt(PREVIEW_SECONDS)}`;
        });
        modalAudio.addEventListener('ended', () => {
          modalPlay.textContent = '▶'; modalPlay.classList.remove('playing'); modalFill.style.width = '0%';
        });
      }
      modalAudio.play(); modalPlay.textContent = '❚❚'; modalPlay.classList.add('playing');
    };
    if (modalPlay) modalPlay.addEventListener('click', onModalPlay);

    // ===== 파일 첨부 (드래그앤드롭) =====
    const form = document.getElementById('contactForm');
    const filesInput = document.getElementById('contactFiles');
    const dropzone = document.getElementById('dropzone');
    const fileNames = document.getElementById('fileNames');
    const fileList = document.getElementById('fileList');
    const ATTACH_CAP = 3.5 * 1024 * 1024; // 이메일 첨부 총합 상한. 초과분/큰 파일은 드라이브로.
    let selectedFiles = [];
    const fmtSize = (b) => (b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB');

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
        fileNames.textContent = `${selectedFiles.length}개 · ${fmtSize(total)}` + (hasBig ? ' · 파일 업로드 됨.' : '');
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
          syncInput(); renderFiles();
        });
        fileList.appendChild(li);
      });
    }
    function addFiles(list) {
      Array.from(list).forEach((f) => {
        const dup = selectedFiles.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified);
        if (!dup) selectedFiles.push(f);
      });
      syncInput(); renderFiles();
    }
    const dzClick = () => filesInput.click();
    const dzKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filesInput.click(); } };
    const dzChange = () => addFiles(filesInput.files);
    const dzOver = (e) => { e.preventDefault(); dropzone.classList.add('dragover'); };
    const dzLeave = () => dropzone.classList.remove('dragover');
    const dzDrop = (e) => {
      e.preventDefault(); dropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    };
    if (dropzone && filesInput) {
      dropzone.addEventListener('click', dzClick);
      dropzone.addEventListener('keydown', dzKey);
      filesInput.addEventListener('change', dzChange);
      ['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, dzOver));
      ['dragleave', 'dragend'].forEach((ev) => dropzone.addEventListener(ev, dzLeave));
      dropzone.addEventListener('drop', dzDrop);
    }

    const readAsBase64 = (file) => new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    // ===== 문의 폼 제출 (작은 파일=첨부, 큰 파일=Blob 업로드) =====
    const onSubmit = async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const original = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = '전송 중...';

      try {
        let attachTotal = 0;
        const toAttach = [];
        const toBlob = [];
        selectedFiles.forEach((f) => {
          if (f.size <= ATTACH_CAP && attachTotal + f.size <= ATTACH_CAP) { toAttach.push(f); attachTotal += f.size; }
          else toBlob.push(f);
        });

        let links = [];
        if (toBlob.length) {
          submitBtn.textContent = '업로드 중 0%';
          const totalBytes = toBlob.reduce((s, f) => s + f.size, 0);
          const loadedMap = new Array(toBlob.length).fill(0);
          let shownPct = 0;
          try {
            links = await Promise.all(toBlob.map(async (f, idx) => {
              // 1) 서버에서 R2 presigned PUT URL 발급
              const presignRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: f.name, contentType: f.type || 'application/octet-stream' }),
              });
              if (!presignRes.ok) {
                const info = await presignRes.json().catch(() => ({}));
                throw new Error(info.error || '업로드 URL 발급 실패');
              }
              const { uploadUrl, publicUrl } = await presignRes.json();

              // 2) 파일을 R2에 직접 PUT (XHR로 진행률 표시)
              await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                if (f.type) xhr.setRequestHeader('Content-Type', f.type);
                xhr.upload.onprogress = (ev) => {
                  if (!ev.lengthComputable) return;
                  loadedMap[idx] = ev.loaded;
                  const loaded = loadedMap.reduce((a, b) => a + b, 0);
                  const pct = totalBytes ? Math.min(100, Math.round((loaded / totalBytes) * 100)) : 0;
                  if (pct > shownPct) { shownPct = pct; submitBtn.textContent = `업로드 중 ${pct}%`; }
                };
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error('업로드 실패 (' + xhr.status + ')'));
                xhr.onerror = () => reject(new Error('네트워크 오류 (R2 CORS 설정을 확인하세요)'));
                xhr.send(f);
              });

              return { name: f.name, url: publicUrl, size: f.size };
            }));
          } catch (err) {
            console.error('파일 업로드 실패:', err);
            alert('큰 파일 업로드에 실패했어요.\n' + (err && err.message ? '원인: ' + err.message : ''));
            submitBtn.disabled = false; submitBtn.textContent = original; return;
          }
          submitBtn.textContent = '전송 중...';
        }

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
          syncInput(); renderFiles();
        } else {
          const info = await res.json().catch(() => ({}));
          alert(info.error || '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (err) {
        alert('네트워크 오류로 전송하지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = original;
      }
    };
    if (form) form.addEventListener('submit', onSubmit);

    // ===== 메일 주소 클릭 → 복사 =====
    const mailCopy = document.getElementById('mailCopy');
    const onCopy = async () => {
      const emailAddr = mailCopy.dataset.email || mailCopy.textContent.trim();
      try { await navigator.clipboard.writeText(emailAddr); }
      catch {
        const ta = document.createElement('textarea');
        ta.value = emailAddr; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      const originalText = mailCopy.textContent;
      mailCopy.textContent = '복사됨!';
      mailCopy.classList.add('copied');
      setTimeout(() => { mailCopy.textContent = originalText; mailCopy.classList.remove('copied'); }, 1400);
    };
    if (mailCopy) mailCopy.addEventListener('click', onCopy);

    // ===== 스크롤 리빌 =====
    const revealEls = document.querySelectorAll('.reveal');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-in'));
    } else {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.15 });
      revealEls.forEach((el) => io.observe(el));
    }

    // ===== cleanup =====
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('keydown', onEsc);
      if (io) io.disconnect();
      document.body.classList.remove('scrolled');
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <header className="topbar" id="topbar">
        <div className="topbar__inner">
          <a href="#home" className="topbar__logo">Sample<span>.music</span></a>
          <nav className="topbar__links" id="topbarLinks">
            <a href="#about">소개</a>
            <a href="#works">작업물</a>
            <a href="#services">안내</a>
            <a href="#contact">문의 / 신청</a>
          </nav>
          <button className="topbar__toggle" id="navToggle" aria-label="메뉴 열기">☰</button>
        </div>
      </header>

      <nav className="sidenav" id="sidenav" aria-label="섹션 내비게이션">
        <a href="#about"><span className="sidenav__i">01</span> 소개</a>
        <a href="#works"><span className="sidenav__i">02</span> 작업물</a>
        <a href="#services"><span className="sidenav__i">03</span> 안내</a>
        <a href="#contact"><span className="sidenav__i">04</span> 문의 / 신청</a>
      </nav>

      <section className="hero" id="home">
        <div className="hero__inner">
          <div className="hero__top">
            <span className="mono">BGM & MUSIC COMPOSER</span>
            <span className="mono">EST. 2026 / SEOUL</span>
          </div>
          <h1 className="hero__title">High - Quallity<br />BGM Composer.</h1>
          <p className="hero__sub">오케스트라를 중심으로 애니메이션, 게임, 영화, 광고 등
                다양한 영상 콘텐츠를 위한 음악을 작곡하고 있습니다.</p>
          <div className="hero__bottom">
            <div className="hero__cta">
              <a href="#works" className="btn btn--primary">작업물 보기</a>
              <a href="#contact" className="btn btn--ghost">외주 문의</a>
            </div>
            <div className="hero__social">
              <a href="https://www.youtube.com/@ryupassion" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 12s0-3.8-.5-5.6a2.9 2.9 0 0 0-2-2C18.7 4 12 4 12 4s-6.7 0-8.5.4a2.9 2.9 0 0 0-2 2C1 8.2 1 12 1 12s0 3.8.5 5.6a2.9 2.9 0 0 0 2 2C5.3 20 12 20 12 20s6.7 0 8.5-.4a2.9 2.9 0 0 0 2-2C23 15.8 23 12 23 12Zm-13 3.5v-7l6 3.5-6 3.5Z" /></svg>
              </a>
              <a href="#" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="SoundCloud">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="2" y="11" width="1.7" height="5" rx=".85" /><rect x="5.3" y="9" width="1.7" height="7" rx=".85" /><rect x="8.6" y="7.5" width="1.7" height="8.5" rx=".85" /><rect x="11.9" y="9" width="1.7" height="7" rx=".85" /><path d="M15.5 8.2c.5-.2 1-.2 1.5-.2a4.5 4.5 0 0 1 4.5 4.5c0 .2 0 .4-.1.5H15.5V8.2Z" /></svg>
              </a>
              <a href="https://www.instagram.com/10jeong__/" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="wrap">
          <header className="sec-head reveal">
            <span className="mono sec-index">01 — 소개</span>
            <h2 className="sec-title">About</h2>
          </header>
          <div className="about">
            <div className="about__lead reveal">
              <p>
                안녕하세요. 작곡가 <strong>유정열</strong>입니다.<br />
                오케스트라를 중심으로 <strong>애니메이션, 게임, 영화, 광고 </strong>등<br />
                다양한 <strong>영상 콘텐츠</strong>를 위한 음악을 작곡하고 있습니다.<br />
                작품이 전하고자 하는 메시지를 더욱 깊이 전달할 수 있도록<br />
                새로운 사운드와 표현을 끊임없이 연구하며 도전하고 있습니다.<br />
                어제보다 더 나은 내일을 위해 끊임없이 배우고 성장하며,<br />
                한 곡 한 곡에 진심을 담아 최고의 음악을 만들어가겠습니다.
              </p>
              <ul className="about__tags">
                <li>Orchestral</li>
                <li>BGM</li>
                <li>Animation</li>
                <li>Game</li>
                <li>Movie</li>
                <li>advertisement</li>
          
              </ul>
            </div>
            <aside className="about__profile reveal">
              <span className="mono profile__label">PROFILE</span>
              <dl className="profile">
                <div className="profile__row"><dt>Name / Nickname</dt><dd>유정열 / 0000</dd></div>
                <div className="profile__row"><dt>E mail</dt><dd>ryupassion98@gmail.com</dd></div>
                <div className="profile__row"><dt>Phone</dt><dd>010-2553-4594</dd></div>
                <div className="profile__row"><dt>Birth</dt><dd>1998.11.08</dd></div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <section className="section" id="works">
        <div className="wrap">
          <header className="sec-head reveal">
            <span className="mono sec-index">02 — 작업물</span>
            <h2 className="sec-title">Portfolio</h2>
          </header>
          <div className="works">
            <div className="work reveal" role="button" tabIndex={0}
              data-title="Lost Ark — Main Theme" data-meta="ORCHESTRAL / RPG / 2025"
              data-desc="RPG 메인 테마. 웅장한 오케스트라 편성으로 세계관의 시작을 여는 곡."
              data-audio="" data-full="https://www.youtube.com/@ryupassion">
              <span className="work__play" aria-hidden="true">▶</span>
              <span className="work__index mono">01</span>
              <h3 className="work__title"> LostArk — Main Theme</h3>
              <span className="work__meta mono">ORCHESTRAL / RPG / 2025</span>
            </div>
            <div className="work reveal" role="button" tabIndex={0}
              data-title="Sample — sample" data-meta="HEAVY METAL / ACTION / 1950"
              data-desc="곡 설명 자리."
              data-audio="" data-full="https://www.youtube.com/@ryupassion">
              <span className="work__play" aria-hidden="true">▶</span>
              <span className="work__index mono">02</span>
              <h3 className="work__title">Sample — sample</h3>
              <span className="work__meta mono">HEAVY METAL / ACTION / 1950</span>
            </div>
            <div className="work reveal" role="button" tabIndex={0}
              data-title="ㅇㅇ" data-meta="GENRE / GAME / YEAR"
              data-desc="곡 설명 자리."
              data-audio="" data-full="https://www.youtube.com/@ryupassion">
              <span className="work__play" aria-hidden="true">▶</span>
              <span className="work__index mono">03</span>
              <h3 className="work__title">Tekken7</h3>
              <span className="work__meta mono">GENRE / GAME / YEAR</span>
            </div>
            <div className="work reveal" role="button" tabIndex={0}
              data-title="Untitled 04" data-meta="AMBIENT / ADVENTURE / 2024"
              data-desc="곡 설명 자리."
              data-audio="" data-full="https://www.youtube.com/@ryupassion">
              <span className="work__play" aria-hidden="true">▶</span>
              <span className="work__index mono">04</span>
              <h3 className="work__title">Untitled 04</h3>
              <span className="work__meta mono">AMBIENT / ADVENTURE / 2024</span>
            </div>
            <div className="work reveal" role="button" tabIndex={0}
              data-title="Untitled 05" data-meta="CHIPTUNE / PLATFORMER / 2023"
              data-desc="곡 설명 자리."
              data-audio="" data-full="https://www.youtube.com/@ryupassion">
              <span className="work__play" aria-hidden="true">▶</span>
              <span className="work__index mono">05</span>
              <h3 className="work__title">Untitled 05</h3>
              <span className="work__meta mono">CHIPTUNE / PLATFORMER / 2023</span>
            </div>
            <a className="work work--more reveal" href="https://www.youtube.com/@ryupassion" target="_blank" rel="noopener noreferrer">
              <span className="work__play work__play--add" aria-hidden="true">+</span>
              <span className="work__index mono">ALL</span>
              <h3 className="work__title">더 들어보기</h3>
              <span className="work__meta mono">YOUTUBE ↗</span>
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="wrap">
          <header className="sec-head reveal">
            <span className="mono sec-index">03 — 안내</span>
            <h2 className="sec-title">Commission</h2>
          </header>
          <div className="commission">
            <div className="plan reveal">
              <div className="plan__head"><h3>커미션</h3></div>
              <p className="plan__desc">들으면 눈물나는 브금. 안 들으면 나만 운다. 단일 트랙 단위로 제작합니다.</p>
              <div className="plan__price"><span className="mono">10,000</span> KRW <em>/ 초</em></div>
            </div>
            <div className="plan reveal">
              <div className="plan__head"><h3>외주</h3></div>
              <p className="plan__desc">게임 한 편에 필요한 BGM 세트 + 사운드 이펙트를 통으로. 통일된 톤 유지.</p>
              <div className="plan__price"><span className="mono">100,000</span> KRW <em>/ 초</em></div>
            </div>
          </div>
          <div className="process reveal">
            <h3 className="process__title">진행 방식</h3>
            <ol className="process__steps">
              <li className="pstep" tabIndex={0}>
                <div className="pstep__num">1</div>
                <div className="pstep__label">문의</div>
                <div className="pstep__detail" role="tooltip"><strong>상담 및 작업 안내</strong><br />
                <br />
                모든 작업은 상담을 통해 견적, 작업 범위, 진행 일정 등을 충분히 협의한 후 진행됩니다.<br />
원하시는 분위기, 사용 목적, 참고 레퍼런스 등 구체적인 정보를 함께 전달해 주시면 작업 방향을 보다 정확하게 파악할 수 있으며, 높은 완성도의 결과물을 제작하는 데 도움이 됩니다.</div>
              </li>
              <li className="parrow" aria-hidden="true">→</li>
              <li className="pstep" tabIndex={0}>
                <div className="pstep__num">2</div>
                <div className="pstep__label">견적</div>
                <div className="pstep__detail" role="tooltip"><strong>견적 산정</strong><br />
                <br />
                상담을 통해 작업 범위와 일정이 확정되면, 해당 내용에 따라 견적이 산정됩니다.</div>
              </li>
              <li className="parrow" aria-hidden="true">→</li>
              <li className="pstep" tabIndex={0}>
                <div className="pstep__num">3</div>
                <div className="pstep__label">데모</div>
                <div className="pstep__detail" role="tooltip"><strong>데모 전달 및 피드백</strong><br />
                <br />
                의뢰 내용을 바탕으로 제작한 데모 버전을 전달드립니다.<br />
데모를 통해 음악의 방향성과 완성도를 함께 확인하며, 피드백 및 세부적인 수정 사항을 전달하는 단계입니다.</div>
              </li>
              <li className="parrow" aria-hidden="true">→</li>
              <li className="pstep" tabIndex={0}>
                <div className="pstep__num">4</div>
                <div className="pstep__label">수정</div>
                <div className="pstep__detail" role="tooltip"><strong>작업물 수정</strong><br />
                <br />
                데모 단계에서 전달해 주신 피드백과 수정 사항을 반영하여 작업을 보완하고 완성도를 높여갑니다.<br />
                클라이언트가 원하시는 결과물에 도달할 때까지 데모 전달과 수정 과정을 충분한 협의를 통해 반복하며 작업을 진행합니다.</div>
              </li>
              <li className="parrow" aria-hidden="true">→</li>
              <li className="pstep" tabIndex={0}>
                <div className="pstep__num">5</div>
                <div className="pstep__label">완성</div>
                <div className="pstep__detail" role="tooltip"><strong>완성 및 전달</strong><br />
                <br />
                데모와 수정 과정을 거쳐 최종 완성된 작업물을 전달해 드립니다.<br />
                최종 결과물을 확인하신 후 작업이 마무리되며, 협의된 형식에 맞춰 파일을 전달해 드립니다.</div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="wrap">
          <header className="sec-head reveal">
            <span className="mono sec-index">04 — 문의 / 신청</span>
            <h2 className="sec-title">문의 / 신청</h2>
          </header>
          <div className="contact-grid">
            <div className="contact-aside reveal">
              <button type="button" className="contact-mail" id="mailCopy" data-email="ryupassion98@gmail.com">ryupassion98@gmail.com</button> 
              <p></p>
              <p> 첨부 파일의 용량이 커 전송이 어려운 경우에는 위의 이메일로 Drive 등의 공유 링크를 보내주시거나, 첨부 가능한 다른 방법을 이용해 전달해 주시면 감사하겠습니다.</p>
              
            </div>
            <form className="contact reveal" id="contactForm">
              <div className="contact__row">
                <label>이름 / 회사명
                  <input type="text" name="name" required placeholder="홍길동 / 스튜디오" />
                </label>
                <label>회신 이메일
                  <input type="email" name="email" required placeholder="you@example.com" />
                </label>
              </div>
              <label>프로젝트 유형
                <select name="type" defaultValue="커미션">
                  <option value="">선택하세요</option>
                  <option>외주</option>
                  <option>커미션</option>
                  <option>기타 / 문의</option>
                </select>
              </label>
              <label>내용
                <textarea name="message" rows={5} required placeholder="원하시는 분위기, 사용 목적, 참고 레퍼런스 등 구체적인 정보를 함께 전달해 주시면 작업 방향을 보다 정확하게 파악할 수 있습니다. "></textarea>
              </label>
              <div className="field">
                <span className="field-label">파일 첨부 <span className="label-opt">(모든 형식 · 드래그 또는 클릭 · 큰 파일 자동 업로드)</span></span>
                <div className="dropzone" id="dropzone" tabIndex={0} role="button" aria-label="파일 첨부">
                  <input type="file" id="contactFiles" multiple hidden />
                  <span className="dropzone__icon" aria-hidden="true">⬇</span>
                  <span className="dropzone__text" id="fileNames">여기로 파일을 끌어다 놓거나 클릭하세요</span>
                </div>
                <ul className="file-list" id="fileList"></ul>
              </div>
              <button type="submit" className="btn btn--primary btn--full">문의 보내기</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer__inner">
          <a href="#home" className="footer__mark">Sample<span>.music</span></a>
          <div className="footer__links">
            <a href="https://www.youtube.com/@ryupassion" target="_blank" rel="noopener noreferrer">YouTube</a>
            <a href="#" target="_blank" rel="noopener noreferrer">SoundCloud</a>
            <a href="https://www.instagram.com/10jeong__/" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
          <span className="footer__copy mono">© 2026 YU JEONG-YEOL</span>
        </div>
      </footer>

      <div className="modal" id="workModal" aria-hidden="true">
        <div className="modal__backdrop" data-close></div>
        <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <button className="modal__close" data-close aria-label="닫기">✕</button>
          <span className="modal__meta mono" id="modalMeta"></span>
          <h3 className="modal__title" id="modalTitle"></h3>
          <div className="modal__player">
            <button className="modal__play" id="modalPlay" aria-label="미리듣기 재생">▶</button>
            <div className="modal__bar" id="modalBar"><div className="modal__fill" id="modalFill"></div></div>
            <span className="modal__time mono" id="modalTime">0:00 / 0:30</span>
          </div>
          <p className="modal__hint mono" id="modalHint">30초 미리듣기</p>
          <p className="modal__desc" id="modalDesc"></p>
          <a className="modal__full" id="modalFull" target="_blank" rel="noopener noreferrer">풀버전 듣기 ↗</a>
        </div>
      </div>
    </>
  );
}
