import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private sanitizePublicId(filename: string): string {
    const withoutExtension = filename.replace(/\.[^/.]+$/, '');

    return withoutExtension.replace(/[^\w]/g, '_');
  }

  private splitBuffer(buffer: Buffer, chunkSize: number): Buffer[] {
    const chunks: Buffer[] = [];
    for (let i = 0; i < buffer.length; i += chunkSize) {
      chunks.push(buffer.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async uploadToCloudinary(
    fileBuffer: Buffer,
    folderPath: string,
    options: {
      filename?: string;
      contentType?: string;
    } = {},
  ) {
    return new Promise((resolve, reject) => {
      const publicId = options.filename
        ? this.sanitizePublicId(options.filename)
        : undefined;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        },
      );

      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }
}
