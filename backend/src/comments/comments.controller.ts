import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Query('taskId') taskId: string, @Body() dto: CreateCommentDto, @Req() req: any) {
    const authorId = req.user.userId;
    return this.commentsService.create(+taskId, authorId, dto);
  }

  @Get()
  findAllByTask(@Query('taskId') taskId: string) {
    return this.commentsService.findAllByTask(+taskId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(+id);
  }
}