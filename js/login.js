setTimeout(function () {
	$('.email > input').focus();
}, 300);

$('.email > input').on('keydown', function (event) {
	if (event.which === 13 || event.keyCode === 13) {
		$('.email > input').blur();
		$('.next').click();
	}
});

$('.password > input').on('keydown', function (event) {
	if (event.which === 13 || event.keyCode === 13) {
		$('.login').click();
	}
});

$('.next').on('click', function (event) {
	var emailInput = $('.email > input').val();
	//if (validateEmail(emailInput)) {
	if (emailInput) {
		event.preventDefault();
		$('.inputs').addClass('shift');
		$('.back').addClass('active-back');
		$('.email > input').css({
			'border': '1px solid #cccccc'
		});
		$('.warning').empty();
		setTimeout(function () {
			$('.password > input').focus();
		}, 400);
	} else {
		event.preventDefault();
		$('.warning').empty();
		$('.email > input').css({
			'border': '1px solid red'
		});
		$('.warning').append('Please Enter Your Name');
	}
});

$('.back').on('click', function (event) {
	event.preventDefault();
	$('.inputs').removeClass('shift');
	$('.back').removeClass('active-back');
	setTimeout(function () {
		$('.email > input').focus();
	}, 300);
});

$('.login').on('click', function (event) {
	event.preventDefault();
	
	//$('form').empty();
	
	$('form').append('<div class="loader"></div>');
	
	setTimeout(function () {
		$('.back').fadeOut(500, function() {
                $(this).remove();

            });
			$('p').fadeOut(500, function() {
                $(this).remove();

            });
			$('h3').fadeOut(500, function() {
                $(this).remove();

            });
			$('.login').fadeOut(500, function() {
                $(this).remove();

            });
		enrollNewProfile();
		
	});

});

//var validateEmail = function validateEmail(email) {
//	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//	return re.test(email);
//};