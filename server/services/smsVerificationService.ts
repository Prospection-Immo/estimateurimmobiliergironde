import twilio from 'twilio';

interface VerificationRecord {
  code: string;
  phoneNumber: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  isVerified: boolean;
}

interface SendVerificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  expiresIn?: number;
}

interface VerifyCodeResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

class SmsVerificationService {
  private twilioClient: any;
  private isDevelopmentMode: boolean;
  private verificationStore: Map<string, VerificationRecord>;
  private static instance: SmsVerificationService;

  private constructor() {
    // Check if we're in development mode or missing Twilio credentials
    this.isDevelopmentMode = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || process.env.NODE_ENV === 'development';
    
    if (!this.isDevelopmentMode) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('SMS Verification Service initialized with Twilio');
    } else {
      console.log('SMS Verification Service initialized in DEVELOPMENT MODE');
    }
    
    this.verificationStore = new Map();
    
    // Clean up expired codes every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCodes();
    }, 5 * 60 * 1000);
  }

  static getInstance(): SmsVerificationService {
    if (!SmsVerificationService.instance) {
      SmsVerificationService.instance = new SmsVerificationService();
    }
    return SmsVerificationService.instance;
  }

  /**
   * Sends a 6-digit verification code to the provided phone number
   */
  async sendVerificationCode(phoneNumber: string): Promise<SendVerificationResult> {
    try {
      // Validate and format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone.isValid) {
        return {
          success: false,
          error: formattedPhone.error || 'Numéro de téléphone invalide'
        };
      }

      const phone = formattedPhone.formatted;
      
      // Check if there's already a recent verification for this number
      const existingVerification = this.verificationStore.get(phone);
      if (existingVerification && Date.now() < existingVerification.expiresAt) {
        const timeRemaining = Math.ceil((existingVerification.expiresAt - Date.now()) / 1000);
        return {
          success: false,
          error: `Un code a déjà été envoyé. Veuillez attendre ${timeRemaining} secondes avant d'en demander un nouveau.`
        };
      }

      // Generate verification code
      const code = this.generateVerificationCode();
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes expiry
      
      // Store verification record
      this.verificationStore.set(phone, {
        code,
        phoneNumber: phone,
        createdAt: Date.now(),
        expiresAt,
        attempts: 0,
        isVerified: false
      });

      if (this.isDevelopmentMode) {
        // Development mode - just log the code
        console.log(`\n🚀 SMS VERIFICATION (DEV MODE)`);
        console.log(`📱 Phone: ${phone}`);
        console.log(`🔢 Code: ${code}`);
        console.log(`⏰ Expires in: 10 minutes\n`);
        
        return {
          success: true,
          messageId: `dev-msg-${Date.now()}`,
          expiresIn: 600
        };
      } else {
        // Production mode - send actual SMS via Twilio
        const message = `Votre code de vérification Estimation Gironde est : ${code}. Ce code expire dans 10 minutes.`;
        
        const smsResult = await this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER || '+33756800000',
          to: phone
        });

        console.log(`SMS sent to ${phone} with message ID: ${smsResult.sid}`);
        
        return {
          success: true,
          messageId: smsResult.sid,
          expiresIn: 600
        };
      }
    } catch (error) {
      console.error('Error sending verification SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi du SMS'
      };
    }
  }

  /**
   * Verifies if the provided code matches the one sent to the phone number
   */
  async verifyCode(phoneNumber: string, code: string): Promise<VerifyCodeResult> {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone.isValid) {
        return {
          success: false,
          error: 'Numéro de téléphone invalide'
        };
      }

      const phone = formattedPhone.formatted;
      const verificationRecord = this.verificationStore.get(phone);

      if (!verificationRecord) {
        return {
          success: false,
          error: 'Aucun code de vérification trouvé pour ce numéro'
        };
      }

      // Check if code has expired
      if (Date.now() > verificationRecord.expiresAt) {
        this.verificationStore.delete(phone);
        return {
          success: false,
          error: 'Le code de vérification a expiré'
        };
      }

      // Check if already verified
      if (verificationRecord.isVerified) {
        return {
          success: false,
          error: 'Ce code a déjà été utilisé'
        };
      }

      // Increment attempt counter
      verificationRecord.attempts++;

      // Check maximum attempts (5 attempts max)
      if (verificationRecord.attempts > 5) {
        this.verificationStore.delete(phone);
        return {
          success: false,
          error: 'Trop de tentatives. Veuillez demander un nouveau code.'
        };
      }

      // Verify the code
      const cleanCode = code.replace(/\s/g, ''); // Remove spaces
      
      // Development mode: accept test codes
      const devTestCodes = ['123456', '000000', '111111'];
      const isDevTestCode = this.isDevelopmentMode && devTestCodes.includes(cleanCode);
      
      if (cleanCode === verificationRecord.code || isDevTestCode) {
        // Mark as verified
        verificationRecord.isVerified = true;
        
        console.log(`✅ SMS verification successful for ${phone} ${isDevTestCode ? '(using dev test code)' : ''}`);
        
        return {
          success: true
        };
      } else {
        const attemptsRemaining = 5 - verificationRecord.attempts;
        return {
          success: false,
          error: `Code incorrect. ${attemptsRemaining} tentative(s) restante(s)`,
          attemptsRemaining
        };
      }
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      return {
        success: false,
        error: 'Erreur lors de la vérification du code'
      };
    }
  }

  /**
   * Checks if a phone number has been verified
   */
  isPhoneVerified(phoneNumber: string): boolean {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (!formattedPhone.isValid) return false;

    const phone = formattedPhone.formatted;
    const verificationRecord = this.verificationStore.get(phone);
    
    return verificationRecord?.isVerified === true && Date.now() < verificationRecord.expiresAt;
  }

  /**
   * Clears verification status for a phone number
   */
  clearVerification(phoneNumber: string): void {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (formattedPhone.isValid) {
      this.verificationStore.delete(formattedPhone.formatted);
    }
  }

  /**
   * Gets verification status for a phone number
   */
  getVerificationStatus(phoneNumber: string): {
    exists: boolean;
    isVerified: boolean;
    expiresAt?: number;
    attemptsUsed?: number;
  } {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (!formattedPhone.isValid) {
      return { exists: false, isVerified: false };
    }

    const phone = formattedPhone.formatted;
    const verificationRecord = this.verificationStore.get(phone);
    
    if (!verificationRecord) {
      return { exists: false, isVerified: false };
    }

    return {
      exists: true,
      isVerified: verificationRecord.isVerified,
      expiresAt: verificationRecord.expiresAt,
      attemptsUsed: verificationRecord.attempts
    };
  }

  /**
   * Formats and validates phone number
   */
  private formatPhoneNumber(phone: string): { isValid: boolean; formatted: string; error?: string } {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for French mobile numbers (starting with 06, 07, or international +33)
    if (cleaned.startsWith('33') && cleaned.length === 11) {
      // International format +33...
      const formatted = '+' + cleaned;
      return { isValid: true, formatted };
    } else if (cleaned.startsWith('0') && (cleaned.startsWith('06') || cleaned.startsWith('07')) && cleaned.length === 10) {
      // National format 06... or 07...
      const formatted = '+33' + cleaned.substring(1);
      return { isValid: true, formatted };
    } else if (cleaned.length >= 10 && cleaned.length <= 15) {
      // Generic international format
      const formatted = cleaned.startsWith('+') ? cleaned : '+' + cleaned;
      return { isValid: true, formatted };
    }
    
    return { 
      isValid: false, 
      formatted: phone,
      error: "Numéro de téléphone invalide. Utilisez un numéro français (06/07) ou international." 
    };
  }

  /**
   * Generates a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Cleans up expired verification codes
   */
  private cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [phone, record] of this.verificationStore.entries()) {
      if (now > record.expiresAt) {
        this.verificationStore.delete(phone);
      }
    }
  }

  /**
   * Testing method to check if service is properly configured
   */
  async testConnection(): Promise<{ success: boolean; mode: string; error?: string }> {
    try {
      if (this.isDevelopmentMode) {
        return {
          success: true,
          mode: 'development',
        };
      } else {
        // Test Twilio connection
        await this.twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        return {
          success: true,
          mode: 'production'
        };
      }
    } catch (error) {
      return {
        success: false,
        mode: this.isDevelopmentMode ? 'development' : 'production',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Development helper to get all verification records (for debugging)
   */
  getDebugInfo(): Array<{ phone: string; code?: string; isVerified: boolean; expiresAt: number }> {
    if (!this.isDevelopmentMode) {
      return [];
    }
    
    return Array.from(this.verificationStore.entries()).map(([phone, record]) => ({
      phone,
      code: record.code,
      isVerified: record.isVerified,
      expiresAt: record.expiresAt
    }));
  }
}

// Export singleton instance
export const smsVerificationService = SmsVerificationService.getInstance();
export default smsVerificationService;