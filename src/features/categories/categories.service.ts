import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}


  async create(createCategoryDto: CreateCategoryDto): Promise<CreateCategoryDto> {
    try {
      const category = await this.prisma.category.create({
        data: createCategoryDto
      });

      return category  ;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(query: QueryCategoryDto): Promise<CreateCategoryDto[]> {
    const { search, sortOrder = 'desc' } = query;
    const where = this.buildSearchQuery(search);

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: {
        name: sortOrder
      }
    });

    return categories ;
  }

  async findOne(id: string): Promise<QueryCategoryDto> {
    const category = await this.prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return ;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<QueryCategoryDto> {
    await this.findOne(id);

    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto
      });

      return ;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted successfully' };
  }

  private buildSearchQuery(search?: string): Prisma.CategoryWhereInput {
    return {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
      ],
    };
  }

  private handlePrismaError(error: any): never {
    if (error.code === 'P2002') {
      throw new ConflictException('Category name already exists');
    }
    throw error;
  }
}
