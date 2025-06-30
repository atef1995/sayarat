const logger = require('../utils/logger');
const BrevoEmailService = require('../service/brevoEmailService');
const CompanyEmailService = require('../service/email/companyEmailService');
const ReqIdGenerator = require('../utils/reqIdGenerator');
const EnhancedMessageService = require('../service/enhancedMessageService');

/**
 * Company management route handlers
 * Handles company dashboard, profile, statistics, members, and listings management.
 */
class CompanyController {
  constructor(knex, emailService = null) {
    this.knex = knex;

    // Dependency injection for email service
    if (emailService) {
      this.companyEmailService = emailService;
    } else {
      // Default email service setup with request ID generator
      const brevoService = new BrevoEmailService();
      const reqIdGenerator = new ReqIdGenerator();
      this.companyEmailService = new CompanyEmailService(brevoService, {
        reqIdGenerator: reqIdGenerator
      });
    }

    this.messageService = new EnhancedMessageService(knex); // Add enhanced messaging service
  }

  /**
   * Get company profile information
   */
  async getCompanyProfile(req, res) {
    try {
      const userId = req.user.id;

      // Get user with company information
      const userWithCompany = await this.knex('sellers')
        .select(
          'sellers.*',
          'companies.id as company_id',
          'companies.name as company_name',
          'companies.description as company_description',
          'companies.address as company_address',
          'companies.city as company_city',
          'companies.tax_id as company_tax_id',
          'companies.website as company_website',
          'companies.logo_url as company_logo',
          'companies.header_image_url as company_header_image',
          'companies.subscription_type',
          'companies.subscription_status',
          'companies.subscription_id',
          'companies.created_at as company_created_at',
          'companies.updated_at as company_updated_at'
        )
        .join('companies', 'sellers.company_id', 'companies.id')
        .where('sellers.id', userId)
        .first();

      if (!userWithCompany) {
        return res.status(404).json({
          success: false,
          error: 'Company not found'
        });
      }

      const company = {
        id: userWithCompany.company_id,
        name: userWithCompany.company_name,
        description: userWithCompany.company_description,
        address: userWithCompany.company_address,
        city: userWithCompany.company_city,
        taxId: userWithCompany.company_tax_id,
        website: userWithCompany.company_website,
        logo: userWithCompany.company_logo,
        headerImage: userWithCompany.company_header_image,
        subscriptionType: userWithCompany.subscription_type,
        subscriptionStatus: userWithCompany.subscription_status,
        subscriptionId: userWithCompany.subscription_id,
        createdAt: userWithCompany.company_created_at,
        updatedAt: userWithCompany.company_updated_at
      };

      res.json({
        success: true,
        company
      });
    } catch (error) {
      logger.error('Error fetching company profile:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update company profile
   */
  async updateCompanyProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, address, city, taxId, website } = req.body;

      // Verify user belongs to a company and has permission to update
      const user = await this.knex('sellers').select('company_id', 'role').where('id', userId).first();

      if (!user || !user.company_id) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      if (user.role !== 'owner' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to update company profile'
        });
      }

      // Update company information
      await this.knex('companies').where('id', user.company_id).update({
        name,
        description,
        address,
        city,
        tax_id: taxId,
        website,
        updated_at: this.knex.fn.now()
      });

      // Get updated company data
      const updatedCompany = await this.knex('companies').where('id', user.company_id).first();

      const company = {
        id: updatedCompany.id,
        name: updatedCompany.name,
        description: updatedCompany.description,
        address: updatedCompany.address,
        city: updatedCompany.city,
        taxId: updatedCompany.tax_id,
        website: updatedCompany.website,
        logo: updatedCompany.logo_url,
        headerImage: updatedCompany.header_image_url,
        subscriptionType: updatedCompany.subscription_type,
        subscriptionStatus: updatedCompany.subscription_status,
        subscriptionId: updatedCompany.subscription_id,
        createdAt: updatedCompany.created_at,
        updatedAt: updatedCompany.updated_at
      };

