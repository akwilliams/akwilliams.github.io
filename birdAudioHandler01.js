var birdAudioHandler01 = function(){
	var context, output, mixer, sequencer, score, nextNoteTime,ScheduleAheadTime;
	var stopAnimation = false;
	var mobile = false;
	var samples = [];

	function init(){

		context = new WAVE.AudioContext();
		output = new WAVE.Output(context,0);
		mixer = new WAVE.Mixer({object:output});
		score = new WAVE.Score({object:output},120,3,1);

		mixer.initChannel({type:'master'},1,true);
		mixer.addAnalyser(0);

		mixer.initChannel({type:'aux',channels:[]},1,true);
		mixer.addInsert(1,new WAVE.Delay({object:output},1,0.056,0.8));
		mixer.wetDry(1,0,0.2);

		mixer.initChannel({type:'aux',channels:[]},1,true);
		mixer.addInsert(2,new WAVE.Delay({object:output},1,0.051423,0.97));
		mixer.wetDry(2,0,0.33);

		samples.push(new WAVE.LoadSampleFromUrl({object:output},'samples/BD_C1.wav'));
		samples.push(new WAVE.LoadSampleFromUrl({object:output},'samples/Pad22.wav'));
		samples.push(new WAVE.LoadSampleFromUrl({object:output},'samples/Pad30.wav'));

		samples.push(new WAVE.LoadSampleFromUrl({object:output},'samples/long007.wav'));
		//samples.push(new WAVE.LoadSampleFromUrl({object:output},'samples/pad31.wav'));
		//samples.push(new WAVE.LoadSampleFromUrl({object:output},'samples/pad33.wav'));

		//setTimeout(initSamples(),250);

	}
	function start(){
		mixer.start();
	}

	function audioOn(){
		output.value(1);
	}

	function audioOff(){
		output.value(0);
	}
	function stopAnimationRequest(){
		stopAnimation=true;
	}

	function getMixer(){
		return mixer;
	}
	function getScore(){
		return score;
	}
	function initSamples(){
		for (iiiii=0;iiiii<samples.length;iiiii++){
			samples[iiiii].initBufferSource();
			samples[iiiii].decoded.then(function(result){
				var tempSamp = this.birdAudioHandler01.getSamples();
				for (iiiiii=0;iiiiii<tempSamp.length;iiiiii++){
					if (tempSamp[iiiiii].sampleIndex<0){
						tempSamp[iiiiii].buffer = result;
						tempSamp[iiiiii].sampleIndex=iiiiii;
						tempSamp[iiiiii].loaded=true;
						break;
					}
				}
			})
		}

	}
	function initSampler(){
		mixer.initChannel(new WAVE.Sampler({object:output},samples),0.25,true);
		//mixer.channel[3].voice.outputNode.node.disconnect();
		//mixer.channel[3].voice.outputNode.node.connect(mixer.channel[1].insert[0].effect.node);
		score.addVoice(mixer.channel[3].voice);
		for (rrr=0;rrr<200;rrr++){
			score.addNote(2,rrr,5,0,0);
			score.addNote(2,rrr,5,0.25,0);
			score.addNote(2,rrr,4.3,0.5,0);
			score.addNote(2,rrr,6,0.75,0);
			score.addNote(2,rrr,5,1,0);
			score.addNote(2,rrr,5,1.25,0);
			score.addNote(2,rrr,4.7,1.5,0);
			score.addNote(2,rrr,6,1.75,0);
			score.addNote(2,rrr,8,2,0);
			score.addNote(2,rrr,8,2.25,0);
			score.addNote(2,rrr,8,2.5,0);
			score.addNote(2,rrr,8,2.75,0);

			//score.addNote(0,rrr,1,0.5,0);
			//score.addNote(0,rrr,1,1.5,0);

			//score.addNote(0,rrr,1,2.5,0);
			
			//score.addNote(1,rrr,1,0,0);
			//score.addNote(1,rrr,1,1,0);

			//score.addNote(1,rrr,1,2,0);

			note = Math.floor(Math.random()*10)+1;
			//note = note-1/note;
			while (note>2){
				note=note/2;
			}

			//score.addNote(0,rrr,note,0,0)

			note = Math.floor(Math.random()*10)+1;
			//note = note-1
			while (note>2){
				note=note/2;
			}
			//score.addNote(0,rrr,note,1.5,0)

			note = Math.floor(Math.random()*10)+1;
			//note = note-1/note;
			while (note>2){
				note=note/2;
			}
			//score.addNote(0,rrr,note,2,0)
			
		}
	}
	function getSamples(){
		return samples;
	}
	function scheduleNextQue(){
		score.scheduleNextQue();
	}
	function startSequencer(){
		score.start(mixer.context.node.currentTime);
	}
	function cleanUpBufferSources(){

		for(bufferIndex=0;bufferIndex<mixer.channel[3].voice.bufferSource.length;bufferIndex++){
			if(mixer.channel[3].voice.bufferSource[bufferIndex].node.node.playbackRate.value!=0){
				console.log('deleted');
				delete mixer.channel[3].voice.bufferSource[bufferIndex]
			}
		}
		//mixer.voice[3]
	}
/*	function loadSamples(url,mixer){
		for(iiiii=0;iiiii<url.length;iiiii){
			var doesItWork = new WAVE.LoadSampleFromUrl({object:output},url[iiiii]);
			console.log(doesItWork);
		}
	}*/

	return{
		init:init,
		start:start,
		audioOn:audioOn,
		stopAnimationRequest:stopAnimationRequest,
		getMixer:getMixer,
		getScore:getScore,
		initSamples:initSamples,
		getSamples:getSamples,
		initSampler:initSampler,
		scheduleNextQue:scheduleNextQue,
		startSequencer:startSequencer,
		cleanUpBufferSources:cleanUpBufferSources,
		//loadSamples:loadSamples,
		audioOff:audioOff
	}
}();


