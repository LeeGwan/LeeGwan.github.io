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

// Posts 드롭다운: 클릭하면 열리고, 다시 누르면 닫힘 (페이지 이동 없음)
var drop = document.getElementById('postsDrop');
if (drop) {
  var toggle = drop.querySelector('.nav-drop-toggle');
  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    drop.classList.toggle('open');
  });
  // 메뉴 바깥을 클릭하면 닫힘
  document.addEventListener('click', function (e) {
    if (!drop.contains(e.target)) drop.classList.remove('open');
  });
}
