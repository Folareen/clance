import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    buffer: Buffer,
    options: { folder?: string; filename?: string } = {},
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder ?? 'clance',
          public_id: options.filename,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  async remove(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
