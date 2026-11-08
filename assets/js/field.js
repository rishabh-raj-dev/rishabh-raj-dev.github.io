/* Hero background: a field of bars, like market depth seen in perspective. Each bar rises and falls
   with a slow wave; the ones going up are tinted like a green candle, the ones going down like a red
   one. The pointer lifts the bars under it. One WebGL2 draw call (instanced boxes), no 3D library.
   Colours come from the CSS tokens, so it follows the light and dark themes. */
(function () {
  var canvas = document.querySelector('[data-field]');
  if (!canvas) return;
  var gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true });
  if (!gl) { document.documentElement.classList.add('no-gl'); return; }
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NX = 64, NZ = 26;
  var VS = '#version 300 es\n' + [
    'in vec3 aPos;in vec3 aNrm;in vec2 aCell;',
    'uniform mat4 uVP;uniform float uTime;uniform vec2 uMouse;uniform float uLift;',
    'out vec3 vN;out float vH;out float vTrend;out float vDepth;out float vTop;out float vZ;',
    'float wave(vec2 c,float t){',
    '  return .5+.22*sin(c.x*.23+t*.55+sin(c.y*.31+t*.2)*1.6)+.16*sin(c.y*.42-t*.4+c.x*.07)+.1*sin((c.x+c.y)*.6+t*1.1);',
    '}',
    'void main(){',
    '  vec2 c=aCell;',
    '  float h=wave(c,uTime);',
    '  float d=length((c-uMouse)*vec2(1.,1.6));',
    '  h+=uLift*.9*exp(-d*d/18.);',
    '  vTrend=wave(c,uTime+.25)-wave(c,uTime-.25);',
    '  h=max(.03,h*h*1.15);',
    '  vec3 p=vec3((c.x-float(' + NX + ')*.5)*1.,aPos.y*h,-c.y*1.);',
    '  p.xz+=aPos.xz*.56;',
    '  vN=aNrm;vH=h;vTop=aPos.y;vZ=c.y/float(' + NZ + ');',
    '  vec4 cp=uVP*vec4(p,1.);vDepth=cp.w;',
    '  gl_Position=cp;',
    '}'
  ].join('\n');
  var FS = '#version 300 es\nprecision highp float;\n' + [
    'in vec3 vN;in float vH;in float vTrend;in float vDepth;in float vTop;in float vZ;',
    'uniform vec3 uBg,uBase,uUp,uDown,uAccent;uniform float uDark;',
    'out vec4 o;',
    'void main(){',
    '  vec3 L=normalize(vec3(-.4,1.,.55));',
    '  float dif=mix(.8,.45,uDark)+mix(.2,.55,uDark)*max(dot(vN,L),0.);',
    '  float k=clamp(vTrend*7.,-1.,1.);',
    '  vec3 tint=k>0.?uUp:uDown;',
    '  vec3 col=mix(uBase,tint,abs(k)*.45*smoothstep(.3,1.,vTop));',
    '  if(vN.y>.5){col=mix(col,tint,.7*abs(k))+uAccent*.08;}', /* lit caps */
    '  col*=dif;',
    '  col+=tint*abs(k)*smoothstep(.85,1.,vTop)*uDark*.35;',
    '  float fog=smoothstep(.2,1.,vZ);',
    '  float edge=(1.-fog)*smoothstep(.0,.14,vZ);',
    '  float a=edge*mix(.75,1.,uDark);',
    '  o=vec4(mix(col,uBg,fog)*a,a);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog = gl.createProgram();
  try {
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { document.documentElement.classList.add('no-gl'); return; }
  gl.useProgram(prog);

  /* a unit box, floor at y=0, top at y=1 (5 faces; the bottom is never seen) */
  var v = [], f = [
    [[0, 1, 0], [[-.5, 1, -.5], [.5, 1, -.5], [.5, 1, .5], [-.5, 1, .5]]],
    [[0, 0, 1], [[-.5, 0, .5], [.5, 0, .5], [.5, 1, .5], [-.5, 1, .5]]],
    [[0, 0, -1], [[.5, 0, -.5], [-.5, 0, -.5], [-.5, 1, -.5], [.5, 1, -.5]]],
    [[1, 0, 0], [[.5, 0, .5], [.5, 0, -.5], [.5, 1, -.5], [.5, 1, .5]]],
    [[-1, 0, 0], [[-.5, 0, -.5], [-.5, 0, .5], [-.5, 1, .5], [-.5, 1, -.5]]]
  ];
  f.forEach(function (face) {
    var n = face[0], q = face[1];
    [0, 1, 2, 0, 2, 3].forEach(function (i) { v.push(q[i][0], q[i][1], q[i][2], n[0], n[1], n[2]); });
  });
  var cells = [];
  for (var z = 0; z < NZ; z++) for (var x = 0; x < NX; x++) cells.push(x, z);

  var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos'), aNrm = gl.getAttribLocation(prog, 'aNrm'), aCell = gl.getAttribLocation(prog, 'aCell');
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(aNrm); gl.vertexAttribPointer(aNrm, 3, gl.FLOAT, false, 24, 12);
  var cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cells), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aCell); gl.vertexAttribPointer(aCell, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(aCell, 1);
  var VERTS = v.length / 6, COUNT = NX * NZ;

  var U = {};
  ['uVP', 'uTime', 'uMouse', 'uLift', 'uBg', 'uBase', 'uUp', 'uDown', 'uAccent', 'uDark'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });

  /* colours from the theme tokens */
  function rgb(name) {
    var probe = document.createElement('i'); probe.style.color = 'var(' + name + ')'; probe.style.display = 'none';
    document.body.appendChild(probe);
    var m = getComputedStyle(probe).color.match(/[\d.]+/g); probe.remove();
    return m ? [m[0] / 255, m[1] / 255, m[2] / 255] : [0, 0, 0];
  }
  function colours() {
    var bg = rgb('--bg'), dark = (bg[0] + bg[1] + bg[2]) / 3 < .5;
    gl.uniform3fv(U.uBg, bg);
    gl.uniform3fv(U.uBase, dark ? [.11, .125, .145] : [bg[0] * .93, bg[1] * .93, bg[2] * .92]);
    gl.uniform3fv(U.uUp, rgb('--live'));
    gl.uniform3fv(U.uDown, dark ? [.93, .45, .45] : [.72, .22, .2]);
    gl.uniform3fv(U.uAccent, rgb('--accent'));
    gl.uniform1f(U.uDark, dark ? 1 : 0);
    dirty = true;
  }
  var dirty = true;
  colours();
  new MutationObserver(colours).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', colours);

  /* camera: low over the near edge of the field, looking across it */
  function persp(fov, asp, n, f2) {
    var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f2);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f2 + n) * nf, -1, 0, 0, 2 * f2 * n * nf, 0];
  }
  function look(e, c, up) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }
  function mul(a, b) {
    var o = new Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s;
    }
    return o;
  }

  var mouse = { x: NX * .62, y: 6 }, aimM = { x: NX * .62, y: 6 }, lift = 0, aimLift = 0, cam = { x: 0, y: 0 }, aimCam = { x: 0, y: 0 };
  var scrollY = 0;
  window.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    if (e.clientY > r.bottom) { aimLift = 0; return; }
    var nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    aimM.x = nx * NX; aimM.y = Math.max(0, (1 - ny) * NZ * .55);
    aimCam.x = nx - .5; aimCam.y = ny - .5;
    aimLift = e.pointerType === 'mouse' ? 1 : 0;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { aimLift = 0; });
  window.addEventListener('scroll', function () { scrollY = window.scrollY; dirty = true; }, { passive: true });

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); dirty = true; }
  }

  gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
  var visible = true, raf = 0, t0 = performance.now(), last = t0;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) frame(performance.now()); }).observe(canvas);

  function frame(now) {
    cancelAnimationFrame(raf);
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    size();
    var e = Math.min(1, dt * 4);
    mouse.x += (aimM.x - mouse.x) * e; mouse.y += (aimM.y - mouse.y) * e;
    lift += (aimLift - lift) * Math.min(1, dt * 2.5);
    cam.x += (aimCam.x - cam.x) * Math.min(1, dt * 2); cam.y += (aimCam.y - cam.y) * Math.min(1, dt * 2);
    var asp = canvas.width / Math.max(1, canvas.height);
    var sc = Math.min(1, scrollY / Math.max(1, canvas.clientHeight));
    var eye = [cam.x * 2.5, 8.5 - cam.y * 1 + sc * 4, 8 - sc * 2], at = [cam.x * 1.2, -1.5, -NZ * .5];
    var fov = (asp < 1 ? 62 : 42) * Math.PI / 180;
    gl.uniformMatrix4fv(U.uVP, false, new Float32Array(mul(persp(fov, asp, .1, 200), look(eye, at, [0, 1, 0]))));
    gl.uniform1f(U.uTime, still ? 4 : (now - t0) / 1000);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform1f(U.uLift, lift);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, VERTS, COUNT);
    dirty = false;
    if (visible && !still) raf = requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () { if (still) frame(performance.now()); });
  frame(performance.now());
  canvas.classList.add('on');
})();
