import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Sound references
let placeSound: Audio.Sound | null = null;
let dropSound: Audio.Sound | null = null;
let clearSound: Audio.Sound | null = null;
let comboSound: Audio.Sound | null = null;
let levelUpSound: Audio.Sound | null = null;

// Sound URLs (using free sound effects)
const SOUND_URLS = {
  place: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Soft pop
  drop: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Swoosh
  clear: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3', // Success chime
  combo: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Achievement
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3', // Level up
};

let soundsEnabled = true;
let soundsLoaded = false;

export const initSounds = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Load sounds
    const [place, drop, clear, combo, levelUp] = await Promise.all([
      Audio.Sound.createAsync({ uri: SOUND_URLS.place }, { volume: 0.5 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.drop }, { volume: 0.3 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.clear }, { volume: 0.6 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.combo }, { volume: 0.7 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.levelUp }, { volume: 0.8 }),
    ]);

    placeSound = place.sound;
    dropSound = drop.sound;
    clearSound = clear.sound;
    comboSound = combo.sound;
    levelUpSound = levelUp.sound;
    soundsLoaded = true;

    console.log('Sounds loaded successfully');
  } catch (error) {
    console.error('Error loading sounds:', error);
    soundsLoaded = false;
  }
};

export const playPlaceSound = async () => {
  if (!soundsEnabled || !placeSound) return;
  try {
    await placeSound.replayAsync();
  } catch (e) {
    console.log('Place sound error:', e);
  }
};

export const playDropSound = async () => {
  if (!soundsEnabled || !dropSound) return;
  try {
    await dropSound.replayAsync();
  } catch (e) {
    console.log('Drop sound error:', e);
  }
};

export const playClearSound = async () => {
  if (!soundsEnabled || !clearSound) return;
  try {
    await clearSound.replayAsync();
  } catch (e) {
    console.log('Clear sound error:', e);
  }
};

export const playComboSound = async () => {
  if (!soundsEnabled || !comboSound) return;
  try {
    await comboSound.replayAsync();
  } catch (e) {
    console.log('Combo sound error:', e);
  }
};

export const playLevelUpSound = async () => {
  if (!soundsEnabled || !levelUpSound) return;
  try {
    await levelUpSound.replayAsync();
  } catch (e) {
    console.log('Level up sound error:', e);
  }
};

export const triggerComboHaptic = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    console.log('Haptic error:', e);
  }
};

export const triggerHeavyHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (e) {
    console.log('Haptic error:', e);
  }
};

export const setSoundsEnabled = (enabled: boolean) => {
  soundsEnabled = enabled;
};

export const unloadSounds = async () => {
  try {
    if (placeSound) await placeSound.unloadAsync();
    if (dropSound) await dropSound.unloadAsync();
    if (clearSound) await clearSound.unloadAsync();
    if (comboSound) await comboSound.unloadAsync();
    if (levelUpSound) await levelUpSound.unloadAsync();
  } catch (e) {
    console.log('Unload sounds error:', e);
  }
};
