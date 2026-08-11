(function () {
  function setBadge(count) {
    var badge = document.getElementById('cart-count');
    if (!badge) return;
    badge.textContent = count;
    badge.classList.add('cart-badge-pop');
    setTimeout(function () { badge.classList.remove('cart-badge-pop'); }, 300);
  }

  function postJson(url, method, body) {
    return fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Something went wrong.');
        return data;
      });
    });
  }

  function addToCart(productId, quantity, productName) {
    return postJson('/cart/add', 'POST', { productId: productId, quantity: quantity }).then(function (data) {
      setBadge(data.cartCount);
      if (window.SkyToast) window.SkyToast.show((productName || data.product.name) + ' added to cart');
      return data;
    }).catch(function (err) {
      if (window.SkyToast) window.SkyToast.show(err.message);
      throw err;
    });
  }

  // --- Add-to-cart buttons anywhere on the site (shop grid, home featured, related products) ---
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.add-to-cart');
    if (!btn || btn.disabled) return;
    e.preventDefault();
    addToCart(Number(btn.dataset.productId), 1, btn.dataset.productName);
  });

  // --- Generic quantity stepper (product detail page + cart page) ---
  document.addEventListener('click', function (e) {
    var incBtn = e.target.closest('.qty-increase');
    var decBtn = e.target.closest('.qty-decrease');
    var btn = incBtn || decBtn;
    if (!btn) return;
    var wrap = btn.closest('.qty-selector');
    var input = wrap.querySelector('input');
    var max = Number(input.max) || Infinity;
    var min = Number(input.min) || 1;
    var value = Number(input.value) || min;
    value = incBtn ? Math.min(max, value + 1) : Math.max(min, value - 1);
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // --- Product detail page: Add to Cart / Buy Now ---
  var addForm = document.getElementById('product-add-form');
  if (addForm) {
    addForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var productId = Number(addForm.dataset.productId);
      var quantity = Number(addForm.querySelector('input[name="quantity"]').value) || 1;
      var isBuyNow = e.submitter && e.submitter.classList.contains('buy-now-form');
      addToCart(productId, quantity).then(function () {
        if (isBuyNow) window.location.href = '/checkout';
      });
    });
  }

  // --- Cart page: live quantity updates & remove ---
  var cartLines = document.getElementById('cart-lines');
  if (cartLines) {
    cartLines.addEventListener('change', function (e) {
      if (!e.target.classList.contains('cart-qty-input')) return;
      var line = e.target.closest('.cart-line');
      var productId = Number(line.dataset.productId);
      var quantity = Number(e.target.value);
      postJson('/cart/update', 'PUT', { productId: productId, quantity: quantity }).then(function (data) {
        applyCartTotals(data);
        if (data.itemCount === 0) {
          window.location.reload();
          return;
        }
        var unitPrice = Number(line.dataset.unitPrice);
        line.querySelector('.cart-line-price').textContent = '$' + (unitPrice * quantity).toFixed(2);
      }).catch(function (err) {
        if (window.SkyToast) window.SkyToast.show(err.message || 'Could not update quantity.');
      });
    });

    cartLines.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('.cart-line-remove');
      if (!removeBtn) return;
      var line = removeBtn.closest('.cart-line');
      var productId = Number(line.dataset.productId);
      // productId is sent as a query param rather than a DELETE body — bodies on
      // DELETE requests are unreliable across some browsers/proxies.
      fetch('/cart/remove?productId=' + productId, { method: 'DELETE' })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Could not remove item.');
            return data;
          });
        })
        .then(function (data) {
          line.remove();
          applyCartTotals(data);
          setBadge(data.cartCount);
          if (data.itemCount === 0) window.location.reload();
        })
        .catch(function (err) {
          if (window.SkyToast) window.SkyToast.show(err.message || 'Could not remove item.');
        });
    });
  }

  function applyCartTotals(data) {
    if (!data.totals) return;
    setBadge(data.cartCount);
    var subtotalEl = document.getElementById('summary-subtotal');
    var discountEl = document.getElementById('summary-discount');
    var shippingEl = document.getElementById('summary-shipping');
    var totalEl = document.getElementById('summary-total');
    if (subtotalEl) subtotalEl.textContent = '$' + data.totals.subtotal.toFixed(2);
    if (discountEl) discountEl.textContent = '−$' + data.totals.discountTotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = data.totals.shippingTotal === 0 ? 'Free' : '$' + data.totals.shippingTotal.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + data.totals.total.toFixed(2);
  }

})();
