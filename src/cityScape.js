/*************************************
*   Computer Graphics - Homework 1   *
*   Cityscape Generator              *
*                                    *
*   Buğra Felekoğlu                  *
*   21301200                         *
*************************************/

// WebGL
var gl;

// Global variables
var cloudInProgress = false; // Are there any cloud drawing process?
var isFileExist = false;
var houseColors = []; // House colors array
var houseFloors = []; // House floors array
var clouds = [];  // Drawn cloud array
var loadedHouseColors = []; // Loaded house colors array
var loadedHouseFloors = []; // Loaded floors array
var loadedClouds = [];  // Loaded cloud array
var loadedN = 0;
var n = 3;  // Number of all houses, default to 3
var m = 3;  // Maximum floors can houses have, default to 3

// Constant dimension values
const GAP = 0.2;

// Constant depth values
const SKY = -0.001;
const SUN = -0.002;
const CLOUD = -0.003;
const GROUND = -0.004;
const BUILDING = -0.005;
const WINDOW = -0.006;
const ROAD = -0.007;
const TREE = -0.008;

// Constant color values
const TRANSPARENCY = vec4(0, 0, 0, 0);
const SKY_COLOR = vec4(0, 176, 240, 255);
const SUN_COLOR = vec4(255, 192, 0, 255);
const CLOUD_COLOR = vec4(230, 230, 230, 255);
const GROUND_COLOR = vec4(197, 90, 17, 255);
const ROOF_COLOR = vec4(192, 0, 0, 255);
const TREE_GREEN_COLOR_D = vec4(0, 137, 0, 255);
const TREE_GREEN_COLOR_L = vec4(23, 197, 40, 255);
const TREE_WOOD_COLOR = vec4(133, 60, 12, 255);
const WINDOW_COLOR = vec4(180, 199, 231, 255);
const ROAD_COLOR = vec4(60, 60, 60, 255);
const PAVEMENT_COLOR = vec4(77, 77, 77, 255);

window.onload = function init() {
  var canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) alert("WebGL isn't available");

  // Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  dragElement(document.getElementById("UI"));

  // Configure WebGL
  gl.viewport(0, (- canvas.width + canvas.height) / 2, canvas.width, canvas.width);
  gl.clearColor(0, 0.69, 0.94, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  generateStreet(n, m);
  cloudMaker(program, canvas);
  clickGenerateButton(program);
  clickSaveButton();
  clickLoadButton(program);
  chooseFile();
  render(program);
};

function render(program) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawSky(program);
  drawClouds(program);
  drawGround(program);
  drawSun(program);
  drawStreet(program, n, m);
  drawRoad(program);
}

/***************************************************
  Generate button listener
****************************************************/
function clickGenerateButton(program) {
  var sliderN = document.getElementById("sliderN");
  var sliderM = document.getElementById("sliderM");
  var generate = document.getElementById("Generate");

  // Listener for Generate button
  generate.addEventListener("click", function(event) {
    n = parseInt(sliderN.value);
    m = parseInt(sliderM.value);
    clouds = [];
    cloudInProgress = false;
    generateStreet(n, m);
    render(program);
  } );
}

/***************************************************
  Save button listener
****************************************************/
function clickSaveButton() {
  var save = document.getElementById("Save");
  var textbox = document.getElementById('Textbox');

  // Listener for Save button
  save.addEventListener("click", function(event) {
    var link = document.createElement('a');
    link.setAttribute('download', textbox.value);
    var data = [n, houseColors, houseFloors, clouds];
    link.href = makeTextFile(data);
    document.body.appendChild(link);

    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
    } );
  } );
}

/***************************************************
  Load button listener
****************************************************/
function clickLoadButton(program) {
  var load = document.getElementById("Load");

  // Listener for Load button
  load.addEventListener("click", function(event) {
    if(!isFileExist) {
      alert("You have either selected the wrong file or did not select a file");
    }
    else {
      cloudInProgress = false;
      n = loadedN;
      houseColors = loadedHouseColors;
      houseFloors = loadedHouseFloors;
      clouds = loadedClouds;
    }

    render(program);
  } );
}

