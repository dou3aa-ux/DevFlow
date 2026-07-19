import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

    @Column({ default: 'DEVELOPER' })
    role!: string;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
}