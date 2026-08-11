(function () {
  function show(message) {
    var toast = document.createElement('div');
    toast.className = 'sky-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('sky-toast-visible'); }, 10);
    setTimeout(function () {
      toast.classList.remove('sky-toast-visible');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2400);
  }

  window.SkyToast = { show: show };
})();
