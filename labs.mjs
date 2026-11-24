import {
  add, adjugate, determinant, fraction, multiply, replaceColumn, split, transform, transpose,
} from './matrix.mjs';

const button = (label, action, pressed) =>
  `<button class="chip" type="button" data-action="${action}"${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}>${label}</button>`;

const readout = (message, warning = false) =>
  `<p class="readout${warning ? ' is-warning' : ''}" role="status">${message}</p>`;

export function matrix(values, { caption, mark = () => '', pick, selected, cut = [] } = {}) {
  const columns = values[0].length;
  const rows = values.map((row, i) => {
    const cells = row.map((value, j) => {
      const classes = [mark(i, j), j + 1 === cut[1] ? 'cut-col' : ''].join(' ');
      const contents = pick
        ? `<button class="cell-button" type="button" data-action="${pick}-${i}-${j}" aria-label="第 ${i + 1} 行第 ${j + 1} 列，${value}" aria-pressed="${selected?.[0] === i && selected?.[1] === j}">${value}</button>`
        : value;
      return `<td class="${classes}">${contents}</td>`;
    }).join('');
    return `<tr${i + 1 === cut[0] ? ' class="cut-row"' : ''}>${cells}</tr>`;
  }).join('');
  return `<figure class="matrix-figure"><figcaption>${caption}</figcaption><table class="matrix${pick ? ' is-interactive' : ''}" aria-label="${caption}，${values.length}×${columns}"><tbody>${rows}</tbody></table></figure>`;
}

function activate(panel, render, onAction) {
  panel.innerHTML = render();
  panel.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target || !panel.contains(target)) return;
    const action = target.dataset.action;
    if (onAction(action) === false) return;
    const hadFocus = document.activeElement === target;
    panel.innerHTML = render();
    if (hadFocus) panel.querySelector(`[data-action="${action}"]`)?.focus({ preventScroll: true });
  });
}

function transposeLab(panel) {
  const A = [[1, 2, 3], [4, 5, 6]];
  const B = [[1, 0], [0, 1], [1, 2]];
  const AB = multiply(A, B);
  const AT = transpose(A);
  const BT = transpose(B);
  let selected = [0, 1];
  let step = 0;
  function render() {
    const [row, col] = selected;
    const original = matrix(A, { caption: 'A · 2×3', pick: 'cell', selected });
    const flipped = matrix(AT, { caption: 'Aᵀ · 3×2', mark: (i, j) => i === col && j === row ? 'active' : '' });
    const paths = [
      {
        figures: matrix(A, { caption: 'A · 取第 1 行', mark: i => i === 0 ? 'active' : '' }) +
          matrix(B, { caption: 'B · 取第 2 列', mark: (_, j) => j === 1 ? 'active' : '' }) +
          matrix(AB, { caption: 'AB', mark: (i, j) => i === 0 && j === 1 ? 'active' : '' }),
        explanation: '先算 AB。第 1 行和第 2 列逐项相乘，1×0 + 2×1 + 3×2 = 8。它落在 AB 的 (1, 2) 位置。',
      },
      {
        figures: matrix(AB, { caption: 'AB', mark: (i, j) => i === 0 && j === 1 ? 'active' : '' }) +
          matrix(transpose(AB), { caption: '(AB)ᵀ', mark: (i, j) => i === 1 && j === 0 ? 'active' : '' }),
        explanation: '转置把 8 从 (1, 2) 移到 (2, 1)。',
      },
      {
        figures: matrix(BT, { caption: 'Bᵀ · 取第 2 行', mark: i => i === 1 ? 'active' : '' }) +
          matrix(AT, { caption: 'Aᵀ · 取第 1 列', mark: (_, j) => j === 0 ? 'active' : '' }) +
          matrix(multiply(BT, AT), { caption: 'BᵀAᵀ', mark: (i, j) => i === 1 && j === 0 ? 'active' : '' }),
        explanation: 'B 原来的列现在是行，放在左边。A 原来的行现在是列，放在右边。0×1 + 1×2 + 2×3 仍然是 8。',
      },
    ];
    return `<div class="matrix-set">${original}${flipped}</div>
      ${readout(`${A[row][col]} 从第 ${row + 1} 行第 ${col + 1} 列，移到第 ${col + 1} 行第 ${row + 1} 列。`)}
      <hr class="lab-divider"><h4>跟着一个格子验证乘积转置</h4>
      <div class="lab-actions" role="group" aria-label="乘积转置步骤">${['1 算乘积', '2 做转置', '3 反向相乘'].map((label, i) => button(label, `step-${i}`, i === step)).join('')}</div>
      <div class="matrix-set">${paths[step].figures}</div>${readout(paths[step].explanation)}`;
  }
  activate(panel, render, action => {
    const [kind, i, j] = action.split('-');
    if (kind === 'cell') selected = [Number(i), Number(j)];
    if (kind === 'step') step = Number(i);
  });
}

