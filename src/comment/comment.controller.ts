import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request,Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':postId')
  create(@Param('postId') postId: string, @Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentService.create(postId, createCommentDto, req.headers.authorization.split(' ')[1]);
  }

  @Get()
  findAll(@Query('postId') postId: string) {
    return this.commentService.findAll(postId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto, @Request() req) {
    return this.commentService.update(id, updateCommentDto, req.headers.authorization.split(' ')[1]);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.commentService.delete(id, req.headers.authorization.split(' ')[1]);
  }
}
