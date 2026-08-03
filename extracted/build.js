// build.js — 构建 Linux命令斩 v4 新 index.html
const fs = require('fs');
const newQuestions = require('./new_questions.js');

const SRC = 'D:/linux命令斩/extracted/index.html';
const OUT = 'D:/linux命令斩/index.html';
let html = fs.readFileSync(SRC, 'utf8');
let count = 0;

function once(from, to, desc, all) {
  if (all) {
    const parts = html.split(from);
    if (parts.length === 1) throw new Error('未找到锚点: ' + desc);
    html = parts.join(to);
    count += parts.length - 1;
    console.log('  ✓ ' + desc + ' (x' + (parts.length - 1) + ')');
    return;
  }
  const idx = html.indexOf(from);
  if (idx === -1) throw new Error('未找到锚点: ' + desc);
  html = html.slice(0, idx) + to + html.slice(idx + from.length);
  count++;
  console.log('  ✓ ' + desc);
}

// ================= 1. 题库合并 =================
const marker = 'const QUESTIONS = ';
const qStart = html.indexOf(marker) + marker.length;
const qEnd = html.indexOf('];\ndocument.', qStart) + 1;
const oldQuestions = JSON.parse(html.slice(qStart, qEnd));
const seen = new Set();
const merged = [];
for (const q of oldQuestions) {
  const k = q.answers[0];
  if (!seen.has(k)) { seen.add(k); merged.push(q); }
}
for (const q of newQuestions) {
  const k = q.answers[0];
  if (!seen.has(k)) { seen.add(k); merged.push(q); }
}
console.log('题库: ' + oldQuestions.length + ' → ' + merged.length + ' 题');
html = html.slice(0, qStart) + JSON.stringify(merged) + html.slice(qEnd);

// ================= 2. Tux 企鹅头像 =================
const TUX_SVG = '<svg class="logo" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">'
  + '<ellipse cx="60" cy="98" rx="40" ry="36" fill="#1b1b1b"/>'
  + '<ellipse cx="60" cy="104" rx="22" ry="22" fill="#f5f5f5"/>'
  + '<circle cx="60" cy="42" r="27" fill="#1b1b1b"/>'
  + '<ellipse cx="60" cy="46" rx="15" ry="13" fill="#f5f5f5"/>'
  + '<circle cx="52" cy="41" r="3.6" fill="#1b1b1b"/>'
  + '<circle cx="68" cy="41" r="3.6" fill="#1b1b1b"/>'
  + '<circle cx="52.5" cy="39.3" r="1.2" fill="#fff"/>'
  + '<circle cx="68.5" cy="39.3" r="1.2" fill="#fff"/>'
  + '<polygon points="60,47 54,54 66,54" fill="#f2a900"/>'
  + '<path d="M20 80 Q8 98 20 120 Q28 124 33 114 L38 94 Z" fill="#1b1b1b"/>'
  + '<path d="M100 80 Q112 98 100 120 Q92 124 87 114 L82 94 Z" fill="#1b1b1b"/>'
  + '<ellipse cx="46" cy="130" rx="13" ry="6" fill="#f2a900"/>'
  + '<ellipse cx="74" cy="130" rx="13" ry="6" fill="#f2a900"/>'
  + '</svg>';

once(
  '<header>\n    <h1>🐧 Linux 命令斩</h1>\n    <p>看中文意思，输入英文命令 · 像背单词一样学 Linux</p>\n  </header>',
  '<header>\n    <div class="logo-wrap">' + TUX_SVG + '</div>\n    <h1>🐧 Linux 命令斩</h1>\n    <p>看中文意思，输入英文命令 · 像背单词一样学 Linux</p>\n  </header>',
  'Tux 企鹅头像插入 header'
);
once(
  'header h1 { font-size: 24px; letter-spacing: 1px; }\n  header p { color: #9fb6bf; font-size: 12.5px; margin-top: 3px; }',
  'header h1 { font-size: 24px; letter-spacing: 1px; }\n  header p { color: #9fb6bf; font-size: 12.5px; margin-top: 3px; }\n  .logo-wrap { display: flex; justify-content: center; margin-bottom: 4px; }\n  .logo { width: 62px; height: 72px; filter: drop-shadow(0 4px 10px rgba(0,0,0,.45)); animation: waddle 3.2s ease-in-out infinite; }\n  @keyframes waddle { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }',
  'Tux 动画 CSS'
);

