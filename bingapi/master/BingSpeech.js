var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
// Based on Bing Speech API documentation
// https://www.microsoft.com/cognitive-services/en-us/speech-api/documentation/overview
var BingSpeech;
(function (BingSpeech) {
    (function (OutputFormat) {
        /**
        * Warning: not supported by Web Audio
        */
        OutputFormat[OutputFormat["Raw8khz8bit"] = 0] = "Raw8khz8bit";
        /**
        * Warning: not supported by Web Audio
        */
        OutputFormat[OutputFormat["Raw16khz16bit"] = 1] = "Raw16khz16bit";
        OutputFormat[OutputFormat["Riff8khz8bit"] = 2] = "Riff8khz8bit";
        /**
        * Default value
        */
        OutputFormat[OutputFormat["Riff16khz16bit"] = 3] = "Riff16khz16bit";
    })(BingSpeech.OutputFormat || (BingSpeech.OutputFormat = {}));
    var OutputFormat = BingSpeech.OutputFormat;
    ;
    (function (SupportedLocales) {
        SupportedLocales[SupportedLocales["arEG_Female"] = 0] = "arEG_Female";
        SupportedLocales[SupportedLocales["deDE_Female"] = 1] = "deDE_Female";
        SupportedLocales[SupportedLocales["deDE_Male"] = 2] = "deDE_Male";
        SupportedLocales[SupportedLocales["enAU_Female"] = 3] = "enAU_Female";
        SupportedLocales[SupportedLocales["enCA_Female"] = 4] = "enCA_Female";
        SupportedLocales[SupportedLocales["enGB_Female"] = 5] = "enGB_Female";
        SupportedLocales[SupportedLocales["enGB_Male"] = 6] = "enGB_Male";
        SupportedLocales[SupportedLocales["enIN_Male"] = 7] = "enIN_Male";
        SupportedLocales[SupportedLocales["enUS_Female"] = 8] = "enUS_Female";
        SupportedLocales[SupportedLocales["enUS_Male"] = 9] = "enUS_Male";
        SupportedLocales[SupportedLocales["esES_Female"] = 10] = "esES_Female";
        SupportedLocales[SupportedLocales["esES_Male"] = 11] = "esES_Male";
        SupportedLocales[SupportedLocales["esMX_Male"] = 12] = "esMX_Male";
        SupportedLocales[SupportedLocales["frCA_Female"] = 13] = "frCA_Female";
        SupportedLocales[SupportedLocales["frFR_Female"] = 14] = "frFR_Female";
        SupportedLocales[SupportedLocales["frFR_Male"] = 15] = "frFR_Male";
        SupportedLocales[SupportedLocales["itIT_Male"] = 16] = "itIT_Male";
        SupportedLocales[SupportedLocales["jaJP_Female"] = 17] = "jaJP_Female";
        SupportedLocales[SupportedLocales["jaJP_Male"] = 18] = "jaJP_Male";
        SupportedLocales[SupportedLocales["ptBR_Male"] = 19] = "ptBR_Male";
        SupportedLocales[SupportedLocales["ruRU_Female"] = 20] = "ruRU_Female";
        SupportedLocales[SupportedLocales["ruRU_Male"] = 21] = "ruRU_Male";
        SupportedLocales[SupportedLocales["zhCN_Female"] = 22] = "zhCN_Female";
        SupportedLocales[SupportedLocales["zhCN_Female2"] = 23] = "zhCN_Female2";
        SupportedLocales[SupportedLocales["zhCN_Male"] = 24] = "zhCN_Male";
        SupportedLocales[SupportedLocales["zhHK_Female"] = 25] = "zhHK_Female";
        SupportedLocales[SupportedLocales["zhHK_Male"] = 26] = "zhHK_Male";
        SupportedLocales[SupportedLocales["zhTW_Female"] = 27] = "zhTW_Female";
        SupportedLocales[SupportedLocales["zhTW_Male"] = 28] = "zhTW_Male";
    })(BingSpeech.SupportedLocales || (BingSpeech.SupportedLocales = {}));
    var SupportedLocales = BingSpeech.SupportedLocales;
    class Tools {
        /**
        * @param apiKey should be your Bing Speech API key
        * Note: The way to get api key:
        * https://www.microsoft.com/cognitive-services/en-us/subscriptions?productId=/products/Bing.Speech.Preview
        * Paid: https://portal.azure.com/#create/Microsoft.CognitiveServices/apitype/Bing.Speech/pricingtier/S0
        */
        constructor(apiKey) {
            this.authToken = "";
            this.canUseWebAudio = false;
            if (!apiKey) {
                throw "Please provide a valid Bing Speech API key";
            }
            this.apiKey = apiKey;
            try {
                if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
                    window.AudioContext = window.AudioContext || window.webkitAudioContext;
                    this.audioContext = new AudioContext();
                    this.canUseWebAudio = true;
                    // iOS requires a touch interaction before unlocking its web audio stack
                    if (/iPad|iPhone|iPod/.test(navigator.platform)) {
                        this._unlockiOSaudio();
                    }
                }
            }
            catch (e) {
                console.error("Cannot initialize Web Audio Context.");
            }
        }
        _unlockiOSaudio() {
            var unlockaudio = () => {
                var buffer = this.audioContext.createBuffer(1, 1, 22050);
                var source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);
                setTimeout(() => {
                    if ((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
                        window.removeEventListener('touchend', unlockaudio, false);
                    }
                }, 0);
            };
            window.addEventListener('touchend', unlockaudio, false);
        }
        checkAuthToken() {
            return __awaiter(this, void 0, void 0, function* () {
                var timeElapsed = (Date.now() - this._tokenTime) / 1000;
                // Doc: https://www.microsoft.com/cognitive-services/en-us/Speech-api/documentation/API-Reference-REST/BingVoiceRecognition says
                // that "the token has an expiry time of 10 minutes". Let's generate it after 500s to be secure. 
                if (this.authToken === "" || timeElapsed > 500) {
                    var newAuthToken = "";
                    var optionalHeaders = [{ name: "Ocp-Apim-Subscription-Key", value: this.apiKey },
                        // required for Firefox otherwise a CORS error is raised
                        { name: "Access-Control-Allow-Origin", value: "*" }];
                    try {
                        var resultsText = yield this.makeHttpRequest("POST", "https://api.cognitive.microsoft.com/sts/v1.0/issueToken", false, optionalHeaders);
                        newAuthToken = resultsText;
                        this._tokenTime = Date.now();
                        //console.log("New authentication token generated.");
                    }
                    catch (ex) {
                        console.error("Error issuing token. Did you provide a valid Bing Speech API key?");
                    }
                    this.authToken = newAuthToken;
                }
            });
        }
        makeHttpRequest(actionType, url, isArrayBuffer = false, optionalHeaders, dataToSend) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    var xhr = new XMLHttpRequest();
                    if (isArrayBuffer) {
                        xhr.responseType = 'arraybuffer';
                    }
                    xhr.onreadystatechange = function (event) {
                        if (xhr.readyState !== 4)
                            return;
                        if (xhr.status >= 200 && xhr.status < 300) {
                            if (!isArrayBuffer) {
                                resolve(xhr.responseText);
                            }
                            else {
                                resolve(xhr.response);
                            }
                        }
                        else {
                            reject(xhr.status);
                        }
                    };
                    try {
                        xhr.open(actionType, url, true);
                        if (optionalHeaders) {
                            optionalHeaders.forEach((header) => {
                                xhr.setRequestHeader(header.name, header.value);
                            });
                        }
                        if (dataToSend) {
                            xhr.send(dataToSend);
                        }
                        else {
                            xhr.send();
                        }
                    }
                    catch (ex) {
                        reject(ex);
                    }
                });
            });
        }
    }
    class Guid {
        static generateString() {
            return Guid.getRnd4HexOctet() + Guid.getRnd4HexOctet() + "-" + Guid.getRnd4HexOctet() + "-" + Guid.getRndGuidTimeHiAndVersionHex() + "-" + Guid.getRndGuidClockSeqHiAndReservedHex() + "-" + Guid.getRnd4HexOctet() + Guid.getRnd4HexOctet() + Guid.getRnd4HexOctet();
        }
        static generate16bitRnd() {
            return Math.random() * 0x10000 | 0;
        }
        static getRnd4HexOctet() {
            return ("0000" + Guid.generate16bitRnd().toString(16)).slice(-4);
        }
        static getRndGuidTimeHiAndVersionHex() {
            return (Guid.generate16bitRnd() & 0x0FFF | 0x4000).toString(16);
        }
        static getRndGuidClockSeqHiAndReservedHex() {
            return (Guid.generate16bitRnd() & 0x3FFF | 0x8000).toString(16);
        }
    }
    class RecognitionClient {
        /**
        * @param apiKey should be your Bing Speech API key
        * Note: The way to get api key:
        * https://www.microsoft.com/cognitive-services/en-us/subscriptions?productId=/products/Bing.Speech.Preview
        * Paid: https://portal.azure.com/#create/Microsoft.CognitiveServices/apitype/Bing.Speech/pricingtier/S0
        */
        constructor(apiKey, locale = "en-us") {
            this._actualRequests = [];
            this._waitingForAnswers = false;
            this._vad = null;
            this._continuous = false;
            this._audioStream = null;
            this._locale = "en-us";
            if (!apiKey) {
                throw "Please provide a valid Bing Speech API key";
            }
            this._tools = new Tools(apiKey);
            this._tools.checkAuthToken();
            this._locale = locale;
            navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;
            if (!navigator.getUserMedia) {
                throw "Sorry, your browser doesn't have microphone support.";
            }
        }
        startMicAndContinuousRecognition() {
            if (typeof window.VADRecord !== "undefined") {
                if (!this._continuous) {
                    this._continuous = true;
                    this._continueListening();
                }
            }
            else {
                console.warn("You need to reference vadrecord.js");
            }
        }
        endMicAndContinuousRecognition() {
            this._continuous = false;
            if (this._audioStream) {
                this._audioStream.getAudioTracks()[0].stop();
            }
            if (this.onVoiceEnded) {
                this.onVoiceEnded();
            }
            if (this.onNetworkActivityEnded) {
                this.onNetworkActivityEnded();
            }
            if (this._vad) {
                this._vad.dispose();
            }
        }
        _continueListening() {
            navigator.getUserMedia({ audio: true }, (stream) => {
                this._startVoiceDetection(stream);
            }, function (e) {
                console.log("No live audio input in this browser: " + e);
            });
        }
        _startVoiceDetection(stream) {
            this._audioStream = stream;
            var source = this._tools.audioContext.createMediaStreamSource(stream);
            var options = {
                source: source,
                voice_stop: (buffer) => {
                    if (this.onVoiceEnded) {
                        this.onVoiceEnded();
                    }
                    this.recognizeAudio(buffer, this._locale);
                },
                voice_start: () => {
                    if (this.onVoiceDetected) {
                        this.onVoiceDetected();
                    }
                }
            };
            this._vad = new window.VADRecord(options);
        }
        recognizeAudio(audio, locale) {
            return __awaiter(this, void 0, void 0, function* () {
                var requestId = Guid.generateString();
                var newRecognitionItem = { hasBeenProcessed: false, requestId: requestId, text: "", error: false };
                this._actualRequests.push(newRecognitionItem);
                if (this.onNetworkActivityStarted) {
                    this.onNetworkActivityStarted();
                }
                yield this._tools.checkAuthToken();
                var optionalHeaders;
                var response;
                var textAnswer;
                var error = false;
                optionalHeaders = [{ name: "Content-type", value: 'audio/wav; samplerate=16000' },
                    { name: "Authorization", value: "Bearer " + this._tools.authToken }];
                try {
                    var blob = new Blob([audio], { type: 'audio/wav' });
                    var requestParameters = "?scenarios=smd&appid=D4D52672-91D7-4C74-8AD8-42B1D98141A5&locale=" + this._locale + "&device.os=wp7&version=3.0&format=json&instanceid=b2c95ede-97eb-4c88-81e4-80f32d6aee54&requestid=" + requestId;
                    response = yield this._tools.makeHttpRequest("POST", "https://speech.platform.bing.com/recognize" + requestParameters, false, optionalHeaders, blob);
                    var parsedReponse = JSON.parse(response);
                    if (parsedReponse.header && parsedReponse.header.status !== "error") {
                        textAnswer = parsedReponse.header.name;
                    }
                    else {
                        error = true;
                        textAnswer = "!Error during recognition!";
                    }
                    let index = 0;
                    for (index = 0; index < this._actualRequests.length; index++) {
                        if (this._actualRequests[index].requestId === requestId) {
                            this._actualRequests[index].text = textAnswer;
                            this._actualRequests[index].hasBeenProcessed = true;
                            this._actualRequests[index].error = error;
                            break;
                        }
                    }
                    if (index === 0 && !this._waitingForAnswers) {
                        this._waitingForAnswers = true;
                        this._returnAnswer();
                    }
                }
                catch (ex) {
                    console.warn("Error while calling Bing Speech Recognition API: " + ex);
                    let index = 0;
                    for (index = 0; index < this._actualRequests.length; index++) {
                        if (this._actualRequests[index].requestId === requestId) {
                            break;
                        }
                    }
                    this._actualRequests.splice(index, 1);
                    if (this.onError) {
                        this.onError(ex, requestId);
                    }
                }
            });
        }
        _returnAnswer() {
            // Checking the next item to handle
            var recognitionItem = this._actualRequests[0];
            if (!recognitionItem) {
                return;
            }
            // If it's not ready yet, let's wait for 100ms more
            if (!recognitionItem.hasBeenProcessed) {
                window.setTimeout(() => {
                    this._returnAnswer();
                }, 100);
                return;
            }
            if (this.onFinalResponseReceived && !recognitionItem.error) {
                this.onFinalResponseReceived(recognitionItem.text);
            }
            if (this.onError && recognitionItem.error) {
                this.onError(recognitionItem.text, recognitionItem.requestId);
            }
            this._actualRequests.splice(0, 1);
            if (this._actualRequests.length > 0) {
                this._returnAnswer();
            }
            else {
                if (this.onNetworkActivityEnded) {
                    this.onNetworkActivityEnded();
                }
                this._waitingForAnswers = false;
            }
        }
    }
    BingSpeech.RecognitionClient = RecognitionClient;
    class TTSClient {
        /**
        * @param apiKey should be your Bing Speech API key
        * Note: The way to get api key:
        * https://www.microsoft.com/cognitive-services/en-us/subscriptions?productId=/products/Bing.Speech.Preview
        * Paid: https://portal.azure.com/#create/Microsoft.CognitiveServices/apitype/Bing.Speech/pricingtier/S0
        */
        constructor(apiKey, locale = SupportedLocales.enUS_Male) {
            // By default, doing multiple XHR in parallel to download Bing Speech generated wav
            // Set to false to serialize requests
            this.multipleXHR = true;
            this._waitingQueue = [];
            this._waitingQueueIndex = [];
            this._nbWaitingItems = 0;
            this._requestsInProgress = 0;
            if (!apiKey) {
                throw "Please provide a valid Bing Speech API key";
            }
            this._tools = new Tools(apiKey);
            this._globalLocale = locale;
        }
        synthesize(text, locale, callback, outputFormat = OutputFormat.Riff16khz16bit) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._tools.canUseWebAudio) {
                    console.error("You need Web Audio to use this API.");
                    return;
                }
                // Let's use that as a key to retrieve our item after the XHR callback
                let speechItemIndex = this._nbWaitingItems;
                this._nbWaitingItems++;
                var newSpeechItem = { isReadyToPlay: false, data: null, index: speechItemIndex, text: text, locale: locale, outputFormat: outputFormat, callback: callback };
                this._waitingQueue.push(newSpeechItem);
                this._waitingQueueIndex.push(speechItemIndex);
                if (this.multipleXHR || this._requestsInProgress == 0) {
                    this._getBingSpeechData(text, locale, outputFormat, speechItemIndex);
                }
            });
        }
        _getBingSpeechData(text, locale, outputFormat, speechItemIndex) {
            return __awaiter(this, void 0, void 0, function* () {
                this._requestsInProgress++;
                // ---- This whole code block is async ------
                yield this._tools.checkAuthToken();
                var optionalHeaders;
                var outputFormatValue = this._getFormatValue(outputFormat);
                optionalHeaders = [{ name: "Content-type", value: 'application/ssml+xml' },
                    { name: "X-Microsoft-OutputFormat", value: outputFormatValue },
                    { name: "Authorization", value: this._tools.authToken },
                    { name: "X-Search-AppIde", value: '07D3234E49CE426DAA29772419F436CA' },
                    { name: "X-Search-ClientID", value: '1ECFAE91408841A480F00935DC390960' },
                    { name: "Ocp-Apim-Subscription-Key", value: this._tools.apiKey }];
                var SSML = this.makeSSML(text, locale);
                try {
                    var blobReponse = yield this._tools.makeHttpRequest("POST", "https://speech.platform.bing.com/synthesize", true, optionalHeaders, SSML);
                }
                catch (ex) {
                    console.warn("Error while calling Bing Speech API. Ignoring this item: '" + text + "'");
                }
                this._requestsInProgress--;
                // ---------------------------------------------
                // In case of multiple XHR, we can reach this line by anytime
                // that's why we kept a copy of the speech item index to remember its order in the queue
                let indexInQueue = this._waitingQueueIndex.indexOf(speechItemIndex);
                let nextIndex = indexInQueue + 1;
                // If we had data back, it will be added to the queue to be decoded & play later
                if (blobReponse) {
                    this._waitingQueue[indexInQueue].data = blobReponse;
                    this._waitingQueue[indexInQueue].isReadyToPlay = true;
                }
                else {
                    this._waitingQueue.splice(indexInQueue, 1);
                    this._waitingQueueIndex.splice(indexInQueue, 1);
                    nextIndex--;
                }
                // If mono-XHR, let's at least launch the next XHR in background while playing this text
                if (!this.multipleXHR && (nextIndex < this._waitingQueue.length)) {
                    this._getBingSpeechData(this._waitingQueue[nextIndex].text, this._waitingQueue[nextIndex].locale, this._waitingQueue[nextIndex].outputFormat, this._waitingQueue[nextIndex].index);
                }
                if (!this._playing) {
                    this._play();
                }
            });
        }
        _play() {
            // Checking the next speech item to handle
            var speechItem = this._waitingQueue[0];
            if (!speechItem) {
                return;
            }
            // If it's not ready yet, let's wait for 100ms more
            if (!speechItem.isReadyToPlay) {
                window.setTimeout(() => {
                    this._play();
                }, 100);
                return;
            }
            // If it's ready to be decoded & played
            if (!this._playing) {
                this._playing = true;
                this._tools.audioContext.decodeAudioData(speechItem.data, (buffer) => {
                    var source = this._tools.audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(this._tools.audioContext.destination);
                    source.start(0);
                    source.onended = (evt) => {
                        this._playing = false;
                        this._waitingQueue.splice(0, 1);
                        this._waitingQueueIndex.splice(0, 1);
                        if (speechItem.callback) {
                            speechItem.callback();
                        }
                        if (this._waitingQueue.length > 0) {
                            this._play();
                        }
                        else {
                            this._nbWaitingItems = 0;
                        }
                    };
                });
            }
        }
        _getFormatValue(outputFormat) {
            var outputFormatValue;
            switch (outputFormat) {
                case OutputFormat.Raw16khz16bit:
                    outputFormatValue = "raw-16khz-16bit-mono-pcm";
                    break;
                case OutputFormat.Raw8khz8bit:
                    outputFormatValue = "raw-8khz-8bit-mono-mulaw";
                    break;
                case OutputFormat.Riff16khz16bit:
                    outputFormatValue = "riff-16khz-16bit-mono-pcm";
                    break;
                case OutputFormat.Riff8khz8bit:
                    outputFormatValue = "riff-8khz-8bit-mono-mulaw";
                    break;
                default:
                    outputFormatValue = "riff-16khz-16bit-mono-pcm";
            }
            return outputFormatValue;
        }
        makeSSML(text, localeAsked) {
            var locale;
            var gender;
            var supportedLocaleValue;
            var SSML = "<speak version='1.0' xml:lang=";
            if (!localeAsked) {
                localeAsked = this._globalLocale;
            }
            switch (localeAsked) {
                case SupportedLocales.arEG_Female:
                    locale = "'ar-eg'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ar-EG, Hoda)";
                    break;
                case SupportedLocales.deDE_Female:
                    locale = "'de-de'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)";
                    break;
                case SupportedLocales.deDE_Male:
                    locale = "'de-de'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (de-DE, Stefan, Apollo)";
                    break;
                case SupportedLocales.enAU_Female:
                    locale = "'en-au'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-AU, Catherine)";
                    break;
                case SupportedLocales.enCA_Female:
                    locale = "'en-ca'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-CA, Linda)";
                    break;
                case SupportedLocales.enGB_Female:
                    locale = "'en-gb'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-GB, Susan, Apollo)";
                    break;
                case SupportedLocales.enGB_Male:
                    locale = "'en-gb'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-GB, George, Apollo)";
                    break;
                case SupportedLocales.enIN_Male:
                    locale = "'en-in'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-IN, Ravi, Apollo)";
                    break;
                case SupportedLocales.enUS_Female:
                    locale = "'en-us'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)";
                    break;
                case SupportedLocales.enUS_Male:
                    locale = "'en-us'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)";
                    break;
                case SupportedLocales.esES_Female:
                    locale = "'es-es'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (es-ES, Laura, Apollo)";
                    break;
                case SupportedLocales.esES_Male:
                    locale = "'es-es'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (es-ES, Pablo, Apollo)";
                    break;
                case SupportedLocales.esMX_Male:
                    locale = "'es-mx'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (es-MX, Raul, Apollo)";
                    break;
                case SupportedLocales.frCA_Female:
                    locale = "'fr-ca'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (fr-CA, Caroline)";
                    break;
                case SupportedLocales.frFR_Female:
                    locale = "'fr-fr'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (fr-FR, Julie, Apollo)";
                    break;
                case SupportedLocales.frFR_Male:
                    locale = "'fr-fr'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (fr-FR, Paul, Apollo)";
                    break;
                case SupportedLocales.itIT_Male:
                    locale = "'it-it'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (it-IT, Cosimo, Apollo)";
                    break;
                case SupportedLocales.jaJP_Female:
                    locale = "'ja-jp'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ja-JP, Ayumi, Apollo)";
                    break;
                case SupportedLocales.jaJP_Male:
                    locale = "'ja-jp'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ja-JP, Ichiro, Apollo)";
                    break;
                case SupportedLocales.ptBR_Male:
                    locale = "'pt-br'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (pt-BR, Daniel, Apollo)";
                    break;
                case SupportedLocales.ruRU_Female:
                    locale = "'ru-ru'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ru-RU, Irina, Apollo)";
                    break;
                case SupportedLocales.ruRU_Male:
                    locale = "'ru-ru'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (ru-RU, Pavel, Apollo)";
                    break;
                case SupportedLocales.zhCN_Female:
                    locale = "'zh-cn'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-CN, HuihuiRUS)";
                    break;
                case SupportedLocales.zhCN_Female2:
                    locale = "'zh-cn'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-CN, Yaoyao, Apollo)";
                    break;
                case SupportedLocales.zhCN_Male:
                    locale = "'zh-cn'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-CN, Kangkang, Apollo)";
                    break;
                case SupportedLocales.zhHK_Female:
                    locale = "'zh-hk'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-HK, Tracy, Apollo)";
                    break;
                case SupportedLocales.zhHK_Male:
                    locale = "'zh-hk'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-HK, Danny, Apollo)";
                    break;
                case SupportedLocales.zhTW_Female:
                    locale = "'zh-tw'";
                    gender = "'Female'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-TW, Yating, Apollo)";
                    break;
                case SupportedLocales.zhTW_Male:
                    locale = "'zh-tw'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (zh-TW, Zhiwei, Apollo)";
                    break;
                default:
                    locale = "'en-us'";
                    gender = "'Male'";
                    supportedLocaleValue = "Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)";
            }
            SSML += locale + "><voice xml:lang=" + locale + " xml:gender=" + gender + " name='" + supportedLocaleValue + "'>" + `${text.encodeHTML()}` + "</voice></speak>";
            return SSML;
        }
    }
    BingSpeech.TTSClient = TTSClient;
})(BingSpeech || (BingSpeech = {}));
if (!String.prototype.encodeHTML) {
    String.prototype.encodeHTML = function () {
        return this.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };
}
(function (window) {
    var VADRecord = function (options) {
        var currentIndex = 0;
        var startIndex = 0;
        var recLength = 0;
        var recBuffers = [];
        var numChannels = 2;
        var sampleRate = null;
        function mergeBuffers(channelBuffer, recordingLength, startIndex, bufferLen) {
            var result = new Float32Array(recordingLength - startIndex);
            var offset = 0;
            var lng = channelBuffer.length;
            var startI = startIndex / bufferLen;
            for (var i = startI; i < lng; i++) {
                var buffer = channelBuffer[i];
                result.set(buffer, offset);
                offset += buffer.length;
            }
            return result;
        }
        function interleave(inputL, inputR) {
            let length = inputL.length + inputR.length;
            let result = new Float32Array(length);
            let index = 0, inputIndex = 0;
            while (index < length) {
                result[index++] = inputL[inputIndex];
                result[index++] = inputR[inputIndex];
                inputIndex++;
            }
            return result;
        }
        function writeUTFBytes(view, offset, string) {
            var lng = string.length;
            for (var i = 0; i < lng; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }
        function floatTo16BitPCM(output, offset, input) {
            for (let i = 0; i < input.length; i++, offset += 2) {
                let s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        }
        function encodeWAV(samples) {
            var buffer = new ArrayBuffer(44 + samples.length * 2);
            let view = new DataView(buffer);
            /* RIFF identifier */
            writeString(view, 0, 'RIFF');
            /* RIFF chunk length */
            view.setUint32(4, 36 + samples.length * 2, true);
            /* RIFF type */
            writeString(view, 8, 'WAVE');
            /* format chunk identifier */
            writeString(view, 12, 'fmt ');
            /* format chunk length */
            view.setUint32(16, 16, true);
            /* sample format (raw) */
            view.setUint16(20, 1, true);
            /* channel count */
            view.setUint16(22, numChannels, true);
            /* sample rate */
            view.setUint32(24, sampleRate, true);
            /* byte rate (sample rate * block align) */
            view.setUint32(28, sampleRate * 4, true);
            /* block align (channel count * bytes per sample) */
            view.setUint16(32, numChannels * 2, true);
            /* bits per sample */
            view.setUint16(34, 16, true);
            /* data chunk identifier */
            writeString(view, 36, 'data');
            /* data chunk length */
            view.setUint32(40, samples.length * 2, true);
            floatTo16BitPCM(view, 44, samples);
            return buffer;
        }
        function clear() {
            recLength = 0;
            recBuffers = [];
            initBuffers();
        }
        function initBuffers() {
            for (let channel = 0; channel < numChannels; channel++) {
                recBuffers[channel] = [];
            }
        }
        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }
        this.dispose = function () {
            if (this.options.source) {
                this.options.source.disconnect();
            }
            if (this.analyser) {
                this.analyser.disconnect();
            }
            if (this.scriptProcessorNode) {
                this.scriptProcessorNode.onaudioprocess = null;
                this.scriptProcessorNode.disconnect();
            }
            this.options.source = null;
            this.analyser = null;
            this.scriptProcessorNode = null;
        };
        this.buildAudioRecord = function () {
            let buffers = [];
            for (let channel = 0; channel < numChannels; channel++) {
                buffers.push(mergeBuffers(recBuffers[channel], recLength, startIndex, this.options.bufferLen));
            }
            var interleaved;
            if (numChannels === 2) {
                interleaved = interleave(buffers[0], buffers[1]);
            }
            else {
                interleaved = buffers[0];
            }
            var buffer = encodeWAV(interleaved);
            return buffer;
        };
        // Default options
        this.options = {
            fftSize: 512,
            bufferLen: 512,
            voice_stop: function () { },
            voice_start: function () { },
            smoothingTimeConstant: 0.99,
            energy_offset: 1e-8,
            energy_threshold_ratio_pos: 2,
            energy_threshold_ratio_neg: 0.5,
            energy_integration: 1,
            filter: [
                { f: 200, v: 0 },
                { f: 2000, v: 1 } // 200 -> 2k is 1
            ],
            source: null,
            context: null
        };
        // User options
        for (var option in options) {
            if (options.hasOwnProperty(option)) {
                this.options[option] = options[option];
            }
        }
        clear();
        // Require source
        if (!this.options.source)
            throw new Error("The options must specify a MediaStreamAudioSourceNode.");
        // Set this.options.context
        this.options.context = this.options.source.context;
        // Calculate time relationships
        this.hertzPerBin = this.options.context.sampleRate / this.options.fftSize;
        this.iterationFrequency = this.options.context.sampleRate / this.options.bufferLen;
        this.iterationPeriod = 1 / this.iterationFrequency;
        sampleRate = this.options.context.sampleRate;
        var DEBUG = false;
        if (DEBUG)
            console.log('Vad' +
                ' | sampleRate: ' + this.options.context.sampleRate +
                ' | hertzPerBin: ' + this.hertzPerBin +
                ' | iterationFrequency: ' + this.iterationFrequency +
                ' | iterationPeriod: ' + this.iterationPeriod);
        this.setFilter = function (shape) {
            this.filter = [];
            for (var i = 0, iLen = this.options.fftSize / 2; i < iLen; i++) {
                this.filter[i] = 0;
                for (var j = 0, jLen = shape.length; j < jLen; j++) {
                    if (i * this.hertzPerBin < shape[j].f) {
                        this.filter[i] = shape[j].v;
                        break; // Exit j loop
                    }
                }
            }
        };
        this.setFilter(this.options.filter);
        this.ready = {};
        this.vadState = false; // True when Voice Activity Detected
        // Energy detector props
        this.energy_offset = this.options.energy_offset;
        this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
        this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;
        this.voiceTrend = 0;
        this.voiceTrendMax = 10;
        this.voiceTrendMin = -10;
        this.voiceTrendStart = 5;
        this.voiceTrendEnd = -5;
        // Create analyser 
        this.analyser = this.options.context.createAnalyser();
        this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant; // 0.99;
        this.analyser.fftSize = this.options.fftSize;
        this.floatFrequencyData = new Float32Array(this.analyser.frequencyBinCount);
        // Setup local storage of the Linear FFT data
        this.floatFrequencyDataLinear = new Float32Array(this.floatFrequencyData.length);
        // Connect this.analyser
        this.options.source.connect(this.analyser);
        // Create ScriptProcessorNode
        this.scriptProcessorNode = this.options.context.createScriptProcessor(this.options.bufferLen, numChannels, numChannels);
        // Connect scriptProcessorNode (Theretically, not required)
        this.scriptProcessorNode.connect(this.options.context.destination);
        // Create callback to update/analyze floatFrequencyData
        var self = this;
        this.scriptProcessorNode.onaudioprocess = function (event) {
            self.analyser.getFloatFrequencyData(self.floatFrequencyData);
            self.update();
            self.store(event);
            self.monitor();
        };
        // Connect scriptProcessorNode
        this.options.source.connect(this.scriptProcessorNode);
        // log stuff
        this.logging = false;
        this.log_i = 0;
        this.log_limit = 100;
        this.triggerLog = function (limit) {
            this.logging = true;
            this.log_i = 0;
            this.log_limit = typeof limit === 'number' ? limit : this.log_limit;
        };
        this.log = function (msg) {
            if (this.logging && this.log_i < this.log_limit) {
                this.log_i++;
                console.log(msg);
            }
            else {
                this.logging = false;
            }
        };
        this.store = function (event) {
            for (var channel = 0; channel < numChannels; channel++) {
                recBuffers[channel].push(new Float32Array(event.inputBuffer.getChannelData(channel)));
            }
            recLength += this.options.bufferLen;
        };
        this.update = function () {
            // Update the local version of the Linear FFT
            var fft = this.floatFrequencyData;
            for (var i = 0, iLen = fft.length; i < iLen; i++) {
                this.floatFrequencyDataLinear[i] = Math.pow(10, fft[i] / 10);
            }
            this.ready = {};
        };
        this.getEnergy = function () {
            if (this.ready.energy) {
                return this.energy;
            }
            var energy = 0;
            var fft = this.floatFrequencyDataLinear;
            for (var i = 0, iLen = fft.length; i < iLen; i++) {
                energy += this.filter[i] * fft[i] * fft[i];
            }
            this.energy = energy;
            this.ready.energy = true;
            return energy;
        };
        this.monitor = function () {
            var energy = this.getEnergy();
            var signal = energy - this.energy_offset;
            if (signal > this.energy_threshold_pos) {
                this.voiceTrend = (this.voiceTrend + 1 > this.voiceTrendMax) ? this.voiceTrendMax : this.voiceTrend + 1;
            }
            else if (signal < -this.energy_threshold_neg) {
                this.voiceTrend = (this.voiceTrend - 1 < this.voiceTrendMin) ? this.voiceTrendMin : this.voiceTrend - 1;
            }
            else {
                // voiceTrend gets smaller
                if (this.voiceTrend > 0) {
                    this.voiceTrend--;
                }
                else if (this.voiceTrend < 0) {
                    this.voiceTrend++;
                }
            }
            var start = false, end = false;
            if (this.voiceTrend > this.voiceTrendStart) {
                // Start of speech detected
                start = true;
            }
            else if (this.voiceTrend < this.voiceTrendEnd) {
                // End of speech detected
                end = true;
            }
            // Integration brings in the real-time aspect through the relationship with the frequency this functions is called.
            var integration = signal * this.iterationPeriod * this.options.energy_integration;
            // Idea?: The integration is affected by the voiceTrend magnitude? - Not sure. Not doing atm.
            // The !end limits the offset delta boost till after the end is detected.
            if (integration > 0 || !end) {
                this.energy_offset += integration;
            }
            else {
                this.energy_offset += integration * 10;
            }
            this.energy_offset = this.energy_offset < 0 ? 0 : this.energy_offset;
            this.energy_threshold_pos = this.energy_offset * this.options.energy_threshold_ratio_pos;
            this.energy_threshold_neg = this.energy_offset * this.options.energy_threshold_ratio_neg;
            // Broadcast the messages
            if (start && !this.vadState) {
                this.vadState = true;
                startIndex = recLength - this.options.bufferLen * 128;
                if (startIndex < 0)
                    startIndex = 0;
                this.options.voice_start();
            }
            if (end && this.vadState) {
                this.vadState = false;
                var recordedAudio = this.buildAudioRecord();
                clear();
                this.options.voice_stop(recordedAudio);
            }
            this.log('e: ' + energy +
                ' | e_of: ' + this.energy_offset +
                ' | e+_th: ' + this.energy_threshold_pos +
                ' | e-_th: ' + this.energy_threshold_neg +
                ' | signal: ' + signal +
                ' | int: ' + integration +
                ' | voiceTrend: ' + this.voiceTrend +
                ' | start: ' + start +
                ' | end: ' + end);
            return signal;
        };
    };
    window.VADRecord = VADRecord;
})(window);
//# sourceMappingURL=BingSpeech.js.map