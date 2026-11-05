/* pestañas de la carta de servicios en la portada */
(function () {
  var tabs = document.querySelectorAll('.svc-tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) { x.classList.remove('on'); });
      t.classList.add('on');
      document.querySelectorAll('.svc-panel').forEach(function (p) {
        p.classList.toggle('on', p.dataset.panel === t.dataset.tab);
      });
    });
  });
})();
