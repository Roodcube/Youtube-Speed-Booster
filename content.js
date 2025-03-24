let currentSpeed = 1;
let maxSpeed = 16;
let speedUpAds = false;
let wasMutedBeforeAd = false;
let sliderActive = false;
let settingButtonLoaded = false;
let originalQuality = null;
let adTimeout = null;
let ytPlayer = null;
let ytSpeed = null;

console.log("content.js loaded");

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateSpeed") {
    currentSpeed = message.speed;
    maxSpeed = message.max
    speedUpAds = message.speedUpAds;
    console.log("Message received - speed:", currentSpeed, "speedUpAds:", speedUpAds);

    if (maxSpeed < currentSpeed){
      currentSpeed = maxSpeed;
    }

    updatePlaybackSpeedMuteAndQuality();
    updateSliderValue(); // Sync slider with popup input
  }
});

function updatePlaybackSpeedMuteAndQuality() {
  //console.log("updatePlaybackSpeedMuteAndQuality called");
  const video = document.querySelector("video");
  if (!video) {
    //console.log("No video element found");
    return;
  }
  //console.log("Video element found");

  const adElement = document.querySelector(".ad-showing");
  if (adElement && speedUpAds) {
    //console.log("Ad detected");
    if (!video.muted) {
      wasMutedBeforeAd = false;
      video.muted = true;
    } else {
      wasMutedBeforeAd = true;
    }

    adTimeout = setTimeout(() => {
      video.playbackRate = 16;
    }, 1500);
    //console.log("Set speed to 16x");

  } else if (adElement){
    //console.log("Ad detected, but not sped up.");
    video.playbackRate = 1;

  } else {
    //console.log("No ad, setting speed to", currentSpeed);

    if (null != adTimeout){
      video.pause();
      clearTimeout(adTimeout);
      adTimeout = null;
      video.play();
    }

    video.playbackRate = currentSpeed;
    if (speedUpAds && !wasMutedBeforeAd) {
      video.muted = false;
    }
  }
}

function injectCustomSlider() {
  console.log("injectCustomSlider called");

  const settingsMenu = document.querySelector(".ytp-settings-button");
  if (!settingsMenu) {
    console.log("Settings menu not found yet");
    return;
  }

  // Replace speed submenu content when clicked
    const speedPanel = document.querySelector(".ytp-panel-menu[role='menu']");
    if (speedPanel) {
      // Log panel content for debugging
      const items = Array.from(speedPanel.querySelectorAll(".ytp-menuitem"));
      console.log("Speed panel items:", items.map(item => item.textContent));

      const isQualityPanel = items.some(item => item.textContent.match(/^Quality/));
      if (!isQualityPanel) {
        console.log("No Quality panel, skipping injection");
        return;
      }

      // Inject custom slider
      const sliderContainer = document.createElement("div");
      sliderContainer.className = "ytp-menuitem";
      sliderContainer.ariaHasPopup = "false";
sliderContainer.setAttribute("role", "menuitem"); // Match YouTube's structure
      sliderContainer.tabIndex = "0";
      sliderContainer.style.accentColor = "#ff0931";
      /*sliderContainer.innerHTML = `
        <input type="range" id="custom-speed-slider" min="0.25" max="16" step="0.25" value="${currentSpeed}">
        <span id="speed-value" style="margin-left: 10px;">${currentSpeed}x</span>
      `;*/

      //sliderContainer.innerHTML = `<div class="ytp-menuitem-icon"><svg height="24" viewBox="0 0 24 24" width="24"><path d="M10,8v8l6-4L10,8L10,8z M6.3,5L5.7,4.2C7.2,3,9,2.2,11,2l0.1,1C9.3,3.2,7.7,3.9,6.3,5z            M5,6.3L4.2,5.7C3,7.2,2.2,9,2,11 l1,.1C3.2,9.3,3.9,7.7,5,6.3z            M5,17.7c-1.1-1.4-1.8-3.1-2-4.8L2,13c0.2,2,1,3.8,2.2,5.4L5,17.7z            M11.1,21c-1.8-0.2-3.4-0.9-4.8-2 l-0.6,.8C7.2,21,9,21.8,11,22L11.1,21z            M22,12c0-5.2-3.9-9.4-9-10l-0.1,1c4.6,.5,8.1,4.3,8.1,9s-3.5,8.5-8.1,9l0.1,1 C18.2,21.5,22,17.2,22,12z" fill="white"></path></svg></div><div class="ytp-menuitem-label" style="margin-right: 8px;">Speed</div><div class="ytp-menuitem-content"><div style="display: flex; align-items: center;"><input type="range" id="custom-speed-slider" min="0.25" max="${maxSpeed}" step="0.25" value="${currentSpeed}" style="margin: 0px 10px;"><span id="speed-value" style="display: inline-block; width: 25px; text-align: left; margin: 0px 5px;">${currentSpeed}x</span></div>`;
      sliderContainer.innerHTML = `<div class="ytp-menuitem-icon"><svg height="24" viewBox="0 0 24 24" width="24"><path d="M10,8v8l6-4L10,8L10,8z M6.3,5L5.7,4.2C7.2,3,9,2.2,11,2l0.1,1C9.3,3.2,7.7,3.9,6.3,5z            M5,6.3L4.2,5.7C3,7.2,2.2,9,2,11 l1,.1C3.2,9.3,3.9,7.7,5,6.3z            M5,17.7c-1.1-1.4-1.8-3.1-2-4.8L2,13c0.2,2,1,3.8,2.2,5.4L5,17.7z            M11.1,21c-1.8-0.2-3.4-0.9-4.8-2 l-0.6,.8C7.2,21,9,21.8,11,22L11.1,21z            M22,12c0-5.2-3.9-9.4-9-10l-0.1,1c4.6,.5,8.1,4.3,8.1,9s-3.5,8.5-8.1,9l0.1,1 C18.2,21.5,22,17.2,22,12z" fill="white"></path></svg></div><div class="ytp-menuitem-label" style="margin-right: 0px;">Speed:<span class="ytp-menu-label-secondary" id="speed-value" style="display: inline-block; width: 20px; text-align: left; margin: 0px 5px;">${currentSpeed}x</span></div><div class="ytp-menuitem-content"><div style="display: flex; align-items: left;"><input type="range" id="custom-speed-slider" min="0.25" max="${maxSpeed}" step="0.25" value="${currentSpeed}" style="margin: 0px 10px;"></div>`;
      //console.log("Speed panel detected, content before modification:", speedPanel.innerHTML);

      // Remove only speed-related options
      const speedOptions = speedPanel.querySelectorAll(".ytp-menuitem");
      speedOptions.forEach(option => console.log("Menu item:", option.textContent));

      speedOptions.forEach(option => {
        if (option.textContent.match(/^Playback/)){
          ytSpeed = option;
        }
        if (option.textContent.match(/^Playback|^Speed/)) {
          //option.parentNode.removeChild(option);
            option.replaceWith(sliderContainer);

        }
      });

      const slider = document.getElementById("custom-speed-slider");
      const speedValue = document.getElementById("speed-value");
      slider.style.width = "120px";

      // Function to update slider size based on full-screen state
      function updateSliderSize() {
        const isFullscreen = document.querySelector(".ytp-fullscreen") !== null;
        //console.log("Full-screen mode:", isFullscreen);

        if (isFullscreen) {
          slider.style.scale = 1.25;
          slider.style.margin = "0px 15px";
        } else {
          slider.style.scale = 1;
          slider.style.margin = "0px 10px";
        }
      }

      // Initial size update
      updateSliderSize();

      // Listen for full-screen changes
      const player = document.querySelector(".html5-video-player");
      if (player) {
        player.addEventListener("webkitfullscreenchange", updateSliderSize);
        player.addEventListener("mozfullscreenchange", updateSliderSize);
        player.addEventListener("fullscreenchange", updateSliderSize);
        player.addEventListener("MSFullscreenChange", updateSliderSize);
      }

      // Fallback: Use MutationObserver to detect .ytp-fullscreen class changes
      const fullscreenObserver = new MutationObserver(() => {
        updateSliderSize();
      });
      
      fullscreenObserver.observe(player || document.body, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true
      });

      slider.addEventListener("input", (e) => {
        currentSpeed = parseFloat(e.target.value);
        speedValue.textContent = `${currentSpeed}x`;
        //  console.log("Slider updated speed to:", currentSpeed);
        updatePlaybackSpeedMuteAndQuality();
      });
    }

}

