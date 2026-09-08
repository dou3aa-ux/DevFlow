import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getRoot() {
    return this.appService.getInfo();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('seed-admin')
  async seedAdmin() {
    return this.usersService.seedAdmin();
  }

  @Get('users-debug')
  async getUsersDebug() {
    const users = await this.usersService.findAll();
    return users.map((u) => ({ id: u.id, username: u.username, email: u.email, role: u.role, isActive: u.isActive }));
  }
}

