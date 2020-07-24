var WAVE = { REVISION: '10' };

//This defines the creation of objects

if ( typeof define === 'function' && define.amd ) {

	define( 'wave', WAVE );

} else if ( 'undefined' !== typeof exports && 'undefined' !== typeof module ) {

	module.exports = WAVE;

}

if ( Function.prototype.name === undefined ) {

	// Missing in IE9-11.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name

	Object.defineProperty( Function.prototype, 'name', {

		get: function () {

			return this.toString().match( /^\s*function\s*(\S*)\s*\(/ )[ 1 ];

		}

	} );

}

if ( Object.assign === undefined ) {

	// Missing in IE.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

	( function () {

		Object.assign = function ( target ) {

			'use strict';

			if ( target === undefined || target === null ) {

				throw new TypeError( 'Cannot convert undefined or null to object' );

			}

			var output = Object( target );

			for ( var index = 1; index < arguments.length; index ++ ) {

				var source = arguments[ index ];

				if ( source !== undefined && source !== null ) {

					for ( var nextKey in source ) {

						if ( Object.prototype.hasOwnProperty.call( source, nextKey ) ) {

							output[ nextKey ] = source[ nextKey ];

						}

					}

				}

			}

			return output;

		};

	} )();

}

Object.assign( WAVE, {

	//Info for constants

} );

//These are the constructors for working in Web Audio API

WAVE.AudioContext = function(){

	this.kind = "WAVE.AudioContext";

	this.context = {};
	this.context.node = new ( window.AudioContext || window.webkitAudioContext);

	return this;
	
}

WAVE.AudioContext.prototype = {

	constructor: WAVE.AudioContext,

}

WAVE.Analyser = function(source,smoothingTimeConstant,fftSize,levelsCount){

	this.kind = "WAVE.Analyser"

	this.context = source.context;

	this.node = this.context.node.createAnalyser();
	source.node.connect(this.node)

	if(smoothingTimeConstant === undefined){
		this.node.smoothingTimeConstant = 0.1;
	} else {
		this.node.smoothingTimeConstant = smoothingTimeConstant;
	}

	if(fftSize === undefined){
		this.node.fftSize = 1024;
	} else {
		this.node.fftSize = fftSize;
	}

	if(levelsCount === undefined){

		this.levelsCount = 32;

	}else{

		this.levelsCount = levelsCount

	}

	return this;

}

WAVE.Analyser.prototype = {

	constructor:WAVE.Analyser,

	getWaveform: function(){

		var binCount = this.node.frequencyBinCount;
		var timeByteData = new Uint8Array(binCount);
		var waveData = [];

		this.node.getByteTimeDomainData(timeByteData);

		for(i=0;i<binCount;i++){
			waveData[i] = ((timeByteData[i] - 128) / 128);
		}

		return waveData;

	},

	getFrequencyLevels: function(levelsCount){

		var binCount = this.node.frequencyBinCount;
		var freqByteData = new Uint8Array(binCount);
		var levelsData = [];
		
		this.node.getByteFrequencyData(freqByteData);

		if(levelsCount === undefined){

			var levelsCount = this.levelsCount;

		}

		for(i=512%levelsCount;i>0;levelsCount--){
			i = 512 % levelsCount;
		}

		levelBins = Math.floor(binCount / levelsCount);

		for(i=0;i<levelsCount;i++){
			var sum = 0;
			for(j=0;j<levelBins;j++){
				sum+= freqByteData[(i*levelBins) + j];
			}

			levelsData[i] = sum /levelBins / 256;
		}

		return levelsData;

	},

	getVolume:function(levelsData){

		if(levelsData === undefined){

			var levelsData = this.getFrequencyLevels();

		}

		var sum = 0;

		for(i=0;i<levelsData.length;i++){
			sum += levelsData[i];

		}

		volume = (sum / levelsData.length) * 10;
		return volume;

	}

}

//Routing manipulation

WAVE.Output = function(context,gain){

	this.kind = "WAVE.Output";

	this.context = context.context
	this.parameters = {gain:gain};

	this.node = this.context.node.createGain();
	this.node.gain.value = gain;
	this.node.connect(this.context.node.destination);

	return this;
}

WAVE.Output.prototype = {

	constructor: WAVE.Output,

	value: function(value){

		this.node.gain.value =value;

		return this

	}

}

WAVE.ChannelMerger = function(destination,channelCount){

	this.kind = "WAVE.ChannelMerger"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	if(channelNumber===undefined){

		var channelNumber = 2;

	}

	this.destination = destination;
	this.context = destination.object.context;
	this.parameters= {channelCount:channelCount};

	this.node = this.context.node.createChannelMerger(channelCount);
	this.node.connect(destination.target);

	return this;

}

WAVE.ChannelMerger.prototype = {

	constructor:WAVE.ChannelMerger,

	connectChannel: function(source,channelNumber){

		source.disconnect();
		source.connect(this.node,0,channelNumber);


		/*if(this.channelCount == 2){

			source.reroute(this.node,0,channelNumber)

		}*/

	}

}

WAVE.ChannelSplitter = function(destination,channelCount){

	this.kind = "WAVE.ChannelSplitter";

	if(channelCount===undefined){

		var channelCount = 2;

	}

	this.destination = destination;
	this.context = destination.object.context;
	this.parameters = {channelCount:channelCount};

	this.node = this.context.node.createChannelSplitter(channelCount);
	for(i=0;i<channelCount;i++){
		this.node.connect(this.destination.target[i],i);
	}

	return this;

}

WAVE.ChannelSplitter.prototype = {

	constructor:WAVE.ChannelSplitter,

	connectChannel: function(source){

		source.disconnect();
		source.connect(this.node);

		return this;
	}
}

WAVE.Mixer = function(destination){

	this.kind = "WAVE.Mixer"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.destination = destination
	this.context = destination.object.context;

	this.channel = [];
	this.hasMaster = false;
	this.masterIndex = 0;

	return this;

}

WAVE.Mixer.prototype = {

	constructor: WAVE.Mixer,

	initChannel: function(voice,level,stereo){

		if(voice.type==undefined){
			var channelIndex = this.channel.length;
				this.channel[channelIndex] = {};
				this.channel[channelIndex].voice = voice;
				if(stereo===undefined){
		
					var stereo = false
		
				}
				this.channel[channelIndex].outputNode = new WAVE.Gain(this.destination,level);
				this.channel[channelIndex].stereo = stereo;
		
				if(this.channel[channelIndex].stereo==true){
		
					this.channel[channelIndex].pan = 0;
					this.channel[channelIndex].channelMerger = new WAVE.ChannelMerger({object:this.channel[channelIndex].outputNode},2);
		
					this.channel[channelIndex].outputNodeL = new WAVE.Gain({object:this.channel[channelIndex].outputNode},0);
					this.channel[channelIndex].outputNodeR = new WAVE.Gain({object:this.channel[channelIndex].outputNode},0);
		
					this.channel[channelIndex].channelMerger.connectChannel(this.channel[channelIndex].outputNodeL.node,0);
					this.channel[channelIndex].channelMerger.connectChannel(this.channel[channelIndex].outputNodeR.node,1);
		
					this.channel[channelIndex].postStereoInsert = {};
					this.channel[channelIndex].postStereoInsert.L = {effect:[],dryGain:[]};
					this.channel[channelIndex].postStereoInsert.R = {effect:[],dryGain:[]};
		
				}
		
				this.channel[channelIndex].insert = [];
				this.channel[channelIndex].send = [];
				this.channel[channelIndex].modulator = [];
		
				if(stereo===false){
		
					this.channel[channelIndex].voice.reroute(this.channel[channelIndex].outputNode.node);
				
				}else{
		
					this.channel[channelIndex].voice.reroute(this.channel[channelIndex].outputNodeL.node);
					if(this.channel[channelIndex].voice.outputNode!==undefined){
		
						this.channel[channelIndex].voice.outputNode.node.connect(this.channel[channelIndex].outputNodeR.node);
		
					}else{
		
						this.channel[channelIndex].voice.node.connect(this.channel[channelIndex].outputNodeR.node);
		
					}
				}
				if(this.hasMaster){
					this.channel[channelIndex].outputNode.reroute(this.channel[this.masterIndex].inlet.node);
				}
			}else if(voice.type=="aux"){
				var channelIndex = this.channel.length;
				this.channel[channelIndex] = {};
				this.channel[channelIndex].outputNode = new WAVE.Gain(this.destination,level);
				this.channel[channelIndex].channelMerger = new WAVE.ChannelMerger({object:this.channel[channelIndex].outputNode},2);
							
				this.channel[channelIndex].outputNodeL = new WAVE.Gain(this.destination,1);
				this.channel[channelIndex].outputNodeR = new WAVE.Gain(this.destination,1);
							
				this.channel[channelIndex].channelMerger.connectChannel(this.channel[channelIndex].outputNodeL.node,0);
				this.channel[channelIndex].channelMerger.connectChannel(this.channel[channelIndex].outputNodeR.node,1);
							
				this.channel[channelIndex].postStereoInsert = {};
				this.channel[channelIndex].postStereoInsert.L = {effect:[],dryGain:[]};
				this.channel[channelIndex].postStereoInsert.R = {effect:[],dryGain:[]};
					
				this.channel[channelIndex].insert = [];
				this.channel[channelIndex].send = [];
				this.channel[channelIndex].modulator = [];

				this.channel[channelIndex].channelSplitter = new WAVE.ChannelSplitter({object:this.destination.object,target:[this.channel[channelIndex].outputNodeL.node,this.channel[channelIndex].outputNodeR.node]},2);

				this.channel[channelIndex].inlet = new WAVE.Gain({object:this.destination.object,target:this.channel[channelIndex].channelSplitter.node},level);

				for(i=0;i<voice.channels.length;i++){
					if (this.channel[voice.channels[i]].send!=undefined){
						var sendIndex = this.channel[voice.channels[i]].send.length;
					}else{
						var sendIndex=0;
					}
					this.channel[voice.channels[i]].send[sendIndex] = new WAVE.Gain({object:this.destination.object,target:this.channel[channelIndex].inlet.node},level);
					this.channel[voice.channels[i]].channelMerger.node.connect(this.channel[voice.channels[i]].send[sendIndex].node);
				}
				if(this.hasMaster == true){
					this.channel[channelIndex].outputNode.reroute(this.channel[this.masterIndex].inlet.node);
				}

			}else if(voice.type=="master"){
				if(this.hasMaster==true){
					console.error("Multiple master tracks called");
				}else{
					var channelIndex = this.channel.length;
					this.channel[channelIndex] = {};
					this.hasMaster=true;
					this.masterIndex = channelIndex;
					
					this.channel[channelIndex].outputNode = new WAVE.Gain(this.destination,1);
					this.channel[channelIndex].channelMerger = new WAVE.ChannelMerger({object:this.channel[channelIndex].outputNode},2);
							
					this.channel[channelIndex].outputNodeL = new WAVE.Gain(this.destination,1);
					this.channel[channelIndex].outputNodeR = new WAVE.Gain(this.destination,1);
							
					this.channel[channelIndex].channelMerger.connectChannel(this.channel[channelIndex].outputNodeL.node,0);
					this.channel[channelIndex].channelMerger.connectChannel(this.channel[channelIndex].outputNodeR.node,1);
							
					this.channel[channelIndex].postStereoInsert = {};
					this.channel[channelIndex].postStereoInsert.L = {effect:[],dryGain:[]};
					this.channel[channelIndex].postStereoInsert.R = {effect:[],dryGain:[]};
					
					this.channel[channelIndex].insert = [];
					this.channel[channelIndex].send = [];
					this.channel[channelIndex].modulator = [];

					this.channel[channelIndex].channelSplitter = new WAVE.ChannelSplitter({object:this.destination.object,target:[this.channel[channelIndex].outputNodeL.node,this.channel[channelIndex].outputNodeR.node]},2);

					this.channel[channelIndex].inlet = new WAVE.Gain({object:this.destination.object,target:this.channel[channelIndex].channelSplitter.node},level);

					if(channelIndex!==0){
						//Need to create the script that reroutes previously created tracks to the master track
						for(i=0;i<channelIndex;i++){
							this.channel[i].outputNode.reroute(this.channel[channelIndex].inlet.node);
						}
					}
				}
			}

		return this; 

	},

	addInsert: function(channel,insert,stereo){

		if(stereo===undefined){

			var insertIndex = this.channel[channel].insert.length;
			this.channel[channel].insert[insertIndex] = {};
			this.channel[channel].insert[insertIndex].effect = insert;
			this.channel[channel].insert[insertIndex].dryGain = new WAVE.Gain({object:this.destination.object},0);

			if(insertIndex == 0){

				if(this.channel[channel].stereo){

					this.channel[channel].insert[0].effect.reroute(this.channel[channel].outputNodeL.node);
					this.channel[channel].insert[0].dryGain.reroute(this.channel[channel].outputNodeL.node);
					this.channel[channel].insert[0].dryGain.node.connect(this.channel[channel].outputNodeR.node);
				
					if(this.channel[channel].insert[0].effect.outputNode!==undefined){

						this.channel[channel].insert[0].effect.outputNode.node.connect(this.channel[channel].outputNodeR.node);

					}else{	

						this.channel[channel].insert[0].effect.node.connect(this.channel[channel].outputNodeR.node);

					}

					if(this.channel[channel].voice!=undefined){
						this.channel[channel].voice.reroute(this.channel[channel].insert[0].effect.node);
						this.channel[channel].voice.outputNode.node.connect(this.channel[channel].insert[0].dryGain.node)
						this.channel[channel].voice.outputNode.node.connect(this.channel[channel].insert[insertIndex].dryGain.node)
					}else{
						this.channel[channel].inlet.reroute(this.channel[channel].insert[0].effect.node);
						this.channel[channel].inlet.outputNode.node.connect(this.channel[channel].insert[0].dryGain.node);
						this.channel[channel].inlet.outputNode.node.connect(this.channel[channel].insert[insertIndex].dryGain.node);
					}

				}else{

					this.channel[channel].insert[0].effect.reroute(this.channel[channel].outputNode.node);
					this.channel[channel].insert[0].dryGain.reroute(this.channel[channel].outputNode.node);

					if(this.channel[channel].voice!=undefined){
						this.channel[channel].voice.reroute(this.channel[channel].insert[0].effect.node);
						this.channel[channel].voice.outputNode.node.connect(this.channel[channel].insert[0].dryGain.node);
					}else{
						this.channel[channel].inlet.reroute(this.channel[channel].insert[0].effect.node);
						this.channel[channel].inlet.outputNode.node.connect(this.channel[channel].insert[0].dryGain.node);
					}

				}

			}else{

				this.channel[channel].insert[insertIndex].effect.reroute(this.channel[channel].insert[insertIndex-1].effect.node);
				this.channel[channel].insert[insertIndex].dryGain.reroute(this.channel[channel].insert[insertIndex-1].effect.node);

				this.channel[channel].insert[insertIndex].effect.outputNode.node.connect(this.channel[channel].insert[insertIndex-1].dryGain.node);
				this.channel[channel].insert[insertIndex].dryGain.node.connect(this.channel[channel].insert[insertIndex-1].dryGain.node);

				if(this.channel[channel].voice!=undefined){
					this.channel[channel].voice.reroute(this.channel[channel].insert[insertIndex].effect.node);
					this.channel[channel].voice.outputNode.node.connect(this.channel[channel].insert[insertIndex].dryGain.node);
				}else{
					this.channel[channel].inlet.reroute(this.channel[channel].insert[insertIndex].effect.node);
					this.channel[channel].inlet.outputNode.node.connect(this.channel[channel].insert[insertIndex].dryGain.node);
				}

	  		}

	  	}else if(stereo == 0){

	  		var insertIndex = this.channel[channel].postStereoInsert.L.effect.length;
	  		this.channel[channel].postStereoInsert.L.effect[insertIndex] = insert;
	  		this.channel[channel].postStereoInsert.L.dryGain[insertIndex] = new WAVE.Gain({object:this.destination.object},0);
 
	  		if(insertIndex == 0){

	  			if(this.channel[channel].postStereoInsert.L.effect[0].outputNode!==undefined){
		  			this.channel[channel].channelMerger.connectChannel(this.channel[channel].postStereoInsert.L.effect[0].outputNode.node,0)
		  			this.channel[channel].channelMerger.connectChannel(this.channel[channel].postStereoInsert.L.dryGain[0].outputNode.node,0)
	  				this.channel[channel].outputNodeL.reroute(this.channel[channel].postStereoInsert.L.effect[0].node);
	  				this.channel[channel].outputNodeL.outputNode.node.connect(this.channel[channel].postStereoInsert.L.dryGain[0].node);
	  			}else{
	  				console.log("effect does not have outputNode");
	  			}


	  		}else{

	  			if(this.channel[channel].postStereoInsert.L.effect[insertIndex].outputNode!==undefined){
	  				this.channel[channel].postStereoInsert.L.effect[insertIndex].reroute(this.channel[channel].postStereoInsert.L.effect[insertIndex-1].node);
	  				this.channel[channel].postStereoInsert.L.effect[insertIndex].outputNode.node.connect(this.channel[channel].postStereoInsert.L.dryGain[insertIndex-1].node);
	  				this.channel[channel].postStereoInsert.L.dryGain[insertIndex].reroute(this.channel[channel].postStereoInsert.L.effect[insertIndex-1].node);
	  				this.channel[channel].postStereoInsert.L.dryGain[insertIndex].outputNode.node.connect(this.channel[channel].postStereoInsert.L.dryGain[insertIndex-1].node);
	  			}else{
	  				console.log("effect does not have outputNode");
	  			}

	  		}

	  	}else if(stereo == 1){

	  		var insertIndex = this.channel[channel].postStereoInsert.R.effect.length;
	  		this.channel[channel].postStereoInsert.R.effect[insertIndex] = insert;
	  		this.channel[channel].postStereoInsert.R.dryGain[insertIndex] = new WAVE.Gain({object:this.destination.object},0);

	  		if(insertIndex == 0){

	  			if(this.channel[channel].postStereoInsert.R.effect[0].outputNode!==undefined){
		  			this.channel[channel].channelMerger.connectChannel(this.channel[channel].postStereoInsert.R.effect[0].outputNode.node,1)
		  			this.channel[channel].channelMerger.connectChannel(this.channel[channel].postStereoInsert.R.dryGain[0].outputNode.node,1)
	  				this.channel[channel].outputNodeR.reroute(this.channel[channel].postStereoInsert.R.effect[0].node);
	  				this.channel[channel].outputNodeR.outputNode.node.connect(this.channel[channel].postStereoInsert.R.dryGain[0].node);
	  			}else{
	  				console.log("effect does not have outputNode");
	  			}


	  		}else{

				if(this.channel[channel].postStereoInsert.R.effect[insertIndex].outputNode!==undefined){
	  				this.channel[channel].postStereoInsert.R.effect[insertIndex].reroute(this.channel[channel].postStereoInsert.R.effect[insertIndex-1].node);
	  				this.channel[channel].postStereoInsert.R.effect[insertIndex].outputNode.node.connect(this.channel[channel].postStereoInsert.R.dryGain[insertIndex-1].node);
	  				this.channel[channel].postStereoInsert.R.dryGain[insertIndex].reroute(this.channel[channel].postStereoInsert.R.effect[insertIndex-1].node);
	  				this.channel[channel].postStereoInsert.R.dryGain[insertIndex].outputNode.node.connect(this.channel[channel].postStereoInsert.R.dryGain[insertIndex-1].node);
	  			}else{
	  				console.log("effect does not have outputNode");
	  			}
	  		}

	  	}
		
		return this;

	},

	addModulator: function(channel,destination,node,amount){

		var modulatorIndex = this.channel[channel].modulator.length;
		this.channel[channel].modulator[modulatorIndex] = {};
		this.channel[channel].modulator[modulatorIndex].source = node;
		this.channel[channel].modulator[modulatorIndex].outputNode = new WAVE.Gain({object:this.destination.object,target:destination},amount);
		
		this.channel[channel].modulator[modulatorIndex].source.reroute(this.channel[channel].modulator[modulatorIndex].outputNode.node);
		//this.channel[channel].modulator[modulatorIndex].outputNode.reroute(destination);

		return this;

	},

	addSend: function(channel,destination){

		var sendIndex = this.channel[channel].send.length;

		this.channel[channel].send[sendIndex] = new WAVE.Gain(destination,1);
		
		this.channel[channel].outputNode.node.connect(destination);

		return this;

	},

	setLevel: function(channel,value){

		if(value.L===undefined){

			this.channel[channel].outputNode.value(value);
		
		}else{

			this.channel[channel].outputNodeL.value(value.L);
			this.channel[channel].outputNodeR.value(value.R);

		}

		return this;

	},

	addAnalyser: function(channel){

		this.channel[channel].analyser = new WAVE.Analyser(this.channel[channel].outputNode,0.01,4096,2048)

		return this;

	},

	wetDry: function(channel,insert,value){

		this.channel[channel].insert[insert].dryGain.value(1-value);
		this.channel[channel].insert[insert].effect.outputNode.value(value);

		return this;

	},

	start: function(){

		for(i=0;i<this.channel.length;i++){

			if(this.channel[i].voice!==undefined){

				this.channel[i].voice.start();

			}

			if(this.channel[i].modulator!==undefined){

				for(j=0;j<this.channel[i].modulator.length;j++){

					if(this.channel[i].modulator[j].source.start!=undefined){
						this.channel[i].modulator[j].source.start();
					}	
				}
			}

		}

		return this;

	}

}

WAVE.Score = function(destination,tempo,beatsPerMeasure,beatsInPeriod){

	/*this.kind = "WAVE.Score";
	this.voice = [];
	this.startTime = 0;
	this.updateTick = 0;
	this.tempo = tempo;
	this.beatsPerMeasure = bpm;
	this.updateRate = updateRate;
	this.updateHertz = (updateRate*bpm)/(this.tempo/60);
	this.currentTime = 0;
	this.isRunning = false;
	this.nextScheduling = {measure:0,beat:0}
	this.currentThreshold;*/

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.destination = destination;

	this.bufferDestination = new WAVE.Gain(destination,0);

	this.kind = "WAVE.Score";
	this.voice = [];
	this.startTime = -1;
	this.que = [];
	this.currentPeriod = 0;
	this.beatsPerMeasure = beatsPerMeasure;
	this.beatsInPeriod = beatsInPeriod
	this.tempo = tempo;
	this.timingBuffers = [];

	return this;
}

WAVE.Score.prototype = {

	constructor: WAVE.Score,

	scheduleNextQue: function(){
		for(ccc=0;ccc<this.que.length;ccc++){
			this.scheduleNote(this.que[ccc]);
		}
		this.timingBuffers[this.currentPeriod%2]= new WAVE.BufferSource(this.bufferDestination.destination,new WAVE.Buffer(this.bufferDestination.destination,((1000*this.beatsInPeriod)/(this.tempo/60)),[{amount:0.15,duration:1}]),false,1,{onEnded:function(){birdAudioHandler01.scheduleNextQue()}})
		this.timingBuffers[this.currentPeriod%2].reroute(this.bufferDestination.node);
		this.timingBuffers[this.currentPeriod%2].node.playbackRate.setValueAtTime(1,((this.beatsInPeriod*this.currentPeriod)/(this.tempo/60))+this.startTime);
				
		/*switch (this.currentPeriod%2){
			case 0:
				this.timingBuffers[0]= new WAVE.BufferSource(this.bufferDestination.destination,new WAVE.Buffer(this.bufferDestination.destination,((1000*this.beatsInPeriod)/(this.tempo/60)),[{amount:0.5,duration:1}]),false,1,{onEnded:function(){birdAudioHandler01.scheduleNextQue()}})
				this.timingBuffers[0].node.playbackRate.setValueAtTime(1,((this.beatsInPeriod*this.currentPeriod)/(this.tempo/60))+this.startTime);
				break;
			case 1:
				this.timingBuffers[1]= new WAVE.BufferSource(this.bufferDestination.destination,new WAVE.Buffer(this.bufferDestination.destination,((1000*this.beatsInPeriod)/(this.tempo/60)),[{amount:0.5,duration:1}]),false,1,{onEnded:function(){birdAudioHandler01.scheduleNextQue()}})
				this.timingBuffers[1].node.playbackRate.setValueAtTime(1,((this.beatsInPeriod*this.currentPeriod)/(this.tempo/60))+this.startTime);
				break;
		}*/
		this.que.splice(0,this.que.length);
		this.currentPeriod+=1;
		this.loadQue();
		return this;
	},

	scheduleNote: function(note){
		//note is an array where [0]==voiceIndex,[1]==MeasureCount,[2]==Value,[3]==Beat,[4]==Mode;
		if(this.voice[note[0]].destination.kind!="WAVE.Sampler"){

		}else{
			console.log(note[1],note[3],(note[1]*this.beatsPerMeasure),((note[1]*this.beatsPerMeasure)+note[3]),(((note[1]*this.beatsPerMeasure)+note[3])/(this.tempo/60)),(((note[1]*this.beatsPerMeasure)+note[3])/(this.tempo/60))+this.startTime)
			this.voice[note[0]].destination.scheduleSample(note[2],(((note[1]*this.beatsPerMeasure)+note[3])/(this.tempo/60))+this.startTime,0,this.voice[note[0]].target);
		}

		return this;
	},

	loadQue: function(){

		var schedulingBeats = [this.beatsInPeriod*this.currentPeriod]
		schedulingBeats[1] = schedulingBeats[0]+this.beatsInPeriod;

		schedulingMeasures = [Math.floor(schedulingBeats[0]/this.beatsPerMeasure),Math.floor(schedulingBeats[1]/this.beatsPerMeasure)];
		schedulingBeatOffset = [(schedulingBeats[0]%this.beatsPerMeasure),(schedulingBeats[1]%this.beatsPerMeasure)]
		if(schedulingBeatOffset[1]==0){
			schedulingMeasures[1]-=1;
			schedulingBeatOffset[1]=this.beatsPerMeasure;
		}
		var calcHold = schedulingMeasures[0];
		var tempQue = [];
		while (calcHold<=schedulingMeasures[1]){
			for(voiceHold=0;voiceHold<this.voice.length;voiceHold++){
				if(this.voice[voiceHold].measure[calcHold]!=undefined){
					tempQue.push({voice:voiceHold,measure:calcHold,notes:this.voice[voiceHold].measure[calcHold]})
				}
			}

			calcHold+=1;
		}
		for (queHold = 0;queHold<tempQue.length;queHold++){
			if(tempQue[queHold].measure==schedulingMeasures[0]){
				for (queParse=0;queParse<tempQue[queHold].notes.length;queParse++){
					if(tempQue[queHold].notes[queParse][1]<schedulingBeatOffset[0]){
						tempQue[queHold].notes[queParse][2]=-1;
					}
				}
			}
			if(tempQue[queHold].measure==schedulingMeasures[1]){
				for (queParse=0;queParse<tempQue[queHold].notes.length;queParse++){
					if(tempQue[queHold].notes[queParse[1]]>schedulingBeatOffset[1]){
						tempQue[queHold].notes[queParse][2]=-1;
					}
				}
			}
		}
		for (queHold = 0;queHold<tempQue.length;queHold++){
			for (queParse=0;queParse<tempQue[queHold].notes.length;queParse++){
				if (tempQue[queHold].notes[queParse][2]>=0){
					this.que.push([tempQue[queHold].voice,tempQue[queHold].measure,tempQue[queHold].notes[queParse][0],tempQue[queHold].notes[queParse][1],tempQue[queHold].notes[queParse][2]])
				}
			}
		}

		return this;
	},

	addNote: function(voice,measure,value,beat,mode){

		if (this.voice[voice].measure[measure]==undefined){
			this.voice[voice].measure[measure] = [];
		}
		this.voice[voice].measure[measure].push([value,beat,mode]);
		return this;

	},

	addVoice: function(destination){

		if(destination.kind!=undefined){
			if (destination.kind=="WAVE.Sampler"){
				for (var bb=0;bb<destination.bufferSources.length;bb++){
					this.voice.push({destination:destination,measure:[],target:bb});
				}
			}		
		}else{
			this.voice.push({destination:destination,measure:[]})
		}

		return this;
	},

	start: function(currentTime){
		this.startTime=currentTime+1;
		this.loadQue();
		this.scheduleNextQue();
		this.scheduleNextQue();
	}

	/*addNote: function(voice,measure,value,beat,mode){

		if(this.voice[voice].measure[measure]==undefined){

			this.voice[voice].measure[measure]=[];

		}

		this.voice[voice].measure[measure].push([value,beat,mode]);

		return this;
	},

	updateVoiceDestination:function(voice,voiceIndex){
		this.voice[voiceIndex].destination = voice;
	},

	render: function(currentClock,startingMeasure,measureDuration){
		console.log(this.voice[0].measure.length);
		for(q=0;q<measureDuration;q++){
			console.log('q: '+q);
			console.log(this)
			for(l=0;l<this.voice.length;l++){
				console.log('j: '+j);
				if(this.voice[l].measure[q] !=undefined){
					for(y=0;y<this.voice[l].measure[q].length;y++){
						console.log('y: '+y)
						if(this.voice[l].destination.kind!="WAVE.Sampler"){
							switch(this.voice[l].measure[q][y][2]){
								case 0:
									this.voice[l].destination.setValueAtTime(this.voice[l].measure[q][y][0],((this.voice[l].measure[q][y][1]+(l*this.beatsPerMeasure))/(this.tempo/60))+this.startTime+2)//+this.updateHertz);									break;
									break;
								case 1:
									//this.voice[q].destination.linearRampToValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+2)
									break;
								case 2:
									//this.voice[q].destination.exponentialRampToValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+2)
									break;
									
							}
						}else{
							console.log(q+' '+l+' '+y);
							this.voice[l].destination.scheduleSample(this.voice[l].measure[q][y][0],((this.voice[l].measure[q][y][1]+(l*this.beatsPerMeasure))/(this.tempo/60))+this.startTime+2,this.voice[l].measure[q][y][2],this.voice[l].target);
						}
					}
					/*
							if (scheduleNote){
								if (this.voice[q].destination.kind!="WAVE.Sampler"){
									switch(this.voice[q].measure[currentMeasure][j][2]){
										case 0:
											this.voice[q].destination.setValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold)//+this.updateHertz);									break;
											break;
										case 1:
											this.voice[q].destination.linearRampToValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold)
											break;
										case 2:
											this.voice[q].destination.exponentialRampToValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold)
											break;
										
									}
								}else{
									console.log('gotIn')
									this.voice[q].destination.scheduleSample(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold+2,this.voice[q].measure[currentMeasure][j][2],this.voice[q].target);
								}
					
				}

			}
		}
	},

	renderFrom: function(currentClock,startingMeasure,startingBeat){

		//console.log('in')

		if (startingMeasure==undefined){
			var startM = 0;
		}else{
			var startM = startingMeasure;
		}
		if (startingBeat==undefined){
			var startB = 0;
		}else{
			var startB = startingBeat;
		}

		var needsScheduling = false;

		if (this.isRunning!=true){

			this.startTime=currentClock+2//this.updateHertz;
			this.isRunning=true;

			needsScheduling = true;
			this.nextScheduling= {measure:startM,beat:startB};

		}

		this.currentThreshold = this.updateTick*this.updateHertz;

		if (currentClock>=this.startTime+this.currentThreshold){

			needsScheduling = true;

		}

		
		//console.log(needsScheduling,currentClock,threshold);

		if (needsScheduling){
			//console.log(needsScheduling,currentClock,this.currentThreshold+this.startTime+0.2)
			//console.log(this.nextScheduling);
			var currentMeasure = this.nextScheduling.measure;
			var currentBeat = this.nextScheduling.beat;
			var endMeasure = currentMeasure;
			var endBeat = this.nextScheduling.beat+this.beatsPerMeasure*this.updateRate;
			while (endBeat>this.beatsPerMeasure){
				endBeat-=(this.beatsPerMeasure*this.updateRate)
				endMeasure++;
			}
			/*for (i=0;i<this.voice.length;i++){
				currentMeasure = this.nextScheduling.measure;
				console.log(endMeasure,currentMeasure,i);
				while (currentMeasure<=endMeasure){
			while(currentMeasure<=endMeasure){
				for(q=0;q<this.voice.length;q++){
					if (this.voice[q].measure[currentMeasure]!=undefined){
						for (j=0;j<this.voice[q].measure[currentMeasure].length;j++){
							var scheduleNote=false;
							if (this.nextScheduling.measure==endMeasure){
								if (this.nextScheduling.beat<=this.voice[q].measure[currentMeasure][j][1]&&this.voice[q].measure[currentMeasure][j][1]<endBeat){
									scheduleNote=true;
									
								}
							}else if (currentMeasure==this.nextScheduling.measure){
								if (this.nextScheduling.beat<=this.voice[q].measure[currentMeasure][j][1]){
									scheduleNote=true;
								}
							}else if (this.nextScheduling.measure<currentMeasure&&currentMeasure<endMeasure){
								scheduleNote=true;
							}else if (currentMeasure==endMeasure){
								if(this.voice[q].measure[currentMeasure][j][1]<endBeat){
									scheduleNote=true;
								}
							}
							if (scheduleNote){
								if (this.voice[q].destination.kind!="WAVE.Sampler"){
									switch(this.voice[q].measure[currentMeasure][j][2]){
										case 0:
											this.voice[q].destination.setValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold)//+this.updateHertz);									break;
											break;
										case 1:
											this.voice[q].destination.linearRampToValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold)
											break;
										case 2:
											this.voice[q].destination.exponentialRampToValueAtTime(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold)
											break;
										
									}
								}else{
									console.log('gotIn')
									this.voice[q].destination.scheduleSample(this.voice[q].measure[currentMeasure][j][0],((this.voice[q].measure[currentMeasure][j][1]-this.nextScheduling.beat)/(this.tempo/60))+this.startTime+this.currentThreshold+2,this.voice[q].measure[currentMeasure][j][2],this.voice[q].target);
								}
							}
						}
						//currentMeasure++;
					}	

				}
				currentMeasure++
				this.updateTick++;

				this.nextScheduling.beat+=this.updateRate*this.beatsPerMeasure;
				while (this.nextScheduling.beat>=this.beatsPerMeasure){
					this.nextScheduling.beat-=this.beatsPerMeasure;
					this.nextScheduling.measure++;
				}
				//console.log(this.nextScheduling);
			}
		}
		return this;
	}*/
}


//Simple sound producers


WAVE.Oscillator = function(destination,frequency,kind,phase,pwm,dataSet){

	this.kind = "WAVE.Oscillator"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;

	this.node = this.context.node.createOscillator();

	this.parameters = {};

	this.parameters.kind = kind;
	this.parameters.frequency = frequency;
	this.parameters.phase = phase;
	this.parameters.pwm = pwm;
	
	if(dataSet!= undefined){

		this.parameters.dataSet = dataSet;
	
	}

	this.parameters.real = new Float32Array(4096);
	this.parameters.imag = new Float32Array(4096);
	this.parameters.shiftedReal = new Float32Array(4096);
	this.parameters.shiftedImag = new Float32Array(4096);

	this.fourierSeries = new WAVE.FourierSeries(kind);
	if(kind == "other"){


		this.fourierSeries(this.parameters,650,pwm);
	
	}else{
	
		this.fourierSeries(this.parameters,4096,pwm);
	
	}
	var shift = 0;

	for(i=1;i<=4096;i++){

		shift = 2 * Math.PI * phase * i;

		this.parameters.shiftedReal[i] = this.parameters.real[i] * Math.cos(shift) - this.parameters.imag[i] * Math.sin(shift);
		this.parameters.shiftedImag[i] = this.parameters.real[i] * Math.sin(shift) + this.parameters.imag[i] * Math.cos(shift);
	
	}

	if(this.parameters.kind != "other"||this.parameters.kind!= "pulse"){

		this.waveTable = this.context.node.createPeriodicWave(this.parameters.shiftedReal,this.parameters.shiftedImag);

	}else{

		this.waveTable = this.context.node.createPeriodicWave(this.parameters.shiftedReal,this.parameters.shiftedImag,{disableNormalization:true});
	
	}

	this.node.setPeriodicWave(this.waveTable);
	this.node.frequency.value = this.parameters.frequency;
	this.outputNode = new WAVE.Gain(destination,1);
	this.node.connect(this.outputNode.node);

	if(kind == "other"||kind=="pulse"){

		this.aNaught = new WAVE.Constant({object:this.outputNode},this.parameters.real[0]);

	}else{
		this.aNaught = new WAVE.Constant({object:this.outputNode},0)
	}

	return this;

}

WAVE.Oscillator.prototype = {

	constructor: WAVE.Oscillator,

	phase: function(phase){

		this.parameters.phase = phase;
		var shift = 0;

		for(i=1;i<=4096;i++){

			shift = 2 * Math.PI * phase * i;

			this.parameters.shiftedReal[i] = this.parameters.real[i] * Math.cos(shift) - this.parameters.imag[i] * Math.sin(shift);
			this.parameters.shiftedImag[i] = this.parameters.real[i] * Math.sin(shift) + this.parameters.imag[i] * Math.cos(shift);

			if(isNaN(this.parameters.shiftedReal[i])){
				this.parameters.shiftedReal[i] = 0;
			}
			if(isNaN(this.parameters.shiftedImag[i])){
				this.parameters.shiftedImag[i] = 0;
			}
	
		}

		this.waveTable = this.context.node.createPeriodicWave(this.parameters.shiftedReal,this.parameters.shiftedImag);

		this.node.setPeriodicWave(this.waveTable);

		return this;
	},

	pwm: function(pwm){

		this.parameters.pwm = pwm;
		this.fourierSeries(this.parameters,4096,pwm);

		if(this.parameters.kind=="other"||this.parameters.kind=="pulse"){
			this.aNaught.value(this.parameters.real[0])
		}
		
		this.phase(this.parameters.phase);

		return this;

	},

	reroute: function(destination){

		this.outputNode.reroute(destination);

		return this;
		
	},

	modifyIrregularWave: function(dataSet){

		if(this.parameters.kind == "other"){

			this.parameters.dataSet = dataSet;

			this.fourierSeries(this.parameters,300,this.parameters.pwm);

			this.waveTable = this.context.node.createPeriodicWave(this.parameters.shiftedReal,this.parameters.shiftedImag,{disableNormalization:true});
		
			this.aNaught.value(this.parameters.real[0])

			this.node.setPeriodicWave(this.waveTable);
		}
	
	},

	frequency: function(value){

		this.node.frequency.value = value;
		this.parameters.frequency = value;

		return this
	},

	start: function(){

		this.node.start();

		if(this.parameters.kind == "other"){

			this.aNaught.start();

		}

	}

}

WAVE.FourierSeries = function(kind){

	this.pulse = function(waveInfo,n,d){

		waveInfo.real[0] = 2*d;
		for(i=1;i<=n;i++){

			waveInfo.real[i] = (4*Math.sin(i*Math.PI*d))/(i*Math.PI);

		}

	}

	this.square = function(waveInfo,n,d){

		for(i=1;i<=n;i+=2){

			waveInfo.real[i] = 4*Math.sin((i*Math.PI)/2)/(i*Math.PI);

		}

	}

	this.triangle = function(waveInfo,n,d){

		for(i=1;i<=n;i++){

			waveInfo.imag[i] = -1 * (2*(Math.pow(-1,i)*Math.pow(d,2)))/(Math.pow(i,2)*(d-1)*Math.pow(Math.PI,2))*Math.sin((i*(d-1)*Math.PI)/d);

		}

	}

	this.sawtooth = function(waveInfo,n,d){

		for(i=1;i<=n;i++){

			waveInfo.imag[i] = 2/(i*Math.PI);

		}

	}

	this.sine = function(waveInfo,n,d){

		waveInfo.imag[1] = 1

	}

	this.other = function(waveInfo,n,d){

		var integration = {};

		for(i=1;i<=n;i++){

			integration.real = 0;
			integration.imag = 0;

			for(j=0;j<waveInfo.dataSet.length;j++){

				integration.real += waveInfo.dataSet[j]*Math.cos(i*Math.PI*j/(0.5*waveInfo.dataSet.length))*(1/waveInfo.dataSet.length);
				integration.imag += waveInfo.dataSet[j]*Math.sin(i*Math.PI*j/(0.5*waveInfo.dataSet.length))*(1/waveInfo.dataSet.length);
			
			}

			waveInfo.real[i] = 2*integration.real;
			waveInfo.imag[i] = 2*integration.imag;

		}

		integration.real = 0;

		for(i=0;i<this.parameters.dataSet.length;i++){

			integration.real += this.parameters.dataSet[i];

		}

		this.parameters.real[0] = integration.real/this.parameters.dataSet.length;

	}

	switch(kind){

		case "pulse":
			return this.pulse;
			break;
		case "square":
			return this.square;
			break;
		case "triangle":
			return this.triangle;
			break;
		case "sawtooth":
			return this.sawtooth;
			break;
		case "sine":
			return this.sine;
			break;
		case "other":
			return this.other;
			break;
	}
	
}

WAVE.FourierSeries.prototype = {

	constructor: WAVE.FourierSeries

}

WAVE.Gain = function(destination,gain){

	this.kind = "WAVE.Gain"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.parameters = {gain:gain};
	this.destination = destination

	this.node = this.context.node.createGain();
	this.node.connect(destination.target);
	this.node.gain.value = gain;
	this.outputNode = this;

	return this;

}

WAVE.Gain.prototype = {

	constructor: WAVE.Gain,

	reroute: function(destination){

		this.node.disconnect();
		this.node.connect(destination);

		return this;

	},

	value: function(value){

		this.outputNode.node.gain.value = value;
		this.parameters.gain = value;
		
		return this;
	}

}

WAVE.Buffer = function(destination,duration,envelopeInfo){

	/*
		Duration = length of buffer in Miliseconds
		EnvelopeInfo = an array of objects that contain two parts
			envelopeInfo[x].amount & envelopeInfo[x].duration;
		EnvelopeInfo[x].amount = the state of the buffer(bufferOutput)
			(this can be a function as well);
		EnvelopeInfo[x].duration = a float between 0 & 1 representing
			percent of the envelope that state ocupies
	*/

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
		//console.log(parameter.onEnded);
		this.node.onended = function(){parameter.onEnded()}
		//}
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

//WAVE.DynamicBuffer = function(destination,duration)

WAVE.BinaryToArray = function(number){

	this.array = [];

	for(i=0;i<number.length;i++){

		this.array[i] = {}

		this.array[i].amount = parseInt(number.charAt(i),10);
		this.array[i].duration = 1/number.length

	}

	return this.array

}

WAVE.BinaryToArray.prototype = {

	constructor: WAVE.BinaryToArray

}

WAVE.Constant = function(destination,level){

	this.kind = "WAVE.Constant";

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.parameters = {value:level};
	this.bufferInfo = [{amount:1,duration:1}];
	this.outputNode = new WAVE.Gain(destination,level);
	this.bufferSource = new WAVE.BufferSource({object:this.outputNode,target:this.outputNode.node},new WAVE.Buffer({object:this.outputNode,target:this.outputNode.node},1000,this.bufferInfo),true,1)
	this.node = this.bufferSource.node;

	return this;

}

WAVE.Constant.prototype = {

	constructor: WAVE.Constant,

	value: function(value){

		this.outputNode.node.gain.value = value;
		this.parameters.value = value;

		return this;

	},

	start:function(){

		this.node.playbackRate.value = 1

		return this;

	},

	reroute: function(destination){

		this.outputNode.reroute(destination);

		return this;

	}

}

WAVE.Sampler = function(destination,bufferSources){

	this.kind = "WAVE.Sampler";
	if(destination.target === undefined){
		destination.target = destination.object.node;
	}
	this.context = destination.object.node;
	this.outputNode = new WAVE.Gain(destination,1)
	this.bufferSources=bufferSources;
	//if url is an array of samples make the sampler a multi track object;
	this.bufferSource = [];
	/*for (b=0;b<bufferSources.length;b++){
		bufferSources[b] = bufferSources[b].createBufferSource();
		this.bufferSource.push(bufferSources[b]);
		this.bufferSource[b].node.reroute(this.outputNode.node);
		this.bufferSource[b].analyser = new WAVE.Analyser(this.bufferSource[b].node);
	}*/
	//this.node = this.context.node.

}

WAVE.Sampler.prototype = {

	constructor:WAVE.Sampler,

	getScoreVoice:function(voice){
		return this.bufferSource[voice].node.node.playbackRate
	},

	cleanupBufferSources:function(){
		console.log('gotTriggered');
		for(eee=0;eee<this.bufferSource.length;eee++){
			if(this.bufferSource[eee].node.node.playbackRate.value!=0){
				if(this.bufferSource[eee].analyser.getVolume()<0.1){
					this.bufferSource[eee].node.node.disconnect();
				}
			}
		}
	},

	scheduleSample:function(value,time,mode,target){

		index = this.bufferSource.length
		this.bufferSource.push(this.bufferSources[target].createBufferSource(function(){
			//birdAudioHandler01.cleanUpBufferSources();
		}));
		//console.log(this.bufferSource.length,index);
		this.bufferSource[index].node.reroute(this.outputNode.node);

		//console.log(this.bufferSource.length,index,value,time)
		this.bufferSource[index].node.node.playbackRate.setValueAtTime(value,time);
		this.bufferSource[index].node.outputNode.node.gain.setValueAtTime(0,time+this.bufferSource[index].buffer.duration);

		//console.log(this.bufferSource.length,index)
		this.bufferSource[index].analyser = new WAVE.Analyser(this.bufferSource[index].node);
		//this.bufferSources.push(newBuffer);
		//console.log('bufferSource_Created');
	},

	updateBufferSources:function(score){

		for(b=0;b<this.bufferSources.length;b++){
			//console.log(this.bufferSource[b].analyser.getVolume());
			//Add conditional check if both there is no current audio output && the playback rate is larger than 0
			if(this.bufferSource[b].node.node.playbackRate.value!=0){
				if (this.bufferSource[b].analyser.getVolume()<0.075){	
					this.bufferSource[b].node.node.disconnect();
					this.bufferSource[b] = this.bufferSources[b].createBufferSource();
					this.bufferSource[b].node.reroute(this.outputNode.node);
					score.updateVoiceDestination(this.bufferSource[b].node.node.playbackRate,this.bufferSources[b].sampleIndex)
					this.bufferSource[b].node.node.connect(this.bufferSource[b].analyser.node)
				}
			}
		}
	},

	start:function(){

	},
	reroute:function(){

	},
	value:function(value){

	}
}

WAVE.LoadSampleFromUrl = function(destination,url){

	this.kind = 'WAVE.LoadSampleFromUrl';

	this.destination = destination;
	this.context = destination.object.context;
	this.loaded = false;
	this.sampleIndex =-1

	var request = new XMLHttpRequest();
	request.open('GET',url,true);
	request.responseType = 'arraybuffer';

	request.extraInfo = this;

	request.onload = function(){
		request.extraInfo.data = request.response
		//request.extraInfo.context.node.decodeAudioData(request.extraInfo.data)
		//request.extraInfo.initBufferSource();
	}
	request.send();
	//console.log(this.data);
	return this;
}
WAVE.LoadSampleFromUrl.prototype = {

	constructor:WAVE.LoadSampleFromUrl,

	initBufferSource(){
		this.decoded = this.context.node.decodeAudioData(this.data);
		return this;
	},
	createBufferSource(onEnded){
		//console.log(onEnded);
		var envelopeInfo = [];
		var bufferInfo = this.buffer.getChannelData(0);
		for (var a=0;a<bufferInfo.length;a++){
			envelopeInfo[a]={duration:1/bufferInfo.length,amount:bufferInfo[a]}
		}
		this.node = new WAVE.BufferSource({object:this.destination.object},new WAVE.Buffer({object:this.destination.object},this.buffer.duration*1000,envelopeInfo),false,1,{onEnded:onEnded});//function(){
			
			//console.log(birdAudioHandler01.getMixer())
			/*var mixer = birdAudioHandler01.getMixer();
			for (www=0;www<mixer.channel.length;www++){
				if (mixer.channel[www].voice!=undefined){
					if(mixer.channel[www].voice.kind=='WAVE.Sampler'){
						mixer.channel[www].voice.updateBufferSources(birdAudioHandler01.getScore());
					}
				}
			}
		}});*/

		return this;
	}

}

WAVE.Sequencer = function(destination,bpm,loopInfo){

	this.kind = "WAVE.Sequencer";

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.destination = destination;
	this.context = this.destination.object.context;
	this.output = this.destination.target;
	this.bpm = bpm;
	this.beatFrequency = this.bpm/60;
	this.dataBufferInfo = loopInfo;
	this.function = [];

	this.oscBank = {level:[{osc:[],gainIn:[]},{osc:[],gainIn:[]},{osc:[],gainIn:[]},{osc:[],gainIn:[]},{osc:[],gainIn:[]},{osc:[],gainIn:[]}]};

	var dataSet = {level:[{oscCount:1},{oscCount:2,duration:6000},{oscCount:3,duration:4000},{oscCount:4,duration:3000},{oscCount:6,duration:2000},{oscCount:8,duration:1500}],data:new Float32Array(12000),hold:0}

	this.oscBank.level[0].osc[0] = new WAVE.Constant({object:this.destination.object},0);
	this.oscBank.level[0].osc[0].outputNode.node.disconnect();

	for(m=1;m<6;m++){//loop through levels
		for(k=0;k<dataSet.level[m].oscCount;k++){//loop though oscillators on each level
			if(k!=0){
				dataSet.hold = k*dataSet.level[m].duration-1;
			}else{
				dataSet.hold = 0;
			}
			for(l=0;l<dataSet.level[m].duration;l++){
				dataSet.data[l+dataSet.hold] = 1;
			}
			this.oscBank.level[m].osc[k] = new WAVE.Oscillator({object:this.destination.object},0,"other",0,0,dataSet.data);
			this.oscBank.level[m].osc[k].outputNode.node.disconnect();
			this.oscBank.level[m].gainIn[k] = new WAVE.Gain({object:this.destination.object,target:this.oscBank.level[m].osc[k].node.frequency},this.beatFrequency);
			this.oscBank.level[0].osc[0].outputNode.node.connect(this.oscBank.level[m].gainIn[k].node);
			this.oscBank.level[m].osc[k].start();

			delete dataSet.data;
			dataSet.data = new Float32Array(12000);
		}
	}

	this.dummyGain = new WAVE.Gain(this.destination,0);

	this.dataBuffer = new WAVE.BufferSource({object:this.dummyGain},new WAVE.Buffer(this.destination,Math.floor(60000/this.bpm),[{amount:0.5,duration:1}]),this.dataBufferInfo,0);
	this.dataBuffer.start();

	this.calculationOffset = new WAVE.Delay({object:this.destination.object,target:this.oscBank.level[0].osc[0].outputNode.node.gain},0.1,0.0373,0);

	this.onOff = new WAVE.Constant({object:this.destination.object,target:this.calculationOffset.node},0);
	this.onOff.outputNode.node.connect(this.dataBuffer.node.playbackRate);

	this.voice = [];

	this.exicuteSequence = function(voiceIndex){

		if(this.voice[voiceIndex].changeSequence){
			for(i=0;i<6;i++){
				for(l=0;l<this.oscBank.level[i].osc.length;l++){
					this.voice[voiceIndex].level[i].gain[l].value(this.voice[voiceIndex].sequence.level[i].value[l]*(Math.pow(this.beatFrequency*this.oscBank.level[i].osc.length,this.voice[voiceIndex].sequence.kind)));
				}
			} 
		}
		this.voice[voiceIndex].changeSequence = false;
	}

	return this;
}

WAVE.Sequencer.prototype = {
	
	constructor:WAVE.Sequencer,

	initVoice: function(parameter,sequence){

		var voiceIndex = this.voice.length;
		this.voice[voiceIndex] = {};
		this.voice[voiceIndex].sequence = {level:[],beatInfo:{on:-1,off:-1},kind:sequence.kind}
	

		for(l=0;l<6;l++){
			this.voice[voiceIndex].sequence.level[l] = {value:[]};
			if(sequence.level[l]==null||sequence.level[l]==undefined){
				for(m=0;m<this.oscBank.level[l].osc.length;m++){
					this.voice[voiceIndex].sequence.level[l].value[m] = 0;
				}
			}else{
				for(m=0;m<this.oscBank.level[l].osc.length;m++){
					this.voice[voiceIndex].sequence.level[l].value[m] = sequence.level[l].value[m];
				}
			}
		}
		

		this.voice[voiceIndex].changeSequence = true;
		this.voice[voiceIndex].level = [{gain:[]},{gain:[]},{gain:[]},{gain:[]},{gain:[]},{gain:[]}];

		for(l=0;l<6;l++){
			for(m=0;m<this.oscBank.level[l].osc.length;m++){

				this.voice[voiceIndex].level[l].gain[m] = new WAVE.Gain({object:this.destination.object,target:parameter},0);

				this.oscBank.level[l].osc[m].outputNode.node.connect(this.voice[voiceIndex].level[l].gain[m].node);

			}
		}

		return this;
	},

	start: function(){

		for(j=0;j<this.voice.length;j++){

			this.exicuteSequence(j);

		}


		this.onOff.value(1);
		return this;
	
	}
}




WAVE.Delay = function(destination,maxTime,initalTime,feedbackAmount){

	this.kind = "WAVE.Delay";

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.parameters = {maxTime:maxTime,feedbackAmount:feedbackAmount,delayTime:initalTime};

	this.node = this.context.node.createDelay(this.parameters.maxTime);
	this.node.delayTime.value = initalTime;
	this.outputNode = new WAVE.Gain({object:destination.object},1);
	this.node.connect(this.outputNode.node);
	this.outputNode.node.connect(destination.target);

	if(feedbackAmount != 0){

		this.gainNode = new WAVE.Gain({object:destination.object,target:this.node},this.parameters.feedbackAmount)

		this.node.connect(this.gainNode.node);

	}

	return this

}

WAVE.Delay.prototype = {

	constructor: WAVE.Delay,

	feedbackAmount: function(value){

		if(this.parameters.feedbackAmount != 0){
			
			this.parameters.feedbackAmount = value;
			this.gainNode.node.gain.value = value;

		}else{
			
			this.parameters.feedbackAmount = value;
			this.gainNode = new WAVE.Gain({object:destination.object,target:this.node},this.feedbackAmount)

			this.node.connect(this.gainNode.node);
		}

		return this;

	},

	delayTime: function(value){

		this.node.delayTime.value = value;
		this.parameters.delayTime = value;

		return this;

	},

	reroute: function(destination){

		if(this.feedbackAmount == 0){
		
			this.outputNode.node.disconnect();
			this.outputNode.node.connect(destination);
		
		}else{

			this.outputNode.node.disconnect();
			this.outputNode.node.connect(destination);

		}

		return this;

	}

}

WAVE.Noise = function(destination){

	this.kind = "WAVE.Noise"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;

	this.outputNode = new WAVE.Gain(destination,1);
	this.bufferSource = new WAVE.BufferSource({object:destination.object,target:this.outputNode.node},new WAVE.Buffer(destination,8000,[{amount:function(i){return (Math.random()*2-1)},duration:1}]),true,1);

	this.node = this.bufferSource.node

	return this;
}

WAVE.Noise.prototype = {

	constructor: WAVE.Noise,

	reroute: function(destination){

		this.outputNode.reroute(destination);

		return this;

	},

	start: function(){

		this.bufferSource.start();

		return this;

	}
	
}

WAVE.FMOscillator = function(destination,carrierFrequency,harmonicityRatio,modulationIndex,carrierType,modulatorType){

	this.kind = "WAVE.FMOscillator"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.parameters = {
		carrierFrequency: carrierFrequency,
		harmonicityRatio: harmonicityRatio,
		modulationIndex: modulationIndex,
		carrierType: carrierType,
		modulatorType: modulatorType
	}

	this.outputNode = new WAVE.Gain(destination,0);
	this.carrierOscillator = new WAVE.Oscillator({object:this.outputNode},0,carrierType.type,carrierType.phase,carrierType.pwm,carrierType.dataSet)

	this.modulationGain = new WAVE.Gain({object:this.carrierOscillator,target:this.carrierOscillator.node.frequency},1);
	this.carrierFrequency = new WAVE.Constant({object:this.modulationGain},carrierFrequency);
	
	this.modulatorAmplitude = new WAVE.Gain({object:this.modulationGain},0);
	this.modulatingOscillator = new WAVE.Oscillator({object:this.modulatorAmplitude},0,modulatorType.type,modulatorType.phase,modulatorType.pwm,modulatorType.dataSet);

	this.modulationIndexGain = new WAVE.Gain({object:this.modulatorAmplitude,target:this.modulatorAmplitude.node.gain},0);
	this.modulationIndex = new WAVE.Constant({object:this.modulationIndexGain,target:this.modulationIndexGain.node.gain},modulationIndex);

	this.harmonicityRatioGain = new WAVE.Gain({object:this.modulationIndexGain},0);
	this.harmonicityRatioGain.node.connect(this.modulatingOscillator.node.frequency);
	this.harmonicityRatio = new WAVE.Constant({object:this.harmonicityRatioGain,target:this.harmonicityRatioGain.node.gain},harmonicityRatio);
	this.carrierFrequency.outputNode.node.connect(this.harmonicityRatioGain.node);

	this.carrierOscillator.start();
	this.modulatingOscillator.start();

	return this;

}

WAVE.FMOscillator.prototype = {

	constructor: WAVE.FMOscillator,

	setCarrierFrequency: function(value){

		if(typeof value == "number"){

			this.carrierFrequency.value(value);
			this.parameters.carrierFrequency = value;

		}else{

			this.carrierFrequency.node.disconnect();
			value.connect(this.carrierFrequency.outputNode.node);
			

		}

		return this;

	},

	setHarmonicityRatio: function(value){

		if(typeof value == "number"){

			this.harmonicityRatio.value(value);
			this.parameters.harmonicityRatio = value;

		}else{

			this.harmonicityRatio.node.disconnect();
			value.connect(this.harmonicityRatio.outputNode.node);

		}

		return this;

	},

	setModulationIndex: function(value){

		if(typeof value == "number"){

			this.modulationIndex.value(value);
			this.parameters.modulationIndex = value;

		}else{

			this.modulationIndex.node.disconnect();
			value.connect(this.modulationIndex.outputNode.node);

		}

		return this;

	},

	reroute: function(destination){

		this.outputNode.node.disconnect();
		this.outputNode.node.connect(destination);

		return this;

	},

	start: function(){

		this.outputNode.value(1);

		return this;

	}

}

WAVE.KarplusStrong = function(destination,frequency,feedbackAmount,preDelayFilter,postDelayFilter){

	this.kind = "WAVE.KarplusStrong"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;

	this.parameters = {};
	this.parameters.originalFrequency = frequency;
	this.parameters.frequency = frequency;
	this.parameters.feedbackAmount = feedbackAmount;
	this.parameters.preDelayFilter = preDelayFilter;
	this.parameters.postDelayFilter = postDelayFilter;
	this.parameters.calculateDelay = function(value){
		delay = Math.pow(Math.E,(-1*((20*(500*value+125619))/728699)));
		return delay;
	}

	if(frequency!=0){
		this.parameters.delayTime = Math.pow(Math.E,(-1*((20*(500*this.parameters.frequency+125619))/728699)));
	}else{
		this.parameters.delayTime = 0;
	}

	this.outputNode = new WAVE.Gain(destination,0);
	this.postFilterGainStage = new WAVE.Gain({object:this.outputNode},feedbackAmount);
	this.postFilter = new WAVE.BiquadFilter({object:this.postFilterGainStage},postDelayFilter.frequency,postDelayFilter.q,postDelayFilter.gain,postDelayFilter.type);
	this.delay = new WAVE.Delay({object:this.postFilter},1,0,0);
	this.postFilterGainStage.node.connect(this.delay.node);

	this.preDelayFilter = new WAVE.BiquadFilter({object:this.delay},preDelayFilter.frequency,preDelayFilter.q,preDelayFilter.gain,preDelayFilter.type);
	this.noiseEnvelope = new WAVE.Gain({object:this.preDelayFilter},0);
	this.noise = new WAVE.Noise({object:this.noiseEnvelope});

	this.frequency = new WAVE.Constant({object:this.delay,target:this.delay.node.delayTime},this.parameters.delayTime);

	return this;

}

WAVE.KarplusStrong.prototype = {

	constructor: WAVE.KarplusStrong,

	setEnvelopeSource: function(source){

		source.connect(this.noiseEnvelope.node.gain)

		return this;

	},

	setFrequency: function(value){

		if(typeof value == "number"){

			this.frequency.value(value);
			this.parameters.frequency = value;

		}else{

			this.frequency.value(0);
			value.connect(this.frequency.outputNode.node.gain);
		}

		return this;

	},

	reroute: function(destination){

		this.outputNode.node.disconnect();
		this.outputNode.node.connect(destination);

		return this;

	},

	start: function(){

		this.noise.start();
		this.frequency.start();
		this.outputNode.value(1);

		return this;

	}

}


WAVE.BiquadFilter = function(destination,frequency,q,gain,type){

	this.kind = "WAVE.BiquadFilter";


	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.parameters = {frequency:frequency,q:q,gain:gain,type:type};

	this.node = this.context.node.createBiquadFilter();
	this.outputNode = new WAVE.Gain({object:destination.object,target:destination.target},1);
	this.node.connect(this.outputNode.node);
	this.node.frequency.value = frequency;
	this.node.Q.value = q;
	this.node.gain.value = gain;
	this.node.type = type;

	return this;

}

WAVE.BiquadFilter.prototype = {

	constructor: WAVE.BiquadFilter,

	frequency: function(value){

		this.node.frequency.value = value;
		this.parameters.frequency = value;
		
		return this
	},

	gain: function(value){

		this.node.gain.value = value;
		this.parameters.gain = value;
	
		return this
	},

	q: function(value){

		this.node.Q.value = value;
		this.parameters.q = value;

		return this
	},

	type: function(type){

		this.node.type = type;
		this.parameters.type = type;
		
		return this

	},

	reroute: function(destination){

		this.outputNode.node.disconnect();
		this.outputNode.reroute(destination);

		return this
	}
}

WAVE.ArrayBuilder = function(array,data){

	if(data[0].duration === undefined){

		this.data = [];

		for(i=0;i<data.length;i++){

			this.data[i] = {amount:data[i],duration:Math.floor(array.length/data.length)}

		}

	}else{

		var sum = 0;
		var durFactor = 0;

		this.data = [];

		for(i=0;i<data.length;i++){

			sum += data[i].duration;

		}

		if(sum < array.length && sum == 1){

			durFactor = array.length;

		}else{

			durFactor = 1;

		}

		for(i=0;i<data.length;i++){

			this.data[i] = {amount:data[i].amount,duration:Math.floor(data[i].duration*durFactor)};

		}

	}

	var arrayIndex = 0;

	for(i=0;i<this.data.length;i++){

		for(j=0;j<this.data[i].duration;j++){

			if(typeof this.data[i].amount === "number"){

				array[j+arrayIndex] = this.data[i].amount

			}else{

				array[j+arrayIndex] = this.data[i].amount(j,this.data[i].duration);

			}

		}

		arrayIndex += this.data[i].duration;

	}

	return array;

}

WAVE.ArrayBuilder.prototype = {

	constructor: WAVE.ArrayBuilder

}

WAVE.Compressor = function(destination,threshold,ratio,knee,attack,release){

	this.kind = "WAVE.Compressor"

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.parameters = {threshold:threshold,ratio:ratio,knee:knee,attack:attack,release:release};
	this.node = this.context.node.createDynamicsCompressor();
	this.node.threshold.value = threshold;
	this.node.ratio.value = ratio;
	this.node.knee.value = knee;
	this.node.attack.value = attack;
	this.node.release.value = release;
	this.outputNode = new WAVE.Gain(destination,1);
	this.outputNode.node.connect(destination.target);
	this.node.connect(this.outputNode.node);

	return this;

}

WAVE.Compressor.prototype = {

	constructor: WAVE.Compressor,

	reroute: function(destination){

		this.node.disconnect();
		this.node.connect(destination);

		return this;
	}
}

WAVE.BassDrum = function(destination,frequencyInfo,envelopeInfo){

	this.kind = "WAVE.BassDrum";

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.outputNode = new WAVE.Gain(destination,5)
	this.envelopeNode = new WAVE.Gain({object:this.outputNode},0);
	this.envelope = new WAVE.Oscillator({object:this.envelopeNode,target:this.envelopeNode.node.gain},0,"other",0,0,envelopeInfo);

	this.filterBank = [];
	this.filterBank[2] = new WAVE.BiquadFilter({object:this.envelopeNode},0,0.5,1,"lowpass");
	this.filterBank[1] = new WAVE.BiquadFilter({object:this.filterBank[2]},0,100,1,"bandpass");
	this.filterBank[0] = new WAVE.BiquadFilter({object:this.filterBank[1]},0,0.8,1,"lowpass");

	this.noiseSource = new WAVE.Noise({object:this.filterBank[0]});

	this.frequencyGainBank = [];
	this.frequencyGainBank[0] = new WAVE.Gain({object:this.filterBank[0],target:this.filterBank[0].node.frequency},1.25)
	this.frequencyGainBank[0].node.connect(this.filterBank[2].node.frequency);
	this.frequencyGainBank[1] = new WAVE.Gain({object:this.filterBank[1],target:this.filterBank[1].node.frequency},frequencyInfo.frequency);
	this.frequencyGainBank[1].node.connect(this.frequencyGainBank[0].node);

	this.frequencyOsc = new WAVE.Oscillator({object:this.frequencyGainBank[1]},0,"other",0,0,frequencyInfo.array);

	this.triggerNode = new WAVE.Constant({object:this.frequencyOsc,target:this.frequencyOsc.node.frequency},0);
	this.triggerNode.outputNode.node.connect(this.envelope.node.frequency);
	this.triggerNode.start();

	return this;

}

WAVE.BassDrum.prototype = {

	constructor: WAVE.BassDrum,

	reroute: function(destination){

		this.outputNode.node.disconnect();
		this.outputNode.node.connect(destination);

		return this;

	},

	setFrequency: function(value){

		if(typeof value == "number"){

			this.frequencyGainBank[1].node.gain.value = value;

		}else{

			value.connect(this.frequencyGainBank[1].node.gain);

		}

		return this;

	},

	setTriggerSource: function(source){

		if(typeof source == "number"){

			this.triggerNode.value(source)

		}else{

			//this.triggerNode.node.disconnect();
			source.connect(this.triggerNode.outputNode.node.gain);

		}

		return this;

	},

	start: function(){

		this.envelope.start();
		this.noiseSource.start();
		this.frequencyOsc.start();

		return this;

	}

}

WAVE.BeatRepeat = function(destination,parameter){

	this.kind = "WAVE.BeatRepeat";

	if(destination.target === undefined){

		destination.target = destination.object.node;
	
	}

	this.context = destination.object.context;
	this.destination = destination;
	this.parameter = parameter;

	this.outputNode = new WAVE.Gain(destination,parameter.level);
	this.delay = new WAVE.Delay({object:this.outputNode},1,parameter.delayTime,1);
	this.delay.gainNode.value(0);

	this.wetGain = new WAVE.Gain({object:this.delay},0);
	this.dryGain = new WAVE.Gain({object:this.outputNode},1);

	this.dryValueInversion = new WAVE.Gain({object:this.dryGain,target:this.dryGain.outputNode.node.gain},-1);
	this.feedbackTriggerIn = new WAVE.Gain({object:this.dryValueInversion},1);//flips 1/0 values for dryGain and delayfeedback
	this.feedbackTriggerIn.outputNode.node.connect(this.delay.gainNode.node.gain);

	this.wetTriggerIn = new WAVE.Gain({object:this.dryGain,target:this.dryGain.outputNode.node.gain},1);//triggerIn for the wetGain
	this.wetTriggerIn.outputNode.node.connect(this.wetGain.outputNode.node.gain);//at the start of the delay, dryGain = 0 but while it is delaying dryGain needs to == 1 this does that

	this.inlet = new WAVE.Gain({object:this.wetGain},1);
	this.inlet.outputNode.node.connect(this.dryGain.node);
	this.node = this.inlet.node;

	return this;

}

WAVE.BeatRepeat.prototype = {

	constructor: WAVE.BeatRepeat,

	reroute: function(destination){

		this.outputNode.reroute(destination);

		return this;
	},

	delayTime: function(value){

		this.parameter.delayTime = value;
		this.delay.node.delayTime.value(value);

		return this;
	}

}

WAVE.FrequenciesByNote = function(destination,parameter){

	this.kind = "WAVE. FrequenciesByNote";

	if (destination.target === undefined){
		destination.target = destination.object.node;
	}

	this.context = destination.object.context;
	this.destination = destination;
	//Works on set theory, a==0,Bb==1 and so on, and then octave
	this.notes = [
		[27.5,55,110,220,440,880,1760,3520,7040],
		[29.14,58.27,116.54,233.08,466.16,932.33,1864.66,3729.31,7458.62],
		[30.87,61.74,123.47,246.94,493.88,987.77,1975.53,3951.07,7902.13],
		[16.35,32.70,65.41,130.81,261.63,523.25,1046.50,2093.00,4186.01],
		[17.32,34.65,69.30,138.59,277.18,554.37,1108.73,2217.46,4434.92],
		[18.35,36.71,73.42,146.83,293.66,587.33,1174.66,2349.32,4698.63],
		[19.45,38.89,77.78,155.56,311.13,622.25,1244.51,2489.02,4978.03],
		[20.60,41.20,82.41,164.81,329.63,659.25,1318.51,2637.02,5274.04],
		[21.83,43.65,87.31,174.61,349.23,698.46,1396.91,2793.83,5587.65],
		[23.12,46.25,92.50,185.00,369.99,739.99,1479.98,2959.96,5919.91],
		[24.50,49.00,98.00,196.00,392.00,783.99,1567.98,3135.96,6271.93],
		[25.96,51.91,103.83,207.65,415.30,830.61,1661.22,3322.44,6644.88]
	]

	return this;
}

WAVE.FrequenciesByNote.prototype = {

	constructor: WAVE.FrequenciesByNote,

	getFrequencyByNote(note,octave){

		return this.notes[note][octave];

	},

	getNoteByFrequency(frequency){

		var dif = 1;
		var i = 1;
		while (dif>=1){
			dif = frequency/Math.pow(10,i);
			i++;
		}
		var between = {};
		i--;
		i=(i-1)*i;
		for (j=i;j<9;j++){
			for (k=0;k<12;k++){
				if (k!=11){
					var smallIndex = (k+3)%12
					var largeIndex = (k+4)%12
					if (frequency-notes[smallIndex][j]>0&&notes[largeIndex][j]-frequency>0){
						//It is between those two values
						between.low = [smallIndex,j];
						between.high = [largeIndex,j];
					}
				}else{
					if (frequency-notes[2][j]>0&&notes[3][j+1]-frequency>0){
						//It is between those two values;
						between.low = [2,j];
						between.high = [3,j+1];
					}
				}
			}
		}
		between.cents.high = 1200*Math.log2(between.high/frequency);

		if (between.cents.low<between.cents.high){
			between.cents = 1200*Math.log2(frequency/between.low);
			var output = {frequency:this.notes[between.low[0]][between.low[1]],note:between.low[0],octave:between.low[1],cents:between.cents}
		}else{
			between.cents = -1200*Math.log2(between.high/frequency);
			var output = {frequency:this.notes[between.high[0]][between.high[1]],note:between.high[0],octave:between.high[1],cents:between.cents}
		}

		return output;
	}



}
