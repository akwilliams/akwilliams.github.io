var birdVisualHandler01 = function(){
	var visMode, scoreInfo;
	var visInfo = {}	
	var shipPos;
     var soundInfo = {};
	var squid;

	function birdVisualHandler01(processing){
		processing.draw = function(){
     	 	processing.background(0,0,0)
               processing.strokeWeight(0)
               processing.stroke(0,0,0);
		processing.rotate(0);
     	 	for(iiii=0;iiii<visInfo.stars.length;iiii++){
     	 		processing.fill(visInfo.stars[iiii].r,visInfo.stars[iiii].g,visInfo.stars[iiii].b);
     	 		processing.ellipse(visInfo.stars[iiii].x,visInfo.stars[iiii].y,visInfo.stars[iiii].w,visInfo.stars[iiii].h);
     	 	}

     	 	//Render ship
     	 	//Add Velocity to current position
     	 	visInfo.ship.velocity.x+=visInfo.ship.force.x;
		if (visInfo.ship.velocity.x>window.innerHeight/12){
			visInfo.ship.velocity.x=window.innerHeight/12
		}
     	 	visInfo.ship.velocity.y+=visInfo.ship.force.y;
		if (visInfo.ship.velocity.y>window.innerHeight/12){
			visInfo.ship.velocity.y=window.innerHeight/12	
		}

     	 	visInfo.ship.position.x+=visInfo.ship.velocity.x;
     	 	visInfo.ship.position.y+=visInfo.ship.velocity.y;
     	 	if(visInfo.ship.position.x<0||visInfo.ship.position.x>processing.width||visInfo.ship.position.y<0||visInfo.ship.position.y>processing.height){
     	 	  if (visInfo.ship.position.x<0){
     	 	  	visInfo.ship.position.x=processing.width;
     	 	  }else if (visInfo.ship.position.x>processing.width){
     	 	  	visInfo.ship.position.x=0;
     	 	  }

     	 	  if (visInfo.ship.position.y<0){
     	 	     visInfo.ship.position.y=processing.height;
     	 	  }else if (visInfo.ship.position.y>processing.height){
     	 		visInfo.ship.position.y=0;
     	 	  }
               }

     	 	var angle = Math.atan(((processing.mouseY-visInfo.ship.position.y)/(processing.mouseX-visInfo.ship.position.x)))/Math.PI*2
     	 	visInfo.ship.angle=angle;
     	 	if (angle<0&&(processing.mouseX-visInfo.ship.position.x)<0){
     	 		angle=angle*(90)+90
     	 	}else if (angle<0&&(processing.mouseX-visInfo.ship.position.x)>0){
     	 		angle=(angle*(90))+270
     	 	}else if (angle>0&&(processing.mouseY-visInfo.ship.position.y)>0){
     	 		angle=((angle)*(90))+180;
     	 	}else{
     	 		angle=((angle)*(90));
     	 	}
		
               processing.noFill()
     	 	for (iiii=0;iiii<visInfo.projectile.length;iiii++){
     	 		if(visInfo.projectile[iiii].hit!=true){
     	 			for (jjjj=0;jjjj<visInfo.notes.length;jjjj++){
     	 				if (Math.abs(visInfo.projectile[iiii].position.x-visInfo.notes[jjjj].position.x)<visInfo.notes[jjjj].width&&Math.abs(visInfo.projectile[iiii].position.y-visInfo.notes[jjjj].position.y)<visInfo.notes[jjjj].width){
     	 					visInfo.notes[jjjj].hit=true;
     	 					visInfo.projectile[iiii].hit=true;
     	 				}
     	 			}
     	 		}
     	 	}

     	 	//Render Projectiles
     	 	for (iiii=0;iiii<visInfo.projectile.length;iiii++){
     	 		if(visInfo.projectile[iiii]!=undefined){
     	 			if (visInfo.projectile[iiii].hit){
     	 				visInfo.projectile.splice(iiii,1);
     	 				iiii--;
     	 			}else{
     	 				processing.stroke(256,200,100);
     	 				processing.ellipse(visInfo.projectile[iiii].position.x,visInfo.projectile[iiii].position.y,10,10)
     	 				visInfo.projectile[iiii].position.x+=visInfo.projectile[iiii].velocity.x
     	 				visInfo.projectile[iiii].position.y+=visInfo.projectile[iiii].velocity.y
     	 				if(visInfo.projectile[iiii].position.x<0||visInfo.projectile[iiii].position.x>processing.width||visInfo.projectile[iiii].position.y<0||visInfo.projectile[iiii].position.y>processing.height){
     	 					visInfo.projectile.splice(iiii,1);
     	 					iiii--;
     	 				}
     	 			}
     	 		}	
     	 		
     	 	}

     	 	//Update notes if hit
     	 	for (iiii=0;iiii<visInfo.notes.length;iiii++){
     	 		if (visInfo.notes[iiii].hit){
                         triggerSoundThing(visInfo.notes[iiii].voice,visInfo.notes[iiii].type);
                         if (visInfo.notes[iiii].type>1){
                              var typeHold = Math.floor((Math.random()*3)-0.01)*2+2;
          	 			for (jjjj=0;jjjj<typeHold;jjjj++){

     	     				spawnNewNote(visInfo.notes[iiii].position.x,visInfo.notes[iiii].position.y,visInfo.notes[iiii].type/typeHold,visInfo.notes[iiii].voice)
     	 	  		   }
                         }
                         visInfo.notes.splice(iiii,1);
                         iiii--;
     	 		}
     	 	}

     	 	//Render Notes
     	 	/*for (iiii=0;iiii<visInfo.notes.length;iiii++){
     	 		processing.stroke(100+((200*visInfo.notes[iiii].voice/2)-100),200-(200*visInfo.notes[iiii].voice/2),256*visInfo.notes[iiii].voice/2);
     	 		processing.fill(100+((200*visInfo.notes[iiii].voice/2)-100),200-(200*visInfo.notes[iiii].voice/2),256*visInfo.notes[iiii].voice/2);
     	 		processing.ellipse(visInfo.notes[iiii].position.x,visInfo.notes[iiii].position.y,Math.random()*10+visInfo.notes[iiii].width,Math.random()*10+visInfo.notes[iiii].width)
     	 		visInfo.notes[iiii].position.x+=visInfo.notes[iiii].velocity.x;
     	 		visInfo.notes[iiii].position.y+=visInfo.notes[iiii].velocity.y;
     	 		if (visInfo.notes[iiii].position.x<0||visInfo.notes[iiii].position.x>processing.width||visInfo.notes[iiii].position.y<0||visInfo.notes[iiii].position.y>processing.height){
     	 			visInfo.notes.splice(iiii,1);
     	 			iiii--
     	 		}
     	 	}*/
               processing.strokeWeight(4);
               processing.noFill()
               processing.stroke(256,256,256)
		processing.imageMode(processing.CENTER)
		processing.pushMatrix();
		processing.translate(visInfo.ship.position.x,visInfo.ship.position.y)
		processing.rotate(processing.radians(angle));
		processing.image(squid,0,0);
		processing.popMatrix();
               //processing.beginShape();
               //processing.vertex(visInfo.ship.position.x+(25*Math.cos((angle*(Math.PI/180)))),visInfo.ship.position.y-(25*Math.sin((angle*(Math.PI/180)))));
               //processing.vertex(visInfo.ship.position.x+(25*Math.cos((150+angle)*(Math.PI/180))),visInfo.ship.position.y-(25*Math.sin((150+angle)*(Math.PI/180))))
               //processing.vertex(visInfo.ship.position.x+(10*Math.cos((180+angle)*(Math.PI/180))),visInfo.ship.position.y-(10*Math.sin((180+angle)*(Math.PI/180))))
               //processing.vertex(visInfo.ship.position.x+(25*Math.cos((210+angle)*(Math.PI/180))),visInfo.ship.position.y-(25*Math.sin((210+angle)*(Math.PI/180))))
               //processing.vertex(visInfo.ship.position.x+(25*Math.cos((angle*(Math.PI/180)))),visInfo.ship.position.y-(25*Math.sin((angle*(Math.PI/180)))));
               //processing.endShape();

     	 	if (visInfo.playerMode==0){
     	 		if(Math.random()>0.99){
     	 			spawnNewNote(Math.random()*processing.width,Math.random()*processing.height,4);
     	 		}
     	 	}
		}
		processing.mousePressed = function(){
			if (visInfo.playerMode == 0){
				calculateForce(processing.mouseX,processing.mouseY,1200)
				//trigger audio
			}
		}
		processing.mouseDragged = function(){
			calculateForce(processing.mouseX,processing.mouseY,1)
		}
		processing.mouseReleased = function(){
			if (visInfo.playerMode == 0){
				calculateForce(0,0,600,true);
			}
		}
		processing.keyPressed = function(){
			if (processing.key.code==32){
				spawnNewProjectile(processing.mouseX,processing.mouseY,visInfo.ship.position.x,visInfo.ship.position.y);
			}
		}
          processing.setup = function(){
               processing.frameRate(30);
		if(window.innerWidth>1430){
			squid=processing.loadImage("squid.png","png");
			console.log('squid',window.innerWidth)
		}else if (window.innerWidth>1000){
			squid=processing.loadImage("squid1.png","png");
			console.log('squid1',window.innerWidth);
		}else{
			squid=processing.loadImage("squid2.png","png");	
			console.log('squid2',window.innerWidth);
		}
          }
	}
	function spawnNewProjectile(x,y,x1,y1){
		visInfo.projectile.push({position:{x:x1,y:y1},velocity:{x:(x-x1)/(60*2),y:(y-y1)/(60*2)},target:{x:x,y:y},hit:false});
	}

	function spawnNewNote(x,y,type,voice){
          if(voice==undefined){
               visInfo.notes.push({position:{x:x,y:y},velocity:{x:Math.random()*2-1,y:Math.random()*2-1},width:Math.random()*18+type*20,type:type,hit:false,voice:Math.floor(Math.random()*2)});//note types are determined by their duration 4=whole, 2=half, 1=quarter and so on
	     }else{
               visInfo.notes.push({position:{x:x,y:y},velocity:{x:Math.random()*2-1,y:Math.random()*2-1},width:Math.random()*18+type*20,type:type,hit:false,voice:voice});//note types are
          }
     }

	function calculateForce(x,y,factor,stop){
		//visInfo.ship.force = {x:(x-visInfo.ship.position.x)/factor,y:-1*(y-visInfo.ship.position.y)/factor}
		if (stop){
			visInfo.ship.force = {x:0,y:0};
		}else{
			visInfo.ship.force = {x:(Math.cos(visInfo.ship.angle)),y:Math.sin(visInfo.ship.angle)}
		}
		if (x<visInfo.ship.position.x){
			visInfo.ship.force.x=visInfo.ship.force.x*-1
		}
		if (y<visInfo.ship.position.y){
			visInfo.ship.force.y=Math.abs(visInfo.ship.force.y)*-1
		}
		if (y>visInfo.ship.position.y){
			visInfo.ship.force.y=Math.abs(visInfo.ship.force.y)
		}
		if (Math.abs(x-visInfo.ship.position.x)>Math.abs(y-visInfo.ship.position.y)){
			visInfo.ship.force.y=visInfo.ship.force.y/Math.abs(x-visInfo.ship.position.x)
		}else{
			visInfo.ship.force.x=visInfo.ship.force.x/Math.abs(y-visInfo.ship.position.y)
		}

		//console.log(Math.cos(visInfo.ship.angle),Math.sin(visInfo.ship.angle))

	}

	function init(canvasID,options){

		var canvas = document.getElementById(canvasID);
		var p = new Processing(canvas,birdVisualHandler01);
		p.width = window.innerWidth;
		p.height = window.innerHeight;
		canvas.width = p.width;
		canvas.height = p.height;
		visInfo.playerMode = 0;
		visInfo.stars = [];
		

		for(iiii=0;iiii<65;iiii++){
			visInfo.stars[iiii]={x:Math.floor(Math.random()*p.width),y:Math.floor(Math.random()*p.height),w:Math.floor(Math.random()*12)+4,h:Math.floor(Math.random()*12)+4,r:200+Math.floor(Math.random()*56),g:200+Math.floor(Math.random()*56),b:200+Math.floor(Math.random()*56)}
		}

		visInfo.mouseClick=false;

		visInfo.ship = {position:{x:p.width/2,y:p.height/2},velocity:{x:0,y:0},force:{x:0,y:0},angle:0};

		visInfo.projectile = [];

		visInfo.notes = [];

          soundInfo.startFunction();


	}

     function triggerSoundThing(voice,type){
	     
	  //Get Current Time
	  var currentTime = soundInfo.mixer.context.node.currentTime
	  var sequenceStart = soundInfo.score.startTime;
	  var beatsSinceStart = (currentTime-sequenceStart)*(soundInfo.score.tempo/60)
	  var currentMeasure = Math.floor(beatsSinceStart/soundInfo.score.beatsPerMeasure);
	  var currentBeat = (beatsSinceStart%soundInfo.score.beatsPerMeasure)
	  //Schedule Note, do not que
          var threshold= Math.random();
          if(type<0){
               var choices = [1/2,1/3,1/4]
               var type = choices[Math.floor(Math.random()*choices.length)]
          }
          if (soundInfo.beatIndex[voice].measure<currentMeasure){
               soundInfo.beatIndex[voice].measure=currentMeasure;
          }
	  if (soundInfo.beatIndex[voice].measure==currentMeasure&&soundInfo.beatIndex[voice].beat<currentBeat){
               soundInfo.beatIndex[voice].beat = currentBeat
          }
	  soundInfo.beatIndex[voice].beat+=type;
          while(soundInfo.beatIndex[voice].beat>soundInfo.score.beatsPerMeasure){
               soundInfo.beatIndex[voice].measure++;
               soundInfo.beatIndex[voice].beat-=soundInfo.score.beatsPerMeasure;
          }
          if(threshold>0.33){
               
	       var note = Math.floor(Math.random()*10)+1;
			
	       while (note>2){
			note=note/2;
		}
               soundInfo.score.scheduleNote([0,soundInfo.beatIndex[voice].measure,note,soundInfo.beatIndex[voice].beat,0])
		//soundInfo.score.addNote(voice,soundInfo.beatIndex[voice].measure,1,soundInfo.beatIndex[voice].beat,0);
          }
	  /*soundInfo.beatIndex[voice].beat+=type;
          while(soundInfo.beatIndex[voice].beat>soundInfo.score.beatsPerMeasure){
               soundInfo.beatIndex[voice].measure++;
               soundInfo.beatIndex[voice].beat-=soundInfo.score.beatsPerMeasure;
          }*/
          /*
	  switch(voice){
               case 0:
                    soundInfo.score.addNote(4,soundInfo.beatIndex[voice].measure,soundInfo.possibleNotes[voice][Math.floor(soundInfo.possibleNotes[voice].length*Math.random())],soundInfo.beatIndex[voice].beat,0);
                    break;
               case 1:
                    soundInfo.score.addNote(5,soundInfo.beatIndex[voice].measure,soundInfo.possibleNotes[voice][Math.floor(soundInfo.possibleNotes[voice].length*Math.random())],soundInfo.beatIndex[voice].beat,0);
                    break;
          }
          soundInfo.beatIndex[voice].beat+=type;
          while(soundInfo.beatIndex[voice].beat>soundInfo.score.beatsPerMeasure){
               soundInfo.beatIndex[voice].measure++;
               soundInfo.beatIndex[voice].beat-=soundInfo.score.beatsPerMeasure;
          }
          if (soundInfo.beatIndex[voice].beat!=0){
               soundInfo.score.addNote(voice,soundInfo.beatIndex[voice].measure,0,soundInfo.beatIndex[voice].beat-0.05,0);
          }else{
               soundInfo.score.addNote(voice,soundInfo.beatIndex[voice].measure-1,0,3.95,0);
          }*/
          //soundInfo.mixer.channel[2].insert[0].effect.node.gain.setValueAtTime(1,soundInfo.mixer.context.node.currentTime+0.01)
          //soundInfo.mixer.channel[2].insert[0].effect.node.gain.setValueAtTime(0,soundInfo.mixer.context.node.currentTime+0.5)
         
          //soundInfo.mixer.channel[2].voice.carrierFrequency.outputNode.node.gain.setValueAtTime(2000+(Math.random()*800),soundInfo.mixer.context.node.currentTime+0.01)
          //soundInfo.mixer.channel[1].voice.carrierFrequency.outputNode.node.gain.setValueAtTime(1200+(Math.random()*800),soundInfo.mixer.context.node.currentTime+0.01)
     
     }

     function loadMixer(mixer){
          soundInfo.mixer = mixer;
     }
     function loadScore(score){
          if (score!=undefined){
               soundInfo.score = score;
          }
          soundInfo.beatIndex = [{measure:0,beat:0},{measure:0,beat:0}];
          soundInfo.possibleNotes = [[440,392,329.63,493.88,523.25,587.33,659.25,698.46,783.99,880,1046.5,1318.51,1396,911567.98],[27.5,41.2,43.65,49.00,55,61.74,65.41,82.41,110]]
     }
     function loadStartButton(start){
          soundInfo.startFunction = start;
     }

	return{

		init:init,
          loadMixer:loadMixer,
          loadScore:loadScore,
          loadStartButton:loadScore
		/*setup:setup,
		render:render,
		onWindowResize:onWindowResize,
		getPixelInfo:getPixelInfo,
		stopAnimateionRequest:stopAnimationRequest,
		restartAnimationRequest:restartAnimationRequest*/
	}
}();
