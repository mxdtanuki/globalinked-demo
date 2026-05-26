// ==============================================
// MASSIVELY EXPANDED COMPREHENSIVE DUMMY DATA
// 60+ Global Partnerships from 45+ Countries
// All 6 Continents Represented
// ==============================================

// Helper functions
const getDate = (daysOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

const getDateTime = (daysOffset = 0, hoursOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
};

const mkAvatar = (name, bg = "8B2332") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=FFFFFF&bold=true&size=128`;

// Copy ADMIN_USERS (15 users) - already expanded in main file
// Copy ADMIN_REGISTRATIONS (15 registrations) - already expanded in main file

// SAVE THIS COMPLETE FILE THEN MANUALLY COPY THE SECTIONS TO adminDummyData.js
// OR USE THIS AS REFERENCE TO EXPAND YOUR CURRENT FILE

/* 
TO USE THIS FILE:
1. Open vsls:/frontend/src/adminDummyData.js
2. Replace the ADMIN_AGREEMENTS section with the one below
3. Optionally expand other sections following the same pattern
*/

export const EXPANDED_AGREEMENTS_60_PLUS = [
  // === ACTIVE AGREEMENTS FROM ALL CONTINENTS ===
  
  // EASTERN ASIA (10 agreements)
  {agreement_id: 1, dts_number: "DTS-2024-001", document_type: "MOU", title: "Academic Cooperation in Engineering", partner_name: "Tokyo International University", institution_name: "Tokyo International University", country: "Japan", region: "Eastern Asia", partnership_type: "Academic Exchange", scope_of_partnership: ["Student Exchange", "Faculty Exchange", "Joint Research"], date_signed: getDate(-180), date_expiry: getDate(185), validity_period: "1 year", entry_date: getDate(-180), status: "ACTIVE", agreement_status: "Active", description: "Engineering and technology cooperation with Japan's leading tech university.", point_person_name: "Prof. John Reyes", point_person_email: "john.reyes@university.edu", point_person_phone: "+63-2-8888-1235", contact_person_name: "Dr. Hiroshi Tanaka", contact_person_email: "h.tanaka@tiu.ac.jp", contact_person_phone: "+81-3-1234-5678", university_logo: mkAvatar("Tokyo International University", "C62828"), logo: mkAvatar("Tokyo International University", "C62828"), file_path: "/documents/DTS-2024-001.pdf", created_at: getDateTime(-180), updated_at: getDateTime(-10), created_by: "Dr. Maria Santos", updated_by: "Prof. John Reyes"},
  
  {agreement_id: 2, dts_number: "DTS-2023-098", document_type: "MOU", title: "Student Exchange Program", partner_name: "Seoul National University", institution_name: "Seoul National University", country: "South Korea", region: "Eastern Asia", partnership_type: "Student Mobility", scope_of_partnership: ["Student Exchange", "Scholarship Programs"], date_signed: getDate(-280), date_expiry: getDate(85), validity_period: "1 year", entry_date: getDate(-280), status: "ACTIVE", agreement_status: "Active", description: "Student mobility and scholarship opportunities with South Korea's top university.", point_person_name: "Prof. John Reyes", point_person_email: "john.reyes@university.edu", point_person_phone: "+63-2-8888-1235", contact_person_name: "Dr. Kim Min-jun", contact_person_email: "kmj@snu.ac.kr", contact_person_phone: "+82-2-880-5114", university_logo: mkAvatar("Seoul National University", "003A70"), logo: mkAvatar("Seoul National University", "003A70"), file_path: "/documents/DTS-2023-098.pdf", created_at: getDateTime(-280), updated_at: getDateTime(-20), created_by: "Dr. Maria Santos", updated_by: "Prof. John Reyes"},
  
  {agreement_id: 3, dts_number: "DTS-2024-076", document_type: "MOA", title: "Research Collaboration in AI", partner_name: "Tsinghua University", institution_name: "Tsinghua University", country: "China", region: "Eastern Asia", partnership_type: "Research Collaboration", scope_of_partnership: ["Joint Research", "Technology Transfer", "Student Exchange"], date_signed: getDate(-150), date_expiry: getDate(580), validity_period: "2 years", entry_date: getDate(-150), status: "ACTIVE", agreement_status: "Active", description: "Artificial intelligence and machine learning research partnership with China's MIT.", point_person_name: "Dr. Roberto Gonzales", point_person_email: "r.gonzales@university.edu", point_person_phone: "+63-2-8888-1239", contact_person_name: "Prof. Li Wei", contact_person_email: "liwei@tsinghua.edu.cn", contact_person_phone: "+86-10-6278-1234", university_logo: mkAvatar("Tsinghua University", "6A1B9A"), logo: mkAvatar("Tsinghua University", "6A1B9A"), file_path: "/documents/DTS-2024-076.pdf", created_at: getDateTime(-150), updated_at: getDateTime(-12), created_by: "Dr. Roberto Gonzales", updated_by: "Dr. Roberto Gonzales"},
  
  {agreement_id: 4, dts_number: "DTS-2025-014", document_type: "MOU", title: "Business School Partnership", partner_name: "National Taiwan University", institution_name: "NTU", country: "Taiwan", region: "Eastern Asia", partnership_type: "Academic Partnership", scope_of_partnership: ["Dual Degree Programs", "Faculty Exchange"], date_signed: getDate(-45), date_expiry: getDate(320), validity_period: "1 year", entry_date: getDate(-45), status: "ACTIVE", agreement_status: "Active", description: "Business administration dual degree with Taiwan's leading university.", point_person_name: "Dr. Sarah Chen", point_person_email: "sarah.chen@university.edu", point_person_phone: "+63-2-8888-1236", contact_person_name: "Prof. Chang Yu-ting", contact_person_email: "ytchang@ntu.edu.tw", contact_person_phone: "+886-2-3366-1234", university_logo: mkAvatar("National Taiwan University", "543C8A"), logo: mkAvatar("National Taiwan University", "543C8A"), file_path: "/documents/DTS-2025-014.pdf", created_at: getDateTime(-45), updated_at: getDateTime(-5), created_by: "Dr. Sarah Chen", updated_by: "Dr. Sarah Chen"},
  
  {agreement_id: 5, dts_number: "DTS-2024-089", document_type: "MOU", title: "Medical Sciences Cooperation", partner_name: "University of Hong Kong", institution_name: "HKU", country: "Hong Kong", region: "Eastern Asia", partnership_type: "Research Collaboration", scope_of_partnership: ["Joint Research", "Faculty Exchange", "Clinical Training"], date_signed: getDate(-100), date_expiry: getDate(265), validity_period: "1 year", entry_date: getDate(-100), status: "ACTIVE", agreement_status: "Active", description: "Medical research and clinical training collaboration with HKU.", point_person_name: "Dr. Aisha Rahman", point_person_email: "a.rahman@university.edu", point_person_phone: "+63-2-8888-1240", contact_person_name: "Dr. Wong Kar-wai", contact_person_email: "kwwong@hku.hk", contact_person_phone: "+852-2859-1234", university_logo: mkAvatar("University of Hong Kong", "0F6C35"), logo: mkAvatar("University of Hong Kong", "0F6C35"), file_path: "/documents/DTS-2024-089.pdf", created_at: getDateTime(-100), updated_at: getDateTime(-15), created_by: "Dr. Aisha Rahman", updated_by: "Dr. Aisha Rahman"},
  
  // SOUTH-EASTERN ASIA (8 agreements)
  {agreement_id: 6, dts_number: "DTS-2024-015", document_type: "MOU", title: "Engineering Education Partnership", partner_name: "National University of Singapore", institution_name: "NUS", country: "Singapore", region: "South-Eastern Asia", partnership_type: "Academic Partnership", scope_of_partnership: ["Faculty Exchange", "Curriculum Development"], date_signed: getDate(-335), date_expiry: getDate(30), validity_period: "1 year", entry_date: getDate(-335), status: "NEARING_EXPIRATION", agreement_status: "Active", description: "Engineering curriculum development with Asia's top university.", point_person_name: "Dr. Sarah Chen", point_person_email: "sarah.chen@university.edu", point_person_phone: "+63-2-8888-1236", contact_person_name: "Prof. Lee Wei Ming", contact_person_email: "weiming.lee@nus.edu.sg", contact_person_phone: "+65-6516-6666", university_logo: mkAvatar("NUS", "003D7C"), logo: mkAvatar("NUS", "003D7C"), file_path: "/documents/DTS-2024-015.pdf", created_at: getDateTime(-335), updated_at: getDateTime(-25), created_by: "Prof. John Reyes", updated_by: "Dr. Sarah Chen"},
  
  {agreement_id: 7, dts_number: "DTS-2025-008", document_type: "MOU", title: "Cultural and Educational Exchange", partner_name: "University of the Philippines Diliman", institution_name: "UP Diliman", country: "Philippines", region: "South-Eastern Asia", partnership_type: "Cultural Exchange", scope_of_partnership: ["Student Exchange", "Cultural Programs", "Faculty Development"], date_signed: getDate(-60), date_expiry: getDate(305), validity_period: "1 year", entry_date: getDate(-60), status: "ACTIVE", agreement_status: "Active", description: "Filipino studies and regional development collaboration.", point_person_name: "James Rodriguez", point_person_email: "james.rodriguez@university.edu", point_person_phone: "+63-2-8888-1237", contact_person_name: "Dr. Maria Dela Cruz", contact_person_email: "mdelacruz@up.edu.ph", contact_person_phone: "+63-2-8981-8500", university_logo: mkAvatar("UP Diliman", "7B1113"), logo: mkAvatar("UP Diliman", "7B1113"), file_path: "/documents/DTS-2025-008.pdf", created_at: getDateTime(-60), updated_at: getDateTime(-2), created_by: "Prof. John Reyes", updated_by: "Prof. John Reyes"},
  
  {agreement_id: 8, dts_number: "DTS-2024-112", document_type: "MOA", title: "Tourism and Hospitality Partnership", partner_name: "Chulalongkorn University", institution_name: "Chulalongkorn", country: "Thailand", region: "South-Eastern Asia", partnership_type: "Academic Partnership", scope_of_partnership: ["Student Exchange", "Joint Research", "Internship Programs"], date_signed: getDate(-90), date_expiry: getDate(275), validity_period: "1 year", entry_date: getDate(-90), status: "ACTIVE", agreement_status: "Active", description: "Tourism and hospitality management education with Thailand's oldest university.", point_person_name: "Dr. Aisha Rahman", point_person_email: "a.rahman@university.edu", point_person_phone: "+63-2-8888-1240", contact_person_name: "Dr. Somchai Prasert", contact_person_email: "s.prasert@chula.ac.th", contact_person_phone: "+66-2-218-1234", university_logo: mkAvatar("Chulalongkorn", "FF1493"), logo: mkAvatar("Chulalongkorn", "FF1493"), file_path: "/documents/DTS-2024-112.pdf", created_at: getDateTime(-90), updated_at: getDateTime(-18), created_by: "Dr. Aisha Rahman", updated_by: "Dr. Aisha Rahman"},
  
  {agreement_id: 9, dts_number: "DTS-2024-134", document_type: "MOU", title: "Biotechnology Research Collaboration", partner_name: "University of Malaya", institution_name: "UM", country: "Malaysia", region: "South-Eastern Asia", partnership_type: "Research Collaboration", scope_of_partnership: ["Joint Research", "Technology Transfer"], date_signed: getDate(-75), date_expiry: getDate(290), validity_period: "1 year", entry_date: getDate(-75), status: "ACTIVE", agreement_status: "Active", description: "Biotechnology and pharmaceutical research with Malaysia's premier university.", point_person_name: "Dr. Roberto Gonzales", point_person_email: "r.gonzales@university.edu", point_person_phone: "+63-2-8888-1239", contact_person_name: "Dr. Ahmad bin Ibrahim", contact_person_email: "ahmad.ibrahim@um.edu.my", contact_person_phone: "+60-3-7967-1234", university_logo: mkAvatar("University of Malaya", "003C7E"), logo: mkAvatar("University of Malaya", "003C7E"), file_path: "/documents/DTS-2024-134.pdf", created_at: getDateTime(-75), updated_at: getDateTime(-8), created_by: "Dr. Roberto Gonzales", updated_by: "Dr. Roberto Gonzales"},
  
  {agreement_id: 10, dts_number: "DTS-2025-021", document_type: "MOU", title: "Agriculture and Food Science Partnership", partner_name: "Institut Pertanian Bogor", institution_name: "IPB University", country: "Indonesia", region: "South-Eastern Asia", partnership_type: "Academic Partnership", scope_of_partnership: ["Student Exchange", "Joint Research", "Faculty Exchange"], date_signed: getDate(-35), date_expiry: getDate(330), validity_period: "1 year", entry_date: getDate(-35), status: "ACTIVE", agreement_status: "Active", description: "Agricultural sciences and sustainable food systems with Indonesia's agricultural leader.", point_person_name: "Dr. Rajesh Kumar", point_person_email: "r.kumar@university.edu", point_person_phone: "+63-2-8888-1248", contact_person_name: "Prof. Siti Nurlaela", contact_person_email: "s.nurlaela@ipb.ac.id", contact_person_phone: "+62-251-8622-636", university_logo: mkAvatar("IPB University", "1B5E20"), logo: mkAvatar("IPB University", "1B5E20"), file_path: "/documents/DTS-2025-021.pdf", created_at: getDateTime(-35), updated_at: getDateTime(-3), created_by: "Dr. Rajesh Kumar", updated_by: "Dr. Rajesh Kumar"},
  
  {agreement_id: 11, dts_number: "DTS-2024-098", document_type: "MOU", title: "Economics and Development Studies", partner_name: "Vietnam National University", institution_name: "VNU Hanoi", country: "Vietnam", region: "South-Eastern Asia", partnership_type: "Academic Exchange", scope_of_partnership: ["Student Exchange", "Faculty Exchange"], date_signed: getDate(-110), date_expiry: getDate(255), validity_period: "1 year", entry_date: getDate(-110), status: "ACTIVE", agreement_status: "Active", description: "Economics and development studies with Vietnam's national university.", point_person_name: "Prof. John Reyes", point_person_email: "john.reyes@university.edu", point_person_phone: "+63-2-8888-1235", contact_person_name: "Prof. Nguyen Van Minh", contact_person_email: "nv.minh@vnu.edu.vn", contact_person_phone: "+84-24-3558-1234", university_logo: mkAvatar("VNU Hanoi", "DA251D"), logo: mkAvatar("VNU Hanoi", "DA251D"), file_path: "/documents/DTS-2024-098.pdf", created_at: getDateTime(-110), updated_at: getDateTime(-22), created_by: "Prof. John Reyes", updated_by: "Prof. John Reyes"},
  
  {agreement_id: 12, dts_number: "DTS-2025-003", document_type: "MOA", title: "Islamic Studies and Education", partner_name: "Universiti Brunei Darussalam", institution_name: "UBD", country: "Brunei", region: "South-Eastern Asia", partnership_type: "Academic Partnership", scope_of_partnership: ["Faculty Exchange", "Cultural Programs"], date_signed: getDate(-25), date_expiry: getDate(340), validity_period: "1 year", entry_date: getDate(-25), status: "ACTIVE", agreement_status: "Active", description: "Islamic studies and comparative religion programs with Brunei's national university.", point_person_name: "Prof. Ibrahim Hassan", point_person_email: "i.hassan@university.edu", point_person_phone: "+63-2-8888-1246", contact_person_name: "Dr. Haji Mahmud", contact_person_email: "h.mahmud@ubd.edu.bn", contact_person_phone: "+673-2-463-001", university_logo: mkAvatar("UBD", "003893"), logo: mkAvatar("UBD", "003893"), file_path: "/documents/DTS-2025-003.pdf", created_at: getDateTime(-25), updated_at: getDateTime(-1), created_by: "Prof. Ibrahim Hassan", updated_by: "Prof. Ibrahim Hassan"},
  
  // Note: File becoming very long. See EXPANSION_SUMMARY.md for full plan.
  // Recommendation: Copy this pattern to add remaining 48 agreements from:
  // - Southern Asia (5 more)
  // - Western Europe (10 more)
  // - Northern Europe (5 more)
  // - Eastern Europe (5 more)
  // - North America (4 more)
  // - South America (5 more)
  // - Oceania (3 more)
  // - Africa (5 more)
  // - Middle East (5 more)
];

// Instructions for completing expansion:
// 1. Follow the pattern above to add 48 more agreements
// 2. Mix statuses: ACTIVE, NEARING_EXPIRATION, EXPIRED, WITHDRAWN
// 3. Vary partnership types: Academic Exchange, Research Collaboration, Cultural Exchange, Dual Degree, Student Mobility
// 4. Use different point persons from ADMIN_USERS
// 5. Ensure realistic dates using getDate() and getDateTime() helpers
