import { grid, line, matrix, point, shape } from './labs.mjs';
import { add, multiply, replaceColumn, split, transform, transpose } from './matrix.mjs';

const motionA = [[1, 2, 3], [4, 5, 6]];
const motionB = [[1, 0], [0, 1], [1, 2]];
const motionProduct = multiply(motionA, motionB);
const motionCramer = [[1, 1], [1, -1]];
const motionConstants = [4, 0];
const motionBlocksA = [[1, 2, 0, 1], [0, 1, 1, 2], [2, 0, 1, 1]];
const motionBlocksB = [[1, 0, 2], [2, 1, 0], [0, 1, 2], [1, 0, 1]];
const motionLeft = split(motionBlocksA, 1, 2);
const motionRight = split(motionBlocksB, 2, 2);
const firstTerm = multiply(motionLeft[0][0], motionRight[0][0]);
const secondTerm = multiply(motionLeft[0][1], motionRight[1][0]);
const motionHasReducedPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

const motionSteps = {
  transpose: [
    ['坐标为什么要对调？', 'A₁₂ = (Aᵀ)₂₁ = 2', '横着数到第 2 个格子，再把原来的第 1 行竖着排成第 1 列。横坐标和纵坐标互换，所以 2 落到第 2 行第 1 列。'],
    ['先找乘积里的 8', '(AB)₁₂ = 1×0 + 2×1 + 3×2 = 8', '左侧取 A 的第 1 行，右侧取 B 的第 2 列。相同内维位置成对相乘，最后相加。'],
    ['转置乘积，移动结果', '[(AB)ᵀ]₂₁ = (AB)₁₂ = 8', '整个乘积只交换行列位置，这个 8 仍然保留，只是搬到了第 2 行第 1 列。'],
    ['从转置后的矩阵直接算', '(BᵀAᵀ)₂₁ = 0×1 + 1×2 + 2×3 = 8', 'B 原来的列变成 Bᵀ 的行，排到左边。A 原来的行变成 Aᵀ 的列，排到右边。每一对都是普通数，交换因子仍得同一个乘积。任取一个格子都适用。'],
  ],
  inverse: [
    ['输入从原位出发', 'v = (1, 2)ᵀ', '紫色是原始正方形与向量 v。剪切把第一坐标加上第二坐标，第二坐标保持原样。'],
    ['让剪切逐渐发生', 'A(x, y) = (x+y, y)', '绿色图形滑向剪切后的形状。竖直高度一直保留，单位正方形面积也仍为 1。已知输出的 y，就知道 x 被加了多少。'],
    ['把操作撤销', 'A⁻¹(u, v) = (u−v, v)', '保持第二坐标，第一坐标减去第二坐标。绿色图形回到紫色原位。对任意向量都能这样恢复，所以 A⁻¹A = I。'],
    ['看见信息丢失的瞬间', 'S(x, y) = (x+y, 0)', '这次第二坐标逐渐消失。v = (1,2) 与 v′ = (2,1) 的第一、第二坐标之和都为 3，最终都落到 (3,0)。只看输出无法决定该回到哪个输入。'],
  ],
  cramer: [
    ['把方程组看作列的线性组合', 'b = x·a₁ + y·a₂', '例如 a₁ = (1,1)ᵀ，a₂ = (1,−1)ᵀ。求解就是找两列各用多少，最后合成常数列 b。'],
    ['让常数列进入第 1 列', 'Dₓ = det(b, a₂)', '要解 x，保留第二列 a₂，把 b 放到原来 a₁ 的位置。二维时这个行列式也可以看作有向面积。'],
    ['拆开，再划掉重列那一项', 'Dₓ = x·det(a₁,a₂) + y·det(a₂,a₂)', '固定第二列时，行列式对第一列是线性的。含 y 的那项有两列相同，有向面积为零，所以只剩 xD。'],
    ['除以 D，得到交点坐标', 'x = Dₓ/D = (−4)/(−2) = 2', 'D ≠ 0 时才可以除。求 y 时把 b 放在第 2 列，同样得到 y = 2。把 (2,2) 代回两条方程可以验算。'],
  ],
  blocks: [
    ['先在共同的内维处切开', 'A 的列切分 = B 的行切分 = 2+2', '这两个矩阵内维都是 4。把每次点乘前两项、后两项分别放在同一组，绿色组和蓝色组各自配对。'],
    ['先收集前两项', 'A₁₁B₁₁ = (5, 2)', '计算结果左上块的第一格时，绿色组给出 1×1 + 2×2 = 5，第二格给出 1×0 + 2×1 = 2。'],
    ['再收集后两项', 'A₁₂B₂₁ = (1, 0)', '蓝色组给第一格加上 0×0 + 1×1 = 1，给第二格加上 0×1 + 1×0 = 0。'],
    ['合并，回到普通点乘', 'C₁₁ = (5, 2) + (1, 0) = (6, 2)', '原来的 4 项乘积一项也没有丢，只是拆成两组加。对每个结果块都这样拆，就得到 Cᵢⱼ = Σₖ AᵢₖBₖⱼ。'],
  ],
};

