import { matrix, grid, line, point } from './labs.mjs';
import { determinant, fraction } from './matrix.mjs';

export const chapter3Start = [[0, 2, 4], [2, 2, 6]];

const chapter3RowActions = {
  swap: { type: 'swap', target: 0, source: 1, label: '交换两行' },
  half1: { type: 'scale', target: 0, factor: .5, label: '第 1 行乘 1/2' },
  half2: { type: 'scale', target: 1, factor: .5, label: '第 2 行乘 1/2' },
  add: { type: 'add', target: 1, source: 0, factor: 1, label: '第 2 行加第 1 行' },
  subtract: { type: 'add', target: 0, source: 1, factor: -1, label: '第 1 行减第 2 行' },
};

export function applyElementaryRow(matrixValues, { type, target, source, factor }) {
  if (type === 'swap') return matrixValues.map((row, i) =>
    i === target ? matrixValues[source].slice() : i === source ? matrixValues[target].slice() : row.slice());
  return matrixValues.map((row, i) => i !== target
    ? row.slice()
    : row.map((value, j) => type === 'scale' ? value * factor : value + factor * matrixValues[source][j]));
}

const chapter3Button = (label, value, pressed) => `<button type="button" class="chip" data-chapter-action="${value}"${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}>${label}</button>`;
const chapter3Plot = label => `<canvas class="plot" width="660" height="496" role="img" aria-label="${label}"></canvas>`;
const chapter3Matrices = (...figures) => `<div class="matrix-set">${figures.join('')}</div>`;
const rowHighlight = row => i => i === row ? 'active' : '';
// Every available scaling is by 1/2 and the workbench allows at most 24 steps.
const workbenchDenominator = 2 ** 24;
const workbenchNumber = value => Number.isInteger(value) ? value
  : fraction(Math.round(value * workbenchDenominator), workbenchDenominator);

function labRowOperations(panel) {
  panel.innerHTML = `<div class="chapter3-board"></div>
    <div class="lab-actions" role="group" aria-label="初等行操作">${Object.entries(chapter3RowActions)
      .map(([value, action]) => chapter3Button(action.label, value)).join('')}</div>
    <div class="lab-actions">${chapter3Button('撤销一步', 'undo')}${chapter3Button('重置矩阵', 'reset')}</div>
    <p class="readout" role="status"></p>`;
  const history = [{ matrix: chapter3Start }];
  const board = panel.querySelector('.chapter3-board');
  const status = panel.querySelector('.readout');
  const undo = panel.querySelector('[data-chapter-action="undo"]');
  const controls = [...panel.querySelectorAll('[data-chapter-action]')].filter(item => item.dataset.chapterAction in chapter3RowActions);
  function render() {
    const state = history.at(-1);
    const values = state.matrix;
    const solved = values[0][0] === 1 && values[0][1] === 0 && values[1][0] === 0 && values[1][1] === 1;
    const mark = state.action?.type === 'swap' ? () => 'active' : rowHighlight(state.action?.target);
    board.innerHTML = chapter3Matrices(matrix(values.map(row => row.map(workbenchNumber)), { caption: '增广矩阵 [A|b]', cut: [0, 2], mark }));
    const description = state.action ? state.action.label + '。' : '先把带 x 的一行换到上面，再把非零系数化成 1。';
    status.textContent = solved ? `化简完成。x = ${values[0][2]}，y = ${values[1][2]}。`
      : description + (history.length === 25 ? '已做 24 步，可以撤销或重置。' : '');
    undo.disabled = history.length === 1;
    controls.forEach(item => { item.disabled = history.length === 25; });
  }
  panel.addEventListener('click', event => {
    const kind = event.target.closest('[data-chapter-action]')?.dataset.chapterAction;
    if (kind === 'undo' && history.length > 1) history.pop();
    else if (kind === 'reset') history.splice(1);
    else if (chapter3RowActions[kind] && history.length < 25) {
      const action = chapter3RowActions[kind];
      history.push({ action, matrix: applyElementaryRow(history.at(-1).matrix, action) });
    } else return;
    render();
  });
  render();
}

export function rankModel(t) {
  const sample = [[1, 2, 1], [2, 4, t], [0, 0, 0]];
  const reduced = applyElementaryRow(sample, { type: 'add', target: 1, source: 0, factor: -2 });
  return { sample, reduced, rank: reduced[1][2] === 0 ? 1 : 2 };
}

