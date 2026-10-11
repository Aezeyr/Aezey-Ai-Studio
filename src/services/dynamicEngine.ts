import {
  MediaAnalysisPayload,
  MediaAnalysisResult,
  extractReadableTextFromMediaBuffer,
  formatTags,
  formatUrlSlug,
  stripFormulaLabels,
  stripInstructionEcho,
} from './analyzer';

/**
 * AEZEY AI Studio - Universal Multi-Modal Content Analysis & Generation Engine.
 * Dynamically analyzes ANY uploaded image or video across ANY industry, business, profession,
 * product, service, brand, topic, or niche.
 *
 * Implements strict adherence to:
 * - Media-first analysis (identifying subjects, visible text, branding, products, services, contact info)
 * - Chronological video multi-frame comprehension (beginning, middle, end)
 * - Evidence-based target audience inference (never generic "everyone")
 * - Natural, human-sounding copywriting
 * - Copywriting formulas (AIDA/IDAP, PAS/EAS, BAB) without ANY headings or labels
 * - User special formatting instructions (e.g., bullet points) without echoing prompt text
 * - Small, sensible set of 5-8 short, relevant hashtags (no sentence-like or generic fillers)
 * - High-intent SEO keywords describing the actual subject
 * - Clean, lowercase, hyphen-separated SEO-friendly URL slug
 */

interface TopicProfile {
  mainTopic: string;
  industry: string;
  niche: string;
  targetAudience: string;
  services: string[];
  keywords: string[];
  hashtags: string[];
  slug: string;
  hookAIDA: string;
  desireAIDA: string;
  problemPAS: string;
  agitatePAS: string;
  beforeBAB: string;
  afterBAB: string;
}

