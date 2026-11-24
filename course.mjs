import { labs } from './labs.mjs';
import { lessons } from './lessons.mjs';
import { equalsAnswer } from './matrix.mjs';
import { mountMotion } from './motion.mjs';
import { mountExtension } from './advanced.mjs';

const storageKey = 'gods-matrix-lab-chapter2-v1';
const article = document.querySelector('#lesson');
const mobileMenu = document.querySelector('#mobile-nav');
const lessonById = new Map(lessons.map(lesson => [lesson.id, lesson]));
const state = readState();
let active;
let stopMotion;

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && lessons.some(lesson => lesson.id === saved.current) && saved.practice) return saved;
  } catch {}
  return { current: lessons[0].id, practice: {} };
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    document.querySelectorAll('.sidebar-note').forEach(note => {
      note.textContent = '当前浏览器无法保存进度。';
    });
  }
}

function updateNavigation() {
  const done = lessons.filter(lesson => state.practice[lesson.id]?.passed).length;
  document.querySelector('#progress-label').textContent = `${done} / ${lessons.length}`;
  document.querySelector('#mobile-progress').textContent = `${done} / ${lessons.length} 完成`;
  document.querySelector('#course-progress').value = done;
  document.querySelector('#resume-label').textContent = `当前单元 · ${active.title}`;
  document.querySelectorAll('#desktop-nav, #mobile-nav-links').forEach(nav => {
    if (!nav.childElementCount) {
      nav.innerHTML = lessons.map(({ id, section, title }) => `
        <a class="nav-link" href="#${id}" data-lesson="${id}">
          <span class="nav-number">${section}</span><span>${title}</span><span class="nav-done" aria-hidden="true"></span>
        </a>`).join('');
    }
    nav.querySelectorAll('[data-lesson]').forEach(link => {
      const id = link.dataset.lesson;
      const passed = Boolean(state.practice[id]?.passed);
      link.setAttribute('aria-current', id === active.id ? 'page' : 'false');
      link.setAttribute('aria-label', lessonById.get(id).title + (passed ? '，练习已完成' : ''));
      link.querySelector('.nav-done').textContent = passed ? '✓' : '';
    });
  });
}

function practiceMarkup(lesson) {
  const isReview = lesson.id === 'review';
  return `<section class="practice" aria-labelledby="practice-title">
    <h3 id="practice-title">${isReview ? '独立作答' : '动手测一下'}</h3>
    <p class="question-text">数字题可填整数、小数或分数，例如 −1、0.5、1/2。</p>
    <form novalidate autocomplete="off">
      ${lesson.questions.map((question, index) => {
        const name = `q-${index}`;
        const inputs = question.options
          ? `<div class="answer-options">${question.options.map((option, i) => `<label class="choice"><input type="radio" name="${name}" value="${i}" aria-describedby="${name}-feedback">${option}</label>`).join('')}</div>`
          : `<div class="answer-grid" style="--columns: ${question.shape[1]}">${question.answer.map((_, i) => `
              <label>${question.shape[0] > 1 ? `第 ${Math.floor(i / question.shape[1]) + 1} 行第 ${i % question.shape[1] + 1} 列` : `第 ${i + 1} 项`}
                <input type="text" name="${name}" maxlength="32" autocapitalize="off" spellcheck="false" aria-describedby="${name}-feedback">
              </label>`).join('')}</div>`;
        return `<fieldset data-question="${index}">
          <legend>${isReview ? (index + 1) + ' · ' : ''}${question.title}</legend>
          <p class="question-text">${question.prompt}</p>${inputs}
          <p class="question-feedback" id="${name}-feedback"></p>
          <details class="question-details"><summary>看提示</summary><p>${question.hint}</p></details>
          <details class="question-details solution" hidden><summary>展开解法</summary><p>${question.solution}</p></details>
        </fieldset>`;
      }).join('')}
      <button type="submit" class="primary">${isReview ? '提交综合练习' : '检查答案'}</button>
      <p class="grade-result" role="status"></p>
    </form>
  </section>`;
}

