import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Response,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageProcessingService } from './image-processing.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as path from 'path';
import * as fs from 'fs';
import { Response as ExpressResponse } from 'express';
import { CropOption, ImageType } from 'src/types/image.type';
import { DEFAULT_FORMAT, UPLOAD_DIR } from 'src/config/imageConfig';
import { v4 as uuidv4 } from 'uuid';

const fileUploadInterceptor = () => {
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (_req, file, callback) => {
        const uuid = uuidv4();
        const fileExt = extname(file.originalname);
        const fileName = path.parse(file.originalname).name;
        callback(null, `${fileName}-${uuid}${fileExt}`);
      },
    }),
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.startsWith('image/')) {
        return callback(
          new BadRequestException('Only image files are allowed'),
          false,
        );
      }
      callback(null, true);
    },
  });
};

@Controller('images')
export class ImageProcessingController {
  constructor(
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @Post('upload')
  @UseInterceptors(fileUploadInterceptor())
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('imageType') imageType: ImageType,
  ) {
    if (!file || !imageType) {
      throw new BadRequestException('File and image type are required');
    }

    return await this.imageProcessingService.processImage(file, imageType);
  }

  @Post('crop')
  @UseInterceptors(fileUploadInterceptor())
  async cropImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('cropOptions') cropOptionsJson: string,
    @Response() res: ExpressResponse,
  ) {
    let cropOptions: CropOption;
    try {
      cropOptions = JSON.parse(cropOptionsJson) as CropOption;
    } catch {
      throw new BadRequestException('Invalid cropOptions JSON.');
    }

    const { x, y, width, height, outputFormat } = cropOptions;
    if (!file || x == null || y == null || width == null || height == null) {
      throw new BadRequestException(
        !file ? 'File is required for cropping.' : 'Missing crop dimensions.',
      );
    }

    const croppedImagePath = await this.imageProcessingService.cropImage(file, {
      x: +x,
      y: +y,
      width: +width,
      height: +height,
      outputFormat,
    });

    res.setHeader('Content-Type', `image/${outputFormat || DEFAULT_FORMAT}`);
    res.setHeader('Content-Disposition', 'inline');
    const fileStream = fs.createReadStream(croppedImagePath);
    fileStream.pipe(res);
    return;
  }
}