// ================= 3. q-word 结构（文本容器） =================
once(
  '<div class="q-word" id="q-word">\n        <button class="speak-btn" id="speak-q" onclick="speakWord()">🔊</button>\n      </div>',
  '<div class="q-word" id="q-word">\n        <span id="q-text"></span>\n        <button class="speak-btn" id="speak-q" onclick="speakWord()">🔊</button>\n      </div>',
  'q-word 增加文本容器 span#q-text'
);
once(
  "document.getElementById('q-word').firstChild.textContent = q.meaning;",
  "document.getElementById('q-text').textContent = q.meaning;",
  'renderQ 使用 q-text'
);
once(
  "document.getElementById('q-word').firstChild.textContent =\n    q.meaning + `（首字母提示：${first[0]}${'_'.repeat(first.length - 1)}）`;",
  "document.getElementById('q-text').textContent =\n    q.meaning + `（首字母提示：${first[0]}${'_'.repeat(first.length - 1)}）`;",
  'useHint 使用 q-text'
);

// ================= 4. 答题锁（防连点） =================
once(
  'let timerId = null;',
  'let timerId = null;\nlet answered = false;   // 当前题是否已作答（防连点重复提交）',
  '添加 answered 答题锁变量'
);
once(
  'function renderQ() {\n  const q = round[qIdx];\n  document.getElementById(\'progress-bar\')',
  'function renderQ() {\n  const q = round[qIdx];\n  answered = false;\n  document.getElementById(\'progress-bar\')',
  'renderQ 重置答题锁'
);
once(
  'function submit() {\n  const input = document.getElementById(\'answer\');',
  'function submit() {\n  if (answered) return; answered = true;\n  const input = document.getElementById(\'answer\');',
  'submit 加答题锁'
);
once(
  'function answerChoice(btn) {\n  const q = round[qIdx];',
  'function answerChoice(btn) {\n  if (answered) return; answered = true;\n  const q = round[qIdx];',
  'answerChoice 加答题锁'
);
once(
  'function answerFlash(know) {\n  const q = round[qIdx];',
  'function answerFlash(know) {\n  if (answered) return; answered = true;\n  const q = round[qIdx];',
  'answerFlash 加答题锁'
);
once(
  'function skipQ() {\n  const q = round[qIdx];',
  'function skipQ() {\n  if (answered) return; answered = true;\n  const q = round[qIdx];',
  'skipQ 加答题锁'
);
once(
  'function timeoutQ() {\n  if (qIdx >= round.length) return;',
  'function timeoutQ() {\n  if (answered) return; answered = true;\n  if (qIdx >= round.length) return;',
  'timeoutQ 加答题锁'
);

// ================= 5. 每日目标弹窗（替换 prompt） =================
once(
  "function changeGoal() {\n  const g = prompt('每日目标题数（10 / 20 / 30 / 50）：', stats.goal);\n  const n = parseInt(g, 10);\n  if (n > 0 && n <= 500) { stats.goal = n; saveStats(); renderStart(); }\n}",
  "function changeGoal() {\n  const g = document.getElementById('goal-input');\n  if (g) g.value = stats.goal;\n  document.getElementById('ov-goal').classList.add('show');\n  setTimeout(() => { if (g) g.focus(); }, 120);\n}\nfunction setGoal(n) {\n  n = parseInt(n, 10);\n  if (n > 0 && n <= 500) { stats.goal = n; saveStats(); renderStart(); }\n  document.getElementById('ov-goal').classList.remove('show');\n}",
  'changeGoal 改为自定义弹窗'
);
once(
  '  <!-- 庆祝弹窗 -->\n  <div class="overlay" id="ov-celebrate">',
  '  <!-- 每日目标设置弹窗 -->\n  <div class="overlay" id="ov-goal">\n    <div class="overlay-card">\n      <h2>🎯 每日目标</h2>\n      <p>每天想刷多少题？建议 10~100，定太高容易半途而废。</p>\n      <input class="answer-input" id="goal-input" type="number" min="1" max="500" inputmode="numeric" placeholder="输入目标题数" style="margin-bottom:8px">\n      <div class="round-opt" style="margin-bottom:10px">\n        <button onclick="setGoal(10)">10</button>\n        <button onclick="setGoal(20)">20</button>\n        <button onclick="setGoal(30)">30</button>\n        <button onclick="setGoal(50)">50</button>\n      </div>\n      <button class="ov-btn" onclick="setGoal(document.getElementById(\'goal-input\').value)">确定</button>\n      <button class="ov-btn ghost" onclick="document.getElementById(\'ov-goal\').classList.remove(\'show\')">取消</button>\n    </div>\n  </div>\n\n  <!-- 庆祝弹窗 -->\n  <div class="overlay" id="ov-celebrate">',
  '目标设置弹窗 HTML'
);

