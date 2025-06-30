# Arabic Email Templates - Cultural Localization Guide

## Overview

All company email templates have been localized to Arabic using formal Syrian dialect that is culturally appropriate for business communications.

## Cultural Considerations

### Language & Tone

- **Formal Arabic**: Uses Modern Standard Arabic with Syrian dialect touches
- **Respectful Addressing**: "أهلاً وسهلاً" (welcome), "تشرّفنا" (we are honored)
- **Business Appropriate**: Professional tone suitable for corporate communications
- **RTL Support**: Right-to-left text direction properly implemented

### Syrian Cultural Elements

- **Formal Greetings**: Traditional Syrian business greetings
- **Respectful Language**: Uses plural forms as signs of respect (كم، تكم)
- **Cultural Expressions**: "تشرّفنا بدعوتكم" (we are honored to invite you)
- **Professional Titles**: Appropriate Arabic translations for business roles

## Email Templates Converted

### 1. Company Member Invitation (`company-member-invitation.html`)

- **Subject**: `دعوة للانضمام إلى شركة {company} على Cars Bids`
- **Greeting**: `أهلاً وسهلاً {name}!`
- **Key Phrase**: `تشرّفنا بدعوتكم للانضمام`
- **CTA**: `قبول الدعوة`

### 2. Member Removal Notification (`company-member-removal.html`)

- **Subject**: `تحديث صلاحيات الوصول في شركة {company}`
- **Greeting**: `أهلاً {name}،`
- **Professional Tone**: Respectful notification of access changes
- **Support**: Clear contact information

### 3. Company Notification (`company-notification.html`)

- **Subject**: `إشعار من {company}`
- **Greeting**: `أهلاً {name}،`
- **CTA**: `اتخاذ إجراء`
- **Context**: Clear explanation that it's a company-wide notification

## Role Translations (Syrian Business Context)

```javascript
const roleTranslations = {
  owner: "مالك الشركة",
  admin: "مدير",
  manager: "مدير فرع",
  member: "عضو",
  employee: "موظف",
  salesperson: "مندوب مبيعات",
  moderator: "مشرف",
};
```

## Removal Reason Translations

```javascript
const reasonTranslations = {
  "Administrative decision": "قرار إداري",
  "Performance issues": "مسائل تتعلق بالأداء",
  "Voluntary resignation": "استقالة طوعية",
  "Company restructuring": "إعادة هيكلة الشركة",
  "Contract ended": "انتهاء العقد",
  "Policy violation": "مخالفة السياسات",
  Downsizing: "تقليص العمالة",
  "Role elimination": "إلغاء المنصب",
  "Mutual agreement": "اتفاق متبادل",
};
```

## CSS Updates for RTL Support

### Key Changes

- `direction: rtl` - Right-to-left text direction
- `border-right` instead of `border-left` for visual elements
- Font family includes Arabic-friendly fonts: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`

### Visual Adjustments

- Card borders moved to right side for Arabic reading flow
- Maintained professional color scheme
- Proper spacing for Arabic text

## Service Integration

### CompanyEmailService Updates

- Added Arabic translation methods
- Cultural greeting helper function
- Proper role and reason translations
- Arabic subject lines for all email types

### Examples Updated

- Sample data uses Arabic names (أحمد محمد، فاطمة علي)
- Company name in Arabic (معرض الشام للسيارات)
- Demonstrates proper usage with Arabic content

## Best Practices Implemented

### 1. Cultural Sensitivity

- Formal business language appropriate for Syrian culture
- Respectful addressing using plural forms
- Professional tone without being overly formal

### 2. Technical Considerations

- Proper RTL implementation
- Arabic-friendly font selection
- Maintained email template responsiveness

### 3. Business Communication

- Clear action items in Arabic
- Professional contact information
- Appropriate urgency indicators (expiry notifications)

## Usage Notes

### For Developers

- Use the `_translateRoleToArabic()` method for role translations
- Use the `_translateReasonToArabic()` method for removal reasons
- Subject lines are automatically in Arabic when using the service

### For Content

- All user-facing text is in formal Arabic
- Business terms use appropriate Syrian dialect
- Contact and support information is clearly provided

This localization ensures that the email communication feels natural and respectful to Arabic-speaking users while maintaining the professional standards expected in business communications.