function drawRankVectors(plot, t) {
  const ctx = grid(plot);
  line(ctx, [0, 0], [2, 4], '#7046c7', 2);
  point(ctx, [2, 4], 'a₂', '#7046c7');
  point(ctx, [1, 2], 'a₁', '#7046c7', [9, 16]);
  line(ctx, [0, 0], [1, t], '#168153', 3, true);
  point(ctx, [1, t], 'a₃', '#156044', [8, -10]);
}

function labRank(panel) {
  panel.innerHTML = `<div class="chapter3-slider">
    <label>调整常数 t <output>1</output><input type="range" min="-1" max="3" step="1" value="1"></label></div>
    ${chapter3Plot('三列向量在平面上的方向')}
    <div class="legend"><b>实线 · a₁ 和 a₂</b><b>虚线 · a₃</b></div>
    <div class="lab-actions" role="group" aria-label="选择二阶子式">
      ${chapter3Button('第 1、2 列', 1, true)}${chapter3Button('第 1、3 列', 2, false)}
    </div>
    <div class="chapter3-board"></div><p class="readout" role="status"></p>`;
  const slider = panel.querySelector('input');
  const plot = panel.querySelector('canvas');
  let column = 1;
  function render() {
    const t = Number(slider.value);
    const { sample, reduced, rank } = rankModel(t);
    const minor = determinant(sample.slice(0, 2).map(row => [row[0], row[column]]));
    const mark = (i, j) => i < 2 && (j === 0 || j === column) ? 'active' : '';
    panel.querySelector('output').value = t;
    plot.setAttribute('aria-label', `t 等于 ${t}，三列${rank === 1 ? '共线' : '含两个独立方向'}。`);
    drawRankVectors(plot, t);
    panel.querySelector('.chapter3-board').innerHTML = chapter3Matrices(
      matrix(sample, { caption: '在前两行取子式', mark }),
      matrix(reduced, { caption: 'R₂ ← R₂ − 2R₁', mark: (i, j) => i === 0 && j === 0 || rank === 2 && i === 1 && j === 2 ? 'active' : '' }),
    );
    panel.querySelector('.readout').textContent = `所选二阶子式 = ${minor}。阶梯形有 ${rank} 个主元，秩为 ${rank}。${minor === 0 && rank === 2 ? '试试另一对子列，看看能否得到非零子式。' : ''}`;
  }
  slider.addEventListener('input', render);
  panel.addEventListener('click', event => {
    const target = event.target.closest('[data-chapter-action]');
    if (!target) return;
    column = Number(target.dataset.chapterAction);
    panel.querySelectorAll('[data-chapter-action]').forEach(item => item.setAttribute('aria-pressed', item === target));
    render();
  });
  render();
}

const chapter3Systems = [
  { label: '唯一解', a: 1, b: 4 },
  { label: '无穷多解', a: 2, b: 6 },
  { label: '无解', a: 2, b: 5 },
];

export function systemModel(index, homogeneous = false) {
  const { a, b } = chapter3Systems[index];
  const matrixValues = [[1, 1, homogeneous ? 0 : 3], [2, a, homogeneous ? 0 : b]];
  const reduced = applyElementaryRow(matrixValues, { type: 'add', target: 1, source: 0, factor: -2 });
  const [, coefficient, constant] = reduced[1];
  const rankA = coefficient ? 2 : 1;
  const rankAugmented = coefficient || constant ? 2 : 1;
  const classification = coefficient ? '唯一解' : constant ? '无解' : '无穷多解';
  const y = coefficient ? constant / coefficient : null;
  return { matrixValues, reduced, rankA, rankAugmented, classification, solution: y === null ? null : [matrixValues[0][2] - y, y] };
}

function drawSolutionLines(plot, model, freeValue) {
  const ctx = grid(plot);
  const [[, , first], [, coefficient, second]] = model.matrixValues;
  line(ctx, [-8, first + 8], [8, first - 8], '#6b3fc1', 2.6);
  line(ctx, [-8, (second + 16) / coefficient], [8, (second - 16) / coefficient], '#168153', 2.6, true);
  const solution = model.solution ?? (model.classification === '无穷多解' ? [first - freeValue, freeValue] : null);
  if (solution) point(ctx, solution, `(${solution.join(', ')})`, '#382556', [9, -11]);
}

