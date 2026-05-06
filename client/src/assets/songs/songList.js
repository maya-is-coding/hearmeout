import samjawanAudio from './samjawan/audio.mp3.mp3';
import samjawanLrc from './samjawan/lyric.lrc';
import samjawanVinyl from './samjawan/vinyl.png';

import iwswhlyAudio from './i_will_spend_my_whole_life_loving_you/Imaginary Future, Kina Grannis - I Will Spend My Whole Life Loving You (SPOTISAVER).mp3';
import iwswhlyLrc from './i_will_spend_my_whole_life_loving_you/lyrics.lrc';
import iwswhlyVinyl from './i_will_spend_my_whole_life_loving_you/vinyl.png';

import humsafarAudio from './humsafar/audio.mp3.mp3';
import humsafarLrc from './humsafar/lyrics.lrc';
import humsafarVinyl from './humsafar/vinyl.png';

import gehrahuaLrc from './gehrahua/lyrics.lrc';
import gehrahuaVinyl from './gehrahua/vinyl.png';
import gehrahuaAudio from './gehrahua/audio.mp3';

import mirrorsAudio from './mirrors/audio.mp3.mp3';
import mirrorsLrc from './mirrors/lyrics.lrc';
import mirrorsVinyl from './mirrors/image-removebg-preview (9).png';

// Note: gehrahuaAudio is currently missing from the folder. 
// Please check the filename in src/assets/songs/gehrahua/

const songs = [
  {
    id: 1,
    title: 'Samjhawan',
    artist: 'Arijit Singh',
    vinyl: samjawanVinyl,
    audio: samjawanAudio,
    lrc: samjawanLrc,
  },
  {
    id: 2,
    title: 'I Will Spend My Whole Life Loving You',
    artist: 'Kina Grannis & Imaginary Future',
    vinyl: iwswhlyVinyl,
    audio: iwswhlyAudio,
    lrc: iwswhlyLrc,
  },
  {
    id: 3,
    title: 'Humsafar',
    artist: 'Sachet-Parampara',
    vinyl: humsafarVinyl,
    audio: humsafarAudio,
    lrc: humsafarLrc,
  },
  {
    id: 4,
    title: 'Gehra Hua',
    artist: 'Arijit Singh',
    vinyl: gehrahuaVinyl,
    audio: gehrahuaAudio,

    lrc: gehrahuaLrc,
  },
  {
    id: 5,
    title: 'Mirrors',
    artist: 'Justin Timberlake',
    vinyl: mirrorsVinyl,
    audio: mirrorsAudio,
    lrc: mirrorsLrc,
  },
];

export default songs;
