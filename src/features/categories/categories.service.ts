import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';
import { handlePrismaError } from '../../common/utils/prisma-error-handler.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  private readonly defaultCategorySelect =
    Prisma.validator<Prisma.CategorySelect>()({
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    });

  private readonly defaultInclude = {
    _count: {
      select: {
        products: true,
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    try {
      const category = await this.prisma.category.create({
        data: createCategoryDto,
      });

      this.logger.log(`Category created: ${category.id} - ${category.name}`);
      return category;
    } catch (error) {
      this.logger.error(`Failed to create category: ${error}`);
      handlePrismaError(error);
    }
  }

  async findAll(): Promise<CategoryEntity[]> {
    try {
      const categories = await this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return categories;
    } catch (error) {
      this.logger.error(`Failed to fetch categories: ${error}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<CategoryEntity> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      return category;
    } catch (error) {
      this.logger.error(`Failed to fetch category ${id}: ${error}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryEntity> {
    await this.findOne(id); // Verify existence

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: this.defaultInclude,
      });

      this.logger.log(`Category updated: ${id} - ${category.name}`);
      return category;
    } catch (error) {
      this.logger.error(`Failed to update category ${id}: ${error}`);
      handlePrismaError(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify existence

    try {
      await this.prisma.category.delete({
        where: { id },
      });
      this.logger.log(`Category deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete category ${id}: ${error}`);
      handlePrismaError(error);
    }
  }
}
