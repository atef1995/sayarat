import React from "react";
import { Card, Typography, Divider, Space } from "antd";
import {
  SafetyOutlined,
  UserOutlined,
  DatabaseOutlined,
  ShareAltOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import "./PrivacyPolicy.css";

const { Title, Paragraph, Text } = Typography;

/**
 * Privacy Policy Component
 *
 * A comprehensive privacy policy page in formal Arabic that outlines:
 * - Data collection practices
 * - Usage of personal information
 * - Data storage and security
 * - User rights and choices
 * - Contact information for privacy concerns
 *
 * @returns {JSX.Element} Privacy policy page component
 */
const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-policy-container">
      <Card>
        <Space
          direction="vertical"
          size="large"
          className="privacy-policy-content"
        >
          {/* Header */}
          <div className="privacy-policy-header">
            <SafetyOutlined className="privacy-policy-icon" />
            <Title level={1}>سياسة الخصوصية</Title>
            <Text type="secondary">
              آخر تحديث: {new Date().toLocaleDateString("ar-EG")}
            </Text>
          </div>

          <Divider />

          {/* Introduction */}
          <div>
            <Title level={2} className="privacy-policy-title-with-icon">
              <UserOutlined /> مقدمة
            </Title>
            <Paragraph className="privacy-policy-paragraph">
              نحن في منصة كارز بيدز نلتزم بحماية خصوصيتك وبياناتك الشخصية. تشرح
              هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا ومشاركتنا للمعلومات
              الشخصية التي تقدمها لنا عند استخدام موقعنا الإلكتروني وخدماتنا.
            </Paragraph>
            <Paragraph className="privacy-policy-paragraph">
              باستخدامك لموقعنا الإلكتروني أو خدماتنا، فإنك توافق على جمع
              واستخدام المعلومات وفقاً لهذه السياسة.
            </Paragraph>
          </div>

          <Divider />

          {/* Data Collection */}
          <div>
            <Title level={2} className="privacy-policy-title-with-icon">
              <DatabaseOutlined /> المعلومات التي نجمعها
            </Title>

            <Title level={3}>المعلومات الشخصية</Title>
            <Paragraph className="privacy-policy-paragraph">
              قد نجمع المعلومات الشخصية التالية عندما تتفاعل مع موقعنا:
            </Paragraph>
            <ul className="privacy-policy-list">
              <li>الاسم الكامل</li>
              <li>عنوان البريد الإلكتروني</li>
              <li>رقم الهاتف</li>
              <li>
                المعلومات المتعلقة بالحساب (اسم المستخدم، كلمة المرور المشفرة)
              </li>
              <li>تفاصيل الإعلانات والسيارات المنشورة</li>
              <li>سجل المراسلات والرسائل</li>
              <li>بيانات الموقع الجغرافي (عند الإذن)</li>
            </ul>

            <Title level={3}>المعلومات التقنية</Title>
            <Paragraph className="privacy-policy-paragraph">
              نجمع تلقائياً معلومات تقنية معينة عند استخدامك للموقع:
            </Paragraph>
            <ul className="privacy-policy-list">
              <li>عنوان بروتوكول الإنترنت (IP)</li>
              <li>نوع المتصفح ونسخته</li>
              <li>نوع الجهاز ونظام التشغيل</li>
              <li>سجل الزيارات والصفحات المتصفحة</li>
              <li>ملفات تعريف الارتباط (Cookies)</li>
              <li>بيانات الاستخدام والتفاعل مع الموقع</li>
            </ul>
          </div>

          <Divider />

          {/* Data Usage */}
          <div>
            <Title level={2} className="privacy-policy-title-with-icon">
              <ShareAltOutlined /> كيفية استخدام المعلومات
            </Title>
            <Paragraph className="privacy-policy-paragraph">
              نستخدم المعلومات المجمعة للأغراض التالية:
            </Paragraph>
            <ul className="privacy-policy-list">
              <li>توفير وتشغيل خدماتنا بكفاءة</li>
              <li>إنشاء وإدارة حسابات المستخدمين</li>
              <li>معالجة ونشر إعلانات السيارات</li>
              <li>تسهيل التواصل بين المستخدمين</li>
              <li>تحسين تجربة المستخدم وتطوير الموقع</li>
              <li>إرسال إشعارات مهمة ورسائل تحديثات</li>
              <li>منع الاحتيال وضمان أمن الموقع</li>
              <li>الامتثال للالتزامات القانونية</li>
              <li>تقديم الدعم الفني وخدمة العملاء</li>
            </ul>
          </div>

          <Divider />

          {/* Data Storage and Security */}
          <div>
            <Title level={2} className="privacy-policy-title-with-icon">
              <SafetyOutlined /> حماية وتخزين البيانات
            </Title>

            <Title level={3}>الأمان</Title>
            <Paragraph className="privacy-policy-paragraph">
              نتخذ تدابير أمنية صارمة لحماية معلوماتك الشخصية من الوصول غير
              المصرح به أو الاستخدام أو الكشف أو التعديل أو التدمير:
            </Paragraph>
            <ul className="privacy-policy-list">
              <li>تشفير البيانات الحساسة (SSL/TLS)</li>
              <li>تشفير كلمات المرور باستخدام خوارزميات متقدمة</li>
              <li>جدران حماية وأنظمة كشف التسلل</li>
              <li>مراقبة النظام على مدار الساعة</li>
              <li>تحديثات أمنية منتظمة</li>
              <li>قيود الوصول للموظفين المخولين فقط</li>
            </ul>

            <Title level={3}>التخزين</Title>
            <Paragraph className="privacy-policy-paragraph">
              يتم تخزين بياناتك على خوادم آمنة. نحتفظ بمعلوماتك الشخصية فقط
              طالما كان ذلك ضرورياً لتوفير خدماتنا أو حسب ما يقتضيه القانون.
            </Paragraph>
          </div>

          <Divider />

          {/* Data Sharing */}
          <div>
            <Title level={2} className="privacy-policy-title-with-icon">
              <ShareAltOutlined /> مشاركة المعلومات
            </Title>
            <Paragraph className="privacy-policy-paragraph">
              لا نبيع أو نؤجر أو نتاجر بمعلوماتك الشخصية لأطراف ثالثة. قد نشارك
              معلومات محدودة في الحالات التالية:
            </Paragraph>
            <ul className="privacy-policy-list">
              <li>
                <strong>مقدمو الخدمات:</strong> شركاء موثوقون يساعدون في تشغيل
                الموقع (خدمات الاستضافة، معالجة الدفع، البريد الإلكتروني)
              </li>
              <li>
                <strong>المتطلبات القانونية:</strong> عندما يقتضي القانون أو
                لحماية حقوقنا القانونية
              </li>
              <li>
                <strong>موافقتك:</strong> عندما تمنح موافقة صريحة على المشاركة
              </li>
              <li>
                <strong>المعلومات العامة:</strong> المعلومات التي تختار جعلها
                متاحة للعموم في إعلاناتك
              </li>
            </ul>
          </div>

          <Divider />

          {/* User Rights */}
          <div>
            <Title level={2} className="privacy-policy-title-with-icon">
              <UserOutlined /> حقوقك وخياراتك
            </Title>
            <Paragraph className="privacy-policy-paragraph">
              لديك الحقوق التالية فيما يتعلق بمعلوماتك الشخصية:
            </Paragraph>
            <ul className="privacy-policy-list">
              <li>
                <strong>الوصول:</strong> طلب نسخة من معلوماتك الشخصية المخزنة
                لدينا
              </li>
              <li>
                <strong>التصحيح:</strong> طلب تصحيح أي معلومات غير دقيقة أو غير
                مكتملة
              </li>
              <li>
                <strong>الحذف:</strong> طلب حذف معلوماتك الشخصية (وفقاً للقيود
                القانونية)
              </li>
              <li>
                <strong>التقييد:</strong> طلب تقييد معالجة معلوماتك في ظروف
                معينة
              </li>
              <li>
                <strong>النقل:</strong> طلب نقل بياناتك إلى خدمة أخرى بصيغة
                منظمة
              </li>
              <li>
                <strong>الاعتراض:</strong> الاعتراض على معالجة معلوماتك لأغراض
                معينة
              </li>
              <li>
                <strong>إلغاء الاشتراك:</strong> إلغاء الاشتراك في الرسائل
                التسويقية
              </li>
            </ul>
            <Paragraph className="privacy-policy-paragraph">
              لممارسة أي من هذه الحقوق، يرجى التواصل معنا باستخدام معلومات
              الاتصال المذكورة أدناه.
            </Paragraph>
          </div>

          <Divider />

          {/* Cookies */}
          <div>
            <Title level={2}>ملفات تعريف الارتباط (Cookies)</Title>
            <Paragraph className="privacy-policy-paragraph">
              نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتحسين تجربتك على
              الموقع:
            </Paragraph>
            <ul className="privacy-policy-list">
              <li>
                <strong>ملفات تعريف الارتباط الأساسية:</strong> ضرورية لتشغيل
                الموقع بشكل صحيح
              </li>
              <li>
                <strong>ملفات تعريف الارتباط التحليلية:</strong> تساعدنا في فهم
                كيفية استخدامك للموقع
              </li>
              <li>
                <strong>ملفات تعريف الارتباط الوظيفية:</strong> تحفظ تفضيلاتك
                وإعداداتك
              </li>
            </ul>
            <Paragraph className="privacy-policy-paragraph">
              يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك، ولكن
              تعطيلها قد يؤثر على بعض وظائف الموقع.
            </Paragraph>
          </div>

          <Divider />

          {/* Children's Privacy */}
          <div>
            <Title level={2}>خصوصية الأطفال</Title>
            <Paragraph className="privacy-policy-paragraph">
              خدماتنا غير مخصصة للأطفال دون سن 18 عاماً. لا نجمع عمداً معلومات
              شخصية من الأطفال دون هذا السن. إذا علمنا أننا جمعنا معلومات من طفل
              دون الحصول على موافقة والديه، فسنتخذ خطوات لحذف هذه المعلومات.
            </Paragraph>
          </div>

          <Divider />

          {/* Updates */}
          <div>
            <Title level={2}>تحديثات السياسة</Title>
            <Paragraph className="privacy-policy-paragraph">
              قد نحدث هذه السياسة من وقت لآخر لتعكس التغييرات في ممارساتنا أو
              لأسباب قانونية أو تنظيمية. سنشعرك بأي تغييرات مهمة عبر البريد
              الإلكتروني أو إشعار بارز على موقعنا قبل دخول التغييرات حيز
              التنفيذ.
            </Paragraph>
            <Paragraph className="privacy-policy-paragraph">
              ننصحك بمراجعة هذه السياسة بشكل دوري للبقاء على اطلاع على أحدث
              ممارساتنا في مجال الخصوصية.
            </Paragraph>
          </div>

          <Divider />

          {/* Contact Information */}
          <div>
            <Title level={2} className="privacy-policy-title-with-icon">
              <PhoneOutlined /> معلومات الاتصال
            </Title>
            <Paragraph className="privacy-policy-paragraph">
              إذا كان لديك أي أسئلة أو مخاوف حول هذه السياسة أو ممارساتنا في
              مجال الخصوصية، يمكنك التواصل معنا:
            </Paragraph>

            <Card className="privacy-policy-contact-card">
              <Space direction="vertical" size="middle">
                <div className="privacy-policy-contact-item">
                  <MailOutlined className="privacy-policy-contact-icon" />
                  <Text strong>البريد الإلكتروني:</Text>
                  <Text copyable>privacy@cars-bids.com</Text>
                </div>
                <div className="privacy-policy-contact-item">
                  <PhoneOutlined className="privacy-policy-contact-icon" />
                  <Text strong>الهاتف:</Text>
                  <Text>+963-XXX-XXXX</Text>
                </div>
                <div>
                  <Text strong>العنوان:</Text>
                  <br />
                  <Text>كارز بيدز</Text>
                  <br />
                  <Text>سوريا</Text>
                </div>
              </Space>
            </Card>

            <Paragraph className="privacy-policy-contact-text">
              سنرد عليك في أقرب وقت ممكن، وعادة في غضون 48 ساعة من تلقي
              استفسارك.
            </Paragraph>
          </div>

          {/* Footer */}
          <Divider />
          <div className="privacy-policy-footer">
            <Text type="secondary" className="privacy-policy-footer-main">
              © {new Date().getFullYear()} كارز بيدز. جميع الحقوق محفوظة.
            </Text>
            <br />
            <Text type="secondary" className="privacy-policy-footer-date">
              آخر تحديث:{" "}
              {new Date().toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
