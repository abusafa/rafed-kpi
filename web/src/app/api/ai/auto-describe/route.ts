import { NextRequest, NextResponse } from "next/server";
import { aiDisabledResponse, isAiEnabled } from "../_mock-stream";

const KEYWORD_DESCRIPTIONS: Array<{
  keywords: string[];
  description: string;
  descriptionAr: string;
}> = [
  {
    keywords: ["satisfaction", "csat", "nps", "customer", "client"],
    description:
      "Measures the level of customer satisfaction with products and services, typically collected through post-interaction surveys on a 1–5 or 1–10 scale.",
    descriptionAr:
      "يقيس مستوى رضا العملاء عن المنتجات والخدمات، ويُجمع عادةً عبر استبيانات ما بعد التفاعل على مقياس من 1 إلى 5 أو 1 إلى 10.",
  },
  {
    keywords: ["revenue", "income", "sales", "profit", "turnover"],
    description:
      "Tracks total revenue generated within a defined period. Used to monitor financial performance and growth trends against set targets.",
    descriptionAr:
      "يتتبع إجمالي الإيرادات المحققة خلال فترة محددة، ويُستخدم لمراقبة الأداء المالي واتجاهات النمو مقارنةً بالأهداف المحددة.",
  },
  {
    keywords: ["retention", "turnover", "attrition", "employee", "staff", "hr", "talent"],
    description:
      "Measures the percentage of employees who remain with the organization over a defined period, reflecting the effectiveness of talent retention strategies.",
    descriptionAr:
      "يقيس نسبة الموظفين الذين يبقون في المنظمة خلال فترة محددة، مما يعكس فعالية استراتيجيات الاحتفاظ بالمواهب.",
  },
  {
    keywords: ["compliance", "regulatory", "audit", "policy", "governance"],
    description:
      "Measures adherence to regulatory requirements, internal policies, and governance standards within a specified timeframe.",
    descriptionAr:
      "يقيس مدى الالتزام بالمتطلبات التنظيمية والسياسات الداخلية ومعايير الحوكمة خلال إطار زمني محدد.",
  },
  {
    keywords: ["cost", "efficiency", "expense", "budget", "spend"],
    description:
      "Tracks the cost efficiency ratio by comparing actual expenditure against planned budget, highlighting areas of over or under spending.",
    descriptionAr:
      "يتتبع نسبة كفاءة التكلفة بمقارنة الإنفاق الفعلي بالميزانية المخططة، ويُبرز مجالات الإنفاق الزائد أو المنخفض.",
  },
  {
    keywords: ["quality", "defect", "error", "accuracy", "precision"],
    description:
      "Tracks quality performance by measuring the rate of defects, errors, or non-conformances against total output or transactions.",
    descriptionAr:
      "يتتبع أداء الجودة بقياس معدل العيوب والأخطاء وعدم المطابقة مقارنةً بإجمالي المخرجات أو المعاملات.",
  },
  {
    keywords: ["time", "cycle", "speed", "turnaround", "response", "sla", "delivery"],
    description:
      "Measures the average time taken to complete a process or fulfill a request, from initiation to completion or delivery.",
    descriptionAr:
      "يقيس متوسط الوقت المستغرق لإكمال عملية أو تنفيذ طلب، من بدء العملية إلى إنجازها أو تسليمها.",
  },
  {
    keywords: ["training", "learning", "development", "skill", "education"],
    description:
      "Measures the extent to which employees participate in learning and development programs, tracking hours, completion rates, or certification achievements.",
    descriptionAr:
      "يقيس مدى مشاركة الموظفين في برامج التعلم والتطوير، ويتتبع الساعات ومعدلات الإكمال وإنجازات الشهادات.",
  },
  {
    keywords: ["market", "share", "penetration", "growth", "acquisition"],
    description:
      "Tracks the organization's market position by measuring growth in market share, new customer acquisition, or expansion into new market segments.",
    descriptionAr:
      "يتتبع موقع المنظمة في السوق بقياس نمو الحصة السوقية وكسب عملاء جدد أو التوسع في قطاعات سوقية جديدة.",
  },
];

const DEFAULT = {
  description:
    "Tracks and measures performance against a defined target for this strategic area, providing visibility into progress and enabling data-driven decision making.",
  descriptionAr:
    "يتتبع ويقيس الأداء مقابل هدف محدد لهذا المجال الاستراتيجي، مما يوفر رؤية واضحة للتقدم المحرز ويُمكّن اتخاذ القرارات المبنية على البيانات.",
};

export async function POST(req: NextRequest) {
  if (!isAiEnabled()) return aiDisabledResponse();

  const { title } = (await req.json()) as { title?: string };
  if (!title?.trim()) {
    return NextResponse.json(DEFAULT);
  }

  const lower = title.toLowerCase();
  const match = KEYWORD_DESCRIPTIONS.find((item) =>
    item.keywords.some((kw) => lower.includes(kw)),
  );

  const result = match ?? DEFAULT;

  return NextResponse.json({
    description: result.description,
    descriptionAr: result.descriptionAr,
  });
}
