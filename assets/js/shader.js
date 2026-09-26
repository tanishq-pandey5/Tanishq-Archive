/**
 * Ambient WebGL Chromatic Dispersion Ribbon Shader
 * Extracted from Framer Shader Labs engine
 */

export class ChromaticShaderBackground {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.gl = canvasEl.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: false });
    this.time = 0;
    this.speed = 0.4;
    this.colorScale = 8.0;
    this.frequency = 4.8;
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.targetMouseX = 0.5;
    this.targetMouseY = 0.5;
    this.isActive = true;

    if (!this.gl) {
      console.warn("WebGL not supported for ambient chromatic shader.");
      return;
    }

    this.init();
  }

  init() {
    const gl = this.gl;

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform float u_colorScale;
      uniform float u_frequency;
      uniform vec3 u_baseColor;
      uniform vec2 u_mouse;

      vec2 distort(vec2 p, float offset) {
        p += offset;
        p += (u_mouse - 0.5) * 0.15;
        for (float i = 1.0; i < 4.0; i++) {
          p.x += 0.3 / i * sin(i * 3.0 * p.y + u_time);
          p.y += 0.3 / i * cos(i * 3.0 * p.x + u_time);
        }
        return p;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        float r = sin(distort(uv, 0.0).x * u_frequency) * 0.5 + 0.5;
        float g = sin(distort(uv, 0.02).x * u_frequency) * 0.5 + 0.5;
        float b = sin(distort(uv, 0.04).x * u_frequency) * 0.5 + 0.5;

        vec3 color = pow(vec3(r, g, b), vec3(u_colorScale));
        vec3 finalColor = mix(u_baseColor, color, 0.85);

        // Gentle vignette falloff so content stays legible
        float d = distance(uv, vec2(0.5, 0.5));
        float alpha = smoothstep(1.2, 0.2, d);

        gl_FragColor = vec4(finalColor, alpha * 0.9);
      }
    `;

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
      return;
    }

    gl.useProgram(this.program);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(this.program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    this.uRes = gl.getUniformLocation(this.program, 'u_res');
    this.uTime = gl.getUniformLocation(this.program, 'u_time');
    this.uColorScale = gl.getUniformLocation(this.program, 'u_colorScale');
    this.uFrequency = gl.getUniformLocation(this.program, 'u_frequency');
    this.uBaseColor = gl.getUniformLocation(this.program, 'u_baseColor');
    this.uMouse = gl.getUniformLocation(this.program, 'u_mouse');

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.targetMouseX = e.clientX / window.innerWidth;
      this.targetMouseY = 1.0 - (e.clientY / window.innerHeight);
    });

    this.resize();
    this.render();
  }

  resize() {
    if (!this.canvas || !this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    if (!this.isActive) return;

    this.time += this.speed * 0.012;
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uTime, this.time);
    gl.uniform1f(this.uColorScale, this.colorScale);
    gl.uniform1f(this.uFrequency, this.frequency);
    gl.uniform3f(this.uBaseColor, 0.02, 0.02, 0.025);
    gl.uniform2f(this.uMouse, this.mouseX, this.mouseY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(() => this.render());
  }

  setPreset(name) {
    if (name === 'prism') {
      this.colorScale = 8.0;
      this.frequency = 4.8;
      this.speed = 0.4;
    } else if (name === 'infrared') {
      this.colorScale = 4.0;
      this.frequency = 6.0;
      this.speed = 0.6;
    } else if (name === 'minimal') {
      this.colorScale = 14.0;
      this.frequency = 3.5;
      this.speed = 0.2;
    }
  }
}
