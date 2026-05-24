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
