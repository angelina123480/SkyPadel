$(document).ready(function () {
  var $yearSpan = $('#footer-year');
  if ($yearSpan.length) {
    $yearSpan.text(new Date().getFullYear());
  }

  var $cartCount = $('#cart-count');
  var count = 0;

  $('.add-to-cart').on('click', function (e) {
    e.preventDefault();
    var bundleName = $(this).data('bundle') || 'Bundle';
    count += 1;
    $cartCount.text(count).addClass('cart-badge-pop');
    setTimeout(function () {
      $cartCount.removeClass('cart-badge-pop');
    }, 300);
    showToast(bundleName + ' added to cart');
  });

  $('#contact-form').on('submit', function (e) {
    e.preventDefault();
    $('#contact-success').fadeIn(200);
    this.reset();
  });

  function showToast(message) {
    var $toast = $('<div class="sky-toast"></div>').text(message);
    $('body').append($toast);
    setTimeout(function () {
      $toast.addClass('sky-toast-visible');
    }, 10);
    setTimeout(function () {
      $toast.removeClass('sky-toast-visible');
      setTimeout(function () {
        $toast.remove();
      }, 300);
    }, 2200);
  }
});
