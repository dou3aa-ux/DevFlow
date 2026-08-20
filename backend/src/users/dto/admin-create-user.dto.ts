import { IsEmail, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '../../auth/enums/role.enum';

export class AdminCreateUserDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsEnum(UserRole)
    role!: UserRole;
}