import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SkillDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  level: string;
}
