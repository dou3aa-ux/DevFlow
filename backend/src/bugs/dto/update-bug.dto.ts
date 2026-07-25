import { PartialType } from '@nestjs/mapped-types';
import { CreateBugDto } from './create-bug.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { TaskStatus } from '../../tasks/entities/task.entity';

export class UpdateBugDto extends PartialType(CreateBugDto) {
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;
}