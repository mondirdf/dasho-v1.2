
# خطة شاملة لجعل Dasho يستحق 5$/شهر

## الوضع الحالي

Dasho حاليا يقدم:
- ويدجتس أساسية (أسعار، أخبار، Fear & Greed)
- 4 ويدجتس Pro Trading جديدة (Structure Scanner, Volatility Regime, MTF Confluence, Session Monitor)
- نظام تنبيهات بسيط
- قوالب مشاركة
- AI Market Recap (24 ساعة)

**المشكلة**: لا يوجد سبب كافي يجعل المستخدم يدفع $5/شهر. المنتج يشبه لوحة بيانات عادية بدون "خندق دفاعي" (moat) حقيقي.

---

## الاستراتيجية: "ذكاء لا يمكن بناؤه بنفسك"

الفكرة الأساسية: المستخدم لا يدفع مقابل بيانات (متاحة مجانا في كل مكان)، بل يدفع مقابل **تحليل + سياق + توفير وقت**.

---

## المرحلة 1: تجربة Onboarding تبيع نفسها (الأسبوع 1)

### 1.1 شاشة ترحيب ذكية
- بعد التسجيل مباشرة: سؤالين فقط
  - "ما نوع التداول؟" (Day trader / Swing / Long-term)
  - "ما الأصول المفضلة؟" (BTC, ETH, SOL...)
- بناء على الإجابات: إنشاء داشبورد جاهز مخصص تلقائيا

### 1.2 نظام Trial ذكي (7 أيام Pro مجانا)
- كل مستخدم جديد يحصل على 7 أيام Pro كاملة
- شريط علوي يعرض العد التنازلي: "باقي 5 أيام من Pro المجاني"
- بعد انتهاء Trial: الويدجتس Pro تبقى مرئية لكن مضببة (blur) مع ProGate

---

## المرحلة 2: ميزات Pro لا غنى عنها (الأسبوع 2-3)

### 2.1 Daily Trading Brief (الملخص اليومي)
- Edge Function تعمل كل صباح الساعة 7:00 UTC
- تجمع: أهم تحركات الأسعار + أحداث Structure (BOS/ChoCH) + تغيير Regime + أخبار مهمة
- تولد ملخص مكتوب بأسلوب محلل محترف
- يظهر كـ widget خاص أو كـ notification عند فتح الداشبورد
- **Free**: يرى عنوان الملخص فقط | **Pro**: يرى كل شيء

### 2.2 Smart Alerts 2.0
- تنبيهات مبنية على الأحداث وليس فقط السعر:
  - "أعلمني عند حدوث BOS على BTC في 4h"
  - "أعلمني عند تغير Regime من Compression إلى Expansion"
  - "أعلمني عند MTF Confluence فوق 80%"
- **Free**: تنبيهات سعر فقط | **Pro**: تنبيهات ذكية على كل الأحداث

### 2.3 Watchlist مخصصة مع ملاحظات
- قائمة متابعة مع إمكانية إضافة ملاحظات لكل أصل
- تخزين الملاحظات في الداتابيز
- عرض آخر ملاحظة مع السعر الحالي
- **Free**: 5 أصول | **Pro**: غير محدود

---

## المرحلة 3: التميز البصري (الأسبوع 3-4)

### 3.1 ثيمات متعددة
- إضافة 3-4 ثيمات في صفحة Settings:
  - Dark (الحالي)
  - Midnight Blue
  - Terminal Green (هاكر ستايل)
  - Light Mode
- **Free**: Dark فقط | **Pro**: كل الثيمات

### 3.2 Widget Layouts محفوظة
- حفظ أكثر من layout لنفس الداشبورد
- مثلا: "Trading View" و "Overview Mode" و "News Focus"
- التبديل بينهم بنقرة واحدة
- **Pro فقط**

### 3.3 تحسين الصفحة الرئيسية (Landing)
- إضافة قسم "Live Demo" يعرض بيانات حقيقية بدون تسجيل
- إضافة شهادات مستخدمين (Testimonials)
- إضافة عداد "Active Traders" (حتى لو تقريبي)

---

## المرحلة 4: الـ Moat الحقيقي (الأسبوع 4-5)

### 4.1 Correlation Matrix Widget (Pro)
- مصفوفة ارتباط بين الأصول المختارة
- تحسب correlation coefficient من بيانات OHLC الموجودة
- تساعد في التنويع وإدارة المخاطر

### 4.2 Performance Journal (Pro)
- سجل يومي تلقائي يوثق:
  - حالة السوق عند كل يوم (regime, bias, sentiment)
  - أهم الأحداث (BOS, regime changes)