/***************************************************
  Onchange event listener for taking file
****************************************************/
function chooseFile() {
  document.getElementById("File").onchange = function (e) {
    var file = this.files[0];

    var reader = new FileReader();
    reader.onload = function (progressEvent) {
      document.getElementById("FileText").innerHTML  = e.target.value.split('\\').pop();
      var data = this.result;
      var json = JSON.parse(data);

      loadedN = json[0]
      loadedHouseColors = json[1];
      loadedHouseFloors = json[2];
      loadedClouds = json[3];

      isFileExist = true;
    };
    reader.readAsText(file);
  };
}

/***************************************************
  Generates street floor size and colors of houses

  Params:
    program: shader program
    n: number of all houses
    m: maximum floors
****************************************************/
function generateStreet(n, m) {
  houseColors = [];
  houseFloors = [];
  for(var i = 0; i < n; i++) {
    //
    var colorA = hsv2rgb(Math.random() * 360, 90, 75);
    var color = vec4(colorA[0], colorA[1], colorA[2], 255);
    houseColors.push(color);
    houseFloors.push(Math.floor(Math.random() * m) + 1);
  }
}

/***************************************************
  Draws the street (all the houses and trees)

  Params:
    program: shader program
    n: number of all houses
    m: maximum floors
****************************************************/
function drawStreet(program, n, m) {
  // Draws all of the houses
  for(var i = 0; i < n; i++) {
    drawHouse(program, houseFloors[i], i, n, houseColors[i]);
  }

  // Draws all of the trees
  for(var i = 0; i < n - 1; i++) {
    drawTree(program, i, n)
  }
}

/***************************************************
  Draws a house with respect to number of all houses

  Params:
    program: shader program
    floors: how many floor does house have
    i: index of house
    n: number of all houses
    color: color of house
****************************************************/
function drawHouse(program, floors, i, n, color) {
  // Values for houses
  var g = 0.05 - 0.005 * n; // Gap between windows
  var roofH = 0.15; // Roof height
  var houseW = (2 - (n + 1) * GAP) / n; // House width
  var winw = (houseW - 3 * g) / 2;  // window width
  var winh = 0.10;  // window height
  var houseH = g + floors * (g + winh); // House height

  // Coordinates of house
  var houseX1 = GAP + i * (houseW + GAP) - 1;
  var houseY1 = houseH - 0.38;
  var houseX2 = houseX1 + houseW;
  var houseY2 = houseY1 - houseH;

  // Drawing house
  drawRectangle(program, vec2(houseX1, houseY1),
    vec2(houseX2, houseY2), color, BUILDING);

  // Windows loop
  for(var j = 0; j < floors; j++) {
    // Left
    var lwinx1 = houseX1 + g;
    var lwiny1 = houseY1 - j * (winh + g) - g;
    var lwinx2 = lwinx1 + winw;
    var lwiny2 = lwiny1 - winh;

    // Right
    var rwinx1 = lwinx1 + g + winw;
    var rwiny1 = lwiny1;
    var rwinx2 = lwinx2 + winw + g;
    var rwiny2 = lwiny2;

    // Drawing windows
    drawRectangle(program, vec2(lwinx1, lwiny1), vec2(lwinx2, lwiny2), WINDOW_COLOR, WINDOW);
    drawRectangle(program, vec2(rwinx1, rwiny1), vec2(rwinx2, rwiny2), WINDOW_COLOR, WINDOW);
  }

  // Drawing Roof
  drawTriangle(program,
    vec2(houseX1, houseY1),
    vec2(houseX1 + houseW/2, houseY1 + roofH),
    vec2(houseX2, houseY1), ROOF_COLOR, BUILDING);
}

