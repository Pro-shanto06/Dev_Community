import { IsString, IsEmail, IsNotEmpty, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  fname: string;

  @IsString()
  @IsNotEmpty()
  lname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsArray()
  @IsString({ each: true })
  experiences?: string[];
}
