# Messaging System Redesign for Enhanced Member Management

## Problem Analysis

### Current Messaging System Flaws

The current messaging system has a critical architectural flaw that becomes apparent when company members are removed and their listings are transferred or suspended:

#### 1. **Direct Seller-Message Coupling**

- Conversations are tied to `car_listing_id` and participants via `conversation_participants` table
- Messages route directly to the original listing seller (`seller_id` in `listed_cars`)
- When a seller is removed but listings remain active/transferred, messages still route to the removed seller

#### 2. **Business Logic Issues**

- **Security Risk**: Removed sellers receive messages about listings they no longer control
- **Data Integrity**: No mechanism to update conversation ownership when listings are transferred
- **User Experience**: Buyers get confused when removed sellers can't respond to messages
- **Business Logic**: Messages should route to whoever currently manages the listing

#### 3. **Current Data Flow Problem**

```
Buyer sends message → Listing ID → Original Seller ID → Removed Seller (❌)
```

**Should be:**

```
Buyer sends message → Listing ID → Current Listing Owner → Active Seller (✅)
```

## Proposed Solution: Decoupled Messaging Architecture

### Core Principle: Listing-Centric Message Routing

Instead of routing messages directly to the original seller, route messages to the **current listing owner**, which can be:

1. **Active seller** (normal case)
2. **New assigned seller** (after transfer)
3. **Company account** (when listing is suspended or no specific seller assigned)

### 1. Database Schema Enhancements

#### A. Add Listing Ownership Tracking

```sql
-- Add to listed_cars table
ALTER TABLE listed_cars
ADD COLUMN current_owner_id UUID REFERENCES sellers(id),
ADD COLUMN current_owner_type VARCHAR(20) DEFAULT 'seller' CHECK (current_owner_type IN ('seller', 'company')),
ADD COLUMN original_seller_id UUID REFERENCES sellers(id);

-- Migrate existing data
UPDATE listed_cars
SET current_owner_id = seller_id,
    current_owner_type = 'seller',
    original_seller_id = seller_id;

-- Update seller_id to be current_owner_id (for backward compatibility)
-- Or keep both and update business logic to use current_owner_id
```

#### B. Add Conversation Management Table

```sql
-- Track conversation ownership changes
CREATE TABLE conversation_ownership_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    old_owner_id UUID REFERENCES sellers(id),
    new_owner_id UUID REFERENCES sellers(id),
    owner_type VARCHAR(20) DEFAULT 'seller' CHECK (owner_type IN ('seller', 'company')),
    change_reason VARCHAR(100),
    changed_by UUID REFERENCES sellers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### C. Add Company Message Routing

```sql
-- Company members who can handle messages
CREATE TABLE company_message_handlers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    member_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    can_handle_transferred_listings BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Enhanced Messaging Service Logic

#### A. Message Routing Algorithm

```javascript
class EnhancedMessageService {
  /**
   * Determine who should receive messages for a listing
   */
  async getListingMessageRecipient(listingId) {
    const listing = await this.db.getListingWithOwnership(listingId);

    if (!listing) {
      throw new Error("Listing not found");
    }

    // Check if current owner is active
    const owner = await this.db.getUserById(listing.current_owner_id);
    const isSellerActive = await this.isSellerActiveInCompany(
      owner.id,
      listing.company_id
    );

    if (listing.current_owner_type === "seller" && isSellerActive) {
      return {
        recipientId: listing.current_owner_id,
        recipientType: "seller",
        isActive: true,
      };
    }

    // If seller is inactive or listing is company-managed, find company handler
    if (listing.company_id) {
      const handler = await this.getCompanyMessageHandler(listing.company_id);
      return {
        recipientId: handler.member_id,
        recipientType: "company_member",
        originalSellerId: listing.original_seller_id,
        isActive: true,
      };
    }

    throw new Error("No valid message recipient found for listing");
  }

  /**
   * Check if seller is active in their company
   */
  async isSellerActiveInCompany(sellerId, companyId) {
    if (!companyId) return true; // Individual seller

    const member = await this.db
      .knex("company_members")
      .where("seller_id", sellerId)
      .where("company_id", companyId)
      .where("member_status", "active")
      .first();

    return !!member;
  }

  /**
   * Get active company member to handle messages
   */
  async getCompanyMessageHandler(companyId) {
    // Try to find designated message handler
    let handler = await this.db
      .knex("company_message_handlers as cmh")
      .join("company_members as cm", "cmh.member_id", "cm.seller_id")
      .where("cmh.company_id", companyId)
      .where("cmh.is_active", true)
      .where("cmh.can_handle_transferred_listings", true)
      .where("cm.member_status", "active")
      .first();

    if (!handler) {
      // Fallback to any active admin/manager
      handler = await this.db
        .knex("company_members")
        .where("company_id", companyId)
        .where("member_status", "active")
        .whereIn("role", ["admin", "manager"])
        .first();
    }

    if (!handler) {
      throw new Error("No active company member available to handle messages");
    }

    return handler;
  }
}
```

