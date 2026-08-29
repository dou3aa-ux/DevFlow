import { IsEmail, IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '../../auth/enums/role.enum';

export class AdminCreateUserDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username!: string;

    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string; // if omitted, the backend generates one automatically

    @IsEnum(UserRole)
    role!: UserRole;
}