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
})();
