import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDTO } from 'src/modules/user/dto/create-user.dto';
import { IsString } from 'class-validator';

export class SignUpRequestDTO extends CreateUserDTO {}

export class SignInRequestDTO {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}
