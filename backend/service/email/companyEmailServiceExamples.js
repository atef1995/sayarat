/**
 * Company Email Service Usage Examples
 *
 * This file demonstrates how to use the CompanyEmailService with dependency injection.
 * Follow these examples for implementing email functionality in your application.
 */

const BrevoEmailService = require('../service/brevoEmailService');
const CompanyEmailService = require('../service/email/companyEmailService');

/**
 * Example 1: Basic service initialization
 */
function createCompanyEmailService() {
  // Initialize the base email service
  const brevoService = new BrevoEmailService();

  // Create company email service with dependency injection
  const companyEmailService = new CompanyEmailService(brevoService, {
    baseUrl: 'https://cars-bids.com',
    fromEmail: 'noreply@cars-bids.com',
    fromName: 'Cars Bids Team'
  });

  return companyEmailService;
}

/**
 * Example 2: Send member invitation
 */
async function sendMemberInvitationExample() {
  const emailService = createCompanyEmailService();

  try {
    const invitationToken = emailService.generateInvitationToken();
    const result = await emailService.sendMemberInvitation({
      email: 'newmember@example.com',
      firstName: 'أحمد',
      lastName: 'محمد',
      role: 'member',
      company: {
        id: 1,
        name: 'معرض الشام للسيارات',
        logo: 'https://example.com/logo.png'
      },
      invitedBy: {
        id: 5,
        firstName: 'فاطمة',
        lastName: 'علي',
        email: 'fatima@example.com'
      },
      invitationToken
    });

    console.log('Invitation sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send invitation:', error);
    throw error;
  }
}

/**
 * Example 3: Send welcome email
 */
async function sendWelcomeEmailExample() {
  const emailService = createCompanyEmailService();

  try {
    const result = await emailService.sendCompanyWelcome({
      member: {
        id: 10,
        firstName: 'أحمد',
        lastName: 'محمد',
        email: 'ahmed@example.com'
      },
      company: {
        id: 1,
        name: 'معرض الشام للسيارات',
        logo: 'https://example.com/logo.png'
      }
    });

    console.log('Welcome email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

/**
 * Example 4: Send bulk notification
 */
async function sendBulkNotificationExample() {
  const emailService = createCompanyEmailService();

  try {
    const result = await emailService.sendBulkCompanyNotification({
      members: [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        }
      ],
      company: {
        id: 1,
        name: 'Example Motors'
      },
      notification: {
        subject: 'Important Company Update',
        message: 'We have some exciting news to share with the team!',
        actionUrl: 'https://cars-bids.com/company/announcements'
      }
    });

    console.log('Bulk notification sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send bulk notification:', error);
    throw error;
  }
}

/**
 * Example 5: Using with custom email service (for testing)
 */
class MockEmailService {
  async sendTemplatedEmail(emailData) {
    console.log('Mock email sent:', emailData);
    return { messageId: `mock-id-${Date.now()}` };
  }
}

function createTestEmailService() {
  const mockService = new MockEmailService();
  return new CompanyEmailService(mockService);
}

/**
 * Example 6: Validate invitation token
 */
function validateInvitationExample() {
  const emailService = createCompanyEmailService();

  const token = 'some-invitation-token';
  const validationResult = emailService.validateInvitationToken(token);

  if (validationResult) {
    console.log('Valid invitation:', validationResult);
    return true;
  } else {
    console.log('Invalid or expired invitation');
    return false;
  }
}

module.exports = {
  createCompanyEmailService,
  sendMemberInvitationExample,
  sendWelcomeEmailExample,
  sendBulkNotificationExample,
  createTestEmailService,
  validateInvitationExample
};
