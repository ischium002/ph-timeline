// 阻挡顺手复制/右键转载。挡不住技术型爬虫（内容本来就要发给浏览器），
// 真正防抓取靠 robots.txt；这个文件只处理"人类读者随手复制"这一层。
(function () {
  var style = document.createElement('style');
  style.textContent = [
    '*{',
    '  -webkit-user-select: none;',
    '  -moz-user-select: none;',
    '  -ms-user-select: none;',
    '  user-select: none;',
    '}',
    '.no-copy-toast{',
    '  position: fixed; left: 50%; bottom: 8vh; transform: translateX(-50%) translateY(12px);',
    '  padding: 10px 18px; border-radius: 999px; background: rgba(20,20,20,.86); color: #eee;',
    '  font: 13px/1.4 -apple-system, "Noto Serif SC", sans-serif; letter-spacing: .02em;',
    '  opacity: 0; pointer-events: none; transition: opacity .25s ease, transform .25s ease; z-index: 9999;',
    '}',
    '.no-copy-toast.show{ opacity: 1; transform: translateX(-50%) translateY(0); }',
  ].join('\n');
  document.head.appendChild(style);

  var toastTimer = null;
  function toast(msg) {
    var el = document.querySelector('.no-copy-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'no-copy-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1600);
  }

  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    toast('还是不了吧');
  });
  document.addEventListener('copy', function (e) {
    e.preventDefault();
    toast('还是不了吧');
  });
  document.addEventListener('cut', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
})();