const sampleMark = (row, col) => (i, j) => i === row && j === col ? 'active' : '';
const motionPair = (...figures) => `<div class="matrix-set">${figures.join('')}</div>`;
const emphasis = (text, variant = '') => `<div class="motion-label ${variant}">${text}</div>`;

function transit(drawing, source, target, text) {
  const token = document.createElement('span');
  token.className = 'motion-token';
  token.setAttribute('aria-hidden', 'true');
  token.textContent = text;
  drawing.append(token);
  return progress => {
    const base = drawing.getBoundingClientRect();
    const start = source.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const fraction = motionHasReducedPreference.matches ? 1 : Math.min(1, progress * 1.3);
    const amount = fraction * fraction * (3 - 2 * fraction);
    const x = start.left + start.width / 2 + (end.left + end.width / 2 - start.left - start.width / 2) * amount - base.left;
    const y = start.top + start.height / 2 + (end.top + end.height / 2 - start.top - start.height / 2) * amount - base.top - 16 * Math.sin(Math.PI * amount);
    token.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    token.style.opacity = fraction > .91 ? '0' : '1';
  };
}

function transposeScene(drawing, step) {
  const at = transpose(motionA);
  const bt = transpose(motionB);
  const scenes = [
    motionPair(matrix(motionA, { caption: 'A · 原矩阵', mark: sampleMark(0, 1) }),
      matrix(at, { caption: 'Aᵀ · 行列交换', mark: sampleMark(1, 0) })),
    motionPair(matrix(motionA, { caption: '取 A 的第 1 行', mark: i => i === 0 ? 'active' : '' }),
      matrix(motionB, { caption: '取 B 的第 2 列', mark: (_, j) => j === 1 ? 'block-secondary' : '' }),
      matrix(motionProduct, { caption: '写到 AB 里', mark: sampleMark(0, 1) })),
    motionPair(matrix(motionProduct, { caption: 'AB · 先算乘积', mark: sampleMark(0, 1) }),
      matrix(transpose(motionProduct), { caption: '(AB)ᵀ · 再转置', mark: sampleMark(1, 0) })),
    motionPair(matrix(bt, { caption: '从 Bᵀ 取行', mark: i => i === 1 ? 'block-secondary' : '' }),
      matrix(at, { caption: '从 Aᵀ 取列', mark: (_, j) => j === 0 ? 'active' : '' }),
      matrix(multiply(bt, at), { caption: '同样得到 8', mark: sampleMark(1, 0) })),
  ];
  drawing.innerHTML = scenes[step];
  const cells = drawing.querySelectorAll('td.active');
  if (step === 0 || step === 2) return transit(drawing, cells[0], cells[1], step === 0 ? '2' : '8');
}

