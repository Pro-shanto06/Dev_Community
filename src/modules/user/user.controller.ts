import { Controller, Post, Body, Get, Param, Put, Delete, Req, UseGuards, BadRequestException, UseInterceptors,UploadedFile  } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SkillDto } from './dto/skill.dto';
import { ExperienceDto } from './dto/experience.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from './schemas/user.schema';
import { SerializationInterceptor } from '../../common/interceptors/serialization.interceptor';
import { UserDto } from './dto/user.dto';

@Controller('users')
// @UseInterceptors(new SerializationInterceptor(UserDto))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  async getAll() {
    return this.userService.getAll();
  }
  
  @Get('profile')
  @UseGuards(JwtAuthGuard) 
  async getProfile(@Req() req): Promise<any> {
    const userId = req.user.userId;
    return this.userService.findById(userId);
  }

  @Post('profile-pic')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profilePic'))
  async updateProfilePic(@Req() req, @UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const userId = req.user.userId;
    return this.userService.updateProfilePic(userId, file);
  }


  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Put(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() body: { currentPassword: string, newPassword: string }
  ) {
    return this.userService.changePassword(id, body.currentPassword, body.newPassword);
  }


  @Post(':id/skills')
  async addSkill(
    @Param('id') id: string,
    @Body() skillDto: SkillDto,
  ) {
    return this.userService.addSkill(id, skillDto);
  }

  @Post(':id/experiences')
  async addExperience(
    @Param('id') id: string,
    @Body() experienceDto: ExperienceDto,
  ) {
    return this.userService.addExperience(id, experienceDto);
  }

 
  @Put(':id/skills/:skillName')
  async updateSkill(
    @Param('id') id: string,
    @Param('skillName') skillName: string,
    @Body() skillDto: SkillDto,
  ) {
    return this.userService.updateSkill(id, skillName, skillDto);
  }


  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.userService.delete(id);
  }
}
