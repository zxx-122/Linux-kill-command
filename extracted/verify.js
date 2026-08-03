// verify.js — 验证构建产物
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('D:/linux命令斩/index.html', 'utf8');
let ok = true;
const fail = (m) => { console.error('✗ ' + m); ok = false; };
const pass = (m) => console.log('✓ ' + m);

// 1. 题库可解析
const marker = 'const QUESTIONS = ';
const qStart = html.indexOf(marker) + marker.length;
const qEnd = html.indexOf('];\ndocument.', qStart) + 1;
if (qStart < 0 || qEnd < 0) fail('题库定位失败');
else {
  const q = JSON.parse(html.slice(qStart, qEnd));
  if (q.length !== 367) fail('题库数量异常: ' + q.length);
  else pass('题库 ' + q.length + ' 题');
  const cats = [...new Set(q.map(x => x.cat))];
  pass('分类: ' + cats.join(', '));
  const withUsage = q.filter(x => x.usage).length;
  pass('含 usage 示例的题目: ' + withUsage);
  // 重复答案检查
  const seen = new Set();
  const dup = q.filter(x => { const k = x.answers[0]; if (seen.has(k)) return true; seen.add(k); return false; });
  if (dup.length) fail('重复题目: ' + dup.map(x => x.answers[0]).join(', '));
  else pass('无重复题目');
}

// 2. JS 语法检查
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) fail('未找到 script');
scripts.forEach((s, i) => {
  try { new vm.Script(s, { filename: 'inline-' + i }); pass('script[' + i + '] 语法 OK (' + s.length + ' 字符)'); }
  catch (e) { fail('script[' + i + '] 语法错误: ' + e.message); }
});

// 3. 新增元素检查
['q-text', 'sound-toggle', 'goal-input', 'ov-goal'].forEach(id => {
  if (html.includes('id="' + id + '"')) pass('元素存在: #' + id);
  else fail('缺少元素: #' + id);
});
if (html.includes('class="logo-wrap"')) pass('元素存在: .logo-wrap');
else fail('缺少元素: .logo-wrap');

// 4. 旧问题检查：不应再使用 prompt/firstChild
if (html.includes("prompt('每日目标")) fail('仍有 prompt 调用');
else pass('已移除 prompt 调用');
if (html.includes('q-word\').firstChild')) fail('仍使用 firstChild hack');
else pass('已移除 firstChild hack');

// 5. answered 锁（submit 空输入守卫 + 4 处完整锁）
const locks = (html.match(/if \(answered\) return; answered = true;/g) || []).length;
const submitGuard = html.includes('function submit() {\n  if (answered) return;\n  const input = document.getElementById(\'answer\');\n  const user = input.value;\n  if (!user.trim()) return;');
if (locks === 4 && submitGuard) pass('答题锁已应用（submit 空输入守卫 + 4 处锁）');
else fail('答题锁数量异常: ' + locks + ' submitGuard=' + submitGuard);

console.log(ok ? '\n全部通过 ✔' : '\n存在问题 ✘');
process.exit(ok ? 0 : 1);
