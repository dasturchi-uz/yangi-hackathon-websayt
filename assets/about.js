document.addEventListener('DOMContentLoaded', function () {

  document.querySelectorAll('.tab-toggle button[data-track]').forEach(function (button) {
    button.addEventListener('click', function () {
      const track = this.dataset.track;
      document.querySelectorAll('.tab-toggle button').forEach(function (btn) {
        btn.classList.toggle('active', btn === button);
      });
      document.querySelectorAll('.subject-grid').forEach(function (grid) {
        grid.classList.toggle('active', grid.dataset.grid === track);
      });
    });
  });

  document.querySelectorAll('.map-toggle button[data-map]').forEach(function (button) {
    button.addEventListener('click', function () {
      const map = this.dataset.map;
      document.querySelectorAll('.map-toggle button').forEach(function (btn) {
        btn.classList.toggle('active', btn === button);
      });
      document.querySelectorAll('.map-pane').forEach(function (pane) {
        pane.classList.toggle('active', pane.dataset.pane === map);
      });
    });
  });

  const copyBtn = document.getElementById('copyCoords');
  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText('40.355617, 71.767729').then(function () {
        window.hitsToast('Koordinatalar nusxalandi', 'success');
      }, function () {
        window.hitsToast('Nusxalashda xato yuz berdi', 'danger');
      });
    });
  }
});