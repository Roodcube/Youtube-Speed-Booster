let currentSpeed = 1;
let maxSpeed = 16;
let minSpeed = 0.25;
let sliderStep = 0.25;
let tempSpeed = 1;
let speedUpAds = false;
let wasMutedBeforeAd = false;
let sliderActive = false;
let settingButtonLoaded = false;
let isClickHeld = false;
let originalQuality = null;
let adTimeout = null;
let ytPlayer = null;
let ytSpeed = null;

console.log("content.js loaded");

// Inject CSS once during initialization
function injectSliderCSS() {
  console.log("injectSliderCSS called");
  if (!document.querySelector("#custom-slider-styles")) {
    const style = document.createElement("style");
    style.class = "custom-slider-styles";
    style.textContent = `
    #custom-speed-slider {
        -webkit-appearance: none;
        appearance: none;
        overflow: hidden;
        width: 100%;
        height: 24px;
        accent-color: #4d4d4d;
        background: none;
        outline: none;
        cursor: pointer;
        border-radius: 12px;
        margin-right: 0;
      }
      
    #custom-speed-slider::-webkit-slider-runnable-track {
	      width: 50px;
        height: 5px;
        border-radius: 5px;
        margin-left: 2px;
        margin-right: 2px;
	    }

      #custom-speed-slider::-moz-range-track {
        height: 5px;
        border-radius: 5px;
        margin-left: 2px;
        margin-right: 2px;
      }

      #custom-speed-slider::-ms-track {
        height: 5px;
        border-radius: 5px;
        margin-left: 2px;
        margin-right: 2px;
      }

      #custom-speed-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        background: #ffffff;
        border-radius: 50%;
        margin-top: -7px;
        transition: background 0.2s;
        box-shadow:	1px 0 0 1px rgb(255,255,255,0.3), 
        			      -9px -7px 8px rgb(255,255,255,0.3),
        			      -9px 7px 8px rgb(255,255,255,0.3),
                    -2px -7px 8px -5px rgb(255,255,255,0.3),
                    -2px 7px 8px -5px rgb(255,255,255,0.3),
                    815px 0 20px 800px rgb(5,5,5,0.38),
        			      -826px 0 8px 800px rgb(255,255,255,0.3);
      }
      
      #custom-speed-slider::-webkit-slider-thumb:active {
      	background: #b3b3b3;
      }

      #custom-speed-slider::-moz-range-thumb:active {
	      background: #b3b3b3;
	    }

      #custom-speed-slider::-ms-thumb:active {
	      background: #b3b3b3;
	    }

      #custom-speed-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #b3b3b3;
        border-radius: 50%;
        cursor: pointer;
      }

      #custom-speed-slider::-ms-thumb {
        width: 20px;
        height: 20px;
        background: #b3b3b3;
        border-radius: 50%;
        cursor: pointer;
      }
     `;
    document.head.appendChild(style);
    console.log("Injected custom slider CSS");
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateSpeed") {
    currentSpeed = message.speed;
    maxSpeed = message.max
    sliderStep = message.step
    speedUpAds = message.speedUpAds;
    sliderOffset = parseFloat((currentSpeed % sliderStep).toFixed(2));
    minSpeed = (0 == sliderOffset) ? sliderStep : sliderOffset;


    console.log("Message received - speed:", currentSpeed, "speedUpAds:", speedUpAds, "minSpeed:", minSpeed);

    if (maxSpeed < currentSpeed){
      currentSpeed = maxSpeed;
    }

    if (minSpeed < 0.1){
      minSpeed = 0.1;
    }
    updatePlaybackSpeedMuteAndQuality();
    updateSliderValue(); // Sync slider with popup input
  }
});