/*function initScore(){

		score.addVoice(mixer.channel[1].insert[0].effect.node.gain);
		score.addVoice(mixer.channel[2].insert[0].effect.node.gain);
		score.addVoice(mixer.channel[3].insert[mixer.channel[3].insert.length-1].effect.node.gain);
		score.addVoice(mixer.channel[4].insert[1].effect.node.gain);

		score.addVoice(mixer.channel[1].voice.carrierFrequency.outputNode.node.gain);
		score.addVoice(mixer.channel[2].voice.carrierFrequency.outputNode.node.gain);



		for (ttt=0;ttt<150;ttt++){

			val1=Math.floor((Math.random())*possibleNotes0.length)+1
			if (0>val1||val1>=possibleNotes0.length){
				val1=0;
			}
			val2=Math.floor((Math.random())*possibleNotes1.length)+1
			if (0>val2||val2>=possibleNotes1.length){
				val2=0;
			}

			//score.addNote(4,ttt,possibleNotes0[val1],0,0)

			//score.addNote(5,ttt,possibleNotes1[val2],2,0)

			score.addNote(3,ttt,Math.random()*0.7+0.3,0,0);
			score.addNote(3,ttt,0,0.13,0);

			score.addNote(3,ttt,Math.random()*0.7+0.3,2,0);
			score.addNote(3,ttt,0,2.13,0);

			if (Math.random()>0.87){
				var randNum = Math.random();
				if (randNum>0.25){
					score.addNote(3,ttt,Math.random()*0.4+0.6,2.5,0);
					score.addNote(3,ttt,0,2.8,0);
				}else if (randNum>0.5){
					score.addNote(3,ttt,Math.random()*0.4+0.6,3.5,0);
					score.addNote(3,ttt,0,2.8,0);
				}else if (randNum>0.75){
					score.addNote(3,ttt,Math.random()*0.4+0.6,4.5,0);
					score.addNote(3,ttt,0,2.8,0);
				}else{
					score.addNote(3,ttt,Math.random()*0.4+0.6,0.5,0);
					score.addNote(3,ttt,0,2.8,0);
				}
			}

			for (uuu=0;uuu<4;uuu++){

				score.addNote(2,ttt,Math.random()*0.7+0.3,uuu,0);
				score.addNote(2,ttt,0,uuu+0.05125,0)

				score.addNote(2,ttt,Math.random()*0.7+0.3,uuu+0.5,0);
				score.addNote(2,ttt,0,uuu+0.55125,0);

				if(Math.random()>0.65){
					if (Math.random()>0.5){
						score.addNote(2,ttt,Math.random()*0.7+0.3,uuu+0.25,0);
						score.addNote(2,ttt,0,uuu+0.375,0);
					}else{
						score.addNote(2,ttt,Math.random()*0.7+0.3,uuu+0.75,0);
						score.addNote(2,ttt,0,uuu+0.875,0);
					}
				}

				if (Math.random()>0.77){

					//score.addNote(0,ttt,Math.random()*0.5+0.24,uuu,0);
					//score.addNote(0,ttt,0,uuu+0.9,0);
				}

				if (Math.random()>0.76){
					//score.addNote(1,ttt,Math.random()*0.5+0.5,uuu,0);
					//score.addNote(1,ttt,0,uuu+0.9,0);
				}

			}

		}
	}*/

