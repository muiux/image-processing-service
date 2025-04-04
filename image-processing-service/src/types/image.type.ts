export enum ImageType {
  GAME = 'game',
  PROMOTION = 'promotion',
}

export interface ImageConfigType {
  width: number;
  height: number;
  suffix: string;
}

export interface CropOption {
  x: number;
  y: number;
  width: number;
  height: number;
  outputFormat?: string;
}
