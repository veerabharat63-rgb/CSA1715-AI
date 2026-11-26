/**
 * Disease Knowledge Base for Precision Rose & Crop Farming
 * Comprehensive agronomical data covering the 7 target conditions:
 * - Healthy Leaf (Rosa spp. Optimal Foliage)
 * - Black Spot (Diplocarpon rosae)
 * - Powdery Mildew (Podosphaera pannosa)
 * - Leaf Rust (Phragmidium mucronatum)
 * - Downy Mildew (Peronospora sparsa)
 * - Botrytis Blight / Gray Mold (Botrytis cinerea)
 * - Early Leaf Blight / Cercospora (Cercospora / Alternaria spp.)
 */

export const DISEASE_CLASSES = [
  'Black Spot',
  'Botrytis Blight',
  'Downy Mildew',
  'Early Blight',
  'Healthy',
  'Powdery Mildew',
  'Rust',
];

export const DISEASE_KNOWLEDGE_BASE = {
  Healthy: {
    id: 'healthy',
    name: 'Healthy Rose Foliage',
    scientificName: 'Rosa spp. (Optimal Health)',
    badgeColor: '#10B981',
    accentColor: 'rgb(16, 185, 129)',
    severityCategory: 'None (0%)',
    icon: '🌿',
    summary: 'Vibrant green cuticle with intact epidermal barrier, optimal chlorophyll saturation, and zero pathogen morphology.',
    description:
      'The leaf tissue demonstrates uniform reflectance in the 500-550 nm spectrum, unobstructed stomatal density, and absence of necrotic mycelia or fungal sporulation. Continue preventative moisture management.',
    symptoms: [
      'Uniform deep-emerald coloration across palisade mesophyll',
      'Smooth, intact waxy cuticle without chlorotic haloing',
      'Sturdy petiole vascular attachment with no defoliation markers',
      'Absence of fungal sporulation, pustules, or scorched margins',
    ],
    management: {
      chemicalControl: {
        recommended: false,
        activeIngredients: ['None required — 0.0 mL'],
        applicationNotes: 'Bypass spray cycle to conserve chemicals and beneficial phyllosphere organisms.',
      },
      roverSpray: {
        chemicalName: 'None (Bypassed)',
        maxDoseMl: 0.0,
      },
    },
  },

  'Black Spot': {
    id: 'black-spot',
    name: 'Black Spot',
    scientificName: 'Diplocarpon rosae',
    badgeColor: '#EF4444',
    accentColor: 'rgb(239, 68, 68)',
    icon: '⚫',
    summary: 'Circular dark necrotic lesions with characteristic feathery/fibrillose borders, leading to premature chlorosis and severe defoliation.',
    description:
      'Diplocarpon rosae is an obligate ascomycete fungus. Conidia germinate on leaf surfaces requiring continuous free water at 18-24°C. Pectolytic enzymes cause localized melanized lesions triggering ethylene synthesis and leaf drop.',
    symptoms: [
      'Circular black spots (2-14 mm) with fringed, filamentous margins',
      'Surrounding chlorotic yellow halos caused by fungal ethylene production',
      'Rapid senescence and abscission of lower leaflets moving upward',
      'Raised dark pustules (acervuli) visible under close inspection',
    ],
    management: {
      chemicalControl: {
        recommended: true,
        activeIngredients: ['Myclobutanil', 'Copper Octanoate'],
        applicationNotes: 'Targeted micro-spray of 12.0 mL directly onto infected leaflets.',
      },
      roverSpray: {
        chemicalName: 'Myclobutanil / Copper Octanoate',
        maxDoseMl: 12.0,
      },
    },
  },

  'Powdery Mildew': {
    id: 'powdery-mildew',
    name: 'Powdery Mildew',
    scientificName: 'Podosphaera pannosa',
    badgeColor: '#F59E0B',
    accentColor: 'rgb(245, 158, 11)',
    icon: '🤍',
    summary: 'Superficial talcum-like white/gray fungal felt coating young foliage, flower buds, and stems.',
    description:
      'Podosphaera pannosa produces abundant airborne conidia in warm (20-27°C) dry conditions with high nighttime relative humidity. Unlike Black Spot, it does not require free standing water.',
    symptoms: [
      'White to ash-gray talcum-like powdery felt across adaxial leaf surfaces',
      'Leaflet curling, blistering, and upward rolling of young shoots',
      'Stunting of flower buds with deformed petal emergence',
      'Purplish discoloration beneath dense fungal colonies on older leaves',
    ],
    management: {
      chemicalControl: {
        recommended: true,
        activeIngredients: ['Potassium Bicarbonate', 'Wettable Sulfur'],
        applicationNotes: 'Targeted micro-spray of 10.5 mL disrupts fungal osmotic balance.',
      },
      roverSpray: {
        chemicalName: 'Potassium Bicarbonate / Wettable Sulfur',
        maxDoseMl: 10.5,
      },
    },
  },

  'Rust': {
    id: 'rust',
    name: 'Leaf Rust',
    scientificName: 'Phragmidium mucronatum',
    badgeColor: '#EA580C',
    accentColor: 'rgb(234, 88, 12)',
    icon: '🟠',
    summary: 'Bright orange to reddish-brown powdery urediniospore pustules on abaxial (underside) leaf surfaces.',
    description:
      'Phragmidium mucronatum is a macrocyclic autoecious rust fungus completing all five spore stages on Rosa spp. Requires moisture and cool to moderate temperatures (15-21°C).',
    symptoms: [
      'Bright orange powdery pustules on underside of leaflets',
      'Corresponding pale yellow chlorotic angular spots on upper leaf surface',
      'Late-season dark brown to black teliospores replacing orange pustules',
      'Leaf curling, desiccation, and early canopy defoliation',
    ],
    management: {
      chemicalControl: {
        recommended: true,
        activeIngredients: ['Tebuconazole', 'Mancozeb'],
        applicationNotes: 'Targeted micro-dose of 14.0 mL halts spore germination.',
      },
      roverSpray: {
        chemicalName: 'Tebuconazole / Mancozeb Micro-Dose',
        maxDoseMl: 14.0,
      },
    },
  },

  'Downy Mildew': {
    id: 'downy-mildew',
    name: 'Downy Mildew',
    scientificName: 'Peronospora sparsa',
    badgeColor: '#9333EA',
    accentColor: 'rgb(147, 51, 234)',
    icon: '🟣',
    summary: 'Purplish-red to dark brown angular blotches bounded by veins, accompanied by rapid severe defoliation.',
    description:
      'Peronospora sparsa is a destructive water mold (Oomycete). It thrives in high humidity (>85%) and moderate temperatures (15-20°C). Lesions are strictly vein-delimited, giving an angular mosaic look.',
    symptoms: [
      'Angular, vein-delimited purplish-red to maroon leaf blotches',
      'Subtle downy white-gray sporangiophores on leaf undersides in high humidity',
      'Catastrophic, rapid leaf drop even before leaves turn completely yellow',
      'Purplish-black cankers on young stems and flowering calyxes',
    ],
    management: {
      chemicalControl: {
        recommended: true,
        activeIngredients: ['Azoxystrobin', 'Phosphorous Acid'],
        applicationNotes: 'Systemic micro-spray of 13.5 mL targeted to canopy undersides.',
      },
      roverSpray: {
        chemicalName: 'Azoxystrobin / Phosphorous Acid',
        maxDoseMl: 13.5,
      },
    },
  },

  'Botrytis Blight': {
    id: 'botrytis-blight',
    name: 'Botrytis Blight / Gray Mold',
    scientificName: 'Botrytis cinerea',
    badgeColor: '#64748B',
    accentColor: 'rgb(100, 116, 139)',
    icon: '🌫️',
    summary: 'Water-soaked soft brown rot covered with fuzzy grayish conidial felt on flower buds and tender leaves.',
    description:
      'Botrytis cinerea is an opportunistic necrotrophic fungus attacking wounded, senescent, or succulent canopy tissue in cool, foggy, humid conditions (15-20°C).',
    symptoms: [
      'Water-soaked soft brownish irregular lesions on leaves and buds',
      'Dense fuzzy gray conidial fuzz covering decaying tissue',
      'Buds fail to open and turn brown, hanging limply on stems',
      'Sunken brown cankers encircling petioles causing whole leaflet dieback',
    ],
    management: {
      chemicalControl: {
        recommended: true,
        activeIngredients: ['Fenhexamid', 'Bio-Fungicide Bacillus'],
        applicationNotes: 'Precision micro-spray of 11.0 mL directly onto infected lesions.',
      },
      roverSpray: {
        chemicalName: 'Fenhexamid / Bio-Fungicide Bacillus',
        maxDoseMl: 11.0,
      },
    },
  },

  'Early Blight': {
    id: 'early-blight',
    name: 'Early Leaf Blight / Cercospora',
    scientificName: 'Cercospora / Alternaria spp.',
    badgeColor: '#D97706',
    accentColor: 'rgb(217, 119, 6)',
    icon: '🎯',
    summary: 'Circular tan-centered target-board lesions with dark concentric ridges and distinct chlorotic margins.',
    description:
      'Cercospora rosicola and Alternaria alternata cause concentric circular target-board necrotic spots. Favored by alternating periods of wet dew and hot sunny days.',
    symptoms: [
      'Concentric target-ring circular spots with papery tan centers',
      'Dark brown to purplish outer margin ring',
      'Prominent chlorotic yellow halos surrounding expanding lesions',
      'Premature leaflet yellowing and partial canopy drop',
    ],
    management: {
      chemicalControl: {
        recommended: true,
        activeIngredients: ['Chlorothalonil', 'Neem-Copper Blend'],
        applicationNotes: 'Targeted micro-dose of 12.5 mL applied to concentric spots.',
      },
      roverSpray: {
        chemicalName: 'Chlorothalonil / Neem-Copper Blend',
        maxDoseMl: 12.5,
      },
    },
    'Uncertain / No Leaf Detected': {
      id: 'uncertain',
      name: 'Uncertain / No Leaf Detected',
      scientificName: 'Non-Botanical or Low-Confidence Capture',
      badgeColor: '#F59E0B',
      accentColor: 'rgb(245, 158, 11)',
      severityCategory: 'N/A',
      icon: '⚠️',
      summary: 'Uncertain / No Leaf Detected — Please hold a plant leaf clearly in frame under good lighting.',
      description: 'The neural network could not identify distinct foliar structures or disease symptoms with >= 60% confidence. Please position a well-lit crop leaf in the camera viewfinder.',
      symptoms: [
        'Low neural confidence (< 60.0%) or missing foliar chlorophyll signature.',
        'Object in frame may be non-botanical (background surface, wall, or equipment).',
        'Insufficient ambient lighting or motion blur during capture.',
      ],
      management: [
        'Position an individual rose or crop leaflet centrally in frame.',
        'Ensure adequate diffuse lighting without harsh shadows.',
        'Tap to refocus and hold the camera steady at ~15-25 cm distance.',
      ],
      chemicalControl: {
        organic: 'None required (Verify specimen first)',
        chemical: 'None required',
        applicationRate: '0.0 mL / L',
        phi: '0 days',
        ppe: ['Standard field observation'],
      },
      roverSpray: {
        chemicalName: 'None (Solenoid Locked Closed)',
        maxDoseMl: 0.0,
      },
    },
  },
};

