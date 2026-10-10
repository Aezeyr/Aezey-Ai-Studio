/**
 * AEZEY AI Studio - Interactive Test Presets
 * Allows users to test dynamic brand recognition, multi-language detection (English, Urdu, Mixed),
 * pricing, contact details, and offers in 1-click.
 */

export interface SamplePreset {
  id: string;
  title: string;
  category: string;
  mediaType?: 'image';
  language: 'English' | 'Urdu' | 'Mixed';
  description: string;
  brandExpected: string;
  generateDataUrl: () => string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'digital-marketing',
    title: 'SEO Test: "Digital Marketing Tips"',
    category: 'Digital Marketing & SEO',
    language: 'English',
    description: 'Verifies natural keyword integration, strictly content-derived hashtags, and SEO-friendly slug ("digital-marketing-tips").',
    brandExpected: 'Apex Growth Digital',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#022c43');
      grad.addColorStop(0.5, '#053f5c');
      grad.addColorStop(1, '#115173');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      // Cyan accent border
      ctx.strokeStyle = '#00adb5';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      // Agency header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('APEX GROWTH DIGITAL', 400, 140);

      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#00adb5';
      ctx.fillText('HIGH-IMPACT SOCIAL & SEARCH STRATEGY', 400, 185);

      // Topic Headline
      ctx.fillStyle = '#ffd460';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText('DIGITAL MARKETING TIPS 2026', 400, 280);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '24px sans-serif';
      ctx.fillText('Rank Higher • Drive High-Intent Traffic • Convert Leads', 400, 330);

      // Bullet container
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.roundRect(140, 380, 520, 220, 16);
      ctx.fill();
      ctx.strokeStyle = '#00adb5';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#ffd460';
      ctx.fillText('Key Growth Drivers:', 180, 430);

      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• Search Engine Optimization (SEO)', 180, 480);
      ctx.fillText('• Targeted Social Media Ad Funnels', 180, 525);
      ctx.fillText('• Conversion Rate Optimization (CRO)', 180, 570);

      // Contact & website
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px sans-serif';
      ctx.fillText('📞 Agency Hotline: +1 (888) 420-GROW', 400, 660);
      ctx.fillText('🌐 Audit Strategy: www.apexgrowth.agency', 400, 700);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'abc-fashion',
    title: 'Brand Test: "ABC Fashion"',
    category: 'Fashion & Retail',
    language: 'English',
    description: 'Verifies dynamic brand recognition ("ABC Fashion") with pricing ($49.99) & phone number.',
    brandExpected: 'ABC Fashion',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      // Gold / cyan accent ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      // Brand badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ABC FASHION', 400, 160);

      ctx.font = '300 24px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('HAUTE COUTURE & URBAN STREETWEAR', 400, 205);

      // Divider line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(250, 235);
      ctx.lineTo(550, 235);
      ctx.stroke();

      // Main Offer Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('SUMMER DROP 2026', 400, 340);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('EXCLUSIVE 40% OFF STOREWIDE', 400, 410);

      // Price Tag Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.roundRect(240, 460, 320, 90, 16);
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText('Starting at $49.99', 400, 520);

