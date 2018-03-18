var thingsToRead = [
	"Your name with Address and nearest Landmark"
	
];

var sendtosql;

function enrollNewProfile(){
	navigator.getUserMedia({audio: true}, function(stream){
		console.log('I\'m listening');
		console.log('Say your name with Address \n and nearest Landmark');
		onMediaSuccess(stream, createProfile, 15);
	}, onMediaError);
}

function enrollNewVerificationProfile(){
	navigator.getUserMedia({audio: true}, function(stream){
		console.log('I\'m listening... say one of the predefined phrases...');
		onMediaSuccess(stream, createVerificationProfile, 4);
	}, onMediaError);
}

function startListeningForIdentification(){
	if (profileIds.length > 0 ){
		console.log('I\'m listening');
		console.log('Tell us something about yourself');
		navigator.getUserMedia({audio: true}, function(stream){onMediaSuccess(stream, identifyProfile, 10)}, onMediaError);
	} else {
		console.log('No profiles enrolled yet! Click the other button...');
	}
}

function startListeningForIdentification1(){
	
		console.log('I\'m listening');
		console.log('Tell us something about yourself');
		navigator.getUserMedia({audio: true}, function(stream){onMediaSuccess(stream, identifyProfile1, 10)}, onMediaError);
	
}

function startListeningForVerification(){
	if (verificationProfile.profileId){
		console.log('I\'m listening... say your predefined phrase...');
		navigator.getUserMedia({audio: true}, function(stream){onMediaSuccess(stream, verifyProfile, 4)}, onMediaError);
	} else {
		console.log('No verification profile enrolled yet! Click the other button...');
	}
}

function onMediaError(e) {
    console.error('media error', e);
}

function identifyProfile(blob){
	//addAudioPlayer(blob);

	var Ids = profileIds.map(x => x.profileId).join();
	
	const identify = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/identify?identificationProfileIds=' + Ids + '&shortAudio=true';
   
	var request = new XMLHttpRequest();
	request.open("POST", identify, true);
	
	request.setRequestHeader('Content-Type','application/json');
	request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
  
	request.onload = function () {
		console.log('identifying profile');
		console.log(request.responseText);
		var location = request.getResponseHeader('Operation-Location');
		console.log(location);

		if (location!=null) {
			pollForIdentification(location);
		} else {
			console.log('Ugh. I can\'t poll, it\'s all gone wrong.');
		}
	};
  
	request.send(blob);
}





function getallprofiles(){
	
	
	const identify = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/identificationProfiles';
    console.log(identify);
	var request = new XMLHttpRequest();
	request.open("GET", identify, true);
	
	request.setRequestHeader('Content-Type','application/json');
	request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
  
	request.onload = function () {
		console.log('identifying profile');
		console.log(request.responseText);
	

	};
     
	 request.send();

}

function verifyProfile(blob){
	addAudioPlayer(blob);

	var verify = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/verify?verificationProfileId=' + verificationProfile.profileId;
  
	var request = new XMLHttpRequest();
	request.open("POST", verify, true);
	
	request.setRequestHeader('Content-Type','application/json');
	request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
  
	request.onload = function () {
		console.log('verifying profile');
		console.log(request.responseText);		
	};
  
	request.send(blob);
}




function createProfile(blob){
	//addAudioPlayer(blob);

	var create = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/identificationProfiles';

	var request = new XMLHttpRequest();
	request.open("POST", create, true);

	request.setRequestHeader('Content-Type','application/json');
	request.setRequestHeader('Ocp-Apim-Subscription-Key', key);

	request.onload = function () {
		console.log('creating profile');
		//console.log(request.responseText);

		var json = JSON.parse(request.responseText);
		var profileId = json.identificationProfileId;

		// Now we can enrol this profile using the profileId
		enrollProfileAudio(blob, profileId);
	};

	request.send(JSON.stringify({ 'locale' :'en-us'}));
}

