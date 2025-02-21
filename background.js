chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "injectYouTubeAPI") {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: () => {
          if (!window.YT) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
          }
        }
      });
    }
  });