#### B. Conversation Participant Management

```javascript
/**
 * Update conversation participants when listing ownership changes
 */
async updateConversationOwnership(listingId, newOwnerId, changeReason, changedBy) {
  const conversations = await this.db.knex('conversations')
    .where('car_listing_id', listingId);

  for (const conversation of conversations) {
    await this.db.knex.transaction(async (trx) => {
      // Get current seller participant
      const currentSeller = await trx('conversation_participants')
        .where('conversation_id', conversation.id)
        .where('role', 'seller')
        .first();

      if (currentSeller && currentSeller.user_id !== newOwnerId) {
        // Log the ownership change
        await trx('conversation_ownership_log').insert({
          conversation_id: conversation.id,
          old_owner_id: currentSeller.user_id,
          new_owner_id: newOwnerId,
          owner_type: 'seller',
          change_reason: changeReason,
          changed_by: changedBy
        });

        // Update conversation participant
        await trx('conversation_participants')
          .where('conversation_id', conversation.id)
          .where('role', 'seller')
          .update('user_id', newOwnerId);

        // Optionally notify buyers of the change
        await this.notifyBuyersOfOwnershipChange(conversation.id, newOwnerId);
      }
    });
  }
}
```

### 3. Integration with Member Management

#### A. Member Removal Handler

```javascript
// In companyController.js _removeMember method
async _handleMemberMessaging(sellerId, companyId, transferToId) {
  // Get all listings by this seller
  const sellerListings = await this.knex('listed_cars')
    .where('seller_id', sellerId)
    .where('company_id', companyId);

  for (const listing of sellerListings) {
    if (transferToId) {
      // Transfer listing and update conversations
      await this.knex('listed_cars')
        .where('id', listing.id)
        .update({
          current_owner_id: transferToId,
          current_owner_type: 'seller'
        });

      await this.messageService.updateConversationOwnership(
        listing.id,
        transferToId,
        'member_removed_transferred',
        req.user.id
      );
    } else {
      // Set to company management
      const handler = await this.messageService.getCompanyMessageHandler(companyId);

      await this.knex('listed_cars')
        .where('id', listing.id)
        .update({
          current_owner_id: handler.member_id,
          current_owner_type: 'company_member'
        });

      await this.messageService.updateConversationOwnership(
        listing.id,
        handler.member_id,
        'member_removed_company_managed',
        req.user.id
      );
    }
  }
}
```

#### B. Member Reactivation Handler

```javascript
async _handleMemberReactivationMessaging(sellerId, companyId) {
  // Restore listings to reactivated member
  const memberListings = await this.knex('listed_cars')
    .where('original_seller_id', sellerId)
    .where('company_id', companyId)
    .where('current_owner_type', 'company_member');

  for (const listing of memberListings) {
    await this.knex('listed_cars')
      .where('id', listing.id)
      .update({
        current_owner_id: sellerId,
        current_owner_type: 'seller'
      });

    await this.messageService.updateConversationOwnership(
      listing.id,
      sellerId,
      'member_reactivated',
      req.user.id
    );
  }
}
```

### 4. Enhanced API Endpoints

#### A. New Message Routing Endpoint

