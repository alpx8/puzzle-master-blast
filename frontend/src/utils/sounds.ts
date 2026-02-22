import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

// Sound references
let placeSound: Audio.Sound | null = null;
let dropSound: Audio.Sound | null = null;
let clearSound: Audio.Sound | null = null;
let comboSound: Audio.Sound | null = null;
let levelUpSound: Audio.Sound | null = null;

// Better sound URLs - pleasant and enjoyable sounds
// Combo: Soft whoosh + positive chime mix
const SOUND_URLS = {
  place: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Soft pop click
  drop: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Soft landing thud
  clear: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // Pleasant sparkle
  combo: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Pleasant whoosh + positive chime
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Achievement unlock sound
};

let soundsEnabled = true;
let soundsLoaded = false;

export const initSounds = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Load sounds with appropriate volumes
    const [place, drop, clear, combo, levelUp] = await Promise.all([
      Audio.Sound.createAsync({ uri: SOUND_URLS.place }, { volume: 0.3 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.drop }, { volume: 0.25 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.clear }, { volume: 0.4 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.combo }, { volume: 0.35 }),
      Audio.Sound.createAsync({ uri: SOUND_URLS.levelUp }, { volume: 0.5 }),
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
    await placeSound.setPositionAsync(0);
    await placeSound.playAsync();
  } catch (e) {
    console.log('Place sound error:', e);
  }
};

export const playDropSound = async () => {
  if (!soundsEnabled || !dropSound) return;
  try {
    await dropSound.setPositionAsync(0);
    await dropSound.playAsync();
  } catch (e) {
    console.log('Drop sound error:', e);
  }
};

export const playClearSound = async () => {
  if (!soundsEnabled || !clearSound) return;
  try {
    await clearSound.setPositionAsync(0);
    await clearSound.playAsync();
  } catch (e) {
    console.log('Clear sound error:', e);
  }
};

export const playComboSound = async () => {
  if (!soundsEnabled || !comboSound) return;
  try {
    await comboSound.setPositionAsync(0);
    await comboSound.playAsync();
  } catch (e) {
    console.log('Combo sound error:', e);
  }
};

export const playLevelUpSound = async () => {
  if (!soundsEnabled || !levelUpSound) return;
  try {
    await levelUpSound.setPositionAsync(0);
    await levelUpSound.playAsync();
  } catch (e) {
    console.log('Level up sound error:', e);
  }
};

export const triggerComboHaptic = async () => {
  // Always trigger vibration for combos (independent of sound setting)
  try {
    // Custom vibration pattern for combo: short-pause-short
    Vibration.vibrate([0, 80, 40, 80]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    console.log('Haptic error:', e);
  }
};

export const triggerHeavyHaptic = async () => {
  if (!soundsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (e) {
    console.log('Haptic error:', e);
  }
};

export const setSoundsEnabled = (enabled: boolean) => {
  soundsEnabled = enabled;
};

export const getSoundsEnabled = (): boolean => {
  return soundsEnabled;
};

export const toggleSounds = (): boolean => {
  soundsEnabled = !soundsEnabled;
  return soundsEnabled;
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