export function getDiseaseInfo(diseaseName) {
  if (!diseaseName) return DISEASE_KNOWLEDGE_BASE['Healthy'];
  if (diseaseName === 'Leaf Rust') return DISEASE_KNOWLEDGE_BASE['Rust'];
  if (diseaseName === 'Chemical Burn') return DISEASE_KNOWLEDGE_BASE['Early Blight'];
  return DISEASE_KNOWLEDGE_BASE[diseaseName] || DISEASE_KNOWLEDGE_BASE['Healthy'];
}

export const PLANT_PARTS = [
  { id: 'Leaf', label: 'Leaf', icon: '🍃', desc: 'Foliage & leaflets' },
  { id: 'Stem', label: 'Stem', icon: '🌿', desc: 'Canes & petioles' },
  { id: 'Flower', label: 'Flower', icon: '🌹', desc: 'Buds & petals' },
  { id: 'Fruit', label: 'Fruit', icon: '🍎', desc: 'Rose hips / crop fruit' },
];

export const MULTILINGUAL_ADVISORY = {
  English: {
    badge: 'English — Global Agronomic Standard',
    'Healthy': {
      title: 'Optimal Foliar Health Detected',
      status: 'Cuticle and photosynthetic tissue in prime physiological condition.',
      action: 'No intervention required. Maintain current fertigation regime.',
      spray: 'Bypass spray cycle (0.0 mL) to preserve beneficial microbes.',
      organic: 'Regular compost tea / seaweed foliar extract for immunity.',
      prevention: 'Maintain balanced air circulation and avoid evening overhead sprinkler irrigation.',
    },
    'Black Spot': {
      title: 'Black Spot Fungal Infection (Diplocarpon rosae)',
      status: 'Circular melanized necrotic lesions with chlorotic yellow halo borders.',
      action: 'Prune and bag infected leaflets immediately. Sterilize shears with 70% alcohol.',
      spray: 'Precision micro-spray of 12.0 mL Myclobutanil or Copper Octanoate.',
      organic: 'Potassium bicarbonate spray (3g/L) + cold-pressed horticultural neem oil.',
      prevention: 'Apply preventative copper spray prior to rainy spells; water only at root level.',
    },
    'Powdery Mildew': {
      title: 'Powdery Mildew Epiphytic Mycelium (Podosphaera pannosa)',
      status: 'Superficial white powdery fungal patches covering upper leaf cuticle.',
      action: 'Isolate affected canopy sectors. Increase ventilation around lower branches.',
      spray: 'Precision micro-spray of 10.5 mL Potassium Bicarbonate or Wettable Sulfur.',
      organic: 'Dilute raw milk spray (40% milk, 60% water) in direct sunlight; potassium bicarbonate.',
      prevention: 'Avoid high-nitrogen fertilizers causing soft succulent tissue; prune dense canopies.',
    },
    'Rust': {
      title: 'Foliar Rust Pustules (Phragmidium mucronatum)',
      status: 'Vibrant orange urediniospores erupting through lower abaxial epidermis.',
      action: 'Carefully clip infected leaves to avoid shaking spores onto neighboring plants.',
      spray: 'Precision micro-spray of 14.0 mL Tebuconazole or Mancozeb micro-dose.',
      organic: 'Bordeaux mixture (copper sulfate + slaked lime) and wettable sulfur suspension.',
      prevention: 'Rake and burn fallen leaves before winter; select rust-resistant rose cultivars.',
    },
    'Downy Mildew': {
      title: 'Downy Mildew Oomycete Systemic Blight (Peronospora sparsa)',
      status: 'Purplish-red angular vein-delimited patches with delicate downy undersides.',
      action: 'Urgent containment: quarantine affected plants and lower greenhouse humidity below 80%.',
      spray: 'Precision micro-spray of 13.5 mL Azoxystrobin or Phosphorous Acid systemic.',
      organic: 'Bio-fungicide Bacillus subtilis foliar drench plus copper hydroxide.',
      prevention: 'Heat and vent greenhouse before nightfall; maintain wide row spacing for cross-breeze.',
    },
    'Botrytis Blight': {
      title: 'Botrytis Blight / Gray Mold Necrosis (Botrytis cinerea)',
      status: 'Fuzzy grayish-brown conidiophores rotting petal margins and tender nodes.',
      action: 'Carefully excise dying flowers and rotting buds into plastic disposal bags.',
      spray: 'Precision micro-spray of 11.0 mL Fenhexamid or Bio-Fungicide Bacillus.',
      organic: 'Serenade (Bacillus amyloliquefaciens) bio-fungicide and silica barrier sprays.',
      prevention: 'Avoid physical wounding; eradicate wet flower debris immediately after rain.',
    },
    'Early Blight': {
      title: 'Early Leaf Blight / Cercospora (Cercospora / Alternaria spp.)',
      status: 'Concentric papery tan target-ring spots bounded by dark chlorotic haloes.',
      action: 'Remove lower foliage showing target rings; rake soil clean under canopy.',
      spray: 'Precision micro-spray of 12.5 mL Chlorothalonil or Neem-Copper blend.',
      organic: 'Copper octanoate soap paired with Trichoderma harzianum root drench.',
      prevention: 'Mulch soil surface to prevent spore splashback during rainfall; practice crop rotation.',
    },
  },
  Tamil: {
    badge: 'தமிழ் — தமிழ்நாடு வேளாண்மை ஆலோசனை',
    'Healthy': {
      title: 'செடி மிக ஆரோக்கியமாக உள்ளது',
      status: 'இலைகளில் எந்தவித நோய்த்தொற்றும் இல்லை. பச்சையம் சீராக உள்ளது.',
      action: 'மருந்து தெளிக்க வேண்டிய அவசியமில்லை. வழக்கமான பாசனம் தொடரவும்.',
      spray: 'பூச்சிக்கொல்லி தேவையில்லை (0.0 மி.லி) — இயற்கை நன்மை செய்யும் பூச்சிகளை காக்கவும்.',
      organic: 'பஞ்சகாவ்யா அல்லது மீன் அமில கரைசல் வாரம் ஒருமுறை தெளிக்கலாம்.',
      prevention: 'சொட்டு நீர் பாசனம் தொடரவும், சரியான வடிகால் வசதி உறுதி செய்யவும்.',
    },
    'Black Spot': {
      title: 'கருப்புப் புள்ளி நோய் (Diplocarpon rosae)',
      status: 'இலையின் மேற்பகுதியில் வட்ட வடிவ கருப்பு புள்ளிகள் மற்றும் மஞ்சள் வளையம்.',
      action: 'பாதிக்கப்பட்ட இலைகளை உடனடியாக கிள்ளி எடுத்து எரிக்கவும்.',
      spray: 'மைகோபுட்டானில் அல்லது காப்பர் ஆக்டானோயேட் (12.0 மி.லி) தெளிக்கவும்.',
      organic: 'வேப்பெண்ணெய் (3 மி.லி/லி) மற்றும் காதி சோப் கரைசல் தெளிக்கவும்.',
      prevention: 'மாலையில் இலைகளில் தண்ணீர் படாமல் வேருக்கு மட்டும் பாசனம் செய்யவும்.',
    },
    'Powdery Mildew': {
      title: 'சாம்பல் நோய் (Podosphaera pannosa)',
      status: 'இலைகள் மற்றும் மொட்டுகளின் மேல் வெள்ளை சாம்பல் போன்ற பூஞ்சான படலம்.',
      action: 'பாதிக்கப்பட்ட தளிர்களை வெட்டி அப்புறப்படுத்தி காற்றோட்டத்தை அதிகரிக்கவும்.',
      spray: 'பொட்டாசியம் பைகார்பனேட் அல்லது நனையும் கந்தகம் (10.5 மி.லி) தெளிக்கவும்.',
      organic: 'பச்சைப்பால் கரைசல் (40% பால் + 60% தண்ணீர்) வெயில் நேரத்தில் தெளிக்கவும்.',
      prevention: 'தழைச்சத்து உரங்களை அதிகமாக இடுவதை தவிர்க்கவும்.',
    },
    'Rust': {
      title: 'துரு நோய் (Phragmidium mucronatum)',
      status: 'இலையின் அடிப்பகுதியில் பிரகாசமான ஆரஞ்சு நிற துரு கொப்புளங்கள்.',
      action: 'நோய் தாக்கிய இலைகளை காற்றில் அசைக்காமல் கவனமாக கிள்ளி அகற்றவும்.',
      spray: 'டெபுகோனசோல் அல்லது மாங்கோசெப் (14.0 மி.லி) இலையின் கீழ் நன்கு படும்படி தெளிக்கவும்.',
      organic: 'போர்டோ கலவை (1%) அல்லது பஞ்சகாவ்யா கரைசல் பயன்படுத்தவும்.',
      prevention: 'செடிகளை நெருக்கமாக நடாமல் போதுமான இடைவெளியில் நடவும்.',
    },
    'Downy Mildew': {
      title: 'அடிச்சாம்பல் நோய் (Peronospora sparsa)',
      status: 'நரம்புகளுக்கு இடையே ஊதா-சிவப்பு கட்டங்கள் மற்றும் இலை உதிர்தல்.',
      action: 'அதிக ஈரப்பதத்தை குறைத்து தீவிரமாக பாதிக்கப்பட்ட பகுதிகளை கவாத்து செய்யவும்.',
      spray: 'அசாக்ஸிஸ்ட்ரோபின் அல்லது பாஸ்போரஸ் அமிலம் (13.5 மி.லி) தெளிக்கவும்.',
      organic: 'சூடோமோனாஸ் புளோரசன்ஸ் மற்றும் பேசிலஸ் சப்டிலிஸ் உயிர் உரங்கள் தெளிக்கவும்.',
      prevention: 'பசுமைக்குடிலில் இரவு நேர ஈரப்பதம் 80% மேல் ஏறாமல் காற்றோட்டம் செய்யவும்.',
    },
    'Botrytis Blight': {
      title: 'சாம்பல் நிற அழுகல் நோய் (Botrytis cinerea)',
      status: 'பூ மொட்டுகள் மற்றும் தண்டுகளில் சாம்பல் நிற பூஞ்சை அழுகல்.',
      action: 'அழுகிய பூக்கள் மற்றும் மொட்டுகளை பிளாஸ்டிக் பையில் இட்டு அப்புறப்படுத்தவும்.',
      spray: 'பென்ஹெக்சாமிட் அல்லது பேசிலஸ் பூஞ்சாணக்கொல்லி (11.0 மி.லி) தெளிக்கவும்.',
      organic: 'டிரைக்கோடெர்மா விரிடி மற்றும் சிலிக்கா இலை தெளிப்பான்.',
      prevention: 'மழைக்காலங்களில் பூக்கள் நனையாமல் கவனித்துக் கொள்ளவும்.',
    },
    'Early Blight': {
      title: 'இலை கருகல் நோய் (Cercospora / Alternaria)',
      status: 'இலைகளில் வட்ட வடிவ வளையங்களுடன் கூடிய பழுப்பு புள்ளிகள்.',
      action: 'கீழ் மட்டத்து பாதிக்கப்பட்ட இலைகளை வெட்டி நிலத்தை சுத்தமாக வைக்கவும்.',
      spray: 'குளோரோதலோனில் அல்லது வேம்பு-காப்பர் கலவை (12.5 மி.லி) தெளிக்கவும்.',
      organic: 'சூடோமோனாஸ் மற்றும் காப்பர் சோப் கலவை தெளிக்கவும்.',
      prevention: 'மண்ணில் இருந்து மழைத்துளி இலைகளில் தெறிக்காமல் வைக்கோல் மூடாக்கு போடவும்.',
    },
  },
  Hindi: {
    badge: 'हिन्दी — राष्ट्रीय कृषि परामर्श',
    'Healthy': {
      title: 'पौधा पूर्णतः स्वस्थ है',
      status: 'पत्तियों में कोई बीमारी नहीं है, पर्णहरिम (क्लोरोफिल) उत्तम स्थिति में है।',
      action: 'किसी रासायनिक छिड़काव की आवश्यकता नहीं है। नियमित देखभाल रखें।',
      spray: 'स्प्रे चक्र निरस्त (0.0 mL) — लाभकारी मित्र कीटों की सुरक्षा करें।',
      organic: 'हफ्ते में एक बार वर्मीवॉश या जीवामृत का हल्का छिड़काव करें।',
      prevention: 'उचित जल निकासी और ड्रिप सिंचाई का प्रयोग जारी रखें।',
    },
    'Black Spot': {
      title: 'काला धब्बा रोग (Black Spot)',
      status: 'पत्तियों पर काले गोल धब्बे और उनके चारों ओर पीले घेरे दिखाई देते हैं।',
      action: 'संक्रमित पत्तियों को तुरंत तोड़कर खेत से दूर नष्ट कर दें।',
      spray: 'माइक्लोबुटानिल या कॉपर कवकनाशी (12.0 mL) का लक्षित छिड़काव करें।',
      organic: 'नीम का तेल (3 ml/L) और बेकिंग सोडा घोल का छिड़काव करें।',
      prevention: 'शाम के समय पत्तियों पर पानी का छिड़काव न करें; केवल जड़ों में पानी दें।',
    },
    'Powdery Mildew': {
      title: 'चूर्णिल आसिता / छाछिया रोग (Powdery Mildew)',
      status: 'पत्तियों और कलियों पर सफेद पाउडर जैसी फफूंद की परत बन जाती है।',
      action: 'हवा के प्रवाह को बेहतर बनाने के लिए घनी शाखाओं की छंटाई करें।',
      spray: 'पोटेशियम बाइकार्बोनेट या घुलनशील सल्फर (10.5 mL) का छिड़काव करें।',
      organic: 'कच्चे दूध का घोल (40% दूध + 60% पानी) धूप के समय छिड़कें।',
      prevention: 'अत्यधिक नाइट्रोजन युक्त खादों का प्रयोग न करें।',
    },
    'Rust': {
      title: 'गेरुआ / रतुआ रोग (Leaf Rust)',
      status: 'पत्ती की निचली सतह पर नारंगी-भूरे रंग के फफोले पड़ जाते हैं।',
      action: 'संक्रमित पत्तियों को बिना हिलाए सावधानीपूर्वक काटकर हटा दें।',
      spray: 'टेबुकोनाज़ोल या मैंकोज़ेब (14.0 mL) का निचली पत्तियों पर छिड़काव करें।',
      organic: 'बोर्डो मिश्रण (1%) या खट्टी छाछ का छिड़काव करें।',
      prevention: 'पौधों के बीच उचित दूरी बनाकर वायु संचरण सुनिश्चित करें।',
    },
    'Downy Mildew': {
      title: 'मृदुरोमिल आसिता (Downy Mildew)',
      status: 'पत्तियों की नसों के बीच बैंगनी-लाल कोणीय धब्बे और भारी पत्ती पतन।',
      action: 'पॉलीहाउस में नमी को तुरंत 80% से नीचे लाएं और प्रभावित तने काटें।',
      spray: 'एज़ोक्सीस्ट्रोबिन या फॉस्फोरस एसिड (13.5 mL) का छिड़काव करें।',
      organic: 'स्यूडोमोनास फ्लोरेसेंस जैविक कवकनाशी का प्रयोग करें।',
      prevention: 'रात होने से पहले ग्रीनहाउस को हवादार बनाएं।',
    },
    'Botrytis Blight': {
      title: 'ग्रे मोल्ड / बोट्रीटिस ब्लाइट',
      status: 'फूलों और कलियों पर धूसर रंग की फफूंद और सड़ांध।',
      action: 'सड़ी हुई कलियों और गिरे हुए फूलों को तुरंत पॉलीथिन में बंद कर हटाएं।',
      spray: 'फेनहेक्सामाइड या बैसिलस कवकनाशी (11.0 mL) का छिड़काव करें।',
      organic: 'ट्राइकोडर्मा और सिलिका युक्त जैविक छिड़काव।',
      prevention: 'फूलों पर पानी की बूंदें न ठहरने दें।',
    },
    'Early Blight': {
      title: 'अगेती झुलसा रोग (Early Leaf Blight)',
      status: 'पत्तियों पर संकेंद्री छल्लों वाले भूरे गोल धब्बे।',
      action: 'नीचे की प्रभावित पत्तियों को काटकर मिट्टी साफ रखें।',
      spray: 'क्लोरोथैलोनिल या कॉपर कवकनाशी (12.5 mL) का छिड़काव करें।',
      organic: 'कॉपर सोप और ट्राइकोडर्मा हरज़ियानम का प्रयोग करें।',
      prevention: 'मिट्टी पर मल्चिंग बिछाएं ताकि पानी के छींटों से बीजाणु न फैलें।',
    },
  },
  Spanish: {
    badge: 'Español — Asesoría Agronómica',
    'Healthy': {
      title: 'Follaje en Estado Óptimo',
      status: 'Tejido foliar con cutícula intacta y máxima tasa fotosintética.',
      action: 'No se requiere intervención química. Mantenga el riego estándar.',
      spray: 'Ciclo de aspersión omitido (0.0 mL) para proteger la fauna benéfica.',
      organic: 'Aplicación foliar de extracto de algas para bioestimulación.',
      prevention: 'Mantener buena aireación en el cultivo y monitoreo regular.',
    },
    'Black Spot': {
      title: 'Mancha Negra (Diplocarpon rosae)',
      status: 'Lesiones necróticas circulares con halos cloróticos pronunciados.',
      action: 'Podar y retirar folíolos enfermos; desinfectar tijeras con alcohol.',
      spray: 'Micro-aspersión de precisión de 12.0 mL de Miclobutanil o Cobre.',
      organic: 'Bicarbonato de potasio con aceite agrícola de neem.',
      prevention: 'Evitar mojar el follaje durante el riego al atardecer.',
    },
    'Powdery Mildew': {
      title: 'Oídio / Cenecilla (Podosphaera pannosa)',
      status: 'Micelio superficial blanquecino en haz y envés de las hojas.',
      action: 'Podar brotes severamente afectados para facilitar ventilación.',
      spray: 'Micro-aspersión de 10.5 mL de Bicarbonato Potásico o Azufre.',
      organic: 'Solución de leche desnatada al 40% en agua a plena luz solar.',
      prevention: 'Evitar exceso de abonado nitrogenado.',
    },
    'Rust': {
      title: 'Roya Foliar (Phragmidium mucronatum)',
      status: 'Pústulas anaranjadas brillantes en el envés de la hoja.',
      action: 'Retirar cuidadosamente las hojas con pústulas para evitar dispersión.',
      spray: 'Micro-aspersión de 14.0 mL de Tebuconazol o Mancozeb.',
      organic: 'Caldo bordelés (1%) o suspensión de azufre humectable.',
      prevention: 'Limpiar y enterrar hojas caídas al final de temporada.',
    },
    'Downy Mildew': {
      title: 'Mildiú Velloso (Peronospora sparsa)',
      status: 'Manchas angulares pardo-rojizas delimitadas por las nervaduras.',
      action: 'Reducir humedad ambiental bajo el 80% y podar tejido necrosado.',
      spray: 'Micro-aspersión de 13.5 mL de Azoxistrobina o Ácido Fosforoso.',
      organic: 'Bacillus subtilis y oxicloruro de cobre.',
      prevention: 'Favorecer ventilación cruzada en el invernadero.',
    },
    'Botrytis Blight': {
      title: 'Moho Gris (Botrytis cinerea)',
      status: 'Pudrición blanda con masa conidial grisácea en botones florales.',
      action: 'Eliminar botones y flores podridas en bolsas herméticas.',
      spray: 'Micro-aspersión de 11.0 mL de Fenhexamida o biofungicida Bacillus.',
      organic: 'Serenade (Bacillus amyloliquefaciens) y refuerzo con silicio.',
      prevention: 'Evitar heridas mecánicas y condensación sobre flores.',
    },
    'Early Blight': {
      title: 'Tizón Temprano (Cercospora / Alternaria)',
      status: 'Manchas en diana concéntricas con centros apergaminados claros.',
      action: 'Remover follaje inferior afectado y limpiar la cama de cultivo.',
      spray: 'Micro-aspersión de 12.5 mL de Clorotalonil o mezcla Cobre-Neem.',
      organic: 'Jabón cúprico y Trichoderma harzianum.',
      prevention: 'Acolchado del suelo para evitar salpicaduras de lluvia.',
    },
  },
};