function updateSliderValue() {
  const slider = document.getElementById("custom-speed-slider");
  const speedValue = document.getElementById("speed-value");
  if (slider && speedValue) {
    slider.value = currentSpeed;
    speedValue.textContent = `${currentSpeed}x`;
    console.log("Updated slider value to:", currentSpeed);
  }
}

// content.js or background.js
function isYouTubeVideoPage(url = window.location.href) {
  const videoPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/i, // Standard video
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{11}/i,  // Shorts
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}(?![?&]autoplay=)/i, // Embed
    /^https?:\/\/youtu\.be\/[\w-]{11}/i                      // Shortened link
  ];

  return videoPatterns.some(pattern => pattern.test(url));
}

function monitorVideo() {
  //console.log("monitorVideo called");
  const observer = new MutationObserver(() => {
    //console.log("Mutation observed");

    if (isYouTubeVideoPage()){
      setTimeout(() => {
      //While the settings button has not loaded
        while(!settingButtonLoaded){
          console.log("Waiting for Settings Button");
          //Look for the settings button
          const settingsButton = document.querySelector(".ytp-settings-button");
  
          //If it doesn't exit
          if (!settingsButton){
            settingButtonLoaded = false;
            continue;
  
          //If the button exists
          } else {
            settingButtonLoaded = true;
            setTimeout(function(){settingsButton.click()}, 5);    //Initialize the settings controls
            setTimeout(function(){settingsButton.click()}, 5);    //Close the settings menu
            
            //Create an event listener to inject the speed slider while the menu is open
            settingsButton.addEventListener("mousedown", () => {
              injectCustomSlider();
              sliderActive = true;
            });
        
            //Revert to default menu options when the menu is closed
            settingsButton.addEventListener("mouseup", function(){sliderActive = false;});
            settingsButton.addEventListener("mouseleave", function(){sliderActive = false;});
          }
        }
      }, 1000);
    }

    const speedPanel = document.querySelector(".ytp-panel-menu[role='menu']");
    const settingsMenu = document.querySelector('.ytp-settings-menu');

    if (!sliderActive && settingsMenu && settingsMenu.style.display == 'none' && speedPanel){
      const speedOptions = speedPanel.querySelectorAll(".ytp-menuitem");
      speedOptions.forEach(option => {
        if (option.textContent.match(/^Speed/)) {
            option.replaceWith(ytSpeed);
            console.log("Original Speed Option Restored");
        }
      });
    }
    updatePlaybackSpeedMuteAndQuality();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  updatePlaybackSpeedMuteAndQuality();
}

console.log("Running monitorVideo on load");
monitorVideo();

window.addEventListener("yt-navigate-finish", () => {
  console.log("yt-navigate-finish event");
  monitorVideo();
});
window.addEventListener("load", () => {
  console.log("load event");

  settingButtonLoaded = false;
  monitorVideo();
});
