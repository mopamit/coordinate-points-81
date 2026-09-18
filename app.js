(() => {
  const points = [
    { id: 'A', x: 2,  y: 4 },
    { id: 'B', x: 0,  y: 3 },
    { id: 'C', x: -4, y: 5 },
    { id: 'D', x: -2, y: 0 },
    { id: 'E', x: -5, y: -4 },
    { id: 'F', x: 0,  y: -4 },
    { id: 'G', x: 5,  y: -1 },
    { id: 'H', x: 1,  y: 0 }
  ];

  const xMin = -6;
  const xMax = 6;
  const yMin = -5;
  const yMax = 6;
  const vbW = 760;
  const vbH = 680;
  const pad = { l: 70, r: 36, t: 32, b: 55 };
  const plotW = vbW - pad.l - pad.r;
  const plotH = vbH - pad.t - pad.b;

  const sx = x => pad.l + (x - xMin) * plotW / (xMax - xMin);
  const sy = y => pad.t + (yMax - y) * plotH / (yMax - yMin);
  const fromX = px => xMin + (px - pad.l) * (xMax - xMin) / plotW;
  const fromY = py => yMax - (py - pad.t) * (yMax - yMin) / plotH;

  const ns = 'http://www.w3.org/2000/svg';
  const graph = document.getElementById('graph');
  const pointList = document.getElementById('pointList');
  const selectedBadge = document.getElementById('selectedBadge');
  const message = document.getElementById('message');
  const progress = document.getElementById('progress');
  const topProgress = document.getElementById('topProgress');
  const resetBtn = document.getElementById('resetBtn');

  let selected = null;
  const state = {};
  points.forEach(p => {
    state[p.id] = { status: 'idle', placed: false };
  });

  // בידוד ביטויים מתמטיים/לטיניים בתוך משפט עברי.
  const ltr = value => `\u2066${value}\u2069`;

  function svgEl(tag, attrs = {}, text = '') {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text !== '') el.textContent = text;
    return el;
  }

  function drawGraph() {
    graph.innerHTML = '';

    const defs = svgEl('defs');
    const marker = svgEl('marker', {
      id: 'arrow',
      markerWidth: '8',
      markerHeight: '8',
      refX: '6',
      refY: '4',
      orient: 'auto',
      markerUnits: 'strokeWidth'
    });
    marker.appendChild(svgEl('path', {
      d: 'M0,0 L8,4 L0,8 z',
      fill: '#495766'
    }));
    defs.appendChild(marker);
    graph.appendChild(defs);

    for (let x = xMin; x <= xMax; x++) {
      graph.appendChild(svgEl('line', {
        x1: sx(x),
        y1: pad.t,
        x2: sx(x),
        y2: vbH - pad.b,
        class: x === 0 ? 'axis-line' : 'grid-line'
      }));
    }

    for (let y = yMin; y <= yMax; y++) {
      graph.appendChild(svgEl('line', {
        x1: pad.l,
        y1: sy(y),
        x2: vbW - pad.r,
        y2: sy(y),
        class: y === 0 ? 'axis-line' : 'grid-line'
      }));
    }

    graph.appendChild(svgEl('line', {
      x1: sx(xMin),
      y1: sy(0),
      x2: sx(xMax) + 10,
      y2: sy(0),
      class: 'axis-line',
      'marker-end': 'url(#arrow)'
    }));

    graph.appendChild(svgEl('line', {
      x1: sx(0),
      y1: sy(yMin),
      x2: sx(0),
      y2: sy(yMax) - 10,
      class: 'axis-line',
      'marker-end': 'url(#arrow)'
    }));

    for (let x = xMin; x <= xMax; x++) {
      if (x === 0) continue;
      graph.appendChild(svgEl('text', {
        x: sx(x),
        y: sy(0) + 23,
        'text-anchor': 'middle',
        class: 'tick-text'
      }, String(x)));
    }

    for (let y = yMin; y <= yMax; y++) {
      if (y === 0) continue;
      graph.appendChild(svgEl('text', {
        x: sx(0) - 12,
        y: sy(y) + 5,
        'text-anchor': 'end',
        class: 'tick-text'
      }, String(y)));
    }

    graph.appendChild(svgEl('text', {
      x: sx(0) - 10,
      y: sy(0) + 22,
      'text-anchor': 'end',
      class: 'tick-text'
    }, '0'));

    graph.appendChild(svgEl('text', {
      x: sx(xMax) + 18,
      y: sy(0) + 6,
      class: 'axis-label'
    }, 'x'));

    graph.appendChild(svgEl('text', {
      x: sx(0) - 7,
      y: sy(yMax) - 16,
      class: 'axis-label'
    }, 'y'));

    points.forEach(p => {
      if (!state[p.id].placed) return;

      graph.appendChild(svgEl('circle', {
        cx: sx(p.x),
        cy: sy(p.y),
        r: 7,
        class: 'plot-dot'
      }));

      graph.appendChild(svgEl('text', {
        x: sx(p.x) + 11,
        y: sy(p.y) - 10,
        class: 'plot-label'
      }, p.id));
    });
  }

  function renderList() {
    pointList.innerHTML = '';

    points.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'point-btn';

      if (selected === p.id) btn.classList.add('active');
      if (state[p.id].status === 'correct') btn.classList.add('correct');
      if (state[p.id].status === 'wrong') btn.classList.add('wrong');

      btn.disabled = state[p.id].placed;
      btn.dataset.id = p.id;

      const coord = document.createElement('span');
      coord.className = 'coord';
      coord.textContent = `${p.id}(${p.x},${p.y})`;

      const status = document.createElement('span');
      status.className = 'status';
      status.textContent =
        state[p.id].status === 'correct' ? '✓' :
        state[p.id].status === 'wrong' ? '✕' : '•';

      btn.append(coord, status);

      btn.addEventListener('click', () => {
        if (state[p.id].placed) return;

        selected = p.id;
        state[p.id].status = 'idle';
        selectedBadge.innerHTML = `עובדים על: <strong>${p.id}(${p.x},${p.y})</strong>`;
        message.className = 'message';
        message.textContent = 'עכשיו לחצו על המקום המתאים במערכת הצירים.';
        renderList();
      });

      pointList.appendChild(btn);
    });

    const done = points.filter(p => state[p.id].placed).length;
    progress.textContent = `${done} מתוך ${points.length}`;
    if (topProgress) {
      topProgress.style.width = `${done / points.length * 100}%`;
    }
  }

  function finishCheck() {
    const done = points.filter(p => state[p.id].placed).length;

    if (done === points.length) {
      selected = null;
      selectedBadge.textContent = 'כל הנקודות סומנו';
      message.className = 'message done';
      message.textContent = 'כל הכבוד! מיקמתם נכון את כל 8 הנקודות.';
      renderList();
    }
  }

  /*
   * ממיר את מיקום הלחיצה מקואורדינטות המסך לקואורדינטות האמיתיות
   * של ה-SVG. בניגוד לחישוב לפי getBoundingClientRect(), הדרך הזו
   * מכבדת באופן מלא scaling, viewBox, preserveAspectRatio, zoom ו-DPR.
   */
  function eventToSvgPoint(ev) {
    const ctm = graph.getScreenCTM();
    if (!ctm) return null;

    // createSVGPoint נתמך היטב גם בדפדפנים ישנים יחסית.
    const pt = graph.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;

    return pt.matrixTransform(ctm.inverse());
  }

  function handleGraphClick(ev) {
    if (!selected) {
      message.className = 'message bad';
      message.textContent = 'קודם בחרו נקודה מהרשימה.';
      return;
    }

    const svgPoint = eventToSvgPoint(ev);
    if (!svgPoint) return;

    const px = svgPoint.x;
    const py = svgPoint.y;

    // מתעלמים מלחיצה מחוץ לשטח הרשת עצמה.
    if (
      px < pad.l ||
      px > vbW - pad.r ||
      py < pad.t ||
      py > vbH - pad.b
    ) {
      return;
    }

    const gx = Math.round(fromX(px));
    const gy = Math.round(fromY(py));
    const p = points.find(q => q.id === selected);

    if (!p) return;

    if (gx === p.x && gy === p.y) {
      state[p.id].status = 'correct';
      state[p.id].placed = true;
      message.className = 'message ok';
      message.textContent = `נכון! נקודה ${ltr(`(${p.x},${p.y})`)} נמצאת ב־${ltr(p.id)}.`;
      selected = null;
      selectedBadge.textContent = 'בחרו את הנקודה הבאה';
      drawGraph();
      renderList();
      finishCheck();
    } else {
      state[p.id].status = 'wrong';
      message.className = 'message bad';
      message.textContent = `לא מדויק. סימנתם ${ltr(`(${gx},${gy})`)}. נסו שוב את הנקודה ${ltr(p.id)}.`;
      renderList();
    }
  }

  graph.addEventListener('click', handleGraphClick);

  resetBtn.addEventListener('click', () => {
    selected = null;

    points.forEach(p => {
      state[p.id] = { status: 'idle', placed: false };
    });

    selectedBadge.textContent = 'עדיין לא נבחרה נקודה';
    message.className = 'message';
    message.textContent = 'בחרו נקודה מהרשימה כדי להתחיל.';

    drawGraph();
    renderList();
  });

  drawGraph();
  renderList();
})();
