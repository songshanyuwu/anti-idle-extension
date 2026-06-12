<div align="center">

# 🖱️ Anti-Idle — 视频挂机防暂停助手

**Chrome 浏览器插件，让视频网站以为你一直在看**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![No Dependencies](https://img.shields.io/badge/Dependencies-None-success)]()

模拟鼠标移动、页面滚动等自然用户行为，防止 B站、YouTube、腾讯视频等平台因检测到无活动而自动暂停播放。

[📖 安装使用](#-安装使用) · [⚙️ 功能介绍](#-功能介绍) · [🛡️ 隐私安全](#-隐私安全) · [🌍 多平台适用](#-适用平台)

</div>

---

## ✨ 为什么需要它？

看长视频、挂直播、放网课时，你是否遇到过这些烦恼？

- 🎬 看着看着突然弹出「**是否继续观看？**」
- 📺 画面自动降低画质甚至暂停
- 🔴 直播间因为无互动被标记为「不活跃」
- 📚 网课页面超时后自动跳转

这些平台通过检测鼠标移动、页面滚动、键盘输入等用户行为来判断你是否在场。**Anti-Idle** 就是在你开启后，自动模拟这些行为，让平台以为你一直在操作页面。

> 💡 **一句话总结**：你只需要点一下开启，剩下的交给插件。

---

## 📦 安装使用

### 方式一：开发者模式加载（推荐）

1. 下载本仓库 ZIP 或克隆到本地：
   ```bash
   git clone https://github.com/你的用户名/anti-idle-extension.git
   ```
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角 **开发者模式**
4. 点击 **「加载已解压的扩展程序」**
5. 选择 `anti-idle-extension` 文件夹
6. 🎉 工具栏出现插件图标，点击即可使用

### 方式二：从 Chrome Web Store 安装（如已发布）

前往 Chrome Web Store 搜索「**Anti-Idle**」点击安装。

---

## ⚙️ 功能介绍

| 功能 | 说明 | 默认 |
|------|------|------|
| 🖱️ **鼠标晃动** | 页面上可见的蓝色光标箭头，在视口中心附近自然小幅移动 | ✅ 开启 |
| 📜 **页面微滚动** | 真实滚动页面 ±20~80px 后自动回弹，不影响观看位置 | ✅ 开启 |
| 👆 **偶尔点击** | 模拟点击页面空白区域，分发完整的 mousedown→mouseup→click 事件链 | ❌ 关闭 |
| ⌨️ **键盘活动** | 模拟方向键等安全按键（自动排除 F5 等危险按键） | ❌ 关闭 |
| ⚡ **速度三档** | 慢速(×2.5) / 中速 / 快速(×0.4)，所有间隔自动调整 | 中速 |
| 📋 **白名单模式** | 限定仅在指定域名上生效，避免在无关页面误触发 | ❌ 关闭 |

### 模拟行为细节

- 🎲 **随机间隔 + ±30% 抖动**：每次操作的间隔时间都随机变化，避免被固定模式检测
- 🔄 **平滑过渡**：鼠标光标使用 CSS cubic-bezier 缓动曲线移动，模拟真实手部运动
- 👁️ **视觉反馈**：蓝色半透明箭头光标每次移动后显示 2 秒再淡出，清晰可知插件在工作
- ⏱️ **滚动回弹**：页面滚动 1.5~3 秒后自动平滑回到原位

---

## 🎯 适用平台

本插件通过模拟标准 DOM 事件工作，理论上适用于所有基于用户活动检测的网站：

| 平台 | 支持情况 |
|------|---------|
| 📺 Bilibili (B站) | ✅ 完美支持 |
| 🎵 YouTube | ✅ 完美支持 |
| 🎬 腾讯视频 | ✅ 完美支持 |
| 📺 爱奇艺 | ✅ 完美支持 |
| 🎓 各类网课平台 | ✅ 完美支持 |
| 🔴 直播平台 | ✅ 支持 |
| 🎮 其他网页 | ✅ 通用 |

---

## 🛡️ 隐私安全

<div align="center">
<table>
<tr><td>

🔒 **完全离线运行**
</td><td>

所有操作均在本地浏览器内执行，**不联网、不上传、不收集任何数据**
</td></tr>
<tr><td>

🚫 **零网络权限**
</td><td>

不请求 `webRequest`、`tabs` 等网络相关权限，仅使用 `storage` 和 `activeTab`
</td></tr>
<tr><td>

📦 **零第三方依赖**
</td><td>

纯 Vanilla JS 编写，不引入任何外部库，代码完全可控
</td></tr>
<tr><td>

👁️ **透明开源**
</td><td>

全部源码开放，你可以审查每一行代码
</td></tr>
<tr><td>

👋 **手动控制**
</td><td>

默认关闭，仅在用户**主动开启**后才生效，随时可关闭
</td></tr>
</table>
</div>

---

## 🏗️ 技术架构

```
anti-idle-extension/
├── manifest.json              # Manifest V3 配置清单
├── popup/
│   ├── popup.html             # 控制面板 UI
│   ├── popup.css              # Chrome 风格样式
│   └── popup.js               # 面板交互 & 配置管理
├── content/
│   └── content.js             # 核心模拟引擎（鼠标/滚动/点击/键盘）
├── background/
│   └── service-worker.js     # 后台状态管理 & 徽标控制
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png            # 插件图标
└── README.md
```

**核心技术点**：
- **Manifest V3**：基于 Chrome 最新扩展标准
- **真实 DOM 事件**：`MouseEvent`、`WheelEvent`、`KeyboardEvent`，非 hack 方式
- **可见光标元素**：CSS 三角形箭头 + `transition` 平滑移动
- **`window.scrollBy`**：真实页面滚动，非仅事件模拟
- **chrome.storage.local**：配置持久化，刷新页面后自动恢复状态

---

## 📝 使用须知

⚠️ 本工具仅供**个人学习和研究用途**，请遵守各平台的服务条款。
开发者不对因使用本插件导致的任何账号风险承担责任。

---

## 📄 开源协议

[MIT License](LICENSE) © 2025

---

<div align="center">

**⭐ 觉得有用？给个 Star 吧！**

有问题或建议？欢迎提交 [Issue](../../issues)

</div>
