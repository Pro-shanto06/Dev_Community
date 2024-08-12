import { IsString, IsNotEmpty, IsOptional, IsDate, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class ExperienceDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  company: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsNotEmpty()
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => value ? new Date(value) : null)
  endDate?: Date;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