// Gesture detection for click-and-hold on video
function setupGestureDetection() {
  console.log("setupGestureDetection called");
  const video = document.querySelector("video");
  if (!video) return;

  let holdTimeout;

  video.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Left mouse only
    holdTimeout = setTimeout(() => {
      isClickHeld = true;
      try {
        tempSpeed = currentSpeed;
        currentSpeed = maxSpeed;
        console.log("Hold gesture: Set speed to", maxSpeed + "x");
      } catch (err) {
        console.error("Error setting hold speed:", err);
      }
    }, 400); // Delay to distinguish click from hold (adjust as needed)
  });

  video.addEventListener("mouseup", (e) => {
    clearTimeout(holdTimeout);
    if (isClickHeld) {
      isClickHeld = false;
      try {
        currentSpeed = tempSpeed;
        console.log("Hold released: Reverted to", currentSpeed + "x");
      } catch (err) {
        console.error("Error reverting hold speed:", err);
      }
    }
  });

  video.addEventListener("mouseleave", (e) => {
    clearTimeout(holdTimeout);
    if (isClickHeld) {
      isClickHeld = false;
      try {
        currentSpeed = tempSpeed;
        console.log("Mouse left video: Reverted to", currentSpeed + "x");
      } catch (err) {
        console.error("Error reverting hold speed:", err);
      }
    }
  });
}

function updatePlaybackSpeedMuteAndQuality() {
  //console.log("updatePlaybackSpeedMuteAndQuality called");
  const video = document.querySelector("video");
  if (!video) {
    //console.log("No video element found");
    return;
  }

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
      //console.log("Speed panel items:", items.map(item => item.textContent));

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

      sliderContainer.innerHTML = `<div class="ytp-menuitem-icon"><svg height="24" viewBox="0 0 24 24" width="24"><path d="M12 1c1.44 0 2.87.28 4.21.83a11 11 0 0 1 3.45 2.27l-1.81 1.05A9 9 0 0 0 3 12a9 9 0 0 0 18-.00l-.01-.44a8.99 8.99 0 0 0-.14-1.20l1.81-1.05A11.00 11.00 0 0 1 10.51 22.9 11 11 0 0 1 12 1Zm7.08 6.25-7.96 3.25a1.74 1.74 0 1 0 1.73 2.99l6.8-5.26a.57.57 0 0 0-.56-.98Z" fill="white"></path></svg></div><div class="ytp-menuitem-label" style="margin-right: 0px;">Speed:<span class="ytp-menu-label-secondary" id="speed-value" style="display: inline-block; width: 20px; text-align: right; margin: 0px 5px;">${currentSpeed}x</span></div><div class="ytp-menuitem-content"><div style="display: flex; align-items: left;"><input type="range" id="custom-speed-slider" min="${minSpeed}" max="${maxSpeed}" step="${sliderStep}" value="${currentSpeed}"></div>`;


      // Remove only speed-related options
      const speedOptions = speedPanel.querySelectorAll(".ytp-menuitem");
      //speedOptions.forEach(option => console.log("Menu item:", option.textContent));

      speedOptions.forEach(option => {
        if (option.textContent.match(/^Playback/)){
          ytSpeed = option;
          option.style.display = 'none';
        }
        else if (option.textContent.match(/^Speed/)){
          option.parentNode.removeChild(option);
        }
        //if (option.textContent.match(/^Playback|^Speed/)) {
        else if (option.textContent.match(/^Quality/)) {
          option.parentNode.insertBefore(sliderContainer, option);

        }
      });

      const slider = document.getElementById("custom-speed-slider");
      const speedValue = document.getElementById("speed-value");

      slider.addEventListener("input", (e) => {
        currentSpeed = parseFloat(e.target.value);
        speedValue.textContent = `${currentSpeed}x`;
        //  console.log("Slider updated speed to:", currentSpeed);
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
    /^https?:\/\/(www\.)?youtube\.com\/live\/[\w-]{11}/i,  // Old Live Streams?
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}(?![?&]autoplay=)/i, // Embed
    /^https?:\/\/youtu\.be\/[\w-]{11}/i                      // Shortened link
  ];

  return videoPatterns.some(pattern => pattern.test(url));
}

function monitorVideo() {
  //console.log("monitorVideo called");
  const observer = new MutationObserver(() => {
    console.log("Mutation observed");

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
            settingsButton.addEventListener("mouseup", () => {
              injectCustomSlider();
            });
        
          }
        }
      }, 1000);
    }

    updatePlaybackSpeedMuteAndQuality();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

console.log("Running monitorVideo on load");
monitorVideo();
injectSliderCSS();
setupGestureDetection();
