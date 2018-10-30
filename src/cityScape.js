var gl;
var points;
var houseColors = [];
var houseFloors = [];
var clouds = [];
var isCloudFinished = true;
var n = 3;
var m = 3;

// Constant dimension values
const GAP = 0.2;

// Constant depth values
const SKY = -0.001;
const SUN = -0.002;
const CLOUD = -0.003;
const GROUND = -0.004;
const BUILDING = -0.005;
const WINDOW = -0.006;
const TREE = -0.007;

// Constant color values
const TRANSPARENCY = vec4(0, 0, 0, 0);
const SKY_COLOR = vec4(0, 176, 240, 255);
const SUN_COLOR = vec4(255, 192, 0, 255);
const CLOUD_COLOR = vec4(230, 230, 230, 255);
const GROUND_COLOR = vec4(197, 90, 17, 255);
const ROOF_COLOR = vec4(192, 0, 0, 255);
const TREE_GREEN_COLOR = vec4(146, 208, 80, 255);
const TREE_WOOD_COLOR = vec4(133, 60, 12, 255);
const WINDOW_COLOR = vec4(180, 199, 231, 255);

window.onload = function init(){
  var canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) alert("WebGL isn't available");

  // Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

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
  render(program);
  var sliderN = document.getElementById("sliderN");
  var sliderM = document.getElementById("sliderM");

  var buttonG = document.getElementById("Generate");
  buttonG.addEventListener("click", function(event) {
    n = parseInt(sliderN.value);
    m = parseInt(sliderM.value);
    clouds = [];
    isCloudFinished = true;
    generateStreet(n, m);
    render(program);
  } );
};

function render(program) {
  drawSky(program);
  drawGround(program);
  drawSun(program);
  drawClouds(program);
  drawStreet(program, n, m);
}

function generateStreet(n, m) {
  houseColors = [];
  houseFloors = [];
  for( var i = 0; i < n; i++) {
    var colorA = hsv2rgb(Math.random()*360, 70, 50);
    var color = vec4( colorA[0], colorA[1], colorA[2], 255);
    houseColors.push(color);
    houseFloors.push(Math.floor(Math.random() * m) + 1);
  }
}

function drawClouds(program) {
  for(var i = 0; i < clouds.length; i++) {
    var colors = [];
    for(var j = 0; j < clouds[i].length; j++) {
      var fancycolor = vec4(CLOUD_COLOR);
      fancycolor[0] = (fancycolor[0] - 7*j)%256;
      fancycolor[1] = (fancycolor[1] - 7*j)%256;
      fancycolor[2] = (fancycolor[2] - 7*j)%256;
      colors.push(fancycolor);
    }

    processBuffers(program, colors, clouds[i]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, clouds[i].length);
  }
}

function drawStreet(program, n, m) {
  //HOUSES
  for( var i = 0; i < n; i++) {
    drawHouse(program, houseFloors[i], i, n, houseColors[i]);
  }

  //TREES
  for( var i = 0; i < n - 1; i++) {
    drawTree(program, i, n)
  }
}

function drawHouse(program, floors, i, n, color) {
  console.log(n);
  var g = 0.05 - 0.005*n;
  var a = (2 - (n + 1) * GAP) / n;
  var winw = (a - 3*g) / 2;
  var winh = 0.10;
  var roofH = 0.15;
  var houseH = g + floors*(g + winh);
  var houseW = a;

  var houseX1 = GAP + i*(houseW + GAP) - 1;
  var houseY1 = houseH - 0.40;
  var houseX2 = houseX1 + houseW;
  var houseY2 = houseY1 - houseH;

  drawRectangle(program, vec2(houseX1, houseY1), vec2(houseX2, houseY2), color, BUILDING);

  for(var j = 0; j < floors; j++) {
    //LEFT
    var lwinx1 = houseX1 + g;
    var lwiny1 = houseY1 - j*(winh + g) - g;
    var lwinx2 = lwinx1 + winw;
    var lwiny2 = lwiny1 - winh;

    //RIGHT
    var rwinx1 = lwinx1 + g + winw;
    var rwiny1 = lwiny1;
    var rwinx2 = lwinx2 + winw + g;
    var rwiny2 = lwiny2;

    drawRectangle(program, vec2(lwinx1, lwiny1), vec2(lwinx2, lwiny2), WINDOW_COLOR, WINDOW);
    drawRectangle(program, vec2(rwinx1, rwiny1), vec2(rwinx2, rwiny2), WINDOW_COLOR, WINDOW);
  }

  drawTriangle(program,
    vec2(houseX1, houseY1),
    vec2(houseX1 + houseW/2, houseY1 + roofH),
    vec2(houseX2, houseY1), ROOF_COLOR, BUILDING);
}

function drawTree(program, i, n) {
  var a = (2 - (n + 1) * GAP) / n;
  var circleCenter = vec2(GAP / 2 + (1 + i) * (GAP + a) - 1, - 0.25);

  drawRectangle(program, vec2(circleCenter[0] - 0.01, - 0.30),
    vec2(circleCenter[0] + 0.01, - 0.45), TREE_WOOD_COLOR, TREE);
  drawCircle(program, circleCenter, 0.075, TREE_GREEN_COLOR, TREE_GREEN_COLOR, TREE);
}

function cloudMaker(program, canvas) {
  var button = document.getElementById("FinishCloud");

  button.addEventListener("click", function(event) {
    isCloudFinished = true;
  } );

  canvas.addEventListener("click", function(event) {
    var a = canvas.height / canvas.width;
    var betterX = event.clientX - 5;
    var betterY = event.clientY - 5;
    var clickPointX = 2 * betterX / canvas.width - 1;
    var clickPointY = 2 * a * (betterY / canvas.height) - a;
    var clickPoint = vec3(clickPointX, -clickPointY, CLOUD);

    if(isCloudFinished) {
      var vertices = [];
      clouds.push(vertices);
      isCloudFinished = false;
    }

    clouds[clouds.length-1].push(clickPoint);
    render(program);
  } );
}

function drawSun(program) {
  drawCircle(program, vec2(0.75, 0.35), 0.15, SUN_COLOR, TRANSPARENCY, SUN);
  drawCircle(program, vec2(0.75, 0.35), 0.3, SUN_COLOR, TRANSPARENCY, SUN);
}

function drawGround(program) {
  drawRectangle(program, vec2(-1, -0.28), vec2(1, -1), GROUND_COLOR, GROUND);
}

function drawSky(program) {
  drawRectangle(program, vec2(-1, 1), vec2(1, -1), SKY_COLOR, SKY);
}

//**********************  CIRCLE  **********************
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

//**********************  TRIANGLE  **********************
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

//**********************  RECTANGLE  **********************
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

//**************  Buffers  **************
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

// HSV to RGB Converter
// Taken from https://www.rapidtables.com/convert/color/hsv-to-rgb.html
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
