// make_test.js — 生成带自动测试脚本的页面并跑 headless Chrome
const fs = require('fs');
const html = fs.readFileSync('D:/linux命令斩/index.html', 'utf8');

const testScript = `
<script>
(function () {
  const log = [];
  const step = (name, fn) => { try { fn(); log.push('OK ' + name); } catch (e) { log.push('FAIL ' + name + ': ' + e.message); } };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  (async function run() {
    try {
      step('首页渲染-称号', () => {
        if (document.getElementById('start-rank').textContent.indexOf('命令菜鸟') === -1) throw new Error('称号未渲染');
      });
      step('Tux logo 渲染', () => {
        if (!document.querySelector('.logo')) throw new Error('logo 缺失');
      });
      step('音效开关默认开', () => {
        if (document.getElementById('sound-toggle').checked !== true) throw new Error('音效默认应为开');
      });
      step('目标弹窗', () => {
        changeGoal();
        if (!document.getElementById('ov-goal').classList.contains('show')) throw new Error('弹窗未打开');
        setGoal(30);
        if (document.getElementById('ov-goal').classList.contains('show')) throw new Error('弹窗未关闭');
        if (stats.goal !== 30) throw new Error('目标未保存');
      });

      // ---- 打字模式 ----
      qtype = 'typing'; mode = 'normal'; selectCat = 'all'; roundSize = 10;
      step('开始练习-打字', () => {
        startQuiz();
        if (document.getElementById('screen-quiz').style.display === 'none') throw new Error('答题页未显示');
        if (round.length !== 10) throw new Error('题目数应为10, 实际' + round.length);
      });
      step('答对加分', () => {
        const q = round[0]; const s0 = score;
        document.getElementById('answer').value = q.answers[0];
        submit();
        if (score <= s0) throw new Error('分数未增加');
      });
      await wait(1800);
      step('答错进错题本', () => {
        const q = round[1];
        markWrong(q, 'wrongtext', 'wrong');
        if (!stats.wrongBook.some(w => w.a === q.answers[0])) throw new Error('错题未记录');
        if (document.getElementById('feedback').innerHTML.indexOf('💡 示例') === -1) throw new Error('未显示 usage 示例');
      });
      step('跳过', () => { skipQ(); });
      await wait(1600);

      // ---- 选择题模式 ----
      qtype = 'choice';
      step('开始练习-选择', () => {
        startQuiz();
        if (document.getElementById('row-choice').style.display === 'none') throw new Error('选择题行未显示');
        if (document.querySelectorAll('.choice-btn').length < 4) throw new Error('选项不足4个');
      });
      step('选择答对', () => {
        const q = round[0];
        const btns = [...document.querySelectorAll('.choice-btn')];
        const correct = btns.find(b => b.textContent.trim() === q.answers[0]);
        if (!correct) throw new Error('找不到正确选项');
        answerChoice(correct);
        if (!document.querySelector('.choice-btn.correct')) throw new Error('未标记正确');
      });
      await wait(1800);

      // ---- 闪卡模式 ----
      qtype = 'flash';
      step('开始练习-闪卡', () => {
        startQuiz();
        if (document.getElementById('row-flash').style.display === 'none') throw new Error('闪卡行未显示');
      });
      step('闪卡认识', () => { answerFlash(true); });
      await wait(1700);
      step('闪卡不认识', () => { answerFlash(false); });
      await wait(1700);

      // ---- 错题本模式 ----
      step('错题本练习', () => {
        mode = 'wrongbook'; startQuiz();
        if (round.length === 0) throw new Error('错题本为空');
      });

      // ---- 结算 ----
      step('结算显示', () => {
        qIdx = round.length; finish();
        if (document.getElementById('screen-result').style.display === 'none') throw new Error('结算页未显示');
        if (!/^\\d+$/.test(document.getElementById('r-score').textContent)) throw new Error('得分异常');
      });
      step('再来一轮', () => { restart(); if (document.getElementById('screen-start').style.display === 'none') throw new Error('未回到开始'); });

      // ---- 学习页 ----
      step('学习页渲染', () => {
        showTab('learn');
        if (document.getElementById('learn-list').innerHTML === '') throw new Error('学习列表为空');
      });
      step('学习页搜索 git', () => {
        learnKeyword = 'git'; renderLearn();
        if (document.getElementById('li-count').textContent.indexOf('共') === -1) throw new Error('搜索失败');
        learnKeyword = '';
      });
      step('战绩页', () => { showTab('stats'); if (!document.getElementById('week-bars').innerHTML) throw new Error('图表为空'); });
      step('错题页', () => { showTab('wrong'); if (!document.getElementById('wb-sub')) throw new Error('错题页异常'); });
    } catch (e) {
      log.push('FATAL: ' + e.message);
    }
    document.title = log.join(' | ');
  })();
})();
</script>`;

const testHtml = html.replace('</body>', testScript + '\n</body>');
fs.writeFileSync('D:/linux命令斩/extracted/test.html', testHtml, 'utf8');
console.log('test.html 生成完成');
