/* Interactive homework pages — tiny shared chart kit (no dependencies).
   Charts are plain SVG; every page builds its own figures from these helpers. */
"use strict";

const NS = "http://www.w3.org/2000/svg";
const S1 = getComputedStyle(document.documentElement).getPropertyValue("--s1").trim() || "#2f6bd0";
const S2 = getComputedStyle(document.documentElement).getPropertyValue("--s2").trim() || "#c0562f";
const S3 = getComputedStyle(document.documentElement).getPropertyValue("--s3").trim() || "#189a62";

function el(name, attrs, parent){
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function fmt(x, d=3){
  if (!isFinite(x)) return "—";
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return x.toExponential(2);
  return (+x.toFixed(d)).toString();
}

/* A chart frame: margins, linear scales, recessive grid + axes. */
function makeChart(host, opt){
  const W = opt.w || 420, H = opt.h || 300;
  const m = Object.assign({t:14, r:14, b:40, l:52}, opt.margin || {});
  const svg = el("svg", {viewBox:`0 0 ${W} ${H}`, role:"img",
                         "aria-label": opt.aria || "chart"}, host);
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const g = el("g", {transform:`translate(${m.l},${m.t})`}, svg);
  const [x0, x1] = opt.xdom, [y0, y1] = opt.ydom;
  const xlog = !!opt.xlog;
  const sx = x => xlog
    ? (Math.log(x) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) * iw
    : (x - x0) / (x1 - x0) * iw;
  const sy = y => ih - (y - y0) / (y1 - y0) * ih;
  const clipId = "c" + Math.random().toString(36).slice(2, 8);
  const clip = el("clipPath", {id: clipId}, svg);
  el("rect", {x:0, y:0, width:iw, height:ih}, clip);
  const grid = el("g", {}, g);
  const plot = el("g", {"clip-path":`url(#${clipId})`}, g);
  const fore = el("g", {}, g);

  (opt.xticks || []).forEach(t => {
    const tx = sx(t.v !== undefined ? t.v : t);
    el("line", {x1:tx, y1:0, x2:tx, y2:ih, class:"gridline"}, grid);
    el("text", {x:tx, y:ih+16, "text-anchor":"middle", class:"ticklab"}, grid)
      .textContent = (t.l !== undefined ? t.l : fmt(t));
  });
  (opt.yticks || []).forEach(t => {
    const ty = sy(t.v !== undefined ? t.v : t);
    el("line", {x1:0, y1:ty, x2:iw, y2:ty, class:"gridline"}, grid);
    el("text", {x:-8, y:ty+3.5, "text-anchor":"end", class:"ticklab"}, grid)
      .textContent = (t.l !== undefined ? t.l : fmt(t));
  });
  el("line", {x1:0, y1:ih, x2:iw, y2:ih, class:"axisline"}, g);
  el("line", {x1:0, y1:0, x2:0, y2:ih, class:"axisline"}, g);
  if (opt.xlab) el("text", {x:iw/2, y:ih+32, "text-anchor":"middle", class:"axlab"}, g).textContent = opt.xlab;
  if (opt.ylab){
    el("text", {x:-m.l+14, y:ih/2, class:"axlab",
                transform:`rotate(-90 ${-m.l+14} ${ih/2})`, "text-anchor":"middle"}, g).textContent = opt.ylab;
  }
  return {svg, g, grid, plot, fore, sx, sy, iw, ih, m, W, H, xdom:[x0,x1], ydom:[y0,y1]};
}

function pathFrom(pts, ch){
  return pts.map((p,i) => (i ? "L" : "M") + ch.sx(p[0]).toFixed(2) + " " + ch.sy(p[1]).toFixed(2)).join("");
}
function fnPath(ch, f, x0, x1, nPts=241){
  const pts = [];
  for (let i=0; i<=nPts; i++){
    const x = x0 + (x1-x0)*i/nPts;
    pts.push([x, f(x)]);
  }
  return pathFrom(pts, ch);
}
function line(ch, d, color, dash){
  const a = {d, fill:"none", stroke:color, "stroke-width":2, "stroke-linejoin":"round"};
  if (dash) a["stroke-dasharray"] = dash;
  return el("path", a, ch.plot);
}
function dot(ch, x, y, color, r=4.5, parent){
  return el("circle", {cx:ch.sx(x), cy:ch.sy(y), r, fill:color,
                       stroke:"#fff", "stroke-width":1.5}, parent || ch.fore);
}
function vline(ch, x, cls="refline", parent){
  return el("line", {x1:ch.sx(x), y1:0, x2:ch.sx(x), y2:ch.ih, class:cls}, parent || ch.plot);
}
function hline(ch, y, cls="refline", parent){
  return el("line", {x1:0, y1:ch.sy(y), x2:ch.iw, y2:ch.sy(y), class:cls}, parent || ch.plot);
}
function dirlab(ch, x, y, text, color, anchor="start", dy=-6){
  const t = el("text", {x:ch.sx(x), y:ch.sy(y)+dy, class:"dirlab", fill:color,
                        "text-anchor":anchor}, ch.fore);
  t.textContent = text;
  return t;
}

/* Crosshair + tooltip for function charts.  series: [{name,color,f}] */
function attachHover(wrapper, ch, series, xfmt, yfmt){
  const tip = document.createElement("div");
  tip.className = "tip";
  wrapper.appendChild(tip);
  const cross = el("line", {class:"crossline", y1:0, y2:ch.ih, visibility:"hidden"}, ch.fore);
  const dots = series.map(s => el("circle",
      {r:4, fill:s.color, stroke:"#fff", "stroke-width":1.5, visibility:"hidden"}, ch.fore));
  ch.svg.addEventListener("mousemove", ev => {
    const r = ch.svg.getBoundingClientRect();
    const px = (ev.clientX - r.left) * ch.W / r.width - ch.m.l;
    if (px < 0 || px > ch.iw){ hide(); return; }
    const x = ch.xdom[0] + (px / ch.iw) * (ch.xdom[1] - ch.xdom[0]);
    cross.setAttribute("x1", px); cross.setAttribute("x2", px);
    cross.setAttribute("visibility", "visible");
    let html = `<b>${(xfmt || fmt)(x)}</b>`;
    series.forEach((s, i) => {
      const y = s.f(x);
      if (isFinite(y) && y >= ch.ydom[0] && y <= ch.ydom[1]){
        dots[i].setAttribute("cx", ch.sx(x));
        dots[i].setAttribute("cy", ch.sy(y));
        dots[i].setAttribute("visibility", "visible");
      } else dots[i].setAttribute("visibility", "hidden");
      html += `<br><span style="color:${s.color}">●</span> ${s.name}: <b>${(yfmt || fmt)(y)}</b>`;
    });
    tip.innerHTML = html;
    tip.style.display = "block";
    const wr = wrapper.getBoundingClientRect();
    let tx = ev.clientX - wr.left + 14, ty = ev.clientY - wr.top + 10;
    if (tx + tip.offsetWidth > wr.width - 4) tx -= tip.offsetWidth + 24;
    tip.style.left = tx + "px"; tip.style.top = ty + "px";
  });
  ch.svg.addEventListener("mouseleave", hide);
  function hide(){
    tip.style.display = "none";
    cross.setAttribute("visibility", "hidden");
    dots.forEach(d => d.setAttribute("visibility", "hidden"));
  }
}

/* Deterministic PRNG + normals, so every visitor sees the same clouds. */
function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function gaussPairs(n, seed){
  const rnd = mulberry32(seed), out = [];
  for (let i=0; i<n; i++){
    const u1 = Math.max(rnd(), 1e-12), u2 = rnd();
    const r = Math.sqrt(-2*Math.log(u1));
    out.push([r*Math.cos(2*Math.PI*u2), r*Math.sin(2*Math.PI*u2)]);
  }
  return out;
}
const normPdf = (x, m, s) => Math.exp(-((x-m)*(x-m))/(2*s*s)) / (s*Math.sqrt(2*Math.PI));
function binomPmf(n, p){
  // stable recurrence
  const out = new Array(n+1);
  out[0] = Math.pow(1-p, n);
  for (let k=1; k<=n; k++){
    out[k] = (p === 1) ? (k===n ? 1 : 0)
      : out[k-1] * ((n-k+1)/k) * (p/(1-p));
  }
  if (p === 1){ out.fill(0); out[n] = 1; }
  return out;
}

/* slider wiring: <input data-out="id"> updates its readout and calls redraw */
function bindControls(scope, redraw){
  scope.querySelectorAll("input[type=range]").forEach(inp => {
    const out = scope.querySelector("#" + inp.dataset.out);
    const show = () => { if (out) out.textContent = inp.dataset.fmt === "int"
        ? Math.round(+inp.value) : fmt(+inp.value, +(inp.dataset.dec ?? 2)); };
    inp.addEventListener("input", () => { show(); redraw(); });
    show();
  });
}