const size = [330, 248];
const origin = [165, 124];
const unit = 23;
const toCanvas = ([x, y]) => [origin[0] + unit * x, origin[1] - unit * y];
const canvas = (label, drag = false) =>
  `<canvas class="plot${drag ? ' drag' : ''}" width="660" height="496" role="img" aria-label="${label}"></canvas>`;

export function line(context, start, end, color, width = 1, dashed = false) {
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dashed ? [6, 4] : []);
  context.beginPath();
  context.moveTo(...toCanvas(start));
  context.lineTo(...toCanvas(end));
  context.stroke();
  context.setLineDash([]);
}

export function grid(element) {
  const context = element.getContext('2d');
  context.setTransform(2, 0, 0, 2, 0, 0);
  context.clearRect(0, 0, ...size);
  for (let i = -7; i <= 7; i += 1) line(context, [i, -6], [i, 6], '#eae4f5');
  for (let i = -5; i <= 5; i += 1) line(context, [-8, i], [8, i], '#eae4f5');
  line(context, [-8, 0], [8, 0], '#8d80a1', 1.4);
  line(context, [0, -6], [0, 6], '#8d80a1', 1.4);
  context.fillStyle = '#5c546e';
  context.font = '14px system-ui';
  context.fillText('x', 314, 117);
  context.fillText('y', 173, 15);
  return context;
}

export function point(context, vector, text, color, shift = [9, -8]) {
  const center = toCanvas(vector);
  context.beginPath();
  context.fillStyle = color;
  context.arc(...center, 5, 0, 2 * Math.PI);
  context.fill();
  context.font = 'bold 15px system-ui';
  context.fillText(text, center[0] + shift[0], center[1] + shift[1]);
}

export function shape(context, points, fill, stroke) {
  context.beginPath();
  context.moveTo(...toCanvas(points[0]));
  points.slice(1).forEach(vector => context.lineTo(...toCanvas(vector)));
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = 2;
  context.stroke();
}

