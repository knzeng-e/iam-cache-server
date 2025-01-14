import { Global, Module } from '@nestjs/common';
import { ApplicationService } from '../application/application.service';
import { CookiesServices } from './cookies.service';
import { JwtAuthGuard } from './jwt.guard';
import { LoginController } from './login.controller';
import { LoginGuard } from './login.guard';
import { RefreshTokenRepository } from './refreshToken.repository';
import { TokenService } from './token.service';
import { RoleModule } from '../role/role.module';
import { JwtStrategy } from './jwt.strategy';
import { AuthStrategy } from './login.strategy';
import { GqlAuthGuard } from './jwt.gql.guard';
import { JwtModule } from '@nestjs/jwt';
import { getJWTConfig } from '../../jwt/config';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    RoleModule,
    JwtModule.registerAsync({
      useFactory: getJWTConfig,
      inject: [ConfigService],
    }),
  ],

  controllers: [LoginController],
  providers: [
    CookiesServices,
    ApplicationService,
    LoginGuard,
    JwtAuthGuard,
    RefreshTokenRepository,
    TokenService,
    JwtStrategy,
    AuthStrategy,
    GqlAuthGuard,
  ],
  exports: [JwtAuthGuard, JwtStrategy, GqlAuthGuard],
})
export class AuthModule {}
