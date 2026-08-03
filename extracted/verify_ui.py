# 验证 Linux命令斩 index.html：语法运行、界面截图、XSS 修复、容错
import sys
from playwright.sync_api import sync_playwright

URL = 'file:///D:/linux命令斩/index.html'
OUT = 'D:/linux命令斩/extracted/shots'
import os
os.makedirs(OUT, exist_ok=True)

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))

    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(400)

    # 0. 跳过首次引导
    if page.locator('#ov-onboard.show').count():
        page.click('text=跳过，直接开刷')
        page.wait_for_timeout(200)

    page.screenshot(path=f'{OUT}/1_start.png', full_page=True)

    # 1. XSS 修复验证：构造带引号的恶意数据渲染错题本，不应执行注入
    page.evaluate("""() => {
      stats.wrongBook.push({a: "x');alert('pwned');//", meaning: "测试", answers: ["x');alert(1);//"], en: "", cat: "测试", times: 2, lastSeen: "2026-08-01"});
      renderWrongBook();
    }""")
    page.wait_for_timeout(300)
    page.screenshot(path=f'{OUT}/2_wrongbook_xss.png')

    # 2. 打字模式答题流程
    page.click('#tab-quiz')
    page.evaluate("startQuiz()")
    page.wait_for_timeout(300)
    page.screenshot(path=f'{OUT}/3_quiz_typing.png')
    # 空提交不应锁死（submit bug 修复验证）
    page.evaluate("submit()")
    ok_after_empty = page.evaluate("!document.getElementById('btn-submit').disabled && !answered")
    print('空提交后可继续作答:', ok_after_empty)
    # 答一题
    ans = page.evaluate("round[qIdx].answers[0]")
    page.fill('#answer', ans)
    page.evaluate("submit()")
    page.wait_for_timeout(300)
    page.screenshot(path=f'{OUT}/4_feedback.png')

    # 3. 选择题模式界面
    page.evaluate("qtype='choice'; renderQ()")
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/5_choice.png')

    # 4. 闪卡模式界面
    page.evaluate("qtype='flash'; renderQ()")
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/6_flash.png')

    # 5. 学习页
    page.evaluate("showTab('learn')")
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/7_learn.png', full_page=True)

    # 6. 战绩页
    page.evaluate("showTab('stats')")
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/8_stats.png', full_page=True)

    # 7. localStorage 损坏容错验证
    page.evaluate("localStorage.setItem('linux-quiz-stats-v3', '{corrupted!!')")
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(400)
    alive = page.evaluate("typeof startQuiz === 'function' && document.getElementById('greet').textContent.length > 0")
    print('损坏数据后应用正常启动:', alive)
    page.screenshot(path=f'{OUT}/9_recovery.png')

    browser.close()

js_errors = [e for e in errors if 'Alert' not in e]
print('控制台错误数:', len(js_errors))
for e in js_errors[:5]:
    print('  -', e[:200])
print('DONE')
