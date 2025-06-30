# دليل أمان تبديل نوع الحساب

# Account Type Switching Security Guide

## نظرة عامة | Overview

تم تحسين مكون `UnifiedAccountManager` بميزات أمان إضافية لضمان حماية المستخدمين عند تبديل نوع الحساب.

The `UnifiedAccountManager` component has been enhanced with additional security features to ensure user protection when switching account types.

## الميزات الأمنية | Security Features

### 1. تأكيد كلمة المرور | Password Confirmation

- يتطلب إدخال كلمة المرور قبل تبديل نوع الحساب
- يمنع التبديل غير المصرح به
- Requires password input before account type switching
- Prevents unauthorized switching

### 2. نافذة التأكيد | Confirmation Modal

- نافذة تأكيد واضحة قبل التبديل
- شرح للتأثيرات المحتملة على الاشتراك
- Clear confirmation modal before switching
- Explanation of potential subscription impacts

### 3. التحقق من الصلاحيات | Permission Verification

- التحقق من قدرة المستخدم على تبديل نوع الحساب
- منع التبديل في حالات معينة
- Verification of user's ability to switch account types
- Prevention of switching in certain cases

### 4. تسجيل العمليات | Operation Logging

- تسجيل جميع محاولات التبديل
- تتبع العمليات الناجحة والفاشلة
- Logging of all switching attempts
- Tracking of successful and failed operations

## الاستخدام | Usage

```tsx
// المكون يدير الأمان تلقائياً
// The component manages security automatically
<UnifiedAccountManager
  onAccountTypeChange={(newType) => {
    console.log("تم تبديل نوع الحساب إلى:", newType);
  }}
/>
```

## اللغة العربية | Arabic Language

تم ترجمة جميع النصوص للهجة السورية:

- **حساب شخصي** - Individual Account
- **حساب شركة** - Company Account
- **بدل لحساب شركة** - Switch to Company Account
- **تأكيد التبديل** - Confirm Switch
- **عم نبدل...** - Switching...
- **يجب إدخال كلمة المرور للتأكيد** - Password required for confirmation

## أفضل الممارسات | Best Practices

1. **التحقق من الهوية**

   - تأكد من تسجيل الدخول الآمن
   - استخدم كلمات مرور قوية

2. **مراجعة التأثيرات**

   - اقرأ تحذيرات التبديل بعناية
   - تأكد من فهم تأثير التبديل على الاشتراك

3. **النسخ الاحتياطي**
   - احتفظ بنسخة من إعدادات الحساب
   - سجل معلومات الاشتراك المهمة

---

تم تطوير هذا المكون وفقاً لأفضل ممارسات الأمان والتجربة.
This component has been developed according to security and user experience best practices.
