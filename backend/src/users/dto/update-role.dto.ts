import { IsEnum } from 'class-validator';
import { UserRole } from '../../auth/enums/role.enum';

export class UpdateRoleDto {
    @IsEnum(UserRole)
    role!: UserRole;
}