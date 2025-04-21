import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { ConfigService } from '@nestjs/config';

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'CLOUDINARY_CLOUD_NAME':
          return 'test_cloud';
        case 'CLOUDINARY_API_KEY':
          return 'test_key';
        case 'CLOUDINARY_API_SECRET':
          return 'test_secret';
        default:
          return null;
      }
    }),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('uploadImage', () => {
    it('should throw error for non-image files', async () => {
      const nonImageFile = { ...mockFile, mimetype: 'application/pdf' };
      await expect(service.uploadImage(nonImageFile)).rejects.toThrow(
        'Only images are allowed',
      );
    });
  });
});