/*mixer.initChannel(new WAVE.Oscillator({object:output},0,'sine',0,0),0.123,true);
		mixer.setLevel(1,{L:1,R:1});
		mixer.addInsert(1,new WAVE.Delay({object:output},1,0.345,0.1252));
		mixer.addInsert(1,new WAVE.Gain({object:output},0.65));
		mixer.addInsert(1,new WAVE.BiquadFilter({object:output},850,21,1,'lowpass'));
		//mixer.addModulator(1,mixer.channel[1].voice.node.frequency, new WAVE.Oscillator({object:output},0.33,'sine',0,0),750);

		mixer.initChannel(new WAVE.Noise({object:output}),0.13,true);
		mixer.setLevel(2,{L:1,R:1});

		
		//mixer.addInsert(2,new WAVE.BiquadFilter({object:output},2400,21,1,'lowpass'));
		mixer.addInsert(2,new WAVE.Delay({object:output},1,1/18,0.45));
		mixer.channel[2].insert[0].dryGain.value(0.8)
		mixer.addInsert(2,new WAVE.BiquadFilter({object:output},1600,1,1,'highpass'));
		mixer.addInsert(2,new WAVE.Gain({object:output},0));
		mixer.channel[2].insert[0].effect.outputNode.value(0.4);
		//mixer.addInsert(2,new WAVE.Delay({object:output},1,0.33,0.75));
		//mixer.addInsert(2,new WAVE.BiquadFilter({object:output},2400,21,1,'lowpass'));
		mixer.addModulator(2,mixer.channel[2].insert[1].effect.node.frequency,new WAVE.Oscillator({object:output},0.123,'sine',0,0),400);
		//mixer.addModulator(2,mixer.channel[2].insert[0].effect.node.Q,new WAVE.Oscillator({object:output},6.123456,'sine',0,0),40);


		mixer.initChannel(new WAVE.BassDrum({object:output},{frequency:1,array:new WAVE.ArrayBuilder(new Float32Array(1200),[{amount:0,duration:0.05},{amount:function(x,y){return(x/y)},duration:0.15},{amount:function(x,y){return((y-x)/y)},duration:0.1},{amount:0,duration:0.7}])},new WAVE.ArrayBuilder(new Float32Array(1200),[{amount:0,duration:0.05},{amount:function(x,y){return(x/y)},duration:0.15},{amount:function(x,y){return((y-x)/y)},duration:0.65},{amount:0,duration:0.2}])),1,true);
		
		//mixer.setLevel(3,{L:1,R:1});
		//mixer.channel[3].voice.setTriggerSource(1);
		//mixer.addModulator(3,mixer.channel[3].insert[0].effect.node.gain,new WAVE.Oscillator({object:output},8,"other",0,0,WAVE.ArrayBuilder(new Float32Array(1200),[{amount:0,duration:0.1},{amount:function(x,y){return(x/y)},duration:0.15},{amount:0,duration:0.75}])),1)

		mixer.initChannel(new WAVE.KarplusStrong({object:output},110,0.6,{frequency:600,q:50,gain:1,type:'bandpass'},{frequency:600,q:3,gain:1,type:'lowpass'}),4.25,true);
		mixer.setLevel(4,{L:1,R:1});
		mixer.addModulator(4,mixer.channel[4].voice.noiseEnvelope.node.gain,new WAVE.Oscillator({object:output},0,'other',0,0,new WAVE.ArrayBuilder(new Float32Array(1200),[{amount:0,duration:0.05},{amount:function(x,y){return(x/y)},duration:0.02},{amount:function(x,y){return((y-x)/y)},duration:0.02},{amount:0,duration:0.91}])),1)
		//mixer.addInsert(4,new WAVE.Delay({object:output},1,0.232,0.6));
		//mixer.channel[4].insert[0].dryGain.value(0.8);
		//mixer.channel[4].insert[0].effect.outputNode.value(0.3);
		//mixer.addModulator(4,mixer.channel[4].voice.preDelayFilter.node.frequency,new WAVE.Oscillator({object:output},0.12,'sine',0,0),100)
		//mixer.addModulator(4,mixer.channel[4].voice.postFilter.node.frequency,new WAVE.Oscillator({object:output},0.3,'sine',0,0),250)

		/*mixer.initChannel(new WAVE.KarplusStrong({object:output},110,0.75,{frequency:1400,q:1,gain:1,type:'lowpass'},{frequency:600,q:1.254,gain:1,type:'lowpass'}),1.25,true);
		//mixer.setLevel(5,{L:1,R:1});
		mixer.addModulator(5,mixer.channel[5].voice.noiseEnvelope.node.gain,new WAVE.Oscillator({object:output},1.25,'other',0,0,new WAVE.ArrayBuilder(new Float32Array(1200),[{amount:0,duration:0.05},{amount:function(x,y){return(x/y)},duration:0.02},{amount:function(x,y){return((y-x)/y)},duration:0.02},{amount:0,duration:0.91}])),1)
		mixer.addInsert(5,new WAVE.Delay({object:output},1,0.332,0.86));
		mixer.channel[5].insert[0].dryGain.value(0.8);
		mixer.channel[5].insert[0].effect.outputNode.value(0.3);

		mixer.initChannel(new WAVE.KarplusStrong({object:output},165,0.75,{frequency:1400,q:1,gain:1,type:'lowpass'},{frequency:600,q:1.254,gain:1,type:'lowpass'}),1.25,true);
		//mixer.setLevel(6,{L:1,R:1});
		mixer.addModulator(6,mixer.channel[6].voice.noiseEnvelope.node.gain,new WAVE.Oscillator({object:output},1.33,'other',0,0,new WAVE.ArrayBuilder(new Float32Array(1200),[{amount:0,duration:0.05},{amount:function(x,y){return(x/y)},duration:0.02},{amount:function(x,y){return((y-x)/y)},duration:0.02},{amount:0,duration:0.91}])),1)
		mixer.addInsert(6,new WAVE.Delay({object:output},1,0.332,0.86));
		mixer.channel[6].insert[0].dryGain.value(0.8);
		mixer.channel[6].insert[0].effect.outputNode.value(0.3);

		mixer.initChannel(new WAVE.KarplusStrong({object:output},330,0.81,{frequency:1400,q:1,gain:1,type:'lowpass'},{frequency:600,q:1.254,gain:1,type:'lowpass'}),1.25,true);
		//mixer.setLevel(7,{L:1,R:1});
		mixer.addModulator(7,mixer.channel[7].voice.noiseEnvelope.node.gain,new WAVE.Oscillator({object:output},1.5,'other',0,0,new WAVE.ArrayBuilder(new Float32Array(1200),[{amount:0,duration:0.05},{amount:function(x,y){return(x/y)},duration:0.02},{amount:function(x,y){return((y-x)/y)},duration:0.02},{amount:0,duration:0.91}])),1)
		mixer.addInsert(7,new WAVE.Delay({object:output},1,0.12,0.86));
		mixer.channel[7].insert[0].dryGain.value(0.8);
		mixer.channel[7].insert[0].effect.outputNode.value(0.8);*/

