import nodemailer from 'nodemailer';
import type { EmailTemplate, InsertEmailHistory } from '@shared/schema';

interface EmailOptions {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  text: string;
  templateId?: string;
}

interface EmailVariables {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  propertyType?: string;
  city?: string;
  address?: string;
  surface?: number;
  estimatedValue?: string;
  message?: string;
  subject?: string;
  projectType?: string;
  projectAmount?: string;
  [key: string]: any;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private static instance: EmailService;

  private constructor() {
    const config = this.getSmtpConfig();
    this.transporter = nodemailer.createTransport(config);
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getSmtpConfig() {
    const host = process.env.EMAIL_HOST || 'bus.o2switch.net';
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = port === 465; // true for 465, false for other ports
    
    const config = {
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: process.env.EMAIL_USER || 'no-reply@estimation-immobilier-gironde.fr',
        pass: process.env.EMAIL_PASS || 'your-email-password'
      },
      // Additional O2Switch specific settings
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    };

    console.log(`Email service configured for ${host}:${port} (secure: ${secure})`);
    return config;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mailOptions = {
        from: `${options.fromName || 'Estimation Gironde'} <${options.from}>`,
        to: options.toName ? `${options.toName} <${options.to}>` : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  renderTemplate(template: EmailTemplate, variables: EmailVariables): { html: string; text: string; subject: string } {
    let { htmlContent, textContent, subject } = template;

    // Replace variables in all content
    Object.keys(variables).forEach(key => {
      const value = variables[key]?.toString() || '';
      const placeholder = `{{${key}}}`;
      
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
      html: htmlContent,
      text: textContent,
      subject
    };
  }

  async sendTemplatedEmail(
    template: EmailTemplate,
    variables: EmailVariables,
    to: string,
    toName?: string,
    from?: string,
    fromName?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; emailHistory?: InsertEmailHistory }> {
    const rendered = this.renderTemplate(template, variables);
    
    const defaultFrom = this.getDefaultFromAddress(template.category);
    const emailOptions: EmailOptions = {
      to,
      toName,
      from: from || defaultFrom.email,
      fromName: fromName || defaultFrom.name,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      templateId: template.id
    };

    const result = await this.sendEmail(emailOptions);

    // Create email history record
    const emailHistory: InsertEmailHistory = {
      templateId: template.id,
      recipientEmail: to,
      recipientName: toName,
      senderEmail: emailOptions.from,
      subject: rendered.subject,
      htmlContent: rendered.html,
      textContent: rendered.text,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error,
      sentAt: result.success ? new Date() : null
    };

    return {
      ...result,
      emailHistory
    };
  }

  private getDefaultFromAddress(category: string): { email: string; name: string } {
    switch (category) {
      case 'contact_confirmation':
      case 'estimation_confirmation':
      case 'financing_confirmation':
        return {
          email: 'no-reply@estimation-immobilier-gironde.fr',
          name: 'Estimation Gironde'
        };
      case 'admin_notification_contact':
      case 'admin_notification_estimation':
      case 'admin_notification_financing':
        return {
          email: 'contact@estimation-immobilier-gironde.fr',
          name: 'Système Estimation Gironde'
        };
      default:
        return {
          email: 'no-reply@estimation-immobilier-gironde.fr',
          name: 'Estimation Gironde'
        };
    }
  }

  async sendBulkEmails(
    template: EmailTemplate,
    recipients: Array<{ email: string; name?: string; variables: EmailVariables }>,
    delay: number = 1000
  ): Promise<{ sent: number; failed: number; results: Array<{ email: string; success: boolean; error?: string }> }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        const result = await this.sendTemplatedEmail(
          template,
          recipient.variables,
          recipient.email,
          recipient.name
        );

        results.push({
          email: recipient.email,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }

        // Add delay between emails to avoid rate limiting
        if (delay > 0 && recipients.length > 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        failed++;
        results.push({
          email: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { sent, failed, results };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const verified = await this.verifyConnection();
      if (!verified) {
        return { success: false, error: 'SMTP connection verification failed' };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendTestEmail(to: string, toName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const testOptions: EmailOptions = {
      to,
      toName,
      from: 'admin@estimation-immobilier-gironde.fr',
      fromName: 'Test - Estimation Gironde',
      subject: 'Test Email - Système de notification',
      html: this.generateTestEmailHtml(),
      text: this.generateTestEmailText()
    };

    return await this.sendEmail(testOptions);
  }

  private generateTestEmailHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email de test</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Estimation Gironde</h1>
            <p>Test du système d'emails</p>
          </div>
          <div class="content">
            <h2>Email de test envoyé avec succès !</h2>
            <p>Ce message confirme que votre système d'emails fonctionne correctement.</p>
            <p><strong>Serveur SMTP:</strong> O2Switch (bus.o2switch.net)</p>
            <p><strong>Date/heure:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          <div class="footer">
            <p>Estimation Immobilier Gironde - Système automatique</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTestEmailText(): string {
    return `
ESTIMATION GIRONDE - Test du système d'emails

Email de test envoyé avec succès !

Ce message confirme que votre système d'emails fonctionne correctement.

Serveur SMTP: O2Switch (bus.o2switch.net)
Date/heure: ${new Date().toLocaleString('fr-FR')}

---
Estimation Immobilier Gironde - Système automatique
    `.trim();
  }
}

export const emailService = EmailService.getInstance();
export default emailService;