function inverseScene(drawing, step) {
  drawing.innerHTML = '<canvas class="plot" width="660" height="496" role="img" aria-label="剪切、逆变换和压缩的过程"></canvas>';
  const plot = drawing.querySelector('canvas');
  const unitSquare = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const input = [1, 2];
  return progress => {
    const time = motionHasReducedPreference.matches ? 1 : Math.min(1, progress * 1.3);
    const t = time * time * (3 - 2 * time);
    const shear = step === 1 ? t : step === 2 ? 1 - t : step === 3 ? t : 0;
    const map = [[1, shear], [0, step === 3 ? 1 - t : 1]];
    const ctx = grid(plot);
    shape(ctx, unitSquare, '#7048e828', '#9475d9');
    shape(ctx, unitSquare.map(vertex => transform(map, vertex)), '#69c6a15a', '#2e8866');
    point(ctx, input, 'v', '#5e39b4', [8, -9]);
    const output = transform(map, input);
    line(ctx, [0, 0], output, '#18865a', 2);
    point(ctx, output, step ? '输出' : '', '#146143', [8, 15]);
    if (step === 3) {
      const other = [2, 1];
      point(ctx, other, 'v′', '#875922', [6, -9]);
      const second = transform(map, other);
      line(ctx, [0, 0], second, '#875922', 2, true);
      if (t < .96) point(ctx, second, '另一输出', '#875922', [8, 15]);
    }
  };
}

function cramerScene(drawing, step) {
  const markedColumn = (_, j) => j === 0 ? 'active' : '';
  if (step === 1) {
    drawing.innerHTML = motionPair(matrix(motionConstants.map(value => [value]), { caption: '常数列 b', mark: () => 'active' }),
      matrix(motionCramer, { caption: '原系数 A' }),
      matrix(replaceColumn(motionCramer, 0, motionConstants), { caption: '替换第 1 列', mark: markedColumn }));
    const cells = drawing.querySelectorAll('td.active');
    const upper = transit(drawing, cells[0], cells[2], '4');
    const lower = transit(drawing, cells[1], cells[3], '0');
    return time => { upper(time); lower(time); };
  }
  if (step === 2) {
    drawing.innerHTML = motionPair(matrix(motionCramer, { caption: 'x · det(a₁, a₂)' }),
      matrix(replaceColumn(motionCramer, 0, [1, -1]), { caption: 'y · det(a₂, a₂) = 0', mark: () => 'block-secondary' }));
    return time => drawing.classList.toggle('motion-eliminated', time > .55 || motionHasReducedPreference.matches);
  }
  drawing.innerHTML = step === 0
    ? motionPair(matrix(motionCramer, { caption: 'a₁ 与 a₂', mark: (_, j) => j === 0 ? 'active' : 'block-secondary' }),
      matrix(motionConstants.map(value => [value]), { caption: '合成目标 b' }))
    : emphasis('两条直线的公共解是 (2, 2)。');
}

function blockScene(drawing, step) {
  const display = [
    motionPair(matrix(motionBlocksA, { caption: 'A · 切第 2 列', cut: [1, 2], mark: (i, j) => i === 0 ? (j < 2 ? 'active' : 'block-secondary') : '' }),
      matrix(motionBlocksB, { caption: 'B · 切第 2 行', cut: [2, 2], mark: (i, j) => j < 2 ? (i < 2 ? 'active' : 'block-secondary') : '' })),
    motionPair(matrix(motionLeft[0][0], { caption: 'A₁₁', mark: () => 'active' }), matrix(motionRight[0][0], { caption: 'B₁₁', mark: () => 'active' }),
      matrix(firstTerm, { caption: '第一组贡献', mark: () => 'active' })),
    motionPair(matrix(motionLeft[0][1], { caption: 'A₁₂', mark: () => 'block-secondary' }), matrix(motionRight[1][0], { caption: 'B₂₁', mark: () => 'block-secondary' }),
      matrix(secondTerm, { caption: '第二组贡献', mark: () => 'block-secondary' })),
    motionPair(matrix(firstTerm, { caption: '第一组', mark: () => 'active' }), matrix(secondTerm, { caption: '第二组', mark: () => 'block-secondary' }),
      matrix(add(firstTerm, secondTerm), { caption: '累加得到 C₁₁', mark: () => 'active' })),
  ];
  drawing.innerHTML = display[step];
  const result = drawing.querySelector('figure:last-child');
  return time => {
    if (step && !motionHasReducedPreference.matches) {
      result.style.opacity = String(.48 + .52 * time);
      result.style.transform = `translateY(${(1 - time) * 6}px)`;
    }
  };
}

