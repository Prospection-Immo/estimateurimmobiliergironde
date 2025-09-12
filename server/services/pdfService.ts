import puppeteer from 'puppeteer';
import { type Guide, GUIDE_PERSONAS } from '@shared/schema';

export interface PDFGenerationOptions {
  guide: Guide;
  firstName: string;
  email: string;
  city: string;
}

export class PDFService {
  private static instance: PDFService;
  private browser: any = null;

  private constructor() {}

  static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  private generateHTMLContent(options: PDFGenerationOptions): string {
    const { guide, firstName, city } = options;
    const personaLabel = GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS];
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${guide.title} - Guide PDF</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                font-size: 14px;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 30px;
            }
            
            /* Header */
            .header {
                text-align: center;
                margin-bottom: 50px;
                padding-bottom: 30px;
                border-bottom: 3px solid #3b82f6;
            }
            
            .logo {
                font-size: 24px;
                font-weight: 700;
                color: #3b82f6;
                margin-bottom: 10px;
            }
            
            .domain {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            /* Title section */
            .title-section {
                margin-bottom: 40px;
                text-align: center;
            }
            
            .persona-badge {
                background: #eff6ff;
                color: #3b82f6;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 20px;
                display: inline-block;
            }
            
            .guide-title {
                font-size: 28px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 15px;
                line-height: 1.2;
            }
            
            .guide-benefit {
                font-size: 16px;
                color: #4b5563;
                margin-bottom: 20px;
                font-style: italic;
            }
            
            .meta-info {
                display: flex;
                justify-content: center;
                gap: 30px;
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 30px;
            }
            
            .meta-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            /* Personalization */
            .personalization {
                background: #f8fafc;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 40px;
                text-align: center;
            }
            
            .personalization h2 {
                font-size: 18px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 10px;
            }
            
            .personalization p {
                color: #4b5563;
            }
            
            /* Content */
            .content {
                line-height: 1.8;
            }
            
            .content h1 {
                font-size: 24px;
                font-weight: 700;
                color: #111827;
                margin: 40px 0 20px 0;
                padding-bottom: 10px;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .content h2 {
                font-size: 20px;
                font-weight: 600;
                color: #111827;
                margin: 35px 0 15px 0;
                padding-left: 15px;
                border-left: 4px solid #3b82f6;
            }
            
            .content h3 {
                font-size: 18px;
                font-weight: 600;
                color: #374151;
                margin: 25px 0 12px 0;
            }
            
            .content p {
                margin-bottom: 15px;
                text-align: justify;
            }
            
            .content ul, .content ol {
                margin: 15px 0 15px 25px;
            }
            
            .content li {
                margin-bottom: 8px;
            }
            
            .content blockquote {
                background: #f0f9ff;
                border-left: 4px solid #3b82f6;
                margin: 20px 0;
                padding: 15px 20px;
                font-style: italic;
                color: #1e40af;
            }
            
            .content strong {
                font-weight: 600;
                color: #111827;
            }
            
            /* Bonus content */
            .bonus-section {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                margin: 40px 0;
                text-align: center;
            }
            
            .bonus-section h2 {
                font-size: 22px;
                font-weight: 700;
                margin-bottom: 15px;
            }
            
            .bonus-section p {
                font-size: 16px;
                opacity: 0.95;
            }
            
            /* Footer */
            .footer {
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            
            .footer .contact {
                margin-bottom: 20px;
            }
            
            .footer .contact h3 {
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 10px;
            }
            
            .footer .disclaimer {
                font-size: 11px;
                line-height: 1.4;
                color: #9ca3af;
            }
            
            /* Page break helpers */
            .page-break {
                page-break-before: always;
            }
            
            .no-break {
                page-break-inside: avoid;
            }
            
            /* Print styles */
            @media print {
                .container {
                    padding: 20px;
                }
                
                .content h1, .content h2, .content h3 {
                    page-break-after: avoid;
                }
                
                .bonus-section {
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo">Estimation Immobilier Gironde</div>
                <div class="domain">ESTIMATION-IMMOBILIER-GIRONDE.FR</div>
            </div>
            
            <!-- Title Section -->
            <div class="title-section">
                <div class="persona-badge">${personaLabel}</div>
                <h1 class="guide-title">${guide.title}</h1>
                <p class="guide-benefit">${guide.shortBenefit}</p>
                <div class="meta-info">
                    <div class="meta-item">
                        <span>📖</span>
                        <span>${guide.readingTime} minutes de lecture</span>
                    </div>
                    <div class="meta-item">
                        <span>📅</span>
                        <span>${currentDate}</span>
                    </div>
                    <div class="meta-item">
                        <span>🎯</span>
                        <span>Guide personnalisé</span>
                    </div>
                </div>
            </div>
            
            <!-- Personalization -->
            <div class="personalization">
                <h2>Guide personnalisé pour ${firstName}</h2>
                <p>Ce guide a été préparé spécialement pour votre profil de vendeur à ${city} et en Gironde. Tous les conseils et stratégies ont été adaptés à votre situation et aux spécificités du marché local.</p>
            </div>
            
            <!-- Content -->
            <div class="content">
                ${guide.pdfContent || guide.content}
            </div>
            
            <!-- Bonus Section -->
            <div class="bonus-section no-break">
                <h2>🎁 Bonus Exclusif PDF</h2>
                <p>En plus du contenu en ligne, ce PDF contient des checklists exclusives, des exemples concrets de votre secteur, et des templates prêts à utiliser pour maximiser le prix de vente de votre bien en Gironde.</p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="contact">
                    <h3>Besoin d'accompagnement personnalisé ?</h3>
                    <p>Notre expert immobilier en Gironde est à votre disposition</p>
                    <p><strong>Email :</strong> contact@estimation-immobilier-gironde.fr</p>
                </div>
                
                <div class="disclaimer">
                    <p><strong>Estimation Immobilier Gironde</strong> - Guide téléchargé le ${currentDate}</p>
                    <p>Ce guide contient des informations générales et ne remplace pas les conseils personnalisés d'un professionnel de l'immobilier.</p>
                    <p>Toute reproduction, même partielle, est interdite sans autorisation préalable.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async generateGuidePDF(options: PDFGenerationOptions): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      const htmlContent = this.generateHTMLContent(options);
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; color: #6b7280; width: 100%; text-align: center; padding: 10px 0;">
            ${options.guide.title} - ${GUIDE_PERSONAS[options.guide.persona as keyof typeof GUIDE_PERSONAS]}
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; color: #6b7280; width: 100%; text-align: center; padding: 10px 0;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
            <span style="margin-left: 20px;">estimation-immobilier-gironde.fr</span>
          </div>
        `
      });
      
      return pdfBuffer;
      
    } finally {
      await page.close();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default PDFService.getInstance();