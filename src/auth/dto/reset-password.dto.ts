import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches, IsUUID, IsNotEmpty } from 'class-validator';
import { Match } from '../decorators/match.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Reset token received via email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'New password',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character'
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword: string;
}