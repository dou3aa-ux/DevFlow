import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user/user';
import { UserRole } from '../auth/enums/role.enum';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';

@Injectable()
export class UsersService {
    constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    ) {}

    async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
    }

    async create(data: { username: string; email: string; password: string }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
    }

  // --- Admin-only methods below ---

    async findAll(): Promise<User[]> {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
    }

    async adminCreate(dto: AdminCreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
        username: dto.username,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        isActive: true,
    });
    return this.usersRepo.save(user);
    }

    async updateRole(id: number, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.usersRepo.save(user);
    }

    async updateStatus(id: number, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    user.isActive = isActive;
    return this.usersRepo.save(user);
    }
}