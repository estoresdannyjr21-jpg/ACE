import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {}

  getFilePath(fileKey: string): string {
    const uploadDir = this.config.get<string>('UPLOAD_PATH', 'uploads');
    const base = path.join(process.cwd(), uploadDir);
    const resolved = path.resolve(base, fileKey);
    if (!resolved.startsWith(path.resolve(base))) {
      throw new NotFoundException('File not found');
    }
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      throw new NotFoundException('File not found');
    }
    return resolved;
  }

  saveFile(
    buffer: Buffer,
    originalName: string,
    type: string = 'general',
  ): { fileKey: string } {
    const ext = path.extname(originalName) || '.bin';
    const safeExt = ext.slice(0, 20).replace(/[^a-zA-Z0-9.]/g, '');
    const filename = `${uuidv4()}${safeExt}`;
    const uploadDir = this.config.get<string>('UPLOAD_PATH', 'uploads');
    const dir = path.join(process.cwd(), uploadDir, type);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    const fileKey = `${type}/${filename}`;
    return { fileKey };
  }
}
