// some globals
var gl;

var delay = 100;

var vBuffer;
var cBuffer;

var program;
var vColor, vPosition;

var boidList = [];
var BOID_COUNT = 500;

var M_PerspLoc;
var M_CameraLoc;

//Boid parms

// const X_MIN = -100;
// const X_MAX = 100;
// const Y_MIN = -100;
// const Y_MAX = 100;
// const Z_MIN = -200;
// const Z_MAX = 100;

const X_MIN = -320;
const X_MAX = 320;
const Y_MIN = -320;
const Y_MAX = 320;
const Z_MIN = -200;
const Z_MAX = 200;

const NUM_GRID_DIVISIONS = 20;
var grid = {};

const RANGE_COHESION = 50;
const MAGNITUDE_COHESION = 0.4;
const RANGE_SEPARATION = 50;
const MAGNITUDE_SEPARATION = 0.1;
const RANGE_ALIGNMENT = 50;
const MAGNITUDE_ALIGNMENT = 0.2;
const RANGE_COLOR = 20;

const MAGNITUDE_RANDOM = 0.1;

const MAX_ACCELERATION = 2;

// Your GL program starts after the HTML page is loaded, indicated
// by the onload event
window.onload = function init() {
  // get the canvas handle from the document's DOM
  var canvas = document.getElementById("gl-canvas");

  // initialize webgl
  // gl = WebGLUtils.setupWebGL( canvas );
  gl = initWebGL(canvas);

  // check for errors
  if (!gl) {
    alert("WebGL isn't available");
  }

  // specify viewing surface geometry to display your drawings
  gl.viewport(0, 0, canvas.width, canvas.height);

  // clear the display with a background color
  // specified as R,G,B triplet in 0-1.0 range
  // gl.clearColor(0.5, 0.5, 0.5, 1.0);
  gl.clearColor(1, 1, 1, 1);

  //  Initialize and load shaders -- all work done in init_shaders.js
  program = initShaders(gl, "vertex-shader", "fragment-shader");

  // make this the current shader program
  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);

  vPosition = gl.getAttribLocation(program, "vPosition");
  vColor = gl.getAttribLocation(program, "vColor");
  gl.enableVertexAttribArray(vPosition);
  gl.enableVertexAttribArray(vColor);

  M_PerspLoc = gl.getUniformLocation(program, "M_Persp");
  M_CameraLoc = gl.getUniformLocation(program, "M_Camera");

  // create a vertex buffer - this will hold all vertices
  vBuffer = gl.createBuffer();
  cBuffer = gl.createBuffer();

  // transfer the data -- this is actually pretty inefficient!
  // flatten() function is defined in MV.js - this simply creates only
  // the vertex coordinate data array - all other metadata in Javascript
  // arrays should not be in the vertex buffer.

  //gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
  //gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));

  // tet = new tetrahedron(rotate4x4(14,'y'));

  //x: -320 to 320
  //y: -320 to 320
  //z: -200 to 100

  // tet = new tetrahedron(0,0,-200);
  // tet.getVerticesNormals();

  for (var i = 0; i < BOID_COUNT; i++) {
    var newB = newBoid();
    boidList.push(newB);
  }

  camera();

  render();

  //alert(gl.getParameter(gl.VERSION));
};

function updateGrid(boid) {
  if (boid.gridCell != null) {
    var toRemove = grid[gridCell];
    var index = toRemove.indexOf(boid);
    if (index > -1) {
      toRemove.splice(index, 1);
    }
    grid[gridCell] = toRemove;
  }
  //var gridCell = "[" + Math.floor()
}

function findGridCell(x, y, z) {
  return [
    Math.floor(x / NUM_GRID_DIVISIONS),
    Math.floor(y / NUM_GRID_DIVISIONS),
    Math.floor(z / NUM_GRID_DIVISIONS),
  ];
}

function one_random_color() {
  return [Math.random(), Math.random(), Math.random(), 1];
}
function random_color(amount) {
  var colors = [];
  var color = one_random_color();
  for (var i = 0; i < amount; i++) {
    colors.push(color);
  }
  return colors;
}

function getNeighbors(thisBoid, range) {
  var neighbors = [];
  for (var i = 0; i < boidList.length; i++) {
    if (
      boidList[i] != thisBoid &&
      pointDistance(
        boidList[i].pos[0],
        boidList[i].pos[1],
        boidList[i].pos[2],
        thisBoid.pos[0],
        thisBoid.pos[1],
        thisBoid.pos[2]
      ) <= range
    )
      neighbors.push(boidList[i]);
  }
  return neighbors;
}

