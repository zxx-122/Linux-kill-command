// make_test2.js — 难度模式专项冒烟测试
const fs = require('fs');
const html = fs.readFileSync('D:/linux命令斩/index.html', 'utf8');

const testScript = `
<script>
(function () {
  const log = [];
  const step = (name, fn) => { try { fn(); log.push('OK ' + name); } catch (e) { log.push('FAIL ' + name + ': ' + e.message); } };
  (async function run() {
    try {
      step('难度模式区块渲染', () => {
        if (!document.getElementById('diff-basic') || !document.getElementById('diff-pro')) throw new Error('难度按钮缺失');
      });
      step('默认基础模式', () => {
        if (diff !== 'basic') throw new Error('默认应为 basic');
        if (!document.getElementById('diff-basic').classList.contains('sel')) throw new Error('基础按钮未选中');
      });
      step('基础模式题量', () => {
        const easyCount = QUESTIONS.filter(q => !isHardCat(q.cat)).length;
        const hardCount = QUESTIONS.filter(q => isHardCat(q.cat)).length;
        const tip = document.getElementById('diff-desc').textContent;
        if (!tip.includes('基础')) throw new Error('描述错误: ' + tip);
        log.push('   基础 ' + easyCount + ' 题 / 进阶 ' + hardCount + ' 题');
        if (easyCount + hardCount !== QUESTIONS.length) throw new Error('题量分配合计错误');
        if (easyCount < 100 || hardCount < 100) throw new Error('某难度题量过少');
      });
      step('基础模式分类联动', () => {
        const cats = [...document.querySelectorAll('#cat-grid label .count')].map(e => e.textContent);
        if (cats.length < 5) throw new Error('基础分类过少: ' + cats.length);
        if (document.querySelector('#cat-grid input[value="all"] + span + span').textContent !== String(poolForDiff().length)) throw new Error('全部计数错误');
      });
      step('切换进阶模式', () => {
        document.getElementById('diff-pro').click();
        if (diff !== 'pro') throw new Error('未切换到 pro');
        if (!document.getElementById('diff-pro').classList.contains('sel')) throw new Error('进阶按钮未选中');
        if (!document.getElementById('diff-desc').textContent.includes('进阶')) throw new Error('进阶描述错误');
      });
      step('进阶模式无基础分类', () => {
        const cats = [...document.querySelectorAll('#cat-grid input')].map(i => i.value);
        if (cats.includes('目录文件')) throw new Error('进阶模式混入基础分类');
        if (!cats.includes('Git 版本控制')) throw new Error('进阶模式缺少 Git 分类');
      });
      step('进阶模式练习', () => {
        mode = 'normal'; qtype = 'typing'; roundSize = 10; startQuiz();
        const allHard = round.every(q => isHardCat(q.cat));
        if (!allHard) throw new Error('进阶模式题目含基础题');
        if (round.length !== 10) throw new Error('题数错误');
      });
      step('切回基础模式', () => {
        document.getElementById('diff-basic').click();
        if (diff !== 'basic') throw new Error('未切回 basic');
        const cats = [...document.querySelectorAll('#cat-grid input')].map(i => i.value);
        if (!cats.includes('目录文件')) throw new Error('基础模式缺少基础分类');
      });
      step('基础模式练习', () => {
        mode = 'normal'; selectCat = 'all'; startQuiz();
        const allEasy = round.every(q => !isHardCat(q.cat));
        if (!allEasy) throw new Error('基础模式题目含进阶题');
      });
      step('难度偏好保存', () => {
        diff = 'pro'; savePrefs();
        if (JSON.parse(localStorage.getItem(PREFS_KEY)).diff !== 'pro') throw new Error('prefs 未保存难度');
      });
      step('难度偏好恢复', () => {
        diff = 'basic'; challenge = prefs.challenge;
        selectCat = prefs.cat; roundSize = prefs.size; qtype = prefs.qtype; mode = prefs.mode; diff = prefs.diff || 'basic';
        if (diff !== 'pro') throw new Error('未恢复 pro');
      });
      // 错题本模式不受难度限制（预置错题，避免空错题本触发 alert 阻塞）
      step('错题本模式不受难度限制', () => {
        stats.wrongBook = [{ a: 'git', meaning: '版本控制', answers: ['git'], en: 'Git', cat: 'Git 版本控制', times: 1, lastSeen: todayStr() }];
        mode = 'wrongbook'; startQuiz();
        if (!round.length) throw new Error('错题本为空');
        mode = 'normal'; diff = 'basic';
      });
      step('结算正常', () => { qIdx = round.length; finish(); if (!document.getElementById('r-score').textContent) throw new Error('结算异常'); });
    } catch (e) {
      log.push('FATAL: ' + e.message);
    }
    document.title = log.join(' | ');
    setTimeout(() => { document.title = log.join(' | ') + ' [DONE]'; }, 3000);
  })();
})();
</script>`;

const testHtml = html.replace('</body>', testScript + '\n</body>');
fs.writeFileSync('D:/linux命令斩/extracted/test2.html', testHtml, 'utf8');
console.log('test2.html 生成完成');
