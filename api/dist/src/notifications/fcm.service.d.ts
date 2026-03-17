import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class FcmService implements OnModuleInit {
    private config;
    private initialized;
    constructor(config: ConfigService);
    onModuleInit(): void;
    sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<string[]>;
}
