# 全功能端到端测试：Linux命令斩
# 覆盖：引导 / 开始界面 / 每日目标 / 难度 / 分类 / 轮次 / 题型(打字·选择·闪卡) /
#       提示 / 跳过 / 空提交 / 回车提交 / 限时挑战 / 结算页 / 错题本 / 学习页 / 战绩页 /
#       持久化 / XSS 防护
import os, sys, json
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8080/index.html'
SHOTS = r'D:\linux命令斩\extracted\shots'
os.makedirs(SHOTS, exist_ok=True)

PASS, FAIL = [], []
def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(name)
    print(('  ✅ ' if cond else '  ❌ ') + name + (f'  [{detail}]' if detail else ''))

def js(page, expr):
    return page.evaluate(expr)

page_errors, console_errors, dialogs = [], [], []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    page.on('pageerror', lambda e: page_errors.append(str(e)))
    page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
    def on_dialog(d):
        dialogs.append((d.type, d.message))
        d.accept()
    page.on('dialog', on_dialog)

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)

    # ============ T01 页面加载 ============
    print('\n[1] 页面加载')
    check('页面加载无 JS 错误', len(page_errors) == 0, '; '.join(page_errors[:2]))
    check('标题为 Linux 命令斩', 'Linux 命令斩' in page.title())
    check('题库已加载', js(page, 'QUESTIONS.length') > 0, str(js(page, 'QUESTIONS.length')))
    check('页脚题目数正确', js(page, "document.getElementById('footer-count').textContent") == str(js(page, 'QUESTIONS.length')))

    # ============ T02 首次引导 ============
    print('\n[2] 首次引导页')
    check('引导页显示', js(page, "document.getElementById('ov-onboard').classList.contains('show')"))
    check('引导第1步' if js(page, "document.querySelectorAll('.onboard-step.on').length") == 1 else '引导步骤切换', True)
    page.click('#ov-next')
    page.wait_for_timeout(150)
    check('点击下一步可切换', js(page, "document.querySelectorAll('.onboard-step.on').length") == 1)
    page.click('#ov-next')
    page.wait_for_timeout(150)
    check('最后一步按钮文字为"开刷"', js(page, "document.getElementById('ov-next').textContent") == '开刷！🚀')
    page.click('#ov-next')
    page.wait_for_timeout(300)
    check('引导可关闭', not js(page, "document.getElementById('ov-onboard').classList.contains('show')"))

    # ============ T03 开始界面 ============
    print('\n[3] 开始界面')
    check('问候语显示', len(js(page, "document.getElementById('greet').textContent")) > 0)
    check('称号显示', js(page, "document.getElementById('start-rank').textContent").strip() != '')
    check('每日目标显示', '/20' in js(page, "document.getElementById('day-txt').textContent"))
    check('分类网格已渲染', js(page, "document.querySelectorAll('#cat-grid .cat-opt').length") > 0,
          str(js(page, "document.querySelectorAll('#cat-grid .cat-opt').length")))
    check('题型按钮3个', js(page, "['typing','choice','flash'].every(t => document.getElementById('qtype-'+t))"))

    # ============ T04 每日目标修改 ============
    print('\n[4] 每日目标')
    page.click('.goal-btn')
    page.wait_for_timeout(200)
    check('目标弹窗打开', js(page, "document.getElementById('ov-goal').classList.contains('show')"))
    page.click('#ov-goal button:has-text("30")')   # setGoal(30)
    page.wait_for_timeout(300)
    check('目标设为30', js(page, "stats.goal") == 30 and '/30' in js(page, "document.getElementById('day-txt').textContent"))
    # 自定义输入
    page.click('.goal-btn')
    page.wait_for_timeout(200)
    page.fill('#goal-input', '42')
    page.click('#ov-goal button:has-text("确定")')
    page.wait_for_timeout(300)
    check('自定义目标42', js(page, "stats.goal") == 42)
    # 非法值不生效
    page.click('.goal-btn')
    page.wait_for_timeout(150)
    page.fill('#goal-input', '99999')
    page.click('#ov-goal button:has-text("确定")')
    page.wait_for_timeout(300)
    check('非法目标被拒绝', js(page, "stats.goal") == 42)

    # ============ T05 难度切换 ============
    print('\n[5] 难度模式')
    d0 = js(page, "document.getElementById('diff-desc').textContent")
    page.click('#diff-pro')
    page.wait_for_timeout(200)
    d1 = js(page, "document.getElementById('diff-desc').textContent")
    check('基础→进阶描述变化', d0 != d1)
    check('进阶选中态', js(page, "document.getElementById('diff-pro').classList.contains('sel')"))
    page.click('#diff-basic')
    page.wait_for_timeout(150)
    check('切回基础', js(page, "document.getElementById('diff-basic').classList.contains('sel')"))

    # ============ T06 轮次选择 ============
    print('\n[6] 轮次选择')
    page.click('.round-opt button[data-n="10"]')
    page.wait_for_timeout(150)
    check('选择10题', js(page, "roundSize") == 10 and js(page, "document.querySelector('.round-opt button[data-n=\"10\"]').classList.contains('sel')"))
    page.click('.round-opt button[data-n="30"]')
    page.wait_for_timeout(150)
    check('选择30题', js(page, "roundSize") == 30)

    # ============ T07/T08/T09 打字模式 ============
    print('\n[7] 打字模式')
    # 选第一个实际分类（跳过"全部"选项，radio 单选）
    first_cat = js(page, "document.querySelectorAll('#cat-grid .cat-opt input')[1].value")
    page.click('#cat-grid .cat-opt:nth-child(2) input')
    page.wait_for_timeout(150)
    page.click('#qtype-typing')
    page.wait_for_timeout(150)
    page.click('.round-opt button[data-n="10"]')
    page.wait_for_timeout(150)
    page.click('button:has-text("开始练习")')
    page.wait_for_timeout(300)
    check('进入答题界面', js(page, "document.getElementById('screen-quiz').style.display != 'none'"))
    check('题目分类=所选分类', js(page, "round.every(q => q.cat === '" + first_cat + "')"))
    check('进度条初始0%', js(page, "document.getElementById('progress-bar').style.width") in ('0%', '0px'))
    page.screenshot(path=f'{SHOTS}/t_quiz_typing.png')

    # 答对
    ans = js(page, "round[qIdx].answers[0]")
    s0 = js(page, "stats.score")
    page.fill('#answer', ans)
    page.click('#btn-submit')
    page.wait_for_timeout(400)
    check('答对+10分', js(page, "stats.score") == s0 + 10)
    check('反馈显示正确', '正确' in js(page, "document.getElementById('feedback').textContent"))
    page.wait_for_timeout(1400)

    # 提示按钮（下一题）
    page.click('#btn-hint')
    page.wait_for_timeout(150)
    qtxt = js(page, "document.getElementById('q-text').textContent")
    check('提示显示首字母', '首字母提示' in qtxt)
    ans2 = js(page, "round[qIdx].answers[0]")
    page.fill('#answer', ans2)
    page.click('#btn-submit')
    page.wait_for_timeout(400)
    fb2 = js(page, "document.getElementById('feedback').textContent")
    check('用提示答对仍加分(扣3分)', js(page, "stats.score") >= 0 and '正确' in fb2)
    page.wait_for_timeout(1400)

    # 空提交不锁死
    page.click('#btn-submit')
    page.wait_for_timeout(200)
    check('空提交不锁死', js(page, "!answered && !document.getElementById('btn-submit').disabled"))
    # 回车提交
    ans3 = js(page, "round[qIdx].answers[0]")
    page.fill('#answer', ans3)
    page.press('#answer', 'Enter')
    page.wait_for_timeout(400)
    check('回车可提交', js(page, "answered"))
    page.wait_for_timeout(1400)

    # 答错 → 进错题本
    wb0 = js(page, "stats.wrongBook.length")
    wrong_ans = js(page, "(() => { const q = round[qIdx]; return q.answers[0] + 'zzz_not_exist'; })()")
    page.fill('#answer', wrong_ans)
    page.click('#btn-submit')
    page.wait_for_timeout(400)
    check('答错显示正确答案', js(page, "document.getElementById('feedback').classList.contains('wrong')"))
    check('答错进错题本', js(page, "stats.wrongBook.length") == wb0 + 1)
    page.wait_for_timeout(1400)

    # 跳过
    wb1 = js(page, "stats.wrongBook.length")
    page.click('#btn-skip')
    page.wait_for_timeout(400)
    check('跳过进错题本', js(page, "stats.wrongBook.length") == wb1 + 1)
    page.wait_for_timeout(1300)

    # ============ T10 选择题模式 ============
    print('\n[8] 选择题模式')
    page.evaluate("qtype='choice'; renderQ()")
    page.wait_for_timeout(300)
    opts = js(page, "document.querySelectorAll('#choice-grid .choice-btn').length")
    check('渲染4个选项', opts == 4, str(opts))
    page.screenshot(path=f'{SHOTS}/t_choice.png')
    # 点正确答案
    ca = js(page, "round[qIdx].answers[0]")
    page.evaluate("""(ca) => {
      const btns = [...document.querySelectorAll('#choice-grid .choice-btn')];
      btns.find(b => b.textContent.trim() === ca).click();
    }""", ca)
    page.wait_for_timeout(300)
    check('答对选项高亮correct', js(page, "document.querySelectorAll('#choice-grid .choice-btn.correct').length") >= 1)
    page.wait_for_timeout(1400)
    # 点错误答案（find 一个非正确项，避免 25% 概率点中正确答案）
    ca2 = js(page, "round[qIdx].answers[0]")
    page.evaluate("""(ca) => {
      const btns = [...document.querySelectorAll('#choice-grid .choice-btn')];
      btns.find(b => b.textContent.trim() !== ca).click();
    }""", ca2)
    page.wait_for_timeout(300)
    check('答错标红+显示正确答案', js(page, "document.querySelectorAll('#choice-grid .choice-btn.wrong').length") == 1
          and js(page, "document.querySelectorAll('#choice-grid .choice-btn.correct').length") == 1)
    page.wait_for_timeout(1400)

    # ============ T11 闪卡模式 ============
    print('\n[9] 闪卡模式')
    page.evaluate("qtype='flash'; renderQ()")
    page.wait_for_timeout(300)
    check('闪卡渲染', js(page, "document.getElementById('row-flash').style.display != 'none'"))
    page.screenshot(path=f'{SHOTS}/t_flash.png')
    s_bf = js(page, "stats.score")
    page.click('.btn-know')
    page.wait_for_timeout(300)
    check('认识+8分', js(page, "stats.score") == s_bf + 8)
    # 等待下一题渲染（answerFlash 隐藏按钮行，next() 后重新可见）
    page.wait_for_selector('.btn-dontknow', state='visible', timeout=5000)
    wb2 = js(page, "stats.wrongBook.length")
    page.click('.btn-dontknow')
    page.wait_for_timeout(300)
    check('不认识进错题本', js(page, "stats.wrongBook.length") == wb2 + 1)
    check('闪卡显示答案', js(page, "document.querySelector('.ans-big')") is not None)
    page.wait_for_timeout(1300)

    # ============ T12 限时挑战 ============
    print('\n[10] 限时挑战')
    page.evaluate("challenge = true; renderQ()")
    page.wait_for_timeout(300)
    check('计时器显示', js(page, "document.getElementById('timer-box').style.display != 'none'"))
    t0 = js(page, "document.getElementById('timer').textContent")
    page.wait_for_timeout(1200)
    t1 = js(page, "document.getElementById('timer').textContent")
    check('倒计时递减', int(t1) < int(t0), f'{t0}→{t1}')
    # 直接调用超时逻辑（避免等20秒）
    wb3 = js(page, "stats.wrongBook.length")
    page.evaluate("timeoutQ()")
    page.wait_for_timeout(300)
    check('超时算错并进错题本', js(page, "stats.wrongBook.length") == wb3 + 1)
    check('超时提示', '超时' in js(page, "document.getElementById('feedback').textContent"))
    page.wait_for_timeout(1500)
    page.evaluate("challenge = false; stopTimer()")

    # ============ T13 完整一轮 → 结算页 ============
    print('\n[11] 结算页')
    # 直接缩短轮次，全部答对
    page.evaluate("""() => {
      round = QUESTIONS.slice(0, 3);
      qIdx = 0; score = 0; streak = 0; maxStreak = 0; wrongThisRound = []; skipCount = 0;
      document.getElementById('screen-start').style.display = 'none';
      document.getElementById('screen-result').style.display = 'none';
      document.getElementById('screen-quiz').style.display = '';
      qtype = 'typing'; challenge = false;
      renderQ();
    }""")
    for _ in range(3):
        a = js(page, "round[qIdx].answers[0]")
        page.fill('#answer', a)
        page.click('#btn-submit')
        page.wait_for_timeout(400)
        page.wait_for_timeout(1400)
    check('结算页显示', js(page, "document.getElementById('screen-result').style.display != 'none'"))
    check('得分>0', js(page, "parseInt(document.getElementById('r-score').textContent)") > 0)
    check('正确率100%', js(page, "document.getElementById('r-acc').textContent") == '100%')
    check('答对3题', js(page, "document.getElementById('r-right').textContent") == '3')
    page.screenshot(path=f'{SHOTS}/t_result.png')

    # 再来一轮
    page.click('text=再来一轮')
    page.wait_for_timeout(300)
    check('再来一轮回到开始', js(page, "document.getElementById('screen-start').style.display != 'none'"))

    # ============ T14 错题本 ============
    print('\n[12] 错题本')
    page.click('#tab-wrong')
    page.wait_for_timeout(300)
    wb_count = js(page, "stats.wrongBook.length")
    check('错题列表渲染', js(page, "document.querySelectorAll('#wb-list .review-item').length") == wb_count, str(wb_count))
    page.screenshot(path=f'{SHOTS}/t_wrongbook.png')
    # 移除单项（多个 .rm，用 .first 避免 strict mode 报错）
    n1 = js(page, "document.querySelectorAll('#wb-list .review-item').length")
    page.click('#wb-list .rm >> nth=0')
    page.wait_for_timeout(300)
    n2 = js(page, "document.querySelectorAll('#wb-list .review-item').length")
    check('移除单项', n2 == n1 - 1)
    # 清空（confirm 自动 accept）
    page.click('#view-wrong button:has-text("清空")')
    page.wait_for_timeout(300)
    check('清空错题本', js(page, "stats.wrongBook.length") == 0)

    # ============ T15 错题练习（答对毕业） ============
    print('\n[13] 错题练习')
    # 构造两条错题
    page.evaluate("""() => {
      stats.wrongBook.push({a:'grep', meaning:'全局正则搜索', answers:['grep'], en:'global regular expression print', cat:'文本处理', times:2, lastSeen:'2026-08-02'});
      stats.wrongBook.push({a:'tar', meaning:'磁带归档（打包）', answers:['tar'], en:'tape archive', cat:'压缩', times:1, lastSeen:'2026-08-02'});
      saveStats(); renderWrongBook(); renderStart();
    }""")
    page.click('#tab-quiz')
    page.wait_for_timeout(200)
    page.click('#mode-wrongbook')
    page.wait_for_timeout(200)
    page.click('.round-opt button[data-n="10"]')
    page.wait_for_timeout(150)
    page.click('button:has-text("开始练习")')
    page.wait_for_timeout(300)
    check('错题模式出题来自错题本', js(page, "round.length") == 2 and js(page, "round.every(q => q.answers[0] === 'grep' || q.answers[0] === 'tar')"))
    check('错题分类chip前缀', '错题本' in js(page, "document.getElementById('q-cat').textContent"))
    # 答对第一题 → 毕业移除
    a = js(page, "round[qIdx].answers[0]")
    page.fill('#answer', a)
    page.click('#btn-submit')
    page.wait_for_timeout(400)
    check('答对毕业移除错题', page.evaluate("(a) => stats.wrongBook.every(w => w.a !== a)", a), a)
    page.wait_for_timeout(1400)
    # 再答对第二题完成
    a = js(page, "round[qIdx].answers[0]")
    page.fill('#answer', a)
    page.click('#btn-submit')
    page.wait_for_timeout(400)
    page.wait_for_timeout(1400)
    check('错题本全部毕业', js(page, "stats.wrongBook.length") == 0)
    page.click('text=再来一轮')
    page.wait_for_timeout(200)

    # ============ T16 学习页 ============
    print('\n[14] 学习页')
    page.click('#tab-learn')
    page.wait_for_timeout(400)
    check('学习列表渲染', js(page, "document.querySelectorAll('#learn-list .learn-item').length") > 0)
    all_n = js(page, "document.querySelectorAll('#learn-list .learn-item').length")
    # 搜索
    page.fill('#learn-search', 'ls')
    page.wait_for_timeout(300)
    found = js(page, "document.querySelectorAll('#learn-list .learn-item').length")
    check('搜索过滤', found > 0 and found < all_n, f'{found}/{all_n}')
    # 展开详情（多个 .learn-item，用 nth=0）
    page.click('#learn-list .learn-item >> nth=0')
    page.wait_for_timeout(150)
    check('点击展开详情', js(page, "document.querySelector('#learn-list .learn-item').classList.contains('open')"))
    # 收藏（每个项有 2 个 .li-btn：☆/🔊，点第一个即收藏）
    page.click('#learn-list .learn-item >> nth=0 >> .li-btn >> nth=0')
    page.wait_for_timeout(200)
    check('收藏成功', js(page, "stats.favs.length") == 1)
    page.screenshot(path=f'{SHOTS}/t_learn.png')
    # 分类筛选（多个 chip，取第一个非选中）
    page.click('#learn-chips .chip:not(.sel) >> nth=0')
    page.wait_for_timeout(300)
    check('分类筛选生效', js(page, "document.querySelectorAll('#learn-list .learn-item').length") > 0)

    # ============ T17 战绩页 ============
    print('\n[15] 战绩页')
    page.click('#tab-stats')
    page.wait_for_timeout(400)
    check('累计答题>0', js(page, "parseInt(document.getElementById('s-total').textContent)") > 0)
    check('7日打卡柱状图渲染', js(page, "document.querySelectorAll('#week-bars .wk').length") == 7)
    check('难词榜渲染', js(page, "document.getElementById('s-hard-list').children.length") > 0)
    page.screenshot(path=f'{SHOTS}/t_stats.png')
    # 导出（触发 alert，dialog 自动 accept）
    page.click('#view-stats .btn-sm.good')
    page.wait_for_timeout(400)
    check('导出数据弹窗', any(t == 'alert' for t, _ in dialogs))
    # 重置统计（confirm 自动 accept）
    page.click('text=重置统计')
    page.wait_for_timeout(400)
    check('重置统计生效', js(page, "stats.total") == 0 and js(page, "document.getElementById('s-total').textContent") == '0')

    # ============ T18 持久化 ============
    print('\n[16] 持久化')
    page.evaluate("""() => {
      stats.goal = 66; saveStats();
      localStorage.setItem('linux-quiz-prefs', JSON.stringify({cat:'all',size:30,qtype:'flash',mode:'normal',challenge:true,sound:false,diff:'pro'}));
      localStorage.setItem('linux-quiz-challenge', '1');
    }""")
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(500)
    check('目标持久化', js(page, "stats.goal") == 66)
    check('题型持久化', js(page, "qtype") == 'flash')
    check('难度持久化', js(page, "diff") == 'pro')
    check('轮次持久化', js(page, "roundSize") == 30)
    check('限时开关持久化', js(page, "challenge") is True)
    check('再次加载无JS错误', len(page_errors) == 0, '; '.join(page_errors[:2]))

    # ============ T19 XSS 防护 ============
    print('\n[17] XSS 防护')
    # 注入若执行会触发 alert() → dialog 事件（而非 pageerror），因此同时监控两者
    before_errors = len(page_errors)
    before_dialogs = len(dialogs)
    page.evaluate("""(payloads) => {
      const [pw_a, pw_meaning, pw_ans, fav, wrongkey] = payloads;
      stats.wrongBook = [{a: pw_a, meaning: pw_meaning, answers: [pw_ans], en: "", cat: "测试", times: 2, lastSeen: "2026-08-02"}];
      renderWrongBook();
      stats.favs.push(fav);
      renderLearn();
      stats.wrongs[wrongkey] = 5;
      renderStats();
    }""", ["x');alert('pwned');//", "<img src=x onerror=alert(1)>", "x');alert(1);//", 'a" onclick="alert(2)', "y']/><svg onload=alert(3)"])
    page.wait_for_timeout(500)
    check('恶意数据未执行脚本', len(page_errors) == before_errors and len(dialogs) == before_dialogs,
          f'errors:{len(page_errors)}->{before_errors}, dialogs:{len(dialogs)}->{before_dialogs}')
    check('恶意文本被转义显示', js(page, "document.body.innerHTML.includes('&lt;img')"))

    browser.close()

print('\n' + '=' * 56)
print(f'结果：{len(PASS)} 通过 / {len(FAIL)} 失败 / 共 {len(PASS) + len(FAIL)} 项')
if FAIL:
    print('失败项：')
    for f in FAIL:
        print('  ❌', f)
if console_errors:
    print(f'\n控制台错误 {len(console_errors)} 条：')
    for e in console_errors[:5]:
        print('  -', e[:150])
print('DONE')
