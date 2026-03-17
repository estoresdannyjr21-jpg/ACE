import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FcmService implements OnModuleInit {
  private initialized = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const credPath =
      this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ||
      this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!credPath) return;

    try {
      const resolved = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
      if (fs.existsSync(resolved)) {
        const cred = JSON.parse(fs.readFileSync(resolved, 'utf8'));
        if (!admin.apps.length) {
          admin.initializeApp({ credential: admin.credential.cert(cred) });
        }
        this.initialized = true;
      }
    } catch {
      // FCM disabled if cred file missing or invalid
    }
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string[]> {
    const invalidTokens: string[] = [];
    if (!this.initialized || !tokens.length) return invalidTokens;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
      android: { priority: 'high' as const },
    };

    try {
      const result = await admin.messaging().sendEachForMulticast(message);
      result.responses.forEach((resp, i) => {
        if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[i]);
        }
      });
    } catch {
      // Log and skip; don't fail notification create
    }
    return invalidTokens;
  }
}
