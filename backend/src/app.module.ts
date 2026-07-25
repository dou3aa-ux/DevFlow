import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { SprintsModule } from './sprints/sprints.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { BugsModule } from './bugs/bugs.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: true,
    retryAttempts: 10,
    retryDelay: 3000,
  }),
  inject: [ConfigService],
}),
    AuthModule,
    UsersModule,
    ProjectsModule,
    SprintsModule,
    TasksModule,
    CommentsModule,
    BugsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}