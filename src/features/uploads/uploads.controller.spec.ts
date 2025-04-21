import { Test, TestingModule } from '@nestjs/testing';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { BadRequestException } from '@nestjs/common';

describe('UploadsController', () => {
  let controller: UploadsController;
  let uploadsService: UploadsService;

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

  const mockUploadsService = {
    uploadSingle: jest.fn().mockImplementation((file) => {
      if (!file) {
        return Promise.reject(new BadRequestException());
      }
      return Promise.resolve(mockUpload);
    }),
    uploadMultiple: jest.fn(),
    findById: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    uploadsService = module.get<UploadsService>(UploadsService);

    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a single file successfully', async () => {
      mockUploadsService.uploadSingle.mockResolvedValue(mockUpload);

      const result = await controller.uploadSingle(mockFile);

      expect(result).toEqual(mockUpload);
      expect(mockUploadsService.uploadSingle).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('uploadSingle', () => {
    it('should upload a single file successfully', async () => {
      mockUploadsService.uploadSingle.mockResolvedValue(mockUpload);

      const result = await controller.uploadSingle(mockFile);

      expect(result).toEqual(mockUpload);
      expect(uploadsService.uploadSingle).toHaveBeenCalledWith(mockFile);
    });

    it('should throw BadRequestException when no file is provided', async () => {
      mockUploadsService.uploadSingle.mockRejectedValue(
        new BadRequestException(),
      );

      await expect(controller.uploadSingle(null)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('uploadMultiple', () => {
    const files = [mockFile, mockFile];
    const uploads = [mockUpload, mockUpload];

    it('should upload multiple files successfully', async () => {
      mockUploadsService.uploadMultiple.mockResolvedValue(uploads);

      const result = await controller.uploadMultiple(files);

      expect(result).toEqual(uploads);
      expect(uploadsService.uploadMultiple).toHaveBeenCalledWith(files);
    });

    it('should throw BadRequestException when no files are provided', async () => {
      mockUploadsService.uploadMultiple.mockRejectedValue(
        new BadRequestException(),
      );
      await expect(controller.uploadMultiple([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when files array is null', async () => {
      mockUploadsService.uploadMultiple.mockRejectedValue(
        new BadRequestException(),
      );
      await expect(controller.uploadMultiple(null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle files with invalid types', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };
      mockUploadsService.uploadMultiple.mockRejectedValue(
        new BadRequestException(),
      );
      await expect(controller.uploadMultiple([invalidFile])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle files exceeding size limit', async () => {
      const largeFile = { ...mockFile, size: 16 * 1024 * 1024 }; // 16MB
      mockUploadsService.uploadMultiple.mockRejectedValue(
        new BadRequestException(),
      );
      await expect(controller.uploadMultiple([largeFile])).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('should return a file by id', async () => {
      mockUploadsService.findById.mockResolvedValue(mockUpload);

      const result = await controller.findById('1');

      expect(result).toEqual(mockUpload);
      expect(uploadsService.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a file successfully', async () => {
      const updatedUpload = { ...mockUpload, filename: 'updated.jpg' };
      mockUploadsService.update.mockResolvedValue(updatedUpload);

      const result = await controller.update('1', mockFile);

      expect(result).toEqual(updatedUpload);
      expect(uploadsService.update).toHaveBeenCalledWith('1', mockFile);
    });

    it('should throw BadRequestException when no file is provided', async () => {
      mockUploadsService.update.mockRejectedValue(new BadRequestException());

      await expect(controller.update('1', null)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