      res.json({
        success: true,
        company
      });
    } catch (error) {
      logger.error('Error updating company profile:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(req, res) {
    try {
      const userId = req.user.id;

      // Get user's company ID
      const user = await this.knex('sellers').select('company_id').where('id', userId).first();

      if (!user || !user.company_id) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      // Get all company members
      const companyMembers = await this.knex('sellers').select('id').where('company_id', user.company_id);

      const memberIds = companyMembers.map(member => member.id);

      if (memberIds.length === 0) {
        return res.json({
          success: true,
          stats: {
            totalListings: 0,
            activeListings: 0,
            totalViews: 0,
            totalMessages: 0,
            totalFavorites: 0,
            monthlyViews: 0,
            conversionRate: 0
          }
        });
      } // Get listings statistics
      const listingsStats = await this.knex('listed_cars')
        .select(
          this.knex.raw('COUNT(*) as total_listings'),
          this.knex.raw("COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings"),
          this.knex.raw('SUM(views) as total_views')
        )
        .whereIn('seller_id', memberIds)
        .first();

      // Get monthly views (last 30 days)
      const monthlyViewsStats = await this.knex('listed_cars')
        .select(this.knex.raw('SUM(views) as monthly_views'))
        .whereIn('seller_id', memberIds)
        .where('created_at', '>=', this.knex.raw("CURRENT_DATE - INTERVAL '30 days'"))
        .first();

      // Get total favorites count
      const favoritesStats = await this.knex('favorites')
        .select(this.knex.raw('COUNT(*) as total_favorites'))
        .whereIn('car_listing_id', function() {
          this.select('id').from('listed_cars').whereIn('seller_id', memberIds);
        })
        .first();

      // Get total messages count (conversations related to company listings)
      const messagesStats = await this.knex('messages')
        .select(this.knex.raw('COUNT(*) as total_messages'))
        .whereIn('conversation_id', function() {
          this.select('conversations.id')
            .from('conversations')
            .join('listed_cars', 'conversations.car_listing_id', 'listed_cars.id')
            .whereIn('listed_cars.seller_id', memberIds);
        })
        .first();

      // Calculate conversion rate (favorites/views ratio as a percentage)
      const totalViews = parseInt(listingsStats.total_views) || 0;
      const totalFavorites = parseInt(favoritesStats.total_favorites) || 0;
      const conversionRate = totalViews > 0 ? (totalFavorites / totalViews) * 100 : 0;

      const stats = {
        totalListings: parseInt(listingsStats.total_listings) || 0,
        activeListings: parseInt(listingsStats.active_listings) || 0,
        totalViews: totalViews,
        totalMessages: parseInt(messagesStats.total_messages) || 0,
        totalFavorites: totalFavorites,
        monthlyViews: parseInt(monthlyViewsStats.monthly_views) || 0,
        conversionRate: Math.round(conversionRate * 100) / 100 // Round to 2 decimal places
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Error fetching company stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get company listings
   */
  async getCompanyListings(req, res) {
    try {
      const userId = req.user.id;

      // Get user's company ID
      const user = await this.knex('sellers').select('company_id').where('id', userId).first();

      if (!user || !user.company_id) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      // Get all company members
      const companyMembers = await this.knex('sellers').select('id').where('company_id', user.company_id);

      const memberIds = companyMembers.map(member => member.id);

      if (memberIds.length === 0) {
        return res.json({
          success: true,
          listings: []
        });
      } // Get company listings with real statistics
      const listings = await this.knex('listed_cars')
        .select(
          'listed_cars.id',
          'listed_cars.price',
          'listed_cars.currency',
          'listed_cars.status',
          'listed_cars.created_at',
          'listed_cars.make',
          'listed_cars.model',
          'listed_cars.year',
          'listed_cars.description',
          'listed_cars.highlight',
          'listed_cars.views'
        )
        .whereIn('seller_id', memberIds)
        .orderBy('created_at', 'desc');

      // Get favorites count for each listing
      const listingIds = listings.map(listing => listing.id);
      const favoritesData = await this.knex('favorites')
        .select('car_listing_id')
        .select(this.knex.raw('COUNT(*) as favorite_count'))
        .whereIn('car_listing_id', listingIds)
        .groupBy('car_listing_id');

      // Get messages count for each listing
      const messagesData = await this.knex('messages')
        .select('conversations.car_listing_id')
        .select(this.knex.raw('COUNT(messages.id) as message_count'))
        .join('conversations', 'messages.conversation_id', 'conversations.id')
        .whereIn('conversations.car_listing_id', listingIds)
        .groupBy('conversations.car_listing_id');

      // Create lookup maps for quick access
      const favoritesMap = new Map();
      favoritesData.forEach(item => {
        favoritesMap.set(item.car_listing_id, parseInt(item.favorite_count));
      });

      const messagesMap = new Map();
      messagesData.forEach(item => {
        messagesMap.set(item.car_listing_id, parseInt(item.message_count));
      });

      // Format listings for frontend with real statistics
      const formattedListings = listings.map(listing => ({
        id: listing.id,
        title: `${listing.make} ${listing.model} ${listing.year}`.trim() || 'سيارة',
        price: listing.price,
        currency: listing.currency,
        status: listing.status,
        views: listing.views || 0,
        messages: messagesMap.get(listing.id) || 0,
        favorites: favoritesMap.get(listing.id) || 0,
        createdAt: listing.created_at,
        highlight: listing.highlight || false,
        images: [] // Placeholder - would need to join with images table
      }));

      res.json({
        success: true,
        listings: formattedListings
      });
    } catch (error) {
      logger.error('Error fetching company listings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
  /**
   * Get company members with status filtering
   *
   * Features:
   * - Returns active, pending, and removed members
   * - Includes member status and role information
   * - Shows listing counts and last activity
   * - Supports filtering by status
   */
  async getCompanyMembers(req, res) {
    try {
      const userId = req.user.id;
      const { status = 'all', includeRemoved = false } = req.query;

      // Get user's company ID and role
      const user = await this.knex('sellers').select('company_id', 'role').where('id', userId).first();

      if (!user || !user.company_id) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      // Build query based on status filter
      let membersQuery = this.knex('sellers')
        .select(
          'sellers.id',
          'sellers.first_name',
          'sellers.last_name',
          'sellers.email',
          'sellers.role',
          'sellers.member_status',
          'sellers.last_login',
          'sellers.created_at',
          'sellers.picture',
          'sellers.email_verified',
          'sellers.removal_date',
          'sellers.removal_reason'
        )
        .leftJoin('listed_cars', 'sellers.id', '=', 'listed_cars.seller_id')
        .select(this.knex.raw('COUNT(listed_cars.id) as listing_count'))
        .where('sellers.company_id', user.company_id)
        .groupBy(
          'sellers.id',
          'sellers.first_name',
          'sellers.last_name',
          'sellers.email',
          'sellers.role',
          'sellers.member_status',
          'sellers.last_login',
          'sellers.created_at',
          'sellers.picture',
          'sellers.email_verified',
          'sellers.removal_date',
          'sellers.removal_reason'
        );

      // Apply status filter
      if (!includeRemoved) {
        membersQuery = membersQuery.whereNot('sellers.member_status', 'removed');
      }

      if (status !== 'all') {
        membersQuery = membersQuery.where('sellers.member_status', status);
      }

      const members = await membersQuery.orderBy('sellers.created_at', 'asc');

      // Format members for frontend
      const formattedMembers = members.map(member => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        role: member.role,
        lastLogin: member.last_login,
        joinedAt: member.created_at,
        avatar: member.picture,
        emailVerified: member.email_verified,
        status: member.member_status,
        listingCount: parseInt(member.listing_count) || 0,
        removalDate: member.removal_date,
        removalReason: member.removal_reason,
        canReactivate: member.member_status === 'removed',
        isCurrentUser: member.id === userId
      }));

      // Group members by status for easier frontend handling
      const membersByStatus = {
        active: formattedMembers.filter(m => m.memberStatus === 'active'),
        pending: formattedMembers.filter(m => m.memberStatus === 'pending'),
        removed: formattedMembers.filter(m => m.memberStatus === 'removed')
      };

      logger.info('Company members fetched successfully', {
        companyId: user.company_id,
        totalMembers: formattedMembers.length,
        activeMembers: membersByStatus.active.length,
        pendingMembers: membersByStatus.pending.length,
        removedMembers: membersByStatus.removed.length,
        requestedStatus: status,
        includeRemoved
      });

      res.json({
        success: true,
        members: formattedMembers,
        membersByStatus,
        summary: {
          total: formattedMembers.length,
          active: membersByStatus.active.length,
          pending: membersByStatus.pending.length,
          removed: membersByStatus.removed.length
        }
      });
    } catch (error) {
      logger.error('Error fetching company members:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
  /**
   * Add new company member
   *
   * Features:
   * - Salt-based password hashing (PBKDF2) consistent with AuthService
   * - Secure temporary password generation with mixed characters
   * - Email verification token generation
   * - Comprehensive input validation and sanitization
   * - Proper error handling and logging
   * - Clean response data without sensitive information
   *
   * Security considerations:
   * - Passwords are hashed with crypto.pbkdf2 using 310,000 iterations
   * - Salt is generated with crypto.randomBytes(16) for each password
   * - Temporary passwords include uppercase, lowercase, numbers, and symbols
   * - Email verification tokens expire in 24 hours
   * - Sensitive data is cleaned before sending responses
   *
   * #TODO: Implement invitation token expiry and cleanup
   * #TODO: Add rate limiting for member invitations
   * #TODO: Implement bulk member invitation functionality
   * #TODO: Add audit trail for member management actions
   * #TODO: Implement member role permissions granularity
   * #TODO: Add member invitation resend functionality
   */
  async addCompanyMember(req, res) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, phone, role, birthdate } = req.body;

      // Input validation
      const validationResult = this._validateMemberInput({ firstName, lastName, email, role });
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: validationResult.error
        });
      }

      // Get user's company ID and role
      const user = await this._getUserCompanyInfo(userId);
      if (!user) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      // Check permissions
      const hasPermission = this._checkAddMemberPermission(user.role);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to add members'
        });
      }

      // Check if email already exists
      const existingUser = await this._checkExistingUser(email);
      if (existingUser.exists) {
        return this._handleExistingUser(existingUser, user.company_id, res);
      } // Create new member
      const newMember = await this._createNewMember({
        firstName,
        lastName,
        email,
        phone,
        role,
        companyId: user.company_id,
        birthdate
      }); // Send invitation email
      try {
        const invitationToken = this.companyEmailService.generateInvitationToken();

        // Get company and inviter information
        const company = await this._getCompanyInfo(user.company_id);
        const inviter = await this._getUserInfo(userId);

        await this.companyEmailService.sendMemberInvitation({
          email,
          firstName,
          lastName,
          role,
          company,
          invitedBy: inviter,
          invitationToken,
          tempPassword: newMember.tempPassword,
          emailVerificationToken: newMember.emailVerificationToken
        });

        logger.info('Invitation email sent successfully', {
          email,
          companyId: user.company_id,
          memberId: newMember.id,
          invitationToken
        });
      } catch (emailError) {
        logger.error('Failed to send invitation email', {
          email,
          memberId: newMember.id,
          error: emailError.message,
          stack: emailError.stack
        });
        // Don't fail the entire operation if email fails
        // The member is created, they can request password reset if needed
      }
      logger.info('Company member added successfully', {
        companyId: user.company_id,
        newMemberId: newMember.id,
        memberEmail: email,
        addedBy: userId,
        role: role
      });

      // Clean sensitive data before sending response
      const cleanedMember = this._cleanMemberData(newMember);

      res.status(201).json({
        success: true,
        message: 'Member added successfully and invitation email sent',
        member: {
          id: cleanedMember.id,
          firstName: cleanedMember.first_name,
          lastName: cleanedMember.last_name,
          email: cleanedMember.email,
          role: cleanedMember.role,
          joinedAt: cleanedMember.created_at,
          lastLogin: null,
          status: 'pending_activation',
          isActive: false,
          emailVerified: false
        }
      });
    } catch (error) {
      logger.error('Error adding company member:', error);

      // Handle specific database errors
      if (error.code === '23505') {
        // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate member input data
   * @private
   */
  _validateMemberInput({ firstName, lastName, email, role }) {
    const errors = [];

    if (!firstName || firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    if (!lastName || lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters');
    }

    if (!email || !this._isValidEmail(email)) {
      errors.push('Valid email address is required');
    }

    const validRoles = ['member', 'admin'];
    if (!role || !validRoles.includes(role)) {
      errors.push('Role must be either "member" or "admin"');
    }

    return {
      isValid: errors.length === 0,
      error: errors.join(', ')
    };
  }

  /**
   * Validate email format
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user company information
   * @private
   */
  async _getUserCompanyInfo(userId) {
    const user = await this.knex('sellers').select('company_id', 'role').where('id', userId).first();

    if (!user || !user.company_id) {
      return null;
    }

    return user;
  }

  /**
   * Check if user has permission to add members
   * @private
   */
  _checkAddMemberPermission(userRole) {
    return userRole === 'owner' || userRole === 'admin';
  }

  /**
   * Check if user with email already exists
   * @private
   */
  async _checkExistingUser(email) {
    const existingUser = await this.knex('sellers')
      .select('id', 'company_id', 'role', 'email_verified')
      .where('email', email)
      .first();

    return {
      exists: !!existingUser,
      user: existingUser
    };
  }

  /**
   * Handle existing user scenarios
   * @private
   */
  async _handleExistingUser(existingUserData, companyId, res) {
    const { user } = existingUserData;

    // If user exists but has no company, add them to this company
    if (!user.company_id) {
      const updatedUser = await this.knex('sellers')
        .where('id', user.id)
        .update({
          company_id: companyId,
          role: 'member', // Default role for existing users
          updated_at: this.knex.fn.now()
        })
        .returning('*');

      return res.status(200).json({
        success: true,
        message: 'Existing user added to company successfully',
        member: {
          id: user.id,
          email: user.email,
          role: 'member',
          status: user.email_verified ? 'active' : 'pending_verification'
        }
      });
    }

    // User already belongs to a company
    if (user.company_id === companyId) {
      return res.status(409).json({
        success: false,
        error: 'User is already a member of this company'
      });
    }

    return res.status(409).json({
      success: false,
      error: 'User is already associated with another company'
    });
  } /**
   * Create new member in database using salt-based password hashing
   * @private
   */
  async _createNewMember({ firstName, lastName, email, phone, role, companyId, birthdate }) {
    const crypto = require('crypto');

    try {
      // Generate secure temporary password for new member
      const tempPassword = this._generateSecurePassword();

      // Generate salt and hash password using same method as AuthService
      const salt = crypto.randomBytes(16);
      const hashedPassword = await this._hashPasswordWithSalt(tempPassword, salt);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Create member record in database
      const [newMember] = await this.knex('sellers')
        .insert({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.toLowerCase().trim(),
          hashed_password: hashedPassword,
          salt: salt,
          role: role,
          company_id: companyId,
          email_verified: false,
          email_verification_token: emailVerificationToken,
          email_token_expiry: this.knex.raw("NOW() + INTERVAL '24 hours'"),
          created_at: this.knex.fn.now(),
          updated_at: this.knex.fn.now(),
          phone: phone ? phone.trim() : null,
          date_of_birth: birthdate ? new Date(birthdate) : null
        })
        .returning('*');

      // Store temporary password for email invitation
      // This will be used by the email service to send credentials
      newMember.tempPassword = tempPassword;
      newMember.emailVerificationToken = emailVerificationToken;

      logger.info('New member created successfully', {
        memberId: newMember.id,
        email: newMember.email,
        companyId: companyId,
        role: role
      });

      return newMember;
    } catch (error) {
      logger.error('Error creating new member:', {
        error: error.message,
        stack: error.stack,
        email: email,
        companyId: companyId
      });
      throw error;
    }
  }

  /**
   * Hash password with salt using PBKDF2 (consistent with AuthService)
   * @private
   * @param {string} password - Plain text password
   * @param {Buffer} salt - Salt for hashing
   * @returns {Promise<Buffer>} - Hashed password
   */
  async _hashPasswordWithSalt(password, salt) {
    const crypto = require('crypto');

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hash) => {
        if (err) {
          logger.error('Error hashing password:', {
            error: err.message,
            stack: err.stack
          });
          return reject(err);
        }
        resolve(hash);
      });
    });
  }

  /**
   * Generate secure temporary password
   * @private
   * @returns {string} - Secure temporary password
   */
  _generateSecurePassword() {
    const crypto = require('crypto');

    // Generate a more secure password with mixed characters
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const numbers = '23456789';
    const symbols = '!@#$%&*';

    let password = '';

    // Ensure at least one uppercase, lowercase, number, and symbol
    password += chars.charAt(crypto.randomInt(0, 26)); // Uppercase
    password += chars.charAt(crypto.randomInt(26, 52)); // Lowercase
    password += numbers.charAt(crypto.randomInt(0, numbers.length)); // Number
    password += symbols.charAt(crypto.randomInt(0, symbols.length)); // Symbol

    // Fill the rest with random characters
    for (let i = 4; i < 12; i++) {
      const allChars = chars + numbers + symbols;
      password += allChars.charAt(crypto.randomInt(0, allChars.length));
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => crypto.randomInt(0, 2) - 0.5)
      .join('');
  }

  /**
   * Clean sensitive data from member object before sending response
   * @private
   * @param {Object} member - Member object from database
   * @returns {Object} - Cleaned member object
   */
  _cleanMemberData(member) {
    const cleanMember = { ...member };

    // Remove sensitive fields
    delete cleanMember.hashed_password;
    delete cleanMember.salt;
    delete cleanMember.tempPassword;
    delete cleanMember.email_verification_token;
    delete cleanMember.reset_token;
    delete cleanMember.access_token;

    return cleanMember;
  }

  /**
   * Validate password complexity (for future use when users set their own passwords)
   * @private
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result
   */
  _validatePasswordComplexity(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Generate invitation tracking data for audit purposes
   * @private
   * @param {Object} params - Invitation parameters
   * @returns {Object} - Invitation tracking data
   */
  _generateInvitationTracking({ memberId, invitedBy, companyId, email }) {
    return {
      memberId: memberId,
      invitedBy: invitedBy,
      companyId: companyId,
      email: email,
      invitedAt: new Date().toISOString(),
      status: 'invited',
      attempts: 1
    };
  }

  /**
   * Upload company image (logo or header)
   */
  async uploadCompanyImage(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.body; // 'logo' or 'header'
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      if (!type || !['logo', 'header'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image type. Must be "logo" or "header"'
        });
      }

      // Verify user belongs to a company and has permission
      const user = await this.knex('sellers').select('company_id', 'role').where('id', userId).first();

      if (!user || !user.company_id) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      if (user.role !== 'owner' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to update company images'
        });
      }

      // Use the existing image handler
      const { handleImageUpload } = require('../imageHandler');
      const imageUrls = await handleImageUpload([file]);

      if (!imageUrls || imageUrls.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image'
        });
      }

      const imageUrl = imageUrls[0].url;
      const updateField = type === 'logo' ? 'logo_url' : 'header_image_url';

      // Update company with new image URL
      await this.knex('companies')
        .where('id', user.company_id)
        .update({
          [updateField]: imageUrl,
          updated_at: this.knex.fn.now()
        });

      res.json({
        success: true,
        data: { imageUrl }
      });
    } catch (error) {
      logger.error('Error uploading company image:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
  /**
   * Remove company member (Soft delete with proper data handling)
   *
   * Features:
   * - Soft delete: Sets member status to 'removed' instead of nullifying company_id
   * - Preserves data integrity: Listings remain associated with company
   * - Re-addable: Members can be re-activated later
   * - Audit trail: Tracks removal history
   * - Listing management: Handles active listings appropriately
   *
   * Business Logic:
   * - Member status changes to 'removed' but company_id remains
   * - Active listings are moved to 'suspended' status (can be reactivated)
   * - Historical data and analytics are preserved
   * - Member can be re-invited/reactivated later
   *
   * #TODO: Add batch member removal functionality
   * #TODO: Implement member suspension (temporary removal)
   * #TODO: Add listing transfer to other company members
   * #TODO: Implement grace period before full removal
   */
  async removeCompanyMember(req, res) {
    const transaction = await this.knex.transaction();

    try {
      const userId = req.user.id;
      const memberId = req.params.id;
      const { transferListingsTo = null, suspendListings = true, reason = 'Administrative decision' } = req.body;

      if (!memberId) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Invalid member ID'
        });
      }

      // Verify user belongs to a company and has permission
      const user = await transaction('sellers').select('company_id', 'role').where('id', userId).first();

      if (!user || !user.company_id) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      if (user.role !== 'owner' && user.role !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to remove company members'
        });
      }

      // Check if member exists and belongs to the same company
      const memberToRemove = await transaction('sellers')
        .select('company_id', 'role', 'member_status', 'first_name', 'last_name', 'email')
        .where('id', memberId)
        .first();

      if (!memberToRemove) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Member not found'
        });
      }

      if (memberToRemove.company_id !== user.company_id) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Member does not belong to your company'
        });
      }

      if (memberToRemove.role === 'owner') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Cannot remove company owner'
        });
      }

      if (memberToRemove.member_status === 'removed') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Member is already removed'
        });
      }

      // Get member's active listings
      const memberListings = await transaction('listed_cars')
        .select('id', 'status', 'title', 'price')
        .where('seller_id', memberId)
        .where('status', 'active'); // Handle member listings and messaging based on business logic
      const listingActions = [];
      let conversationUpdates = [];

      if (transferListingsTo && memberListings.length > 0) {
        // Transfer listings to another company member
        const transferToMember = await transaction('sellers')
          .select('id', 'company_id', 'member_status')
          .where('id', transferListingsTo)
          .where('company_id', user.company_id)
          .where('member_status', 'active')
          .first();

        if (!transferToMember) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: 'Invalid transfer target member'
          });
        }

        await transaction('listed_cars').where('seller_id', memberId).where('status', 'active').update({
          seller_id: transferToMember.id,
          updated_at: transaction.fn.now()
        });

        listingActions.push({
          action: 'transferred',
          count: memberListings.length,
          transferredTo: transferToMember.id
        });
      } else if (suspendListings && memberListings.length > 0) {
        // Suspend listings (can be reactivated if member rejoins)
        await transaction('listed_cars').where('seller_id', memberId).where('status', 'active').update({
          status: 'suspended_member_removed',
          updated_at: transaction.fn.now()
        });

        listingActions.push({
          action: 'suspended',
          count: memberListings.length
        });
      }

      // Commit the transaction first, then handle messaging
      await transaction.commit();

      // Handle messaging system updates outside the transaction
      try {
        conversationUpdates = await this._handleMemberMessaging(
          memberId,
          user.company_id,
          transferListingsTo,
          reason,
          userId
        );

        console.log(`Updated messaging for ${conversationUpdates.length} listings`);
      } catch (messagingError) {
        console.error('Error updating messaging system:', messagingError);
        // Log but don't fail the operation - member was already removed
        logger.error('Failed to update messaging during member removal', {
          memberId,
          companyId: user.company_id,
          error: messagingError.message
        });
      }

      // Soft delete: Update member status instead of removing company association
      await transaction('sellers').where('id', memberId).update({
        member_status: 'removed',
        role: 'inactive_member', // Preserve original role info for potential reactivation
        removal_date: transaction.fn.now(),
        removal_reason: reason,
        removed_by: userId,
        updated_at: transaction.fn.now()
      }); // Create audit trail entry
      await transaction('company_member_audit').insert({
        company_id: user.company_id,
        member_id: memberId,
        action: 'removed',
        performed_by: userId,
        reason: reason,
        metadata: JSON.stringify({
          originalRole: memberToRemove.role,
          listingActions: listingActions,
          removalDate: new Date().toISOString()
        }),
        created_at: transaction.fn.now()
      });

      await transaction.commit();

      // Handle messaging system updates outside the transaction
      try {
        conversationUpdates = await this._handleMemberMessaging(
          memberId,
          user.company_id,
          transferListingsTo,
          reason,
          userId
        );

        console.log(`Updated messaging for ${conversationUpdates.length} listings`);
      } catch (messagingError) {
        console.error('Error updating messaging system:', messagingError);
        // Log but don't fail the operation - member was already removed
        logger.error('Failed to update messaging during member removal', {
          memberId,
          companyId: user.company_id,
          error: messagingError.message
        });
      }

      // Send removal notification email (outside transaction)
      try {
        const company = await this._getCompanyInfo(user.company_id);
        const removedBy = await this._getUserInfo(userId);

        await this.companyEmailService.sendMemberRemovalNotification({
          member: {
            id: memberId,
            firstName: memberToRemove.first_name,
            lastName: memberToRemove.last_name,
            email: memberToRemove.email
          },
          company,
          removedBy,
          reason: reason,
          listingActions: listingActions,
          canReactivate: true // Inform them they can be re-added
        });

        logger.info('Member removal notification sent', {
          memberId,
          companyId: user.company_id,
          removedBy: userId
        });
      } catch (emailError) {
        logger.error('Failed to send removal notification email', {
          memberId,
          error: emailError.message
        });
        // Don't fail the operation if email fails
      }
      res.json({
        success: true,
        message: 'Member removed successfully',
        data: {
          memberId: memberId,
          memberName: `${memberToRemove.first_name} ${memberToRemove.last_name}`,
          listingActions: listingActions,
          conversationUpdates: conversationUpdates || [],
          canReactivate: true
        }
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error removing company member:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Reactivate a removed company member
   *
   * Features:
   * - Reactivates previously removed members
   * - Restores suspended listings
   * - Updates member status and role
   * - Sends welcome back notification
   *
   * Business Logic:
   * - Only removed members can be reactivated
   * - Their suspended listings are restored to active
   * - Original role is restored or new role can be assigned
   * - Audit trail is updated
   */
  async reactivateCompanyMember(req, res) {
    const transaction = await this.knex.transaction();

    try {
      const userId = req.user.id;
      const memberId = req.params.id;
      const { newRole = null, restoreListings = true } = req.body;

      if (!memberId) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Invalid member ID'
        });
      }

      // Verify user has permission
      const user = await transaction('sellers').select('company_id', 'role').where('id', userId).first();

      if (!user || !user.company_id) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      if (user.role !== 'owner' && user.role !== 'admin') {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to reactivate members'
        });
      }

      // Check if member exists and was previously removed
      const memberToReactivate = await transaction('sellers')
        .select('company_id', 'role', 'member_status', 'first_name', 'last_name', 'email')
        .where('id', memberId)
        .first();

      if (!memberToReactivate) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: 'Member not found'
        });
      }

      if (memberToReactivate.company_id !== user.company_id) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          error: 'Member does not belong to your company'
        });
      }

      if (memberToReactivate.member_status !== 'removed') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Member is not in removed status'
        });
      }

      // Determine role to assign
      const roleToAssign =
        newRole || (memberToReactivate.role === 'inactive_member' ? 'member' : memberToReactivate.role);

      // Validate role
      const validRoles = ['member', 'admin'];
      if (!validRoles.includes(roleToAssign)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: 'Invalid role specified'
        });
      }

      // Reactivate member
      await transaction('sellers').where('id', memberId).update({
        member_status: 'active',
        role: roleToAssign,
        removal_date: null,
        removal_reason: null,
        removed_by: null,
        reactivated_by: userId,
        reactivated_at: transaction.fn.now(),
        updated_at: transaction.fn.now()
      });

      let restoredListings = 0;

      // Restore suspended listings if requested
      if (restoreListings) {
        const suspendedListings = await transaction('listed_cars')
          .where('seller_id', memberId)
          .where('status', 'suspended_member_removed');

        if (suspendedListings.length > 0) {
          await transaction('listed_cars')
            .where('seller_id', memberId)
            .where('status', 'suspended_member_removed')
            .update({
              status: 'active',
              updated_at: transaction.fn.now()
            });

          restoredListings = suspendedListings.length;
        }
      }

      // Create audit trail entry
      await transaction('company_member_audit').insert({
        company_id: user.company_id,
        member_id: memberId,
        action: 'reactivated',
        performed_by: userId,
        reason: 'Member reactivation',
        metadata: JSON.stringify({
          newRole: roleToAssign,
          restoredListings: restoredListings,
          reactivationDate: new Date().toISOString()
        }),
        created_at: transaction.fn.now()
      });
      await transaction.commit();

      // Handle messaging system updates outside the transaction
      let conversationUpdates = [];
      try {
        conversationUpdates = await this._handleMemberReactivationMessaging(memberId, user.company_id, userId);

        console.log(`Restored messaging for ${conversationUpdates.length} listings`);
      } catch (messagingError) {
        console.error('Error restoring messaging system:', messagingError);
        // Log but don't fail the operation - member was already reactivated
        logger.error('Failed to restore messaging during member reactivation', {
          memberId,
          companyId: user.company_id,
          error: messagingError.message
        });
      }

      // Send welcome back notification
      try {
        const company = await this._getCompanyInfo(user.company_id);
        const reactivatedBy = await this._getUserInfo(userId);

        await this.companyEmailService.sendMemberReactivationNotification({
          member: {
            id: memberId,
            firstName: memberToReactivate.first_name,
            lastName: memberToReactivate.last_name,
            email: memberToReactivate.email
          },
          company,
          reactivatedBy,
          newRole: roleToAssign,
          restoredListings: restoredListings
        });

        logger.info('Member reactivation notification sent', {
          memberId,
          companyId: user.company_id,
          reactivatedBy: userId
        });
      } catch (emailError) {
        logger.error('Failed to send reactivation notification email', {
          memberId,
          error: emailError.message
        });
      } // Update conversation ownership for reactivated member's listings
      // (Already handled above in messaging integration)

      res.json({
        success: true,
        message: 'Member reactivated successfully',
        data: {
          memberId: memberId,
          memberName: `${memberToReactivate.first_name} ${memberToReactivate.last_name}`,
          newRole: roleToAssign,
          restoredListings: restoredListings,
          conversationUpdates: conversationUpdates || []
        }
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error reactivating company member:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get company analytics with trends
   */
  async getCompanyAnalytics(req, res) {
    try {
      const userId = req.user.id;

      // Get user's company ID
      const user = await this.knex('sellers').select('company_id').where('id', userId).first();

      if (!user || !user.company_id) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      // Get all company members
      const companyMembers = await this.knex('sellers').select('id').where('company_id', user.company_id);

      const memberIds = companyMembers.map(member => member.id);

      if (memberIds.length === 0) {
        return res.json({
          success: true,
          analytics: {
            overview: {},
            trends: {},
            topPerforming: []
          }
        });
      }

      // Get listings analytics by month (last 6 months)
      const monthlyListings = await this.knex('listed_cars')
        .select(
          this.knex.raw("DATE_TRUNC('month', created_at) as month"),
          this.knex.raw('COUNT(*) as count'),
          this.knex.raw('SUM(views) as total_views'),
          this.knex.raw('AVG(price) as avg_price')
        )
        .whereIn('seller_id', memberIds)
        .where('created_at', '>=', this.knex.raw("CURRENT_DATE - INTERVAL '6 months'"))
        .groupBy(this.knex.raw("DATE_TRUNC('month', created_at)"))
        .orderBy('month', 'desc');

      // Get top performing listings (by views and favorites)
      const topListings = await this.knex('listed_cars')
        .select(
          'listed_cars.id',
          'listed_cars.make',
          'listed_cars.model',
          'listed_cars.year',
          'listed_cars.price',
          'listed_cars.views',
          'listed_cars.created_at'
        )
        .select(this.knex.raw('COUNT(favorites.id) as favorite_count'))
        .leftJoin('favorites', 'listed_cars.id', 'favorites.car_listing_id')
        .whereIn('listed_cars.seller_id', memberIds)
        .groupBy(
          'listed_cars.id',
          'listed_cars.make',
          'listed_cars.model',
          'listed_cars.year',
          'listed_cars.price',
          'listed_cars.views',
          'listed_cars.created_at'
        )
        .orderBy('listed_cars.views', 'desc')
        .limit(10);

      // Get average response time (time between message and reply)
      const avgResponseTime = await this.knex('messages as m1')
        .select(this.knex.raw('AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at))/3600) as avg_hours'))
        .join('messages as m2', function() {
          this.on('m1.conversation_id', 'm2.conversation_id').andOn('m2.created_at', '>', 'm1.created_at');
        })
        .join('conversations', 'm1.conversation_id', 'conversations.id')
        .join('listed_cars', 'conversations.car_listing_id', 'listed_cars.id')
        .whereIn('listed_cars.seller_id', memberIds)
        .whereIn('m2.sender_id', memberIds) // Company member replied
        .whereNotIn('m1.sender_id', memberIds) // Customer initiated
        .first();

      // Format analytics data
      const analytics = {
        overview: {
          totalMembers: memberIds.length,
          avgResponseTimeHours: Math.round((avgResponseTime?.avg_hours || 0) * 100) / 100
        },
        trends: {
          monthlyListings: monthlyListings.map(item => ({
            month: item.month,
            listings: parseInt(item.count),
            views: parseInt(item.total_views) || 0,
            avgPrice: Math.round(parseFloat(item.avg_price) || 0)
          }))
        },
        topPerforming: topListings.map(listing => ({
          id: listing.id,
          title: `${listing.make} ${listing.model} ${listing.year}`.trim(),
          price: listing.price,
          views: listing.views || 0,
          favorites: parseInt(listing.favorite_count) || 0,
          createdAt: listing.created_at
        }))
      };

      res.json({
        success: true,
        analytics
      });
    } catch (error) {
      logger.error('Error fetching company analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get message recipient for a listing (Enhanced messaging system)
   * Shows who will receive messages for a specific listing
   */
  async getListingMessageRecipient(req, res) {
    try {
      const { listingId } = req.params;

      if (!listingId) {
        return res.status(400).json({
          success: false,
          error: 'Listing ID is required'
        });
      }

      const recipient = await this.messageService.getListingMessageRecipient(listingId);

      res.json({
        success: true,
        recipient,
        routing: {
          canReceiveMessages: true,
          recipientType: recipient.recipientType,
          displayInfo: {
            name: recipient.recipientName,
            email: recipient.recipientEmail,
            isOriginalSeller: recipient.isOriginalSeller,
            companyName: recipient.companyName
          }
        }
      });
    } catch (error) {
      console.error('Error getting listing message recipient:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get message recipient'
      });
    }
  }

  /**
   * Get conversation ownership history
   * Shows the history of ownership changes for a conversation
   */
  async getConversationOwnershipHistory(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: 'Conversation ID is required'
        });
      }

      // Verify user has access to this conversation
      const isParticipant = await this.messageService.db.isUserParticipant(conversationId, userId);
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to conversation'
        });
      }

      const history = await this.messageService.getConversationOwnershipHistory(conversationId);

      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting conversation ownership history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get ownership history'
      });
    }
  }

  /**
   * Get enhanced company statistics including messaging metrics
   */
  async getEnhancedCompanyStats(req, res) {
    try {
      const userId = req.user.id;

      const user = await this.knex('sellers').select('company_id', 'role').where('id', userId).first();

      if (!user || !user.company_id) {
        return res.status(403).json({
          success: false,
          error: 'User is not associated with a company'
        });
      }

      // Get basic member statistics
      const stats = await this.knex.raw(
        `
        SELECT * FROM get_member_statistics(?)
      `,
        [user.company_id]
      );

      const memberStats = stats.rows[0];

      // Get messaging statistics
      const conversationStats = await this.knex('conversations as c')
        .select([
          this.knex.raw('COUNT(*) as total_conversations'),
          this.knex.raw('COUNT(col.id) as conversations_with_transfers')
        ])
        .join('listed_cars as lc', 'c.car_listing_id', 'lc.id')
        .leftJoin('conversation_ownership_log as col', 'c.id', 'col.conversation_id')
        .where('lc.company_id', user.company_id)
        .first();

      // Get active message handlers
      const messageHandlers = await this.knex('company_message_handlers')
        .count('* as active_handlers')
        .where('company_id', user.company_id)
        .where('is_active', true)
        .first();
      res.json({
        success: true,
        data: {
          members: memberStats,
          messaging: {
            totalConversations: parseInt(conversationStats.total_conversations),
            conversationsWithTransfers: parseInt(conversationStats.conversations_with_transfers),
            activeMessageHandlers: parseInt(messageHandlers.active_handlers)
          }
        }
      });
    } catch (error) {
      console.error('Error getting enhanced company stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get company statistics'
      });
    }
  }

  /**
   * Handle messaging system updates when a member is removed
   * @param {string} memberId - Member being removed
   * @param {string} companyId - Company ID
   * @param {string} transferListingsTo - ID of member to transfer listings to (optional)
   * @param {string} reason - Reason for removal
   * @param {string} removedBy - User performing the removal
   * @returns {Promise<Object>} - Messaging update results
   * @private
   */
  async _handleMemberMessaging(memberId, companyId, transferListingsTo, reason, removedBy) {
    try {
      // Use the enhanced message service to handle member removal
      const result = await this.messageService.handleMemberRemovalMessaging(memberId, companyId, removedBy);

      logger.info('Member messaging handled successfully', {
        memberId,
        companyId,
        transferredConversations: result.transferredCount,
        newHandler: result.newHandler
      });

      return result;
    } catch (error) {
      logger.error('Error handling member messaging:', {
        error: error.message,
        memberId,
        companyId
      });
      throw error;
    }
  }

  /**
   * Handle messaging system updates when a member is reactivated
   * @param {string} memberId - Member being reactivated
   * @param {string} companyId - Company ID
   * @param {string} reactivatedBy - User performing the reactivation
   * @returns {Promise<Object>} - Messaging update results
   * @private
   */
  async _handleMemberReactivationMessaging(memberId, companyId, reactivatedBy) {
    try {
      // Use the enhanced message service to handle member reactivation
      const result = await this.messageService.handleMemberReactivationMessaging(memberId, companyId, reactivatedBy);

      logger.info('Member reactivation messaging handled successfully', {
        memberId,
        companyId,
        transferredConversations: result.transferredCount
      });

      return result;
    } catch (error) {
      logger.error('Error handling member reactivation messaging:', {
        error: error.message,
        memberId,
        companyId
      });
      throw error;
    }
  }
}

module.exports = CompanyController;
