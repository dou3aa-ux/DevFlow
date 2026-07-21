import { Controller, Post, Body, UsePipes, ValidationPipe, HttpCode ,UseGuards,Req, Get} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
}

    @Post('login')
    @HttpCode(200)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
    }
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req) {
    return req.user; // whatever your JwtStrategy's validate() returns
}
}