function inverseLab(panel) {
  const models = [
    { name: '拉伸', values: [[2, 0], [0, 1]], description: '横向拉伸把 x 坐标放大到两倍，除以 2 就能找回原位置。' },
    { name: '剪切', values: [[1, 1], [0, 1]], description: '剪切给 x 坐标加上 y。知道输出后，再减去 y 就能找回原位置。' },
    { name: '压成一条线', values: [[1, 1], [0, 0]], description: '压扁后只留下 x + y。v 与 v′ 的和相同，所以输出重合，无法唯一找回原输入。' },
  ];
  const stages = ['1 算行列式', '2 写伴随矩阵', '3 相除求逆', '4 乘回去验算'];
  const initial = [-0.5, 1.5];
  const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
  let model = 0;
  let view = 0;
  let vector = [...initial];
  let pointer = null;
  panel.innerHTML = `<div class="lab-actions" role="group" aria-label="选择变换">${models.map(({ name }, i) => button(name, `model-${i}`, !i)).join('')}</div>
    <div id="inverse-matrix" class="matrix-set"></div>
    ${canvas('坐标网格。可拖动输入向量，也可用下方按钮移动。', true)}
    <div class="legend"><b>● v · 输入</b><b>● Av · 输出</b></div>
    <div class="lab-actions" role="group" aria-label="移动输入向量">${[
      ['左移', 'left'], ['右移', 'right'], ['上移', 'up'], ['下移', 'down'], ['重置', 'reset'],
    ].map(([label, action]) => button(label, action)).join('')}</div>
    <p class="readout" id="inverse-status" role="status"></p>
    <hr class="lab-divider"><h4>用伴随矩阵求逆</h4>
    <div class="lab-actions" role="group" aria-label="求逆步骤">${stages.map((label, i) => button(label, `stage-${i}`, !i)).join('')}</div>
    <div id="inverse-steps"></div>`;
  const plot = panel.querySelector('canvas');
  const message = panel.querySelector('#inverse-status');
  const format = vector => '（' + vector.join('，') + '）';
  const clamp = value => Math.max(-2, Math.min(2, value));

  function draw() {
    const { values, description } = models[model];
    const context = grid(plot);
    const output = transform(values, vector);
    shape(context, square, '#7048e82b', '#8c69df');
    shape(context, square.map(vertex => transform(values, vertex)), '#69c6a147', '#2e8866');
    line(context, [0, 0], vector, '#5e39b4', 2);
    line(context, [0, 0], output, '#168153', 2, true);
    point(context, vector, 'v', '#5e39b4', [8, 16]);
    point(context, output, 'Av', '#156044');
    let text = `v ${format(vector)}，Av ${format(output)}。${description}`;
    if (!determinant(values)) {
      const other = [vector[0] + 0.5, vector[1] - 0.5];
      line(context, [0, 0], other, '#82591c', 2, true);
      point(context, other, 'v′', '#82591c', [8, 16]);
      text = `v ${format(vector)} 与 v′ ${format(other)} 都落在 ${format(output)}。${description}`;
    }
    if (message.textContent !== text) message.textContent = text;
  }

  function updateStages() {
    const { values } = models[model];
    const det = determinant(values);
    const adj = adjugate(values);
    const [[a, b], [c, d]] = values;
    const product = multiply(values, adj);
    const description = [
      readout(`det A = ${a}×${d} − ${b}×${c} = ${det}。${det ? '可以继续求逆。' : '这个矩阵不可逆。'}`, !det),
      `<div class="matrix-set">${matrix(adj, { caption: 'adj(A)' })}</div>${readout('二阶矩阵的伴随矩阵把主对角线两项互换，另一条对角线两项取反。') }`,
      det
        ? `<div class="matrix-set">${matrix(adj.map(row => row.map(value => fraction(value, det))), { caption: 'A⁻¹' })}</div>${readout(`每个元素都除以 det A = ${det}。`)}`
        : readout('det A = 0，不能作除法，A⁻¹ 不存在。', true),
      det
        ? `<div class="matrix-set">${matrix(product.map(row => row.map(value => fraction(value, det))), { caption: 'A·A⁻¹ = I' })}</div>${readout('用普通矩阵乘法相乘，得到单位矩阵。') }`
        : readout('矩阵压扁了一个方向，所以不存在能乘回 I 的逆矩阵。', true),
    ];
    panel.querySelector('#inverse-matrix').innerHTML = matrix(values, { caption: '当前 A' });
    panel.querySelector('#inverse-steps').innerHTML = description[view];
    panel.querySelectorAll('[data-action^="model-"]').forEach((item, i) => item.setAttribute('aria-pressed', i === model));
    panel.querySelectorAll('[data-action^="stage-"]').forEach((item, i) => item.setAttribute('aria-pressed', i === view));
  }

  const offsets = { left: [-0.5, 0], right: [0.5, 0], up: [0, 0.5], down: [0, -0.5] };
  panel.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const [kind, index] = action.split('-');
    if (kind === 'model') {
      model = Number(index);
      view = 0;
      updateStages();
    } else if (kind === 'stage') {
      view = Number(index);
      updateStages();
    } else if (kind === 'reset') {
      vector = [...initial];
    } else if (offsets[action]) {
      vector = vector.map((value, i) => clamp(value + offsets[action][i]));
    }
    draw();
  });
  function drag(event) {
    const rect = plot.getBoundingClientRect();
    const x = (event.clientX - rect.left) * size[0] / rect.width;
    const y = (event.clientY - rect.top) * size[1] / rect.height;
    vector = [(x - origin[0]) / unit, (origin[1] - y) / unit].map(value => clamp(Math.round(value * 2) / 2));
    draw();
  }
  plot.addEventListener('pointerdown', event => {
    if (pointer !== null || event.button !== 0) return;
    pointer = event.pointerId;
    plot.setPointerCapture(pointer);
    drag(event);
  });
  plot.addEventListener('pointermove', event => {
    if (event.pointerId === pointer) drag(event);
  });
  plot.addEventListener('lostpointercapture', () => { pointer = null; });
  updateStages();
  draw();
}