function setupPractice(lesson) {
  const form = article.querySelector('form');
  const record = state.practice[lesson.id];
  const groups = [...form.querySelectorAll('[data-question]')];
  const result = form.querySelector('.grade-result');
  const inputs = group => [...group.querySelectorAll('input')];
  const readAnswers = () => groups.map((group, i) => lesson.questions[i].options
    ? group.querySelector('input:checked')?.value ?? ''
    : inputs(group).map(input => input.value));

  function grade(answers, draft) {
    const scores = groups.map((group, i) => {
      const question = lesson.questions[i];
      const submission = answers[i];
      const pending = JSON.stringify(draft[i]) !== JSON.stringify(submission);
      const feedback = group.querySelector('.question-feedback');
      group.querySelector('.solution').hidden = false;
      const inputSet = inputs(group);
      if (pending) {
        feedback.textContent = '';
        inputSet.forEach(input => input.removeAttribute('aria-invalid'));
        return null;
      }
      let correct;
      let complete;
      if (question.options) {
        complete = submission !== '';
        correct = submission === String(question.answer);
        inputSet.forEach(input => input.setAttribute('aria-invalid', !correct));
      } else {
        const checks = question.answer.map((expected, j) => equalsAnswer(submission[j] ?? '', expected));
        complete = question.answer.every((_, j) => Boolean(submission[j]?.trim()));
        correct = checks.every(Boolean);
        inputSet.forEach((input, j) => input.setAttribute('aria-invalid', !checks[j]));
      }
      feedback.textContent = correct ? '正确' : complete ? '再试一次。可以先看提示。' : '还有空项。填完后再检查。';
      feedback.classList.toggle('correct', correct);
      return correct;
    });
    if (scores.includes(null)) {
      result.textContent = '答案已修改，提交后更新结果。';
      return false;
    }
    const correct = scores.filter(Boolean).length;
    const passed = correct === scores.length;
    result.textContent = passed ? '全部正确。已记录本单元完成。' : `答对 ${correct} / ${scores.length} 题。修改后可以重新提交。`;
    return passed;
  }

  if (record?.draft) {
    groups.forEach((group, i) => {
      const answer = record.draft[i];
      if (lesson.questions[i].options) inputs(group).forEach(input => { input.checked = input.value === answer; });
      else inputs(group).forEach((input, j) => { input.value = answer?.[j] ?? ''; });
    });
    if (record.submission) grade(record.submission, readAnswers());
  }
  form.addEventListener('input', () => {
    const previous = state.practice[lesson.id];
    const draft = readAnswers();
    state.practice[lesson.id] = { ...previous, draft };
    if (previous?.submission) grade(previous.submission, draft);
    saveState();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const draft = readAnswers();
    const passed = grade(draft, draft);
    state.practice[lesson.id] = { draft, submission: draft, passed: passed || Boolean(state.practice[lesson.id]?.passed) };
    saveState();
    updateNavigation();
  });
}

function openLesson(id, focus = false) {
  const lesson = lessonById.get(id);
  if (!lesson) return;
  if (active !== lesson) {
    stopMotion?.();
    stopMotion = undefined;
    active = lesson;
    state.current = id;
    const lab = labs[id];
    const index = lessons.indexOf(lesson);
    const previous = lessons[index - 1];
    const next = lessons[index + 1];
    article.innerHTML = `<p class="eyebrow">${id === 'review' ? '第二章 · 章末' : '第二章 · ' + lesson.section}</p>
      <h2 id="lesson-title">${lesson.title}</h2><p class="lesson-lead">${lesson.lead}</p>
      ${lab ? '<div class="lesson-shortcuts"><button type="button" class="secondary jump-motion">看动画推导</button><button type="button" class="secondary jump-extension">看进阶拓展</button></div>' : ''}
      ${lab ? `<section class="lab" aria-labelledby="lab-title"><h3 id="lab-title">${lab.title}</h3><p>${lab.instruction}</p><div id="lab-panel"></div></section>` : ''}
      ${lab ? '<section class="motion" tabindex="-1" aria-labelledby="motion-title"></section>' : ''}
      ${lesson.proof ? `<details class="explain"><summary>展开推导</summary><div class="detail-body">${lesson.proof.map(text => `<p>${text}</p>`).join('')}</div></details>` : ''}
      ${practiceMarkup(lesson)}
      <section class="notes" aria-labelledby="notes-title"><h3 id="notes-title">手抄精华</h3><ul>${lesson.notes.map(note => `<li>${note}</li>`).join('')}</ul></section>
      ${lab ? '<div id="lesson-extension"></div>' : ''}
      <nav class="lesson-footer" aria-label="上下单元">
        ${previous ? `<a class="secondary" href="#${previous.id}" data-lesson="${previous.id}">上一单元</a>` : '<span></span>'}
        ${next ? `<a class="primary" href="#${next.id}" data-lesson="${next.id}">下一单元 · ${next.id === 'review' ? '章末练习' : next.title}</a>` : ''}
      </nav>`;
    if (lab) {
      lab.mount(article.querySelector('#lab-panel'));
      const motion = article.querySelector('.motion');
      const extension = article.querySelector('#lesson-extension');
      stopMotion = mountMotion(motion, id);
      mountExtension(extension, id);
      article.querySelector('.jump-motion').addEventListener('click', () => {
        motion.focus({ preventScroll: true });
        motion.scrollIntoView({ block: 'start' });
      });
      article.querySelector('.jump-extension').addEventListener('click', () => {
        extension.firstElementChild.open = true;
        extension.querySelector('summary').focus({ preventScroll: true });
        extension.scrollIntoView({ block: 'start' });
      });
    }
    setupPractice(lesson);
    updateNavigation();
  }
  if (focus) {
    mobileMenu.open = false;
    article.focus({ preventScroll: true });
    article.scrollIntoView({ block: 'start' });
  }
  saveState();
}

function hashLesson() {
  return window.location.hash.slice(1);
}

document.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[data-lesson], a.brand');
  if (!link) return;
  const id = link.dataset.lesson ?? lessons[0].id;
  event.preventDefault();
  if (hashLesson() !== id) history.pushState(null, '', '#' + id);
  openLesson(id, true);
});

document.querySelector('#resume').addEventListener('click', () => openLesson(state.current, true));
window.addEventListener('hashchange', () => {
  const id = hashLesson();
  if (lessonById.has(id)) openLesson(id, true);
  else if (!id) openLesson(lessons[0].id);
});
const start = hashLesson();
openLesson(lessonById.has(start) ? start : state.current, lessonById.has(start));
