import { Platform } from '../types';

export const platforms: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Channel (Video required)',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
    isPro: true,
  },

  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Personal page or profile',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
    isPro: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Page',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg',
    isPro: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Business or Creator (Media required)',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
    isPro: true,
  },
  {
    id: 'twitter',
    name: 'X',
    description: 'Profile',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png',
    isPro: true,
  },
];
