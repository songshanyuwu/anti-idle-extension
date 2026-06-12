/**
 * 视频挂机防暂停 - 内容脚本（核心模拟逻辑）
 * 
 * 通过创建一个可见的模拟鼠标光标元素，在页面上真实移动它，
 * 同时分发 DOM 事件给网站，确保既有视觉反馈又能被网站检测到。
 * 页面滚动通过真实的 window.scrollBy 实现。
 */

// 当前模拟状态
let isActive = false;
// 各模拟定时器 ID
let mouseTimer = null;
let scrollTimer = null;
let clickTimer = null;
let keyTimer = null;
// 当前配置
let config = {
  enabled: false,
  mouseMove: true,
  pageScroll: true,
  occasionalClick: false,
  keyboardActivity: false,
  speed: 'medium',
  whitelistEnabled: false,
  whitelist: []
};

// 速度倍率映射
const SPEED_MULTIPLIER = { slow: 2.5, medium: 1, fast: 0.4 };

// 模拟鼠标光标 DOM 元素
let cursorEl = null;
// 光标当前位置（相对于视口）
let cursorX = 0;
let cursorY = 0;
// 鼠标光标显示计时器
let cursorHideTimer = null;
// 页面原始滚动位置（用于滚动回弹）
let scrollOrigin = 0;

/**
 * 获取带抖动的随机间隔（毫秒）
 */
function randomInterval(base) {
  const multiplier = SPEED_MULTIPLIER[config.speed] || 1;
  const jitter = 1 + (Math.random() * 0.6 - 0.3); // ±30% 抖动
  return Math.round(base * 1000 * multiplier * jitter);
}

/** 获取指定范围内的随机整数 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== 模拟鼠标光标 UI ====================

/**
 * 创建模拟鼠标光标元素（可见的箭头光标）
 */
function createCursorElement() {
  if (cursorEl) return;
  cursorEl = document.createElement('div');
  cursorEl.id = 'anti-idle-cursor';
  // 使用 CSS 绘制一个鼠标箭头形状
  Object.assign(cursorEl.style, {
    position: 'fixed',
    zIndex: '2147483647',     // 最高层级，确保可见
    pointerEvents: 'none',     // 不影响页面交互
    width: '0',
    height: '0',
    borderLeft: '12px solid transparent',
    borderRight: '12px solid transparent',
    borderTop: '22px solid rgba(0, 120, 215, 0.7)',  // Chrome 蓝色半透明箭头
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
    transform: 'rotate(-45deg)',
    transformOrigin: 'center bottom',
    transition: 'left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    display: 'none',
    opacity: '1'
  });
  document.documentElement.appendChild(cursorEl);
}

/**
 * 移除模拟鼠标光标元素
 */
function removeCursorElement() {
  if (cursorEl) {
    cursorEl.remove();
    cursorEl = null;
  }
}

/**
 * 显示光标并自动隐藏
 */
function flashCursor() {
  if (!cursorEl) return;
  cursorEl.style.display = 'block';
  cursorEl.style.opacity = '1';
  clearTimeout(cursorHideTimer);
  cursorHideTimer = setTimeout(() => {
    if (cursorEl) {
      cursorEl.style.opacity = '0';
      setTimeout(() => {
        if (cursorEl) cursorEl.style.display = 'none';
      }, 600);
    }
  }, 2000); // 显示2秒后淡出
}

/**
 * 移动模拟光标到指定位置
 */
function moveCursorTo(x, y) {
  if (!cursorEl) return;
  // CSS border三角形箭头的中心偏移修正
  cursorEl.style.left = (x - 6) + 'px';
  cursorEl.style.top = (y - 20) + 'px';
  flashCursor();
}

// ==================== 模拟事件分发 ====================

/**
 * 在指定坐标分发完整的鼠标事件链
 */
function dispatchMouseEventsAt(x, y, eventType) {
  // 找到坐标下的目标元素
  const el = document.elementFromPoint(x, y) || document.body;
  const commonProps = {
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    bubbles: true,
    cancelable: true,
    view: window
  };

  if (eventType === 'move') {
    // 先移动光标过去
    moveCursorTo(x, y);
    // 分发 mousemove
    el.dispatchEvent(new MouseEvent('mousemove', { ...commonProps, button: 0 }));
    document.dispatchEvent(new MouseEvent('mousemove', { ...commonProps, button: 0 }));
    // 分发 mouseover 增加真实性
    el.dispatchEvent(new MouseEvent('mouseover', { ...commonProps }));
  } else if (eventType === 'click') {
    moveCursorTo(x, y);
    // 完整点击事件链：down → up → click
    el.dispatchEvent(new MouseEvent('mousedown', { ...commonProps, button: 0 }));
    setTimeout(() => {
      el.dispatchEvent(new MouseEvent('mouseup', { ...commonProps, button: 0 }));
      el.dispatchEvent(new MouseEvent('click', { ...commonProps, button: 0 }));
    }, randInt(50, 150));
  }
}

// ==================== 各模拟功能 ====================

/**
 * 模拟鼠标移动：在页面中心附近小幅晃动
 */