function cramerLab(panel) {
  const models = [
    { label: '唯一解', A: [[1, 1], [1, -1]], b: [4, 0], description: '两条直线相交。交点同时满足两个方程。' },
    { label: '无解', A: [[1, 1], [2, 2]], b: [4, 4], description: '第二式化简成 x + y = 2，与第一式平行。' },
    { label: '无穷多解', A: [[1, 1], [2, 2]], b: [4, 8], description: '第二式化简成 x + y = 4，两条直线重合。' },
  ];
  let current = 0;
  let column = -1;
  panel.innerHTML = `<div class="lab-actions" role="group" aria-label="选择解的情形">${models.map(({ label }, i) => button(label, `model-${i}`, !i)).join('')}</div>
    <p id="equations" class="panel"></p>
    ${canvas('两元一次方程组的坐标图') }
    <div class="legend"><b>实线 · 方程一</b><b>虚线 · 方程二</b></div>
    <p id="intersection" class="readout" role="status"></p>
    <hr class="lab-divider"><h4>用常数列 b 替换一列</h4>
    <div class="lab-actions" role="group" aria-label="选择要替换的系数列">${button('替换第 1 列', 'col-0', false)}${button('替换第 2 列', 'col-1', false)}${button('还原', 'reset')}</div>
    <div id="cramer-matrices" class="matrix-set"></div>
    <p id="cramer-status" class="readout" role="status"></p>`;
  const plot = panel.querySelector('canvas');
  function render() {
    const { A, b, label, description } = models[current];
    const D = determinant(A);
    const names = ['x', 'y'];
    const equations = 'x + y = 4，' + (current === 0 ? 'x − y = 0' : `2x + 2y = ${b[1]}`);
    const context = grid(plot);
    const colors = ['#603ac6', '#1c7a58'];
    A.forEach(([a, d], i) => line(context, [-8, (b[i] + 8 * a) / d], [8, (b[i] - 8 * a) / d], colors[i], 2.5, i === 1));
    if (D) {
      const solution = names.map((_, i) => determinant(replaceColumn(A, i, b)) / D);
      point(context, solution, `(${solution.join(', ')})`, '#372452');
    }
    plot.setAttribute('aria-label', `${equations}。${description}`);
    panel.querySelector('#equations').textContent = equations;
    panel.querySelector('#intersection').textContent = `${label}。${description}`;
    const matrices = matrix(A, { caption: '系数矩阵 A', mark: (_, j) => j === column ? 'block-secondary' : '' }) +
      matrix(b.map(value => [value]), { caption: '常数列 b', mark: () => 'active' });
    const status = panel.querySelector('#cramer-status');
    const replaced = column < 0 ? null : replaceColumn(A, column, b);
    panel.querySelector('#cramer-matrices').innerHTML = matrices + (replaced
      ? matrix(replaced, { caption: `替换后的 A（${names[column]}）`, mark: (_, j) => j === column ? 'active' : '' })
      : '');
    const det = replaced ? determinant(replaced) : null;
    status.classList.toggle('is-warning', !D);
    status.textContent = (replaced ? `D${column + 1} = ${det}。` : '') +
      (D ? (replaced ? `${names[column]} = D${column + 1}/D = ${det}/(${D}) = ${fraction(det, D)}。` : `D = ${D}。轻点要替换的列。`)
        : 'D = 0，克拉默法则的比值没有定义。');
    panel.querySelectorAll('[data-action^="model-"]').forEach((item, i) => item.setAttribute('aria-pressed', i === current));
    panel.querySelectorAll('[data-action^="col-"]').forEach((item, i) => item.setAttribute('aria-pressed', i === column));
  }
  panel.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const [kind, index] = action.split('-');
    if (kind === 'model') { current = Number(index); column = -1; }
    if (kind === 'col') column = Number(index);
    if (kind === 'reset') column = -1;
    render();
  });
  render();
}

