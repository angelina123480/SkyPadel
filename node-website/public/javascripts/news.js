$(document).ready(function () {
  $('.news-tab').on('click', function () {
    var filter = $(this).data('filter');

    $('.news-tab').removeClass('active');
    $(this).addClass('active');

    $('.news-grid-external .news-col').each(function () {
      var match = filter === 'all' || $(this).data('category') === filter;
      $(this).toggle(match);
    });
  });
});