/***************************************************
  Draws a tree with respect to number of all houses

  Params:
    program: shader program
    i: index of tree
    n: number of all houses
****************************************************/
function drawTree(program, i, n) {
  var houseW = (2 - (n + 1) * GAP) / n;
  var circleCenter = vec2(GAP / 2 + (1 + i) * (GAP + houseW) - 1, - 0.20);

  drawRectangle(program, vec2(circleCenter[0] - 0.01, - 0.20),
    vec2(circleCenter[0] + 0.01, - 0.40), TREE_WOOD_COLOR, TREE);
  drawCircle(program, circleCenter, 0.075, TREE_GREEN_COLOR_D, TREE_GREEN_COLOR_L, TREE);
}

/***************************************************
  Draws clouds using global clouds[] array

  Param:
    program: shader program
****************************************************/
function drawClouds(program) {
  for(var i = 0; i < clouds.length; i++) {  // Loops every cloud
    var colors = [];
    for(var j = 0; j < clouds[i].length; j++) { // Loops every vertex of a cloud
      var fancycolor = vec4(CLOUD_COLOR);
      fancycolor[0] = (fancycolor[0] - 7 * j) % 256;
      fancycolor[1] = (fancycolor[1] - 7 * j) % 256;
      fancycolor[2] = (fancycolor[2] - 7 * j) % 256;
      colors.push(fancycolor);
    }

    // Draws all clouds that drawn on canvas
    processBuffers(program, colors, clouds[i]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, clouds[i].length);
  }
}

/***************************************************
  Makes clouds with using coordinates of user clicks

  Param:
    program: shader program
    canvas:
****************************************************/
function cloudMaker(program, canvas) {
  var button = document.getElementById("FinishCloud");

  // Listener for finish cloud button
  button.addEventListener("click", function(event) {
    cloudInProgress = false;
  } );

  // Listener for user clicks on the canvas
  canvas.addEventListener("click", function(event) {
    // calibrating the coordinate system according to canvas size
    var h = canvas.height / canvas.width;
    var betterX = event.clientX - 5;
    var betterY = event.clientY - 5;
    var clickPointX = 2 * betterX / canvas.width - 1;
    var clickPointY = 2 * h * (betterY / canvas.height) - h;
    var clickPoint = vec3(clickPointX, - clickPointY, CLOUD);

    // Checks if cloud finished
    if(!cloudInProgress) {
      var vertices = [];  // Vertex array of current cloud
      clouds.push(vertices);
      cloudInProgress = true;
    }

    // Pushes the clicked point to the latest cloud vertex array
    clouds[clouds.length-1].push(clickPoint);

    render(program);
  } );
}

function drawRoad(program) {
  drawRectangle(program, vec2(-1, -0.42), vec2(1, -1), ROAD_COLOR, ROAD);
  drawRectangle(program, vec2(-1, -0.42), vec2(1, -0.38), PAVEMENT_COLOR, ROAD);

  // Road stripes
  for(var i = 0; i < 21; i++) {
    var leftTop = vec2(-1 + i / 10, -0.49);
    var rightBottom = vec2(-0.97 + i / 10, -0.50);
    drawRectangle(program, leftTop, rightBottom, CLOUD_COLOR, ROAD);
  }
}

function drawSun(program) {
  drawCircle(program, vec2(0.75, 0.35), 0.15, SUN_COLOR, TRANSPARENCY, SUN);
  drawCircle(program, vec2(0.75, 0.35), 0.3, SUN_COLOR, TRANSPARENCY, SUN);
}

function drawGround(program) {
  drawRectangle(program, vec2(-1, -0.30), vec2(1, -1), GROUND_COLOR, GROUND);
}

function drawSky(program) {
  drawRectangle(program, vec2(-1, 1), vec2(1, -1), SKY_COLOR, SKY);
}

