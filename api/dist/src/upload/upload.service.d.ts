import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private config;
    constructor(config: ConfigService);
    getFilePath(fileKey: string): string;
    saveFile(buffer: Buffer, originalName: string, type?: string): {
        fileKey: string;
    };
}
