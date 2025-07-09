# Enhanced Company Member Management System

## Overview

The new member management system addresses critical business issues with proper member lifecycle management, data integrity, and the ability to re-add members.

## Key Improvements

### 1. **Soft Delete System**

- **Before**: Members were completely removed from the company (company_id set to null)
- **After**: Members are marked as 'removed' but maintain company association
- **Benefit**: Preserves data integrity and enables re-activation

### 2. **Member Status Tracking**

- `active`: Normal working member
- `pending`: Invited but not yet activated
- `removed`: Soft-deleted member
- `suspended`: Temporarily inactive member

### 3. **Listing Management**

When removing a member, you can now:

- **Transfer listings** to another active member
- **Suspend listings** (status: `suspended_member_removed`) - can be restored if member rejoins
- **Keep listings active** under the company (for revenue continuity)

### 4. **Audit Trail**

- Complete history of member actions (add, remove, reactivate, role changes)
- Tracks who performed actions and when
- Stores metadata (original roles, listing actions, reasons)

### 5. **Re-activation Capability**

- Removed members can be re-invited and reactivated
- Suspended listings can be automatically restored
- Original or new roles can be assigned

## API Endpoints

### Remove Member (Enhanced)

```
DELETE /api/company/members/:id
Body: {
  transferListingsTo?: string,  // UUID of member to transfer listings to
  suspendListings?: boolean,    // Default: true
  reason?: string              // Reason for removal
}
```

### Reactivate Member (New)

```
POST /api/company/members/:id/reactivate
Body: {
  newRole?: string,           // Role to assign (default: previous role)
  restoreListings?: boolean   // Restore suspended listings (default: true)
}
```

### Get Members (Enhanced)

```
GET /api/company/members?status=all&includeRemoved=false
```

## Business Benefits

### 1. **Data Integrity**

- Listings remain associated with the company
- Analytics and revenue tracking are preserved
- Historical data is maintained

### 2. **Flexibility**

- Members can be re-added without losing history
- Listings can be transferred or restored
- Different removal strategies for different scenarios

### 3. **Audit Compliance**

- Complete audit trail of all member actions
- Reasons for removal are tracked
- Regulatory compliance for employee management

### 4. **Revenue Protection**

- Active listings can be transferred to prevent revenue loss
- Suspended listings can be reactivated quickly
- Company maintains control over listings

## Implementation Steps

### 1. **Database Migration**

Run the enhanced schema migration:

```sql
-- Run enhanced_member_management_schema.sql
```

### 2. **Backend Updates**

- Updated `removeCompanyMember` method with soft delete
- Added `reactivateCompanyMember` method
- Enhanced `getCompanyMembers` to support status filtering
- Added audit trail functionality

### 3. **Frontend Updates** (TODO)

- Update member management UI to show different statuses
- Add reactivation buttons for removed members
- Show listing transfer options during removal
- Display audit trail in member details

## Migration Strategy

### For Existing Data

1. **Set default status**: All existing members get `member_status = 'active'`
2. **Preserve existing functionality**: Current flows continue to work
3. **Gradual adoption**: New features can be adopted incrementally

### For Existing Removed Members

If you have members who were already removed (company_id = null):

1. They can be manually re-associated with proper status
2. Their listings can be restored if still available
3. Audit trail can be backfilled if needed

## Usage Examples

### Scenario 1: Employee Leaves Company

```javascript
// Remove member but transfer their listings to manager
await removeCompanyMember(memberId, {
  transferListingsTo: managerId,
  reason: "Employee resignation",
});

// Later, if they return as contractor
await reactivateCompanyMember(memberId, {
  newRole: "member",
  restoreListings: false, // They won't get old listings back
});
```

### Scenario 2: Temporary Suspension

```javascript
// Suspend member for investigation
await removeCompanyMember(memberId, {
  suspendListings: true,
  reason: "Under investigation",
});

// Restore after investigation
await reactivateCompanyMember(memberId, {
  restoreListings: true, // Restore their suspended listings
});
```

### Scenario 3: Department Restructuring

```javascript
// Transfer all listings to department head before removing multiple members
for (const member of departmentMembers) {
  await removeCompanyMember(member.id, {
    transferListingsTo: departmentHeadId,
    reason: "Department restructuring",
  });
}
```

## Security Considerations

1. **Permission Checks**: Only owners and admins can remove/reactivate members
2. **Audit Trail**: All actions are logged with performer and reason
3. **Data Protection**: Sensitive data remains protected during status changes
4. **Validation**: Proper validation for listing transfers and role assignments

## Future Enhancements

1. **Bulk Operations**: Bulk member removal/reactivation
2. **Scheduled Actions**: Automatic removal after X days of inactivity
3. **Notification System**: Notify team about member status changes
4. **Advanced Permissions**: Granular role-based permissions
5. **Integration**: Sync with HR systems for automatic member management

This enhanced system provides a robust foundation for professional member management while maintaining data integrity and business continuity.
