import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async compressImage(file: Express.Multer.File): Promise<Buffer> {
    return sharp(file.buffer)
      .resize(1920, null, {
        // Max width 1920px, maintain aspect ratio
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file.mimetype.includes('image')) {
      throw new Error('Only images are allowed');
    }
    const compressedBuffer = await this.compressImage(file);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'jabo-collection',
          resource_type: 'auto',
          quality_analysis: true, // Get quality metrics
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      uploadStream.end(compressedBuffer);
    });
  }

  async deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }
}
