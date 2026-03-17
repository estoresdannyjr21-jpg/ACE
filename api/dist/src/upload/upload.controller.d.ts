import { Response } from 'express';
import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly upload;
    constructor(upload: UploadService);
    getFile(type: string, filename: string, res: Response): Promise<void>;
    uploadFile(file: Express.Multer.File, type?: string): Promise<{
        fileKey: string;
    }>;
}
