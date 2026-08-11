(function () {
  var cardInput = document.getElementById('cardNumber');
  if (cardInput) {
    cardInput.addEventListener('input', function () {
      var digits = cardInput.value.replace(/\D/g, '').slice(0, 19);
      cardInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  var expiryInput = document.getElementById('expiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', function () {
      var digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      expiryInput.value = digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
    });
  }

  var cvvInput = document.getElementById('cvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', function () {
      cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  // --- Pick governorate from the map instead of the dropdown ---
  var pickerMap = document.querySelector('.zone-map-picker');
  var citySelect = document.getElementById('city');
  if (pickerMap && citySelect) {
    pickerMap.addEventListener('click', function (e) {
      var shape = e.target.closest('.zone-pick');
      if (!shape) return;
      var name = shape.dataset.zoneName;
      if (shape.dataset.enabled !== 'true') {
        if (window.SkyToast) window.SkyToast.show("We don't deliver to " + name + ' yet.');
        return;
      }
      citySelect.value = name;
      citySelect.dispatchEvent(new Event('change', { bubbles: true }));
      pickerMap.querySelectorAll('.zone-pick').forEach(function (el) {
        el.classList.toggle('zone-selected', el === shape);
      });
    });
  }
})();
