import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ProjectService } from './project.service';
import { FileService } from '../upload/file.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  InviteMemberDto,
  UpdateMemberDto,
  AcceptInviteDto,
  AcceptInviteWithSignupDto,
} from './dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private project: ProjectService,
    private fileService: FileService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return this.project.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: AuthUser) {
    return this.project.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.project.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.project.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.project.remove(id, user.id);
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  invite(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.project.invite(id, dto, user);
  }

  @Post('accept-invite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Body() dto: AcceptInviteDto, @CurrentUser() user: AuthUser) {
    await this.project.acceptInvite(dto.token, user);
    return { message: 'Invite accepted' };
  }

  @Post('accept-invite/signup')
  @HttpCode(HttpStatus.CREATED)
  acceptInviteWithSignup(@Body() dto: AcceptInviteWithSignupDto) {
    return this.project.acceptInviteWithSignup(dto);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async leaveProject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.project.leaveProject(id, user.id);
    return { message: 'You have left the project' };
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id') id: string,
    @Param('memberId') member_id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.project.removeMember(id, member_id, user.id);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  updateMember(
    @Param('id') id: string,
    @Param('memberId') member_id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.project.updateMember(id, member_id, dto, user.id);
  }

  @Get(':id/files')
  @UseGuards(JwtAuthGuard)
  listFiles(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.fileService.listByProject(id, user.id);
  }
}
