import { Listing, DepositClearingRecord } from '../types';

export const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'rel-krk-01',
    type: 'lease_takeover',
    title: 'Room near AGH and UJ',
    city: 'Kraków',
    district: 'Krowodrza',
    address: 'ul. Czarnowiejska 52, 30-054 Kraków',
    roomType: 'Private room',
    monthlyRentPLN: 1650,
    czynszAdminPLN: 280,
    billsIncluded: true,
    depositPLN: 1800,
    availableDate: '2026-10-15',
    leaseEndDate: '2027-06-30',
    remainingMonths: 8,
    squareMeters: 19,
    isFurnished: true,
    flatmatesCount: 2,
    distanceToCampus: '5 min walk to AGH',
    meldunekAllowed: true,
    landlordApproved: true,
    images: [
      '/images/listing_krakow_loft_1790621454348.jpg',
      '/images/listing_warsaw_mokotow_1790621438299.jpg'
    ],
    statusBadge: 'Active takeover',
    landlordName: 'Tomasz Nowak',
    landlordContactEmail: 't.nowak.krakow@gmail.com',
    currentTenant: {
      name: 'Piotr Kamiński',
      nationality: 'Polish',
      role: 'AGH Computer Science Masters',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Polish Passport', 'AGH Student ID', 'Active Lease'],
      reasonForLeaving: 'Starting an Erasmus semester in Berlin.',
      joinedYear: '2024'
    },
    amenities: [
      'High-Speed Fiber (600 Mbps)',
      'Desk & Ergonomic Chair',
      'Washing Machine & Dishwasher',
      'Balcony facing quiet courtyard',
      'Bicycle rack in foyer'
    ],
    universitiesNearby: [
      'AGH University of Science & Technology (5 min walk)',
      'Jagiellonian University Campus (12 min bus)',
      'Kraków University of Economics (15 min tram)'
    ],
    transitNearby: 'Teatr Bagatela tram junction (4 min walk)',
    description: 'Bright and quiet 19 m² private room in a comfortable 3-room student flat in Krowodrza. Fully furnished with double bed, large wardrobe, and wide study desk. Landlord has pre-approved the lease takeover.',
    floor: '2nd floor (with elevator)',
    likesCount: 28,
    lat: 50.0647,
    lng: 19.9234
  },
  {
    id: 'rel-waw-01',
    type: 'lease_takeover',
    title: 'Studio in Upper Mokotów',
    city: 'Warsaw',
    district: 'Mokotów',
    address: 'ul. Rakowiecka 32, 02-521 Warszawa',
    roomType: 'Studio',
    monthlyRentPLN: 2400,
    czynszAdminPLN: 450,
    billsIncluded: true,
    depositPLN: 2850,
    availableDate: '2026-10-15',
    leaseEndDate: '2027-06-30',
    remainingMonths: 8,
    squareMeters: 34,
    isFurnished: true,
    flatmatesCount: 0,
    distanceToCampus: '6 min walk to SGH',
    meldunekAllowed: true,
    landlordApproved: true,
    images: [
      '/images/listing_warsaw_mokotow_1790621438299.jpg',
      '/images/listing_warsaw_center_1790621476399.jpg',
      '/images/listing_wroclaw_nordic_1790621466153.jpg'
    ],
    statusBadge: 'Active takeover',
    landlordName: 'Marek Wiśniewski',
    landlordContactEmail: 'm.wisniewski.nieruchomosci@gmail.com',
    currentTenant: {
      name: 'Matteo Rossi',
      nationality: 'Italian',
      role: 'SGH Masters Exchange Student',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Italian Passport', 'SGH Student ID', 'Active Lease'],
      reasonForLeaving: 'Returning to Milan after completing winter semester.',
      joinedYear: '2024'
    },
    amenities: [
      'High-Speed Fiber (600 Mbps)',
      'Floor-to-Ceiling Windows',
      'Bosch Dishwasher & Induction',
      'Balcony with Park View',
      'Underground Bicycle Storage'
    ],
    universitiesNearby: [
      'Warsaw School of Economics (SGH) - 6 min walk',
      'Warsaw University of Technology (PW) - 12 min tram',
      'University of Warsaw (UW) - 18 min direct metro'
    ],
    transitNearby: 'Metro Pole Mokotowskie (M1 line, 350m)',
    description: 'Quiet, bright studio with custom study desk and full furnishings. Direct handover from departing exchange student with landlord agreement in place. Address registration (meldunek) fully supported by landlord.',
    floor: '4th floor (with elevator)',
    likesCount: 34,
    lat: 52.2085,
    lng: 21.0068
  },
  {
    id: 'rel-wro-01',
    type: 'lease_takeover',
    title: 'Nordic room by Nadodrze',
    city: 'Wrocław',
    district: 'Nadodrze',
    address: 'ul. Chrobrego 14, 50-254 Wrocław',
    roomType: 'Private room',
    monthlyRentPLN: 1550,
    czynszAdminPLN: 240,
    billsIncluded: true,
    depositPLN: 1600,
    availableDate: '2026-10-20',
    leaseEndDate: '2027-07-31',
    remainingMonths: 9,
    squareMeters: 18,
    isFurnished: true,
    flatmatesCount: 2,
    distanceToCampus: '8 min walk to University of Wrocław',
    meldunekAllowed: true,
    landlordApproved: true,
    images: [
      '/images/listing_wroclaw_nordic_1790621466153.jpg',
      '/images/listing_krakow_loft_1790621454348.jpg'
    ],
    statusBadge: 'Active takeover',
    landlordName: 'Ewa Zielińska',
    landlordContactEmail: 'ewa.zielinska.wroc@wp.pl',
    currentTenant: {
      name: 'Sofia Lindqvist',
      nationality: 'Swedish',
      role: 'Erasmus Medicine Student',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Swedish Passport', 'UWr Student Card', 'Active Lease'],
      reasonForLeaving: 'Clinical rotation shifting to Katowice.',
      joinedYear: '2024'
    },
    amenities: [
      'High ceilings (3.2m)',
      'Large triple-glazed windows',
      'Dishwasher & Siemens washer',
      'Fiber Optic Internet'
    ],
    universitiesNearby: [
      'University of Wrocław Main Campus - 8 min walk',
      'Wrocław University of Science & Tech - 14 min direct tram',
      'Wrocław Medical University - 12 min tram'
    ],
    transitNearby: 'Plac Bema tram hub (3 min walk)',
    description: 'Sunny high-ceiling room in renovated historic tenement in bohemian Nadodrze. Wooden floorboards, Scandinavian furniture, and friendly flatmates. Landlord consent verified.',
    floor: '3rd floor',
    likesCount: 19,
    lat: 51.1198,
    lng: 17.0345
  },
  {
    id: 'rel-gdn-01',
    type: 'lease_takeover',
    title: 'Modern flat near Gdańsk Tech',
    city: 'Gdańsk',
    district: 'Wrzeszcz',
    address: 'ul. Grunwaldzka 102, 80-244 Gdańsk',
    roomType: '1-bedroom',
    monthlyRentPLN: 2600,
    czynszAdminPLN: 480,
    billsIncluded: false,
    depositPLN: 2900,
    availableDate: '2026-11-01',
    leaseEndDate: '2027-08-31',
    remainingMonths: 10,
    squareMeters: 42,
    isFurnished: true,
    flatmatesCount: 0,
    distanceToCampus: '7 min walk to Gdańsk Tech',
    meldunekAllowed: true,
    landlordApproved: true,
    images: [
      '/images/listing_warsaw_center_1790621476399.jpg',
      '/images/listing_krakow_loft_1790621454348.jpg'
    ],
    statusBadge: 'Active takeover',
    landlordName: 'Krzysztof Lewandowski',
    landlordContactEmail: 'k.lewandowski.gda@gmail.com',
    currentTenant: {
      name: 'Lucas Dupont',
      nationality: 'French',
      role: 'Engineering Intern at Intel',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['French Passport', 'Intel Contract', 'Active Lease'],
      reasonForLeaving: 'Relocating to Intel Munich office.',
      joinedYear: '2024'
    },
    amenities: [
      'Underground parking space',
      'Modern open kitchen with island',
      'Balcony facing green courtyard',
      'Dishwasher and separate dryer'
    ],
    universitiesNearby: [
      'Gdańsk University of Technology (PG) - 7 min walk',
      'Medical University of Gdańsk (GUMed) - 10 min tram',
      'University of Gdańsk (UG) - 8 min direct SKM'
    ],
    transitNearby: 'Gdańsk Politechnika SKM train station (5 min walk)',
    description: 'Chic 1-bedroom apartment in Wrzeszcz. Quiet, fully fitted, and 7 minutes walk to PG campus. Landlord agreed to takeover and supports address registration (meldunek).',
    floor: '2nd floor (with elevator)',
    likesCount: 22,
    lat: 54.3721,
    lng: 18.6089
  },
  {
    id: 'rel-lub-01',
    type: 'lease_takeover',
    title: 'Room near Medical University',
    city: 'Lublin',
    district: 'Śródmieście',
    address: 'ul. Spokojna 12, 20-072 Lublin',
    roomType: 'Private room',
    monthlyRentPLN: 1350,
    czynszAdminPLN: 220,
    billsIncluded: true,
    depositPLN: 1400,
    availableDate: '2026-10-15',
    leaseEndDate: '2027-06-30',
    remainingMonths: 8,
    squareMeters: 17,
    isFurnished: true,
    flatmatesCount: 1,
    distanceToCampus: '5 min walk to UMLub',
    meldunekAllowed: true,
    landlordApproved: true,
    images: [
      '/images/listing_wroclaw_nordic_1790621466153.jpg',
      '/images/listing_warsaw_mokotow_1790621438299.jpg'
    ],
    statusBadge: 'Active takeover',
    landlordName: 'Joanna Wójcik',
    landlordContactEmail: 'j.wojcik.lublin@interia.pl',
    currentTenant: {
      name: 'Amina Al-Mansoor',
      nationality: 'Jordanian',
      role: 'UMLub English Division 4th Year',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Passport', 'UMLub Student Card', 'Active Lease'],
      reasonForLeaving: 'Moving into married student quarters.',
      joinedYear: '2023'
    },
    amenities: [
      'Quiet study nook with desk',
      'Air conditioning in room',
      'Washing machine',
      'High-speed WiFi'
    ],
    universitiesNearby: [
      'Medical University of Lublin (UMLub) - 5 min walk',
      'Catholic University of Lublin (KUL) - 10 min bus',
      'UMCS Campus - 12 min bus'
    ],
    transitNearby: 'Krakowskie Przedmieście bus corridor (3 min walk)',
    description: 'Quiet room ideal for medical or dentistry students. Walking distance to UMLub clinical hospital. Shared with one quiet senior medical student. Landlord supports address registration (meldunek).',
    floor: '1st floor',
    likesCount: 16,
    lat: 51.2465,
    lng: 22.5684
  }
];

export const INITIAL_DEPOSIT_RECORDS: DepositClearingRecord[] = [
  {
    id: 'clr-2026-091',
    listingId: 'rel-krk-01',
    listingTitle: 'Room near AGH and UJ',
    amountPLN: 1800,
    currentTenantName: 'Piotr Kamiński',
    newTenantName: 'Alexander Bauer',
    landlordName: 'Tomasz Nowak',
    status: 'settled',
    inspectionDate: '2026-09-24',
    meterElectricity: '14,291.5 kWh',
    meterWater: '412.8 m³',
    meterHeating: '2.14 GJ',
    landlordConsentSigned: true,
    tenantInspectionSigned: true,
    depositTransferred: true,
    receiptIssuedDate: '2026-09-24'
  }
];