const renderScenes = { transpose: transposeScene, inverse: inverseScene, cramer: cramerScene, blocks: blockScene };

export function mountMotion(container, id) {
  const steps = motionSteps[id];
  const stepTime = 4100;
  const duration = stepTime * steps.length;
  container.innerHTML = `<h3 id="motion-title">动画推导</h3>
    <div class="motion-toolbar">
      <button type="button" class="primary motion-play">播放推导</button>
      <button type="button" class="secondary motion-back">上一步</button>
      <button type="button" class="secondary motion-next">下一步</button>
    </div>
    <div class="motion-track">
      <label for="motion-position">推导进度</label>
      <input id="motion-position" type="range" min="0" max="${duration}" step="1" value="0">
      <span class="motion-index"></span>
    </div>
    <div class="motion-drawing"></div>
    <div class="motion-explanation" aria-live="polite" aria-atomic="true">
      <h4 class="motion-heading"></h4><p class="motion-formula"></p><p class="motion-description"></p>
    </div>`;

  const drawing = container.querySelector('.motion-drawing');
  const slider = container.querySelector('input');
  const play = container.querySelector('.motion-play');
  const back = container.querySelector('.motion-back');
  const next = container.querySelector('.motion-next');
  let shown = -1;
  let time = 0;
  let last = 0;
  let request = 0;
  let paint;

  function render() {
    const index = Math.min(steps.length - 1, Math.floor(time / stepTime));
    slider.value = time;
    if (index !== shown) {
      shown = index;
      const [heading, expression, description] = steps[index];
      container.querySelector('.motion-heading').textContent = heading;
      container.querySelector('.motion-formula').textContent = expression;
      container.querySelector('.motion-description').textContent = description;
      container.querySelector('.motion-index').textContent = `${index + 1} / ${steps.length}`;
      slider.setAttribute('aria-valuetext', `第 ${index + 1} 步，${heading}`);
      drawing.classList.remove('motion-eliminated');
      paint = renderScenes[id](drawing, index);
      back.disabled = index === 0;
      next.disabled = index === steps.length - 1;
    }
    paint?.((time - index * stepTime) / stepTime);
  }

  function stop() {
    if (request) cancelAnimationFrame(request);
    request = 0;
    last = 0;
    play.textContent = time >= duration ? '重新播放' : '播放推导';
  }

  function tick(now) {
    if (last) time = Math.min(duration, time + now - last);
    last = now;
    render();
    if (time < duration) request = requestAnimationFrame(tick);
    else stop();
  }

  play.addEventListener('click', () => {
    if (request) { stop(); return; }
    if (time >= duration) time = 0;
    play.textContent = '暂停推导';
    request = requestAnimationFrame(tick);
  });
  function seek(value) {
    stop();
    time = value;
    render();
    stop();
  }
  function seekStep(index) {
    seek(index === steps.length - 1 ? duration : (index + 1) * stepTime - 1);
  }
  back.addEventListener('click', () => seekStep(shown - 1));
  next.addEventListener('click', () => seekStep(shown + 1));
  slider.addEventListener('input', () => seek(Number(slider.value)));
  slider.addEventListener('keydown', event => {
    const offset = { ArrowLeft: -500, ArrowDown: -500, ArrowRight: 500, ArrowUp: 500 }[event.key];
    if (!offset) return;
    event.preventDefault();
    seek(Math.max(0, Math.min(duration, time + offset)));
  });
  render();
  return stop;
}
