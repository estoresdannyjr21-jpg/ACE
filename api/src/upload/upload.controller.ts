import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { UserRole } from '@prisma/client';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Get('files/:type/:filename')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.DRIVER,
    UserRole.FINANCE_PERSONNEL,
  )
  @ApiOperation({ summary: 'Download a file by type and filename (fileKey = type/filename)' })
  async getFile(@Param('type') type: string, @Param('filename') filename: string, @Res() res: Response) {
    const fileKey = `${type}/${filename}`;
    const filePath = this.upload.getFilePath(fileKey);
    res.sendFile(filePath);
  }

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.DRIVER,
    UserRole.FINANCE_PERSONNEL,
  )
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } })) // 15MB
  @ApiOperation({ summary: 'Upload a file; returns fileKey for use in POD, events, reimbursables, etc.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['pod', 'reimbursable', 'event-media', 'incident', 'general'], description: 'Bucket/folder type' },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type?: string,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    const safeType = type && ['pod', 'reimbursable', 'event-media', 'incident', 'general'].includes(type)
      ? type
      : 'general';
    return this.upload.saveFile(file.buffer, file.originalname || 'file', safeType);
  }
}
