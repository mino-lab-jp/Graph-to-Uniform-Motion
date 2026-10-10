
let points = [];
let tNow = 0;
let playing = false;
let speedSlider;
let playBtn, resetBtn, clearBtn;

const TMAX = 10;
const XMAX = 10;

let gx = { x: 75, y: 75, w: 600, h: 220 };
let gv = { x: 75, y: 365, w: 600, h: 190 };
let motion = { x: 75, y: 640, w: 600 };

function setup() {
  createCanvas(750, 790);
  textFont("Arial");

  playBtn = createButton("▶ 再生");
  playBtn.position(75, 12);
  playBtn.mousePressed(() => {
    if (points.length < 2) return;
    if (tNow >= points[points.length - 1].t) {
      tNow = points[0].t;
    }
    playing = !playing;
    playBtn.html(playing ? "⏸ 一時停止" : "▶ 再生");
  });

  resetBtn = createButton("最初に戻る");
  resetBtn.position(175, 12);
  resetBtn.mousePressed(() => {
    playing = false;
    tNow = points.length ? points[0].t : 0;
    playBtn.html("▶ 再生");
  });

  clearBtn = createButton("点をすべて消す");
  clearBtn.position(290, 12);
  clearBtn.mousePressed(() => {
    points = [];
    tNow = 0;
    playing = false;
    playBtn.html("▶ 再生");
  });

  speedSlider = createSlider(0.2, 3, 1, 0.1);
  speedSlider.position(515, 15);
  speedSlider.size(120);

  // 最初の点
  points.push({ t: 0, x: 0 });
}

function draw() {
  background(250);

  fill(30);
  noStroke();
  textSize(13);
  text("再生速度", 450, 29);
  text(speedSlider.value().toFixed(1) + "倍", 645, 29);

  if (playing && points.length >= 2) {
    tNow += deltaTime / 1000 * speedSlider.value();
    if (tNow >= points[points.length - 1].t) {
      tNow = points[points.length - 1].t;
      playing = false;
      playBtn.html("▶ 再生");
    }
  }

  drawXT();
  drawVT();
  drawMotion();
  drawInfo();
}

function px(t, g) {
  return g.x + t / TMAX * g.w;
}

function pyX(x) {
  return gx.y + gx.h / 2 - x / (2 * XMAX) * gx.h;
}

function pyV(v, vmax) {
  return gv.y + gv.h / 2 - v / vmax * gv.h / 2;
}

function drawXT() {
  drawGrid(gx, -XMAX, XMAX, "位置 x (m)", "時間 t (s)");

  // 折れ線
  stroke(25, 100, 230);
  strokeWeight(3);
  noFill();
  beginShape();
  for (let p of points) {
    vertex(px(p.t, gx), pyX(p.x));
  }
  endShape();

  for (let p of points) {
    fill(25, 100, 230);
    stroke(255);
    strokeWeight(1.5);
    circle(px(p.t, gx), pyX(p.x), 11);
  }

  if (points.length >= 2) {
    let x = positionAt(tNow);
    stroke(220, 60, 60);
    strokeWeight(1.5);
    drawingContext.setLineDash([5, 5]);
    line(px(tNow, gx), gx.y,
         px(tNow, gx), gx.y + gx.h);
    drawingContext.setLineDash([]);

    fill(230, 40, 40);
    noStroke();
    circle(px(tNow, gx), pyX(x), 13);
  }

  noStroke();
  fill(40);
  textSize(13);
  text("① クリックして位置と時刻を指定（左から右へ）",
       75, 53);
}

function drawVT() {
  let velocities = [];
  for (let i = 0; i < points.length - 1; i++) {
    let a = points[i];
    let b = points[i + 1];
    velocities.push((b.x - a.x) / (b.t - a.t));
  }

  let vmax = 2;
  for (let v of velocities) {
    vmax = max(vmax, abs(v) * 1.2);
  }

  drawGrid(gv, -vmax, vmax,
           "速度 v (m/s)", "時間 t (s)");

  // 区間ごとに速度は一定
  for (let i = 0; i < velocities.length; i++) {
    let v = velocities[i];
    let x1 = px(points[i].t, gv);
    let x2 = px(points[i + 1].t, gv);
    let y = pyV(v, vmax);

    stroke(20, 155, 90);
    strokeWeight(4);
    line(x1, y, x2, y);

    // 速度が変化する境界を破線で示す
    if (i > 0) {
      stroke(130);
      strokeWeight(1);
      drawingContext.setLineDash([3, 4]);
      line(x1, pyV(velocities[i - 1], vmax),
           x1, y);
      drawingContext.setLineDash([]);
    }
  }

  if (points.length >= 2) {
    let v = velocityAt(tNow);
    stroke(220, 60, 60);
    strokeWeight(1.5);
    drawingContext.setLineDash([5, 5]);
    line(px(tNow, gv), gv.y,
         px(tNow, gv), gv.y + gv.h);
    drawingContext.setLineDash([]);

    noStroke();
    fill(230, 40, 40);
    circle(px(tNow, gv), pyV(v, vmax), 12);
  }

  noStroke();
  fill(40);
  textSize(13);
  text("② x-t グラフの傾きから速度を自動計算",
       75, 343);
}

