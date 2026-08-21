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

    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)  // if you want admin-only
    @Roles(UserRole.ADMINISTRATOR)       // import Roles + UserRole
    findAllAdmin() {
    return this.projectsService.findAllAdmin();
    }

    @Delete(':id/members/:userId')
    removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(+id, +userId);
    }

    async removeMember(projectId: number, userId: number): Promise<Project> {
    const project = await this.findOne(projectId);
    project.members = (project.members ?? []).filter((m) => m.id !== userId);
    return this.projectsRepository.save(project);
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