/***************************************************
  Generic circle draw function

  Param:
    program: shader program
    center: center point for circle
    radius: radius of circle
    color1: center color for circle
    color2: additional sphere color for circle
    depth: z value of circle
****************************************************/
function drawCircle(program, center, radius, color1, color2, depth) {
  var polyCount = 32;
  var vertices = [];
  var colors = [];
  var i;

  vertices.push(vec3(center[0], center[1], depth));
  for(i = 0; i < polyCount + 1; i++) {
    var x = radius * Math.cos(i * 2 * Math.PI / polyCount) + center[0];
    var y = radius * Math.sin(i * 2 * Math.PI / polyCount) + center[1];
    vertices.push(vec3(x, y, depth));
  }

  colors.push(vec4(color1));
  for(i = 0; i < polyCount + 1; i++) {
    colors.push(vec4(color2));
  }

  processBuffers(program, colors, vertices);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, polyCount + 2);
}

/***************************************************
  Generic triangle draw function

  Param:
    program: shader program
    pos1: first vertex position
    pos2: second vertex position
    pos3: third vertex position
    color: color of triangle vertices
    depth: z value of triangle
****************************************************/
function drawTriangle(program, pos1, pos2, pos3, color, depth) {
  var vertices = [
    vec3(pos1[0], pos1[1], depth),
    vec3(pos2[0], pos2[1], depth),
    vec3(pos3[0], pos3[1], depth)
  ];

  var colors = [
    color,
    color,
    color
  ];

  processBuffers(program, colors, vertices);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/***************************************************
  Generic rectangle draw function

  Param:
    program: shader program
    pos1: left top vertex position
    pos2: right bottom vertex position
    color: color of rectangle vertices
    depth: z value of rectangle
****************************************************/
function drawRectangle(program, pos1, pos2, color, depth) {
  // Vertices of rectangle
  var vertices = [
    vec3(pos1[0], pos2[1], depth),
    vec3(pos1[0], pos1[1], depth),
    vec3(pos2[0], pos1[1], depth),
    vec3(pos2[0], pos2[1], depth)
  ];

  // Colors of rectangle
  var colors = [
    color,
    color,
    color,
    color
  ];

  processBuffers(program, colors, vertices);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

/***************************************************
  Color and Vertex buffers
****************************************************/
function processBuffers(program, colors, vertices) {
  // Load the color data into the GPU
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  // Associate out vertex color variables with our color buffer
  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // Load the vertex data into the GPU
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
}

/*****************************************************************************
  HSV (Hue-Saturation-Value) to RGB (Red-Green-Blue) Converter (Not Modified)

  Taken from https://www.rapidtables.com/convert/color/hsv-to-rgb.html
******************************************************************************/
function hsv2rgb(h, s, v){
  var r, g, b;
	if( h<0 ) h=0; if( s<0 ) s=0; if( v<0 ) v=0;
	if( h>=360 ) h=359; if( s>100 ) s=100; if( v>100 ) v=100;

	s/=100.0; v/=100.0;
	C = v*s;
	hh = h/60;
	X = C*(1-Math.abs(hh%2-1));
	r = g = b = 0;

	if( hh>=0 && hh<1 )	{
		r = C; g = X;
	}
	else if( hh>=1 && hh<2 ) {
		r = X; g = C;
	}
	else if( hh>=2 && hh<3 ) {
		g = C; b = X;
	}
	else if( hh>=3 && hh<4 ) {
		g = X; b = C;
	}
	else if( hh>=4 && hh<5 ) {
		r = X; b = C;
	}
	else {
		r = C; b = X;
	}

	m = v-C;
	r += m; g += m; b += m;
	r *= 255.0; g *= 255.0; b *= 255.0;
	r = Math.round(r); g = Math.round(g); b = Math.round(b);

  return [r, g, b];
}

/************************************************************
  File creation (Modified)

  Taken from https://stackoverflow.com/questions/21012580/
    is-it-possible-to-write-data-to-file-using-only-javascript
*************************************************************/
var textFile = null,
  makeTextFile = function (data) {
    var data = new Blob([JSON.stringify(data)], {type: 'application/json'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };

/*******************************************************************
  Draggable UI Elements (Not modified)

  Taken from https://www.w3schools.com/howto/howto_js_draggable.asp
********************************************************************/
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "Header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
