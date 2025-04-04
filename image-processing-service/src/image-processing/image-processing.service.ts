import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { CropOption, ImageType } from '../types/image.type';
import {
  ensureDirectoryExists,
  ensureFileExists,
  getOutputPath,
  isValidImageType,
} from './image-processing.util';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_FORMAT,
  ImageConfig,
  OUTPUT_DIR,
  UPLOAD_DIR,
} from 'src/config/imageConfig';

const unlinkAsync = promisify(fs.unlink);

@Injectable()
export class ImageProcessingService {
  private readonly server: string;

  constructor(private configService: ConfigService) {
    ensureDirectoryExists(OUTPUT_DIR);
    const port = this.configService.get<number>('PORT') ?? 3000;
    this.server = `http://localhost:${port}`;
  }

  /**
   * Retrieves file paths related to the uploaded image.
   *
   * @param file The uploaded image file object.
   * @returns Object containing:
   *   - filePath: Full path to the uploaded file.
   *   - fileBaseName: Base name of the file without the extension.
   *   - originalOutputPath: Path where the webp-converted file will be stored.
   */
  private getFilePaths(file: Express.Multer.File) {
    const filePath = path.join(UPLOAD_DIR, file.filename);
    const baseName = path.parse(file.filename).name;
    const fileBaseName = baseName.replace(/-[a-f0-9-]{36}$/, '');
    const originalOutputPath = path.join(
      UPLOAD_DIR,
      `${fileBaseName}.${DEFAULT_FORMAT}`,
    );
    return { filePath, fileBaseName, originalOutputPath };
  }

  /**
   * Converts the uploaded image to WebP format and deletes the original file.
   *
   * @param filePath Path to the uploaded image.
   * @param originalOutputPath Path where the webp-converted file will be saved.
   * @returns A promise that resolves once the image conversion is complete.
   */
  private async convertToWebP(filePath: string, originalOutputPath: string) {
    const imageBuffer = await fs.promises.readFile(filePath);
    await fs.promises
      .access(originalOutputPath, fs.constants.F_OK)
      .catch(async () => {
        await sharp(imageBuffer).webp().toFile(originalOutputPath);
      });
    await unlinkAsync(filePath);
  }

  /**
   * Generates variations of the uploaded image based on the specified image type.
   * The variation images will be resized accordingly and returned.
   *
   * @param fileBaseName The base name of the uploaded file (without extension).
   * @param filePath The full path to the uploaded file.
   * @param imageType The type of image variation to generate (e.g., promotion).
   * @returns The path to the generated variation image.
   */
  private async generateVariations(
    fileBaseName: string,
    filePath: string,
    imageType: ImageType,
  ) {
    const { width, height, suffix } = ImageConfig[imageType];
    const outputPath = getOutputPath(
      OUTPUT_DIR,
      fileBaseName,
      suffix,
      DEFAULT_FORMAT,
    );

    ensureDirectoryExists(path.dirname(outputPath));

    const fitOption = imageType === ImageType.PROMOTION ? 'fill' : 'inside';

    await sharp(filePath)
      .resize(width, height, { fit: fitOption })
      .toFile(outputPath);

    const variation = outputPath;
    return variation;
  }

  /**
   * Main method for processing an uploaded image. This includes converting the image
   * to WebP format and generating any required image variations.
   *
   * @param file The uploaded image file object.
   * @param imageType The image type (used to generate variations like promotion).
   * @returns An object containing:
   *   - original: URL to the WebP-converted original image.
   *   - variation: URL to the generated image variation.
   */
  async processImage(file: Express.Multer.File, imageType: ImageType) {
    const { filePath, fileBaseName, originalOutputPath } =
      this.getFilePaths(file);
    await ensureFileExists(filePath);

    try {
      if (!isValidImageType(imageType)) {
        throw new BadRequestException(
          `Invalid image type: ${imageType as string}`,
        );
      }

      await this.convertToWebP(filePath, originalOutputPath);

      const variation = await this.generateVariations(
        fileBaseName,
        originalOutputPath,
        imageType,
      );

      return {
        original: `${this.server}/${originalOutputPath}`,
        variation: `${this.server}/${variation}`,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Error processing image: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Crops the uploaded image based on specified coordinates and dimensions, and returns
   * the path to the cropped image.
   *
   * @param file The uploaded image file object.
   * @param cropOptions Object containing crop details (x, y, width, height).
   * @returns The path to the cropped image.
   */
  async cropImage(file: Express.Multer.File, cropOptions: CropOption) {
    const { filePath, fileBaseName, originalOutputPath } =
      this.getFilePaths(file);
    const { x, y, width, height, outputFormat = DEFAULT_FORMAT } = cropOptions;
    await ensureFileExists(filePath);

    try {
      const metadata = await sharp(filePath).metadata();
      const imageWidth = metadata.width as number;
      const imageHeight = metadata.height as number;

      if (x < 0 || y < 0 || width <= 0 || height <= 0) {
        throw new BadRequestException(
          'Invalid crop dimensions (negative values are not allowed).',
        );
      }

      if (x + width > imageWidth || y + height > imageHeight) {
        throw new BadRequestException(
          `Crop area exceeds image dimensions. Image dimensions: ${imageWidth}x${imageHeight}.`,
        );
      }

      await this.convertToWebP(filePath, originalOutputPath);

      const croppedFilePath = getOutputPath(
        OUTPUT_DIR,
        fileBaseName,
        'cropped',
        outputFormat,
      );

      ensureDirectoryExists(path.dirname(croppedFilePath));

      await sharp(originalOutputPath)
        .extract({ left: x, top: y, width, height })
        .toFormat(outputFormat as keyof sharp.FormatEnum)
        .toFile(croppedFilePath);

      return croppedFilePath;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error cropping image: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
