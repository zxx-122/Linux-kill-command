# 视口截图：模拟手机实际显示效果
import os
from playwright.sync_api import sync_playwright

URL = 'file:///D:/linux命令斩/index.html'
OUT = 'D:/linux命令斩/extracted/shots'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.goto(URL)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(400)
    if page.locator('#ov-onboard.show').count():
        page.click('text=跳过，直接开刷')
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/v_top.png')
    page.evaluate("window.scrollTo(0, 700)")
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/v_mid.png')
    page.evaluate("window.scrollTo(0, 99999)")
    page.wait_for_timeout(200)
    page.screenshot(path=f'{OUT}/v_bottom.png')
    # 结算页
    page.evaluate("""() => {
      startQuiz();
      for (let i = 0; i < round.length; i++) { touchDay(); stats.total++; stats.right++; stats.score += 10; }
      score = 185; maxStreak = 12; wrongThisRound = [{q: round[0], userAns: 'xx'}];
      finish();
    }""")
    page.wait_for_timeout(400)
    page.screenshot(path=f'{OUT}/v_result.png')
    browser.close()
print('DONE')