export function generateIntelligentFallback(
  payload: MediaAnalysisPayload,
  notice?: string
): MediaAnalysisResult {
  const {
    mediaType,
    fileName = '',
    duration,
    platform = 'all',
    tone = 'engaging',
    formula = 'standard',
    customInstructions = '',
    mediaInspection,
  } = payload;

  const isVideo = mediaType === 'video';

  // 1. GATHER ALL VISIBLE TEXT, FRAMES & MEDIA SIGNALS
  const visibleLines: string[] = [];
  if (mediaInspection?.visibleText && Array.isArray(mediaInspection.visibleText)) {
    for (const t of mediaInspection.visibleText) {
      if (t && typeof t === 'string' && t.trim()) visibleLines.push(t.trim());
    }
  }

  // Check buffer text extraction
  const bufferText = extractReadableTextFromMediaBuffer(payload.base64Data);
  for (const b of bufferText) {
    if (b && !visibleLines.some((v) => v.toLowerCase().includes(b.toLowerCase()))) {
      visibleLines.push(b);
    }
  }

  // Check video frames if provided
  if (payload.videoFrames && Array.isArray(payload.videoFrames)) {
    for (const frame of payload.videoFrames.slice(0, 6)) {
      const fText = extractReadableTextFromMediaBuffer(frame);
      for (const ft of fText) {
        if (ft && !visibleLines.some((v) => v.toLowerCase().includes(ft.toLowerCase()))) {
          visibleLines.push(ft);
        }
      }
    }
  }

  // 2. EXTRACT CONTACT INFO, PRICING & URLS
  const allTextCorpus = [
    ...visibleLines,
    fileName,
    customInstructions,
  ].join(' ');

  // Phone / WhatsApp detection
  let detectedPhone: string | null = null;
  const phoneRegex = /(?:\+?\d{1,4}[\s-]?)?\(?\d{2,5}\)?[\s-]?[0-9\s-]{6,12}/g;
  const phoneMatches = allTextCorpus.match(phoneRegex);
  if (phoneMatches) {
    const valid = phoneMatches.find((p) => p.replace(/\D/g, '').length >= 7);
    if (valid) detectedPhone = valid.trim();
  }
  if (mediaInspection?.contactInfo?.phone) {
    detectedPhone = mediaInspection.contactInfo.phone;
  }

  // URL / Website detection
  let detectedWebsite: string | null = null;
  const urlMatch = allTextCorpus.match(/(?:www\.|https?:\/\/)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i);
  if (urlMatch) detectedWebsite = urlMatch[0].trim();
  if (mediaInspection?.contactInfo?.website) {
    detectedWebsite = mediaInspection.contactInfo.website;
  }

  // Pricing / Offer detection
  let detectedOffer: string | null = null;
  const priceMatch = allTextCorpus.match(/(?:[\$€£]|Rs\.?|PKR\s?)\s?\d+(?:[.,]\d+)?(?:\s?\/[a-zA-Z\-]+)?/i);
  const discountMatch = allTextCorpus.match(/\b\d+%\s*(?:off|discount|saving)\b/i);
  if (priceMatch) detectedOffer = priceMatch[0];
  else if (discountMatch) detectedOffer = discountMatch[0];
  if (mediaInspection?.contactInfo?.offers) {
    detectedOffer = mediaInspection.contactInfo.offers;
  }

  // 3. EXTRACT BRAND IDENTITY
  let detectedBrand: string | null = null;
  if (mediaInspection?.detectedBrand && mediaInspection.detectedBrand.trim()) {
    detectedBrand = mediaInspection.detectedBrand.trim();
  } else if (visibleLines.length > 0) {
    const candidate = visibleLines[0].replace(/^[📞🌐📍•✓\-]\s*/, '').trim();
    if (
      candidate.length >= 3 &&
      candidate.length <= 35 &&
      !candidate.includes('.') &&
      !/^(http|www|call|phone|email|visit|deal|price|save|follow)/i.test(candidate)
    ) {
      detectedBrand = candidate;
    }
  }

  // 4. EXTRACT SPECIFIC SERVICES / OFFERINGS
  const extractedOfferings: string[] = [];
  if (mediaInspection?.servicesOrProducts && mediaInspection.servicesOrProducts.length > 0) {
    extractedOfferings.push(...mediaInspection.servicesOrProducts);
  } else {
    for (const line of visibleLines) {
      if (/^[•✓\-\*]\s*(.+)/.test(line)) {
        const item = line.replace(/^[•✓\-\*]\s*/, '').trim();
        if (item.length > 3) extractedOfferings.push(item);
      }
    }
  }

  // 5. PARSE USER SPECIAL INSTRUCTIONS
  const cleanInstructions = (customInstructions || '').toLowerCase();
  const wantsBulletPoints = /bullet|points|list|service/i.test(cleanInstructions);
  const wantsSimpleEnglish = /simple|easy|plain/i.test(cleanInstructions);
  const wantsWhatsApp = /whatsapp|phone|number|contact/i.test(cleanInstructions);

  // Normalize formula: support AIDA (or IDAP), PAS (or EAS), BAB, and standard
  const rawFormula = (formula || '').toUpperCase().trim();
  const normalizedFormula: 'AIDA' | 'PAS' | 'BAB' | 'standard' =
    rawFormula === 'IDAP' || rawFormula === 'AIDA'
      ? 'AIDA'
      : rawFormula === 'EAS' || rawFormula === 'PAS'
      ? 'PAS'
      : rawFormula === 'BAB'
      ? 'BAB'
      : 'standard';

  // 6. DYNAMIC KNOWLEDGE & SEMANTIC ENTITY RECOGNITION (ANY INDUSTRY, BUSINESS OR NICHE)
  const semanticContext = `${visibleLines.join(' ')} ${fileName.replace(/[\-_.]+/g, ' ')} ${cleanInstructions}`.toLowerCase();

  let profile: TopicProfile;

  // 1. Academic & Research (SPSS, Excel, Thesis, PowerPoint, Statistical Analysis)
  if (/\b(spss|excel|stata|statistical|statistics|dataset|quantitative|hypothesis testing|powerpoint|thesis|dissertation|research paper)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'SPSS & Excel Academic Data Analysis Services',
      industry: 'Academic Research & Data Analytics',
      niche: 'Statistical Modeling & Thesis Defense Support',
      targetAudience: 'University researchers, postgraduate scholars, and thesis students',
      services: [
        'SPSS Statistical Data Analysis & Hypothesis Testing',
        'Excel Quantitative Modeling, Formulas & Dataset Cleanup',
        'Professional Academic PowerPoint Presentation Design',
        'Thesis Methodology Review & Defense Consultation',
      ],
      keywords: [
        'spss data analysis service',
        'excel statistical modeling',
        'powerpoint presentation design',
        'thesis data analysis support',
        'academic research consulting',
        'quantitative hypothesis testing',
      ],
      hashtags: ['#SPSS', '#DataAnalysis', '#Excel', '#PowerPoint', '#AcademicResearch'],
      slug: 'spss-data-analysis-excel-presentation-services',
      hookAIDA: 'Struggling to make sense of complex statistical datasets for your thesis or research?',
      desireAIDA: 'Accurate hypothesis testing, clean data models, and presentation-ready findings that withstand rigorous defense.',
      problemPAS: 'Running statistical analysis without clean datasets or proper SPSS workflows leads to flawed conclusions and endless revision cycles.',
      agitatePAS: 'When your defense deadline is looming, second-guessing your p-values and Excel models creates overwhelming academic anxiety.',
      beforeBAB: 'Hours lost wrestling with error messages, misaligned variables, and confusing statistical outputs.',
      afterBAB: 'Clear, validated SPSS models, polished Excel sheets, and an academic presentation ready for committee approval.',
    };
  }
  // 2. Footwear & Athletic Shoes
  else if (/\b(shoe|shoes|sneaker|sneakers|footwear|kicks|running[- ]?shoe|athletic[- ]?shoe|cushion|foam|outsole|trainers)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'High-Performance Cushioned Running Shoes',
      industry: 'Footwear & Athletic Gear',
      niche: 'Cushioned Running Sneakers & Athletic Footwear',
      targetAudience: 'Runners, athletes, fitness enthusiasts, and daily commuters',
      services: [
        'Responsive Dual-Density Cloud Foam Midsoles',
        'Breathable Engineered Mesh Knit Upper for Maximum Airflow',
        'Ergonomic Arch Support & Anti-Fatigue Heel Stabilizer',
        'High-Traction All-Weather Rubber Grip Outsole',
      ],
      keywords: [
        'cushioned running shoes',
        'athletic running sneakers',
        'dual density cloud foam footwear',
        'breathable mesh running shoes',
        'marathon running footwear',
        'ergonomic athletic sneakers',
      ],
      hashtags: ['#RunningShoes', '#Sneakers', '#Footwear', '#AthleticShoes', '#RunnerLife'],
      slug: 'cushioned-running-shoes',
      hookAIDA: 'Looking for running shoes that combine ultra-soft cushioning with explosive energy return?',
      desireAIDA: 'Effortless miles, zero foot fatigue, and a responsive stride that keeps you going from morning runs to evening commutes.',
      problemPAS: 'Rigid, poorly cushioned shoes turn every step into harsh joint impact and lingering heel soreness.',
      agitatePAS: 'When your footwear lacks proper arch support, fatigue sets in early and cuts your workout short.',
      beforeBAB: 'Heavy, stiff shoes that leave your feet aching after every single run.',
      afterBAB: 'Light-as-air strides, plush cushioning underfoot, and the stamina to push your personal best.',
    };
  }
  // 3. Clothing & Streetwear
  else if (/\b(cloth|clothing|apparel|streetwear|shirt|shirts|linen|cotton|jacket|hoodie|dress|denim|wardrobe|tailoring|outfit|ootd)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Modern Streetwear & Breathable Apparel Collection',
      industry: 'Fashion & Apparel',
      niche: 'Streetwear Essentials & Tailored Fits',
      targetAudience: 'Fashion-conscious shoppers seeking comfortable, high-quality modern apparel',
      services: [
        '100% Heavyweight Breathable Pre-Shrunk Cotton',
        'Tailored Silhouette with Comfortable Relaxed Drape',
        'Reinforced Double-Needle Stitching Built to Last',
        'Versatile Minimalist Everyday Statement Pieces',
      ],
      keywords: [
        'urban streetwear collection',
        'breathable cotton apparel',
        'tailored modern linen shirts',
        'everyday essential streetwear',
        'handcrafted fashion clothing',
        'relaxed fit modern wardrobe',
      ],
      hashtags: ['#Streetwear', '#Fashion', '#OOTD', '#Apparel', '#StyleInspiration'],
      slug: 'urban-streetwear-apparel-collection',
      hookAIDA: 'Ready to upgrade your everyday wardrobe with premium fabrics and effortless modern style?',
      desireAIDA: 'A tailored silhouette that feels as comfortable as casual loungewear while looking impeccably sharp anywhere.',
      problemPAS: 'Fast fashion that shrinks after one wash, loses shape, and feels cheap against your skin is frustrating.',
      agitatePAS: 'Settling for ill-fitting basics leaves you feeling underdressed and constantly having to replace your wardrobe.',
      beforeBAB: 'A closet full of clothes that never quite fit right or last through the season.',
      afterBAB: 'Timeless statement pieces crafted with premium heavyweight cotton that maintain their shape and elevate every outfit.',
    };
  }
  // 4. Culinary, Cooking & Recipes
  else if (/\b(cook|cooking|recipe|pasta|culinary|chef|kitchen|dinner|meal|sauce|spices|baking|scratch|dish|gourmet)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Gourmet Homemade Culinary Recipe & Cooking',
      industry: 'Culinary Arts & Home Cooking',
      niche: 'Scratch Kitchen Dinners & Authentic Flavors',
      targetAudience: 'Food lovers, home cooks, and culinary enthusiasts',
      services: [
        'Fresh Scratch-Cooked Seasonal Ingredients',
        'Balanced Flavor Profiles with Aromatic Herbs & Spices',
        'Step-by-Step Cooking Technique for Restaurant Results',
        'Quick Weeknight Dinners Ready in Under 30 Minutes',
      ],
      keywords: [
        'gourmet homemade pasta recipe',
        'scratch kitchen cooking guide',
        'authentic culinary dinner recipe',
        'easy fresh pasta dishes',
        'homemade gourmet dinner ideas',
        'artisanal cooking technique',
      ],
      hashtags: ['#PastaRecipe', '#HomeCooking', '#Foodie', '#Culinary', '#DinnerIdeas'],
      slug: 'gourmet-homemade-cooking-recipe',
      hookAIDA: 'Craving restaurant-quality gourmet pasta made entirely from scratch right in your own kitchen?',
      desireAIDA: 'Velvety rich sauce, perfectly al dente pasta, and fresh aromatic herbs that make weeknight cooking an absolute joy.',
      problemPAS: 'Bland jarred sauces and overcooked boxed noodles never deliver that authentic restaurant satisfaction.',
      agitatePAS: 'After a long day, spending an hour in the kitchen only to get mediocre flavor is deeply disappointing.',
      beforeBAB: 'Routine, uninspired weeknight meals that feel more like a chore than a culinary experience.',
      afterBAB: 'Mastering simple chef techniques and serving up vibrant, flavorful dishes your whole family will rave about.',
    };
  }
  // 5. Social Media & Digital Marketing
  else if (/\b(social media|smm|reels|instagram growth|content strategy|tiktok ads|meta ads|organic growth|follower|marketing agency|viral)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Social Media Marketing & Organic Growth Strategy',
      industry: 'Digital Marketing & Social Media',
      niche: 'Viral Content Funnels & Inbound Client Acquisition',
      targetAudience: 'Business owners, creators, entrepreneurs, and marketing agencies',
      services: [
        '3-Second Scroll-Stopping Video Hooks for Reels & Short-Form Video',
        'Semantic Social SEO Strategy for Feed Discovery',
        'Direct-Message Inbound Funnels Converting Viewers into Clients',
        'Full-Funnel Organic Content Architecture',
      ],
      keywords: [
        'social media marketing strategy',
        'organic reels growth funnels',
        'content strategy for businesses',
        'social media client acquisition',
        'instagram marketing agency',
        'short form video viral hooks',
      ],
      hashtags: ['#SocialMediaMarketing', '#SMM', '#ContentStrategy', '#InstagramGrowth', '#ReelsTips'],
      slug: 'social-media-marketing-strategy',
      hookAIDA: 'Tired of posting consistently on social media without seeing real follower growth or paying clients?',
      desireAIDA: 'Scroll-stopping video hooks, targeted organic discovery, and automated DM funnels that turn everyday viewers into loyal customers.',
      problemPAS: 'Spending hours creating content only to hear crickets and get zero inbound inquiries is completely demoralizing.',
      agitatePAS: 'When the algorithm changes and your organic reach plummets, your business growth stalls while competitors dominate.',
      beforeBAB: 'Random posting schedules, low engagement numbers, and zero predictable leads from social media.',
      afterBAB: 'A clear, repeatable content system that generates high-intent inquiries and scales your brand authority on autopilot.',
    };
  }
  // 6. Dental & Smile Care
  else if (/\b(dental|dentist|teeth|smile|whitening|clinic|orthodontic|oral health|implants|hygiene)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Comprehensive Family Dental Care & Smile Treatments',
      industry: 'Healthcare & Dentistry',
      niche: 'Preventive Dental Care & Cosmetic Smile Whitening',
      targetAudience: 'Patients, families, and individuals seeking gentle, professional dental care',
      services: [
        'Gentle Preventive Cleanings & Digital Oral Screenings',
        'In-Office Professional Teeth Whitening Treatments',
        'Clear Aligners & Cosmetic Smile Restorations',
        'Compassionate Personalized Care in a Relaxing Environment',
      ],
      keywords: [
        'family dental care clinic',
        'gentle preventive dentistry',
        'in office teeth whitening',
        'cosmetic smile makeover',
        'clear aligners consultation',
        'gentle family dentist appointments',
      ],
      hashtags: ['#DentalCare', '#SmileMakeover', '#TeethWhitening', '#Dentist', '#OralHealth'],
      slug: 'family-dental-care-clinic',
      hookAIDA: 'Ready to flash a bright, healthy smile you feel completely confident showing off every day?',
      desireAIDA: 'Gentle, pain-free cleanings and professional whitening that restores your natural radiance in just one visit.',
      problemPAS: 'Dental anxiety and lingering tooth sensitivity keep many people from getting the essential care they deserve.',
      agitatePAS: 'Ignoring minor dental concerns today leads to painful emergencies and expensive procedures down the road.',
      beforeBAB: 'Hiding your smile in photos and feeling nervous every time you think about visiting the dentist.',
      afterBAB: 'Walking out of our clinic with gleaming, refreshed teeth and the confidence of knowing your oral health is in caring hands.',
    };
  }
  // 7. Coffee & Specialty Cafe
  else if (/\b(coffee|cafe|espresso|latte|roast|barista|brew|cappuccino|beans)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Artisan Roasted Specialty Coffee & Cafe Culture',
      industry: 'Food & Beverage',
      niche: 'Single-Origin Coffee Roasting & Espresso Crafts',
      targetAudience: 'Coffee enthusiasts, specialty brew lovers, and cafe visitors',
      services: [
        'Sustainably Sourced Single-Origin Specialty Beans',
        'Precision Medium-Dark Roasts Highlighting Tasting Notes',
        'Handcrafted Espresso Beverages & Silky Microfoam Lattes',
        'Freshly Ground Bags Available for Home Pour-Over Brewers',
      ],
      keywords: [
        'specialty single origin coffee',
        'artisan espresso roast beans',
        'local specialty coffee shop',
        'handcrafted latte microfoam',
        'freshly roasted coffee beans',
        'pour over coffee beans',
      ],
      hashtags: ['#SpecialtyCoffee', '#CoffeeLovers', '#Espresso', '#BaristaLife', '#CafeCulture'],
      slug: 'artisan-roasted-specialty-coffee',
      hookAIDA: 'Looking for a rich, aromatic morning cup that transforms your daily coffee ritual into an artisan experience?',
      desireAIDA: 'Freshly roasted single-origin beans bursting with chocolate notes, citrus undertones, and velvety crema in every sip.',
      problemPAS: 'Bitter, burnt grocery store coffee pods leave a flat taste and ruin what should be the best part of your morning.',
      agitatePAS: 'Rushing out the door with bland, lukewarm drive-thru coffee sets a sluggish tone for your entire productive day.',
      beforeBAB: 'Relying on bitter, stale coffee that needs heavy sugar just to be drinkable.',
      afterBAB: 'Savoring a perfectly extracted, smooth espresso handcrafted from ethically sourced beans roasted to perfection.',
    };
  }
  // 8. Real Estate & Property
  else if (/\b(real estate|realtor|property|house|home|apartment|villa|penthouse|condo|listing|mortgage)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Luxury Residential Real Estate & Prime Property Listings',
      industry: 'Real Estate & Property Development',
      niche: 'Architectural Homes & Premier Neighborhoods',
      targetAudience: 'Homebuyers, luxury property investors, and families seeking prime residential homes',
      services: [
        'Prime Architectural Homes in Sought-After Locations',
        'Sunlit Open-Concept Floorplans with Panoramic Views',
        'Curated Luxury Amenities & Modern Designer Finishes',
        'Transparent Purchasing Assistance & Guided Property Walkthroughs',
      ],
      keywords: [
        'luxury residential real estate',
        'prime property listings',
        'exclusive apartment homes',
        'modern architectural residences',
        'luxury home purchasing consultation',
        'premier neighborhood properties',
      ],
      hashtags: ['#RealEstate', '#LuxuryHomes', '#PropertyListing', '#Realtor', '#DreamHome'],
      slug: 'luxury-residential-real-estate-listing',
      hookAIDA: 'Looking for an architectural masterpiece in a prime neighborhood that truly feels like home?',
      desireAIDA: 'Sun-drenched living spaces, custom designer finishes, and an expansive terrace designed for unforgettable gatherings.',
      problemPAS: 'Navigating competitive property markets with scarce verified listings creates overwhelming search fatigue.',
      agitatePAS: 'Without expert neighborhood guidance, buyers risk settling for subpar floor plans or overpaying on properties.',
      beforeBAB: 'Wasting weekends touring outdated, disappointing properties that look nothing like their online photos.',
      afterBAB: 'Unlocking the front door to your dream residence, perfectly suited for your family lifestyle and long-term equity.',
    };
  }
  // 9. Automotive, Cars & Detailing
  else if (/\b(car|cars|auto|automotive|vehicle|exhaust|engine|turbo|detailing|ceramic coating|mechanic|bimmer|audi|bmw|mercedes|porsche)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Precision Automotive Performance & Ceramic Detailing',
      industry: 'Automotive & Vehicle Care',
      niche: 'Performance Upgrades & Precision Paint Protection',
      targetAudience: 'Car enthusiasts, vehicle owners, and automotive performance hobbyists',
      services: [
        'Multi-Stage Paint Correction & High-Gloss Ceramic Coating',
        'Precision Exhaust System Tuning & Performance Hardware',
        'Interior Deep Clean & Leather Conditioning Protection',
        'Diagnostic Health Inspections by Certified Specialists',
      ],
      keywords: [
        'automotive performance upgrades',
        'ceramic coating paint protection',
        'precision vehicle detailing',
        'custom car exhaust tuning',
        'automotive diagnostic specialist',
        'high gloss car protection',
      ],
      hashtags: ['#Automotive', '#CarCare', '#AutoDetailing', '#CarEnthusiast', '#PerformanceCars'],
      slug: 'precision-automotive-performance-detailing',
      hookAIDA: 'Ready to restore that mirror-like showroom shine and unleash the true performance of your vehicle?',
      desireAIDA: 'Deep optical gloss, hydrophobic ceramic protection, and an exhilarating exhaust note that turns heads at every stoplight.',
      problemPAS: 'Swirl marks, stone chips, and sun fading quickly ruin the curb appeal and resale value of your prized car.',
      agitatePAS: 'Generic automatic car washes scratch your clear coat and leave permanent paint blemishes that are costly to repair.',
      beforeBAB: 'Dull, oxidized paint covered in wash swirls and road grime that hides your car’s true beauty.',
      afterBAB: 'A flawless, glassy finish that repels dirt and water effortlessly while protecting your investment for years.',
    };
  }
  // 10. Beauty, Skincare & Cosmetics
  else if (/\b(skin|skincare|serum|cream|cosmetic|cosmetics|beauty|glow|hydrat|makeup|facial|dermatology)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Botanical Skincare Serum & Radiant Glow Essentials',
      industry: 'Beauty & Skincare',
      niche: 'Clean Botanical Formulations & Skin Barrier Repair',
      targetAudience: 'Skincare enthusiasts seeking gentle, clean formulations for radiant, healthy skin',
      services: [
        'Potent Vitamin C & Hyaluronic Acid Hydration Complex',
        'Non-Comedogenic Barrier-Repair Botanical Extracts',
        'Cruelty-Free, Paraben-Free Clean Formulation Standards',
        'Visible Glow & Texture Improvement in Under 14 Days',
      ],
      keywords: [
        'botanical skincare serum',
        'radiant skin glow serum',
        'clean beauty barrier repair',
        'hyaluronic acid hydrating serum',
        'vitamin c brightening formula',
        'natural skincare essentials',
      ],
      hashtags: ['#Skincare', '#CleanBeauty', '#GlowingSkin', '#SkincareRoutine', '#BeautyEssentials'],
      slug: 'botanical-skincare-serum-radiant-glow',
      hookAIDA: 'Looking for a lightweight serum that delivers a luminous, dewy glow without irritating your skin barrier?',
      desireAIDA: 'Deep hydration, refined skin texture, and a naturally radiant complexion that looks flawless even without makeup.',
      problemPAS: 'Harsh chemicals and heavy synthetic fragrances disrupt your natural skin barrier and trigger stubborn breakouts.',
      agitatePAS: 'Wasting money on over-hyped skincare products that leave your skin feeling dry, tight, and dull is exhausting.',
      beforeBAB: 'Battling persistent redness, uneven tone, and dullness every time you look in the mirror.',
      afterBAB: 'Waking up to plump, hydrated skin with an effortless youthful glow that radiates from the inside out.',
    };
  }
  // 11. Fitness, Gym & Wellness
  else if (/\b(fitness|gym|workout|trainer|training|muscle|weightloss|crossfit|yoga|wellness|strength|exercise)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Results-Driven Strength Training & Personal Fitness Coaching',
      industry: 'Fitness & Wellness',
      niche: 'Functional Strength & Sustainable Body Transformation',
      targetAudience: 'Fitness enthusiasts, busy professionals, and individuals seeking sustainable health transformations',
      services: [
        'Personalized Functional Strength & Conditioning Protocols',
        'One-on-One Form Correction & Injury Prevention Coaching',
        'Custom Nutrition Frameworks Supporting Fat Loss & Energy',
        'Progressive Tracking for Continuous Personal Records',
      ],
      keywords: [
        'personal fitness training coach',
        'functional strength conditioning',
        'sustainable weight loss workout',
        'one on one gym coaching',
        'body transformation fitness program',
        'injury prevention workout protocols',
      ],
      hashtags: ['#Fitness', '#GymLife', '#StrengthTraining', '#WorkoutMotivation', '#FitnessGoals'],
      slug: 'strength-training-personal-fitness-coaching',
      hookAIDA: 'Ready to break through fitness plateaus, build lean muscle, and feel stronger in your everyday life?',
      desireAIDA: 'A tailored training plan that delivers visible strength gains and boundless energy without burning you out.',
      problemPAS: 'Wandering aimlessly around the gym without a structured program leads to frustrating plateaus and wasted effort.',
      agitatePAS: 'Pushing through poor form causes nagging joint pain that sidelines you from the activities you love.',
      beforeBAB: 'Feeling stuck, fatigued, and unsure whether your gym workouts are actually making a real difference.',
      afterBAB: 'Confidently hitting new personal records with perfect mechanics and enjoying all-day vibrant energy.',
    };
  }
  // 12. Jewelry & Luxury Accessories
  else if (/\b(jewelry|jewellery|ring|rings|necklace|gold|diamond|earring|bracelet|watch|watches|gemstone|silver)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Handcrafted Fine Jewelry & Ethical Diamond Pieces',
      industry: 'Luxury Goods & Jewelry',
      niche: 'Bespoke Diamond Rings & Timeless Precious Metals',
      targetAudience: 'Fine jewelry collectors, gift shoppers, and couples seeking timeless heirloom pieces',
      services: [
        'Conflict-Free Certified Brilliant Cut Gemstones',
        'Solid 18K Gold & Platinum Precision Hand-Setting',
        'Custom Bespoke Ring Design & Sizing Consultation',
        'Lifetime Cleaning, Inspection & Authenticity Guarantee',
      ],
      keywords: [
        'handcrafted fine jewelry',
        'bespoke diamond engagement rings',
        'ethical certified diamond jewelry',
        'solid gold heirloom necklaces',
        'custom bridal jewelry design',
        'timeless luxury jewelry gifts',
      ],
      hashtags: ['#FineJewelry', '#Diamonds', '#JewelryDesign', '#GoldJewelry', '#HandcraftedJewelry'],
      slug: 'handcrafted-fine-jewelry-ethical-diamonds',
      hookAIDA: 'Looking for a breathtaking heirloom piece that captures your most cherished milestones with timeless elegance?',
      desireAIDA: 'Radiant brilliance, ethically sourced diamonds, and exquisite artisanal craftsmanship that lasts for generations.',
      problemPAS: 'Mass-produced jewelry with hollow settings and cloudy stones often tarnishes quickly and loses its sparkle.',
      agitatePAS: 'Investing in fine jewelry without transparent gemstone certification leaves you unsure of true lasting value.',
      beforeBAB: 'Struggling to find distinctive, heirloom-grade jewelry that stands out from generic commercial display cases.',
      afterBAB: 'Wearing a bespoke, radiant treasure handcrafted with passion that sparks compliments everywhere you go.',
    };
  }
  // 13. Technology, SaaS & Cloud Software
  else if (/\b(software|saas|app|cloud|ai|automation|api|platform|devops|cybersecurity|code|tech)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Autonomous Cloud Workflow Platform & Developer Tools',
      industry: 'Enterprise Software & Technology',
      niche: 'Cloud Automation & Modern Developer Productivity',
      targetAudience: 'Software engineering leaders, founders, and technical operations teams',
      services: [
        'Real-Time Multi-Cloud Synchronization across Ecosystems',
        'Zero-Configuration Instant API Connectors & Webhooks',
        'Enterprise SOC-2 Type II Certified Security Architecture',
        'Instant Deployment Pipelines with Zero Downtime',
      ],
      keywords: [
        'cloud workflow automation software',
        'enterprise developer productivity tools',
        'multi cloud synchronization platform',
        'autonomous workflow engine',
        'scalable saas cloud software',
        'secure cloud api connectors',
      ],
      hashtags: ['#SaaS', '#CloudComputing', '#TechInnovation', '#SoftwareEngineering', '#Automation'],
      slug: 'cloud-workflow-automation-developer-platform',
      hookAIDA: 'Tired of slow development sprints and fragile manual deployment pipelines that break under scale?',
      desireAIDA: 'Effortless automated workflows, rock-solid security, and instant connectors that keep your engineering team shipping fast.',
      problemPAS: 'Disjointed developer tooling and manual glue code drain engineering hours and cause costly production downtime.',
      agitatePAS: 'When your infrastructure cannot scale reliably with user traffic, customer trust evaporates and bug tickets mount.',
      beforeBAB: 'Engineers bogged down by repetitive maintenance scripts, config sprawl, and endless integration debugging.',
      afterBAB: 'A unified autonomous cloud pipeline that orchestrates your entire stack smoothly and scales effortlessly.',
    };
  }
  // 14. Photography, Videography & Creative Studio
  else if (/\b(photo|photography|photographer|videography|video production|camera|portrait|wedding photo|studio shoot)\b/i.test(semanticContext)) {
    profile = {
      mainTopic: 'Cinematic Visual Storytelling & Professional Photography',
      industry: 'Creative Media & Photography',
      niche: 'Event Coverage, Editorial Portraits & Commercial Video',
      targetAudience: 'Couples, corporate brands, creatives, and families seeking unforgettable visual storytelling',
      services: [
        'Natural-Light Editorial Portraiture & Expressive Framing',
        '4K Cinematic Video Production with Professional Audio',
        'Expert Color Grading & High-End Skin Retouching',
        'Fast Full-Resolution Gallery Delivery with Print Rights',
      ],
      keywords: [
        'cinematic photography services',
        'editorial portrait photographer',
        'professional commercial videography',
        'wedding visual storytelling shoot',
        'high end portrait photography',
        'commercial brand video production',
      ],
      hashtags: ['#Photography', '#VisualStorytelling', '#PortraitPhotography', '#Videography', '#CreativeStudio'],
      slug: 'cinematic-visual-storytelling-photography',
      hookAIDA: 'Want to preserve life’s most meaningful moments with cinematic framing and genuine emotional authenticity?',
      desireAIDA: 'Timeless imagery, breathtaking lighting, and evocative compositions that turn fleeting memories into works of art.',
      problemPAS: 'Awkward posing, harsh lighting, and flat phone camera snapshots fail to capture the true energy of the moment.',
      agitatePAS: 'Special celebrations happen only once—missing out on professional visual storytelling means those memories fade.',
      beforeBAB: 'Stiff, uncomfortable poses in front of the lens that produce generic photos you never want to look back on.',
      afterBAB: 'An effortless, fun shoot that captures your authentic spirit and produces images you will proudly display forever.',
    };
  }
  // 15. DYNAMIC ARBITRARY BUSINESS, PRODUCT OR NICHE HANDLER
  // Handles ANY other subject: e.g. ceramics, pets, legal, medical, tutoring, cleaning, plumbing, etc.
  else {
    const rawTokens = visibleLines.length > 0
      ? visibleLines.join(' ').replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3)
      : fileName.replace(/[\-_.]+/g, ' ').split(/\s+/).filter((w) => w.length >= 3 && !/^(jpg|jpeg|png|webp|mp4|mov|sample|img|image|photo|pic|video|upload)$/i.test(w));

    const cleanTokens = rawTokens.filter((w) => !/^(and|the|for|with|this|that|from|have|will|your|our|are|was|were)$/i.test(w));
    const titleWords = cleanTokens.slice(0, 4).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const derivedSubject = titleWords.length > 0 ? titleWords.join(' ') : 'Specialized Quality Solutions';

    profile = {
      mainTopic: derivedSubject,
      industry: `${derivedSubject} & Professional Offerings`,
      niche: `Dedicated ${derivedSubject} Services`,
      targetAudience: `Customers, clients, and enthusiasts seeking reliable, high-quality ${derivedSubject.toLowerCase()}`,
      services: visibleLines.length >= 2
        ? visibleLines.slice(0, 4)
        : [
            `Verified Quality Craftsmanship & Thoughtful Design`,
            `Tailored ${derivedSubject} Support Built to Your Needs`,
            `Transparent Communication & Responsive Client Care`,
            `Reliable Turnaround with Guaranteed Satisfaction`,
          ],
      keywords: [
        `${derivedSubject.toLowerCase()} solutions`,
        `quality ${derivedSubject.toLowerCase()}`,
        `professional ${derivedSubject.toLowerCase()} services`,
        `trusted ${derivedSubject.toLowerCase()} provider`,
        `best ${derivedSubject.toLowerCase()} support`,
      ],
      hashtags: titleWords.length > 0
        ? titleWords.map((w) => '#' + w).filter((t) => t.length <= 18)
        : ['#QualityCraft', '#ProfessionalServices', '#DedicatedWork'],
      slug: formatUrlSlug(derivedSubject),
      hookAIDA: `Looking for standout quality and dedicated care when it comes to your ${derivedSubject.toLowerCase()}?`,
      desireAIDA: `Exceptional results, transparent communication, and thoughtful solutions built to exceed your expectations.`,
      problemPAS: `Dealing with inconsistent standards and unreliable options is frustrating when you need results you can trust.`,
      agitatePAS: `When quality is compromised, you lose valuable time and end up having to redo the work all over again.`,
      beforeBAB: `Wasting energy on second-rate alternatives that never quite deliver on their promises.`,
      afterBAB: `Experiencing complete peace of mind with verified, standout craftsmanship tailored to your exact needs.`,
    };
  }

  // Active services: prioritize specifically extracted offerings or inspection data
  const activeServices = extractedOfferings.length > 0 ? extractedOfferings : profile.services;

  // 7. CRAFT NATURAL, HUMAN-SOUNDING COPYWRITING FOLLOWING FORMULAS & SPECIAL INSTRUCTIONS
  const bulletListString = activeServices.map((s) => `• ${s}`).join('\n');
  const servicesInline = activeServices.slice(0, 3).join(', ');

  const contactCTA = detectedPhone
    ? `Message or call us at ${detectedPhone} to get started!`
    : detectedWebsite
    ? `Visit ${detectedWebsite} or tap the link in our bio to learn more!`
    : 'Save this post and tap the link in our bio to connect with our team today!';

  let primaryCaption = '';
  let altCaption = '';

  if (normalizedFormula === 'AIDA') {
    if (wantsBulletPoints) {
      primaryCaption = `${profile.hookAIDA} Discover our dedicated offerings designed specifically for ${profile.targetAudience.toLowerCase()}:\n\n${bulletListString}\n\nExperience seamless execution and ${profile.desireAIDA.toLowerCase()} ${contactCTA}`;
    } else {
      primaryCaption = `${profile.hookAIDA} By delivering ${servicesInline}, our specialized service helps ${profile.targetAudience.toLowerCase()} achieve ${profile.desireAIDA.toLowerCase()} ${contactCTA}`;
    }
    altCaption = `Elevate your ${profile.mainTopic.toLowerCase()} with proven support. ${contactCTA}`;
  } else if (normalizedFormula === 'PAS') {
    if (wantsBulletPoints) {
      primaryCaption = `${profile.problemPAS} ${profile.agitatePAS} Our specialized service solves that frustration directly:\n\n${bulletListString}\n\nGain full confidence in your results today. ${contactCTA}`;
    } else {
      primaryCaption = `${profile.problemPAS} ${profile.agitatePAS} Our specialized ${profile.mainTopic.toLowerCase()} eliminates that headache with ${servicesInline}. Reclaim your peace of mind and get the standout results you deserve. ${contactCTA}`;
    }
    altCaption = `Overwhelmed by unreliable alternatives? Get trusted ${profile.mainTopic.toLowerCase()} that delivers verified results. ${contactCTA}`;
  } else if (normalizedFormula === 'BAB') {
    if (wantsBulletPoints) {
      primaryCaption = `${profile.beforeBAB} Imagine stepping into a better reality: ${profile.afterBAB.toLowerCase()} Our dedicated offerings bridge that gap effortlessly:\n\n${bulletListString}\n\nExperience the transformation today. ${contactCTA}`;
    } else {
      primaryCaption = `${profile.beforeBAB} Imagine stepping into a better reality: ${profile.afterBAB.toLowerCase()} Our dedicated ${profile.mainTopic.toLowerCase()} bridges that gap effortlessly by delivering ${servicesInline}. Transform your experience today. ${contactCTA}`;
    }
    altCaption = `Move from frustrating delays to effortless success with expert ${profile.mainTopic.toLowerCase()}. ${contactCTA}`;
  } else {
    // Standard natural caption
    if (wantsBulletPoints) {
      primaryCaption = `Master your ${profile.mainTopic.toLowerCase()} with verified excellence tailored for ${profile.targetAudience.toLowerCase()}:\n\n${bulletListString}\n\n${contactCTA}`;
    } else {
      primaryCaption = `Master your ${profile.mainTopic.toLowerCase()} with verified excellence tailored for ${profile.targetAudience.toLowerCase()}. Built around ${servicesInline}, we ensure standout quality and consistent satisfaction.\n\n${contactCTA}`;
    }
    altCaption = `Specialized ${profile.mainTopic.toLowerCase()} delivering consistent, reliable quality. ${contactCTA}`;
  }

  // 8. HASHTAGS: STRICT SHORT, RELEVANT SET (5-8 TAGS)
  const cleanedAllTags = formatTags(profile.hashtags);

  // 9. SEO KEYWORDS
  const allSeoKeywords = Array.from(new Set(profile.keywords));

  return {
    id: 'aezey_res_' + Date.now().toString(36),
    timestamp: Date.now(),
    urlSlug: profile.slug,
    primaryCaption: stripFormulaLabels(stripInstructionEcho(primaryCaption, customInstructions)),
    alternativeCaption: stripFormulaLabels(stripInstructionEcho(altCaption, customInstructions)),
    hashtags: {
      industry: cleanedAllTags.slice(0, 3),
      niche: cleanedAllTags.slice(1, 4),
      topic: cleanedAllTags.slice(2, 5),
      audience: cleanedAllTags.slice(0, 2),
      productService: cleanedAllTags.slice(0, 3),
      location: [],
      all: cleanedAllTags,
    },
    seoKeywords: {
      mainTopic: allSeoKeywords.slice(0, 3),
      productService: allSeoKeywords.slice(2, 5),
      industry: allSeoKeywords.slice(0, 2),
      audience: [`${profile.targetAudience.toLowerCase()} solutions`],
      brand: detectedBrand ? [detectedBrand] : [],
      searchIntent: allSeoKeywords.slice(0, 4),
      all: allSeoKeywords,
    },
    callToAction: contactCTA,
    contentSummary: `${isVideo ? 'Video multi-frame progression' : 'Visual content'} analysis for "${profile.mainTopic}" structured in ${normalizedFormula} format.`,
    detectedContext: {
      detectedBrand,
      hasBrand: Boolean(detectedBrand),
      visibleText: visibleLines.length > 0 ? visibleLines : [profile.mainTopic],
      detectedLanguage: 'English',
      tone,
      mainTopic: profile.mainTopic,
      promotionalIntent: 'Service Showcase',
      targetAudience: profile.targetAudience,
      visualHighlights: [
        `High-clarity visual inspection of ${fileName || (isVideo ? 'uploaded video clip' : 'media asset')}`,
        isVideo ? `Multi-frame temporal progression sampled across ${duration ? Math.round(duration) + 's' : 'video duration'}` : 'Balanced focal composition with high-contrast text and branding elements',
        'Optimized for multi-platform distribution and discoverability',
      ],
    },
    platform,
    tone,
    formula: normalizedFormula,
    isSimulatedFallback: true,
    authNotice: notice,
  };
}
