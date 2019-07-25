var dots = new Array();
var dotStarColor = "#333333";
var dotStarBGColor = "#000000";
var palette = new Array("#000000", "#ffffff","#ff0000","#00ff00","#0000ff","#ffff00","#ff00ff","#00ffff","#ff9900","#99ff00","#0099ff","#9900ff");
var curPal = 1;
var tools = new Array("pencil", "marker", "rect", "shell", "fill");
var curTool = 0;
var shape = '240mm';
var canvasWidth = 500;
var canvasHeight = 500;
var centerX = 250;
var centerY = 250;
var shellWidth = 20;
var dotRadius = 6;
var shellNums = new Array(48,44,40,32,28,24,20,12,6,1);
var shellPos = new Array();
var paint = false;
var cursorColor = "#FF0000";
var startRectX = 0;
var endRectX = 0;
var startRectY = 0;
var endRectY = 0;

//Change the tool
function changeTool(t) {
	curTool=t;
	console.log("Changing tool: " + t);
	document.getElementById('toolbarimg').style.backgroundPosition = t*30+" 0";
	if (shape != "240mm" && t == 3)
		alert("Circle tool only available in 240mm disc mode")
}

//Select a new palette position number
function changePal(num) {
	curPal = num;
	document.getElementById('palEdit').value = palette[curPal];
	for(i=0;i<palette.length;i++){
		document.getElementById('pal'+i).className = (i==curPal) ? "palButton palSelected" : "palButton";
		}
		console.log("Changing palette: " + num);
}

//Change palette position color value
function editPal(e) {
        if (e.keyCode == 13){  //on Enter 
			var patt = new RegExp("#[0-9|a-f|A-F]{6}");
			if (patt.test(document.getElementById('palEdit').value)) {
                palette[curPal] = document.getElementById('palEdit').value;  //update the array with new color
				document.getElementById('palEdit').blur();
				document.getElementById('pal'+curPal).style.backgroundColor = palette[curPal]; //update the palette with new color
				reDraw();  //reDraw the canvas with newly updated color
				}
			} else {
				return false;
			}
        return false;
	console.log("Successfully changed palette value: " + num + " | " + palette[curPal]);
	return true;
}

