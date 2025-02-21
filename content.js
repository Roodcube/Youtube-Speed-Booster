let currentSpeed = 1;
let speedUpAds = false;
let wasMutedBeforeAd = false;
let originalQuality = null;
let adInterval = null;
let ytPlayer = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateSpeed") {
    currentSpeed = message.speed;
    speedUpAds = message.speedUpAds;
    updatePlaybackSpeedMuteAndQuality();
  }
});

// Function to update playback speed, mute, and quality
function updatePlaybackSpeedMuteAndQuality() {
  const video = document.querySelector("video");
  if (!video) return;

  const adElement = document.querySelector(".ad-showing");
  if (adElement && speedUpAds) {
    // Ad is playing
    if (!video.muted) {
      wasMutedBeforeAd = false;
      video.muted = true;
    } else {
      wasMutedBeforeAd = true;
    }
    video.playbackRate = 16;

    if (!adInterval) {
      adInterval = setInterval(() => {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }, 100);
    }
  } else {
    // No ad, regular content
    video.playbackRate = currentSpeed;
    if (speedUpAds && !wasMutedBeforeAd) {
      video.muted = false;
    }
    if (adInterval) {
      clearInterval(adInterval);
      adInterval = null;
      video.play();
    }
  }

  // Handle YouTube API for quality (after speed/mute)
  if (!window.YT) {
    chrome.runtime.sendMessage({ action: "injectYouTubeAPI" });
    // Don’t return; let speed/mute work regardless
  } else if (!ytPlayer && window.YT && window.YT.Player) {
    const playerElement = document.querySelector("#movie_player");
    if (playerElement) {
      ytPlayer = new window.YT.Player(playerElement, {
        events: {
          onReady: () => console.log("YouTube Player API ready")
        }
      });
    }
  }

  // Adjust quality if player is ready
  if (ytPlayer && typeof ytPlayer.getPlaybackQuality === "function") {
    if (adElement && speedUpAds) {
      if (originalQuality === null) {
        originalQuality = ytPlayer.getPlaybackQuality();
      }
      ytPlayer.setPlaybackQuality("tiny");
    } else if (originalQuality !== null && ytPlayer.getPlaybackQuality() !== originalQuality) {
      ytPlayer.setPlaybackQuality(originalQuality);
      originalQuality = null;
    }
  }
}

// Monitor video element and playback changes
function monitorVideo() {
  const observer = new MutationObserver(() => {
    updatePlaybackSpeedMuteAndQuality();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  updatePlaybackSpeedMuteAndQuality();
}

// Run on page load
monitorVideo();

// Re-run on video changes
window.addEventListener("yt-navigate-finish", monitorVideo);
window.addEventListener("load", monitorVideo);
