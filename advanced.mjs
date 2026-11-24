const extensions = {
  transpose: {
    title: '为什么 AᵀA 会记录列之间的关系？',
    paragraphs: [
      '把 A 的列写成 a₁、a₂。AᵀA 的第 i 行第 j 列就是内积 aᵢᵀaⱼ。对角线给出列向量长度的平方，其他位置描述列之间的对齐程度。',
      '举例，A 的两列是 (1, 2)ᵀ 和 (2, 0)ᵀ。两列的长度平方分别是 5 和 4，内积是 2，因此 AᵀA 的两行是 (5, 2) 和 (2, 4)。这叫格拉姆矩阵。',
      '沿任意向量 x 计算二次型，xᵀ(AᵀA)x = (Ax)ᵀ(Ax) = ‖Ax‖² ≥ 0。所以 AᵀA 总是半正定。其零方向恰好是被 A 送到零的方向，这个结论会在最小二乘法里再次出现。',
    ],
    question: '若两列变成 (1, 2)ᵀ 和 (2, 4)ᵀ，哪一个非零向量会被 AᵀA 送到零？',
    options: ['(1, 1)ᵀ', '(−2, 1)ᵀ', '(2, 1)ᵀ'],
    answer: 1,
    hint: '先在 A 里找一个线性组合，使两列恰好抵消。',
    solution: '第二列是第一列的 2 倍。取 x = (−2, 1)ᵀ 得 Ax = 0，因而 AᵀAx = 0。反过来，AᵀAx = 0 也会推出 ‖Ax‖² = 0。',
  },
  inverse: {
    title: '能求逆，为什么还可能不稳定？',
    paragraphs: [
      '考虑两行分别为 (1, 1)、(0, t) 的 Aₜ。它把 (x, y) 送到 (x+y, ty)。当 t 趋近 0 时，上下方向被挤得很薄。t = 0 时平面压成直线，信息彻底丢失。',
      '当 t ≠ 0，给定输出 (u, v)，逆运算先求 y = v/t，再求 x = u−v/t。如果输出的 v 多了误差 ε，恢复的 y 就多了 ε/t，x 则少了 ε/t。',
      '这解释了本例中「存在逆」与「求逆后误差大小」之间的区别。更一般地，判断数值敏感性时会使用条件数。这里只需看清误差是怎样被逆变换放大的。',
    ],
    question: '当 t = 0.01，输出的第二个坐标误差为 +0.001，恢复出来的 y 会多多少？',
    options: ['0.00001', '0.001', '0.1'],
    answer: 2,
    hint: '把观测误差从输出坐标带回 y = v/t。',
    solution: '增量为 0.001/0.01 = 0.1。同一次误差会让 x 减少 0.1。',
  },
  cramer: {
    title: 'D 和所有 Dⱼ 都为零，为什么还可能无解？',
    paragraphs: [
      '看一个三元系统。系数矩阵 A 的三行是 (1, 0, 0)、(0, 0, 0)、(0, 0, 0)，常数列 b = (0, 1, 0)ᵀ。第二条方程是 0 = 1，已经足以判定无解。',
      'D = 0。无论替换哪一列，第三行都保持为零，因此 D₁ = D₂ = D₃ = 0。这里所有比值的分子都是零，却仍然没有解。',
      '几何上，A 的列只能张成第一坐标轴。b 在轴外，无法写成这些列的线性组合。学到秩以后，可以用 rank(A) 与 rank([A|b]) 的比较处理这种情形。',
    ],
    question: '保持 A 不变，把 b 改为 (2, 0, 0)ᵀ。方程组现在怎样？',
    options: ['无解', '有唯一解', '有无穷多解'],
    answer: 2,
    hint: '只有第一条方程约束了某个未知数。',
    solution: '第一条方程固定 x₁ = 2，另外两条都是 0 = 0。x₂、x₃ 可任意取值。两组例子的 D 和所有 Dⱼ 都相同，但解的情况不同。',
  },
  blocks: {
    title: '舒尔补：把消元做在整个块上',
    paragraphs: [
      '对于分块方程 Ax + By = f、Cx + Dy = g，若左上块 A 可逆，先从第一式解出 x = A⁻¹f − A⁻¹By。',
      '把 x 代入第二式，得到 (D − CA⁻¹B)y = g − CA⁻¹f。括号里的 S = D − CA⁻¹B 叫舒尔补。先解关于 y 的较小方程，再回代求 x。',
      '例中 A = diag(2,1)，B = (2,1)ᵀ，C = (1,3)，D = 5。A⁻¹B = (1,1)ᵀ，CA⁻¹B = 4，所以 S = 1。若 f = (4,1)ᵀ、g = 9，右端为 9−5 = 4，故 y = 4，回代得 x = (−2,−3)ᵀ。',
    ],
    question: '只把 D 改成 4，其他条件保持。消元后的方程和解的情况是什么？',
    options: ['0y = 4，无解', '0y = 0，无穷多解', '4y = 4，有唯一解'],
    answer: 0,
    hint: '这个改动只会改变 S，右端仍是 4。',
    solution: 'S = 4−4 = 0，右端 g − CA⁻¹f = 4，得到 0y = 4。整个原方程组无解。',
  },
};

export function mountExtension(container, id) {
  const lesson = extensions[id];
  container.innerHTML = `<details class="extension">
    <summary><span>进阶拓展</span><strong>${lesson.title}</strong></summary>
    <div class="extension-body">
      ${lesson.paragraphs.map(text => `<p>${text}</p>`).join('')}
      <fieldset>
        <legend>进阶挑战</legend>
        <p class="question-text">${lesson.question}</p>
        <div class="answer-options">${lesson.options.map((option, index) =>
          `<label class="choice"><input type="radio" name="extension-answer" value="${index}">${option}</label>`).join('')}</div>
        <div class="lab-actions"><button class="secondary" type="button">检查进阶答案</button></div>
        <p class="extension-feedback" role="status"></p>
        <details><summary>看进阶提示</summary><p>${lesson.hint}</p></details>
        <details class="extension-solution" hidden><summary>展开进阶解答</summary><p>${lesson.solution}</p></details>
      </fieldset>
    </div>
  </details>`;
  container.querySelector('button').addEventListener('click', () => {
    const selected = container.querySelector('input:checked');
    const feedback = container.querySelector('.extension-feedback');
    const correct = selected?.value === String(lesson.answer);
    feedback.classList.toggle('correct', correct);
    feedback.textContent = !selected ? '先选一项。' : correct ? '正确。可以展开验算过程。' : '再想一步。可以先看提示。';
    if (selected) container.querySelector('.extension-solution').hidden = false;
  });
}
