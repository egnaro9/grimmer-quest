// AdMob Ad Placement Hook for Web Games
// Uses Google Ad Placement API for HTML5 games

export const useAdPlacement = () => {
  const showRewardedAd = (placementName) => {
    return new Promise((resolve) => {
      // Check if Ad Placement API is available
      if (typeof window.adBreak !== 'function') {
        console.log('Ad Placement API not available - simulating ad');
        // Simulate ad watching for development/testing
        setTimeout(() => {
          resolve({ adShowed: true, completed: true });
        }, 1500);
        return;
      }

      window.adBreak({
        type: 'reward',
        name: placementName,
        beforeAd: () => {
          console.log('Before ad - pausing game');
        },
        afterAd: () => {
          console.log('After ad - resuming game');
        },
        beforeReward: (showAdFn) => {
          showAdFn();
        },
        adDismissed: () => {
          console.log('User dismissed the ad before completion');
          resolve({ adShowed: true, completed: false });
        },
        adViewed: () => {
          console.log('User completed watching the ad');
          resolve({ adShowed: true, completed: true });
        },
        adBreakDone: (placementInfo) => {
          console.log('Ad break completed', placementInfo);
          if (placementInfo.breakStatus === 'notReady') {
            resolve({ adShowed: false, completed: false });
          }
        },
      });
    });
  };

  const showInterstitialAd = (placementName) => {
    return new Promise((resolve) => {
      if (typeof window.adBreak !== 'function') {
        console.log('Ad Placement API not available - skipping interstitial');
        resolve({ adShowed: false });
        return;
      }

      window.adBreak({
        type: 'start',
        name: placementName,
        beforeAd: () => {
          console.log('Before interstitial - pausing game');
        },
        afterAd: () => {
          console.log('After interstitial - resuming game');
        },
        adBreakDone: (placementInfo) => {
          console.log('Interstitial completed', placementInfo);
          resolve({ adShowed: placementInfo.breakStatus !== 'notReady' });
        },
      });
    });
  };

  const configureAds = () => {
    if (typeof window.adConfig === 'function') {
      window.adConfig({
        preloadAdBreaks: 'auto',
        sound: 'on',
      });
    }
  };

  return {
    showRewardedAd,
    showInterstitialAd,
    configureAds,
  };
};
