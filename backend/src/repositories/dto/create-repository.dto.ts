import { IsString, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { GitProvider } from '../entities/repository.entity';

export class CreateRepositoryDto {
  @IsUrl()
  url!: string;

  @IsEnum(GitProvider)
  provider!: GitProvider;

  @IsOptional()
  @IsString()
  accessToken?: string;
}