```javascript
// GET /api/messages/listing/:listingId/recipient
async getListingMessageRecipient(req, res) {
  try {
    const { listingId } = req.params;
    const recipient = await this.messageService.getListingMessageRecipient(listingId);

    res.json({
      success: true,
      recipient,
      routing: {
        canReceiveMessages: recipient.isActive,
        recipientType: recipient.recipientType,
        displayName: await this.getRecipientDisplayName(recipient)
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
}
```

#### B. Conversation History Endpoint

```javascript
// GET /api/messages/conversation/:conversationId/ownership-history
async getConversationOwnershipHistory(req, res) {
  try {
    const { conversationId } = req.params;
    const history = await this.messageService.getConversationOwnershipHistory(conversationId);

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

### 5. Frontend Integration

#### A. Message Composer Updates

```typescript
// Show current listing owner in message interface
interface MessageRecipient {
  recipientId: string;
  recipientType: "seller" | "company_member";
  displayName: string;
  isOriginalSeller: boolean;
  transferredDate?: string;
}

const MessageComposer: React.FC<{ listingId: string }> = ({ listingId }) => {
  const [recipient, setRecipient] = useState<MessageRecipient | null>(null);

  useEffect(() => {
    fetchListingMessageRecipient(listingId).then(setRecipient);
  }, [listingId]);

  return (
    <div>
      {recipient && (
        <div className="message-recipient-info">
          <p>Messaging: {recipient.displayName}</p>
          {!recipient.isOriginalSeller && (
            <small className="text-yellow-600">
              This listing is now managed by {recipient.displayName}
              {recipient.transferredDate &&
                ` since ${recipient.transferredDate}`}
            </small>
          )}
        </div>
      )}
      {/* Rest of message composer */}
    </div>
  );
};
```

#### B. Conversation History Display

```typescript
const ConversationHistory: React.FC = () => {
  return (
    <div>
      {ownershipChanges.map((change) => (
        <div key={change.id} className="ownership-change-notice">
          <small className="text-gray-500">
            Listing management transferred from {change.oldOwner} to{" "}
            {change.newOwner}
            on {change.date} - {change.reason}
          </small>
        </div>
      ))}
    </div>
  );
};
```

## Migration Strategy

### Phase 1: Database Schema Updates

1. Add new columns to `listed_cars` table
2. Create new tracking tables
3. Migrate existing data (set current_owner_id = seller_id)

### Phase 2: Enhanced Service Layer

1. Update `MessageService` with new routing logic
2. Add conversation ownership management
3. Update member management integration

### Phase 3: API Enhancements

1. Add new message routing endpoints
2. Update existing endpoints to use new logic
3. Maintain backward compatibility

### Phase 4: Frontend Updates

1. Update message components to show current owner
2. Add ownership change notifications
3. Update conversation history display

### Phase 5: Testing & Validation

1. Unit tests for new routing logic
2. Integration tests for member management flow
3. End-to-end testing of message delivery

## Benefits

### 1. **Security & Privacy**

- Removed sellers no longer receive messages for listings they don't control
- Clear ownership tracking and audit trail
- Proper access control for conversation management

### 2. **Business Logic Integrity**

- Messages always route to the person who can actually respond
- Company can maintain customer relationships even when individual sellers leave
- Clear escalation path for orphaned conversations

### 3. **User Experience**

- Buyers always get responses from active, authorized users
- Clear indication when listing management has changed
- Smooth transition during ownership changes

### 4. **Data Integrity**

- Complete audit trail of ownership changes
- No orphaned conversations or lost messages
- Reversible operations (member reactivation)

### 5. **Scalability**

- Supports complex company hierarchies
- Can handle multiple message handlers per company
- Extensible to support future business requirements

## Implementation Priority

### High Priority (Critical for Member Management)

- [ ] Database schema updates
- [ ] Message routing logic
- [ ] Member removal/reactivation integration

### Medium Priority (User Experience)

- [ ] Frontend ownership display
- [ ] Conversation history tracking
- [ ] Notification system

### Low Priority (Advanced Features)

- [ ] Multiple message handlers per company
- [ ] Advanced routing rules
- [ ] Message analytics and reporting

This redesign ensures that the messaging system properly supports the enhanced member management system while maintaining data integrity, security, and user experience.