/*score.addVoice(mixer.channel[4].voice.frequency.outputNode.node.gain);
		score.addVoice(mixer.channel[4].modulator[0].source.node.frequency);
		var possibleNotes = [150]
		score.addVoice(mixer.channel[2].insert[2].effect.node.gain);

		for(ttt=0;ttt<50;ttt++){

			
			score.addNote(1,ttt,8,0,0);
			score.addNote(1,ttt,0,0+(1/8*score.tempo/60),0);
			score.addNote(1,ttt,8,2,0);
			score.addNote(1,ttt,0,2+(1/8*score.tempo/60),0);
			score.addNote(1,ttt,8,1,0);
			score.addNote(1,ttt,0,1+(1/8*score.tempo/60),0);
			score.addNote(1,ttt,8,3,0);
			score.addNote(1,ttt,0,3+(1/8*score.tempo/60),0);
			
			score.addNote(2,ttt,0.4,0.5,0);
			score.addNote(2,ttt,0,0.525,0);
			score.addNote(2,ttt,0.4,1.5,0);
			score.addNote(2,ttt,0,1.525,0);
			score.addNote(2,ttt,0.4,2.5,0);
			score.addNote(2,ttt,0,2.525,0);
			score.addNote(2,ttt,0.4,3.5,0);
			score.addNote(2,ttt,0,3.525,0);

			score.addNote(2,ttt,0.4,0,0);
			score.addNote(2,ttt,0,0.025,0);
			score.addNote(2,ttt,0.4,1,0);
			score.addNote(2,ttt,0,1.025,0);
			score.addNote(2,ttt,0.4,2,0);
			score.addNote(2,ttt,0,2.025,0);
			score.addNote(2,ttt,0.4,3,0);
			score.addNote(2,ttt,0,3.025,0);

			score.addNote(2,ttt,0.4,0.25,0);
			score.addNote(2,ttt,0,0.275,0);
			score.addNote(2,ttt,0.4,1.25,0);
			score.addNote(2,ttt,0,1.275,0);
			score.addNote(2,ttt,0.4,2.25,0);
			score.addNote(2,ttt,0,2.275,0);
			score.addNote(2,ttt,0.4,3.25,0);
			score.addNote(2,ttt,0,3.275,0);

			score.addNote(2,ttt,0.4,0.75,0);
			score.addNote(2,ttt,0,0.775,0);
			score.addNote(2,ttt,0.4,1.75,0);
			score.addNote(2,ttt,0,1.775,0);
			score.addNote(2,ttt,0.4,2.75,0);
			score.addNote(2,ttt,0,2.775,0);
			score.addNote(2,ttt,0.4,3.75,0);
			score.addNote(2,ttt,0,3.775,0);
		}
*/
/*

//carrierType.type,carrierType.phase,carrierType.pwm,carrierType.dataSet
		mixer.initChannel(new WAVE.FMOscillator({object:output},0,2.3,0.65,{type:'sine',phase:0,pwm:0},{type:'sine',phase:0,pwm:0}),0.3,true);
		mixer.setLevel(1,{L:1,R:1});
		mixer.addInsert(1,new WAVE.Gain({object:output},0));
		mixer.addInsert(1,new WAVE.BiquadFilter({object:output},1600,1,1,'lowpass'));
		mixer.addModulator(1,mixer.channel[1].voice.harmonicityRatio.outputNode.node,new WAVE.Oscillator({object:output},0.0223,'sawtooth',0,0),12)
		mixer.addModulator(1,mixer.channel[1].insert[1].effect.node.frequency,new WAVE.Oscillator({object:output},0.123,'sine',0,0),800)

		mixer.initChannel(new WAVE.FMOscillator({object:output},0,0.73,1.6,{type:'sine',phase:0,pwm:0},{type:'sine',phase:0,pwm:0}),0.3,true);
		mixer.setLevel(2,{L:1,R:1});
		mixer.addInsert(2,new WAVE.Gain({object:output},0));
		mixer.addInsert(2,new WAVE.BiquadFilter({object:output},800,1,1,'lowpass'));
		mixer.addModulator(2,mixer.channel[2].voice.modulationIndex.outputNode.node,new WAVE.Oscillator({object:output},0.1,'sine',0,0),20)
		//mixer.addModulator(2,mixer.channel[2].modulator[0].outputNode.node.gain,new WAVE.Oscillator({object:output},0.345,'sine',0,0),0.75)
		mixer.addModulator(2,mixer.channel[2].voice.harmonicityRatio.outputNode.node,new WAVE.Oscillator({object:output},0.3,'square',0,0),8)
		//mixer.addModulator(2,mixer.channel[2].insert[1].effect.node.frequency,new WAVE.Oscillator({object:output},0.456,'sine',0,0),1200)

		mixer.initChannel(new WAVE.Noise({object:output}),0.90,true);
		mixer.setLevel(3,{L:1,R:1});
		mixer.addInsert(3,new WAVE.BiquadFilter({object:output},1600,1,1,'highpass'));
		mixer.addInsert(3,new WAVE.BiquadFilter({object:output},1200,4,1,'bandpass'));
		mixer.addInsert(3,new WAVE.Gain({object:output},0));
		mixer.addModulator(3,mixer.channel[3].insert[1].effect.node.frequency,new WAVE.Oscillator({object:output},0.123,'sine',0,0),800);
		
		mixer.initChannel(new WAVE.Noise({object:output}),0.86,true);
		mixer.setLevel(4,{L:1,R:1});
		//mixer.addInsert(4,new WAVE.Delay({object:output},1,0.08,0.8))
		//mixer.channel[4].insert[0].dryGain.value(0.8);
		//mixer.channel[4].insert[0].effect.outputNode.value(0.1);
		mixer.addInsert(4,new WAVE.Compressor({object:output},-75,7,1,0.125,0.4));
		mixer.addInsert(4,new WAVE.Gain({object:output},0));
		mixer.addInsert(4,new WAVE.BiquadFilter({object:output},800,1,1,'lowpass'));
		mixer.addInsert(4,new WAVE.BiquadFilter({object:output},45,12,6,'bandpass'));

		mixer.initChannel({type:'aux',channels:[1,2]},0.4,true);
		mixer.channel[1].outputNode.node.connect(mixer.channel[5].inlet.node);
		mixer.channel[2].outputNode.node.connect(mixer.channel[5].inlet.node);
		mixer.addInsert(5,new WAVE.Delay({object:output},1,0.33,0.6));
		mixer.channel[5].insert[0].dryGain.value(0.3);
		mixer.channel[5].insert[0].effect.outputNode.value(0.7);

		mixer.initChannel({type:'aux',channels:[3,4,5]},0.6,true);
		mixer.addInsert(6,new WAVE.Delay({object:output},1,0.051423,0.97));
		mixer.channel[6].insert[0].dryGain.value(0.8);
		mixer.channel[6].insert[0].effect.outputNode.value(0.4);

		mixer.initChannel(new WAVE.Noise({object:output}),1,true);
		//mixer.addInsert(7,new WAVE.BiquadFilter({object:output},1600,1,1,'highpass'))
		mixer.addInsert(7,new WAVE.Gain({object:output},1));

*/