function simulateMouseMove() {
  // 初始位置：视口中心
  const cx = Math.round(window.innerWidth / 2);
  const cy = Math.round(window.innerHeight / 2);

  // 小幅随机偏移
  const x = cx + randInt(-30, 30);
  const y = cy + randInt(-30, 30);

  cursorX = x;
  cursorY = y;

  dispatchMouseEventsAt(x, y, 'move');
}

/**
 * 模拟页面微滚动：真实滚动页面后回滚
 */
function simulateScroll() {
  scrollOrigin = window.scrollY || window.pageYOffset;
  const delta = randInt(20, 80) * (Math.random() > 0.5 ? 1 : -1);

  // 真实滚动页面
  window.scrollBy({ top: delta, behavior: 'smooth' });

  // 同时分发 wheel 事件给网站
  const wheelEvent = new WheelEvent('wheel', {
    deltaY: delta,
    deltaMode: 0,
    bubbles: true,
    cancelable: true,
    view: window
  });
  document.dispatchEvent(wheelEvent);

  // 短暂延迟后回滚到原位
  setTimeout(() => {
    window.scrollTo({ top: scrollOrigin, behavior: 'smooth' });
  }, randInt(1500, 3000));
}

/**
 * 模拟偶尔点击（页面中心安全区域）
 */
function simulateClick() {
  const x = Math.round(window.innerWidth / 2) + randInt(-50, 50);
  const y = Math.round(window.innerHeight / 2) + randInt(-50, 50);
  dispatchMouseEventsAt(x, y, 'click');
}

/**
 * 模拟键盘活动（安全按键，排除 F5 刷新）
 */
function simulateKeyboard() {
  const safeKeys = [
    { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
    { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    { key: 'PageDown', code: 'PageDown', keyCode: 34 },
    { key: 'PageUp', code: 'PageUp', keyCode: 33 }
  ];
  const chosen = safeKeys[randInt(0, safeKeys.length - 1)];

  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: chosen.key, code: chosen.code, keyCode: chosen.keyCode,
    bubbles: true, cancelable: true, view: window
  }));
  setTimeout(() => {
    document.dispatchEvent(new KeyboardEvent('keyup', {
      key: chosen.key, code: chosen.code, keyCode: chosen.keyCode,
      bubbles: true, cancelable: true, view: window
    }));
  }, randInt(30, 100));
}

// ==================== 模拟循环控制 ====================

function startMouseSimulation() {
  if (mouseTimer) clearTimeout(mouseTimer);
  function loop() {
    if (!isActive || !config.mouseMove) return;
    simulateMouseMove();
    mouseTimer = setTimeout(loop, randomInterval(randInt(3, 10)));
  }
  loop();
}

function startScrollSimulation() {
  if (scrollTimer) clearTimeout(scrollTimer);
  function loop() {
    if (!isActive || !config.pageScroll) return;
    simulateScroll();
    scrollTimer = setTimeout(loop, randomInterval(randInt(10, 20)));
  }
  loop();
}

function startClickSimulation() {
  if (clickTimer) clearTimeout(clickTimer);
  function loop() {
    if (!isActive || !config.occasionalClick) return;
    simulateClick();
    clickTimer = setTimeout(loop, randomInterval(randInt(30, 60)));
  }
  loop();
}

function startKeySimulation() {
  if (keyTimer) clearTimeout(keyTimer);
  function loop() {
    if (!isActive || !config.keyboardActivity) return;
    simulateKeyboard();
    keyTimer = setTimeout(loop, randomInterval(randInt(40, 80)));
  }
  loop();
}

function startAll() {
  isActive = true;
  createCursorElement();
  if (config.mouseMove) startMouseSimulation();
  if (config.pageScroll) startScrollSimulation();
  if (config.occasionalClick) startClickSimulation();
  if (config.keyboardActivity) startKeySimulation();
}

function stopAll() {
  isActive = false;
  clearTimeout(mouseTimer); mouseTimer = null;
  clearTimeout(scrollTimer); scrollTimer = null;
  clearTimeout(clickTimer); clickTimer = null;
  clearTimeout(keyTimer); keyTimer = null;
  clearTimeout(cursorHideTimer); cursorHideTimer = null;
  removeCursorElement();
}

// ==================== 消息监听 ====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANTI_IDLE_UPDATE') {
    const prevActive = isActive;
    config = { ...config, ...message.config };

    if (config.enabled) {
      if (prevActive) stopAll();
      startAll();
    } else {
      stopAll();
    }
    sendResponse({ success: true, active: isActive });
  } else if (message.type === 'ANTI_IDLE_GET_STATE') {
    sendResponse({ active: isActive, config: config });
  }
  return true;
});

// ==================== 初始化 ====================

// 从 storage 恢复配置（如页面刷新后自动恢复运行状态）
chrome.storage.local.get(['antiIdleConfig'], (result) => {
  if (result.antiIdleConfig) {
    config = { ...config, ...result.antiIdleConfig };
    if (config.enabled) {
      startAll();
    }
  }
});