//reDraw the entire canvas
function reDraw() {
	ctx.fillStyle = dotStarBGColor;
	ctx.rect(0,0,canvasWidth,canvasHeight);
	ctx.fill();
	ctx.fillStyle = dotStarColor;
	ctx.beginPath();
	switch (shape) { //draw the LEDs based on the positions in the DotStar array type
		case '240mm':
			ctx.arc(centerX,centerY,shellNums.length*shellWidth,0*Math.PI,2*Math.PI);
		break;
		case '8x32':
			ctx.rect(10,10,canvasWidth-20, canvasHeight-20);
		break;
		}
	ctx.fill();
	for(i=0;i<dots.length;i++){
		drawDot(shellPos[i][0],shellPos[i][1],palette[dots[i]]);
	}
	//update the Arduino Code
	var ac = "const uint32_t   pal[12] PROGMEM = {\n\t\t";
	for(i=0;i<palette.length;i++){
		if (i>0)
			ac += ',';
		ac += palette[i];
	}
	ac = ac.replace(/#/ig, "0x");
	ac += "\n\t};\n";
	ac += "const byte dots[] PROGMEM = {\n\t\t";
	for (i=0;i<dots.length;i++){
		if (i>0)
			ac += ",";
		ac += dots[i];
	}
	ac += "\n\t};\n";
	ac += "for (int i=0;i<"+dots.length+";i++){\n";
	ac +="\tstrip.setPixelColor(i, palette[dots[i]]);\n";
	ac +="}\n";
	ac +="strip.show();\n";
	ac +="delay(20);";
	document.getElementById("arduinoCode").textContent = ac;
}

//draw an individual DotStar LED
function drawDot (x, y, color) {
	ctx.fillStyle=color;
	ctx.beginPath();
	ctx.arc(x,y,dotRadius,0,2*Math.PI);
	ctx.fill();
	return 1;
}

//draw, based on user-selected tool
function addClick(x,y) {
	if (paint) {
		switch (tools[curTool]) {
			case 'pencil':  //small dot
				for(i=0;i<dots.length;i++){
					if (Math.abs(shellPos[i][0] - x) < 6 && Math.abs(shellPos[i][1] - y) < 6) {
						dots[i] = curPal;
					}
				}
			break;
			case 'marker':  //large dot
				for(i=0;i<dots.length;i++){
					if (Math.sqrt(Math.pow(Math.abs(shellPos[i][0] - x),2) + Math.pow(Math.abs(shellPos[i][1] - y),2)) < 30) {
						dots[i] = curPal;
					}
				}
			break;
			case 'rect':  //this is a special case, due to its "click and drag" functionality
			
			break;
			case 'shell':  //only applicable to the disc.  Fill the entire shell (circle) with palette color
				if (shape != '240mm')
					break;
				distToCenter = Math.sqrt(Math.pow(Math.abs(x-centerX),2) + Math.pow(Math.abs(y-centerY),2));
				//console.log(distToCenter);
				countIt = 0;
				for(shell=0;shell<shellNums.length;shell++) {
						if (Math.abs((shellNums.length-shell-1) * shellWidth - distToCenter) < 6) {
						//console.log("Close"+shell);
							for (i=0;i<shellNums[shell];i++){
								dots[countIt+i] = curPal;
								//console.log(countIt+i);
							}
						}
						countIt += shellNums[shell];
					}		
			break;
			case 'fill':   //flood fill all the DotStar LEDs with palette color
				for (i=0; i<dots.length; i++) {
					dots[i] = curPal;
				}
			break;
		}
	}
	reDraw();
	drawcursor(x,y);
}

//show the user which DotStar LEDs they'll be changing
function drawcursor(x,y) {
	switch (tools[curTool]) {
		case 'pencil':
			ctx.strokeStyle=cursorColor;
			ctx.beginPath();
			ctx.arc(x,y,dotRadius,0,2*Math.PI);
			ctx.stroke();
		break;
		case 'marker':
			ctx.strokeStyle=cursorColor;
			ctx.beginPath();
			ctx.arc(x,y,26,0,2*Math.PI);
			ctx.stroke();
		break;
		case 'rect':
			ctx.strokeStyle=cursorColor;
			ctx.beginPath();
			ctx.moveTo(x-8,y);
			ctx.lineTo(x+8, y);
			ctx.moveTo(x,y-8);
			ctx.lineTo(x,y+8);
			ctx.stroke();	
			if (paint) {
				ctx.strokeStyle="#FFFFFF";
				ctx.beginPath();
				ctx.moveTo(startRectX, startRectY);
				ctx.lineTo(startRectX, y);
				ctx.lineTo(x, y);
				ctx.lineTo(x, startRectY);
				ctx.lineTo(startRectX, startRectY);
				ctx.stroke();
			}
		break;
		case 'shell': //no outline needed

		break;
		case 'fill': //no outline needed

		break;
	}
}

//fill all DotStar LEDs within a user-defined rectangle with palette color
function drawrect(x1,y1,x2,y2) {
	console.log ("rect");
	//make sure we have top-left and bottom-right coords. Swap them if need be.
	if (x1>x2) {
		var tmp = x2;
		x2=x1;
		x1=tmp;
	}
	if (y1>y2) {
		var tmp = y2;
		y2=y1;
		y1=tmp;
	}
	//fill all the dots in the selected area with palette color
	for(i=0;i<dots.length;i++){
		if (shellPos[i][0] >= x1 && shellPos[i][0] <= x2 && shellPos[i][1] >= y1 && shellPos[i][1] <= y2) {
			dots[i] = curPal;
		}
	}
}

//initialize the canvas
function setShape() {
	switch(location['search']) {
		case "?8x32":
			shape = '8x32';
			canvasWidth = 500;
			canvasHeight = 139;
			document.getElementById("myCanvas").height = canvasHeight;
			document.getElementById("myCanvas").style.height = canvasHeight;
			centerX = 250;
			centerY = 250;
			shellWidth = 15;
			dotRadius = 5;
			/* Initialize the pixel positions */
			var countIt = 0;
			startX = 17;
			startY = 17;
			var thisX = 0;
			var thisY = 0;
			for(x=0;x<32;x++){
				for(y=0;y<8;y++) {
					thisY = (x%2) ? y*shellWidth : (7-y)*shellWidth; //rows alternate left to right and right to left
					thisX = x*shellWidth;
					shellPos[countIt] = new Array(thisX+startX,thisY+startY);
					dots[countIt] = 0;
					countIt++;
				}
			}
		break;
		default:
			shape = '240mm';
			canvasWidth = 500;
			canvasHeight = 500;
			centerX = 250;
			centerY = 250;
			shellWidth = 20;
			dotRadius = 6;
			shellNums = new Array(48,44,40,32,28,24,20,12,6,1);
			/* Initialize the pixel positions */
			var countIt = 0;
			for(shell=0;shell<shellNums.length;shell++) {
				for(pos=0;pos<shellNums[shell];pos++){
					var theta = 2*Math.PI/shellNums[shell]*pos - .5*Math.PI;
					shellPos[countIt] = new Array(centerX+(Math.cos(theta)*((9-shell)*shellWidth)),centerY+(Math.sin(theta)*((9-shell)*shellWidth)));
					dots[countIt] = 0;
					countIt++;

				}
			}
		break;
	}
}

//set up initial conditions on page load
function loadInit() {
	canvas = document.getElementById('myCanvas'); 
	ctx = canvas.getContext('2d');
	
	//Set up the drawing mouse move functions
	
	document.getElementById('myCanvas').onmousedown = function(e){ //remember inital position of mouse click
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		paint = true;
		if (tools[curTool] == "rect") {  //rectangle is special. 
			startRectX = e.pageX - this.offsetLeft;
			startRectY = e.pageY - this.offsetTop;
		}  
		addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
	};

	document.getElementById('myCanvas').onmousemove = function(e){ //for most tools, update the canvas on mouse move
	  addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
	};

	document.getElementById('myCanvas').onmouseup = function(e){ //for rectangles, update the canvas on mouse release
		if (tools[curTool] == "rect") {
			drawrect(startRectX, startRectY, e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
		}  
		paint = false;
	};

	//draw the palette buttons
	palCont = document.getElementById('palContainer');
	for(i=0;i<palette.length;i++){
		palCont.innerHTML += "<div style='background-color:"+palette[i]+"' id='pal"+i+"' onclick='changePal("+i+")' class='palButton'></div>";
	}

	changePal(1); //set inital palette color
	setShape(); //set initial shape
	reDraw(); //draw the inital canvas
}