import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role } from '@prisma/client';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: jest.Mocked<Partial<CategoriesService>>;

  const mockCategory = {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCategoriesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get(CategoriesService);
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
      };

      service.create.mockResolvedValue(mockCategory);

      const result = await controller.create(createCategoryDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      service.findAll.mockResolvedValue([mockCategory]);

      const result = await controller.findAll();

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toEqual(mockCategory);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      service.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Electronics',
      };

      service.update.mockResolvedValue({
        ...mockCategory,
        ...updateCategoryDto,
      });

      const result = await controller.update('1', updateCategoryDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateCategoryDto.name);
      expect(service.update).toHaveBeenCalledWith('1', updateCategoryDto);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
