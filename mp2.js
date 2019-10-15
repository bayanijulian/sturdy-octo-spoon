
/**
 * @file Terrain Generation in WebGL with Blinn Phong Shading and 
 * Elevation Color Mapping
 * @author Yani Julian <bjulia2@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;

/** @global The angle of rotation around the x axis for the terrain */
var viewRotX = -75;

/** @global The angle of rotation around the y axis for the terrain */
var viewRotY = 0;

/** @global The uniform scale factor for the terrain */
var viewScale = 0.9;

/** @global The offset factor for the Z coordinate of the terrain */
var viewOffsetZ = -0.01;

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.05,1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,-1.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [0,50,50];
/** @global Ambient light color/intensity for Blinn Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Blinn Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Blinn Phong reflection */
var lSpecular =[0.75,0.75,0.75];

//Material parameters
/** @global Ambient material color/intensity for Blinn Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Blinn Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Blinn Phong reflection */
var kSpecular = [1,1,1];
/** @global Shininess exponent for Blinn Phong reflection */
var shininess = 100;

/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];



//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-blinn-phong-vs");
  fragmentShader = loadShaderFromDOM("shader-blinn-phong-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  // Color Mapping Uniforms
  shaderProgram.uniformHeightInterval= gl.getUniformLocation(shaderProgram, "uHeightInterval");
  shaderProgram.uniformTopColor = gl.getUniformLocation(shaderProgram, "uTopColor");
  shaderProgram.uniformMidColor = gl.getUniformLocation(shaderProgram, "uMidColor");
  shaderProgram.uniformBaseColor = gl.getUniformLocation(shaderProgram, "uBaseColor");
  shaderProgram.uniformBotColor = gl.getUniformLocation(shaderProgram, "uBotColor");

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends the min/max z coordinate to the shader for coloring the terrain by
 * intervals. Sends each of the colors to the shader.
 */
function setColorMapUniforms() {
  // Set the height interval

  let skyColor = [255.0/255.0, 250.0/255.0, 250.0/255.0];
  gl.uniform3fv(shaderProgram.uniformTopColor, new Float32Array(skyColor));

  let earthColor = [135.0/255.0, 67.0/255.0, 23.0/255.0];
  gl.uniform3fv(shaderProgram.uniformMidColor, new Float32Array(earthColor));

  let vegetationColor = [44.0/255.0, 176.0/255.0, 55.0/255.0];
  gl.uniform3fv(shaderProgram.uniformBaseColor, new Float32Array(vegetationColor));

  let oceanColor = [0.0/255.0, 151.0/255.0, 241.0/255.0];
  gl.uniform3fv(shaderProgram.uniformBotColor, new Float32Array(oceanColor));
  
  let heightInterval = vec2.create();
  myTerrain.getHeightInterval(heightInterval);
  let minZ = heightInterval[0];
  let maxZ = heightInterval[1];
  let intervalLength = Math.abs(minZ) + Math.abs(maxZ);
  let interval_30 = intervalLength * 0.3;
  let interval_20 = intervalLength * 0.2;
  
  let topStartZ = maxZ - interval_20; // top color is 20 percent
  let midStartZ = topStartZ - interval_30; // mid color is 30 percent 
  let baseStartZ = midStartZ - interval_30; // base color is 30 percent
  let botStartZ = minZ; // bot color is the rest

  let intervals = vec4.fromValues(topStartZ, midStartZ, baseStartZ, botStartZ);
  gl.uniform4fv(shaderProgram.uniformHeightInterval, new Float32Array(intervals));

}

//-------------------------------------------------------------------------
/**
 * Populate buffers with terrain data
 */
function setupBuffers() {
    myTerrain = new Terrain(150,-1,1,-1,1);
    myTerrain.loadBuffers();
}

//---------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Perspective View
    mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.01, 1000);

    // Generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);

    //Draw Terrain
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(viewRotY));
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(viewRotX));

    let offsetZVec = vec3.fromValues(0.0,0.0,viewOffsetZ);
    mat4.translate(mvMatrix, mvMatrix,offsetZVec);

    let scaleVec = vec3.fromValues(viewScale, viewScale, viewScale);
    mat4.scale(mvMatrix, mvMatrix, scaleVec);

    setMatrixUniforms();
    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
    setColorMapUniforms();
    
    if (document.getElementById("polygon").checked)
    { 
      setMaterialUniforms(shininess,kAmbient,kTerrainDiffuse,kSpecular); 
      myTerrain.drawTriangles();
    }
    
    if(document.getElementById("wireframe").checked)
    {
      setMaterialUniforms(shininess,kAmbient,kEdgeWhite,kSpecular);
      myTerrain.drawEdges();
    }
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  // fog color
  gl.clearColor(220/255, 219/255, 233/255,1);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    draw();
}

