export type Language = "en" | "de" | "es";

export const translations = {
  // Navigation
  nav: {
    about: { en: "About", de: "Über uns", es: "Acerca de" },
    support: { en: "Support", de: "Unterstützung", es: "Apoyo" },
    audience: { en: "Audience", de: "Publikum", es: "Audiencia" },
    contacts: { en: "Contacts", de: "Kontakte", es: "Contactos" },
    // Participant nav items
    schedule: { en: "Schedule", de: "Zeitplan", es: "Cronograma" },
    criteria: { en: "Criteria", de: "Kriterien", es: "Criterios" },
    register: { en: "Register", de: "Registrieren", es: "Registro" },
    dashboard: { en: "Dashboard", de: "Dashboard", es: "Panel" },
  },

  // Hero Section
  hero: {
    tag: {
      en: "YOUR DATES • YOUR CITY", de: "DEINE TERMINE • DEINE STADT", es: "TUS FECHAS • TU CIUDAD",
    },
    title: { en: "48H", de: "48H", es: "48H" },
    subtitle: { en: "AI HACKATHON", de: "KI-HACKATHON", es: "HACKATHON DE IA" },
    description: {
      en: "Partnership Proposal", de: "Partnerschaftsvorschlag", es: "Propuesta de asociación",
    },
    format: { en: "Format", de: "Format", es: "Formato" },
    formatDesc: {
      en: "4-hour AI agent speedrun", de: "4-stündiger KI-Agenten-Speedrun", es: "Speedrun de agente de IA de 4 horas",
    },
    supportTitle: { en: "Support", de: "Unterstützung", es: "Apoyo" },
    supportDesc: {
      en: "Support from partners who help run open, community-driven hackathons.", de: "Unterstützung durch Partner, die offene, gemeinschaftlich organisierte Hackathons ermöglichen.", es: "Apoyo de socios que impulsan hackathons abiertos y centrados en la comunidad.",
    },
    ministry: {
      en: "Partner organizations", de: "Partnerorganisationen", es: "Organizaciones asociadas",
    },
  },

  // About Section
  about: {
    tag: { en: "48H", de: "48H", es: "48H" },
    title: {
      en: "About the Project", de: "Über das Projekt", es: "Acerca del proyecto",
    },
    feature1Title: {
      en: "4 hours to ship", de: "4 Stunden bis zum Ship", es: "4 horas para entregar",
    },
    feature1Desc: {
      en: "High-intensity speedrun building real AI agents with modern AI tools.", de: "Hochintensiver Speedrun zum Entwickeln echter KI-Agenten mit Cursor und Deep Agents.", es: "Speedrun de alta intensidad construyendo agentes de IA reales con Cursor y Deep Agents.",
    },
    feature2Title: {
      en: "Practical AI solutions", de: "Praktische KI-Lösungen", es: "Soluciones prácticas de IA",
    },
    feature2Desc: {
      en: "Focus on working technologies, not checkbox prototypes.", de: "Konzentrieren Sie sich auf funktionierende Technologien, nicht auf Checkbox-Prototypen.", es: "Céntrese en las tecnologías que funcionan, no en los prototipos de casillas de verificación.",
    },
    feature3Title: {
      en: "Selection of best teams", de: "Auswahl der besten Teams", es: "Selección de los mejores equipos.",
    },
    feature3Desc: {
      en: "15-20 selected teams with strong technical background.", de: "15–20 ausgewählte Teams mit starkem technischen Hintergrund.", es: "15-20 equipos seleccionados con sólida formación técnica.",
    },
    feature4Title: {
      en: "Public finale", de: "Öffentliches Finale", es: "final publico",
    },
    feature4Desc: {
      en: "Project presentations to live audience, experts and investors.", de: "Projektpräsentationen vor Live-Publikum, Experten und Investoren.", es: "Presentaciones de proyectos ante audiencia en vivo, expertos e inversores.",
    },
    stat1Value: { en: "4", de: "4", es: "4" },
    stat1Unit: { en: "h", de: "H", es: "h" },
    stat1Label: {
      en: "Non-stop coding", de: "Non-Stop-Codierung", es: "Codificación sin parar",
    },
    stat2Value: { en: "20", de: "20", es: "20" },
    stat2Label: {
      en: "Teams in finale", de: "Teams im Finale", es: "Equipos en final",
    },
    stat3Value: { en: "100+", de: "100+", es: "100+" },
    stat3Label: {
      en: "Talented participants", de: "Talentierte Teilnehmer", es: "Participantes talentosos",
    },
    goalLabel: { en: "Main Goal", de: "Hauptziel", es: "Objetivo principal" },
    goalText: {
      en: "Create a hub for AI talent, business and industry, uniting efforts for technological breakthrough.", de: "Schaffen Sie eine Drehscheibe für KI-Talente, Unternehmen und Industrie und bündeln Sie die Bemühungen für einen technologischen Durchbruch.", es: "Crear un centro para el talento, las empresas y la industria de la IA, uniendo esfuerzos para lograr avances tecnológicos.",
    },
  },

  // Support Section
  support: {
    tag: {
      en: "IMPORTANT CONTEXT", de: "WICHTIGER KONTEXT", es: "CONTEXTO IMPORTANTE",
    },
    title: {
      en: "Support and Trust", de: "Unterstützung und Vertrauen", es: "Apoyo y confianza",
    },
    card1Title: {
      en: "Institutional Support", de: "Institutionelle Unterstützung", es: "Apoyo Institucional",
    },
    card1Desc: {
      en: "Official event status and assistance in attracting key market players and government structures.", de: "Offizieller Veranstaltungsstatus und Unterstützung bei der Gewinnung wichtiger Marktteilnehmer und Regierungsstrukturen.", es: "Estado oficial del evento y asistencia para atraer actores clave del mercado y estructuras gubernamentales.",
    },
    card2Title: {
      en: "Government Priorities", de: "Regierungsprioritäten", es: "Prioridades del gobierno",
    },
    card2Desc: {
      en: "Alignment with widely shared strategic goals for AI and IT industry development.", de: "Ausrichtung an weithin geteilten strategischen Zielen für die Entwicklung von KI und IT-Branche.", es: "Alineación con objetivos estratégicos ampliamente compartidos para el desarrollo de la IA y la industria TI.",
    },
    card3Title: {
      en: "Media & Industry Interest", de: "Medien- und Brancheninteresse", es: "Interés de los medios y la industria",
    },
    card3Desc: {
      en: "Increased attention from specialized media, opinion leaders and tech companies due to high status.", de: "Erhöhte Aufmerksamkeit von Fachmedien, Meinungsführern und Technologieunternehmen aufgrund des hohen Status.", es: "Mayor atención por parte de medios especializados, líderes de opinión y empresas tecnológicas debido al alto estatus.",
    },
    card4Title: {
      en: "High Level of Trust", de: "Hohes Maß an Vertrauen", es: "Alto nivel de confianza",
    },
    card4Desc: {
      en: "Quality guarantee for participants and investment reliability for partners.", de: "Qualitätsgarantie für Teilnehmer und Investitionssicherheit für Partner.", es: "Garantía de calidad para los participantes y confiabilidad de la inversión para los socios.",
    },
  },

  // Audience Section
  audience: {
    tag: {
      en: "WHO PARTICIPATES AND WHO WATCHES", de: "WER TEILNEHMT UND WER ZUSEHT", es: "QUIÉN PARTICIPA Y QUIÉN MIRA",
    },
    title: {
      en: "Hackathon Audience", de: "Hackathon-Publikum", es: "Audiencia del hackatón",
    },
    participantsTitle: {
      en: "Participants", de: "Teilnehmer", es: "Participantes",
    },
    participant1: {
      en: "AI / ML Engineers", de: "KI-/ML-Ingenieure", es: "Ingenieros de IA/ML",
    },
    participant2: {
      en: "Backend & Full-stack Developers", de: "Backend- und Full-Stack-Entwickler", es: "Desarrolladores backend y full-stack",
    },
    participant3: {
      en: "Startup Teams", de: "Startup-Teams", es: "Equipos de inicio",
    },
    participant4: {
      en: "Technical Leads", de: "Technische Leads", es: "Líderes técnicos",
    },
    viewersTitle: {
      en: "Viewers (Day 3)", de: "Zuschauer (Tag 3)", es: "Espectadores (Día 3)",
    },
    viewer1: {
      en: "Registered Guests", de: "Registrierte Gäste", es: "Invitados registrados",
    },
    viewer2: {
      en: "IT Company Representatives", de: "Vertreter von IT-Unternehmen", es: "Representantes de empresas de TI",
    },
    viewer3: {
      en: "Startup Community", de: "Startup-Community", es: "Comunidad de inicio",
    },
    viewer4: {
      en: "Industry Experts", de: "Branchenexperten", es: "Expertos de la industria",
    },
    note: {
      en: "Finale — open format", de: "Finale – offenes Format", es: "Final – formato abierto",
    },
    noteDesc: {
      en: "with live audience, project presentations and active networking after the awards.", de: "mit Live-Publikum, Projektpräsentationen und aktivem Networking nach der Preisverleihung.", es: "con audiencia en vivo, presentaciones de proyectos y networking activo después de la premiación.",
    },
  },

  // Media/PR Section
  media: {
    tag: { en: "REACH AND PR", de: "REICHWEITE UND PR", es: "ALCANCE Y RRPP" },
    title: { en: "Media Effect", de: "Medieneffekt", es: "Efecto multimedia" },
    subtitle: {
      en: "We provide comprehensive promotion through targeted channels, creating high value for partners.", de: "Wir bieten umfassende Werbung über gezielte Kanäle und schaffen so einen hohen Mehrwert für unsere Partner.", es: "Brindamos promoción integral a través de canales específicos, creando un alto valor para los socios.",
    },
    telegram: {
      en: "Telegram Channels", de: "Telegrammkanäle", es: "Canales de telegramas",
    },
    telegramItems: {
      en: [
        "Specialized communities (IT / AI)",
        "Startup channels",
        "Direct access to tech audience",
      ], de: [
        "Specialized communities (IT / AI)",
        "Startup channels",
        "Direct access to tech audience",
      ], es: [
        "Specialized communities (IT / AI)",
        "Startup channels",
        "Direct access to tech audience",
      ],
    },
    partners: {
      en: "Partner Network", de: "Partnernetzwerk", es: "Red de socios",
    },
    partnersItems: {
      en: [
        "Cross-promo in partner channels",
        "Newsletters to participant databases",
        "Joint announcements",
      ], de: [
        "Cross-promo in partner channels",
        "Newsletters to participant databases",
        "Joint announcements",
      ], es: [
        "Cross-promo in partner channels",
        "Newsletters to participant databases",
        "Joint announcements",
      ],
    },
    onlineMedia: { en: "Online Media", de: "Online-Medien", es: "Medios en línea" },
    onlineMediaItems: {
      en: [
        "Announcement publications",
        "Post-release with results",
        "Winner interviews",
      ], de: [
        "Announcement publications",
        "Post-release with results",
        "Winner interviews",
      ], es: [
        "Announcement publications",
        "Post-release with results",
        "Winner interviews",
      ],
    },
    content: { en: "Photo & Video", de: "Foto & Video", es: "Foto y vídeo" },
    contentItems: {
      en: [
        "Professional photo report",
        "Hackathon video diaries",
        "Reels / Shorts for social media",
      ], de: [
        "Professional photo report",
        "Hackathon video diaries",
        "Reels / Shorts for social media",
      ], es: [
        "Professional photo report",
        "Hackathon video diaries",
        "Reels / Shorts for social media",
      ],
    },
    results: {
      en: "Final Materials", de: "Endgültige Materialien", es: "Materiales finales",
    },
    resultsItems: {
      en: [
        "Mention in all reports",
        "Logos on landing page",
        "Thank you letters",
      ], de: [
        "Mention in all reports",
        "Logos on landing page",
        "Thank you letters",
      ], es: [
        "Mention in all reports",
        "Logos on landing page",
        "Thank you letters",
      ],
    },
    offline: {
      en: "Offline & Brand", de: "Offline & Marke", es: "Sin conexión y marca",
    },
    offlineItems: {
      en: [
        "Live audience at finale",
        "Venue branding",
        "Organic presence in environment",
      ], de: [
        "Live audience at finale",
        "Venue branding",
        "Organic presence in environment",
      ], es: [
        "Live audience at finale",
        "Venue branding",
        "Organic presence in environment",
      ],
    },
  },

  // Partner Benefits Section
  benefits: {
    tag: {
      en: "Participation Value", de: "Beteiligungswert", es: "Valor de participación",
    },
    title: {
      en: "What Does a Partner Get?", de: "Was bekommt ein Partner?", es: "¿Qué obtiene un socio?",
    },
    formulaLabel: {
      en: "Success Formula", de: "Erfolgsformel", es: "Fórmula del éxito",
    },
    formulaResult: {
      en: "Maximum ROI", de: "Maximaler ROI", es: "Máximo retorno de la inversión",
    },
    benefit1Title: {
      en: "Brand Visibility", de: "Markensichtbarkeit", es: "Visibilidad de la marca",
    },
    benefit1Desc: {
      en: "Positioning at the center of AI community and association with cutting-edge technologies.", de: "Positionierung im Zentrum der KI-Community und Verbindung mit Spitzentechnologien.", es: "Posicionamiento en el centro de la comunidad de IA y asociación con tecnologías de vanguardia.",
    },
    benefit2Title: {
      en: "Direct Contact", de: "Direkter Kontakt", es: "Contacto directo",
    },
    benefit2Desc: {
      en: "Access to strong specialists (Middle+/Senior) in hackathon working atmosphere.", de: "Zugang zu starken Spezialisten (Middle+/Senior) in Hackathon-Arbeitsatmosphäre.", es: "Acceso a fuertes especialistas (Middle+/Senior) en un ambiente de trabajo de hackathon.",
    },
    benefit3Title: {
      en: "Industry Shaping", de: "Branchengestaltung", es: "Conformación de la industria",
    },
    benefit3Desc: {
      en: "Influence on industry development and support for promising startup ideas at early stage.", de: "Influence on industry development and support for promising startup ideas at early stage.", es: "Influence on industry development and support for promising startup ideas at early stage.",
    },
    benefit4Title: {
      en: "PR Without Direct Ads", de: "PR Without Direct Ads", es: "PR Without Direct Ads",
    },
    benefit4Desc: {
      en: "Native brand integration through value, mentorship and expert support.", de: "Native brand integration through value, mentorship and expert support.", es: "Native brand integration through value, mentorship and expert support.",
    },
    benefit5Title: {
      en: "Talent Access", de: "Talent Access", es: "Talent Access",
    },
    benefit5Desc: {
      en: "Opportunity to recruit best teams and individual developers right at the venue.", de: "Opportunity to recruit best teams and individual developers right at the venue.", es: "Opportunity to recruit best teams and individual developers right at the venue.",
    },
  },

  // Jury Section
  jury: {
    tag: {
      en: "KEY ADVANTAGE", de: "KEY ADVANTAGE", es: "KEY ADVANTAGE",
    },
    title: {
      en: "Jury Membership", de: "Jury Membership", es: "Jury Membership",
    },
    description: {
      en: "Partners get exclusive right to evaluate projects, influence hackathon results and directly interact with the best teams.", de: "Partners get exclusive right to evaluate projects, influence hackathon results and directly interact with the best teams.", es: "Partners get exclusive right to evaluate projects, influence hackathon results and directly interact with the best teams.",
    },
    targetLabel: {
      en: "Ideal for:", de: "Ideal for:", es: "Ideal for:",
    },
    target1: { en: "IT Companies", de: "IT Companies", es: "IT Companies" },
    target2: { en: "Banks", de: "Banks", es: "Banks" },
    target3: { en: "Corporations", de: "Corporations", es: "Corporations" },
    target4: {
      en: "Venture Funds", de: "Venture Funds", es: "Venture Funds",
    },
    card1Title: {
      en: "Expert Brand Status", de: "Expert Brand Status", es: "Expert Brand Status",
    },
    card1Desc: {
      en: "Confirm your company's technological expertise in professional community.", de: "Confirm your company's technological expertise in professional community.", es: "Confirm your company's technological expertise in professional community.",
    },
    card2Title: {
      en: "Influence on Selection", de: "Influence on Selection", es: "Influence on Selection",
    },
    card2Desc: {
      en: "Take direct part in selecting winners and best technological solutions.", de: "Take direct part in selecting winners and best technological solutions.", es: "Take direct part in selecting winners and best technological solutions.",
    },
    card3Title: {
      en: "Team Communication", de: "Team Communication", es: "Team Communication",
    },
    card3Desc: {
      en: "Personal networking with finalists, opportunity to ask questions and evaluate participants' soft skills.", de: "Personal networking with finalists, opportunity to ask questions and evaluate participants' soft skills.", es: "Personal networking with finalists, opportunity to ask questions and evaluate participants' soft skills.",
    },
    card4Title: {
      en: "Industry Leader Position", de: "Industry Leader Position", es: "Industry Leader Position",
    },
    card4Desc: {
      en: "Public positioning of your company as innovation driver and AI industry development leader.", de: "Public positioning of your company as innovation driver and AI industry development leader.", es: "Public positioning of your company as innovation driver and AI industry development leader.",
    },
  },

  // Partner Package Section
  package: {
    tag: {
      en: "Partner Package", de: "Partner Package", es: "Partner Package",
    },
    preTitle: { en: "48H", de: "48H", es: "48H" },
    title: {
      en: "General Partner", de: "General Partner", es: "General Partner",
    },
    description: {
      en: "Exclusive status for companies ready to lead the technology agenda and get maximum effect from cooperation.", de: "Exclusive status for companies ready to lead the technology agenda and get maximum effect from cooperation.", es: "Exclusive status for companies ready to lead the technology agenda and get maximum effect from cooperation.",
    },
    badge: {
      en: "Maximum Impact", de: "Maximum Impact", es: "Maximum Impact",
    },
    item1: {
      en: "Event Partner Status", de: "Event Partner Status", es: "Event Partner Status",
    },
    item1Sub: {
      en: "Exclusive top-tier positioning", de: "Exclusive top-tier positioning", es: "Exclusive top-tier positioning",
    },
    item2: {
      en: "Logo on All Materials", de: "Logo on All Materials", es: "Logo on All Materials",
    },
    item2Sub: {
      en: "Website, banners, merch, press wall", de: "Website, banners, merch, press wall", es: "Website, banners, merch, press wall",
    },
    item3: {
      en: "Jury Representative", de: "Jury Representative", es: "Jury Representative",
    },
    item3Sub: {
      en: "Direct influence on winner selection", de: "Direct influence on winner selection", es: "Direct influence on winner selection",
    },
    item4: {
      en: "Speaking & Mentorship", de: "Speaking & Mentorship", es: "Speaking & Mentorship",
    },
    item4Sub: {
      en: "Keynotes, workshops and team consultations", de: "Keynotes, workshops and team consultations", es: "Keynotes, workshops and team consultations",
    },
    item5: {
      en: "Maximum PR Integration", de: "Maximum PR Integration", es: "Maximum PR Integration",
    },
    item5Sub: {
      en: "Mentions in media, social networks and newsletters", de: "Mentions in media, social networks and newsletters", es: "Mentions in media, social networks and newsletters",
    },
    item6: {
      en: "Direct Team Contact", de: "Direct Team Contact", es: "Direct Team Contact",
    },
    item6Sub: {
      en: "Access to participant database and HR opportunities", de: "Access to participant database and HR opportunities", es: "Access to participant database and HR opportunities",
    },
  },

  // Brand Integration Section
  brand: {
    tag: {
      en: "BRAND INTEGRATION", de: "BRAND INTEGRATION", es: "BRAND INTEGRATION",
    },
    title: {
      en: "Where Your Brand Will Be", de: "Where Your Brand Will Be", es: "Where Your Brand Will Be",
    },
    subtitle: {
      en: "We create an ecosystem of partner presence at all stages of audience communication", de: "We create an ecosystem of partner presence at all stages of audience communication", es: "We create an ecosystem of partner presence at all stages of audience communication",
    },
    stage: {
      en: "Presentations & Stage", de: "Presentations & Stage", es: "Presentations & Stage",
    },
    stageItems: {
      en: [
        "Logo on main stage screen",
        "Mention by event host",
        "Team presentation zone branding",
      ], de: [
        "Logo on main stage screen",
        "Mention by event host",
        "Team presentation zone branding",
      ], es: [
        "Logo on main stage screen",
        "Mention by event host",
        "Team presentation zone branding",
      ],
    },
    online: {
      en: "Online Materials", de: "Online Materials", es: "Online Materials",
    },
    onlineItems: {
      en: [
        "Logo on landing with active link",
        "Banners in participant newsletters",
        "Integration in online broadcast",
      ], de: [
        "Logo on landing with active link",
        "Banners in participant newsletters",
        "Integration in online broadcast",
      ], es: [
        "Logo on landing with active link",
        "Banners in participant newsletters",
        "Integration in online broadcast",
      ],
    },
    photo: { en: "Photo & Video", de: "Foto & Video", es: "Foto y vídeo" },
    photoItems: {
      en: [
        "Watermarks on photo reports",
        "Bumpers in final video",
        "Interviews with Press Wall backdrop",
      ], de: [
        "Watermarks on photo reports",
        "Bumpers in final video",
        "Interviews with Press Wall backdrop",
      ], es: [
        "Watermarks on photo reports",
        "Bumpers in final video",
        "Interviews with Press Wall backdrop",
      ],
    },
    mediaIntegration: {
      en: "Media & Telegram", de: "Media & Telegram", es: "Media & Telegram",
    },
    mediaItems: {
      en: [
        "Mention in press releases",
        "Tagging in social media posts",
        "Reposts to partner channels",
      ], de: [
        "Mention in press releases",
        "Tagging in social media posts",
        "Reposts to partner channels",
      ], es: [
        "Mention in press releases",
        "Tagging in social media posts",
        "Reposts to partner channels",
      ],
    },
    offlinePresence: {
      en: "Offline Presence", de: "Offline Presence", es: "Offline Presence",
    },
    offlineItems: {
      en: [
        "Logo on Press Wall",
        "Roll-up placement",
        "Handout material branding",
      ], de: [
        "Logo on Press Wall",
        "Roll-up placement",
        "Handout material branding",
      ], es: [
        "Logo on Press Wall",
        "Roll-up placement",
        "Handout material branding",
      ],
    },
    networking: { en: "Networking", de: "Networking", es: "Networking" },
    networkingItems: {
      en: [
        "VIP zone access for representatives",
        "Participation in coffee breaks with teams",
        "Logo on participant badges",
      ], de: [
        "VIP zone access for representatives",
        "Participation in coffee breaks with teams",
        "Logo on participant badges",
      ], es: [
        "VIP zone access for representatives",
        "Participation in coffee breaks with teams",
        "Logo on participant badges",
      ],
    },
  },

  // Timeline Section
  timeline: {
    tag: { en: "NEXT STEP", de: "NEXT STEP", es: "NEXT STEP" },
    title: {
      en: "Timeline & Cooperation", de: "Timeline & Cooperation", es: "Timeline & Cooperation",
    },
    event1Date: { en: "DAY 1", de: "TAG 1", es: "DÍA 1" },
    event1Title: {
      en: "Hackathon Start", de: "Hackathon Start", es: "Hackathon Start",
    },
    event1Desc: {
      en: "Start of 4-hour speedrun. Team up, brief revealed, starter kit walkthrough.", de: "Start of 4-hour speedrun. Team up, brief revealed, starter kit walkthrough.", es: "Inicio del speedrun de 4 horas. Forma tu equipo, brief revelado, walkthrough del starter kit.",
    },
    event2Date: { en: "DAY 2", de: "TAG 2", es: "DÍA 2" },
    event2Title: {
      en: "Build, 4 hours", de: "Build, 4 Stunden", es: "Build, 4 horas",
    },
    event2Desc: {
      en: "Intensive work on-site, mentor sessions, checkpoints with experts.", de: "Intensive work on-site, mentor sessions, checkpoints with experts.", es: "Intensive work on-site, mentor sessions, checkpoints with experts.",
    },
    event3Date: { en: "DAY 3", de: "TAG 3", es: "DÍA 3" },
    event3Title: { en: "Open Finale", de: "Open Finale", es: "Open Finale" },
    event3Desc: {
      en: "Project pitches to jury and viewers. Awards and networking.", de: "Project pitches to jury and viewers. Awards and networking.", es: "Project pitches to jury and viewers. Awards and networking.",
    },
    flexNote: {
      en: "Flexible approach:", de: "Flexible approach:", es: "Flexible approach:",
    },
    flexDesc: {
      en: "We are ready to adapt partnership format and integrations to your company's specific business objectives.", de: "We are ready to adapt partnership format and integrations to your company's specific business objectives.", es: "We are ready to adapt partnership format and integrations to your company's specific business objectives.",
    },
    ctaTitle: {
      en: "Let's Discuss Cooperation", de: "Let's Discuss Cooperation", es: "Let's Discuss Cooperation",
    },
    telegram: { en: "Telegram", de: "Telegram", es: "Telegram" },
    email: { en: "Email", de: "Email", es: "Email" },
    phone: { en: "Phone", de: "Phone", es: "Phone" },
  },

  // Footer
  footer: {
    rights: {
      en: "© 2026 48H. All rights reserved.", de: "© 2026 48H. All rights reserved.", es: "© 2026 48H. All rights reserved.",
    },
  },

  // ============================================
  // PARTICIPANT PAGE TRANSLATIONS
  // ============================================

  // Sponsors Section (above hero)
  sponsors: {
    sectionLabel: {
      en: "Sponsors", de: "Sponsors", es: "Sponsors",
    },
    tag: {
      en: "Partners", de: "Partner", es: "Socios",
    },
    title: {
      en: "Our Sponsors", de: "Our Sponsors", es: "Our Sponsors",
    },
    leadingPartnerLabel: {
      en: "Leading Partner", de: "Hauptpartner", es: "Socio principal",
    },
    sponsorsLabel: {
      en: "Sponsors", de: "Sponsors", es: "Sponsors",
    },
    coOrganizersLabel: {
      en: "Co-organizers", de: "Co-organizers", es: "Co-organizers",
    },
    socialSponsorsLabel: {
      en: "Media & Social Partners", de: "Media & Social Partners", es: "Media & Social Partners",
    },
  },

  // Participant Hero Section
  participantHero: {
    date: { en: "DOORS AT 4PM", de: "EINLASS 16 UHR", es: "PUERTAS A LAS 4PM" },
    location: { en: "BEGINNER-FRIENDLY", de: "ANFÄNGERFREUNDLICH", es: "PARA PRINCIPIANTES" },
    title: { en: "AI HACKATHON", de: "AI HACKATHON", es: "AI HACKATHON" },
    subtitle: { en: "Your City's First Ever", de: "Der Erste deiner Stadt", es: "El primero de tu ciudad" },
    description: {
      en: "It's time. We're throwing a hackathon — and the only thing missing is you. It's beginner-friendly on purpose: no degree, no team, no idea required. We hand you the tools, pair you up, and by the time the clock hits 10:30 you'll have shipped something real.", de: "Es ist soweit. Wir veranstalten einen Hackathon — und das Einzige, was fehlt, bist du. Bewusst anfängerfreundlich: kein Abschluss, kein Team, keine Idee nötig. Wir geben dir die Tools, bringen dich mit anderen zusammen, und bis 22:30 Uhr hast du etwas Echtes gebaut.", es: "Es la hora. Organizamos un hackathon — y lo único que falta eres tú. Es para principiantes a propósito: sin título, sin equipo, sin idea previa. Te damos las herramientas, te emparejamos, y para las 10:30 habrás lanzado algo real.",
    },
    hours: { en: "HOURS", de: "HOURS", es: "HOURS" },
    teams: { en: "PAIR UP OR SOLO", de: "IM TEAM ODER SOLO", es: "EN PAREJA O SOLO" },
    prize: { en: "CASH + CREDITS", de: "CASH + CREDITS", es: "EFECTIVO + CRÉDITOS" },
    cta: { en: "Apply Now", de: "Apply Now", es: "Apply Now" },
    supportedBy: {
      en: "Supported by", de: "Supported by", es: "Supported by",
    },
    ministry: {
      en: "Open source partners", de: "Open-Source-Partner", es: "Socios de código abierto",
    },
  },

  // Register / Auth page
  registerPage: {
    title: {
      en: "Register for the Hackathon", de: "Register for the Hackathon", es: "Register for the Hackathon",
    },
    subtitle: {
      en: "Sign in with Google to continue registration", de: "Sign in with Google to continue registration", es: "Sign in with Google to continue registration",
    },
    signInGoogle: { en: "Sign in with Google", de: "Sign in with Google", es: "Sign in with Google" },
    alreadyHaveAccount: {
      en: "Already have an account?", de: "Already have an account?", es: "Already have an account?",
    },
    connecting: { en: "Connecting…", de: "Connecting…", es: "Connecting…" },
    signInGithub: { en: "Sign in with GitHub", de: "Sign in with GitHub", es: "Sign in with GitHub" },
    signInLinkedin: { en: "Sign in with LinkedIn", de: "Sign in with LinkedIn", es: "Sign in with LinkedIn" },
    help: {
      en: "After sign-in, we will open your participant profile.", de: "After sign-in, we will open your participant profile.", es: "After sign-in, we will open your participant profile.",
    },
    backHome: { en: "Back to home", de: "Back to home", es: "Back to home" },
  },

  /** Registration period ended — disabled CTAs and /register page copy */
  registrationClosed: {
    button: {
      en: "Registration has ended", de: "Registration has ended", es: "Registration has ended",
    },
    pageTitle: {
      en: "Registration is closed", de: "Registration is closed", es: "Registration is closed",
    },
    pageSubtitle: {
      en: "Hackathon registration is closed. Stay tuned for news and future events.", de: "Hackathon registration is closed. Stay tuned for news and future events.", es: "Hackathon registration is closed. Stay tuned for news and future events.",
    },
  },

  profilePage: {
    title: { en: "Participant Profile", de: "Participant Profile", es: "Participant Profile" },
    subtitle: {
      en: "Temporary profile screen with the user data from Better Auth.", de: "Temporary profile screen with the user data from Better Auth.", es: "Temporary profile screen with the user data from Better Auth.",
    },
    signedInAs: { en: "Signed in as", de: "Signed in as", es: "Signed in as" },
    signOut: { en: "Sign out", de: "Sign out", es: "Sign out" },
    backHome: { en: "Back to home", de: "Back to home", es: "Back to home" },
    name: { en: "Name", de: "Name", es: "Name" },
    email: { en: "Email", de: "Email", es: "Email" },
    emailVerified: { en: "Email verified", de: "Email verified", es: "Email verified" },
    userId: { en: "User ID", de: "User ID", es: "User ID" },
    firstName: { en: "First name", de: "First name", es: "First name" },
    lastName: { en: "Last name", de: "Last name", es: "Last name" },
    teamId: { en: "Team", de: "Team", es: "Team" },
    isTeamLead: { en: "Team lead", de: "Team lead", es: "Team lead" },
    yes: { en: "Yes", de: "Yes", es: "Yes" },
    no: { en: "No", de: "No", es: "No" },
    noTeam: { en: "Not assigned", de: "Not assigned", es: "Not assigned" },
    signingOut: { en: "Signing out...", de: "Signing out...", es: "Signing out..." },
  },

  // Selection Process Section
  selectionProcess: {
    tag: {
      en: "SELECTION PROCESS", de: "SELECTION PROCESS", es: "SELECTION PROCESS",
    },
    title: {
      en: "Selection Stages", de: "Selection Stages", es: "Selection Stages",
    },
    subtitle: {
      en: "We select 15-20 strongest teams through a multi-stage process", de: "We select 15-20 strongest teams through a multi-stage process", es: "We select 15-20 strongest teams through a multi-stage process",
    },
    stage1Date: {
      en: "MAR 21 - MAR 29", de: "MAR 21 - MAR 29", es: "MAR 21 - MAR 29",
    },
    stage1Title: {
      en: "Registration", de: "Registration", es: "Registration",
    },
    stage1Desc: {
      en: "Team composition, brief description of participants' experience", de: "Team composition, brief description of participants' experience", es: "Team composition, brief description of participants' experience",
    },
    stage2Date: { en: "MAR 23-29", de: "MAR 23-29", es: "MAR 23-29" },
    stage2Title: {
      en: "Programming Tasks", de: "Programming Tasks", es: "Programming Tasks",
    },
    stage2Desc: {
      en: "Online testing on a custom platform. Assessment of correctness and optimality", de: "Online testing on a custom platform. Assessment of correctness and optimality", es: "Online testing on a custom platform. Assessment of correctness and optimality",
    },
    stage3Date: { en: "MAR 23-29", de: "MAR 23-29", es: "MAR 23-29" },
    stage3Title: { en: "Demo Video", de: "Demo Video", es: "Demo Video" },
    stage3Desc: {
      en: "Recording a demo video (up to 3 min) explaining the solutions", de: "Recording a demo video (up to 3 min) explaining the solutions", es: "Recording a demo video (up to 3 min) explaining the solutions",
    },
    stage4Date: { en: "APR 3", de: "APR 3", es: "APR 3" },
    stage4Title: {
      en: "Finalists Announcement", de: "Finalists Announcement", es: "Finalists Announcement",
    },
    stage4Desc: {
      en: "Publication of the list of teams that made it to the hackathon final", de: "Publication of the list of teams that made it to the hackathon final", es: "Publication of the list of teams that made it to the hackathon final",
    },
  },

  // Schedule Section
  schedule: {
    tag: { en: "SCHEDULE", de: "SCHEDULE", es: "SCHEDULE" },
    title: {
      en: "The Run of Show", de: "Der Ablauf", es: "El programa",
    },
    subtitle: {
      en: "Doors at 4pm — build, demo, and celebrate till midnight", de: "Einlass um 16 Uhr — bauen, demoen und feiern bis Mitternacht", es: "Puertas a las 4pm — construye, presenta y celebra hasta medianoche",
    },
    day1: { en: "The Night", de: "Der Abend", es: "La noche" },
    day1Label: { en: "4pm – 12am", de: "16–24 Uhr", es: "4pm – 12am" },
    block1: {
      en: "Onboarding, Tutorials & Networking", de: "Onboarding, Tutorials & Networking", es: "Bienvenida, tutoriales y networking",
    },
    block1Desc: {
      en: "Get set up with Cursor, learn the ropes, meet your people, and lock in your team. Zero experience needed — we've got you.", de: "Richte dich mit Cursor ein, lerne die Grundlagen, lerne deine Leute kennen und finde dein Team. Keine Erfahrung nötig — wir helfen dir.", es: "Configura Cursor, aprende lo básico, conoce a tu gente y forma tu equipo. No necesitas experiencia — te acompañamos.",
    },
    block2: {
      en: "Hackathon", de: "Hackathon", es: "Hackathon",
    },
    block2Desc: {
      en: "Heads down, hands building. Mentors floating around to get you unstuck and keep the momentum going.", de: "Kopf runter, Hände am Bauen. Mentor:innen sind unterwegs, um dich weiterzubringen und den Schwung zu halten.", es: "Cabeza abajo, manos construyendo. Los mentores circulan para desatascarte y mantener el impulso.",
    },
    block3: {
      en: "Demos & Winners", de: "Demos & Gewinner", es: "Demos y ganadores",
    },
    block3Desc: {
      en: "Teams take the stage, show what they made, and we crown the winners.", de: "Teams gehen auf die Bühne, zeigen, was sie gebaut haben, und wir küren die Gewinner.", es: "Los equipos suben al escenario, muestran lo que hicieron y coronamos a los ganadores.",
    },
    block4: {
      en: "Hang & Celebrate", de: "Abhängen & Feiern", es: "Convivir y celebrar",
    },
    block4Desc: {
      en: "Cool down, keep the conversations rolling, and toast to everything that got built tonight.", de: "Runterkommen, weiter quatschen und auf alles anstoßen, was heute Abend gebaut wurde.", es: "Relájate, sigue la conversación y brinda por todo lo que se construyó esta noche.",
    },
    note: {
      en: "Bring your laptop and charger. Curiosity is the only real requirement.", de: "Bring deinen Laptop und dein Ladegerät mit. Neugier ist die einzige echte Voraussetzung.", es: "Trae tu laptop y cargador. La curiosidad es el único requisito real.",
    },
  },

  // Judging Section — "Build to Ship" Expo flow (see docs/Hackathon-layout.md)
  criteria: {
    tag: {
      en: "JUDGING", de: "BEWERTUNG", es: "EVALUACIÓN",
    },
    title: {
      en: "How the Judging Works", de: "So funktioniert die Bewertung", es: "Cómo funciona la evaluación",
    },
    subtitle: {
      en: "The crowd filters the top apps for the judges, then the judges crown the winners — all run live in the event app.",
      de: "Die Menge filtert die besten Apps für die Judges vor, dann krönen die Judges die Gewinner — alles live in der Event-App.",
      es: "El público filtra las mejores apps para los jueces, y luego los jueces coronan a los ganadores — todo en vivo en la app del evento.",
    },

    // Round 1 — The Peer Expo (40 min)
    round1Title: { en: "The Peer Expo", de: "Die Peer-Expo", es: "La Peer Expo" },
    round1Duration: { en: "40 min", de: "40 Min", es: "40 min" },
    round1Goal: {
      en: "The crowd votes to surface the top 5–6 apps. Teams split into Group A and Group B — one group demos while the other tests and votes, then they swap.",
      de: "Die Menge stimmt ab, um die besten 5–6 Apps zu ermitteln. Die Teams werden in Gruppe A und Gruppe B aufgeteilt — eine Gruppe demonstriert, während die andere testet und abstimmt, dann wird gewechselt.",
      es: "El público vota para destacar las 5–6 mejores apps. Los equipos se dividen en Grupo A y Grupo B — un grupo presenta mientras el otro prueba y vota, y luego intercambian.",
    },
    round1Bullet1: {
      en: "Round 1 (20 min): Group A demos. Group B walks the floor and votes on Group A.",
      de: "Runde 1 (20 Min): Gruppe A demonstriert. Gruppe B geht herum und stimmt über Gruppe A ab.",
      es: "Ronda 1 (20 min): el Grupo A presenta. El Grupo B recorre la sala y vota al Grupo A.",
    },
    round1Bullet2: {
      en: "Round 2 (20 min): Group B demos. Group A walks the floor and votes on Group B. A buzzer signals the swap.",
      de: "Runde 2 (20 Min): Gruppe B demonstriert. Gruppe A geht herum und stimmt über Gruppe B ab. Ein Summer signalisiert den Wechsel.",
      es: "Ronda 2 (20 min): el Grupo B presenta. El Grupo A recorre la sala y vota al Grupo B. Una bocina señala el cambio.",
    },
    round1Bullet3: {
      en: "Every attendee gets 3 Launch Credits and can only vote for teams in the other group — never their own.",
      de: "Jeder Teilnehmer erhält 3 Launch Credits und kann nur für Teams der anderen Gruppe stimmen — nie für das eigene.",
      es: "Cada asistente recibe 3 Launch Credits y solo puede votar por equipos del otro grupo — nunca por el suyo.",
    },
    round1Bullet4: {
      en: "Votes lock on the swap. When voting closes, the live leaderboard sends the top 5–6 teams to the finals.",
      de: "Die Stimmen werden beim Wechsel gesperrt. Nach Abschluss der Abstimmung schickt das Live-Leaderboard die besten 5–6 Teams ins Finale.",
      es: "Los votos se bloquean en el cambio. Al cerrar la votación, la tabla en vivo envía a los 5–6 mejores equipos a la final.",
    },

    // Round 2 — The Judge Finals (15 min)
    round2Title: { en: "The Judge Finals", de: "Das Judge-Finale", es: "La Final de Jueces" },
    round2Duration: { en: "15 min", de: "15 Min", es: "15 min" },
    round2Goal: {
      en: "The judges crown the winners from the crowd's favorites. The 5–6 finalist teams take the main stage.",
      de: "Die Judges krönen die Gewinner aus den Favoriten der Menge. Die 5–6 Finalisten-Teams betreten die Hauptbühne.",
      es: "Los jueces coronan a los ganadores entre los favoritos del público. Los 5–6 equipos finalistas suben al escenario principal.",
    },
    round2Bullet1: {
      en: "Each finalist gets exactly 90 seconds to show their app and explain what it does.",
      de: "Jeder Finalist hat genau 90 Sekunden, um seine App zu zeigen und zu erklären, was sie macht.",
      es: "Cada finalista tiene exactamente 90 segundos para mostrar su app y explicar qué hace.",
    },
    round2Bullet2: {
      en: "The beginner does the talking — the pro can drive the laptop, but a novice explains the idea.",
      de: "Der Einsteiger übernimmt das Reden — der Profi darf den Laptop bedienen, aber ein Neuling erklärt die Idee.",
      es: "El principiante es quien habla — el experto puede manejar la laptop, pero un novato explica la idea.",
    },
    round2Bullet3: {
      en: "Judges huddle ~3 minutes and pick 1st, 2nd, and 3rd on how far the beginners came in ~4 hours and the utility and creativity of the AI build.",
      de: "Die Judges beraten sich ~3 Minuten und wählen 1., 2. und 3. — danach, wie weit die Einsteiger in ~4 Stunden gekommen sind und nach Nutzen und Kreativität des KI-Builds.",
      es: "Los jueces deliberan ~3 minutos y eligen 1.º, 2.º y 3.º según cuánto avanzaron los principiantes en ~4 horas y la utilidad y creatividad del desarrollo con IA.",
    },

    // Tie-Breakers (automatic)
    tieTitle: { en: "Tie-Breakers", de: "Gleichstand-Regeln", es: "Desempates" },
    tieTag: { en: "Automatic", de: "Automatisch", es: "Automático" },
    tieGoal: {
      en: "Because the app tracks everything on the backend, the leaderboard breaks ties instantly, in this order:",
      de: "Da die App alles im Backend erfasst, löst das Leaderboard Gleichstände sofort auf, in dieser Reihenfolge:",
      es: "Como la app registra todo en el backend, la tabla rompe empates al instante, en este orden:",
    },
    tieBullet1: {
      en: "Most credits — the raw total of Launch Credits received.",
      de: "Meiste Credits — die Gesamtzahl der erhaltenen Launch Credits.",
      es: "Más créditos — el total bruto de Launch Credits recibidos.",
    },
    tieBullet2: {
      en: "The Reach Metric — votes from the highest number of unique users wins (broad appeal beats one friend dumping all 3 credits).",
      de: "Die Reichweiten-Metrik — Stimmen von der höchsten Zahl einzigartiger Nutzer gewinnen (breite Resonanz schlägt einen Freund, der alle 3 Credits abgibt).",
      es: "La métrica de alcance — gana quien tenga votos del mayor número de usuarios únicos (el atractivo amplio supera a un amigo que da los 3 créditos).",
    },
    tieBullet3: {
      en: "Speed to Market — the team that hit \"Submit Project\" first wins.",
      de: "Speed to Market — das Team, das zuerst auf \"Projekt einreichen\" geklickt hat, gewinnt.",
      es: "Velocidad de lanzamiento — gana el equipo que pulsó \"Enviar proyecto\" primero.",
    },

    // Live Leaderboard Reveal
    leaderboardTitle: {
      en: "The Live Leaderboard Reveal",
      de: "Das Live-Leaderboard",
      es: "La revelación de la tabla en vivo",
    },
    leaderboardQuote: {
      en: "\"The data is in. Out of all the teams who built and shipped tonight, here are the top finalists moving on to the pitch stage…\"",
      de: "\"Die Daten sind da. Von allen Teams, die heute Abend gebaut und ausgeliefert haben, hier die Top-Finalisten, die auf die Pitch-Bühne kommen…\"",
      es: "\"Los datos están listos. De todos los equipos que construyeron y lanzaron esta noche, estos son los finalistas que pasan al escenario de pitch…\"",
    },
    leaderboardNote: {
      en: "No hand-counting — final scores compute the instant the Round 2 buzzer sounds.",
      de: "Kein Auszählen von Hand — die Endergebnisse werden berechnet, sobald der Summer der Runde 2 ertönt.",
      es: "Sin conteo manual — las puntuaciones finales se calculan en el instante en que suena la bocina de la Ronda 2.",
    },
  },

  // Requirements Section
  requirements: {
    tag: {
      en: "DELIVERABLES", de: "DELIVERABLES", es: "ENTREGABLES",
    },
    title: {
      en: "What to Submit", de: "Was einzureichen ist", es: "Qué entregar",
    },
    subtitle: {
      en: "4 required deliverables — submit your public URL before 9:00pm", de: "4 Pflicht-Deliverables — öffentliche URL vor 21:00 Uhr einreichen", es: "4 entregables obligatorios — envía tu URL pública antes de las 9:00pm",
    },
    required: { en: "Required", de: "Pflicht", es: "Obligatorio" },
    recommended: {
      en: "Bonus Points", de: "Bonuspunkte", es: "Puntos extra",
    },
    req1: {
      en: "Filled PRD", de: "Ausgefülltes PRD", es: "PRD completado",
    },
    req1Desc: {
      en: "system-design-prd-template.md — fill this out before writing code", de: "system-design-prd-template.md — vor dem Coden ausfüllen", es: "system-design-prd-template.md — rellénalo antes de escribir código",
    },
    req2: { en: "Agent", de: "Agent", es: "Agente" },
    req2Desc: {
      en: "Built with create_deep_agent + Cursor as your primary editor", de: "Gebaut mit create_deep_agent + Cursor als Haupt-Editor", es: "Construido con create_deep_agent + Cursor como editor principal",
    },
    req3: { en: "Hosted Public URL", de: "Öffentliche URL", es: "URL pública alojada" },
    req3Desc: {
      en: "Anonymous auth only — anyone opens the URL in a browser, no login required", de: "Nur anonyme Auth — jeder öffnet die URL im Browser, kein Login nötig", es: "Solo auth anónima — cualquiera abre la URL en el navegador, sin login",
    },
    req4: {
      en: ".cursorrules File", de: ".cursorrules-Datei", es: "Archivo .cursorrules",
    },
    req4Desc: {
      en: "Shows how you used Cursor during the build", de: "Zeigt, wie Cursor während des Builds eingesetzt wurde", es: "Muestra cómo usaste Cursor durante la construcción",
    },
    rec1: { en: "Submit Early", de: "Früh einreichen", es: "Entregar pronto" },
    rec1Desc: {
      en: "Earliest submission wins ties — don't wait until 8:59pm", de: "Früheste Einreichung gewinnt bei Gleichstand — nicht bis 20:59 Uhr warten", es: "La entrega más temprana gana en empate — no esperes hasta las 8:59pm",
    },
    rec2: { en: "Custom Frontend", de: "Eigenes Frontend", es: "Frontend personalizado" },
    rec2Desc: {
      en: "Polished UI earns up to +2 bonus points from roving judges", de: "Poliertes UI bringt bis zu +2 Bonuspunkte von den Judges", es: "Una UI pulida otorga hasta +2 puntos extra de los jueces",
    },
    noteLabel: { en: "Tip:", de: "Tipp:", es: "Consejo:" },
    noteText: {
      en: "Architecture thinking first. Teams that skip the PRD tend to build the wrong thing.", de: "Erst Architektur denken. Teams, die das PRD überspringen, bauen oft das Falsche.", es: "Primero piensa en la arquitectura. Los equipos que omiten el PRD suelen construir lo incorrecto.",
    },

    // Build & Ship track deliverables
    beginnerReq1: { en: "Hosted Public URL", de: "Öffentliche URL", es: "URL pública alojada" },
    beginnerReq1Desc: {
      en: "Anyone can open the URL in a browser — no login required.",
      de: "Jeder kann die URL im Browser öffnen — kein Login nötig.",
      es: "Cualquiera puede abrir la URL en el navegador — sin login.",
    },
    beginnerReq2: { en: "Working App", de: "Funktionierende App", es: "App funcional" },
    beginnerReq2Desc: {
      en: "A real, deployed application that solves a recognizable problem.",
      de: "Eine echte, deployte Anwendung, die ein erkennbares Problem löst.",
      es: "Una aplicación real y desplegada que resuelve un problema reconocible.",
    },
    beginnerReq3: { en: ".cursorrules File", de: ".cursorrules-Datei", es: "Archivo .cursorrules" },
    beginnerReq3Desc: {
      en: "Shows how you used Cursor during the build.",
      de: "Zeigt, wie Cursor während des Builds eingesetzt wurde.",
      es: "Muestra cómo usaste Cursor durante la construcción.",
    },
    beginnerReq4: { en: "Short Writeup", de: "Kurze Beschreibung", es: "Resumen breve" },
    beginnerReq4Desc: {
      en: "Brief README — what you built, how you built it, what's next.",
      de: "Kurze README — was du gebaut hast, wie und was als Nächstes kommt.",
      es: "README breve — qué construiste, cómo lo hiciste y qué sigue.",
    },
    beginnerNoteText: {
      en: "Deploy early. A working URL at 7:30pm beats a broken one at 8:59pm.",
      de: "Früh deployen. Eine funktionierende URL um 19:30 schlägt eine kaputte um 20:59.",
      es: "Despliega pronto. Una URL funcional a las 7:30pm supera a una rota a las 8:59pm.",
    },
  },

  // Team Building Section
  teamBuilding: {
    tag: { en: "TEAM", de: "TEAM", es: "TEAM" },
    title: {
      en: "How to Build a Team for 48H", de: "How to Build a Team for 48H", es: "How to Build a Team for 48H",
    },
    subtitle: {
      en: "The right team is the key to success at the hackathon", de: "The right team is the key to success at the hackathon", es: "The right team is the key to success at the hackathon",
    },
    sizeTitle: {
      en: "Optimal Size and Composition", de: "Optimal Size and Composition", es: "Optimal Size and Composition",
    },
    sizeDesc: {
      en: "Team of up to 5 people. Recommended roles: developer with Cursor experience (required), backend/frontend developers, person with AI/ML integration experience (OpenAI, Anthropic APIs, etc.), someone with UI/UX skills, and a participant who can present the project at the finale.", de: "Team of up to 5 people. Recommended roles: developer with Cursor experience (required), backend/frontend developers, person with AI/ML integration experience (OpenAI, Anthropic APIs, etc.), someone with UI/UX skills, and a participant who can present the project at the finale.", es: "Team of up to 5 people. Recommended roles: developer with Cursor experience (required), backend/frontend developers, person with AI/ML integration experience (OpenAI, Anthropic APIs, etc.), someone with UI/UX skills, and a participant who can present the project at the finale.",
    },
    findTitle: {
      en: "Where to Find Teammates", de: "Where to Find Teammates", es: "Where to Find Teammates",
    },
    findDesc: {
      en: "Official hackathon chat, Telegram or Discord developer communities, LinkedIn, and university groups. Looking for a team? Introduce yourself: experience, tech stack, and ideas you care about.", de: "Offizieller Hackathon-Chat, Telegram- oder Discord-Communities für Entwickler, LinkedIn und Uni-Gruppen. Team gesucht? Stellt euch vor: Erfahrung, Tech-Stack und Themen, die euch interessieren.", es: "Chat oficial del hackathon, comunidades de desarrolladores en Telegram o Discord, LinkedIn y grupos universitarios. ¿Buscas equipo? Preséntate: experiencia, stack tecnológico e ideas que te motivan.",
    },
    discussTitle: {
      en: "What to Discuss Before the Hackathon", de: "What to Discuss Before the Hackathon", es: "What to Discuss Before the Hackathon",
    },
    discussDesc: {
      en: "Make sure everyone can attend offline for all 3 days. Agree on a basic tech stack. Verify that Cursor is installed and configured for everyone. Exchange contacts and create a team chat.", de: "Make sure everyone can attend offline for all 3 days. Agree on a basic tech stack. Verify that Cursor is installed and configured for everyone. Exchange contacts and create a team chat.", es: "Make sure everyone can attend offline for all 3 days. Agree on a basic tech stack. Verify that Cursor is installed and configured for everyone. Exchange contacts and create a team chat.",
    },
    tipTitle: { en: "Tip", de: "Tip", es: "Tip" },
    tipDesc: {
      en: "Don't recruit a team based only on hard skills. 4 hours of intensive work requires people who can negotiate and make decisions quickly.", de: "Don't recruit a team based only on hard skills. 4 hours of intensive work requires people who can negotiate and make decisions quickly.", es: "Don't recruit a team based only on hard skills. 4 hours of intensive work requires people who can negotiate and make decisions quickly.",
    },
  },

  // Tech Stack Section
  techStack: {
    tag: {
      en: "BRING", de: "MITBRINGEN", es: "QUÉ TRAER",
    },
    title: {
      en: "What to Bring", de: "Was du mitbringst", es: "Qué traer",
    },
    subtitle: {
      en: "Curiosity is the only real requirement", de: "Neugier ist die einzige echte Voraussetzung", es: "La curiosidad es el único requisito real",
    },
    requiredTool: {
      en: "The Essentials", de: "Das Wesentliche", es: "Lo esencial",
    },
    cursorDesc: {
      en: "Bring a laptop that can run it — we'll help you get set up at the door", de: "Bring einen Laptop mit, auf dem es läuft — wir helfen dir beim Einrichten an der Tür", es: "Trae una laptop que pueda ejecutarlo — te ayudamos a configurarlo en la puerta",
    },
    allowed: {
      en: "Bring with you", de: "Bring mit", es: "Trae contigo",
    },
    tool1: {
      en: "Your laptop", de: "Dein Laptop", es: "Tu laptop",
    },
    tool1Desc: {
      en: "Any laptop that can run Cursor", de: "Jeder Laptop, der Cursor ausführen kann", es: "Cualquier laptop que pueda ejecutar Cursor",
    },
    tool2: {
      en: "Your charger", de: "Dein Ladegerät", es: "Tu cargador",
    },
    tool2Desc: {
      en: "It's a long, fun night", de: "Es wird ein langer, schöner Abend", es: "Es una noche larga y divertida",
    },
    tool3: {
      en: "Curiosity", de: "Neugier", es: "Curiosidad",
    },
    tool3Desc: {
      en: "The only real requirement", de: "Die einzige echte Voraussetzung", es: "El único requisito real",
    },
    tool4: { en: "Good vibes", de: "Gute Laune", es: "Buena onda" },
    tool4Desc: {
      en: "You'll leave with new friends", de: "Du gehst mit neuen Freunden nach Hause", es: "Te irás con nuevos amigos",
    },
    forbidden: { en: "Leave at home", de: "Zu Hause lassen", es: "Deja en casa" },
    forbidden1: {
      en: "Prior experience", de: "Vorerfahrung", es: "Experiencia previa",
    },
    forbidden1Desc: {
      en: "No degree or background needed", de: "Kein Abschluss oder Hintergrund nötig", es: "No necesitas título ni experiencia",
    },
    forbidden2: {
      en: "A finished idea", de: "Eine fertige Idee", es: "Una idea terminada",
    },
    forbidden2Desc: {
      en: "We'll help you find one", de: "Wir helfen dir, eine zu finden", es: "Te ayudaremos a encontrar una",
    },
    logistics: { en: "We provide", de: "Wir stellen bereit", es: "Nosotros ponemos" },
    logistics1: { en: "Food & drinks", de: "Essen & Getränke", es: "Comida y bebidas" },
    logistics1Desc: {
      en: "Dinner, snacks, coffee, tea, water — on us all night", de: "Abendessen, Snacks, Kaffee, Tee, Wasser — den ganzen Abend auf uns", es: "Cena, snacks, café, té, agua — por nuestra cuenta toda la noche",
    },
    logistics2: {
      en: "Wi-Fi & power", de: "WLAN & Strom", es: "Wi-Fi y enchufes",
    },
    logistics2Desc: {
      en: "Fast Wi-Fi, outlets, extension cords, comfy space to build", de: "Schnelles WLAN, Steckdosen, Verlängerungskabel, gemütlicher Platz zum Bauen", es: "Wi-Fi rápido, enchufes, extensiones y un espacio cómodo para construir",
    },
    logistics3: { en: "Mentors & help", de: "Mentor:innen & Hilfe", es: "Mentores y ayuda" },
    logistics3Desc: {
      en: "Floating mentors to get you unstuck whenever you need", de: "Mentor:innen sind unterwegs und helfen dir, wann immer du nicht weiterkommst", es: "Mentores circulando para desatascarte cuando lo necesites",
    },
    ctaTitle: {
      en: "Ready to build?", de: "Bereit zum Bauen?", es: "¿Listo para construir?",
    },
    ctaDesc: {
      en: "Grab your spot. Let's build.", de: "Sichere dir deinen Platz. Lass uns bauen.", es: "Reserva tu lugar. A construir.",
    },
    ctaButton: {
      en: "Register Now", de: "Jetzt registrieren", es: "Regístrate ahora",
    },
  },

  partnerCredits: {
    loading: {
      en: "Loading partner credits…", de: "Loading partner credits…", es: "Loading partner credits…",
    },
    title: {
      en: "Partner credits", de: "Partner credits", es: "Partner credits",
    },
    subtitle: {
      en: "Credits issued to your account. Claim after you have opened the redemption link.", de: "Credits issued to your account. Claim after you have opened the redemption link.", es: "Credits issued to your account. Claim after you have opened the redemption link.",
    },
    status: { en: "Status", de: "Status", es: "Status" },
    openLink: { en: "Open credit link", de: "Open credit link", es: "Open credit link" },
    claim: { en: "Claim credit", de: "Claim credit", es: "Claim credit" },
    claiming: { en: "Claiming…", de: "Claiming…", es: "Claiming…" },
    emptySubtitle: {
      en: "No credits issued yet", de: "No credits issued yet", es: "No credits issued yet",
    },
    emptyNoTeam: {
      en: "Create a team or join with a code — partner credits are for members of teams that pass screening.", de: "Create a team or join with a code — partner credits are for members of teams that pass screening.", es: "Create a team or join with a code — partner credits are for members of teams that pass screening.",
    },
    emptyDraft: {
      en: "Complete the screening stage. Once your team is approved, organizers can distribute credits.", de: "Complete the screening stage. Once your team is approved, organizers can distribute credits.", es: "Complete the screening stage. Once your team is approved, organizers can distribute credits.",
    },
    emptySubmitted: {
      en: "Your application is under review. After approval, partner credits will appear here once distributed.", de: "Your application is under review. After approval, partner credits will appear here once distributed.", es: "Your application is under review. After approval, partner credits will appear here once distributed.",
    },
    emptyRejected: {
      en: "Based on screening results, partner credits are not available for this team.", de: "Based on screening results, partner credits are not available for this team.", es: "Based on screening results, partner credits are not available for this team.",
    },
    emptyApprovedWaiting: {
      en: "Your team passed screening. Credits will show here after organizers distribute them from the partner pool.", de: "Your team passed screening. Credits will show here after organizers distribute them from the partner pool.", es: "Your team passed screening. Credits will show here after organizers distribute them from the partner pool.",
    },
  },

  // Tracks Section — one track: Build & Ship
  tracks: {
    tag: { en: "THE TRACK", de: "DER TRACK", es: "LA PISTA" },
    title: {
      en: "Your Track",
      de: "Dein Track",
      es: "Tu pista",
    },
    subtitle: {
      en: "One track, one mission — design a fully working application and ship it off localhost to a public URL anyone can open.",
      de: "Ein Track, eine Mission — entwirf eine voll funktionierende Anwendung und bring sie weg vom localhost auf eine öffentliche URL, die jeder öffnen kann.",
      es: "Una pista, una misión — diseña una aplicación completamente funcional y sácala de localhost a una URL pública que cualquiera pueda abrir.",
    },

    beginnerLevel: { en: "BEGINNER", de: "EINSTEIGER", es: "PRINCIPIANTE" },
    beginnerName: {
      en: "Build & Ship Track",
      de: "Build & Ship Track",
      es: "Pista Build & Ship",
    },
    beginnerTag: {
      en: "Your first deployed app",
      de: "Deine erste deployte App",
      es: "Tu primera app desplegada",
    },
    beginnerDesc: {
      en: "For complete beginners. Design and build a fully functioning application and get it off localhost — onto a public URL anyone can open.",
      de: "Für komplette Einsteiger. Entwerfe und baue eine voll funktionierende Anwendung und bring sie weg vom localhost — auf eine öffentliche URL, die jeder öffnen kann.",
      es: "Para principiantes totales. Diseña y construye una aplicación completamente funcional y sácala de localhost — a una URL pública que cualquiera pueda abrir.",
    },
    beginnerBullet1: {
      en: "Ship a real, working app to a public URL",
      de: "Eine echte, funktionierende App auf eine öffentliche URL bringen",
      es: "Lanza una app real y funcional a una URL pública",
    },
    beginnerBullet2: {
      en: "Craft, creativity, and everyday usefulness rewarded",
      de: "Handwerk, Kreativität und Alltagsnutzen werden belohnt",
      es: "Se premia el oficio, la creatividad y la utilidad cotidiana",
    },
    beginnerBullet3: {
      en: "Full judging criteria revealed at kickoff",
      de: "Vollständige Bewertungskriterien beim Auftakt",
      es: "Criterios completos de evaluación al inicio",
    },
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(
  section: TranslationKey,
  key: string,
  lang: Language,
): string {
  const sectionData = translations[section] as Record<
    string,
    | { en: string; de: string; es: string }
    | { en: string[]; de: string[]; es: string[] }
  >;
  const item = sectionData[key];

  if (!item) return key;

  if (
    Array.isArray((item as { en: string[]; de: string[]; es: string[] }).en)
  ) {
    return (item as { en: string[]; de: string[]; es: string[] })[lang].join(
      ", ",
    );
  }

  return (item as { en: string; de: string; es: string })[lang];
}

export function tArray(
  section: TranslationKey,
  key: string,
  lang: Language,
): string[] {
  const sectionData = translations[section] as Record<string, unknown>;
  const item = sectionData[key] as
    | { en: string[]; de: string[]; es: string[] }
    | undefined;

  if (!item) return [];

  return item[lang] || [];
}