function labSystems(panel) {
  panel.innerHTML = `<div class="lab-actions" role="group" aria-label="选择系数与常数">
      ${chapter3Systems.map(({ label }, i) => chapter3Button(label, i, i === 0)).join('')}
    </div>
    <label class="chapter3-toggle"><input type="checkbox"> 把常数改成 0（齐次）</label>
    ${chapter3Plot('两条直线和可能的解')}
    <div class="legend"><b>实线 · 第一条方程</b><b>虚线 · 第二条方程</b></div>
    <div class="chapter3-slider free-parameter" hidden>
      <label>自由变量 y <output>0</output><input type="range" min="-1" max="4" step="1" value="0"></label>
    </div>
    <div class="chapter3-board"></div><p class="readout" role="status"></p>`;
  let scenario = 0;
  const homogeneous = panel.querySelector('input[type="checkbox"]');
  const slider = panel.querySelector('input[type="range"]');
  const plot = panel.querySelector('canvas');
  function render() {
    const model = systemModel(scenario, homogeneous.checked);
    const { matrixValues, reduced, rankA, rankAugmented, classification, solution } = model;
    const constant = matrixValues[0][2];
    const free = Number(slider.value);
    const many = classification === '无穷多解';
    const none = classification === '无解';
    panel.querySelector('.free-parameter').hidden = !many;
    panel.querySelector('output').value = free;
    const description = many ? `令 y = ${free}，得到一个解 (${constant - free}, ${free})。沿重合的直线拖动，可以得到其他解。`
      : none ? `第二行给出 0 = ${reduced[1][2]}，两条直线平行。`
      : `两条直线交于 (${solution.join(', ')})。`;
    plot.setAttribute('aria-label', description);
    drawSolutionLines(plot, model, free);
    panel.querySelector('.chapter3-board').innerHTML = chapter3Matrices(
      matrix(matrixValues, { caption: '原增广矩阵', cut: [0, 2] }),
      matrix(reduced, { caption: 'R₂ ← R₂ − 2R₁', cut: [0, 2], mark: (i, j) => i === 1 && (none ? j === 2 : j === 1) ? 'active' : '' }),
    );
    const status = panel.querySelector('.readout');
    status.classList.toggle('is-warning', none);
    status.textContent = `r(A) = ${rankA}，r([A|b]) = ${rankAugmented}。${classification}。${description}`;
  }
  panel.addEventListener('input', render);
  panel.addEventListener('click', event => {
    const target = event.target.closest('[data-chapter-action]');
    if (!target) return;
    scenario = Number(target.dataset.chapterAction);
    panel.querySelectorAll('[data-chapter-action]').forEach(item => item.setAttribute('aria-pressed', item === target));
    render();
  });
  render();
}

export const chapter3Labs = {
  'row-operations': { title: '行变换工作台', instruction: '先交换两行，分别把两行乘 1/2，再让第 1 行减去第 2 行。每一步都能撤销。也可以试其他顺序。', mount: labRowOperations },
  rank: { title: '拖动 t，寻找消失的主元', instruction: '调到 t = 2 前后，看看第三列的方向和第二个主元。切换子式，比较两种判秩方法。', mount: labRank },
  'linear-systems': { title: '三种解的情形', instruction: '先观察非齐次情形，再勾选齐次。出现重合的直线时，拖动参数 y，在图上取不同的解。', mount: labSystems },
};

