import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, Logger } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  const mockCategory = {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      products: 0
    }
  };

  const mockPrismaService = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeAll(() => {
    // Disable logger during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
      };

      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.create(createCategoryDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createCategoryDto.name);
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: createCategoryDto,
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).toEqual(mockCategory);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Electronics',
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.update.mockResolvedValue({
        ...mockCategory,
        ...updateCategoryDto,
      });

      const result = await service.update('1', updateCategoryDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateCategoryDto.name);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateCategoryDto,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if category to update not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('999', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.category.delete.mockResolvedValue(mockCategory);

      await service.remove('1');

      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if category to delete not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});