function pointDistance(v1x, v1y, v1z, v2x, v2y, v2z) {
  var dx = v1x - v2x;
  var dy = v1y - v2y;
  var dz = v1z - v2z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function clamp(vector, max) {
  var magn = Math.sqrt(
    vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]
  );
  var unitVec = normalize(vector);
  var multiplier = Math.min(magn, max);
  return vec3(
    unitVec[0] * multiplier,
    unitVec[1] * multiplier,
    unitVec[2] * multiplier
  );
}

function magnify(vector, magn) {
  return vec3(vector[0] * magn, vector[1] * magn, vector[2] * magn);
}

//from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function addVec(v1, v2) {
  return vec3(v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]);
}
function subVec(v1, v2) {
  return vec3(v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]);
}
function divVec(v1, v2) {
  return vec3(v1[0] / v2[0], v1[1] / v2[1], v1[2] / v2[2]);
}
function divVecFloat(v, f) {
  return vec3(v[0] / f, v[1] / f, v[2] / f);
}

function cohesion(boids, thisBoid) {
  var vec = vec3(0, 0, 0);
  if (boids.length == 0) return vec;
  for (var i = 0; i < boids.length; i++) {
    vec = vec3(
      vec[0] + boids[i].pos[0],
      vec[1] + boids[i].pos[1],
      vec[2] + boids[i].pos[2]
    );
  }
  vec = vec3(
    vec[0] / boids.length,
    vec[1] / boids.length,
    vec[2] / boids.length
  );
  vec = vec3(
    vec[0] - thisBoid.pos[0],
    vec[1] - thisBoid.pos[1],
    vec[2] - thisBoid.pos[2]
  );
  return normalize(vec, false);
}

function separation(boids, thisBoid) {
  var vec = vec3(0, 0, 0);
  if (boids.length == 0) return vec;
  for (var i = 0; i < boids.length; i++) {
    var towardsMe = subVec(thisBoid.pos, boids[i].pos);
    if (length(towardsMe) > 0) {
      vec = addVec(vec, divVecFloat(normalize(towardsMe), length(towardsMe)));
    }
  }
  return vec;
}

function alignment(boids, thisBoid) {
  var vec = vec3(0, 0, 0);
  if (boids.length == 0) return vec;
  for (var i = 0; i < boids.length; i++) {
    vec = addVec(vec, boids[i].velocity);
  }
  if (length(vec) != 0) return normalize(vec);
  else return vec3(0, 0, 0);
}

function randomMag() {
  var randomVec = vec3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  );
  return magnify(randomVec, MAGNITUDE_RANDOM);
}

function updateBoids() {
  for (let i = 0; i < boidList.length; ++i) {
    var boid = boidList[i];

    var otherBoids = getNeighbors(boid, RANGE_COHESION);
    var coh = magnify(cohesion(otherBoids, boid), MAGNITUDE_COHESION);

    otherBoids = getNeighbors(boid, RANGE_SEPARATION);
    var sep = magnify(separation(otherBoids, boid), MAGNITUDE_SEPARATION);

    otherBoids = getNeighbors(boid, RANGE_ALIGNMENT);
    var ali = magnify(alignment(otherBoids, boid), MAGNITUDE_ALIGNMENT);

    var ran = randomMag();

    boid.velocity = addVec(
      addVec(addVec(addVec(boid.velocity, coh), ran), sep),
      ali
    );

    boid.velocity = clamp(boid.velocity, MAX_ACCELERATION);

    boid.pos[0] += boid.velocity[0];
    boid.pos[1] += boid.velocity[1];
    boid.pos[2] += boid.velocity[2];

    boid.pos = screenWrap(boid.pos);

        {
            const color = boid.color[0];
            const otherBoids = getNeighbors(boid, RANGE_COLOR);
            for (const otherBoid of otherBoids) {
                const otherColor = otherBoid.color[0];
                for (let j = 0; j < 3; ++j) {
                    color[j] += otherColor[j];
                }
            }
            for (let j = 0; j < 3; ++j) {
                color[j] /= otherBoids.length + 1;
            }
        }
  }
}

function newBoid() {
  return (boid = {
    //pos: [getRandomArbitrary(-320,320), getRandomArbitrary(-320,320),getRandomArbitrary(-200,100)],
    pos: [
      getRandomArbitrary(X_MIN, X_MAX),
      getRandomArbitrary(Y_MIN, Y_MAX),
      getRandomArbitrary(Z_MIN, Z_MAX),
    ],
    //pos: [98,0,100],
    color: random_color(12),
    rot: randomRot(),
    velocity: vec3(0, 0, 0),
    gridCell: null,
    //rot: mat4()
  });
}

