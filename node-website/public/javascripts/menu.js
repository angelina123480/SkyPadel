$(document).ready(function(){
	var element = $('meta[name="active-menu"]').attr('content');
	if (element) {
		$('#' + element).addClass('active');
	}
});
