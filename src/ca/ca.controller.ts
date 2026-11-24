import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CaService } from './ca.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { ITRStatus } from '../common/enums';

@ApiTags('CA Workspace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CA_ADMIN, UserRole.CHARTERED_ACCOUNTANT, UserRole.CA_EMPLOYEE, UserRole.SUPER_ADMIN)
@Controller('ca')
export class CaController {
  constructor(private readonly caService: CaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'CA dashboard stats' })
  getDashboard(@CurrentUser() user: any, @Query('caId') caId?: string) {
    return this.caService.getDashboard(user.organizationId, caId);
  }

  @Get('clients')
  @ApiOperation({ summary: 'List CA clients' })
  findAllClients(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('assignedCaId') assignedCaId?: string,
  ) {
    return this.caService.findAllClients(user.organizationId, assignedCaId, page, limit);
  }

  @Post('clients')
  @ApiOperation({ summary: 'Create CA client' })
  createClient(@Body() dto: any, @CurrentUser() user: any) {
    return this.caService.createClient(dto, user.id, user.organizationId);
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get CA client details' })
  findClient(@Param('id') id: string, @CurrentUser() user: any, @Query('fullPan') fullPan?: boolean) {
    return this.caService.findClientById(id, user.organizationId, fullPan);
  }

  @Post('clients/:clientId/itr')
  @ApiOperation({ summary: 'Create ITR record for client' })
  createItr(@Param('clientId') clientId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.caService.createItrRecord(clientId, dto, user.id, user.organizationId);
  }

  @Get('itr/:itrId')
  @ApiOperation({ summary: 'Get ITR record details' })
  getItr(@Param('itrId') itrId: string, @CurrentUser() user: any) {
    return this.caService.getItrRecord(itrId, user.organizationId);
  }

  @Patch('itr/:itrId/status')
  @ApiOperation({ summary: 'Update ITR status' })
  updateItrStatus(
    @Param('itrId') itrId: string,
    @Body() body: { status: ITRStatus; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.caService.updateItrStatus(itrId, body.status, user.id, user.organizationId, body.notes);
  }

  @Post('itr/:itrId/documents')
  @ApiOperation({ summary: 'Upload document to ITR' })
  addDocument(@Param('itrId') itrId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.caService.addDocument(itrId, dto, user.id, user.organizationId);
  }

  @Get('clients/:clientId/documents')
  @ApiOperation({ summary: 'Get client documents' })
  getDocuments(
    @Param('clientId') clientId: string,
    @CurrentUser() user: any,
    @Query('assessmentYear') ay?: string,
  ) {
    return this.caService.getDocuments(clientId, user.organizationId, ay);
  }

  @Patch('documents/:docId/verify')
  @ApiOperation({ summary: 'Verify document' })
  verifyDocument(@Param('docId') docId: string, @CurrentUser() user: any) {
    return this.caService.verifyDocument(docId, user.id, user.organizationId);
  }

  @Get('itr/:itrId/readiness')
  @ApiOperation({ summary: 'Check ITR readiness' })
  checkReadiness(@Param('itrId') itrId: string, @CurrentUser() user: any) {
    return this.caService.checkItrReadiness(itrId, user.organizationId);
  }

  @Post('itr/:itrId/reconciliation')
  @ApiOperation({ summary: 'Add reconciliation record' })
  addReconciliation(@Param('itrId') itrId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.caService.addReconciliation(itrId, dto, user.id, user.organizationId);
  }
}
