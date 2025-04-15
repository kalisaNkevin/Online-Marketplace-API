import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class UploadsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async uploadSingle(file: Express.Multer.File) {
    if (!file.mimetype.includes('image')) {
      throw new BadRequestException('Only images are allowed');
    }

    try {
      const cloudinaryResponse: any = await this.cloudinary.uploadImage(file);

      const upload = await this.prisma.upload.create({
        data: {
          // Use UUID for database ID
          id: crypto.randomUUID(),
          filename: cloudinaryResponse.original_filename,
          url: cloudinaryResponse.secure_url,
          mimetype: file.mimetype,
          size: cloudinaryResponse.bytes,
          // Store Cloudinary's public_id separately
          publicId: cloudinaryResponse.public_id,
        },
      });

      return upload;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async uploadMultiple(files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      const uploadPromises = files.map((file) => this.uploadSingle(file));
      return Promise.all(uploadPromises);
    } catch (error) {
      throw new BadRequestException(`Failed to upload images: ${error}`);
    }
  }

  async findAll() {
    return this.prisma.upload.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const upload = await this.prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      throw new NotFoundException('File not found');
    }

    return upload;
  }

  async remove(id: string) {
    const upload = await this.findById(id);

    try {
      await this.cloudinary.deleteImage(upload.publicId);
      await this.prisma.upload.delete({ where: { id } });
      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new NotFoundException('Failed to delete file');
    }
  }

  async removeById(id: string) {
    const upload = await this.findById(id);
    await this.remove(upload.id);
    return { message: 'File deleted successfully' };
  }

  async update(id: string, file: Express.Multer.File) {
    try {
      const oldUpload = await this.findById(id);

      // Delete old file from Cloudinary
      await this.cloudinary.deleteImage(oldUpload.publicId);

      // Upload new file
      const cloudinaryResponse: any = await this.cloudinary.uploadImage(file);

      // Update database record
      const updatedUpload = await this.prisma.upload.update({
        where: { id },
        data: {
          filename: cloudinaryResponse.original_filename,
          url: cloudinaryResponse.secure_url,
          mimetype: file.mimetype,
          size: cloudinaryResponse.bytes,
          publicId: cloudinaryResponse.public_id,
        },
      });

      return updatedUpload;
    } catch (error) {
      throw new BadRequestException('Failed to update file');
    }
  }
}
