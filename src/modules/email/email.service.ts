import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  async sendEmail(email: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: subject,
        html: html,
      });
    } catch (e) {
      console.error(`Failed to send email! ${e}`);
    }
  }
}
