import { SampleMediaLink } from '../types';

export const SAMPLE_MEDIA_LINKS: SampleMediaLink[] = [
  {
    title: 'Big Buck Bunny (MP4)',
    type: 'video',
    mimeType: 'video/mp4',
    size: '1.1 MB',
    approxBytes: 1_128_375,
    url: './media_sample.mp4',
    description: 'High-quality open test video stream with sound',
  },
  {
    title: 'Elephants Dream (MP4)',
    type: 'video',
    mimeType: 'video/mp4',
    size: '1.1 MB',
    approxBytes: 1_128_375,
    url: './media_sample.mp4',
    description: 'Short animation direct video file',
  },
  {
    title: 'Canon in D Piano (MP3)',
    type: 'audio',
    mimeType: 'audio/mpeg',
    size: '39.8 KB',
    approxBytes: 39_868,
    url: './media_sample.mp3',
    description: 'Direct audio stream MP3 format',
  },
  {
    title: 'NASA Cosmic Web (JPG)',
    type: 'image',
    mimeType: 'image/jpeg',
    size: '2.1 MB',
    approxBytes: 2_100_000,
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NGC_4414_%28NASA-med%29.jpg/1280px-NGC_4414_%28NASA-med%29.jpg',
    description: 'High-resolution deep-space galaxy photograph',
  },
  {
    title: 'Mountain Lake Sunset (PNG)',
    type: 'image',
    mimeType: 'image/png',
    size: '3.6 MB',
    approxBytes: 3_600_000,
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp-1900px.jpg/1280px-Everest_North_Face_toward_Base_Camp-1900px.jpg',
    description: 'High-definition landscape photography',
  },
];
