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
import { RepositoriesModule } from './repositories/repositories.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { BuildsModule } from './builds/builds.module';
import { StorageModule } from './storage/storage.module';
import { ArtifactsModule } from './artifacts/artifacts.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';



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
    RepositoriesModule,
    WebhooksModule,
    BuildsModule,
    StorageModule,
    ArtifactsModule,
    DeploymentsModule,
    InfrastructureModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}