- يمكن للمستخدم إضافة ملاحظات يدوية
- عرض تقويم شهري مع ألوان حسب حالة السوق

### 4.3 Export & Reports (Pro)
- تصدير بيانات أي widget كـ CSV
- تقرير أسبوعي PDF يُرسل بالإيميل
- مشاركة screenshot لأي widget

---

## المرحلة 5: الدفع والتحويل (الأسبوع 5-6)

### 5.1 ربط Stripe
- صفحة Checkout مع Stripe
- خطة شهرية $5/mo وسنوية $40/yr
- إدارة الاشتراك من Settings

### 5.2 Upgrade Nudges الذكية
- عند وصول المستخدم لحد معين: رسالة لطيفة وليس حظر
- بعد أسبوع من الاستخدام: "أنت استخدمت 47 recap هذا الأسبوع. Pro يعطيك recaps أسرع"
- عند محاولة إضافة widget Pro: عرض preview حي ثم ProGate

### 5.3 Referral بسيط
- "ادعُ صديق واحصل على أسبوع Pro مجاني"
- رابط إحالة فريد لكل مستخدم
- تتبع الإحالات في جدول referrals

---

## ملخص الأولويات

| الأولوية | الميزة | التأثير على الدفع |
|----------|--------|-------------------|
| 1 | Trial 7 أيام + Onboarding ذكي | عالي جدا - يجعل المستخدم يجرب Pro |
| 2 | Daily Trading Brief | عالي - سبب يومي للعودة |
| 3 | Smart Alerts 2.0 | عالي - ميزة فريدة لا توجد مجانا |
| 4 | ربط Stripe | ضروري - بدونه لا يوجد إيراد |
| 5 | Watchlist + ملاحظات | متوسط - engagement يومي |
| 6 | ثيمات + Layouts | متوسط - تمييز بصري |
| 7 | Correlation Matrix | متوسط - قيمة تحليلية |
| 8 | Performance Journal | متوسط - retention طويل المدى |
| 9 | Export/Reports | منخفض - ميزة تكميلية |
| 10 | Referral | منخفض - نمو عضوي |

---

## التفاصيل التقنية

### قاعدة البيانات (جداول جديدة)
- `user_trials`: تتبع حالة Trial لكل مستخدم (start_date, end_date, converted)
- `daily_briefs`: تخزين الملخصات اليومية المولدة
- `watchlist_items`: أصول + ملاحظات المستخدم
- `smart_alert_rules`: قواعد التنبيهات الذكية (event_type, condition_json)
- `performance_journal`: سجل يومي تلقائي + ملاحظات يدوية
- `referrals`: تتبع الإحالات
- `subscriptions`: حالة الاشتراك (Stripe customer_id, status, period_end)

### Edge Functions جديدة
- `generate-daily-brief`: تجمع البيانات وتولد الملخص اليومي
- `process-smart-alerts`: تقيّم قواعد التنبيهات الذكية
- `stripe-webhook`: معالجة أحداث Stripe (subscription.created, payment_failed, etc.)
- `create-checkout`: إنشاء Stripe Checkout Session

### مكونات React جديدة
- `DailyBriefWidget.tsx`: عرض الملخص اليومي
- `WatchlistWidget.tsx`: قائمة المتابعة مع ملاحظات
- `CorrelationWidget.tsx`: مصفوفة الارتباط
- `JournalWidget.tsx`: السجل اليومي
- `TrialBanner.tsx`: شريط العد التنازلي (موجود بالفعل، يحتاج تحسين)
- `CheckoutPage.tsx`: صفحة الدفع
- `ThemeSwitcher.tsx`: محوّل الثيمات في Settings

### تعديلات على ملفات موجودة
- `src/config/site.ts`: إضافة ثيمات، تحديث PRICING، إضافة WIDGET_CONFIG_FIELDS للويدجتس الجديدة
- `src/hooks/usePlanLimits.ts`: إضافة فحص Trial
- `src/components/ProGate.tsx`: تحسين الرسائل حسب نوع الميزة
- `src/pages/Settings.tsx`: إضافة قسم الثيمات + إدارة الاشتراك
- `src/pages/Alerts.tsx`: دعم Smart Alerts الجديدة
- `src/services/dataService.ts`: إضافة CRUD للجداول الجديدة
- `src/components/widgets/widgetRegistry.ts`: تسجيل الويدجتس الجديدة
- `DEVELOPER_GUIDE.md`: توثيق كل شيء جديد
