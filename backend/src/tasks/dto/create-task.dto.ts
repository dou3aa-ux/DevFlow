import { IsString, IsOptional, IsEnum, IsInt, MaxLength } from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
    @IsString()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsInt()
    sprintId?: number;

    @IsOptional()
    @IsInt()
    assigneeId?: number;
}