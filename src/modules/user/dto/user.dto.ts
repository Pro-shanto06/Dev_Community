import { Expose } from 'class-transformer';
import { SkillDto } from './skill.dto';
import { ExperienceDto } from './experience.dto';

export class UserDto {
  @Expose()
  id?: string;

  @Expose()
  fname: string;

  @Expose()
  lname: string;

  @Expose()
  email: string;

  @Expose()
  phone?: string;

  @Expose()
  profilePic?: string;

  @Expose()
  skills?: SkillDto[];

  @Expose()
  experiences?: ExperienceDto[];
}