// ================= 6. 音效开关 =================
once(
  '<label class="toggle-row"><input type="checkbox" id="challenge"> ⏱️ 限时挑战（每题 20 秒，超时算错）</label>\n      <button class="btn-main" onclick="startQuiz()">开始练习 🚀</button>',
  '<label class="toggle-row"><input type="checkbox" id="challenge"> ⏱️ 限时挑战（每题 20 秒，超时算错）</label>\n      <label class="toggle-row"><input type="checkbox" id="sound-toggle"> 🔊 音效（答对/答错提示音）</label>\n      <button class="btn-main" onclick="startQuiz()">开始练习 🚀</button>',
  '开始界面音效开关'
);
once(
  'function beep(freq, ms, type, vol) {\n  try {',
  'function beep(freq, ms, type, vol) {\n  try {\n    if (typeof prefs !== \'undefined\' && prefs.sound === false) return;',
  'beep 尊重音效开关'
);
once(
  "  { cat: 'all', size: 20, qtype: 'typing', mode: 'normal', challenge: false },\n  JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')",
  "  { cat: 'all', size: 20, qtype: 'typing', mode: 'normal', challenge: false, sound: true },\n  JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')",
  'prefs 默认音效开启'
);
once(
  '  prefs = { cat: selectCat, size: roundSize, qtype, mode, challenge };',
  "  prefs = { cat: selectCat, size: roundSize, qtype, mode, challenge, sound: document.getElementById('sound-toggle').checked };",
  'savePrefs 保存音效设置'
);
once(
  "document.getElementById('challenge').onchange = e => {\n  challenge = e.target.checked;\n  localStorage.setItem(CHALLENGE_KEY, challenge ? '1' : '0');\n  savePrefs();\n};",
  "document.getElementById('challenge').onchange = e => {\n  challenge = e.target.checked;\n  localStorage.setItem(CHALLENGE_KEY, challenge ? '1' : '0');\n  savePrefs();\n};\ndocument.getElementById('sound-toggle').onchange = e => { prefs.sound = e.target.checked; savePrefs(); };",
  '音效开关事件监听'
);
once(
  "  document.getElementById('challenge').checked = challenge;\n  document.getElementById('tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];",
  "  document.getElementById('challenge').checked = challenge;\n  document.getElementById('sound-toggle').checked = prefs.sound;\n  document.getElementById('tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];",
  'renderStart 同步音效开关状态'
);

// ================= 7. 语音发音语言 =================
once(
  "function speak(text) {\n  try {\n    if (!window.speechSynthesis) return;\n    speechSynthesis.cancel();\n    const u = new SpeechSynthesisUtterance(text);\n    u.lang = 'zh-CN'; u.rate = 0.9;\n    speechSynthesis.speak(u);\n  } catch (e) {}\n}",
  "function speak(text, lang) {\n  try {\n    if (!window.speechSynthesis) return;\n    speechSynthesis.cancel();\n    const u = new SpeechSynthesisUtterance(text);\n    u.lang = lang || 'zh-CN';\n    u.rate = lang === 'en-US' ? 0.85 : 0.9;\n    speechSynthesis.speak(u);\n  } catch (e) {}\n}",
  'speak 支持语言参数（中文/英文发音）'
);
once(
  "function speakWord() { speak(round[qIdx] ? round[qIdx].meaning : ''); }",
  "function speakWord() { speak(round[qIdx] ? round[qIdx].meaning : '', 'zh-CN'); }",
  'speakWord 使用中文发音'
);
once(
  "<button class=\"speak-btn\" style=\"position:static;margin-top:8px\" onclick=\"speak('${escapeAttr(q.meaning)}')\">🔊 听一下</button>",
  "<button class=\"speak-btn\" style=\"position:static;margin-top:8px\" onclick=\"speak('${escapeAttr(q.meaning)}','zh-CN')\">🔊 听一下</button>",
  '闪卡题面发音 zh-CN'
);
once(
  "<button class=\"speak-btn\" style=\"position:static;margin-top:10px\" onclick=\"speak('${escapeAttr(q.answers[0])}')\">🔊 听发音</button>",
  "<button class=\"speak-btn\" style=\"position:static;margin-top:10px\" onclick=\"speak('${escapeAttr(q.answers[0])}','en-US')\">🔊 听发音</button>",
  '闪卡答案发音 en-US'
);
once(
  "<button class=\"li-btn\" onclick=\"event.stopPropagation();speak('${escapeAttr(q.answers[0])}')\">🔊</button>",
  "<button class=\"li-btn\" onclick=\"event.stopPropagation();speak('${escapeAttr(q.answers[0])}','en-US')\">🔊</button>",
  '学习页命令发音 en-US',
  true
);

