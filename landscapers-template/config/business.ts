// ============================================================
//  AGENCY SETUP — edit this file for each new client
//  Every piece of customer-facing content lives here.
//  Groq / automation: swap this file, rebuild, deploy.
// ============================================================

export const business = {
  // ── Identity ─────────────────────────────────────────────
  name: 'Diaz Gardening Services',
  shortName: 'Diaz Gardening',        // used in nav logo & footer
  tagline: 'Beautiful outdoor spaces for homes and businesses',
  phone: '(555) 123-4567',
  phoneHref: 'tel:+15551234567',
  email: 'hello@diazgardening.com',
  domain: 'https://diazgardening.com', // no trailing slash

  // ── Industry / vertical ───────────────────────────────────
  // Change these to adapt every copy reference across the site
  industry: 'landscaping',             // one word, lowercase
  industryLabel: 'Landscaping',        // title-cased, used in headings
  serviceNoun: 'service',              // "service" or "appointment" etc.
  proNoun: 'landscapers',             // "cleaners", "plumbers", etc.
  proNounSingular: 'landscaper',

  // ── Brand colors ─────────────────────────────────────────
  // These feed CSS custom properties so Tailwind picks them up at runtime.
  // Swap hex values for a full re-skin — no other file needs touching.
  colors: {
    accent: '#3a7d44',       // primary brand color (buttons, links, badges)
    accentDark: '#1e4d2b',   // hover / dark variant
    // Background tints derived from accent — keep these in the same hue family
    accentLight: '#f0faf1',  // light section backgrounds (replaces green-50)
    accentBorder: '#c6e8cb', // subtle borders (replaces green-100/200)
    accentFooter: '#166534', // footer background (replaces green-800)
    accentFooterBorder: '#15803d', // footer border (replaces green-700)
    accentFooterText: '#bbf7d0',   // footer body text (replaces green-200)
    accentFooterHeading: '#dcfce7', // footer headings (replaces green-100)
  },

  // ── Logo / icon ───────────────────────────────────────────
  // Set logoEmoji to '' and logoImagePath to a public/ path to use an image.
  logoEmoji: '🌿',
  logoImagePath: '',  // e.g. '/logo.svg' — leave empty to use emoji

  // ── Hero section ─────────────────────────────────────────
  hero: {
    badgeText: 'Professional Landscapers Since 2005',
    headline: 'Beautiful outdoor spaces for',
    headlineAccent: 'homes and businesses',
    subheadline:
      'Diaz Gardening Services transforms your property with expert lawn care, garden design, and reliable maintenance. Count on certified professionals for every job.',
    ctaPrimary: 'Request Service',
    ctaSecondary: 'View Our Services',
    socialProof: '⭐ 4.9/5 from 200+ customers',
    socialProof2: 'Trusted by homeowners and local businesses',
    bgImage: '/hero-bg.webp',
    bgImageAlt: 'Beautiful landscaped backyard at dusk',
  },

  // ── Owner / founder ───────────────────────────────────────
  owner: {
    name: 'Hector Diaz',
    title: 'Founder & Owner',
    photo: '/owner.webp',
    photoAlt: 'Hector Diaz, Owner of Diaz Gardening Services',
    yearsExperience: '20+',
    bio: [
      "What started as a summer job cutting neighbors' lawns turned into a lifelong career built on genuine love for the craft. With over 20 years of hands-on experience in residential and commercial landscaping, Hector has seen — and handled — just about every challenge a property can throw at you.",
      'Hector founded Diaz Gardening Services with a simple belief: that every customer deserves the same care and attention he would give his own home. That means showing up on time, communicating clearly, and never cutting corners — no matter the size of the job.',
      'From full backyard redesigns to weekly maintenance programs, Hector personally oversees every project to make sure the quality meets the standard Diaz Gardening has built its reputation on. When he is not on a job site, you will find him studying new planting techniques, training his crew, or spending time with his family outdoors.',
    ],
  },

  // ── About page copy ───────────────────────────────────────
  about: {
    tagline: 'About Diaz Gardening',
    headline: 'Built on hard work, rooted in craftsmanship',
    intro:
      'Diaz Gardening Services has been transforming outdoor spaces for homeowners and businesses across the region for over two decades. Everything we do is guided by one principle — if we would not be proud to put our name on it, we do not deliver it.',
    values: [
      {
        title: 'Local expertise',
        body: 'We know the local soil, climate, and plant life — which means better decisions and longer-lasting results for your property.',
      },
      {
        title: 'Quality workmanship',
        body: 'We use quality materials, proven methods, and precise detailing on every project. The standard never changes based on the size of the job.',
      },
      {
        title: 'Honest communication',
        body: 'Clear estimates, no surprise charges, and straight answers from the first call to the final cleanup. That is how we build lasting relationships.',
      },
    ],
  },

  // ── Services (FeaturesSection + booking form dropdown) ────
  services: [
    {
      title: 'Lawn Maintenance',
      description:
        'Regular mowing, edging, and trimming to keep your lawn looking neat and healthy year-round.',
      icon: 'Scissors',
    },
    {
      title: 'Residential Landscaping',
      description:
        'Custom garden design, sod installation, planting beds, and full front and backyard transformations.',
      icon: 'Home',
    },
    {
      title: 'Commercial Landscaping',
      description:
        'Reliable grounds maintenance, seasonal clean-ups, and landscape upkeep for businesses of all sizes.',
      icon: 'Building2',
    },
    {
      title: 'Garden Design',
      description:
        'Professional planting plans, flower beds, mulching, and seasonal color rotations.',
      icon: 'Flower2',
    },
    {
      title: 'Tree & Shrub Care',
      description:
        'Pruning, shaping, removal, and stump grinding to keep your trees and shrubs healthy and safe.',
      icon: 'Trees',
    },
    {
      title: 'Consultation / Quote',
      description:
        'Clear estimates, reliable communication, and friendly follow-through from first call to final cleanup.',
      icon: 'Headphones',
    },
  ],

  // ── Why Us section ────────────────────────────────────────
  whyUs: {
    tagline: 'Why Choose Diaz Gardening',
    headline: 'Trusted landscapers who put quality first',
    intro:
      'Our certified landscapers deliver beautiful results, honest pricing, and dependable service. Here\'s what makes Diaz Gardening the right choice.',
    points: [
      {
        title: 'Certified landscapers',
        description:
          'Our crew is fully certified, insured, and trained for residential and commercial landscaping projects of any size.',
      },
      {
        title: 'Transparent pricing',
        description:
          'You receive clear estimates, honest costs, and no surprise fees—just dependable landscaping service.',
      },
      {
        title: 'Quality-first craftsmanship',
        description:
          'We use premium materials, proven techniques, and leave your property looking pristine after every visit.',
      },
      {
        title: 'Reliable scheduling',
        description:
          'From one-time cleanups to recurring maintenance plans, we show up on time and get the job done right.',
      },
    ],
    outro:
      'When you choose Diaz Gardening, you get landscaping done right the first time—beautiful, reliable, and built to last.',
  },

  // ── Pricing ───────────────────────────────────────────────
  pricing: {
    tagline: 'Transparent Pricing',
    headline: 'Our Packages',
    intro:
      'Transparent pricing for landscaping packages. All estimates are clear, upfront, and tailored to your property.',
    outro:
      'Not sure which service is right? Contact us for a free consultation and custom landscaping estimate.',
    plans: [
      {
        name: 'Lawn Care Visit',
        price: '$89',
        description: 'One-time lawn maintenance for a clean, manicured look.',
        features: [
          'Mowing & edging',
          'Trimming along borders',
          'Blowing of clippings',
          'Weed control check',
          'Debris cleanup',
          'Property walkthrough',
          'No-obligation follow-up estimate',
        ],
        cta: 'Book a Visit',
        featured: false,
      },
      {
        name: 'Full Landscape Design',
        price: '$1,500',
        description:
          'Ideal for new installs, full yard makeovers, and garden transformations.',
        features: [
          'Custom design consultation',
          'Sod or seed installation',
          'Planting beds & flowers',
          'Mulch & edging',
          'Irrigation check & setup',
          '1 year plant guarantee',
        ],
        cta: 'Get a Quote',
        featured: true,
      },
      {
        name: 'Maintenance Plan',
        price: 'Custom',
        description:
          'Ongoing care and seasonal service for residential or commercial properties.',
        features: [
          'Recurring lawn maintenance',
          'Seasonal clean-ups',
          'Fertilization & weed control',
          'Shrub & tree trimming',
          'Leaf removal',
          'Priority scheduling',
          'Service agreements',
        ],
        cta: 'Schedule Consultation',
        featured: false,
      },
    ],
  },

  // ── CTA section ───────────────────────────────────────────
  cta: {
    headline: 'Ready to transform your outdoor space?',
    subheadline:
      'Reach out for professional landscaping service for your home or business.',
    ctaPrimary: 'Request a Quote',
    ctaSecondary: 'View Services',
  },

  // ── Service area ─────────────────────────────────────────
  serviceArea: {
    city: 'Long Beach',
    state: 'CA',
    headline: 'Proudly serving\nLong Beach & surrounding cities',
    intro:
      'Diaz Gardening Services is based in Long Beach, CA. Our certified landscapers serve homes and businesses across the city and neighboring communities — fast response times, no long drives, and deep familiarity with local soil and climate conditions.',
    neighborhoods: [
      'Downtown Long Beach',
      'Belmont Shore',
      'Bixby Knolls',
      'California Heights',
      'East Village',
      'Lakewood Village',
      'Los Altos',
      'Naples Island',
      'North Long Beach',
      'Park Estates',
      'Signal Hill',
      'Wrigley',
    ],
    nearbyCities: [
      'Lakewood',
      'Compton',
      'Carson',
      'Torrance',
      'Paramount',
      'Bellflower',
    ],
    mapEmbedUrl: '', // paste a Google Maps embed src here if desired
  },

  // ── Testimonials ─────────────────────────────────────────
  testimonials: [
    {
      quote:
        'Our backyard went from an eyesore to our favorite room in the house. The team was professional and fast.',
      name: 'Maria T.',
      location: 'Long Beach, CA',
    },
    {
      quote:
        'We have been on their maintenance plan for two years. Our lawn has never looked better and they always show up on time.',
      name: 'James R.',
      location: 'Lakewood, CA',
    },
    {
      quote:
        'Great communication, fair pricing, and the results speak for themselves. Highly recommend Diaz Gardening.',
      name: 'Sandra K.',
      location: 'Torrance, CA',
    },
  ],

  // ── FAQs ─────────────────────────────────────────────────
  faqs: [
    {
      question: 'How much does lawn care cost in Long Beach, CA?',
      answer:
        'Our standard lawn care visits start at $89. Pricing depends on the size of your property and the services needed. We offer free on-site quotes so you always know the exact cost before any work begins — no surprise fees.',
    },
    {
      question: 'Do you offer free estimates?',
      answer:
        'Yes. We offer free consultations and estimates for all new customers. You can book a consultation directly through our website or call us at (555) 123-4567. We will visit your property, assess the work, and give you a clear, written quote.',
    },
    {
      question: 'What areas do you serve?',
      answer:
        'We serve Long Beach and the surrounding areas including Lakewood, Signal Hill, Torrance, Redondo Beach, Compton, and Carson. If you are not sure whether we cover your area, give us a call and we will let you know.',
    },
    {
      question: 'How often should I have my lawn maintained?',
      answer:
        'For most Southern California lawns, weekly or bi-weekly maintenance is ideal during spring and summer growing seasons. In fall and winter, every 3-4 weeks is usually sufficient. We will recommend the right frequency based on your grass type, irrigation setup, and goals.',
    },
    {
      question: 'Do you work with commercial properties?',
      answer:
        'Absolutely. We provide commercial grounds maintenance, seasonal planting, mulching, and irrigation management for office complexes, retail centers, HOAs, and apartment communities. We schedule work during off-hours to avoid disrupting your tenants or customers.',
    },
    {
      question: 'What is included in a full landscape design?',
      answer:
        'A full landscape design includes an on-site consultation, a custom design plan, plant and material selection, site preparation, installation, and a final walkthrough. We handle everything from grading and irrigation to planting and hardscape. Pricing starts at $1,500 depending on scope.',
    },
    {
      question: 'Are your landscapers licensed and insured?',
      answer:
        'Yes. Diaz Gardening Services is fully licensed and insured. All of our crew members are trained professionals. You are protected on every job — no exceptions.',
    },
    {
      question: 'How do I book an appointment?',
      answer:
        'You can book directly on our website using the Book Appointment button — pick your service, choose a date and time that works for you, and fill in your contact details. It takes less than 2 minutes. You can also call us at (555) 123-4567.',
    },
  ],

  // ── Our Work page ─────────────────────────────────────────
  ourWork: {
    tagline: 'Our Work',
    headline: 'Projects we are proud of',
    intro:
      'Every property is different. Browse a selection of real landscaping projects we have completed for homeowners and businesses across Long Beach and surrounding areas.',
    categories: ['All', 'Residential Design', 'Commercial Maintenance', 'Ongoing Maintenance', 'Tree Care'],
    testimonialHeadline: 'Trusted by homeowners and businesses',
  },

  // ── Contact page ─────────────────────────────────────────
  contact: {
    tagline: 'Contact Diaz Gardening',
    headline: 'Ready for a beautiful yard? Get a free quote today',
    intro:
      'Call or message us for lawn care, garden design, clean-ups, or ongoing maintenance. Our certified landscapers will respond quickly.',
    calloutHeading: 'Prefer to call? We\'re here to help.',
    calloutBody:
      'Call us directly at {phone} or email {email}. If we don\'t pick up, please fill out the form and we\'ll respond as soon as possible.',
    formPlaceholderMessage: 'Describe your landscaping project or service needed',
  },

  // ── Home page nav cards ───────────────────────────────────
  homeNavCards: [
    {
      href: '/about',
      title: 'About Diaz Gardening',
      description:
        'Discover our certified landscapers, local service area, and commitment to quality and craftsmanship.',
    },
    {
      href: '/services',
      title: 'Services',
      description:
        'See the full range of landscaping services, from lawn care and garden design to tree work and maintenance plans.',
    },
    {
      href: '/our-work',
      title: 'Our Work',
      description:
        'Browse real projects we have completed for homeowners and businesses across the area.',
    },
    {
      href: '/why-us',
      title: 'Why Us',
      description:
        'Learn why homeowners and businesses trust us for beautiful, dependable landscaping service.',
    },
  ],

  // ── Home page section copy ────────────────────────────────
  homeSection: {
    tagline: 'Explore Diaz Gardening',
    headline: 'Everything you need to know about us.',
    intro:
      'Discover our certified landscapers, transparent packages, and why local customers choose Diaz Gardening for beautiful, reliable outdoor work.',
  },

  // ── SEO ───────────────────────────────────────────────────
  seo: {
    titleSuffix: 'Diaz Gardening Services',
    defaultDescription:
      'Diaz Gardening Services provides professional lawn care, residential landscaping, garden design, and commercial grounds maintenance in Long Beach, CA. 20+ years of experience. Book online today.',
    keywords: [
      'landscaping Long Beach',
      'lawn care Long Beach CA',
      'landscape design',
      'garden design',
      'commercial landscaping',
      'lawn maintenance',
      'tree care',
      'Diaz Gardening Services',
    ],
    faviconEmoji: '🌿',
  },

  // ── Booking (Supabase) ────────────────────────────────────
  // Fill these in per client — get values from Supabase → Settings → API
  supabaseUrl: '',
  supabaseAnonKey: '',
  // WARNING: never expose this on a public/client-facing page — admin only
  supabaseServiceKey: '',

  adminPassword: '',

  availableDays: [1, 2, 3, 4, 5], // Mon–Fri (0=Sun, 6=Sat)
  timeSlots: [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  ],
  bookingWindowDays: 60,

  // ── Google integrations ───────────────────────────────────
  googleReviewUrl: '', // e.g. 'https://g.page/r/YOUR_PLACE_ID/review'
  googlePlaceId: '',   // e.g. 'ChIJ...' — used for SEO structured data
}
