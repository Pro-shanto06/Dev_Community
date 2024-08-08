import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isAuthorized = await super.canActivate(context);
      return isAuthorized as boolean;
    } catch (error) {
      this.logger.error(`JWT authentication failed`);
      throw new UnauthorizedException('You are not authorized to access this resource');
    }
  }
}
