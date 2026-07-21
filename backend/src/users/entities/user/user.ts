import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../../../auth/enums/role.enum';   // adjust path if needed

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.DEVELOPER })
    role!: UserRole;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
}