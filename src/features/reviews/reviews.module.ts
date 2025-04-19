import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaModule } from '../../database/prisma.module';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
