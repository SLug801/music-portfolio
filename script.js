// ===== 네비게이션: 스크롤 시 배경, 모바일 토글 =====
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

// 스크롤 스파이: 현재 보고 있는 섹션의 메뉴를 하이라이트
const sections = Array.from(document.querySelectorAll('section[id]'));
const spyLinks = Array.from(navLinks.querySelectorAll('a'));

function onScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 30);

  // 화면 위쪽 35% 지점을 기준선으로, 그 위에 시작된 섹션 중 가장 마지막을 현재 섹션으로
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

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// 메뉴 링크 클릭 시 모바일 메뉴 닫기
navLinks.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== 오디오 플레이어 =====
// 각 트랙 카드의 재생 버튼 data-audio 속성에 음원 경로를 넣으면 재생됩니다.
let currentAudio = null;
let currentBtn = null;

document.querySelectorAll('.track__play').forEach((btn) => {
  btn.addEventListener('click', () => {
    const src = btn.dataset.audio;

    // 음원이 아직 등록되지 않은 경우 안내
    if (!src) {
      alert('이 트랙에는 아직 음원이 연결되지 않았습니다.\nindex.html의 data-audio 속성에 음원 파일 경로를 넣어주세요.');
      return;
    }

    // 이미 재생 중인 버튼을 다시 누르면 정지
    if (currentBtn === btn && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      btn.textContent = '▶';
      btn.classList.remove('playing');
      return;
    }

    // 다른 트랙이 재생 중이면 정지
    if (currentAudio) {
      currentAudio.pause();
      if (currentBtn) { currentBtn.textContent = '▶'; currentBtn.classList.remove('playing'); }
    }

    // 새 트랙 재생
    currentAudio = new Audio(src);
    currentBtn = btn;
    currentAudio.play();
    btn.textContent = '❚❚';
    btn.classList.add('playing');

    currentAudio.addEventListener('ended', () => {
      btn.textContent = '▶';
      btn.classList.remove('playing');
    });
  });
});

// ===== 문의 폼: mailto로 전송 =====
const form = document.getElementById('contactForm');
const CONTACT_EMAIL = 'hello@example.com'; // ← 실제 이메일로 변경하세요

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = data.get('name');
  const email = data.get('email');
  const type = data.get('type');
  const message = data.get('message');

  const subject = `[외주 문의] ${type} - ${name}`;
  const body =
    `이름/회사명: ${name}\n` +
    `회신 이메일: ${email}\n` +
    `프로젝트 유형: ${type}\n\n` +
    `내용:\n${message}`;

  window.location.href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
