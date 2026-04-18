// Research paper content — bilingual
// Source: DecentralizingIntelligence.pdf by Zeyad Zahran (Apr 2026)

export const RESEARCH_EN = `# Decentralizing Intelligence

**By Zeyad Zahran — April 2026**
*Artificial Intelligence Research*

---

## 1. Introduction

### 1.1 The Paradigm Shift: From Cloud-Centric to Edge-Native AI

The modern computational landscape is witnessing an unprecedented expansion of Large Language Models (LLMs). However, the prevailing architectural paradigm remains heavily reliant on centralized cloud-based inference. This dependency introduces a critical "trilemma" involving **Data Sovereignty, Latency, and Economic Scalability**. Centralized models require the transmission of massive telemetry and sensitive user data across public networks, inherently creating security vulnerabilities and privacy non-compliance risks under frameworks such as GDPR and CCPA. There is an urgent academic and industrial need for **Edge-Native AI architectures** that can execute high-order cognitive tasks without external data exfiltration.

### 1.2 Technological Catalysts: WebGPU and Browser Runtimes

The introduction of WebAssembly (WASM) and, more recently, **WebGPU** has fundamentally altered the trajectory of browser computing. WebGPU provides a low-level, hardware-accelerated abstraction layer that allows for General-Purpose computing on Graphics Processing Units (GPGPU) directly within the browser sandbox. This enables the execution of complex tensor operations — the mathematical backbone of Transformers — with efficiency comparable to native environments.

### 1.3 The Challenge of Contextual Intelligence and Local RAG

Local inference solves the privacy problem but introduces **Contextual Relevance** as a new challenge. This research addresses this gap by implementing a **Localized Retrieval-Augmented Generation (RAG) Pipeline**. Unlike cloud-based RAG which utilizes remote vector databases, the proposed architecture executes the entire ingestion-to-retrieval cycle locally, supporting heterogeneous formats — PDF, TXT, MD, CSV, JSON.

### 1.4 Autonomous User Profiling and Adaptive Personalization

Current AI assistants suffer from a "Cold Start" problem, requiring repetitive prompting to understand user context. This paper introduces a mechanism where the local system autonomously distills key user attributes — such as professional identity, geographic location, and recurring interests — into a persistent, locally-stored Knowledge Base. This creates a **"Recursive Intelligence Loop"** where the assistant becomes more effective the more it is used, all while maintaining a Zero-Network communication profile.

### 1.5 Research Objectives

1. Systematize a blueprint for browser-native AI execution using WebGPU and 4-bit quantization.
2. Evaluate the performance of multi-format RAG pipelines in a resource-constrained sandbox environment.
3. Validate the efficacy of autonomous user profiling in enhancing response accuracy.
4. Establish benchmarks for inference speed and resource consumption across consumer-grade hardware.

---

## 2. Theoretical Foundations

### 2.1 Evolution of Web Runtimes

The transformation of the web browser from a document viewer to a sophisticated runtime environment is the primary enabler of decentralized AI. WebAssembly provided near-native CPU execution speed, while **WebGPU** enables parallelization of matrix multiplications — the core of the Transformer architecture — allowing billion-parameter models to run inside the browser sandbox.

### 2.2 Mathematical Foundations of Quantization

This research relies on **4-bit Quantization (q4/bnb4)** to compress model weights. Linear quantization is represented as:

\`Wq = Round(W / S + Z)\`

Where **W** = original weights, **S** = scale factor, **Z** = zero-point offset, **Wq** = 4-bit quantized weights.

- **Precision Reduction:** 0.5B parameter model reduced from ~2GB to ~300MB.
- **Operational Efficiency:** Efficient loading via the browser's Cache Storage API.
- **Adaptive Backend:** Falls back from WebGPU to WASM based on hardware availability.

### 2.3 Browser-Side Persistence and Sandbox Security

The system uses **IndexedDB** for structured persistence (conversations, memory, knowledge) and **localStorage** for application state. All user-generated content is stored within isolated browser storage — never transmitted across the network after initial model acquisition. The **Device Memory API** dynamically recommends model sizes (e.g., a 1.5B model for 8GB RAM devices) to prevent overflows.

---

## 3. Proposed System Architecture

### 3.1 The Multi-Threaded Execution Environment

A **Dual-Thread Model** keeps the UI responsive during heavy tensor work:

- **Main Thread:** UI rendering (React), state management, PDF text extraction (\`pdfjs-dist\`), all IndexedDB I/O.
- **Web Worker Thread:** Manages the LLM lifecycle — weight loading, ONNX runtime execution, token-by-token streaming.
- **Communication Protocol:** Asynchronous \`postMessage\` with unique request IDs for non-blocking concurrency.

### 3.2 Optimized Inference and Quantized Weight Management

The inference engine is built on **@huggingface/transformers** with the ONNX Runtime. The architecture supports \`q4\` and \`bnb4\` data types, reducing a 0.5B model from ~2GB to ~300MB. The system dynamically prioritizes WebGPU and falls back to WASM for universal compatibility.

### 3.3 Local Knowledge Integration (RAG)

- **Heterogeneous Ingestion:** PDF, TXT, MD, CSV, JSON.
- **PDF Extraction:** \`pdfjs-dist\` reads files as ArrayBuffer and extracts text page-by-page.
- **Context Window Optimization:** Injected context is capped at **3000 characters** to ensure stable generation on smaller models.

### 3.4 Autonomous Persistence and User Profiling

- **Heuristic Extraction:** Patterns like "My name is X" or "I work as X" are identified.
- **Storage Strategy:** Facts categorized as \`preference\`, \`info\`, or \`context\` and stored in IndexedDB.
- **Dynamic Injection:** Facts are prepended to the system prompt for every generation.

### 3.5 Data Residency and Security Framework

- **IndexedDB:** Structured storage of conversations, memory, knowledge base.
- **Cache Storage API:** Persists model weights after the initial one-time download from Hugging Face CDN.
- **Privacy Guard:** Same-origin isolation mitigates data exfiltration and server-side compromise.

---

## 4. Local RAG and Personalization

### 4.1 Heterogeneous Data Ingestion
Supports unstructured (PDF, TXT, MD) and structured data (CSV, JSON). Client-side PDF extraction via \`pdfjs-dist\`. Privacy-first indexing into a dedicated \`knowledgeBase\` IndexedDB store.

### 4.2 Semantic Context Injection
Truncation strategy caps context at 3000 chars. Retrieved text is prepended to the user query, providing the LLM with "temporary memory" grounded in local data.

### 4.3 The Persistence Engine
Memory-manager monitors interactions for identity claims, professional context, and personal preferences. Facts saved as \`UserMemoryEntry\` objects in IndexedDB and injected during each generation cycle — eliminating the "Cold Start" problem.

### 4.4 Zero-Network Data Lifecycle
All operations result in **zero network requests**. Users can export the entire local database to a JSON file or wipe it completely.

---

## 5. Performance Benchmarks

### 5.1 Testing Methodology
Benchmarks across three hardware tiers measuring TPS, memory consumption, and latency on Qwen2.5 (0.5B) and SmolLM2 (360M):

- **High-End:** NVIDIA RTX 40-series, 16GB RAM, WebGPU.
- **Mid-Range:** Intel Iris Xe / Apple M1, 8GB RAM, WebGPU.
- **Low-End:** Intel HD 620, 4GB RAM, WASM fallback.

### 5.2 Inference Speed (Tokens Per Second)

| Hardware Tier | Backend | Qwen2.5 (0.5B) | SmolLM2 (360M) |
|---|---|---|---|
| **High-End** | WebGPU | 55–65 TPS | 85–100 TPS |
| **Mid-Range** | WebGPU | 22–30 TPS | 40–50 TPS |
| **Low-End** | WASM | 5–8 TPS | 12–18 TPS |

Even Low-End devices exceed average human reading speed (~4–5 TPS), validating the **"Minimum Viable Intelligence"** for constrained devices.

### 5.3 Memory Footprint

| Model | Precision | Size on Disk | Active RAM |
|---|---|---|---|
| Qwen2.5 (0.5B) | FP32 | ~1.9 GB | ~2.4 GB |
| Qwen2.5 (0.5B) | **4-bit** | **~350 MB** | **~600–800 MB** |

4-bit quantization reduces memory footprint by ~85%, enabling stable execution on 4GB RAM devices.

---

## 6. Challenges and Future Work

### 6.1 Hardware Constraints
- **Memory Sandboxing:** Browsers cap tabs, restricting deployment to <2B parameter models.
- **GPU API Fragmentation:** WebGPU adoption isn't universal yet.
- **RAM Reporting Inaccuracy:** Device Memory API uses coarsened values for privacy.

### 6.2 Algorithmic Challenges
- **Context Window Limits:** Smaller models offer 2K–4K token windows.
- **Keyword vs. Semantic Search:** Current architecture uses direct text injection, not full vector retrieval.

### 6.3 Future Directions
1. **Vector Databases:** Client-side stores like Orama or Voy for true semantic retrieval.
2. **WebNN API:** Next-generation browser ML standard for higher acceleration.
3. **In-Browser Fine-Tuning:** LoRA adaptation within the browser.
4. **Multi-Modal Expansion:** Native image and audio processing.

---

## 7. Conclusion

This research demonstrates that the modern web browser is now a viable environment for hosting high-performance LLMs:

1. **Privacy and Performance are not Mutually Exclusive** — WebGPU + 4-bit quantization deliver inference speeds beyond human reading rates with a Zero-Network profile.
2. **Local Data Empowerment** — Client-side RAG and Autonomous User Profiling enable deeply personalized AI that respects data sovereignty.
3. **Hardware Inclusivity** — Smart GPU/CPU workload distribution makes decentralized intelligence accessible across consumer hardware.

This study provides a foundational blueprint for the next generation of **Privacy-by-Design** applications.

---

## References

- WebGPU Specification — W3C (2024). https://www.w3.org/TR/webgpu/
- ONNX Runtime Web — Microsoft (2024).
- Transformers.js Documentation — Hugging Face (2024).
- Qwen2.5 Technical Report — Alibaba DAMO Academy (2024).
- Device Memory API — W3C (2023).
- IndexedDB API — W3C (2024).
- Vaswani, A., et al. (2017). *Attention Is All You Need*. NeurIPS.
- Lewis, P., et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. Facebook AI Research.

---

**Author:** Zeyad Zahran
**LinkedIn:** [zeyad-zahran-733901325](https://www.linkedin.com/in/zeyad-zahran-733901325)
`;

