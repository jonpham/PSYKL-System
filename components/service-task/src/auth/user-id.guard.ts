import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  userId?: string;
}

@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const raw = req.headers['x-user-id'];

    if (raw === undefined) {
      throw new UnauthorizedException('Missing X-User-Id header');
    }

    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ForbiddenException('Malformed X-User-Id header');
    }

    req.userId = value.trim();
    return true;
  }
}
