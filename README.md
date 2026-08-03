# 🐧 Linux 命令斩

> 看中文意思，输入英文命令 · 像背单词一样学 Linux 命令

一款面向手机端的 Linux 命令练习 App（HTML 单文件 + Capacitor 打包 Android APK）。内置 367 道命令/参数题目，覆盖 30 个分类，从入门常用命令到 Git、容器、数据库等硬核内容。

![练习](./extracted/shots/1_start.png)

## ✨ 功能特性

### 练习模式
- **⌨️ 打字模式**：看中文意思，手动输入英文命令（真功夫）
- **🔘 选择题**：四选一，适合快速刷题
- **🃏 闪卡模式**：看题面 → 翻答案 → 认识 / 不认识，超快刷词

### 难度与范围
- **🌱 基础模式**：常用命令 + 参数速记，新手友好
- **🧠 进阶模式**：运维、网络、Git、容器、编译、数据库等硬核内容
- 支持按分类筛选题目范围，收藏的题目优先出题

### 记忆与反馈
- **错题本**：答错的题自动收录，答对自动「毕业」移除
- **每日目标 + 连续打卡**：每日题数目标、天数激励、称号晋级（菜鸟 → 宗师）
- **限时挑战**：每题 20 秒倒计时，超时算错
- 答错即时显示正确答案、英文全称记法和命令示例

### 学习与统计
- **命令大全**：搜索命令 / 中文意思 / 英文全称，查看详细释义与示例
- **战绩页**：最近 7 天打卡柱状图、分类掌握度、累计数据、常错命令 Top5
- 数据保存在手机本地（localStorage），不会上传

### 体验细节
- 中文 / 英文语音发音（系统 TTS）、答对答错音效、震动反馈
- 首字母提示（扣 3 分）、连对加分、成绩分享

## 📱 安装

直接安装 APK：下载 `Linux命令斩_v4.apk` 到手机，允许「安装未知来源应用」后安装。

> 也可以通过浏览器直接打开 `index.html` 使用。

## 🛠️ 开发与构建

项目为纯 HTML/CSS/JS 单文件应用，无框架依赖，数据持久化使用 localStorage。

### 目录结构

```
Linux-kill-command/
├── index.html                # 应用主文件（构建产物，可直接使用）
├── Linux命令斩_v4.apk        # 打包好的 Android APK
└── extracted/                # 构建与测试工具
    ├── index.html            # 构建前源码（旧版）
    ├── new_questions.js      # v4 新增题库（Git/容器/数据库等）
    ├── build.js              # 构建脚本：合并题库 → 生成 index.html
    ├── parse_questions.js    # 从源码提取题库到 questions.json
    ├── rebuild_apk.py        # 把新 index.html 回填进 APK 并剔除旧签名
    ├── uber-apk-signer.jar   # APK 重新签名工具
    ├── verify.js             # 构建产物静态校验（题库/语法/元素）
    ├── make_test.js          # 冒烟测试生成器（headless Chrome）
    ├── make_test2.js         # 难度模式专项测试
    ├── test_full.py          # Playwright 端到端全功能测试
    ├── verify_ui.py          # UI 截图 + XSS + 容错验证
    └── verify_view.py        # 手机视口截图
```

### 构建步骤

```bash
# 1. 重新构建 index.html（合并旧题库 + 新增题库）
node extracted/build.js

# 2. 静态校验构建产物
node extracted/verify.js

# 3. 回填 APK 并重新签名
python extracted/rebuild_apk.py
java -jar extracted/uber-apk-signer.jar --apks Linux命令斩_v4.apk
```

### 测试

```bash
# Node 冒烟测试（需 headless Chrome）
node extracted/make_test.js   # 生成 test.html
node extracted/make_test2.js  # 生成 test2.html

# Playwright 端到端测试（需 Python + playwright）
python extracted/test_full.py
```

## 📚 题库

共 **367 题 · 30 个分类**，包括：

| 难度 | 分类 |
|------|------|
| 基础 | 目录文件、内容查看、文本处理、文件搜索、权限、压缩、系统信息、硬件、进程、编辑器/Shell、参数速记、文件工具、系统工具 |
| 进阶 | 服务、磁盘、网络、用户、定时任务、包管理、排障/安全、Git 版本控制、容器与云、Shell 技巧、正则与数据处理、编译与调试、性能监控、安全加固、网络补充、包管理补充、数据库 |

## 📄 许可

本项目仅供个人学习使用。题库内容参考自《Linux 命令大全》，图标为 Tux 企鹅（Linux 吉祥物）。

---

Powered by 🐧 Tux
