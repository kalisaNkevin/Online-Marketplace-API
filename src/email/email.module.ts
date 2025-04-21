import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTestController } from './email.controller';

@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  controllers: [EmailTestController],
  exports: [EmailService],
})
export class EmailModule {}
