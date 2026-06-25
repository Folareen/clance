import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.fromEmail = this.config.getOrThrow<string>('FROM_EMAIL');
  }

  async sendProjectInviteEmail(to: string, token: string, project_name: string, inviter_name: string) {
    const inviteUrl = `${this.config.getOrThrow<string>('FRONTEND_URL')}/invite?token=${token}`;

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: `You've been invited to ${project_name}`,
      html: `
        <p>${inviter_name} invited you to join <strong>${project_name}</strong> on Clance.</p>
        <p><a href="${inviteUrl}">Click here to accept the invite</a></p>
      `,
    });
  }

  async sendLoginCodeEmail(to: string, code: string) {
    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: `${code} is your Clance sign-in code`,
      html: `
        <p>Your sign-in code is:</p>
        <h1 style="font-size:32px;letter-spacing:6px;font-family:monospace;margin:16px 0">${code}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${this.config.getOrThrow<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Reset your password',
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
  }
}
