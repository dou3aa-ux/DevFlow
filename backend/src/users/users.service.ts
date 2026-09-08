import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user/user';
import { UserRole } from '../auth/enums/role.enum';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { generateTempPassword } from './utils/generate-temp-password';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    try {
      const adminEmail = 'admin@devflow.io';
      const hashedPassword = await bcrypt.hash('admin123', 10);
      let admin = await this.usersRepo.findOne({
        where: [{ email: adminEmail }, { username: 'System Admin' }],
      });

      if (!admin) {
        admin = this.usersRepo.create({
          username: 'System Admin',
          email: adminEmail,
          password: hashedPassword,
          role: UserRole.ADMINISTRATOR,
          isActive: true,
        });
      } else {
        admin.email = adminEmail;
        admin.username = 'System Admin';
        admin.password = hashedPassword;
        admin.role = UserRole.ADMINISTRATOR;
        admin.isActive = true;
      }
      const saved = await this.usersRepo.save(admin);
      console.log('✅ Administrator account verified: admin@devflow.io / admin123 (Role: ADMINISTRATOR)');
      return { success: true, user: { id: saved.id, email: saved.email, role: saved.role } };
    } catch (err: any) {
      console.error('Failed to seed admin user:', err?.message);
      return { success: false, error: err?.message };
    }
  }

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

  // Returns both the created user AND the plain temp password —
  // this is the ONLY moment the plain password is ever available.
  // The frontend must show it once and never fetch it again (it isn't stored anywhere in plain text).
  async adminCreate(dto: AdminCreateUserDto): Promise<{ user: Omit<User, 'password'>; tempPassword: string }> {
    const existingEmail = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUsername = await this.usersRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictException(`Username "${dto.username}" already exists. Please choose a different name.`);

    const plainPassword = dto.password ?? generateTempPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = this.usersRepo.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      isActive: true,
    });

    try {
      const saved = await this.usersRepo.save(user);
      const { password, ...userWithoutPassword } = saved;
      return { user: userWithoutPassword, tempPassword: plainPassword };
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException('A user with this username or email already exists');
      }
      throw err;
    }
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