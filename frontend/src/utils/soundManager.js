// Sound Manager using Howler.js
import { Howl } from 'howler';

// Sound effects using free CDN sounds that allow CORS
const SOUNDS = {
  match: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
  combo: 'https://cdn.freesound.org/previews/270/270304_5123851-lq.mp3', 
  swap: 'https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3',
  powerUp: 'https://cdn.freesound.org/previews/270/270319_5123851-lq.mp3',
  levelUp: 'https://cdn.freesound.org/previews/270/270333_5123851-lq.mp3',
  gameOver: 'https://cdn.freesound.org/previews/159/159408_2538033-lq.mp3',
  buttonClick: 'https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3',
  coinCollect: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
  specialGem: 'https://cdn.freesound.org/previews/270/270319_5123851-lq.mp3',
};

class SoundManager {
  constructor() {
    this.sounds = {};
    this.muted = false;
    this.volume = 0.3;
    this.loaded = false;
    this.loadErrors = {};
  }

  init() {
    if (this.loaded) return;
    
    Object.entries(SOUNDS).forEach(([name, url]) => {
      try {
        this.sounds[name] = new Howl({
          src: [url],
          volume: this.volume,
          preload: true,
          html5: true, // Use HTML5 Audio for better CORS handling
          onloaderror: (id, err) => {
            console.warn(`Sound ${name} failed to load:`, err);
            this.loadErrors[name] = true;
          }
        });
      } catch (e) {
        console.warn(`Failed to create sound ${name}:`, e);
        this.loadErrors[name] = true;
      }
    });
    
    this.loaded = true;
  }

  play(soundName) {
    if (this.muted || !this.sounds[soundName] || this.loadErrors[soundName]) return;
    try {
      this.sounds[soundName].play();
    } catch (e) {
      console.warn(`Failed to play sound ${soundName}:`, e);
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  setVolume(volume) {
    this.volume = volume;
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.volume) {
        sound.volume(volume);
      }
    });
  }

  isMuted() {
    return this.muted;
  }
}

export const soundManager = new SoundManager();
