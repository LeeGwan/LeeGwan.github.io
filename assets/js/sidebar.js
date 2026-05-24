// 사이드바 그룹 접기/펴기
document.querySelectorAll('.side-group-head').forEach(function (btn) {
  btn.addEventListener('click', function () {
    btn.parentElement.classList.toggle('open');
  });
});

// 모바일 햄버거 메뉴
var burger = document.getElementById('navBurger');
var links = document.getElementById('navLinks');
if (burger && links) {
  burger.addEventListener('click', function () {
    links.classList.toggle('show');
  });
}

// Posts 드롭다운: 모바일/클릭 토글 (데스크톱은 hover로도 열림)
var drop = document.getElementById('postsDrop');
if (drop) {
  var toggle = drop.querySelector('.nav-drop-toggle');
  toggle.addEventListener('click', function (e) {
    // 좁은 화면에서는 첫 클릭에 메뉴만 펼치고 이동은 막음
    if (window.innerWidth <= 860) {
      e.preventDefault();
      drop.classList.toggle('open');
    }
  });
  document.addEventListener('click', function (e) {
    if (!drop.contains(e.target)) drop.classList.remove('open');
  });
}
