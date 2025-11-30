import { Linkedin, Twitter, Instagram, Youtube, Video, FileText } from 'lucide-react';

export interface PlatformTemplate {
    id: string;
    name: string;
    icon: any;
    command: string;
    prompt: string;
    placeholder: string;
    color: string;
}

export const platformTemplates: PlatformTemplate[] = [
    {
        id: 'linkedin',
        name: 'LinkedIn Post',
        icon: Linkedin,
        command: '/linkedin',
        prompt: `Create a professional LinkedIn post about: `,
        placeholder: 'e.g., "AI in healthcare" or "My startup journey"',
        color: 'from-blue-600 to-blue-700'
    },
    {
        id: 'twitter',
        name: 'Twitter/X Thread',
        icon: Twitter,
        command: '/twitter',
        prompt: `Create a Twitter/X thread about: `,
        placeholder: 'e.g., "10 productivity tips" or "Tech trends 2024"',
        color: 'from-sky-500 to-sky-600'
    },
    {
        id: 'instagram',
        name: 'Instagram Caption',
        icon: Instagram,
        command: '/instagram',
        prompt: `Create an Instagram caption for: `,
        placeholder: 'e.g., "Product launch" or "Behind the scenes"',
        color: 'from-pink-600 to-purple-600'
    },
    {
        id: 'youtube',
        name: 'YouTube Description',
        icon: Youtube,
        command: '/youtube',
        prompt: `Create a YouTube video description for: `,
        placeholder: 'e.g., "Tutorial on React hooks" or "Product review"',
        color: 'from-red-600 to-red-700'
    },
    {
        id: 'tiktok',
        name: 'TikTok/Reels Script',
        icon: Video,
        command: '/tiktok',
        prompt: `Create a TikTok/Reels script for: `,
        placeholder: 'e.g., "Quick cooking hack" or "Day in my life"',
        color: 'from-purple-600 to-pink-600'
    },
    {
        id: 'custom',
        name: 'Custom Request',
        icon: FileText,
        command: '/custom',
        prompt: '',
        placeholder: 'Ask anything...',
        color: 'from-gray-600 to-gray-700'
    }
];

export const getTemplateByCommand = (command: string): PlatformTemplate | undefined => {
    return platformTemplates.find(t => t.command === command);
};

export const getAllCommands = (): string[] => {
    return platformTemplates.map(t => t.command);
};
