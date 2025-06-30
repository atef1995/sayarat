/**
 * deprecated: This file is deprecated and will be removed in the future.
 * Use the new email service instead.
 */

// require('dotenv').config();
// const brevo = require('@getbrevo/brevo');
// let apiInstance = new brevo.TransactionalEmailsApi();

// let apiKey = apiInstance.authentications['apiKey'];
// apiKey.apiKey = process.env.BREVO_API_KEY;

// /**
//  *
//  * @param {object} to {email,name}
//  * @param {string} subject
//  * @param {string} htmlContent
//  * @param {number} templateId - Optional, if provided will use the template instead of htmlContent
//  * @param {object} params - Optional, parameters to pass to the template
//  * @return {Promise<boolean>} - Returns true if the email was sent successfully, otherwise throws an error.
//  * @throws {Error} - Throws an error if the email sending fails.
//  */
// async function sendEmail(to, subject, htmlContent, templateId, params) {
//   let sendSmtpEmail = new brevo.SendSmtpEmail();
//   sendSmtpEmail.subject = subject;
//   if (templateId) {
//     sendSmtpEmail.templateId = templateId;
//     sendSmtpEmail.params = { ...params, };
//   } else {
//     sendSmtpEmail.htmlContent = `
//     <!DOCTYPE html>
//     <html lang="ar" dir="rtl">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>${subject}</title>
//       </head>
//       <body>
//         <div
//         style="
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           font-family: Arial, sans-serif;
//           line-height: 1.6;
//           padding: 20px;
//           background-color: #f4f4f4;
//           border-radius: 5px;
//           box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
//           max-width: 600px;
//           margin: 20px auto;
//           color: #333;
//           text-align: center;
//           direction: rtl;
//           font-size: 16px;
//           border: 1px solid #ddd;
//           background-color: #ffffff;
//           box-sizing: border-box;
//           word-wrap: break-word;
//           word-break: break-word;
//           overflow-wrap: break-word;
//           white-space: normal;
//         "
//         >
//           <p style="font-family: Arial, sans-serif; line-height: 1.6;">مرحباً ${to.name},</p>
//           ${htmlContent}
//           <p>إذا كان لديك أي استفسارات، يرجى الاتصال بفريق الدعم لدينا.</p>
//           <a href="${process.env.CLIENT_URL}/support" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">اتصل بالدعم</a>
//           <p>مع تحيات،</p>
//           <p>فريق carbids</p>
//         </div>
//       </body>
//     </html>
//     `;
//   }
//   sendSmtpEmail.sender = { "name": "carbids", "email": "atefcodes@gmail.com" };
//   sendSmtpEmail.to = [
//     { "email": to.email, "name": to.name }
//   ];
//   sendSmtpEmail.replyTo = { "email": "atefcodes@gmail.com", "name": "atef" };
//   sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
//   sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };

//   const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
//   if (data.response.statusCode !== 202) {
//     throw new Error(`Failed to send email: ${data.response?.statusMessage}`);
//   }

//   return data.response.statusCode === 202;
// }

// const sendResetPswdLink = async (to, resetToken) => {
//   const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
//   const subject = 'إعادة تعيين كلمة المرور';
//   const htmlContent = `
//   <h1>إعادة تعيين كلمة المرور</h1>
//   <p>مرحباً،</p>
//   <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك. يرجى النقر على الرابط أدناه لإعادة تعيين كلمة المرور الخاصة بك:</p>
//   <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a>

//   <p>إذا لم تكن قد طلبت إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.</p>
//   <p>هذا الرابط صالح لمدة 24 ساعة فقط.</p>
//   `;

//   try {
//     await sendEmail(to, subject, htmlContent);
//     console.log('Reset password email sent successfully');
//   } catch (error) {
//     console.error('Error sending reset password email:', error);
//   }
// };

// const sendEmailVerification = async (verificationToken, email, firstName) => {
//   const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
//   const emailTemplate = {
//     subject: 'تأكيد البريد الالكتروني',
//     html: `
//           <h1 dir="rtl">مرحباً ${firstName}،</h1>
//           <p dir="rtl">شكراً لتسجيلك في موقعنا. يرجى النقر على الرابط التالي لتأكيد بريدك الإلكتروني:</p>
//           <a dir="rtl" href="${verificationUrl}">تأكيد البريد الإلكتروني</a>
//           <p dir="rtl">هذا الرابط صالح لمدة 24 ساعة فقط.</p>
//       `
//   };

//   await sendEmail({ email, name: firstName }, emailTemplate.subject, emailTemplate.html);
// }

// const sendNotificationEmail = async (email, firstName, params) => {
//   await sendEmail({ email, name: firstName }, 'Notification', undefined, 2, params);
// }

// module.exports = {
//   sendResetPswdLink,
//   sendEmail,
//   sendEmailVerification,
//   sendNotificationEmail
// };
