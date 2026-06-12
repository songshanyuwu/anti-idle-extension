/**
 * 视频挂机防暂停 - 后台服务脚本
 * 管理状态徽标和每个标签页的激活状态
 */

// 每个标签页的激活状态
const tabStates = {};

/**
 * 更新扩展图标徽标
 * @param {number} tabId - 标签页ID
 * @param {boolean} active - 是否激活
 */
function updateBadge(tabId, active) {
  if (active) {
    chrome.action.setBadgeText({ text: 'ON', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#34a853', tabId }); // 绿色
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
}

/**
 * 监听来自 popup 的状态变更消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANTI_IDLE_STATUS_CHANGE') {
    const config = message.config;

    // 查询当前活动标签页并更新徽标
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tabId = tabs[0].id;
        tabStates[tabId] = config.enabled;
        updateBadge(tabId, config.enabled);
      }
    });

    sendResponse({ success: true });
  }
  return true;
});

/**
 * 标签页关闭时清理状态
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabStates[tabId];
});

/**
 * 标签页切换时更新徽标
 */
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  updateBadge(tabId, !!tabStates[tabId]);
});

/**
 * 标签页更新时（如刷新）恢复状态
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && tabStates[tabId]) {
    // 页面加载完成后，从存储读取配置并通知 content script
    chrome.storage.local.get(['antiIdleConfig'], (result) => {
      if (result.antiIdleConfig && result.antiIdleConfig.enabled) {
        chrome.tabs.sendMessage(tabId, {
          type: 'ANTI_IDLE_UPDATE',
          config: result.antiIdleConfig
        }).catch(() => {});
      }
    });
  }
});
