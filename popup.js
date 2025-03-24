document.addEventListener("DOMContentLoaded", () => {
    const speedSlider = document.getElementById("speedSlider");
    const speedValue = document.getElementById("speedValue");
    const maxSlider = document.getElementById("maxSlider");
    const maxValue = document.getElementById("maxValue");
    const adSpeedupCheckbox = document.getElementById("adSpeedup");
    const applyButton = document.getElementById("apply");
  
    // Load saved settings
    chrome.storage.sync.get(["playbackSpeed", "maxSpeed", "speedUpAds"], (data) => {
      speedSlider.value = data.playbackSpeed || 1;
      speedValue.textContent = `${speedSlider.value}x`;
      maxSlider.value = data.maxSpeed || 16;
      maxValue.textContent = `${maxSlider.value}x`;
      adSpeedupCheckbox.checked = data.speedUpAds || false;
    });
  
    // Update speed display in real-time
    speedSlider.addEventListener("input", () => {
      speedValue.textContent = `${speedSlider.value}x`;
    });

    // Update max speed for slider
    maxSlider.addEventListener("input", () => {
      maxValue.textContent = `${maxSlider.value}x`;
    });
  
    // Apply settings on button click
    applyButton.addEventListener("click", () => {
      const speed = parseFloat(speedSlider.value);
      const max = parseFloat(maxSlider.value);
      const speedUpAds = adSpeedupCheckbox.checked;
  
      // Save settings
      chrome.storage.sync.set({ playbackSpeed: speed, maxSpeed: max, speedUpAds: speedUpAds });
  
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSpeed",
          speed: speed,
          max: max,
          speedUpAds: speedUpAds
        });
      });
    });
  });
