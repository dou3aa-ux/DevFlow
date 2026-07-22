import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) {}

    @Post()
    create(@Body() createProjectDto: any, @Req() req: any) {
    const userId = req.user.userId;
    return this.projectsService.create(createProjectDto, userId);
    }

    @Get()
    findAll(@Req() req: any) {
    const userId = req.user.userId;
    return this.projectsService.findAll(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProjectDto: any) {
    return this.projectsService.update(+id, updateProjectDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
    }

    @Post(':id/members')
    addMember(@Param('id') id: string, @Body('userId') userId: number) {
    return this.projectsService.addMember(+id, userId);
    }
}