export const chapter3MotionSteps = {
  'row-operations': [
    ['把能消元的一行换到上面', 'R₁ ↔ R₂', '第一列在原第一行是 0。用第二行换到前面，就得到非零主元。两条等式只是换了顺序。'],
    ['把主元化成 1', 'R₁ ← R₁/2，R₂ ← R₂/2', '两条方程都除以 2。每行的两项系数和常数都一起除，得到 x+y=3 与 y=2。'],
    ['消去第一行里的 y', 'R₁ ← R₁ − R₂', '用第一条等式减去第二条。左边剩 x，右边是 3−2，原来的 y=2 仍然保留。'],
    ['从最简形读解，并代回去', 'x = 1，y = 2', '原方程为 2y=4、2x+2y=6。代入得到 4=4、6=6，说明每一步都保住了原方程组的解。'],
  ],
  rank: [
    ['找一个确定存在的主元', 'a₁ = (1,2,0)ᵀ ≠ 0', '矩阵中有非零元素，所以至少存在一个非零一阶子式。前两列 a₁、a₂ 共线，只提供一个方向。'],
    ['第二行减去第一行的 2 倍', 'R₂ = (0,0,t−2)', '前两列的第二行都被抵消。能否找到第二个主元，只取决于 t−2。'],
    ['让第二个方向慢慢重合', 't → 2 时，第三列转向 a₁', '在 t 到达 2 前，第三列提供第二个方向。到达 2 的一刻，三列共线，t−2 为零，秩从 2 变为 1。'],
    ['用子式复核', '取前两行与第 1、3 列，二阶子式为 t−2', '同一个 t−2 也出现在二阶子式。第三行恒为零，三阶子式恒为零。当 t≠2 时最高非零阶数是 2，当 t=2 时是 1。'],
  ],
  'linear-systems': [
    ['把两个方程写到一起', 'x+y=3，2x+ay=b', '用一条紫色实线表示第一式，一条绿色虚线表示第二式。解是同时在两条线上的点。'],
    ['只做一次行倍加', 'R₂ ← R₂ − 2R₁，得到 (a−2)y=b−6', '第二式里 x 被消掉。接下来只看 y 的新系数与右端，三种解的情形都由它们决定。'],
    ['系数消失时检查右端', 'a=2、b=5：0y=−1', '这条方程对任何 y 都不成立。增广矩阵的常数列多一个主元，图上两条直线彼此平行。'],
    ['系数与右端同时消失', 'a=2、b=6：令 y=t，x=3−t', '第二个方程与第一式等价。两条直线重合，方程只约束一个方向。拖动进度，可以看到自由变量让解沿直线移动。'],
  ],
};

function paintNewRow(drawing, before, after, row) {
  drawing.innerHTML = chapter3Matrices(
    matrix(before, { caption: '操作前', cut: [0, 2], mark: rowHighlight(row) }),
    matrix(after, { caption: '操作后', cut: [0, 2], mark: rowHighlight(row) }),
  );
  const changed = drawing.querySelector('figure:last-child');
  return time => { changed.style.opacity = String(.42 + .58 * time); };
}

const swappedRows = applyElementaryRow(chapter3Start, chapter3RowActions.swap);
const scaledRows = applyElementaryRow(applyElementaryRow(swappedRows, chapter3RowActions.half1), chapter3RowActions.half2);
const solvedRows = applyElementaryRow(scaledRows, chapter3RowActions.subtract);

export const chapter3MotionScenes = {
  'row-operations': (drawing, step, move) => {
    const snapshots = [chapter3Start, swappedRows, scaledRows, solvedRows, solvedRows];
    const fade = paintNewRow(drawing, snapshots[step], snapshots[step + 1], step === 3 ? undefined : 0);
    if (step !== 0) return fade;
    const rows = drawing.querySelectorAll('tr');
    const first = move(drawing, rows[0], rows[3], '0  2 | 4', true);
    const second = move(drawing, rows[1], rows[2], '2  2 | 6', true);
    return time => {
      first(time);
      second(Math.max(0, (time - .12) / .88));
      fade(time);
    };
  },
  rank: (drawing, step) => {
    if (step === 0 || step === 2) {
      drawing.innerHTML = chapter3Plot('第三列的方向随 t 改变');
      const plot = drawing.querySelector('canvas');
      return time => drawRankVectors(plot, step === 0 ? 1 : 1 + time);
    }
    const { sample, reduced } = rankModel(step === 1 ? 1 : 2);
    return paintNewRow(drawing, sample, reduced, 1);
  },
  'linear-systems': (drawing, step) => {
    const model = systemModel([0, 0, 2, 1][step]);
    if (step === 1 || step === 2) return paintNewRow(drawing, model.matrixValues, model.reduced, 1);
    drawing.innerHTML = chapter3Plot('交点或沿重合直线移动的解');
    const plot = drawing.querySelector('canvas');
    return time => drawSolutionLines(plot, model, Math.round(time * 16) / 4 - 1);
  },
};
