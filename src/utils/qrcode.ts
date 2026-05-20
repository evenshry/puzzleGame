import QRCode from 'qrcode';
import { PuzzleConfig } from '@/types';

const QR_CODE_CONFIG = {
  width: 256,
  margin: 2,
  errorCorrectionLevel: 'M' as const,
  color: {
    dark: '#333333',
    light: '#FFFFFF',
  },
};

export const generateQRCode = async (config: PuzzleConfig): Promise<string> => {
  try {
    const data = JSON.stringify(config);
    const dataUrl = await QRCode.toDataURL(data, QR_CODE_CONFIG);
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('二维码生成失败，请减少内容或图片大小');
  }
};

export const parseQRCodeData = (data: string): PuzzleConfig | null => {
  try {
    const parsed = JSON.parse(data);
    if (validatePuzzleConfig(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const validatePuzzleConfig = (data: unknown): data is PuzzleConfig => {
  if (!data || typeof data !== 'object') return false;
  const config = data as Record<string, unknown>;
  if (typeof config.text !== 'string') return false;
  if (![4, 9, 16].includes(config.difficulty as number)) return false;
  if (typeof config.backgroundColor !== 'string') return false;
  return true;
};

export const generateShareURL = (config: PuzzleConfig): string => {
  try {
    const data = JSON.stringify(config);
    const encodedData = btoa(data);
    const baseURL = window.location.origin;
    const basePath = import.meta.env.PROD ? '/puzzleGame' : '';
    return `${baseURL}${basePath}/play?share=${encodedData}`;
  } catch (error) {
    console.error('Failed to generate share URL:', error);
    throw new Error('分享链接生成失败');
  }
};

export const parseShareURL = (): PuzzleConfig | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const puzzleParam = params.get('puzzle');

    if (!puzzleParam) return null;

    const decodedData = decodeURIComponent(atob(puzzleParam));
    return parseQRCodeData(decodedData);
  } catch {
    return null;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};

export const compressImage = async (
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};
