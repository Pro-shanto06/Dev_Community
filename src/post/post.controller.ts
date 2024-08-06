import { Controller, Post, Body, Param, Put, Delete, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() request: any
  ) {
    const token = request.headers.authorization?.split(' ')[1];

    return this.postService.create(createPostDto, token);
  }

  @Get()
  async findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() request: any
  ) {
    const token = request.headers.authorization?.split(' ')[1];

    return this.postService.update(id, updatePostDto, token);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id') id: string,
    @Req() request: any
  ) {
    const token = request.headers.authorization?.split(' ')[1];
 
    return this.postService.delete(id, token);
  }
}
