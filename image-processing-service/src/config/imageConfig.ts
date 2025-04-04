import { ImageConfigType, ImageType } from 'src/types/image.type';

export const UPLOAD_DIR = './images/uploads';
export const OUTPUT_DIR = './images/processed';
export const DEFAULT_FORMAT = 'webp';

export const ImageConfig: Record<ImageType, ImageConfigType> = {
  [ImageType.GAME]: { width: 184, height: 256, suffix: 'thumbnail' },
  [ImageType.PROMOTION]: { width: 361, height: 240, suffix: 'resized' },
};
