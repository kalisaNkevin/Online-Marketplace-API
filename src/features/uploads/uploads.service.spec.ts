import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UploadsService', () => {
  let service: UploadsService;
  let prismaService: PrismaService;
  let cloudinaryService: CloudinaryService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 1024,
    destination: '',
    filename: 'test.jpg',
    path: '',
    stream: null,
  };

  const mockUpload = {
    id: '1',
    filename: 'test.jpg',
    url: 'https://cloudinary.com/test.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    publicId: 'test_public_id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCloudinaryResponse = {
    original_filename: 'test',
    secure_url: 'https://cloudinary.com/test.jpg',
    bytes: 1024,
    public_id: 'test_public_id',
  };

  const mockPrismaService = {
    upload: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    prismaService = module.get<PrismaService>(PrismaService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);

    jest.clearAllMocks();
  });

  describe('uploadSingle', () => {
    it('should upload a single file successfully', async () => {
      mockCloudinaryService.uploadImage.mockResolvedValue(
        mockCloudinaryResponse,
      );
      mockPrismaService.upload.create.mockResolvedValue(mockUpload);

      const result = await service.uploadSingle(mockFile);

      expect(result).toEqual(mockUpload);
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(mockPrismaService.upload.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for non-image files', async () => {
      const nonImageFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(service.uploadSingle(nonImageFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadMultiple', () => {
    it('should upload multiple files successfully', async () => {
      mockCloudinaryService.uploadImage.mockResolvedValue(
        mockCloudinaryResponse,
      );
      mockPrismaService.upload.create.mockResolvedValue(mockUpload);

      const result = await service.uploadMultiple([mockFile, mockFile]);

      expect(result).toHaveLength(2);
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when no files are provided', async () => {
      await expect(service.uploadMultiple([])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('should return a file by id', async () => {
      mockPrismaService.upload.findUnique.mockResolvedValue(mockUpload);

      const result = await service.findById('1');

      expect(result).toEqual(mockUpload);
    });

    it('should throw NotFoundException when file not found', async () => {
      mockPrismaService.upload.findUnique.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a file successfully', async () => {
      mockPrismaService.upload.findUnique.mockResolvedValue(mockUpload);
      mockCloudinaryService.deleteImage.mockResolvedValue({});
      mockPrismaService.upload.delete.mockResolvedValue(mockUpload);

      const result = await service.remove('1');

      expect(result).toEqual({ message: 'File deleted successfully' });
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith(
        mockUpload.publicId,
      );
    });

    it('should throw NotFoundException when file not found', async () => {
      mockPrismaService.upload.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a file successfully', async () => {
      mockPrismaService.upload.findUnique.mockResolvedValue(mockUpload);
      mockCloudinaryService.deleteImage.mockResolvedValue({});
      mockCloudinaryService.uploadImage.mockResolvedValue(
        mockCloudinaryResponse,
      );
      mockPrismaService.upload.update.mockResolvedValue({
        ...mockUpload,
        filename: 'updated.jpg',
      });

      const result = await service.update('1', mockFile);

      expect(result.filename).toBe('updated.jpg');
      expect(mockCloudinaryService.deleteImage).toHaveBeenCalled();
      expect(mockCloudinaryService.uploadImage).toHaveBeenCalled();
    });

    it('should throw BadRequestException when update fails', async () => {
      mockPrismaService.upload.findUnique.mockResolvedValue(mockUpload);
      mockCloudinaryService.deleteImage.mockRejectedValue(new Error());

      await expect(service.update('1', mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
