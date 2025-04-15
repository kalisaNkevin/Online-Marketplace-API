import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { CloudinaryService } from './cloudinary.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [UploadsController],
  providers: [UploadsService, CloudinaryService],
  exports: [UploadsService],
})
export class UploadsModule {}
