import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy(times) {
            return Math.min(times * 500, 3000);
          },
        });
        client.on('error', (err) => {
          // Non-fatal warning so missing/restarting Redis does not crash backend process
          console.warn(`[Redis] Connection notice (non-fatal): ${err.message}`);
        });
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}