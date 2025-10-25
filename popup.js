document.addEventListener("DOMContentLoaded", () => {
    const speedSlider = document.getElementById("speedSlider");
    const speedValue = document.getElementById("speedValue");
    const maxSlider = document.getElementById("maxSlider");
    const maxValue = document.getElementById("maxValue");
    const stepSlider = document.getElementById("stepSlider");
    const stepValue = document.getElementById("stepValue");
    const adSpeedupCheckbox = document.getElementById("adSpeedup");
    const applyButton = document.getElementById("apply");
  
    // Load saved settings
    chrome.storage.sync.get(["playbackSpeed", "maxSpeed", "sliderStep", "speedUpAds"], (data) => {
      speedSlider.value = data.playbackSpeed || 1;
      speedValue.textContent = `${speedSlider.value}x`;
      maxSlider.value = data.maxSpeed || 16;
      maxValue.textContent = `${maxSlider.value}x`;
      stepSlider.value = data.sliderStep || 0.25;
      stepValue.textContent = `${stepSlider.value}x`;
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

        // Update max speed for slider
    stepSlider.addEventListener("input", () => {
      stepValue.textContent = `${stepSlider.value}x`;
    });
  
    // Apply settings on button click
    applyButton.addEventListener("click", () => {
      const speed = parseFloat(speedSlider.value);
      const max = parseFloat(maxSlider.value);
      const step = parseFloat(stepSlider.value);
      const speedUpAds = adSpeedupCheckbox.checked;
  
      // Save settings
      chrome.storage.sync.set({ playbackSpeed: speed, maxSpeed: max, sliderStep: step, speedUpAds: speedUpAds });
  
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateSpeed",
          speed: speed,
          max: max,
          step: step,
          speedUpAds: speedUpAds
        });
      });
      //Close the popup
      window.close();
    });
  });