function enrollProfileAudio(blob, profileId){
  const enroll = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/identificationProfiles/'+profileId+'/enroll?shortAudio=true';

  var request = new XMLHttpRequest();
  request.open("POST", enroll, true);
  
  request.setRequestHeader('Content-Type','multipart/form-data');
  request.setRequestHeader('Ocp-Apim-Subscription-Key', key);

  request.onload = function () {
  	console.log('Registering');
    //console.log(request.responseText);
    var location = request.getResponseHeader('Operation-Location');

    //console.log(location);

	if (location!=null) {
    	pollForEnrollment(location, profileId, blob);
	} else {
		console.log('Ugh. I can\'t poll, it\'s all gone wrong.');
	}
  };

  request.send(blob);
}

function enrollProfileAudioForVerification(blob, profileId){
	addAudioPlayer(blob);

	if (profileId == undefined)
	{
		console.log("Failed to create a profile for verification; try again");
		return;
	}
	
	const enroll = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/verificationProfiles/'+profileId+'/enroll';
  
	var request = new XMLHttpRequest();
	request.open("POST", enroll, true);
	
	request.setRequestHeader('Content-Type','multipart/form-data');
	request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
  
	request.onload = function () {
		console.log('enrolling');
		console.log(request.responseText);

		var json = JSON.parse(request.responseText);
		verificationProfile.remainingEnrollments = json.remainingEnrollments;
		if (verificationProfile.remainingEnrollments == 0) 
		{
			console.log("Verification should be enabled!")
		}
	};
  
	request.send(blob);
  }


  function pollForEnrollment(location, profileId, blob){
	var success = false;
	var enrolledInterval;

	enrolledInterval = setInterval(function()
	{
		var request = new XMLHttpRequest();
		request.open("GET", location, true);

		request.setRequestHeader('Content-Type','multipart/form-data');
		request.setRequestHeader('Ocp-Apim-Subscription-Key', key);

		request.onload = function()
		{
			console.log('getting status');
			//console.log(request.responseText);

			var json = JSON.parse(request.responseText);
			if (json.status == 'succeeded' && json.processingResult.enrollmentStatus == 'Enrolled')
			{
				clearInterval(enrolledInterval);
				console.log('enrollment complete!');
				//var name = window.prompt('Who was that talking?');
				var name =  document.getElementById('name').value;
				//console.log(name);
				//blob = URL.createObjectURL(blob);
				//blob.toString;
				//console.log(blob);
				
				profileIds.push(new Profile(name, profileId));
				//console.log(profileId + ' is now mapped to ' + name);
				//console.log(profileIds);
				sendtosql = JSON.stringify(profileIds);
				var reader = new FileReader();
                 reader.readAsDataURL(blob); 
                 reader.onloadend = function() {
                base64data = reader.result;                
                 //console.log(base64data);
			    
				 
				 tophp(sendtosql, base64data);
				 
                 }
				 
				 
				console.log(sendtosql);
				console.log(blob);
				
			}
			else if(json.status == 'succeeded' && json.processingResult.remainingEnrollmentSpeechTime > 0) {
				clearInterval(enrolledInterval);
				console.log('That audio wasn\'t long enough to use');
			}
			else 
			{			
				console.log('Not done yet..');
				console.log(json);
			}
		};

		request.send();
	}, 4000);
}

function tophp(sendtosql, base64data) {
	console.log('ok');
	console.log(base64data);
		$.ajax({
    //data: 'orderid=' + sendtosql,
	data: 'orderid=' + sendtosql + '&blob=' + encodeURIComponent(base64data),
	//data: {'orderid: sendtosql , blob:base64data},
    cache: false,
	processData: false, 
	contentType: "application/x-www-form-urlencoded",
    url: 'http://localhost/Voice/view_notification.php',
    method: 'POST', // or GET
    success: function(msg) {
           alert(msg);
			//location.href = "http://localhost/Voice/login.html"
    }
});
		//console.log(sendtosql);
	 }

function pollForIdentification(location){
	var success = false;
	var enrolledInterval;

	enrolledInterval = setInterval(function()
	{
		var request = new XMLHttpRequest();
		request.open("GET", location, true);

		request.setRequestHeader('Content-Type','multipart/form-data');
		request.setRequestHeader('Ocp-Apim-Subscription-Key', key);

		request.onload = function()
		{
			console.log('getting status');
			//console.log(request.responseText);

			var json = JSON.parse(request.responseText);
			if (json.status == 'succeeded')
			{
				clearInterval(enrolledInterval);
				var speaker = profileIds.filter(function(p){return p.profileId == json.processingResult.identifiedProfileId});
				
				if (speaker != null && speaker.length > 0){
					console.log('I think ' + speaker[0].name + ' was talking');
				} else {
					console.log('I couldn\'t tell who was talking. So embarrassing.');
				}
			}
			else 
			{			
				console.log('still thinking..');
				console.log(json);
			}
		};

		request.send();
	}, 2000);
}

