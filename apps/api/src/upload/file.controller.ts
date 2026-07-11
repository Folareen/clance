import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { FileService } from './file.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private fileService: FileService) {}

  @Get()
  listForUser(@CurrentUser() user: AuthUser) {
    return this.fileService.listForUser(user.id);
  }
}
