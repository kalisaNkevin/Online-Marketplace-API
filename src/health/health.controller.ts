import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  HealthIndicatorResult 
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private configService: ConfigService,
  ) {}

  @Get('rabbitmq')
  @HealthCheck()
  async checkRabbitMQ(): Promise<HealthIndicatorResult> {
    try {
      const connection = await amqp.connect(
        this.configService.get('RABBITMQ_URL')
      );
      await connection.close();
      
      return {
        rabbitmq: {
          status: 'up',
          message: 'RabbitMQ connection successful'
        }
      };
    } catch (error) {
      return {
        rabbitmq: {
          status: 'down',
          message: error
        }
      };
    }
  }
}