/*
WAVE.Buffer = function(destination,duration,envelopeInfo){

	/*
		Duration = length of buffer in Miliseconds
		EnvelopeInfo = an array of objects that contain two parts
			envelopeInfo[x].amount & envelopeInfo[x].duration;
		EnvelopeInfo[x].amount = the state of the buffer(bufferOutput)
			(this can be a function as well);
		EnvelopeInfo[x].duration = a float between 0 & 1 representing
			percent of the envelope that state ocupies
	

	this.kind = "WAVE.Buffer";

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}
	
	this.context = destination.object.context;
	this.parameters = {bounceInfo:{},bufferInfo:{}};
	this.parameters.bounceInfo.duration = duration;

	if(typeof envelopeInfo == "string"){

		this.parameters.bounceInfo.bufferInfo = new WAVE.BinaryToArray(envelopeInfo)

	}else{

		this.parameters.bounceInfo.bufferInfo = envelopeInfo;

	}
	
	this.parameters.bufferInfo.frameCount = Math.floor((duration*this.context.node.sampleRate)/1000);
	this.node = this.context.node.createBuffer(1,this.parameters.bufferInfo.frameCount,this.context.node.sampleRate);
	this.parameters.bufferInfo.nowBuffering = this.node.getChannelData(0);
	this.parameters.bufferInfo.bufferingInfo = [];

	this.parameters.bufferInfo.index = 0;

	for(i=0;i<envelopeInfo.length;i++){

	    this.parameters.bufferInfo.bufferingInfo[i] = Math.floor(this.parameters.bounceInfo.bufferInfo[i].duration*this.parameters.bufferInfo.frameCount);     
	
		for(j=0;j<this.parameters.bufferInfo.bufferingInfo[i];j++){

			if(typeof envelopeInfo[i].amount != "number"){

				this.parameters.bufferInfo.nowBuffering[this.parameters.bufferInfo.index] = this.parameters.bounceInfo.bufferInfo[i].amount(j,this.parameters.bufferInfo.bufferingInfo[i]);

			}else{

				this.parameters.bufferInfo.nowBuffering[this.parameters.bufferInfo.index] = this.parameters.bounceInfo.bufferInfo[i].amount;

			}

			this.parameters.bufferInfo.index += 1;

		}
	
	}

	return this;

}

WAVE.Buffer.prototype = {

	constructor: WAVE.Buffer

}


WAVE.BufferSource = function(destination,buffer,loop,playbackRate,parameter){

	this.kind = "WAVE.BufferSource";


	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.parameters = {};
	this.node = this.context.node.createBufferSource();
	this.parameters.loop = loop;
	this.destination = destination.target;
	this.outputNode = new WAVE.Gain(destination,1);

	if(buffer.node == undefined){

		this.parameters.buffer = new WAVE.Buffer(destination,buffer.duration,buffer.envelopeInfo);
		this.node.buffer = this.parameters.buffer.node;

	}else{

		this.parameters.buffer = buffer;
		this.node.buffer = buffer.node;

	}

	this.node.connect(this.outputNode.node);

	if(playbackRate == undefined){

		var playbackRate = 1;

	}

	this.parameters.playbackRate = playbackRate

	if(this.parameters.loop == true){

		this.node.loop = this.parameters.loop;

	}else if(typeof loop !== "boolean"){
		this.node.loop = false;
		this.parameters.loop = loop;

		this.bounceNode = this.context.node.createBufferSource();
		this.bounceNode.loop = false;
		this.bounceNode.playbackRate.value = 0;

		this.bounceNode.buffer = this.parameters.buffer.node;
		this.bounceNode.onended = function(){loop.bounceOnEnded()};

		this.bounceNode.connect(this.destination);

		this.bounceNode.start();

		this.node.onended = function(){loop.nodeOnEnded()}

	}

	if(parameter != undefined){
		this.node.onended = function(){parameter.onEnded()}
	}

	this.node.playbackRate.value = 0;
	
	this.node.start();

	return this;
}

WAVE.BufferSource.prototype = {

	constructor: WAVE.BufferSource,

	nodeOnEnded: function(buffer){

		this.bounceNode.playbackRate.value = 1;

		this.node = this.context.node.createBufferSource();
		this.node.buffer = buffer
		this.node.playbackRate.value = 0;
		this.node.connect(this.destination)

		this.node.start();

		var x = this.parameters.loop.nodeOnEnded;

		this.node.onended = function(){x()};

		return this

	},

	bounceOnEnded: function(buffer){

		this.node.playbackRate.value = 1;

		this.bounceNode = this.context.node.createBufferSource();
		this.bounceNode.buffer = buffer
		this.bounceNode.playbackRate.value = 0;
		this.bounceNode.connect(this.destination);

		this.bounceNode.start();

		var x = this.parameters.loop.bounceOnEnded;

		this.bounceNode.onended = function(){x()};

		return this

	},

	reroute: function(destination){

		this.outputNode.reroute(destination);

		return this

	},

	start: function(){

		this.node.playbackRate.value = this.parameters.playbackRate;
		return this;

	}

}
*/