function createVerificationProfile(blob){
	
	if (verificationProfile && verificationProfile.profileId) 
	{
		if (verificationProfile.remainingEnrollments == 0)
		{
			console.log("Verification enrollment already completed");
			return;
		} 
		else 
		{
			console.log("Verification enrollments remaining: " + verificationProfile.remainingEnrollments);
			enrollProfileAudioForVerification(blob, verificationProfile.profileId);
			return;
		}
	}

	var create = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/verificationProfiles';

	var request = new XMLHttpRequest();
		request.open("POST", create, true);
		request.setRequestHeader('Content-Type','application/json');
		request.setRequestHeader('Ocp-Apim-Subscription-Key', key);

		request.onload = function () {
			var json = JSON.parse(request.responseText);
			var profileId = json.verificationProfileId;
			verificationProfile.profileId = profileId;

			// Now we can enrol this profile with the profileId
			enrollProfileAudioForVerification(blob, profileId);
		};

	request.send(JSON.stringify({ 'locale' :'en-us'}));
}

function BurnItAll(mode = 'identification'){
	// brute force delete everything - keep retrying until it's empty
	var listing = 'https://westus.api.cognitive.microsoft.com/spid/v1.0/' + mode + 'Profiles';
    console.log(listing);
	var request = new XMLHttpRequest();
	request.open("GET", listing, true);

	request.setRequestHeader('Content-Type','multipart/form-data');
	request.setRequestHeader('Ocp-Apim-Subscription-Key', key);

	request.onload = function () {
		var json = JSON.parse(request.responseText);
		for(var x in json){
			if (json[x][mode + 'ProfileId'] == undefined) {continue;}
			var request2 = new XMLHttpRequest();
			request2.open("DELETE", listing + '/'+ json[x][mode + 'ProfileId'], true);

			request2.setRequestHeader('Content-Type','multipart/form-data');
			request2.setRequestHeader('Ocp-Apim-Subscription-Key', key);
			request2.onload = function(){
				console.log(request2.responseText);
			};
			request2.send();
		}
	};

	request.send();
}

function addAudioPlayer(blob){	
	var url = URL.createObjectURL(blob);
	var log = document.getElementById('log');

	var audio = document.querySelector('#replay');
	if (audio != null) {audio.parentNode.removeChild(audio);}

	audio = document.createElement('audio');
	audio.setAttribute('id','replay');
	audio.setAttribute('controls','controls');

	var source = document.createElement('source');
	source.src = url;

	audio.appendChild(source);
	log.parentNode.insertBefore(audio, log);
}

// found on SO: vanilla javascript queystring management
var qs = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

var key = 'Your key';

// Speaker Recognition API profile configuration
var Profile = class { constructor (name, profileId) { this.name = name; this.profileId = profileId}};
var VerificationProfile = class { constructor (name, profileId) { this.name = name; this.profileId = profileId; this.remainingEnrollments = 3}};
var profileIds = [];
var verificationProfile = new VerificationProfile();

// Helper functions - found on SO: really easy way to dump the console logs to the page
(function () {
	var old = console.log;
	var logger = document.getElementById('log');
	var isScrolledToBottom = logger.scrollHeight - logger.clientHeight <= logger.scrollTop + 1;
    
	console.log = function () {
		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == 'object') {
				logger.innerHTML += '<div class="log">' + (JSON && JSON.stringify ? JSON.stringify(arguments[i], undefined, 2) : arguments[i]) + '<div><br />';
			} else {
				logger.innerHTML += '<div class="log">' + arguments[i] + '</div><br />';
			}
			if(isScrolledToBottom) logger.scrollTop = logger.scrollHeight - logger.clientHeight;
		}
		old(...arguments);
	}
	console.error = console.log; 
})();