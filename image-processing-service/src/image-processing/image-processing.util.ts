import * as fs from 'fs';
import * as path from 'path';
import { ImageType } from 'src/types/image.type';
import { ImageConfig } from 'src/config/imageConfig';

export const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const ensureFileExists = async (filePath: string) => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch {
    throw new Error('File not found');
  }
};

export const getOutputPath = (
  outputDir: string,
  fileBaseName: string,
  suffix: string,
  defaultFormat: string,
) => {
  return path.join(outputDir, `${fileBaseName}-${suffix}.${defaultFormat}`);
};

export const isValidImageType = (imageType: string): imageType is ImageType =>
  Object.keys(ImageConfig).includes(imageType as ImageType);