function blocksLab(panel) {
  const A = [[1, 2, 0, 1], [0, 1, 1, 2], [2, 0, 1, 1]];
  const B = [[1, 0, 2], [2, 1, 0], [0, 1, 2], [1, 0, 1]];
  const AB = multiply(A, B);
  const cuts = [1, 2, 2, 2];
  let selected = [0, 0];
  const group = (title, index, total) => `<div class="stepper" role="group" aria-label="${title}">
    <span class="stepper-label">${title}</span>${Array.from({ length: total - 1 }, (_, i) =>
      button(`${i + 1} + ${total - i - 1}`, `cut-${index}-${i + 1}`, cuts[index] === i + 1)).join('')}</div>`;
  function render() {
    const [ar, ac, br, bc] = cuts;
    const [row, col] = selected;
    const match = ac === br;
    const left = split(A, ar, ac);
    const right = split(B, br, bc);
    const pickers = [[ 'C₁₁', 'C₁₂' ], [ 'C₂₁', 'C₂₂' ]];
    const resultLabel = pickers[row][col];
    const mark = (i, k) => i === row ? (k === 0 ? 'active' : 'block-secondary') : '';
    const leftFigure = matrix(A, { caption: 'A · 3×4', cut: [ar, ac], mark: (i, j) => mark(Number(i >= ar), Number(j >= ac)) });
    const rightFigure = matrix(B, { caption: 'B · 4×3', cut: [br, bc], mark: (i, j) => mark(Number(j >= bc) === col ? row : 1 - row, Number(i >= br)) });
    const resultFigure = matrix(AB, { caption: '普通矩阵乘法 AB · 3×3', cut: [ar, bc], mark: (i, j) => Number(i >= ar) === row && Number(j >= bc) === col ? 'active' : '' });
    let calculation = readout(`内维切分不匹配。A 的列切成 ${ac}+${4 - ac}，B 的行切成 ${br}+${4 - br}。把这两组调成一样，再算对应块的乘积。`, true);
    if (match) {
      const p = multiply(left[row][0], right[0][col]);
      const q = multiply(left[row][1], right[1][col]);
      const subscript = ['₁', '₂'];
      const i = subscript[row];
      const j = subscript[col];
      calculation = `${readout(`${resultLabel} = A${i}₁B₁${j} + A${i}₂B₂${j}。绿色是第一项，蓝色是第二项。`)}
        <div class="matrix-set">${matrix(p, { caption: '第一项', mark: () => 'active' })}<span aria-hidden="true">+</span>
          ${matrix(q, { caption: '第二项', mark: () => 'block-secondary' })}<span aria-hidden="true">=</span>
          ${matrix(add(p, q), { caption: resultLabel, mark: () => 'active' })}</div>`;
    }
    return `<div class="panel">${group('A 切行', 0, 3)}${group('A 切列', 1, 4)}${group('B 切行', 2, 4)}${group('B 切列', 3, 3)}</div>
      <div class="matrix-set">${leftFigure}${rightFigure}</div>
      <h4>选一个结果块</h4><div class="lab-actions" role="group" aria-label="选择结果块">${pickers.flatMap((labels, i) => labels.map((label, j) =>
        button(label, `block-${i}-${j}`, i === row && j === col))).join('')}</div>
      ${calculation}<div class="matrix-set">${resultFigure}</div>`;
  }
  activate(panel, render, action => {
    const [kind, index, value] = action.split('-');
    if (kind === 'cut') cuts[Number(index)] = Number(value);
    if (kind === 'block') selected = [Number(index), Number(value)];
  });
}

export const labs = {
  transpose: { title: '行列交换实验', instruction: '点 A 里的任意数字，找它在 Aᵀ 里的新位置。', mount: transposeLab },
  inverse: { title: '平面变换实验', instruction: '切换变换，再拖坐标图里的输入向量。紫色方格是变换前的单位正方形，绿色方格是变换后的形状。', mount: inverseLab },
  cramer: { title: '方程组的交点', instruction: '切换三种情形，观察两条线，再试着替换系数矩阵的一列。', mount: cramerLab },
  blocks: { title: '切开矩阵再相乘', instruction: '改动 A 的列切分，看看 B 的行切分需要怎样跟着改。', mount: blocksLab },
};
