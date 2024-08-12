import { Expose } from 'class-transformer';
import { SkillDto } from './create-user.dto'
import { ExperienceDto } from './create-user.dto'

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