// ================= 8. 闪卡模式补计时 =================
once(
  "    document.getElementById('row-flash').style.display = '';\n    document.getElementById('flash-card').innerHTML =",
  "    document.getElementById('row-flash').style.display = '';\n    if (challenge) startTimer();\n    document.getElementById('flash-card').innerHTML =",
  '闪卡模式也支持限时挑战'
);

// ================= 9. usage 示例展示 =================
once(
  '  const memo = mnemonic(q);\n  if (memo) html += `<br><span class="fb-memo">${memo}</span>`;',
  '  const memo = mnemonic(q);\n  if (memo) html += `<br><span class="fb-memo">${memo}</span>`;\n  if (q.usage) html += `<br><span class="fb-memo">💡 示例：<code>${escapeHtml(q.usage)}</code></span>`;',
  '答错反馈显示命令示例'
);
once(
  "        📖 英文全称：${q.en ? escapeHtml(q.en) : '无'}<br>",
  "        📖 英文全称：${q.en ? escapeHtml(q.en) : '无'}<br>\n        ${q.usage ? '💡 示例：<code style=\"color:#5cd6a8\">' + escapeHtml(q.usage) + '</code><br>' : ''}",
  '学习页详情显示命令示例',
  true
);

// ================= 10. footer 版本 =================
once(
  '<footer>题库来自你的《Linux 命令大全》· 共 <span id="footer-count">0</span> 题 · v3 手机版</footer>',
  '<footer>题库来自你的《Linux 命令大全》· 共 <span id="footer-count">0</span> 题 · v4 手机版<br>Powered by 🐧 Tux</footer>',
  'footer 版本号更新'
);

// ================= 11. 分享文案微调 =================
once(
  '🐧 Linux命令斩 成绩单',
  '🐧 Linux命令斩 v4 成绩单',
  '分享文案版本号'
);

