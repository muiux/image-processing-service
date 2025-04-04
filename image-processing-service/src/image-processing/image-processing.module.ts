import { Module } from '@nestjs/common';
import { ImageProcessingService } from './image-processing.service';
import { ImageProcessingController } from './image-processing.controller';

@Module({
  providers: [ImageProcessingService],
  controllers: [ImageProcessingController]
})
export class ImageProcessingModule {}
