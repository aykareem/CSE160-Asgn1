let gl;
let shapesList = [];
let currentShape = "square";
let currentColor = [1.0, 0.5, 1.0, 1.0]; // Default color: pink
let currentSize = 20; // Default size
let currentSegments = 10; // Default circle segments
let isDrawing = false; // Track whether the user is currently drawing

function setupWebGL() {
  const canvas = document.getElementById("drawingCanvas");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    alert("WebGL not supported, falling back on experimental WebGL");
    gl = canvas.getContext("experimental-webgl");
  }

  if (!gl) {
    alert("Your browser does not support WebGL.");
    return;
  }
}

const vertexShaderSource = `
  attribute vec4 a_Position;
  uniform float u_PointSize;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_PointSize;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function setupShaders() {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (!vertexShader || !fragmentShader) {
    console.error("Failed to create shaders.");
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link failed:", gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);
  gl.program = program;
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for (const shape of shapesList) {
    if (shape.type === "square") renderSquare(shape);
    if (shape.type === "triangle") renderTriangle(shape);
    if (shape.type === "circle") renderCircle(shape);
  }
}

function renderSquare(shape) {
  const a_Position = gl.getAttribLocation(gl.program, "a_Position");
  const u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");

  const halfSize = shape.size / 200;
  const vertices = new Float32Array([
    shape.position[0] - halfSize, shape.position[1] - halfSize,
    shape.position[0] + halfSize, shape.position[1] - halfSize,
    shape.position[0] + halfSize, shape.position[1] + halfSize,
    shape.position[0] - halfSize, shape.position[1] + halfSize,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniform4fv(u_FragColor, shape.color);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function renderTriangle(shape) {
    const a_Position = gl.getAttribLocation(gl.program, "a_Position");
    const u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  
    // Dynamically calculate vertices if `vertices` are not provided
    const halfSize = shape.size / 200;
    const vertices = shape.vertices
      ? new Float32Array(shape.vertices)
      : new Float32Array([
          shape.position[0], shape.position[1] + halfSize, // Top vertex
          shape.position[0] - halfSize, shape.position[1] - halfSize, // Bottom-left vertex
          shape.position[0] + halfSize, shape.position[1] - halfSize, // Bottom-right vertex
        ]);
  
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.uniform4fv(u_FragColor, shape.color);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  

function renderCircle(shape) {
  const a_Position = gl.getAttribLocation(gl.program, "a_Position");
  const u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");

  const vertices = [];
  const [cx, cy] = shape.position;
  const radius = shape.size / 200;

  for (let i = 0; i <= shape.segments; i++) {
    const angle = (i / shape.segments) * 2 * Math.PI;
    vertices.push(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniform4fv(u_FragColor, shape.color);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, shape.segments + 1);
}

function drawIceCreamCone() {
  shapesList = [];

  // Scoops
  shapesList.push({
    type: "circle",
    position: [0, -0.2],
    size: 50,
    segments: 20,
    color: [0.9, 0.3, 0.3, 1.0],
  });

  shapesList.push({
    type: "circle",
    position: [0, 0.2],
    size: 50,
    segments: 20,
    color: [0.3, 0.6, 0.9, 1.0],
  });

  shapesList.push({
    type: "circle",
    position: [0, 0.6],
    size: 50,
    segments: 20,
    color: [0.8, 0.8, 0.3, 1.0],
  });

  // Cone
  shapesList.push({
    type: "triangle",
    vertices: [0, -0.8, -0.3, -0.4, 0.3, -0.4],
    color: [0.8, 0.5, 0.2, 1.0],
  });

  renderAllShapes();
}

function handleMouseDown(event) {
  isDrawing = true;
  handleClick(event);
}

function handleMouseMove(event) {
  if (!isDrawing) return;
  handleClick(event);
}

function handleMouseUp() {
  isDrawing = false;
}

function handleClick(event) {
  const canvas = document.getElementById("drawingCanvas");
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / canvas.height) * 2 + 1;

  const shape = {
    type: currentShape,
    position: [x, y],
    color: [...currentColor],
    size: currentSize,
    segments: currentSegments,
  };

  shapesList.push(shape);
  renderAllShapes();
}

function setupUI() {
  document.getElementById("redSlider").addEventListener("input", (event) => {
    currentColor[0] = parseFloat(event.target.value) / 255.0;
  });

  document.getElementById("greenSlider").addEventListener("input", (event) => {
    currentColor[1] = parseFloat(event.target.value) / 255.0;
  });

  document.getElementById("blueSlider").addEventListener("input", (event) => {
    currentColor[2] = parseFloat(event.target.value) / 255.0;
  });

  document.getElementById("sizeSlider").addEventListener("input", (event) => {
    currentSize = parseFloat(event.target.value);
  });

  document.getElementById("segmentSlider").addEventListener("input", (event) => {
    currentSegments = parseInt(event.target.value, 10);
  });

  document.getElementById("clearButton").addEventListener("click", () => {
    shapesList = [];
    renderAllShapes();
  });

  document.getElementById("squareButton").addEventListener("click", () => {
    currentShape = "square";
  });

  document.getElementById("triangleButton").addEventListener("click", () => {
    currentShape = "triangle";
  });

  document.getElementById("circleButton").addEventListener("click", () => {
    currentShape = "circle";
  });

  document.getElementById("drawIceCreamButton").addEventListener("click", drawIceCreamCone);

  const canvas = document.getElementById("drawingCanvas");
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mouseleave", handleMouseUp);
}

function main() {
  setupWebGL();
  setupShaders();
  setupUI();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

main();



