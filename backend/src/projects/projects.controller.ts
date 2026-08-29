import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/role.enum';

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

  // Admin-only: list every project, not just ones the caller is a member of.
  // Must come BEFORE ':id' below, or Nest will try to match "admin" as an id.
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMINISTRATOR)
  findAllAdmin() {
    return this.projectsService.findAllAdmin();
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

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(+id, +userId);
  }
}