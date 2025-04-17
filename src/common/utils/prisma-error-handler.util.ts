import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: any): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException('Resource already exists');
      case 'P2025':
        throw new ConflictException('Resource does not exist');
      default:
        throw new InternalServerErrorException(
          `Database error: ${error.message}`,
        );
    }
  }
  throw error;
}