// ================= 12. 基础 / 进阶 模式 =================
once(
  '<h2 style="font-size:16.5px;margin:14px 0 8px;">📚 题目范围</h2>\n      <div class="cat-grid" id="cat-grid"></div>',
  '<h2 style="font-size:16.5px;margin:14px 0 8px;">🎚️ 难度模式</h2>\n      <div class="round-opt">\n        <button id="diff-basic" class="sel">🌱 基础模式</button>\n        <button id="diff-pro">🧠 进阶模式</button>\n      </div>\n      <p style="font-size:12px;color:#9fb6bf;margin:-2px 0 12px;line-height:1.6" id="diff-desc"></p>\n      <h2 style="font-size:16.5px;margin:14px 0 8px;">📚 题目范围</h2>\n      <div class="cat-grid" id="cat-grid"></div>',
  '开始界面难度模式选择'
);
once(
  'let selectCat = \'all\', roundSize = 20, hintUsed = false;',
  'let selectCat = \'all\', roundSize = 20, hintUsed = false;\nlet diff = \'basic\';   // basic | pro 难度模式',
  'diff 变量'
);
once(
  '// ---------- 分类 ----------\nconst cats = [...new Set(QUESTIONS.map(q => q.cat))];\nconst catGrid = document.getElementById(\'cat-grid\');\ncatGrid.innerHTML =\n  `<label class="cat-opt"><input type="radio" name="cat" value="all" checked><span>全部</span><span class="count">${QUESTIONS.length}</span></label>` +\n  cats.map(c => {\n    const n = QUESTIONS.filter(q => q.cat === c).length;\n    return `<label class="cat-opt"><input type="radio" name="cat" value="${c}"><span>${c}</span><span class="count">${n}</span></label>`;\n  }).join(\'\');\ncatGrid.querySelectorAll(\'input\').forEach(i => i.onchange = () => { selectCat = i.value; savePrefs(); });',
  '// ---------- 分类（随难度联动） ----------\nconst EASY_CATS = [\'目录文件\',\'内容查看\',\'文本处理\',\'文件搜索\',\'权限\',\'压缩\',\'系统信息\',\'硬件\',\'进程\',\'编辑器/Shell\',\'参数速记\',\'文件工具\',\'系统工具\'];\nconst isHardCat = c => !EASY_CATS.includes(c);\nconst DIFF_TIP = { basic: \'🌱 基础模式：新手友好，常用命令 + 参数速记\', pro: \'🧠 进阶模式：运维、网络、Git、容器、编译、数据库等硬核内容\' };\nconst cats = [...new Set(QUESTIONS.map(q => q.cat))];\nfunction poolForDiff() { return diff === \'basic\' ? QUESTIONS.filter(q => !isHardCat(q.cat)) : QUESTIONS.filter(q => isHardCat(q.cat)); }\nfunction renderCatGrid() {\n  const catGrid = document.getElementById(\'cat-grid\');\n  const pool = poolForDiff();\n  const curCats = [...new Set(pool.map(q => q.cat))];\n  if (selectCat !== \'all\' && !curCats.includes(selectCat)) selectCat = \'all\';\n  catGrid.innerHTML =\n    `<label class="cat-opt"><input type="radio" name="cat" value="all" ${selectCat === \'all\' ? \'checked\' : \'\'}><span>全部</span><span class="count">${pool.length}</span></label>` +\n    curCats.map(c => {\n      const n = pool.filter(q => q.cat === c).length;\n      return `<label class="cat-opt"><input type="radio" name="cat" value="${c}" ${selectCat === c ? \'checked\' : \'\'}><span>${c}</span><span class="count">${n}</span></label>`;\n    }).join(\'\');\n  catGrid.querySelectorAll(\'input\').forEach(i => i.onchange = () => { selectCat = i.value; savePrefs(); });\n}\nrenderCatGrid();',
  '分类选择器随难度联动'
);
once(
  '    pool = selectCat === \'all\' ? [...QUESTIONS] : QUESTIONS.filter(q => q.cat === selectCat);',
  '    pool = poolForDiff();\n    if (selectCat !== \'all\') pool = pool.filter(q => q.cat === selectCat);',
  'startQuiz 按难度筛选题目'
);
once(
  'function renderStart() {\n  document.getElementById(\'greet\').textContent = greet();',
  'function renderStart() {\n  renderCatGrid();\n  document.getElementById(\'diff-basic\').classList.toggle(\'sel\', diff === \'basic\');\n  document.getElementById(\'diff-pro\').classList.toggle(\'sel\', diff === \'pro\');\n  document.getElementById(\'diff-desc\').textContent = DIFF_TIP[diff];\n  document.getElementById(\'greet\').textContent = greet();',
  'renderStart 同步难度状态'
);
once(
  "document.getElementById('qtype-flash').onclick = () => { qtype = 'flash'; renderStart(); savePrefs(); };",
  "document.getElementById('qtype-flash').onclick = () => { qtype = 'flash'; renderStart(); savePrefs(); };\ndocument.getElementById('diff-basic').onclick = () => { diff = 'basic'; renderStart(); savePrefs(); };\ndocument.getElementById('diff-pro').onclick = () => { diff = 'pro'; renderStart(); savePrefs(); };",
  '难度切换事件'
);
once(
  "  { cat: 'all', size: 20, qtype: 'typing', mode: 'normal', challenge: false, sound: true },",
  "  { cat: 'all', size: 20, qtype: 'typing', mode: 'normal', challenge: false, sound: true, diff: 'basic' },",
  'prefs 默认难度'
);
once(
  "  prefs = { cat: selectCat, size: roundSize, qtype, mode, challenge, sound: document.getElementById('sound-toggle').checked };",
  "  prefs = { cat: selectCat, size: roundSize, qtype, mode, challenge, diff, sound: document.getElementById('sound-toggle').checked };",
  'savePrefs 保存难度'
);
once(
  "selectCat = prefs.cat; roundSize = prefs.size; qtype = prefs.qtype; mode = prefs.mode; challenge = prefs.challenge;\ndocument.querySelectorAll('#cat-grid input').forEach(i => { i.checked = (i.value === selectCat); });",
  "selectCat = prefs.cat; roundSize = prefs.size; qtype = prefs.qtype; mode = prefs.mode; challenge = prefs.challenge; diff = prefs.diff || 'basic';",
  '恢复上次难度设置'
);

fs.writeFileSync(OUT, html, 'utf8');
console.log('\n构建完成！共执行 ' + count + ' 处修改');
console.log('输出: ' + OUT);