function drawGrid(g, minVal, maxVal, ylabel, xlabel) {
  fill(255);
  stroke(170);
  strokeWeight(1);
  rect(g.x, g.y, g.w, g.h);

  textSize(11);
  textAlign(CENTER, TOP);

  for (let i = 0; i <= 10; i++) {
    let x = g.x + g.w * i / 10;
    stroke(225);
    line(x, g.y, x, g.y + g.h);
    noStroke();
    fill(60);
    text(i, x, g.y + g.h + 5);
  }

  textAlign(RIGHT, CENTER);
  for (let i = 0; i <= 4; i++) {
    let val = maxVal - (maxVal - minVal) * i / 4;
    let y = g.y + g.h * i / 4;
    stroke(225);
    line(g.x, y, g.x + g.w, y);
    noStroke();
    fill(60);
    text(val.toFixed(1), g.x - 7, y);
  }

  stroke(70);
  strokeWeight(1.5);
  line(g.x, g.y + g.h / 2,
       g.x + g.w, g.y + g.h / 2);

  noStroke();
  fill(30);
  textAlign(LEFT, CENTER);
  textSize(13);
  text(ylabel, g.x, g.y - 12);
  textAlign(RIGHT, CENTER);
  text(xlabel, g.x + g.w, g.y + g.h + 35);
  textAlign(LEFT, BASELINE);
}

function positionAt(t) {
  if (points.length === 0) return 0;
  if (t <= points[0].t) return points[0].x;

  for (let i = 0; i < points.length - 1; i++) {
    let a = points[i];
    let b = points[i + 1];
    if (t <= b.t) {
      let f = (t - a.t) / (b.t - a.t);
      return lerp(a.x, b.x, f);
    }
  }
  return points[points.length - 1].x;
}

function velocityAt(t) {
  if (points.length < 2) return 0;
  for (let i = 0; i < points.length - 1; i++) {
    let a = points[i];
    let b = points[i + 1];
    if (t < b.t || i === points.length - 2) {
      return (b.x - a.x) / (b.t - a.t);
    }
  }
  return 0;
}

function drawMotion() {
  fill(30);
  noStroke();
  textSize(14);
  text("③ 1次元の物体の運動", 75, 615);

  let y = motion.y + 45;

  stroke(80);
  strokeWeight(2);
  line(motion.x, y, motion.x + motion.w, y);

  for (let i = -10; i <= 10; i += 2) {
    let xx = motion.x + (i + 10) / 20 * motion.w;
    stroke(100);
    line(xx, y - 6, xx, y + 6);
    noStroke();
    fill(50);
    textSize(11);
    textAlign(CENTER);
    text(i, xx, y + 22);
  }

  let x = positionAt(tNow);
  let bx = motion.x + (x + 10) / 20 * motion.w;

  fill(240, 110, 30);
  stroke(160, 70, 20);
  strokeWeight(2);
  circle(bx, y - 20, 30);

  textAlign(LEFT);
  noStroke();
  fill(40);
  textSize(12);
  text("位置 x (m)", 75, y - 45);
}

function drawInfo() {
  let x = positionAt(tNow);
  let v = points.length >= 2 ? velocityAt(tNow) : 0;

  noStroke();
  fill(20);
  textSize(16);
  text(
    "時刻 t = " + tNow.toFixed(2) + " s" +
    "     位置 x = " + x.toFixed(2) + " m" +
    "     速度 v = " + v.toFixed(2) + " m/s",
    75, 770
  );
}

function mousePressed() {
  // グラフ内クリックのみ追加
  if (mouseX < gx.x || mouseX > gx.x + gx.w ||
      mouseY < gx.y || mouseY > gx.y + gx.h) return;

  let t = (mouseX - gx.x) / gx.w * TMAX;
  let x = (gx.y + gx.h / 2 - mouseY) /
          (gx.h / 2) * XMAX;

  // 時刻が増加する方向にのみ点を追加
  if (points.length > 0 &&
      t <= points[points.length - 1].t + 0.05) {
    return;
  }

  points.push({ t: t, x: x });
  playing = false;
  tNow = points[0].t;
  playBtn.html("▶ 再生");
}
