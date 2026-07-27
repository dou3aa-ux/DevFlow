import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { RepositoriesModule } from '../repositories/repositories.module';
import { BuildsModule } from '../builds/builds.module';

@Module({
  imports: [RepositoriesModule, BuildsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}