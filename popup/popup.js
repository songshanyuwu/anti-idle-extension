/**
 * 视频挂机防暂停 - 弹窗逻辑
 * 管理 UI 交互、配置读写、消息通信
 */

// DOM 元素引用
const mainToggle = document.getElementById('mainToggle');
const optMouseMove = document.getElementById('optMouseMove');
const optPageScroll = document.getElementById('optPageScroll');
const optClick = document.getElementById('optClick');
const optKeyboard = document.getElementById('optKeyboard');
const speedRadios = document.querySelectorAll('input[name="speed"]');
const whitelistToggle = document.getElementById('whitelistToggle');
const whitelistSection = document.getElementById('whitelistSection');
const whitelistInput = document.getElementById('whitelistInput');
const whitelistAddBtn = document.getElementById('whitelistAddBtn');
const whitelistList = document.getElementById('whitelistList');
const whitelistHint = document.getElementById('whitelistHint');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');

// 默认配置
const defaultConfig = {
  enabled: false,
  mouseMove: true,
  pageScroll: true,
  occasionalClick: false,
  keyboardActivity: false,
  speed: 'medium',
  whitelistEnabled: false,
  whitelist: []
};

/**
 * 从 chrome.storage.local 加载配置
 */
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['antiIdleConfig'], (result) => {
      resolve(result.antiIdleConfig || { ...defaultConfig });
    });
  });
}

/**
 * 保存配置到 chrome.storage.local
 */
async function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ antiIdleConfig: config }, resolve);
  });
}

/**
 * 更新 UI 状态
 */
function updateUI(config) {
  mainToggle.checked = config.enabled;
  optMouseMove.checked = config.mouseMove;
  optPageScroll.checked = config.pageScroll;
  optClick.checked = config.occasionalClick;
  optKeyboard.checked = config.keyboardActivity;

  speedRadios.forEach(r => {
    r.checked = r.value === config.speed;
  });

  whitelistToggle.checked = config.whitelistEnabled;
  whitelistSection.style.display = config.whitelistEnabled ? 'flex' : 'none';

  renderWhitelist(config.whitelist);

  // 状态栏
  if (config.enabled) {
    statusBar.classList.add('active');
    statusText.textContent = '防暂停模式已开启';
  } else {
    statusBar.classList.remove('active');
    statusText.textContent = '已关闭';
  }
}

/**
 * 渲染白名单列表
 */
function renderWhitelist(whitelist) {
  whitelistList.innerHTML = '';
  whitelist.forEach((domain, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${domain}</span>
      <button data-index="${index}" title="删除">✕</button>
    `;
    whitelistList.appendChild(li);
  });

  // 绑定删除事件
  whitelistList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.index);
      const config = await loadConfig();
      config.whitelist.splice(idx, 1);
      await saveConfig(config);
      await notifyContentScript(config);
      updateUI(config);
    });
  });
}

/**
 * 收集当前 UI 配置
 */
function collectConfig() {
  const speed = Array.from(speedRadios).find(r => r.checked)?.value || 'medium';
  return {
    enabled: mainToggle.checked,
    mouseMove: optMouseMove.checked,
    pageScroll: optPageScroll.checked,
    occasionalClick: optClick.checked,
    keyboardActivity: optKeyboard.checked,
    speed,
    whitelistEnabled: whitelistToggle.checked,
    whitelist: [] // 白名单单独管理，这里不覆盖
  };
}

/**
 * 向 content script 和 background 发送配置更新消息
 */
async function notifyContentScript(config) {
  // 向 background 通知状态变更
  chrome.runtime.sendMessage({
    type: 'ANTI_IDLE_STATUS_CHANGE',
    config
  });

  // 向当前活动标签页的 content script 发送配置
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'ANTI_IDLE_UPDATE',
        config
      });
    }
  } catch (e) {
    // 忽略无法发送的情况（如无 content script）
  }
}

/**
 * 检查当前页面是否在白名单中
 */
async function checkWhitelist() {
  const config = await loadConfig();
  if (!config.whitelistEnabled) return true;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return false;

  try {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    const inWhitelist = config.whitelist.some(domain => {
      return hostname === domain || hostname.endsWith('.' + domain);
    });
    return inWhitelist;
  } catch {
    return false;
  }
}

/**
 * 显示白名单提示
 */
function showWhitelistHint(msg) {
  whitelistHint.textContent = msg;
  whitelistHint.style.display = 'block';
  setTimeout(() => {
    whitelistHint.style.display = 'none';
  }, 3000);
}

// 事件绑定：主开关
mainToggle.addEventListener('change', async () => {
  const config = await loadConfig();
  config.enabled = mainToggle.checked;

  // 如果开启且白名单模式生效，检查当前页面
  if (config.enabled && config.whitelistEnabled) {
    const inList = await checkWhitelist();
    if (!inList) {
      showWhitelistHint('当前页面不在白名单中，模拟可能不会生效');
    }
  }

  await saveConfig(config);
  await notifyContentScript(config);
  updateUI(config);
});

// 事件绑定：模拟选项
[optMouseMove, optPageScroll, optClick, optKeyboard].forEach(el => {
  el.addEventListener('change', async () => {
    const config = await loadConfig();
    const newConfig = collectConfig();
    config.mouseMove = newConfig.mouseMove;
    config.pageScroll = newConfig.pageScroll;
    config.occasionalClick = newConfig.occasionalClick;
    config.keyboardActivity = newConfig.keyboardActivity;
    await saveConfig(config);
    await notifyContentScript(config);
    updateUI(config);
  });
});

// 事件绑定：速度选择
speedRadios.forEach(radio => {
  radio.addEventListener('change', async () => {
    const config = await loadConfig();
    config.speed = radio.value;
    await saveConfig(config);
    await notifyContentScript(config);
    updateUI(config);
  });
});

// 事件绑定：白名单开关
whitelistToggle.addEventListener('change', async () => {
  const config = await loadConfig();
  config.whitelistEnabled = whitelistToggle.checked;
  await saveConfig(config);
  await notifyContentScript(config);
  updateUI(config);
});

// 事件绑定：添加白名单域名
whitelistAddBtn.addEventListener('click', async () => {
  const domain = whitelistInput.value.trim();
  if (!domain) return;

  // 简单格式校验
  if (!/^[\w.-]+$/.test(domain)) {
    showWhitelistHint('域名格式不正确');
    return;
  }

  const config = await loadConfig();
  if (config.whitelist.includes(domain)) {
    showWhitelistHint('该域名已在白名单中');
    return;
  }
  config.whitelist.push(domain);
  await saveConfig(config);
  await notifyContentScript(config);
  whitelistInput.value = '';
  updateUI(config);
});

// 回车添加白名单
whitelistInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') whitelistAddBtn.click();
});

// 初始化
(async () => {
  const config = await loadConfig();
  updateUI(config);
})();