      // Contact Info
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px sans-serif';
      ctx.fillText('📞 Call / WhatsApp: +1 (800) 555-2468', 400, 620);
      ctx.fillText('🌐 Shop Online: www.abcfashionstore.com', 400, 660);
      ctx.fillText('📍 Visit Our Flagship Store in Downtown Metro', 400, 700);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'urdu-academy',
    title: 'Urdu Test: "روشن اکیڈمی"',
    category: 'Education',
    language: 'Urdu',
    description: 'Verifies natural Urdu language generation & Nastaliq text recognition ("Roshan Academy").',
    brandExpected: 'روشن اکیڈمی (Roshan Academy)',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      // Background
      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.6, '#0f766e');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      // Border
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 5;
      ctx.strokeRect(30, 30, 740, 740);

      // Urdu Brand Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px serif';
      ctx.textAlign = 'center';
      ctx.fillText('روشن اکیڈمی', 400, 150);

      ctx.font = '26px sans-serif';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('Roshan Academy of Excellence', 400, 195);

      // Main Urdu Announcement
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 50px serif';
      ctx.fillText('داخلے جاری ہیں - سیشن 2026', 400, 310);

      ctx.fillStyle = '#ffffff';
      ctx.font = '32px serif';
      ctx.fillText('میٹرک، ایف ایس سی اور او لیول کے لیے خصوصی کلاسز', 400, 380);
      ctx.fillText('تجربہ کار اساتذہ اور بہترین نتائج کی ضمانت', 400, 440);

      // Special Discount
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.roundRect(200, 490, 400, 80, 14);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 32px serif';
      ctx.fillText('پہلے 50 طلبہ کے لیے 30% فیس میں رعایت', 400, 545);

      // Contact Details
      ctx.fillStyle = '#ffffff';
      ctx.font = '26px sans-serif';
      ctx.fillText('📞 رابطہ نمبر: 0300-1234567', 400, 640);
      ctx.fillText('📍 گلبرگ مین بلیوارڈ، لاہور', 400, 690);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'mixed-biryani',
    title: 'Mixed Urdu-English: "Karachi Bites"',
    category: 'Food & Dining',
    language: 'Mixed',
    description: 'Verifies natural Roman Urdu & mixed phrasing for viral restaurant promotions.',
    brandExpected: 'Karachi Bites',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      // Deep vibrant food background
      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#7f1d1d');
      grad.addColorStop(0.5, '#991b1b');
      grad.addColorStop(1, '#450a0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      // Header Brand
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 58px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KARACHI BITES', 400, 150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#fdba74';
      ctx.fillText('AUTHENTIC SPICE & TRADITIONAL FLAVORS', 400, 195);

      // Mixed Heading
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px sans-serif';
      ctx.fillText('WEEKEND DHAMAKA DEAL!', 400, 300);

      ctx.font = '32px sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('Asli Zaika, Asli Biryani - Abhi Order Karein!', 400, 370);

      // Price Tag Box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.roundRect(220, 440, 360, 100, 18);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('Only Rs. 499/-', 400, 505);

      // Urdu line + details
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px serif';
      ctx.fillText('ساتھ فری ٹھنڈی کولڈ ڈرنک اور رائتہ', 400, 590);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#fed7aa';
      ctx.fillText('🛵 Free Home Delivery: 0321-9876543', 400, 650);
      ctx.fillText('⏰ Timing: 12 PM till 2 AM Midnight', 400, 690);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'tech-nexus',
    title: 'SaaS Startup: "Nexus AI"',
    category: 'Technology',
    language: 'English',
    description: 'High-tech B2B software post with clear CTAs and feature highlights.',
    brandExpected: 'Nexus AI',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.5, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, 740, 740);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEXUS AI CLOUD', 400, 150);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText('Autonomous Workflow Engine', 400, 240);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px sans-serif';
      ctx.fillText('Cut Operations Time by 70% with Intelligent Agents', 400, 310);

      // Feature bullets
      ctx.textAlign = 'left';
      ctx.font = '26px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('✓ Real-time multi-cloud synchronization', 160, 410);
      ctx.fillText('✓ Zero-setup API connectors', 160, 465);
      ctx.fillText('✓ Enterprise SOC-2 & ISO certified', 160, 520);

      // CTA Box
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2563eb';
      ctx.roundRect(220, 590, 360, 70, 35);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Start 14-Day Free Trial', 400, 636);

      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('No Credit Card Required • www.nexusai.cloud', 400, 700);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'academic-research',
    title: 'Academic: "Study & Research Guide"',
    category: 'Education & Academics',
    language: 'English',
    description: 'Tests academic topic detection, study guide captions, short relevant tags, and academic URL slug.',
    brandExpected: 'Academic Research Guide',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#4338ca');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ACADEMIC RESEARCH & STUDY GUIDE', 400, 150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#c7d2fe';
      ctx.fillText('High-Yield University Learning & Exam Methods', 400, 200);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.roundRect(140, 270, 520, 290, 16);
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Core Academic Pillars:', 180, 320);

      ctx.font = '21px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• Active Recall & Spaced Repetition Protocols', 180, 375);
      ctx.fillText('• Literature Review & Paper Synthesis Methods', 180, 425);
      ctx.fillText('• Thesis & Dissertation Drafting Frameworks', 180, 475);
      ctx.fillText('• Structured Problem-Solving for Quantitative Exams', 180, 525);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#e0e7ff';
      ctx.font = '22px sans-serif';
      ctx.fillText('📚 Higher Education Research & Academic Excellence', 400, 640);
      ctx.fillText('🎓 Access University Study Templates & Revision Guides', 400, 685);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'cushioned-shoes',
    title: 'Shoes: "Running Sneakers"',
    category: 'Footwear & Athletic',
    language: 'English',
    description: 'Tests shoe/footwear identification, cushioning benefits, short tags (#Sneakers, #RunningShoes), and shoe slug.',
    brandExpected: 'Performance Footwear',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#0c4a6e');
      grad.addColorStop(0.5, '#0369a1');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CUSHIONED RUNNING SNEAKERS', 400, 150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#bae6fd';
      ctx.fillText('High-Rebound Dual-Density Athletic Footwear', 400, 200);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.roundRect(140, 270, 520, 270, 16);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('Performance Footwear Specs:', 180, 320);

      ctx.font = '21px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• Responsive Dual-Density Cloud Foam Midsoles', 180, 375);
      ctx.fillText('• Breathable Engineered Mesh Knit Upper', 180, 425);
      ctx.fillText('• Ergonomic Arch Support & Anti-Fatigue Shank', 180, 475);
      ctx.fillText('• Durable Multi-Surface High-Grip Rubber Outsole', 180, 520);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0f9ff';
      ctx.font = '22px sans-serif';
      ctx.fillText('👟 Built for Long Miles, Commutes & Daily Streetwear', 400, 640);
      ctx.fillText('⚡ Engineered for Stride Comfort & Impact Protection', 400, 685);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'streetwear-clothing',
    title: 'Clothing: "Streetwear Apparel"',
    category: 'Fashion & Clothing',
    language: 'English',
    description: 'Tests apparel identification, breathable fabric highlights, clothing hashtags, and clothing slug.',
    brandExpected: 'Urban Apparel Collection',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#292524');
      grad.addColorStop(1, '#44403c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('URBAN STREETWEAR APPAREL', 400, 150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#d6d3d1';
      ctx.fillText('Handcrafted Premium Breathable Cotton & Modern Tailoring', 400, 200);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect(140, 270, 520, 260, 16);
      ctx.fill();
      ctx.strokeStyle = '#a8a29e';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Garment Craftsmanship:', 180, 320);

      ctx.font = '21px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• 100% Heavyweight Pre-Shrunk Breathable Cotton', 180, 375);
      ctx.fillText('• Tailored Modern Silhouette with Relaxed Fit Drape', 180, 425);
      ctx.fillText('• Reinforced Double-Needle Seams Built to Last', 180, 475);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#e7e5e4';
      ctx.font = '22px sans-serif';
      ctx.fillText('👕 Timeless Streetwear Essentials & Everyday Statement Fits', 400, 640);
      ctx.fillText('🌐 Shop Modern Apparel Drops Online', 400, 685);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'gourmet-cooking',
    title: 'Cooking: "Gourmet Pasta Recipe"',
    category: 'Culinary & Cooking',
    language: 'English',
    description: 'Tests recipe/cooking identification, fresh ingredient highlights, culinary hashtags, and cooking slug.',
    brandExpected: 'Gourmet Kitchen Recipe',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#78350f');
      grad.addColorStop(0.5, '#92400e');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOURMET HOMEMADE PASTA RECIPE', 400, 150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#fef3c7';
      ctx.fillText('Authentic Italian Flavors in Under 30 Minutes', 400, 200);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.roundRect(140, 270, 520, 270, 16);
      ctx.fill();
      ctx.strokeStyle = '#fde68a';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('Recipe Secrets:', 180, 320);

      ctx.font = '21px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• Fresh Farm-Sourced Basil, Garlic & San Marzano Tomatoes', 180, 375);
      ctx.fillText('• Al Dente Bronze-Cut Pasta with Starchy Emulsified Sauce', 180, 425);
      ctx.fillText('• Aged Parmigiano-Reggiano and Cold-Pressed Extra Virgin Olive Oil', 180, 475);
      ctx.fillText('• Easy Scratch Cooking for Weeknight Dinners', 180, 520);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fffbeb';
      ctx.font = '22px sans-serif';
      ctx.fillText('🍝 Scratch Kitchen Flavor Straight to Your Dinner Table', 400, 640);
      ctx.fillText('📖 Save for Tonight\'s Cozy Homemade Meal', 400, 685);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'smm-marketing',
    title: 'SMM: "Social Media Agency"',
    category: 'Social Media Marketing',
    language: 'English',
    description: 'Tests social media marketing identification, reel hooks, short SMM tags, and marketing slug.',
    brandExpected: 'Social Media Growth Agency',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#581c87');
      grad.addColorStop(0.5, '#6b21a8');
      grad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SOCIAL MEDIA MARKETING STRATEGY', 400, 150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#f3e8ff';
      ctx.fillText('Organic Growth Funnels, Reels & Client Acquisition', 400, 200);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.roundRect(140, 270, 520, 260, 16);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#f0abfc';
      ctx.fillText('Agency Growth Deliverables:', 180, 320);

      ctx.font = '21px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• 3-Second Scroll-Stopping Video Hooks for Reels & TikTok', 180, 375);
      ctx.fillText('• Semantic Social SEO Optimization for Discovery Feeds', 180, 425);
      ctx.fillText('• Direct-Message Lead Funnels Converting Viewers into Clients', 180, 475);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#faf5ff';
      ctx.font = '22px sans-serif';
      ctx.fillText('📈 Turn Followers into Predictable Inbound Bookings', 400, 640);
      ctx.fillText('💼 DM "GROWTH" for Full Social Media Channel Audit', 400, 685);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
  {
    id: 'dental-clinic',
    title: 'Clinic: "Family Dental Care"',
    category: 'Healthcare & Business',
    language: 'English',
    description: 'Tests business identification, dental services, short relevant healthcare tags, and clinic slug.',
    brandExpected: 'Family Dental Clinic',
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      grad.addColorStop(0, '#042f2e');
      grad.addColorStop(0.5, '#115e59');
      grad.addColorStop(1, '#0f766e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 740, 740);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FAMILY DENTAL CARE CLINIC', 400, 150);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#99f6e4';
      ctx.fillText('Gentle Preventive Dentistry & Smile Whitening', 400, 200);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.roundRect(140, 270, 520, 260, 16);
      ctx.fill();
      ctx.strokeStyle = '#2dd4bf';
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#5eead4';
      ctx.fillText('Dental Patient Services:', 180, 320);

      ctx.font = '21px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('• Gentle Preventive Cleanings & Digital Screenings', 180, 375);
      ctx.fillText('• In-Office Professional Teeth Whitening Treatments', 180, 425);
      ctx.fillText('• Clear Aligners & Cosmetic Restorations', 180, 475);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ccfbf1';
      ctx.font = '22px sans-serif';
      ctx.fillText('🦷 Compassionate Care for Patients of All Ages', 400, 640);
      ctx.fillText('📞 Call to Book Your Dental Exam & Whitening Visit', 400, 685);

      return canvas.toDataURL('image/jpeg', 0.9);
    },
  },
];
