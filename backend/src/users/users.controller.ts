import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles(UserRole.ADMINISTRATOR)
    findAll() {
    return this.usersService.findAll();
    }

    @Post()
    @Roles(UserRole.ADMINISTRATOR)
    create(@Body() dto: AdminCreateUserDto) {
    return this.usersService.adminCreate(dto);
    }

    @Patch(':id/role')
    @Roles(UserRole.ADMINISTRATOR)
    updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(+id, dto.role);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMINISTRATOR)
    updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.usersService.updateStatus(+id, dto.isActive);
    }
}