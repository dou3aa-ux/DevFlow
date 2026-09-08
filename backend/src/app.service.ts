import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'DevFlow API',
      status: 'online',
      version: '1.0.0',
      description: 'Collaborative software development lifecycle & CI/CD platform',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth() {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
