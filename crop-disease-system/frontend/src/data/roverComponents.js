/**
 * Realistic Industrial Row-Crop Agricultural Spray Rover Hardware Architecture
 * Comprehensive engineering data for all 8 sub-assemblies formatted for Invigilator 3D Demo Mode:
 * 1. Component Name & Role
 * 2. How It Reduces Pesticide Liquid (Selective Micro-Spraying vs Blanket Spraying)
 * 3. Working Mechanism & Signal Flow
 * 4. Key Characteristics (Durability, IP rating, precision, speed, materials)
 * 5. Hardware Configuration & Specs (Exact engineering specifications)
 */

export const ROVER_COMPONENTS = [
  {
    id: 'multispectral_gimbal',
    number: '01',
    partNumber: 'AGR-SEN-01',
    name: '01 · Multispectral RGB+NIR Leaf Scanner',
    shortName: '01 · Scanner',
    category: 'Optical Canopy Sensing',
    icon: '🔬',
    color: '#8B5CF6',
    keySpec: '850nm NIR + Dual Laser Crosshair',
    explodedOffset: [-0.45, 0.55, 0.55],
    pinOffset: [-0.65, 0.45, 0.55],

    whatItDoes:
      'Gimbal-stabilized dual-band optical camera unit that inspects rose and crop foliage at 10x optical zoom, combining visible RGB wavelengths with 850nm Near-Infrared (NIR) illumination to detect cellular-level fungal spore outbreaks before visual lesion yellowing occurs.',

    howItReducesLiquid:
      'Captures ultra-high-resolution macro RGB and 850nm Near-Infrared images of individual leaves. If the canopy shows uniform chlorophyll reflectance without fungal spore necrosis, the edge AI confirms HEALTHY and locks the spray solenoid valve CLOSED—delivering exactly 0.0 mL fluid and zero chemical waste.',

    fieldUsage:
      'Points directly into the crop foliage as the rover pauses at each plant waypoint. The 2-axis motorized gimbal tilts downward and sweeps across the canopy, firing green laser targeting crosshairs and NIR strobes to eliminate natural ambient shadow variations.',

    howItWorks:
      'A Sony IMX477 12.3MP sensor with switchable IR-cut filter captures 4K frames at 60 fps. Synchronized 850nm NIR LEDs illuminate the leaf surface, calculating a localized NDVI index. Micro-servos maintain a perpendicular 90° optical axis relative to the leaf surface regardless of terrain tilt.',

    keyCharacteristics: {
      durability: 'CNC anodized billet aluminum housing with O-ring sealed sapphire optical glass.',
      ipRating: 'IP67 waterproof and pesticide-mist sealed enclosure.',
      precision: '0.05° angular gimbal tracking with 35µm/pixel optical spatial resolution.',
      responseSpeed: '<45ms target acquisition and auto-focus lock.',
      materials: 'Aircraft 6061-T6 aluminum, anti-reflective coated sapphire glass, carbon gimbal yoke.',
    },

    hardwareSpecs: [
      { label: 'Sensor', value: 'Sony IMX477 1/2.3" 12.3MP CMOS with NIR Bandpass Filter' },
      { label: 'NIR Emitter', value: '8x High-Output 850nm Narrow-Band LEDs (120° dispersion)' },
      { label: 'Targeting Reticle', value: 'Coaxial 532nm Green Laser Crosshair (Class 1 Eye-Safe)' },
      { label: 'Gimbal Actuation', value: '2-Axis Brushless Direct-Drive Gimbal (±45° Pitch, ±90° Yaw)' },
      { label: 'Focal Distance', value: '150mm–400mm dynamic macro auto-focus' },
      { label: 'Data Interface', value: 'MIPI-CSI 4-Lane to Edge AI Compute Unit' },
    ],

    liveTelemetry: {
      exposure: '1/250s auto-calibrated',
      nirWavelength: '850 nm',
      gimbalPitch: '38.5° down-tilt',
      lensTemp: '24.8°C',
    },
  },

  {
    id: 'navigation_sensors',
    number: '02',
    partNumber: 'AGR-NAV-02',
    name: '02 · 360° LiDAR & Ultrasonic Row-Guidance Array',
    shortName: '02 · LiDAR',
    category: 'Autonomous Guidance & SLAM',
    icon: '📡',
    color: '#F59E0B',
    keySpec: '10Hz 360° SLAM + Dual Cones',
    explodedOffset: [0.0, 0.65, 0.85],
    pinOffset: [0.0, 0.65, 0.75],

    whatItDoes:
      'Provides continuous 360° 2D laser environmental mapping and dual ultrasonic ranging to navigate autonomous furrow rows, detect dead-end headlands, and align the rover within ±5mm of every plant center.',

    howItReducesLiquid:
      'Maintains exact 25cm standoff distance between nozzle tip and plant canopy while centering the rover along furrow furrows. Prevents the spray nozzle from triggering off-target, ensuring chemical mist never drifts into bare soil.',

    fieldUsage:
      'Continuously active during autonomous patrol. Guides the rover in a serpentine path across rows R1, R2, and R3, automatically decelerating when approaching plants and detecting humans or obstacles.',

    howItWorks:
      'A rotating infrared pulsed laser diode measures time-of-flight distances across 360° at 10Hz. Simultaneously, dual HC-SR04 ultrasonic transceivers measure the crop canopy standoff distance. The onboard EKF (Extended Kalman Filter) fuses wheel odometry and LiDAR point clouds to eliminate GPS drift.',

    keyCharacteristics: {
      durability: 'Impact-resistant polycarbonate dome with dust wiper and debris deflector.',
      ipRating: 'IP66 water-resistant rotor housing with sealed brushless spin motor.',
      precision: '±5mm range accuracy from 0.12m to 12.0m operating radius.',
      responseSpeed: '10Hz full 360° sweep rate (4,000 range samples per second).',
      materials: 'Optical-grade polycarbonate, CNC machined base, stainless mounting hardware.',
    },

    hardwareSpecs: [
      { label: 'LiDAR Scanner', value: '360° Time-of-Flight Laser Scanner (12m range, 10Hz rotation)' },
      { label: 'Ultrasonic Array', value: 'Dual 40kHz HC-SR04 Transceivers (2cm–400cm, 15° cone)' },
      { label: 'SLAM Algorithm', value: 'Cartographer 2D Real-Time Laser Odometry & Mapping' },
      { label: 'Waypoint Accuracy', value: '±5mm furrow centerline tracking' },
      { label: 'Obstacle Detection', value: '<25ms emergency stop trigger on obstacle proximity <30cm' },
      { label: 'Interface', value: 'High-speed UART & I2C to ESP32-S3 / Master Navigation MCU' },
    ],

    liveTelemetry: {
      scanRate: '10.0 Hz (600 RPM)',
      obstaclesDetected: '0 within 1.5m',
      rowAlignment: '99.4% centerline',
      standoffDistance: '24.8 cm target',
    },
  },

  {
    id: 'edge_ai_core',
    number: '03',
    partNumber: 'AGR-AIX-03',
    name: '03 · Edge AI Compute & ESP32-S3 Controller',
    shortName: '03 · Edge AI',
    category: 'Avionics & Neural Inference',
    icon: '🧠',
    color: '#06B6D4',
    keySpec: '240MHz Dual-Core + ONNX INT8',
    explodedOffset: [0.55, 0.65, 0.20],
    pinOffset: [0.65, 0.55, 0.20],

    whatItDoes:
      'The central computational brain of the rover. Processes high-speed camera frames, executes neural network disease classification across 7 crop pathology classes, computes targeted chemical dosages, and controls solenoid valves.',

    howItReducesLiquid:
      'Executes quantized MobileNetV3 INT8 neural network inference in 29.4ms right at the edge. Instantly classifies healthy crops and inhibits solenoid actuation (0.0 mL sprayed). Only triggers a micro-dose when disease confidence exceeds 90% threshold.',

    fieldUsage:
      'Runs autonomous control loops: receives leaf photos from the gimbal camera, performs CLAHE contrast equalization, runs ONNX INT8 inference, logs telemetry via Wi-Fi/LoRa to the digital twin, and triggers the spray solenoid.',

    howItWorks:
      'The ESP32-S3 dual-core Xtensa LX7 processor (240MHz) with vector AI instructions runs quantized INT8 weights. When a disease is confirmed (e.g. Powdery Mildew 96.8%), the MCU calculates exact pulse width (e.g. 1.8s for 12.0 mL) and sends a PWM gate signal to the solenoid MOSFET.',

    keyCharacteristics: {
      durability: 'Sealed IP67 aluminum avionics enclosure with active cooling heatsink and EMI shielding.',
      ipRating: 'IP67 fully sealed against moisture, dust, and corrosive fungicide vapors.',
      precision: '29.4ms deterministic inference cycle with zero cloud dependency.',
      responseSpeed: '<2ms GPIO output response to solenoid driver upon inference completion.',
      materials: 'Anodized 6061-T6 aluminum heatsink case with hermetic Mil-Spec cable glands.',
    },

    hardwareSpecs: [
      { label: 'Microcontroller', value: 'Espressif ESP32-S3 Dual-Core Xtensa LX7 @ 240MHz (512KB SRAM, 8MB PSRAM)' },
      { label: 'AI Accelerator', value: 'Vector Neural Processing Extensions (INT8 quantized inference engine)' },
      { label: 'Neural Model', value: 'MobileNetV3-Small INT8 (4.2MB footprint, 7 disease classes)' },
      { label: 'Inference Latency', value: '29.4 ms per leaf frame' },
      { label: 'Wireless Link', value: 'Wi-Fi 802.11 b/g/n + LoRa 915MHz telemetry link to Digital Twin' },
      { label: 'I/O Peripherals', value: 'Dual CAN-bus, 3x UART, I2C, SPI, 16-channel PWM outputs' },
    ],

    liveTelemetry: {
      coreFrequency: '240 MHz dual-core',
      int8Latency: '29.4 ms',
      modelMemory: '4.2 MB / 8.0 MB PSRAM',
      wifiRssi: '-54 dBm (Stable)',
    },
  },

  {
    id: 'chemical_tank',
    number: '04',
    partNumber: 'AGR-TNK-04',
    name: '04 · Pressurized Agro-Chemical Reservoir Tank',
    shortName: '04 · Chem Tank',
    category: 'Agrochemical Storage & Metering',
    icon: '🧪',
    color: '#38BDF8',
    keySpec: '1.2L Graduated + 2.8 Bar Relief',
    explodedOffset: [-0.60, 0.45, -0.15],
    pinOffset: [-0.65, 0.45, -0.20],

    whatItDoes:
      'Translucent, graduated agrochemical tank that stores bio-fungicide liquid under hydraulic pressure and delivers it through an intake strainer to the high-pressure micro-pump.',

    howItReducesLiquid:
      'Stores concentrated organic bio-fungicide in a sealed 1.2-liter graduated reservoir. Because healthy plants receive 0.0 mL, the liquid level drops by only 10.5–14.0 mL per infected plant, conserving up to 82.4% chemical compared to 50 mL/plant broadcast spraying.',

    fieldUsage:
      'Allows field operators to monitor fluid consumption via calibrated exterior graduation marks. An integrated float switch triggers low-fluid telemetry warnings when remaining volume drops below 150 mL.',

    howItWorks:
      'Constructed from rotomolded high-density polyethylene (HDPE) impervious to acidic and alkaline pesticides. A bottom sump intake with 50-mesh stainless-steel strainer prevents sediment from entering the pump, while a 2.8-bar pressure relief cap prevents over-pressurization during hot field conditions.',

    keyCharacteristics: {
      durability: 'UV-stabilized HDPE resistant to corrosive copper fungicides and wettable sulfur.',
      ipRating: 'IP66 hermetic cap seal with one-way breather check-valve.',
      precision: 'Molded 50mL graduation lines with optical continuous level sensor (±5mL accuracy).',
      responseSpeed: 'Zero-slosh internal baffle baffles fluid movement during rapid 0.5 m/s rover turns.',
      materials: 'UV-stabilized translucent High-Density Polyethylene (HDPE) with Viton gaskets.',
    },

    hardwareSpecs: [
      { label: 'Usable Capacity', value: '1,200 mL (1.2 Liters) concentrated solution' },
      { label: 'Level Sensor', value: 'Continuous optical/capacitive fluid column sensor (0–100%)' },
      { label: 'Operating Pressure', value: '2.8 Bar (40.6 PSI) internal regulated pressure' },
      { label: 'Intake Filtration', value: '50-Mesh 316 Stainless-Steel In-Line Suction Strainer' },
      { label: 'Filler Cap', value: 'Threaded 45mm cap with integrated dual-action vacuum breather' },
      { label: 'Chemical Compatibility', value: 'Bio-fungicides, copper octanoate, sulfur, neem oil, systemic sprays' },
    ],

    liveTelemetry: {
      tankLevel: '640 mL remaining',
      linePressure: '2.80 Bar (40.6 PSI)',
      chemicalSaved: '82.4% vs broadcast',
      fillCycles: '12 missions completed',
    },
  },

  {
    id: 'solenoid_valve_pump',
    number: '05',
    partNumber: 'AGR-ACT-05',
    name: '05 · Micro-Diaphragm Pump & High-Speed Solenoid Valve',
    shortName: '05 · Solenoid',
    category: 'Precision Fluidic Actuation',
    icon: '⚡',
    color: '#E11D48',
    keySpec: '15ms Selective Cut-Off · 0.4 mL/s',
    explodedOffset: [-0.40, 0.20, -0.25],
    pinOffset: [-0.60, 0.15, -0.35],

    whatItDoes:
      'Combines a 12V 4-chamber positive-displacement micro-diaphragm pump with an ultra-fast direct-acting solenoid valve to pressurize and meter exact micro-doses of fungicide directly to the spray boom.',

    howItReducesLiquid:
      'The physical gatekeeper of selective spraying. Remains 100% physically locked closed for healthy crops (0.0 mL sprayed). When the AI detects a pathogen, the valve opens in under 15ms for an exact micro-burst (e.g. 1.8s for 12.0 mL) and snaps shut instantly with an anti-drip check valve to prevent post-spray leakage.',

    fieldUsage:
      'Maintains constant 2.8 bar line pressure. The solenoid valve actuates only during the targeted 1.8-second spray cycle at infected plants, delivering exact prescription dosages and cutting fluid off instantly when moving to healthy plants.',

    howItWorks:
      'The pump draws liquid from the tank sump and pressurizes the hydraulic manifold to 2.8 bar. A direct-acting 12V DC solenoid valve with a fluoroelastomer plunger seal remains energization-controlled by the ESP32-S3 MOSFET driver. The valve snaps open in <15ms, releases fluid through an optical pulse flowmeter, and snaps shut with zero post-spray drip.',

    keyCharacteristics: {
      durability: 'Solid brass and stainless-steel body rated for >2,000,000 continuous cycling pulses.',
      ipRating: 'IP68 fully encapsulated epoxy solenoid coil impervious to liquid immersion.',
      precision: 'Micro-metering flow rate calibrated to exactly 0.40 mL/s (±0.05 mL accuracy).',
      responseSpeed: '<15 ms opening and closing response time with instant zero-drip shut-off.',
      materials: 'Forged brass manifold, Viton elastomeric seals, 316 stainless-steel plunger spring.',
    },

    hardwareSpecs: [
      { label: 'Solenoid Actuator', value: '12V DC Direct-Acting High-Speed Solenoid (<15 ms actuation)' },
      { label: 'Hydraulic Pump', value: '12V 4-Chamber Micro-Diaphragm Pump with Auto-Demand Switch' },
      { label: 'Flow Rate', value: '0.40 mL/second calibrated micro-metering delivery' },
      { label: 'Cut-Off Speed', value: '<15 ms closing time with integrated 0.7-bar anti-drip check valve' },
      { label: 'Metering Accuracy', value: '±0.05 mL per application cycle (optical pulse feedback)' },
      { label: 'Power Consumption', value: '12V @ 1.2A during spray pulse (0W standby)' },
    ],

    liveTelemetry: {
      solenoidState: 'Locked Closed (0.0 mL)',
      pulseResponse: '14.2 ms latency',
      manifoldPressure: '2.82 Bar',
      antiDripSeal: '100% Seated',
    },
  },

  {
    id: 'spray_boom_nozzles',
    number: '06',
    partNumber: 'AGR-ACT-06',
    name: '06 · 3-DOF Articulated Boom & Hollow-Cone Atomizer Nozzle',
    shortName: '06 · Boom',
    category: 'Canopy Targeting & Droplet Atomization',
    icon: '🚿',
    color: '#F43F5E',
    keySpec: 'VMD 50µm Mist · -5kV Induction',
    explodedOffset: [0.75, 0.55, 0.45],
    pinOffset: [0.70, 0.45, 0.40],

    whatItDoes:
      'Articulated 3-degree-of-freedom robotic boom arm carrying a TeeJet-style hollow-cone atomizer nozzle with an integrated electrostatic induction ring to coat diseased foliage.',

    howItReducesLiquid:
      'Extends directly into the infected canopy and creates a focused 60° hollow cone of 50-micron mist charged to -5kV. The electrostatic field wraps droplets around both the top and underside of leaves where fungi live, achieving 98% lesion coverage with only 12 mL instead of 50 mL.',

    fieldUsage:
      'Folds safely against the rover body while driving between rows. When an infected plant is reached, the boom smoothly articulates 380mm into the canopy, aims the nozzle tip 25cm from the lesion, and oscillates during spraying to penetrate dense rose/tomato foliage.',

    howItWorks:
      'Fluid from the solenoid valve flows through high-pressure braided PTFE tubing to a precision brass nozzle tip with an alumina ceramic orifice. The orifice shears the pressurized stream into a fine mist cone with Volume Median Diameter (VMD) of 50 microns. A -5kV induction ring imparts a negative charge on droplets, causing them to cling electrostatically to grounded plant leaves.',

    keyCharacteristics: {
      durability: 'Polished solid brass nozzle body with wear-resistant alumina ceramic core insert.',
      ipRating: 'IP67 waterproof servo actuators with magnetic angle encoders.',
      precision: 'Targeted spot application footprint: 18cm diameter coverage at 25cm standoff.',
      responseSpeed: '<350 ms full boom deployment from folded transport position.',
      materials: 'Carbon-fiber boom links, 6061 aluminum joints, ceramic orifice nozzle tip.',
    },

    hardwareSpecs: [
      { label: 'Nozzle Type', value: 'TeeJet-Style Brass Hollow-Cone Atomizer with Alumina Ceramic Orifice' },
      { label: 'Droplet Spectrum', value: 'VMD 45–55 Microns (optimized for foliar bio-fungicide adhesion)' },
      { label: 'Electrostatic Charge', value: '-5 kV Induction Ring for wrap-around underside leaf deposition' },
      { label: 'Boom Reach', value: '380 mm horizontal canopy reach with 3-DOF articulation' },
      { label: 'Spray Pattern', value: '60° Hollow Cone (18cm footprint @ 25cm distance)' },
      { label: 'Tubing', value: 'High-pressure braided stainless PTFE tubing (10 bar burst rating)' },
    ],

    liveTelemetry: {
      boomAngle: '38.4° canopy reach',
      dropletVmd: '52 µm',
      solenoidState: 'Ready / Armed',
      sprayPattern: '60° Hollow Cone',
    },
  },

  {
    id: 'battery_power',
    number: '07',
    partNumber: 'AGR-PWR-07',
    name: '07 · 48V LiFePO4 Battery Pack & BMS',
    shortName: '07 · LiFePO4',
    category: 'Energy Storage & Power Distribution',
    icon: '🔋',
    color: '#10B981',
    keySpec: '48V 15Ah (720Wh) · Active BMS',
    explodedOffset: [0.0, 0.55, -0.75],
    pinOffset: [0.0, 0.55, -0.65],

    whatItDoes:
      'Supplies high-current electrical energy to drive hub motors, high-pressure pump, dual-core AI processor, LiDAR, and servo actuators with thermally-regulated DC power rails.',

    howItReducesLiquid:
      'Provides ultra-clean, noise-free DC power to the edge AI compute core and solenoid driver. Prevents voltage drops or false triggers during motor acceleration, guaranteeing that the solenoid valve actuates only when commanded.',

    fieldUsage:
      'Powers the entire robotic rover for up to 8.5 continuous hours of scouting and micro-spraying on a single charge. Features a quick-release slide-and-lock handle that allows a farmer to hot-swap batteries in under 30 seconds.',

    howItWorks:
      'Sixteen 3.2V prismatic Lithium Iron Phosphate (LiFePO4) cells wired in series provide a nominal 51.2V bus. An integrated Texas Instruments smart BMS monitors per-cell voltage, state of charge (SoC), and internal pack temperatures. High-current Anderson connectors feed DC-DC buck converters delivering 48V (motors/pump), 12V (solenoids/LiDAR), and 5V/3.3V (ESP32-S3/cameras).',

    keyCharacteristics: {
      durability: 'Safe LiFePO4 chemistry with zero thermal runaway risk; rated for >3,500 full charge cycles.',
      ipRating: 'IP67 sealed die-cast aluminum enclosure with pressure equalization Gore-Tex vent.',
      precision: 'Coulomb-counting state-of-charge tracking with ±0.5% fuel gauge accuracy.',
      responseSpeed: 'Instantaneous 60A peak pulse current delivery for rapid motor acceleration.',
      materials: 'Flame-retardant polycarbonate internal cell carriers and extruded aluminum cooling fins.',
    },

    hardwareSpecs: [
      { label: 'Cell Chemistry', value: 'Lithium Iron Phosphate (LiFePO4) 16S1P Prismatic' },
      { label: 'Nominal Voltage', value: '51.2 V (44.0V cut-off to 58.4V max charge)' },
      { label: 'Rated Capacity', value: '15.0 Ah · 768 Wh usable electrical energy' },
      { label: 'Continuous Output', value: '30.0 A (1,500 W continuous power)' },
      { label: 'Field Autonomy', value: '8.5 Hours scouting and micro-spraying on a single charge' },
      { label: 'Connector', value: 'Anderson Powerpole SB50 High-Current Hot-Swap Terminal' },
    ],

    liveTelemetry: {
      busVoltage: '51.8 V',
      drawCurrent: '3.6 A',
      stateOfCharge: '86.4%',
      packTemp: '27.4°C',
    },
  },

  {
    id: 'drive_suspension',
    number: '08',
    partNumber: 'AGR-DRV-08',
    name: '08 · 4WD High-Clearance Rocker-Bogie Drive & Lugged Tires',
    shortName: '08 · 4WD Drive',
    category: 'Locomotion & Terrain Dynamics',
    icon: '🛞',
    color: '#0284C7',
    keySpec: '220mm Clearance · ±5mm Odometry',
    explodedOffset: [0.0, -0.25, 0.0],
    pinOffset: [0.60, -0.15, -0.45],

    whatItDoes:
      'Provides high-torque all-terrain locomotion, active furrow row traversal, and differential steering across muddy soil mounds, raised furrows, and uneven crop topography without destabilizing the sensor payload.',

    howItReducesLiquid:
      'Eliminates chassis roll and vibration so the multispectral camera captures blur-free leaf images. During the 1.8s spray pulse, all 4 brushless hub brakes lock electronically, ensuring the spray nozzle remains rock-steady and doesn’t drift off the infected target.',

    fieldUsage:
      'Engaged continuously throughout autonomous scouting patrols. Smoothly propels the rover at a calibrated 0.5 m/s between crop rows (R1, R2, R3), executes 180° headland pivot turns, and locks hub brakes during spraying.',

    howItWorks:
      'The navigation state machine feeds angular and linear velocity commands to four independent brushless wheel-hub controllers via CAN-bus. High-resolution magnetic quadrature encoders (2048 CPR) measure wheel slip in real-time, dynamically shunting torque to high-traction wheels. The passive rocker-bogie linkage pivots around a central differential bar to keep all four chevron-lugged tires in constant ground contact.',

    keyCharacteristics: {
      durability: 'Forged aircraft-grade 6061-T6 aluminum suspension arms with hardened chromoly steel pivot shafts.',
      ipRating: 'IP67 dust-tight and submersible hub motors impervious to muddy standing water and pesticide mist.',
      precision: 'Closed-loop wheel odometry with ±5mm positioning accuracy per furrow waypoint.',
      responseSpeed: '<12 ms torque step response with regenerative electronic braking.',
      materials: 'Vulcanized natural rubber tire compound with high-flexibility nylon casing and CNC anodized alloy rims.',
    },

    hardwareSpecs: [
      { label: 'Drive Motors', value: '4x 48V 250W Brushless DC (BLDC) Planetary Hub Drives' },
      { label: 'Peak Torque', value: '4x 32.0 Nm (128 Nm total tractive output)' },
      { label: 'Tires', value: 'High-Traction Chevron-Lug Agricultural Rubber (210mm Ø, 75mm width)' },
      { label: 'Ground Clearance', value: '220 mm underbody clearance (zero crop canopy friction)' },
      { label: 'Wheelbase & Track', value: 'Wheelbase: 620 mm · Track Width: 560 mm (straddles rows cleanly)' },
      { label: 'Braking', value: 'Electronic regenerative + magnetic holding brake (<10ms lock)' },
    ],

    liveTelemetry: {
      status: 'Active Traversal',
      avgRpm: 142,
      tractiveTorque: '24.6 Nm',
      wheelSlipRatio: '1.8%',
    },
  },
];

export function getRoverComponent(partId) {
  return ROVER_COMPONENTS.find((p) => p.id === partId) || ROVER_COMPONENTS[0];
}