function screenWrap(pos) {
  if (pos[0] > X_MAX) {
    var over = X_MAX - pos[0];
    pos[0] = X_MIN + over;
  } else if (pos[0] < X_MIN) {
    over = X_MIN - pos[0];
    pos[0] = X_MAX - over;
  }

  if (pos[1] > Y_MAX) {
    var over = Y_MAX - pos[1];
    pos[1] = Y_MIN + over;
  } else if (pos[1] < Y_MIN) {
    over = Y_MIN - pos[1];
    pos[1] = Y_MAX - over;
  }

  if (pos[2] > Z_MAX) {
    var over = Z_MAX - pos[2];
    pos[2] = Z_MIN + over;
  } else if (pos[2] < Z_MIN) {
    over = Z_MIN - pos[2];
    pos[2] = Z_MAX - over;
  }

  return pos;
}

function camera() {
  var near = 5;
  var far = 5.74;

  var width = 0.1;
  var height = 0.1;

  var left = -width / 2;
  var right = width / 2;

  var top = height / 2;

  var look_at_z = -210;

  var LAT = normalize(vec3(0, 0, look_at_z));
  var UP = normalize(vec3(0, 1, -look_at_z));
  var U = cross_product(LAT, UP);
  var V = cross_product(U, LAT);
  var N = vec3(-LAT[0], -LAT[1], -LAT[2]);

  U = normalize(U);
  V = normalize(V);
  N = normalize(N);

  var rot = [
    [U[0], U[1], U[2], 0.0],
    [V[0], V[1], V[2], 0.0],
    [N[0], N[1], N[2], 0.0],
    [0.0, 0.0, 0.0, 1.0],
  ];

  var trans = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, look_at_z],
    [0.0, 0.0, 0.0, 1.0],
  ];

  var MT = matMult(rot, trans);

  var persp = [
    [near / right, 0, 0, 0],
    [0, near / top, 0, 0],
    [0, 0, -(far + near) / (far - near), -(2 * far * near) / (far - near)],
    [0, 0, -1, 0],
  ];

  persp = transpose(persp);

  gl.uniformMatrix4fv(M_PerspLoc, false, flatten(persp));

  gl.uniformMatrix4fv(M_CameraLoc, false, flatten(MT));
}

function render() {
  updateBoids();

  var verts = [];
  var colors = [];
  for (var i = 0; i < BOID_COUNT; i++) {
    //boidList[i].pos[0]++
    verts = verts.concat(
      getTetrahedronVertices(
        boidList[i].pos[0],
        boidList[i].pos[1],
        boidList[i].pos[2],
        boidList[i].rot
      )
    );
    //for (var j = 0; j < 12; j++)
    colors = colors.concat(boidList[i].color);
  }

  // bind the buffer, i.e. this becomes the current buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0); //number of elements per should be 3 but 4 displays

  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

  // this is render loop

  // clear the display with the background color
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, verts.length);

  setTimeout(function () {
    requestAnimFrame(render);
  }, delay);
}

//----------------------------------------------------------------------------
// matrix transforms

function scale(xScale, yScale, zScale) {
  mat = identity4();
  mat[0][0] *= xScale;
  mat[1][1] *= yScale;
  mat[2][2] *= zScale;
  return mat;
}
function translate(xTrans, yTrans, zTrans) {
  mat = identity4();
  mat[0][3] = xTrans;
  mat[1][3] = yTrans;
  mat[2][3] = zTrans;
  return mat;
}
function randomRot() {
  rot = mat4();
  rot[1][1] = Math.cos(getRandomArbitrary(0, 360));
  rot[1][2] = -Math.sin(getRandomArbitrary(0, 360));
  rot[2][1] = Math.sin(getRandomArbitrary(0, 360));
  rot[2][2] = Math.cos(getRandomArbitrary(0, 360));
  rot[0][1] = Math.cos(getRandomArbitrary(0, 360));
  rot[0][2] = Math.sin(getRandomArbitrary(0, 360));
  rot[2][0] = -Math.sin(getRandomArbitrary(0, 360));
  rot[0][0] = Math.cos(getRandomArbitrary(0, 360));
  rot[1][0] = Math.sin(getRandomArbitrary(0, 360));
  return rot;
}
