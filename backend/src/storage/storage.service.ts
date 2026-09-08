import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private client: Minio.Client;
    private bucket: string;

    constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
        endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
        port: +this.configService.get('MINIO_PORT', 9000),
        useSSL: false,
        accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
        secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });
    this.bucket = this.configService.get('MINIO_BUCKET', 'devflow-artifacts');
    }

    async onModuleInit() {
      try {
        const exists = await this.client.bucketExists(this.bucket).catch(() => false);
        if (!exists) {
          await this.client.makeBucket(this.bucket).catch((err) => {
            this.logger.warn(`MinIO makeBucket notice: ${err.message}`);
          });
          this.logger.log(`MinIO bucket configured: ${this.bucket}`);
        }
      } catch (err: any) {
        this.logger.warn(`MinIO connection warning (app will proceed): ${err?.message}`);
      }
    }

    async uploadFile(localFilePath: string, objectName: string): Promise<string> {
        await this.client.fPutObject(this.bucket, objectName, localFilePath);
        return objectName;
    }

    async getPresignedUrl(objectName: string): Promise<string> {
        return this.client.presignedGetObject(this.bucket, objectName, 60 * 60);
    }
}