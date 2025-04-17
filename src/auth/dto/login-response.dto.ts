import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 200,
    description: 'HTTP Status code',
  })
  statusCode: number;

  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  data: {
    accessToken: string;
    refreshToken: string;
  };
}