export const RESEARCH_AR = `# لا مركزية الذكاء الاصطناعي

**بقلم: زياد زهران — أبريل 2026**
*بحث في الذكاء الاصطناعي*

---

## 1. مقدمة

### 1.1 تحول النموذج: من الذكاء السحابي إلى الذكاء على الحافة

يشهد العالم توسعاً غير مسبوق في نماذج اللغة الكبيرة (LLMs)، لكن النموذج المعماري السائد لا يزال يعتمد بشكل كبير على الاستدلال السحابي المركزي. هذا الاعتماد يفرض **معضلة ثلاثية**: السيادة على البيانات، زمن الاستجابة، والقابلية الاقتصادية للتوسع. النماذج المركزية تتطلب نقل بيانات حساسة عبر شبكات عامة مما ينشئ ثغرات أمنية ومخاطر عدم امتثال لقوانين GDPR و CCPA. لذا توجد حاجة عاجلة إلى **معماريات ذكاء على الحافة** قادرة على تنفيذ المهام المعرفية دون إخراج البيانات خارج جهاز المستخدم.

### 1.2 المحفزات التقنية: WebGPU وبيئات تشغيل المتصفح

أحدث ظهور WebAssembly ومؤخراً **WebGPU** تحولاً جذرياً في مسار الحوسبة عبر المتصفح. يوفر WebGPU طبقة تجريد منخفضة المستوى ومسرّعة بالعتاد تتيح الحوسبة العامة على وحدات معالجة الرسوميات (GPGPU) داخل صندوق الحماية الخاص بالمتصفح، مما يسمح بتنفيذ عمليات Tensor المعقدة بكفاءة تقارب البيئات الأصلية.

### 1.3 تحدي الذكاء السياقي و RAG المحلي

يحل الاستدلال المحلي مشكلة الخصوصية لكنه يطرح تحدياً جديداً هو **الصلة السياقية**. يعالج هذا البحث الفجوة عبر تنفيذ **خط أنابيب توليد معزز بالاسترجاع محلياً (RAG)**. على عكس RAG السحابي، تنفذ المعمارية المقترحة دورة الإدخال والاسترجاع كاملةً محلياً، وتدعم صيغاً متعددة: PDF, TXT, MD, CSV, JSON.

### 1.4 التحليل الذاتي للمستخدم والتخصيص التكيفي

تعاني المساعدات الذكية الحالية من مشكلة **"البداية الباردة"**. يقدم هذا البحث آلية يقوم فيها النظام المحلي تلقائياً باستخلاص سمات المستخدم — كالهوية المهنية والموقع والاهتمامات المتكررة — وتخزينها في قاعدة معرفة محلية دائمة. هذا ينشئ **"حلقة ذكاء تكرارية"** يصبح فيها المساعد أكثر فاعلية كلما زاد الاستخدام، مع الحفاظ على ملف اتصال صفر-شبكي.

### 1.5 أهداف البحث

1. وضع مخطط منهجي لتنفيذ الذكاء الاصطناعي عبر المتصفح باستخدام WebGPU والتكميم 4-بت.
2. تقييم أداء خطوط أنابيب RAG متعددة الصيغ في بيئة محدودة الموارد.
3. التحقق من فعالية التحليل الذاتي للمستخدم في تحسين دقة الاستجابة.
4. وضع معايير مرجعية لسرعة الاستدلال واستهلاك الموارد عبر الأجهزة الاستهلاكية.

---

## 2. الأسس النظرية

### 2.1 تطور بيئات تشغيل الويب

تحول المتصفح من عارض مستندات إلى بيئة تشغيل متطورة هو المحفز الأساسي للذكاء اللامركزي. وفر WebAssembly سرعة تنفيذ قريبة من الأصلية، بينما يتيح **WebGPU** موازاة عمليات ضرب المصفوفات — جوهر معمارية Transformer — مما يسمح بتشغيل نماذج بمليارات المعاملات داخل صندوق الحماية.

### 2.2 الأسس الرياضية للتكميم

يعتمد البحث على **التكميم 4-بت (q4/bnb4)** لضغط أوزان النموذج. التكميم الخطي يُمثَّل بالمعادلة:

\`Wq = Round(W / S + Z)\`

حيث **W** = الأوزان الأصلية، **S** = معامل القياس، **Z** = نقطة الصفر، **Wq** = الأوزان المكممة.

- **خفض الدقة:** نموذج 0.5B يُختزل من ~2GB إلى ~300MB.
- **كفاءة التشغيل:** تحميل سريع عبر Cache Storage API.
- **خلفية تكيفية:** تحويل تلقائي من WebGPU إلى WASM حسب توفر العتاد.

### 2.3 التخزين والأمان داخل المتصفح

يستخدم النظام **IndexedDB** للتخزين المنظم (محادثات، ذاكرة، معرفة) و **localStorage** لحالة التطبيق. كل المحتوى المُولَّد يُخزَّن داخل صندوق حماية معزول — ولا يُنقل عبر الشبكة بعد التحميل الأولي للنموذج. تستخدم **Device Memory API** للتوصية ديناميكياً بأحجام النماذج (مثلاً نموذج 1.5B لأجهزة 8GB RAM) لتجنب تجاوز الذاكرة.

---

## 3. معمارية النظام المقترحة

### 3.1 بيئة التنفيذ متعددة الخيوط

**نموذج خيطين** للحفاظ على استجابة الواجهة أثناء عمليات Tensor الثقيلة:

- **الخيط الرئيسي:** عرض الواجهة (React)، إدارة الحالة، استخراج نص PDF (\`pdfjs-dist\`)، عمليات IndexedDB.
- **خيط Web Worker:** إدارة دورة حياة LLM — تحميل الأوزان، تشغيل ONNX، البث رمزاً برمز.
- **بروتوكول الاتصال:** \`postMessage\` غير متزامن مع معرّفات فريدة للتنفيذ المتزامن غير المعطِّل.

### 3.2 الاستدلال الأمثل وإدارة الأوزان المكممة

محرك الاستدلال مبني على **@huggingface/transformers** مع ONNX Runtime. يدعم النظام أنواع البيانات \`q4\` و \`bnb4\`، ويختزل نموذج 0.5B من ~2GB إلى ~300MB. يعطي النظام أولوية لـ WebGPU ويتراجع إلى WASM للتوافق العالمي.

### 3.3 تكامل المعرفة المحلية (RAG)

- **استيعاب متعدد الصيغ:** PDF, TXT, MD, CSV, JSON.
- **استخراج PDF:** \`pdfjs-dist\` يقرأ الملفات كـ ArrayBuffer ويستخرج النص صفحةً بصفحة.
- **تحسين نافذة السياق:** السياق المحقون محدود بـ **3000 حرف** لضمان استقرار التوليد على النماذج الصغيرة.

### 3.4 المثابرة الذاتية وتحليل المستخدم

- **استخراج استدلالي:** أنماط مثل "اسمي X" أو "أعمل X" يتم تحديدها.
- **استراتيجية التخزين:** الحقائق مصنفة كـ \`preference\` أو \`info\` أو \`context\` وتُخزَّن في IndexedDB.
- **الحقن الديناميكي:** الحقائق تُضاف إلى تعليمات النظام في كل توليد.

### 3.5 إقامة البيانات وإطار الأمان

- **IndexedDB:** تخزين منظم للمحادثات والذاكرة وقاعدة المعرفة.
- **Cache Storage API:** يحفظ أوزان النموذج بعد التحميل الأولي من Hugging Face CDN.
- **حارس الخصوصية:** عزل Same-Origin يحمي من تسريب البيانات.

---

## 4. RAG المحلي والتخصيص

### 4.1 استيعاب البيانات متعدد الصيغ
يدعم البيانات غير المنظمة (PDF, TXT, MD) والمنظمة (CSV, JSON). الاستخراج يتم على جهاز العميل عبر \`pdfjs-dist\`. الفهرسة تتم في مخزن \`knowledgeBase\` ضمن IndexedDB.

### 4.2 حقن السياق الدلالي
استراتيجية اقتطاع تحد السياق بـ 3000 حرف. النص المسترجَع يُضاف إلى استفسار المستخدم، مما يمنح النموذج "ذاكرة مؤقتة" مرتكزة على بيانات المستخدم.

### 4.3 محرك المثابرة
مدير الذاكرة يراقب التفاعلات بحثاً عن ادعاءات الهوية والسياق المهني والتفضيلات. الحقائق تُحفَظ في IndexedDB وتُحقَن في كل دورة توليد — مما يُلغي مشكلة "البداية الباردة".

### 4.4 دورة حياة البيانات صفر-شبكية
كل العمليات تنتج **صفر طلبات شبكة**. يمكن للمستخدمين تصدير قاعدة البيانات المحلية كاملة إلى JSON أو محوها بالكامل.

---

## 5. معايير الأداء

### 5.1 منهجية الاختبار
معايير عبر ثلاث فئات عتاد لقياس TPS واستهلاك الذاكرة وزمن البدء على Qwen2.5 (0.5B) و SmolLM2 (360M):

- **عالي الأداء:** NVIDIA RTX سلسلة 40، 16GB RAM، WebGPU.
- **متوسط:** Intel Iris Xe / Apple M1، 8GB RAM، WebGPU.
- **منخفض:** Intel HD 620، 4GB RAM، WASM.

### 5.2 سرعة الاستدلال (رمز/ثانية)

| فئة العتاد | الخلفية | Qwen2.5 (0.5B) | SmolLM2 (360M) |
|---|---|---|---|
| **عالي** | WebGPU | 55–65 TPS | 85–100 TPS |
| **متوسط** | WebGPU | 22–30 TPS | 40–50 TPS |
| **منخفض** | WASM | 5–8 TPS | 12–18 TPS |

حتى الأجهزة المنخفضة تتجاوز سرعة القراءة البشرية (~4–5 TPS)، مما يثبت **"الحد الأدنى للذكاء القابل للاستخدام"** على الأجهزة المحدودة.

### 5.3 بصمة الذاكرة

| النموذج | الدقة | الحجم على القرص | RAM النشط |
|---|---|---|---|
| Qwen2.5 (0.5B) | FP32 | ~1.9 GB | ~2.4 GB |
| Qwen2.5 (0.5B) | **4-بت** | **~350 MB** | **~600–800 MB** |

التكميم 4-بت يخفض بصمة الذاكرة بنحو 85%، مما يتيح التشغيل المستقر على أجهزة 4GB RAM.

---

## 6. التحديات والعمل المستقبلي

### 6.1 قيود العتاد
- **عزل الذاكرة:** المتصفحات تحدد سعة كل تبويب، مما يقيد النشر بنماذج أقل من 2B معامل.
- **تجزؤ واجهات GPU:** اعتماد WebGPU ليس عالمياً بعد.
- **عدم دقة الإبلاغ عن RAM:** Device Memory API يستخدم قيماً خشنة لحماية الخصوصية.

### 6.2 التحديات الخوارزمية
- **حدود نافذة السياق:** النماذج الصغيرة تقدم 2K–4K رمزاً.
- **بحث الكلمات مقابل الدلالي:** المعمارية الحالية تستخدم حقن نص مباشر، لا استرجاع متجهي كامل.

### 6.3 الاتجاهات المستقبلية
1. **قواعد البيانات المتجهية:** مخازن على جانب العميل مثل Orama أو Voy.
2. **WebNN API:** المعيار التالي لتعلم الآلة في المتصفح.
3. **الضبط الدقيق داخل المتصفح:** تكييف LoRA في المتصفح.
4. **التوسع متعدد الوسائط:** معالجة أصلية للصور والصوت.

---

## 7. الخاتمة

يثبت هذا البحث أن المتصفح الحديث أصبح بيئة قابلة للتطبيق لاستضافة LLMs عالية الأداء:

1. **الخصوصية والأداء ليسا متعارضين** — WebGPU + التكميم 4-بت يقدمان سرعات استدلال تفوق سرعة القراءة البشرية مع ملف صفر-شبكي.
2. **تمكين البيانات المحلية** — RAG على جانب العميل والتحليل الذاتي للمستخدم يتيحان ذكاءً اصطناعياً مخصصاً يحترم سيادة البيانات.
3. **شمولية العتاد** — التوزيع الذكي للأحمال بين GPU و CPU يجعل الذكاء اللامركزي متاحاً عبر طيف واسع من العتاد.

يقدم هذا البحث مخططاً تأسيسياً للجيل القادم من تطبيقات **الخصوصية بالتصميم**.

---

## المراجع

- WebGPU Specification — W3C (2024). https://www.w3.org/TR/webgpu/
- ONNX Runtime Web — Microsoft (2024).
- Transformers.js Documentation — Hugging Face (2024).
- Qwen2.5 Technical Report — Alibaba DAMO Academy (2024).
- Device Memory API — W3C (2023).
- IndexedDB API — W3C (2024).
- Vaswani, A., et al. (2017). *Attention Is All You Need*. NeurIPS.
- Lewis, P., et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. Facebook AI Research.

---

**المؤلف:** زياد زهران
**LinkedIn:** [zeyad-zahran-733901325](https://www.linkedin.com/in/zeyad-zahran-733901325)
`;
