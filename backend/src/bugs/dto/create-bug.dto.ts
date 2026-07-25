import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { TaskPriority } from '../../tasks/entities/task.entity';

export class CreateBugDto {
    @IsString()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TaskPriority)
    severity?: TaskPriority;

    @IsOptional()
    @IsString()
    deviceInfo?: string;

    @IsOptional()
    @IsString()
    screenshotUrl?: string;
}