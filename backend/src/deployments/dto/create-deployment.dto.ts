import { IsInt, IsEnum } from 'class-validator';
import { DeployEnvironment } from '../entities/deployment.entity';

export class CreateDeploymentDto {
    @IsInt()
    buildId!: number;

    @IsEnum(DeployEnvironment)
    environment!: DeployEnvironment;
}