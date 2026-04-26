// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Giả sử bạn đã có user sau khi xác thực

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền truy cập!');
    }
    return true;
  }
}