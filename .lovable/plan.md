

# خطة تحسين استغلال الويدجتات و قوائم التحكم

## المشكلة الحالية

بعد تحليل الكود، وجدت عدة مشاكل جوهرية:

1. **حقول تحكم لا تعمل فعليا** -- العديد من configFields موجودة في الـ Registry لكن الويدجت لا يقرأها
2. **عدم تطابق أسماء الحقول** -- MultiTracker يعرّف `symbolsText` في Registry لكن يقرأ `symbols` في الكود
3. **بيانات API غير مستغلة** -- حقل `volume` متاح لكن أغلب الويدجتات تتجاهله
4. **خيارات وهمية** -- مثل `currency` في CryptoPrice (الـ API يجلب USD فقط)
5. **أنماط عرض غير منفذة** -- FearGreed يعرض خيار "Simple" لكنه لا يُنفّذ

---

## التحليل التفصيلي لكل ويدجت

### 1. CryptoPrice Widget
| الحقل | الحالة | المشكلة |
|-------|--------|---------|
| `symbol` | يعمل جزئيا | حقل نصي حر بدل قائمة منسدلة من العملات المتاحة |
| `currency` | لا يعمل | الـ API يجلب USD فقط - حقل وهمي |
| `showChart` | يعمل | -- |
| `showMarketCap` | يعمل | -- |
| **ينقصه** | -- | عرض Volume، عرض آخر تحديث، تغيير الفترة الزمنية |

### 2. MultiTracker Widget
| الحقل | الحالة | المشكلة |
|-------|--------|---------|
| `symbolsText` | لا يعمل | الكود يقرأ `symbols` (مصفوفة) بدل `symbolsText` (نص) |
| `maxItems` | لا يعمل | الكود لا يستخدمه |
| `showVolume` | لا يعمل | الكود لا يعرض Volume أبدا |
| **ينقصه** | -- | ترتيب حسب السعر/الحجم، إظهار Market Cap |

### 3. Fear & Greed Widget
| الحقل | الحالة | المشكلة |
|-------|--------|---------|
| `showAlert` | لا يعمل | لا يوجد أي تنبيه بصري عند القيم المتطرفة |
| `indicatorType` | لا يعمل | خيار "Simple" غير منفّذ - يعرض Gauge دائما |
| **ينقصه** | -- | عرض التصنيف النصي، عرض آخر تحديث |

### 4. Market Context Widget
| الحقل | الحالة | المشكلة |
|-------|--------|---------|
| `showVolume` | يعمل | -- |
| `showDominance` | يعمل | -- |
| **ينقصه** | -- | أعلى/أقل عملة أداءً، عدد العملات الصاعدة/الهابطة |

### 5. News Widget
| الحقل | الحالة | المشكلة |
|-------|--------|---------|
| `maxArticles` | يعمل | -- |
| `keyword` | يعمل | -- |
| `source` | يعمل | -- |
| **ينقصه** | -- | وضع العرض (مضغوط/بطاقات)، إظهار الملخص مباشرة |

---

## خطة التنفيذ

### المرحلة 1: إصلاح الحقول المعطلة

**MultiTrackerWidget.tsx:**
- قراءة `symbolsText` من config وتحويله لمصفوفة بـ `split(",")`
- تطبيق `maxItems` لتحديد عدد العملات المعروضة
- تنفيذ `showVolume` لعرض عمود Volume في كل صف

**FearGreedWidget.tsx:**
- تنفيذ `indicatorType: "simple"` كعرض بسيط (رقم + شريط ملوّن بدون gauge SVG)
- تنفيذ `showAlert` كتأثير بصري (وميض/حدود ملونة) عندما تكون القيمة اقل من 20 او اكثر من 80

**CryptoPriceWidget.tsx:**
- إزالة حقل `currency` الوهمي من Registry
- تحويل حقل `symbol` من نص حر الى `select` بقائمة العملات المتاحة (BTC, ETH, SOL, ADA, DOGE, XRP, DOT, AVAX, LINK, MATIC)

### المرحلة 2: إضافة حقول تحكم جديدة تعمل فعلا

**CryptoPrice -- حقول جديدة:**
- `showVolume` (toggle) -- عرض حجم التداول
- `showLastUpdate` (toggle) -- عرض وقت آخر تحديث

**MultiTracker -- حقول جديدة:**
- `sortBy` (select: price / change / market_cap / volume) -- ترتيب القائمة
- `showMarketCap` (toggle) -- عرض Market Cap لكل عملة

**Fear & Greed -- حقول جديدة:**
- `showTimestamp` (toggle) -- عرض وقت آخر تحديث

**Market Context -- حقول جديدة:**
- `showTopMover` (toggle) -- عرض أعلى عملة أداءً
- `showGainersLosers` (toggle) -- عدد العملات الصاعدة مقابل الهابطة

**News -- حقول جديدة:**
- `showSummary` (toggle) -- عرض ملخص المقال مباشرة في القائمة
- `layout` (select: list / cards) -- تبديل بين عرض قائمة وعرض بطاقات

### المرحلة 3: تحديث مكونات الويدجتات

كل ويدجت سيُحدَّث ليقرأ جميع حقول التحكم من `config` ويطبّقها فعليا على العرض.

---

## التفاصيل التقنية

### الملفات المتأثرة:

1. **`src/components/widgets/widgetRegistry.ts`** -- تحديث configFields لكل ويدجت
2. **`src/components/widgets/CryptoPriceWidget.tsx`** -- إزالة currency، إضافة volume/lastUpdate
3. **`src/components/widgets/MultiTrackerWidget.tsx`** -- إصلاح symbolsText، إضافة sort/volume/marketCap
4. **`src/components/widgets/FearGreedWidget.tsx`** -- تنفيذ simple mode و showAlert
5. **`src/components/widgets/MarketContextWidget.tsx`** -- إضافة topMover و gainers/losers
6. **`src/components/widgets/NewsWidget.tsx`** -- إضافة showSummary و layout cards
7. **`WIDGET_GUIDE.md`** -- تحديث التوثيق

### القاعدة الذهبية:
- كل حقل في `configFields` يجب أن يؤثر فعليا على العرض
- لا حقول وهمية أو decorative
- كل بيانات الـ API المتاحة يجب أن تكون قابلة للعرض عبر التحكم

