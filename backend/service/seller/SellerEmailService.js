class SellerEmailService {
  constructor(emailService) {
    this.emailService = emailService;
  }

  /**
   * Send email to verify email address
   * @param {string} email - Email address to verify
   * @param {string} requestId - Request tracking ID
   * @param {string} verificationToken - Verification token
   * @return {Promise<Object>} Email send result
   * */
  async sendVerificationEmail(email, firstName, requestId, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const params = {
      verificationUrl,
      supportUrl: `${process.env.SUPPORT_URL}/contact`,
      currentYear: new Date().getFullYear()
    };

    return await this.emailService.sendTemplatedEmail({
      templateName: 'verify-email',
      to: {
        email,
        name: firstName || 'عزيزي العميل'
      },
      subject: 'تحقق من بريدك الإلكتروني - Cars Bids',
      params,
      requestId
    });
  }
}

module.exports = SellerEmailService;
