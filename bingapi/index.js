var bingClientTTS = new BingSpeech.TTSClient("Your Key");

var total;
var client;

function getRandom(){return Math.ceil(Math.random()* 20);}

function createSum(){
	var randomNum1 = getRandom(),
			randomNum2 = getRandom();
	total =randomNum1 + randomNum2;
	$( "#question" ).text( randomNum1 + " + " + randomNum2 + "=" );
    

  $("#ans").val('');
  checkInput();
}


$('#speakBtn').click(function(event){
     
       event.preventDefault();
      var msg =  document.getElementById('question').innerHTML; 
  
   //console.log(msg);
     
      bingClientTTS.synthesize(msg, BingSpeech.SupportedLocales.enGB_Female);
 
    })
function checkInput(){
		var input = $("#ans").val(), 
    	slideSpeed = 200,
      hasInput = !!input, 
      valid = hasInput && input == total;
	  
    $('#message').toggle(!hasInput);
    $('button[type=submit]').prop('disabled', !valid);  
	 
	 $('#ok').prop('disabled', !valid);
    $('#success').toggle(valid);
    $('#fail').toggle(hasInput && !valid);
}

$(document).ready(function(){
	//create initial sum
	createSum();
	// On "reset button" click, generate new random sum
	$('button[type=reset]').click(createSum);
	// On user input, check value
	$( "#ans" ).on('input', checkInput);
});


function setText(text) {
    document.getElementById("ans").value += text;
}
function setTex(text) {
    document.getElementById("name").value += text;
}



$('#create').click(function(event){
  
       event.preventDefault();
          
    client = new BingSpeech.RecognitionClient("Your key");
    client.startMicAndContinuousRecognition();
    client.onFinalResponseReceived = function (response) {
		var newstring = response.split('.').join('');
		
		//console.log(newstring);
        setTex(newstring);
       
		client.endMicAndContinuousRecognition();
    }
	

    client.onError = function (code, requestId) {
        console.log("<Error with request n°" + requestId + ">");
    }

  })


$('#createBtn').click(function(event){
     
       event.preventDefault();
          
    client = new BingSpeech.RecognitionClient("Your Key");
    client.startMicAndContinuousRecognition();
    client.onFinalResponseReceived = function (response) {
		var newstring = response.split('.').join('');
		
		newstring = parseInt(newstring);
		//console.log(typeof newstring);
        setText(newstring);
        checkInput();
		client.endMicAndContinuousRecognition();
    }
	

    client.onError = function (code, requestId) {
        console.log("<Error with request n°" + requestId + ">");
    }
 
    })
	

