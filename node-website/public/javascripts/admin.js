(function () {
  function showBanner(containerId, message, isError) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="' + (isError ? 'form-error-banner' : 'form-success-banner') + '">' + message + '</div>';
  }

  function clearFieldErrors(form) {
    form.querySelectorAll('[data-error-for]').forEach(function (el) { el.textContent = ''; });
  }

  function applyFieldErrors(form, errors) {
    Object.keys(errors).forEach(function (key) {
      var el = form.querySelector('[data-error-for="' + key + '"]');
      if (el) el.textContent = errors[key];
    });
  }

  // --- Product create/edit form ---
  var productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFieldErrors(productForm);
      var mode = productForm.dataset.mode;
      var url = mode === 'edit' ? '/admin/products/' + productForm.dataset.id : '/admin/products';
      var method = mode === 'edit' ? 'PUT' : 'POST';
      var formData = new FormData(productForm);

      fetch(url, { method: method, body: formData })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (!result.data.ok) {
            if (result.data.errors) applyFieldErrors(productForm, result.data.errors);
            showBanner('product-form-banner', 'Please fix the errors below.', true);
            return;
          }
          window.location.href = result.data.redirect;
        })
        .catch(function () {
          showBanner('product-form-banner', 'Something went wrong saving the product.', true);
        });
    });
  }

  // --- Delete product ---
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.delete-product');
    if (!btn) return;
    if (!confirm('Unlist this product from the shop?')) return;
    fetch('/admin/products/' + btn.dataset.id, { method: 'DELETE' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          var row = document.querySelector('[data-product-row="' + btn.dataset.id + '"]');
          if (row) row.remove();
          showBanner('product-list-banner', 'Product unlisted.', false);
        }
      });
  });

  // --- Order status update ---
  var statusForm = document.getElementById('order-status-form');
  if (statusForm) {
    statusForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = statusForm.querySelector('select[name="status"]').value;
      fetch('/admin/orders/' + statusForm.dataset.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.ok) {
            showBanner('order-status-banner', 'Order status updated to "' + status + '".', false);
          } else {
            showBanner('order-status-banner', data.error || 'Could not update status.', true);
          }
        });
    });
  }

  // --- Promote/demote/delete confirms already use native confirm() via inline onsubmit ---
})();
