$(document).ready(function(){
	var element = $('meta[name="active-menu"]').attr('content');
	if (element) {
		$('#' + element).addClass('active');
	}

	var $yearSpan = $('#footer-year');
	if ($yearSpan.length) {
		$yearSpan.text(new Date().getFullYear());
	}

	$('#contact-form').on('submit', function (e) {
		e.preventDefault();
		$('#contact-success').fadeIn(200);
		this.reset();
	});
});
