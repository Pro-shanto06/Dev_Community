import { IsString, IsNotEmpty, IsEmail, IsOptional, IsArray, ValidateNested, IsUrl, Matches, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { SkillDto } from './skill.dto';
import { ExperienceDto } from './experience.dto';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  fname: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  lname: string;

  @IsEmail()
  @IsNotEmpty()
  @Length(5, 100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/, { message: 'Password must include uppercase, lowercase, numbers, and special characters' })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:\+8801|01)[3-9]\d{8}$/, { message: 'Invalid phone number format for Bangladesh' })
  phone?: string;

  @IsOptional()
  @IsUrl()
  @Length(0, 200)
  profilePic?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];
}
