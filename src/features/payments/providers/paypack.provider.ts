import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaypackProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    // Use sandbox URL for testing
    this.baseUrl =
      this.configService.get('NODE_ENV') === 'production'
        ? 'https://payments.paypack.rw/api'
        : 'https://sandbox.paypack.rw/api';
    this.apiKey = this.configService.get('PAYPACK_API_KEY');
  }

  async authenticate() {
    const response = await axios.post(`${this.baseUrl}/auth/agents/authorize`, {
      client_id: this.configService.get('PAYPACK_CLIENT_ID'),
      client_secret: this.configService.get('PAYPACK_CLIENT_SECRET'),
    });
    return response.data.access_token;
  }

  async createPayment(data: {
    amount: number;
    phone: string;
    orderId: string;
  }) {
    // Test phone numbers:
    // MTN: 250781234567
    // Airtel: 250731234567
    const token = await this.authenticate();

    try {
      const response = await axios.post(
        `${this.baseUrl}/transactions/cashin`,
        {
          amount: data.amount,
          phone: data.phone,
          environment: 'sandbox',
          callbackUrl: `${this.configService.get('APP_URL')}/payments/webhook`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Payment failed: ${error}`);
    }
  }
}
