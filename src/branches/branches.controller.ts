import { Controller, Get, Post, Patch, Param, Body, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.organizationId);
  }

  @Get(':id')
  get(@Request() req: any, @Param('id') id: string) {
    return this.service.get(id, req.user.organizationId);
  }

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.service.create(req.user.organizationId, data);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.update(id, req.user.organizationId, data);
  }

  @Patch(':id/deactivate')
  deactivate(@Request() req: any, @Param('id') id: string) {
    return this.service.deactivate(id, req.user.organizationId);
  }
}
