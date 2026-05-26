// Dummy data for the public page — no backend required.

const mkLogo = (name, bg = "8B0000") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=FFFFFF&bold=true&size=128&length=2`;

export const DUMMY_PARTNERS = [
  // East Asia
  { name: "Sakura National University", country: "Japan", countryCode: "jp", region: "Eastern Asia", mou: 3, moa: 2, logo: mkLogo("Sakura National University", "C62828") },
  { name: "Hanyang Global Institute", country: "South Korea", countryCode: "kr", region: "Eastern Asia", mou: 2, moa: 1, logo: mkLogo("Hanyang Global Institute", "1565C0") },
  { name: "Beijing Polytechnic College", country: "China", countryCode: "cn", region: "Eastern Asia", mou: 4, moa: 2, logo: mkLogo("Beijing Polytechnic College", "B71C1C") },
  { name: "Tsinghua International Academy", country: "China", countryCode: "cn", region: "Eastern Asia", mou: 2, moa: 3, logo: mkLogo("Tsinghua International Academy", "880E4F") },
  { name: "Osaka Institute of Technology", country: "Japan", countryCode: "jp", region: "Eastern Asia", mou: 1, moa: 2, logo: mkLogo("Osaka Institute of Technology", "4A148C") },

  // Southeast Asia
  { name: "Singapore Academy of Technology", country: "Singapore", countryCode: "sg", region: "South-Eastern Asia", mou: 2, moa: 3, logo: mkLogo("Singapore Academy of Technology", "01579B") },
  { name: "Mahidol International University", country: "Thailand", countryCode: "th", region: "South-Eastern Asia", mou: 1, moa: 2, logo: mkLogo("Mahidol International University", "1B5E20") },
  { name: "Hanoi University of Engineering", country: "Vietnam", countryCode: "vn", region: "South-Eastern Asia", mou: 2, moa: 1, logo: mkLogo("Hanoi University of Engineering", "E65100") },
  { name: "Bandung Technical University", country: "Indonesia", countryCode: "id", region: "South-Eastern Asia", mou: 3, moa: 1, logo: mkLogo("Bandung Technical University", "37474F") },
  { name: "Kuala Lumpur Institute of Technology", country: "Malaysia", countryCode: "my", region: "South-Eastern Asia", mou: 2, moa: 2, logo: mkLogo("Kuala Lumpur Institute of Technology", "006064") },
  { name: "Chulalongkorn Global Studies", country: "Thailand", countryCode: "th", region: "South-Eastern Asia", mou: 1, moa: 1, logo: mkLogo("Chulalongkorn Global Studies", "3E2723") },

  // South Asia
  { name: "Delhi Institute of Science and Technology", country: "India", countryCode: "in", region: "Southern Asia", mou: 2, moa: 1, logo: mkLogo("Delhi Institute of Science and Technology", "4E342E") },
  { name: "Colombo Advanced University", country: "Sri Lanka", countryCode: "lk", region: "Southern Asia", mou: 1, moa: 1, logo: mkLogo("Colombo Advanced University", "263238") },
  { name: "Kathmandu Global College", country: "Nepal", countryCode: "np", region: "Southern Asia", mou: 1, moa: 1, logo: mkLogo("Kathmandu Global College", "558B2F") },

  // Oceania
  { name: "Southern Cross University of Technology", country: "Australia", countryCode: "au", region: "Oceania", mou: 3, moa: 2, logo: mkLogo("Southern Cross University of Technology", "4527A0") },
  { name: "Auckland Pacific University", country: "New Zealand", countryCode: "nz", region: "Oceania", mou: 1, moa: 2, logo: mkLogo("Auckland Pacific University", "00695C") },

  // Northern & Western Europe
  { name: "Ashford International Polytechnic", country: "United Kingdom", countryCode: "gb", region: "Northern Europe", mou: 2, moa: 1, logo: mkLogo("Ashford International Polytechnic", "1A237E") },
  { name: "Heidelberg Academy of Applied Sciences", country: "Germany", countryCode: "de", region: "Western Europe", mou: 2, moa: 2, logo: mkLogo("Heidelberg Academy of Applied Sciences", "212121") },
  { name: "Sorbonne Global Studies Institute", country: "France", countryCode: "fr", region: "Western Europe", mou: 1, moa: 2, logo: mkLogo("Sorbonne Global Studies Institute", "B71C1C") },
  { name: "Amsterdam Institute of Engineering", country: "Netherlands", countryCode: "nl", region: "Western Europe", mou: 2, moa: 1, logo: mkLogo("Amsterdam Institute of Engineering", "0277BD") },
  { name: "Zurich Polytechnic University", country: "Switzerland", countryCode: "ch", region: "Western Europe", mou: 1, moa: 1, logo: mkLogo("Zurich Polytechnic University", "6A1B9A") },

  // Eastern & Southern Europe
  { name: "Warsaw Academy of Sciences", country: "Poland", countryCode: "pl", region: "Eastern Europe", mou: 2, moa: 1, logo: mkLogo("Warsaw Academy of Sciences", "880E4F") },
  { name: "Budapest Technical College", country: "Hungary", countryCode: "hu", region: "Eastern Europe", mou: 1, moa: 1, logo: mkLogo("Budapest Technical College", "E65100") },
  { name: "Madrid International Institute", country: "Spain", countryCode: "es", region: "Southern Europe", mou: 2, moa: 1, logo: mkLogo("Madrid International Institute", "C62828") },
  { name: "Rome Polytechnic Academy", country: "Italy", countryCode: "it", region: "Southern Europe", mou: 1, moa: 2, logo: mkLogo("Rome Polytechnic Academy", "1B5E20") },
  { name: "Athens Global University", country: "Greece", countryCode: "gr", region: "Southern Europe", mou: 1, moa: 1, logo: mkLogo("Athens Global University", "01579B") },

  // Americas
  { name: "California State Polytechnic College", country: "United States", countryCode: "us", region: "North America", mou: 3, moa: 3, logo: mkLogo("California State Polytechnic College", "1A237E") },
  { name: "Toronto Global University", country: "Canada", countryCode: "ca", region: "North America", mou: 2, moa: 2, logo: mkLogo("Toronto Global University", "004D40") },
  { name: "Mexico City Institute of Technology", country: "Mexico", countryCode: "mx", region: "Central America", mou: 1, moa: 2, logo: mkLogo("Mexico City Institute of Technology", "BF360C") },
  { name: "São Paulo International University", country: "Brazil", countryCode: "br", region: "South America", mou: 2, moa: 1, logo: mkLogo("São Paulo International University", "006064") },
  { name: "Buenos Aires Polytechnic", country: "Argentina", countryCode: "ar", region: "South America", mou: 1, moa: 1, logo: mkLogo("Buenos Aires Polytechnic", "4527A0") },

  // Africa
  { name: "Cairo University of Applied Sciences", country: "Egypt", countryCode: "eg", region: "Northern Africa", mou: 2, moa: 1, logo: mkLogo("Cairo University of Applied Sciences", "37474F") },
  { name: "Nairobi International College", country: "Kenya", countryCode: "ke", region: "Eastern Africa", mou: 1, moa: 1, logo: mkLogo("Nairobi International College", "1B5E20") },
  { name: "Cape Town Advanced Institute", country: "South Africa", countryCode: "za", region: "Southern Africa", mou: 2, moa: 1, logo: mkLogo("Cape Town Advanced Institute", "212121") },

  // Middle East & Central Asia
  { name: "Dubai Institute of Higher Learning", country: "United Arab Emirates", countryCode: "ae", region: "Western Asia", mou: 2, moa: 2, logo: mkLogo("Dubai Institute of Higher Learning", "0D47A1") },
  { name: "Riyadh Polytechnic University", country: "Saudi Arabia", countryCode: "sa", region: "Western Asia", mou: 1, moa: 2, logo: mkLogo("Riyadh Polytechnic University", "1B5E20") },
  { name: "Istanbul Technical Academy", country: "Turkey", countryCode: "tr", region: "Western Asia", mou: 2, moa: 1, logo: mkLogo("Istanbul Technical Academy", "880E4F") },
  { name: "Tashkent Institute of Engineering", country: "Uzbekistan", countryCode: "uz", region: "Central Asia", mou: 1, moa: 1, logo: mkLogo("Tashkent Institute of Engineering", "3E2723") },
  { name: "Almaty Polytechnic University", country: "Kazakhstan", countryCode: "kz", region: "Central Asia", mou: 1, moa: 1, logo: mkLogo("Almaty Polytechnic University", "4A148C") },
];

// Flat list of individual agreement records (one per MOU/MOA)
export const DUMMY_AGREEMENTS = DUMMY_PARTNERS.flatMap((partner) => [
  ...Array.from({ length: partner.mou }, (_, i) => ({
    id: `${partner.name.replace(/\s+/g, "-")}-MOU-${i}`,
    partner_name: partner.name,
    institution_name: partner.name,
    university_name: partner.name,
    country: partner.country,
    region: partner.region,
    document_type: "MOU",
    agreement_status: "Active",
    logo_path: null,
    logo: partner.logo,
    university_logo: null,
  })),
  ...Array.from({ length: partner.moa }, (_, i) => ({
    id: `${partner.name.replace(/\s+/g, "-")}-MOA-${i}`,
    partner_name: partner.name,
    institution_name: partner.name,
    university_name: partner.name,
    country: partner.country,
    region: partner.region,
    document_type: "MOA",
    agreement_status: "Active",
    logo_path: null,
    logo: partner.logo,
    university_logo: null,
  })),
]);
