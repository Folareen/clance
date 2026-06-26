import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(
    @Query('q') query: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!query || query.trim().length < 2) {
      return { tasks: [], notes: [], messages: [], files: [], members: [] };
    }
    return this.searchService.search(user.id, query.trim());
  }
}
