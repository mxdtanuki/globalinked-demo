import React, { useState, useEffect } from "react";
import TopbarSidebar from "../../components/topbarSidebar";
import Select from "react-select";
import "./globalUpload.css";
import { useLocation, useNavigate } from "react-router-dom";
import { agreementService } from "../../services/agreementService";
import { documentService } from "../../services/documentService";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiHome,
  FiTag,
  FiGlobe,
  FiEdit,
  FiUser,
  FiMessageCircle,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiAlertCircle,
  FiMapPin,
  FiImage,
  FiLink,
  FiCalendar,
  FiAward,
} from "react-icons/fi";

const partnershipTypeOptions = [
  { value: "Agreement", label: "Agreement" },
  { value: "Contract Agreement", label: "Contract Agreement" },
  { value: "Cooperation Agreement", label: "Cooperation Agreement" },
  { value: "Implementation Agreement", label: "Implementation Agreement" },
  {
    value: "Online Study Tour Agreement",
    label: "Online Study Tour Agreement",
  },
  {
    value: "License and Cooperation Agreement",
    label: "License and Cooperation Agreement",
  },
  {
    value:
      "Agreement of International Faculty Exchanges for Academic Training Program",
    label:
      "Agreement of International Faculty Exchanges for Academic Training Program",
  },
  { value: "Due Diligence", label: "Due Diligence" },
  {
    value: "Joint Education Programs and Training Cooperation",
    label: "Joint Education Programs and Training Cooperation",
  },
  { value: "MOA on Academic Exchange", label: "MOA on Academic Exchange" },
  { value: "MOA on Faculty Exchange", label: "MOA on Faculty Exchange" },
  { value: "MOA on Student Exchange", label: "MOA on Student Exchange" },
  { value: "MOA on Cultural Exchange", label: "MOA on Cultural Exchange" },
  { value: "MOA on Research", label: "MOA on Research" },
  { value: "MOA on Internship", label: "MOA on Internship" },
  {
    value: "MOA on Training and Research Collaboration",
    label: "MOA on Training and Research Collaboration",
  },
  { value: "MOA on Conferences", label: "MOA on Conferences" },
  {
    value: "MOA on International Competition",
    label: "MOA on International Competition",
  },
  { value: "MOA Global Leadership", label: "MOA Global Leadership" },
  { value: "MOA for Donation", label: "MOA for Donation" },
  { value: "MOA on English Class", label: "MOA on English Class" },
  { value: "MOA on English Camp", label: "MOA on English Camp" },
  {
    value: "MOA on Academic Partnership",
    label: "MOA on Academic Partnership",
  },
  { value: "MOA (RMO)", label: "MOA (RMO)" },
  { value: "MOA (VPRED)", label: "MOA (VPRED)" },
  { value: "MOA with PUP Sta.Rosa", label: "MOA with PUP Sta.Rosa" },
  { value: "MOA with PACA", label: "MOA with PACA" },
  { value: "MOA CITAA", label: "MOA CITAA" },
  { value: "MOA CAH", label: "MOA CAH" },
  {
    value: "MOA with College of Science",
    label: "MOA with College of Science",
  },
  {
    value: "MOA with College of Engineering",
    label: "MOA with College of Engineering",
  },
  {
    value: "MOA on Career Orientation Services",
    label: "MOA on Career Orientation Services",
  },
  {
    value: "MOA on International Educational Cooperation",
    label: "MOA on International Educational Cooperation",
  },
  {
    value:
      "MOA on Promotion and Collaboration on International Academic and Research",
    label:
      "MOA on Promotion and Collaboration on International Academic and Research",
  },
  {
    value:
      "MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents",
    label:
      "MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents",
  },
  { value: "MOA on Extension Project", label: "MOA on Extension Project" },
  { value: "MOA Tripartite", label: "MOA Tripartite" },
  {
    value: "MOA on English and Cultural Program",
    label: "MOA on English and Cultural Program",
  },
  { value: "MOA on Student Competition", label: "MOA on Student Competition" },
  {
    value: "MOA on Faculty and Student Exchange",
    label: "MOA on Faculty and Student Exchange",
  },
];

const countryOptions = [
  { value: "Afghanistan", label: "Afghanistan", region: "Southern Asia" },
  { value: "Albania", label: "Albania", region: "Southern Europe" },
  { value: "Algeria", label: "Algeria", region: "Northern Africa" },
  { value: "HongKong", label: "HongKong", region: "Eastern Asia" },
  { value: "Macao", label: "Macao", region: "Eastern Asia" },
  { value: "Jamaica", label: "Jamaica", region: "Caribbean" },
  { value: "Japan", label: "Japan", region: "Eastern Asia" },
  { value: "Jordan", label: "Jordan", region: "Western Asia" },
  { value: "Kazakhstan", label: "Kazakhstan", region: "Central Asia" },
  { value: "Kenya", label: "Kenya", region: "Eastern Africa" },
  { value: "Kiribati", label: "Kiribati", region: "Oceania" },
  { value: "Kuwait", label: "Kuwait", region: "Western Asia" },
  { value: "Kyrgyzstan", label: "Kyrgyzstan", region: "Central Asia" },
  { value: "Laos", label: "Laos", region: "South-Eastern Asia" },
  { value: "Latvia", label: "Latvia", region: "Northern Europe" },
  { value: "Lebanon", label: "Lebanon", region: "Western Asia" },
  { value: "Lesotho", label: "Lesotho", region: "Southern Africa" },
  { value: "Liberia", label: "Liberia", region: "Western Africa" },
  { value: "Libya", label: "Libya", region: "Northern Africa" },
  { value: "Liechtenstein", label: "Liechtenstein", region: "Western Europe" },
  { value: "Lithuania", label: "Lithuania", region: "Northern Europe" },
  { value: "Luxembourg", label: "Luxembourg", region: "Western Europe" },
  { value: "Madagascar", label: "Madagascar", region: "Eastern Africa" },
  { value: "Malawi", label: "Malawi", region: "Eastern Africa" },
  { value: "Malaysia", label: "Malaysia", region: "South-Eastern Asia" },
  { value: "Maldives", label: "Maldives", region: "Southern Asia" },
  { value: "Mali", label: "Mali", region: "Western Africa" },
  { value: "Malta", label: "Malta", region: "Southern Europe" },
  { value: "Marshall Islands", label: "Marshall Islands", region: "Oceania" },
  { value: "Mauritania", label: "Mauritania", region: "Western Africa" },
  { value: "Mauritius", label: "Mauritius", region: "Eastern Africa" },
  { value: "Mexico", label: "Mexico", region: "North America" },
  { value: "Micronesia", label: "Micronesia", region: "Oceania" },
  { value: "Moldova", label: "Moldova", region: "Eastern Europe" },
  { value: "Monaco", label: "Monaco", region: "Western Europe" },
  { value: "Mongolia", label: "Mongolia", region: "Eastern Asia" },
  { value: "Montenegro", label: "Montenegro", region: "Southern Europe" },
  { value: "Morocco", label: "Morocco", region: "Northern Africa" },
  { value: "Mozambique", label: "Mozambique", region: "Eastern Africa" },
  { value: "Myanmar", label: "Myanmar", region: "South-Eastern Asia" },
  { value: "Namibia", label: "Namibia", region: "Southern Africa" },
  { value: "Nauru", label: "Nauru", region: "Oceania" },
  { value: "Nepal", label: "Nepal", region: "Southern Asia" },
  { value: "Netherlands", label: "Netherlands", region: "Western Europe" },
  { value: "New Zealand", label: "New Zealand", region: "Oceania" },
  { value: "Nicaragua", label: "Nicaragua", region: "Central America" },
  { value: "Niger", label: "Niger", region: "Western Africa" },
  { value: "Nigeria", label: "Nigeria", region: "Western Africa" },
  { value: "North Korea", label: "North Korea", region: "Eastern Asia" },
  {
    value: "North Macedonia",
    label: "North Macedonia",
    region: "Southern Europe",
  },
  { value: "Norway", label: "Norway", region: "Northern Europe" },
  { value: "Oman", label: "Oman", region: "Western Asia" },
  { value: "Pakistan", label: "Pakistan", region: "Southern Asia" },
  { value: "Palau", label: "Palau", region: "Oceania" },
  { value: "Palestine", label: "Palestine", region: "Western Asia" },
  { value: "Panama", label: "Panama", region: "Central America" },
  { value: "Papua New Guinea", label: "Papua New Guinea", region: "Oceania" },
  { value: "Paraguay", label: "Paraguay", region: "South America" },
  { value: "Peru", label: "Peru", region: "South America" },
  { value: "Philippines", label: "Philippines", region: "South-Eastern Asia" },
  { value: "Poland", label: "Poland", region: "Eastern Europe" },
  { value: "Portugal", label: "Portugal", region: "Southern Europe" },
  { value: "Qatar", label: "Qatar", region: "Western Asia" },
  { value: "Romania", label: "Romania", region: "Eastern Europe" },
  { value: "Russia", label: "Russia", region: "Eastern Europe" },
  { value: "Rwanda", label: "Rwanda", region: "Eastern Africa" },
  {
    value: "Saint Kitts and Nevis",
    label: "Saint Kitts and Nevis",
    region: "Caribbean",
  },
  { value: "Saint Lucia", label: "Saint Lucia", region: "Caribbean" },
  {
    value: "Saint Vincent and the Grenadines",
    label: "Saint Vincent and the Grenadines",
    region: "Caribbean",
  },
  { value: "Samoa", label: "Samoa", region: "Oceania" },
  { value: "San Marino", label: "San Marino", region: "Southern Europe" },
  {
    value: "Sao Tome and Principe",
    label: "Sao Tome and Principe",
    region: "Middle Africa",
  },
  { value: "Saudi Arabia", label: "Saudi Arabia", region: "Western Asia" },
  { value: "Senegal", label: "Senegal", region: "Western Africa" },
  { value: "Serbia", label: "Serbia", region: "Southern Europe" },
  { value: "Seychelles", label: "Seychelles", region: "Eastern Africa" },
  { value: "Sierra Leone", label: "Sierra Leone", region: "Western Africa" },
  { value: "Singapore", label: "Singapore", region: "South-Eastern Asia" },
  { value: "Slovakia", label: "Slovakia", region: "Eastern Europe" },
  { value: "Slovenia", label: "Slovenia", region: "Southern Europe" },
  { value: "Solomon Islands", label: "Solomon Islands", region: "Oceania" },
  { value: "Somalia", label: "Somalia", region: "Eastern Africa" },
  { value: "South Africa", label: "South Africa", region: "Southern Africa" },
  { value: "South Korea", label: "South Korea", region: "Eastern Asia" },
  { value: "South Sudan", label: "South Sudan", region: "Eastern Africa" },
  { value: "Spain", label: "Spain", region: "Southern Europe" },
  { value: "Sri Lanka", label: "Sri Lanka", region: "Southern Asia" },
  { value: "Sudan", label: "Sudan", region: "Northern Africa" },
  { value: "Suriname", label: "Suriname", region: "South America" },
  { value: "Sweden", label: "Sweden", region: "Northern Europe" },
  { value: "Switzerland", label: "Switzerland", region: "Western Europe" },
  { value: "Syria", label: "Syria", region: "Western Asia" },
  { value: "Taiwan", label: "Taiwan", region: "Eastern Asia" },
  { value: "Tajikistan", label: "Tajikistan", region: "Central Asia" },
  { value: "Tanzania", label: "Tanzania", region: "Eastern Africa" },
  { value: "Thailand", label: "Thailand", region: "South-Eastern Asia" },
  { value: "Timor-Leste", label: "Timor-Leste", region: "South-Eastern Asia" },
  { value: "Togo", label: "Togo", region: "Western Africa" },
  { value: "Tonga", label: "Tonga", region: "Oceania" },
  {
    value: "Trinidad and Tobago",
    label: "Trinidad and Tobago",
    region: "Caribbean",
  },
  { value: "Tunisia", label: "Tunisia", region: "Northern Africa" },
  { value: "Turkey", label: "Turkey", region: "Western Asia" },
  { value: "Turkmenistan", label: "Turkmenistan", region: "Central Asia" },
  { value: "Tuvalu", label: "Tuvalu", region: "Oceania" },
  { value: "Uganda", label: "Uganda", region: "Eastern Africa" },
  { value: "Ukraine", label: "Ukraine", region: "Eastern Europe" },
  {
    value: "United Arab Emirates",
    label: "United Arab Emirates",
    region: "Western Asia",
  },
  {
    value: "United Kingdom",
    label: "United Kingdom",
    region: "Northern Europe",
  },
  { value: "United States", label: "United States", region: "North America" },
  { value: "Uruguay", label: "Uruguay", region: "South America" },
  { value: "Uzbekistan", label: "Uzbekistan", region: "Central Asia" },
  { value: "Vanuatu", label: "Vanuatu", region: "Oceania" },
  { value: "Vatican City", label: "Vatican City", region: "Southern Europe" },
  { value: "Venezuela", label: "Venezuela", region: "South America" },
  { value: "Vietnam", label: "Vietnam", region: "South-Eastern Asia" },
  { value: "Yemen", label: "Yemen", region: "Western Asia" },
  { value: "Zambia", label: "Zambia", region: "Eastern Africa" },
  { value: "Zimbabwe", label: "Zimbabwe", region: "Eastern Africa" },
];

const regionOptions = [
  { value: "Central Asia", label: "Central Asia" },
  { value: "Eastern Asia", label: "Eastern Asia" },
  { value: "Southern Asia", label: "Southern Asia" },
  { value: "South-Eastern Asia", label: "South-Eastern Asia" },
  { value: "Western Asia", label: "Western Asia" },
  { value: "Northern Europe", label: "Northern Europe" },
  { value: "Western Europe", label: "Western Europe" },
  { value: "Eastern Europe", label: "Eastern Europe" },
  { value: "Southern Europe", label: "Southern Europe" },
  { value: "North America", label: "North America" },
  { value: "Caribbean", label: "Caribbean" },
  { value: "Central America", label: "Central America" },
  { value: "South America", label: "South America" },
  { value: "Oceania", label: "Oceania" },
  { value: "Eastern Africa", label: "Eastern Africa" },
  { value: "Middle Africa", label: "Middle Africa" },
  { value: "Northern Africa", label: "Northern Africa" },
  { value: "Southern Africa", label: "Southern Africa" },
  { value: "Western Africa", label: "Western Africa" },
];

const docTypeOptions = [
  { value: "MOA", label: "MOA" },
  { value: "MOU", label: "MOU" },
];

const statusOptions = [
  { value: "InitialReview", label: "Initial Review" },
  { value: "Endorse", label: "Endorse to ULCO for Review and Approval" },
  { value: "Revert", label: "Revert To Initiator with Comments" },
  { value: "Consultation", label: "For Consultation" },
  { value: "Replication", label: "Replication of Copies (8 sets)" },
  { value: "SignituresPUP", label: "For Signatures of PUP Officials" },
  { value: "SignedPUP", label: "Signed by PUP Officials" },
  { value: "SignituresPartner", label: "For Signatures of Partner" },
  { value: "SignedPartner", label: "Signed by Partner Institution" },
  { value: "Complete", label: "Completely Signed" },
  { value: "Notary", label: "For Notary" },
  { value: "FFUPCopy", label: "FFUP Copy From College/Campus" },
  { value: "Active", label: "Active" },
  { value: "Withdrawn", label: "Withdrawn" },
];

const entryTypeOptions = [
  { value: "Renewal", label: "Renewal" },
  { value: "New", label: "New" },
  { value: "Other", label: "Other" },
];

const validityOptions = [
  { value: "5", label: "5" },
  { value: "4", label: "4" },
  { value: "3", label: "3" },
  { value: "2", label: "2" },
  { value: "1", label: "1" },
];

const ExtractedEntryMOA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [dtsNumber, setDtsNumber] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [source, setSource] = useState("");
  const [dtsStatus, setDtsStatus] = useState("");
  const [agreementStatus, setAgreementStatus] = useState("");
  const [entryType, setEntryType] = useState("");
  const [dateUlcoApproved, setDateUlcoApproved] = useState("");
  const [dateEndorsed, setDateEndorsed] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [remarks, setRemarks] = useState("");
  const [eventInfo, setEventInfo] = useState("");
  const [signatories, setSignatories] = useState("");
  const [hardcopyLocation, setHardcopyLocation] = useState("");

  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [dateSigned, setDateSigned] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("");
  const [dateExpiry, setDateExpiry] = useState("");
  const [datePupSigned, setDatePupSigned] = useState("");
  const [contacts, setContacts] = useState([
    { position: "", name: "", email: "" },
  ]);
  const [pointPersons, setPointPersons] = useState([
    { position: "", name: "", email: "" },
  ]);

  const [versionComment, setVersionComment] = useState("");
  const [selectedRelatedAgreement, setSelectedRelatedAgreement] = useState(null);
  const [relatedAgreements] = useState([]);
  const [partnerEntryType, setPartnerEntryType] = useState("New");
  const [partnerData, setPartnerData] = useState({
    name: "",
    entityType: "",
    address: "",
    logo: null,
    website: "",
    description: "",
  });
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [existingPartners] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Helper: detect whether extracted metadata actually contains meaningful data
  const hasMeaningfulExtractedMetadata = (meta) => {
    const isMeaningful = (val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === "string") return val.trim() !== "";
      if (typeof val === "number") return val !== 0;
      if (typeof val === "boolean") return true;
      if (Array.isArray(val)) {
        return val.length > 0 && val.some(isMeaningful);
      }
      if (typeof val === "object") {
        return Object.keys(val).some((k) => isMeaningful(val[k]));
      }
      return false;
    };
    return isMeaningful(meta);
  };

  // Handle country selection with auto-fill region
  const handleCountryChange = (selectedCountryOption) => {
    setSelectedCountry(selectedCountryOption);
    if (selectedCountryOption && selectedCountryOption.region) {
      const autoRegion = regionOptions.find(
        (r) => r.value === selectedCountryOption.region
      );
      if (autoRegion) {
        setSelectedRegion(autoRegion);
      } else {
        setSelectedRegion(null);
      }
    } else {
      setSelectedRegion(null);
    }
  };

  // Read navigation state (file + extracted metadata + initial form data) when arriving from upload page
  useEffect(() => {
    if (location && location.state) {
      const { 
        uploadedFile: navFile, 
        uploadedFileName: navFileName,
        uploadedFileSize: navFileSize,
        extractedMetadata: navMetadata,
        formData: navFormData,
        pointPersons: navPointPersons 
      } = location.state;
      
      // Debug logging
      console.log("=== RECEIVED FROM MOA.JSX ===");
      console.log("navFormData:", navFormData);
      console.log("navMetadata:", navMetadata);
      console.log("navPointPersons:", navPointPersons);
      console.log("=============================");
      
      if (navFile) setUploadedFile(navFile);
      // Use the separate file name/size if File object didn't serialize
      if (navFileName) setUploadedFileName(navFileName);
      if (navFileSize) setUploadedFileSize(navFileSize);
      
      // Store initial form data from moa.jsx
      if (navFormData) {
        setInitialFormData(navFormData);
      }
      
      // Store point persons from initial form
      if (navPointPersons && navPointPersons.length > 0) {
        setPointPersons(
          navPointPersons.map((p) => ({
            position: p.point_person_position || "",
            name: p.point_person_name || "",
            email: p.point_person_email || "",
          }))
        );
      }

      console.debug("extractedEntryMOA: navMetadata:", navMetadata);
      console.debug("extractedEntryMOA: navFormData:", navFormData);
      console.debug("extractedEntryMOA: navFileName:", navFileName);
      
      const meaningful = hasMeaningfulExtractedMetadata(navMetadata);
      console.debug("extractedEntryMOA: meaningful metadata?", meaningful);
      
      if (navMetadata && meaningful) {
        setExtractedMetadata(navMetadata);
      } else {
        setExtractedMetadata(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate form from initial form data (moa.jsx) - runs first
  useEffect(() => {
    if (initialFormData) {
      console.debug("=== APPLYING INITIAL FORM DATA ===");
      console.debug("initialFormData:", initialFormData);
      console.debug("ulcoApprovalDate:", initialFormData.ulcoApprovalDate);
      console.debug("pupSignedDate:", initialFormData.pupSignedDate);
      console.debug("==================================");
      
      // Apply initial form data from moa.jsx
      if (initialFormData.source) setSource(initialFormData.source);
      if (initialFormData.ulcoApprovalDate) setDateUlcoApproved(initialFormData.ulcoApprovalDate);
      if (initialFormData.dtsNo) setDtsNumber(initialFormData.dtsNo);
      if (initialFormData.dtsStatus) setDtsStatus(initialFormData.dtsStatus);
      if (initialFormData.pupSignedDate) setDatePupSigned(initialFormData.pupSignedDate);
      if (initialFormData.remarks) setRemarks(initialFormData.remarks);
    }
  }, [initialFormData]);

  // Populate form from extracted metadata - runs after initial form data
  useEffect(() => {
    if (!extractedMetadata) {
      if (uploadedFile || uploadedFileName) {
        setMessage("manual");
      }
      return;
    }

    setMessage("extracted");

    // Basic fields from extraction (these don't come from initial form)
    setDocumentType(extractedMetadata.document_type || "");
    setPartnershipType(extractedMetadata.partnership_type || "");
    setDateSigned(extractedMetadata.date_signed || "");
    setValidityPeriod(String(extractedMetadata.validity_period || ""));
    setEventInfo(extractedMetadata.event_info || "");
    setHardcopyLocation(extractedMetadata.hardcopy_location || "");
    setAgreementStatus(extractedMetadata.agreement_status || "");
    setEntryType(extractedMetadata.entry_type || "");

    // Only set date_expiry if not already calculated or provided
    if (!dateExpiry && extractedMetadata.date_expiry) {
      setDateExpiry(extractedMetadata.date_expiry);
    }

    // The initial form values should take priority
    if (!source) {
      // Only use extracted source_unit if it's meaningful
      const extractedSource = extractedMetadata.source_unit || "";
      if (extractedSource && extractedSource.length < 100) {
        setSource(extractedSource);
      }
    }
    if (!dtsNumber && extractedMetadata.dts_number) {
      setDtsNumber(extractedMetadata.dts_number);
    }
    if (!dateUlcoApproved && extractedMetadata.date_ulco_approved) {
      setDateUlcoApproved(extractedMetadata.date_ulco_approved);
    }
    if (!datePupSigned && extractedMetadata.date_signed_by_pup) {
      setDatePupSigned(extractedMetadata.date_signed_by_pup);
    }
    if (!dateEndorsed && extractedMetadata.date_endorsed_to_ulco) {
      setDateEndorsed(extractedMetadata.date_endorsed_to_ulco);
    }
    if (!dateReceived && extractedMetadata.date_received) {
      setDateReceived(extractedMetadata.date_received);
    }

    // Signatories (List[str] -> comma-separated string)
    if (Array.isArray(extractedMetadata.signatories_list) && extractedMetadata.signatories_list.length > 0) {
      setSignatories(extractedMetadata.signatories_list.join(", "));
    }

    // Partner data from extraction
    const partner = extractedMetadata.partner_data || {};
    if (partner.name || partner.country || partner.address || partner.entity_type) {
      setPartnerData({
        name: partner.name || "",
        entityType: partner.entity_type || "",
        address: partner.address || "",
        logo: partner.logo_path || null,
        website: partner.website_url || "",
        description: partner.description || "",
      });

      // Auto-select country and region from extraction
      if (partner.country) {
        const countryOpt = countryOptions.find(
          (c) => c.value.toLowerCase() === partner.country.toLowerCase() ||
                 c.label.toLowerCase() === partner.country.toLowerCase()
        );
        if (countryOpt) {
          setSelectedCountry(countryOpt);
          // Auto-set region from country's region property
          const regionOpt = regionOptions.find((r) => r.value === countryOpt.region);
          if (regionOpt) {
            setSelectedRegion(regionOpt);
          }
        } else {
          // Country not in options, create custom entry
          setSelectedCountry({ value: partner.country, label: partner.country });
          // Try to set region if provided
          if (partner.region) {
            const regionOpt = regionOptions.find(
              (r) => r.value.toLowerCase() === partner.region.toLowerCase()
            );
            setSelectedRegion(regionOpt || { value: partner.region, label: partner.region });
          }
        }
      } else if (partner.region) {
        // Only region provided, no country
        const regionOpt = regionOptions.find(
          (r) => r.value.toLowerCase() === partner.region.toLowerCase()
        );
        setSelectedRegion(regionOpt || { value: partner.region, label: partner.region });
      }
    }

    // Contact persons (partner contacts)
    if (Array.isArray(extractedMetadata.contact_persons) && extractedMetadata.contact_persons.length > 0) {
      setContacts(
        extractedMetadata.contact_persons.map((c) => ({
          position: c.contact_person_position || "",
          name: c.contact_person_name || "",
          email: c.contact_person_email || "",
        }))
      );
    }

    // Point persons - only override if not already set from initial form
    if (
      Array.isArray(extractedMetadata.point_persons) && 
      extractedMetadata.point_persons.length > 0 &&
      pointPersons.length === 1 && 
      !pointPersons[0].name
    ) {
      setPointPersons(
        extractedMetadata.point_persons.map((p) => ({
          position: p.point_person_position || "",
          name: p.point_person_name || "",
          email: p.point_person_email || "",
        }))
      );
    }

    // Initial remarks - only set if not already provided
    if (Array.isArray(extractedMetadata.initial_remarks) && extractedMetadata.initial_remarks.length > 0) {
      const extractedRemark = extractedMetadata.initial_remarks[0]?.remark_text || "";
      if (extractedRemark && !remarks) {
        setRemarks(extractedRemark);
      }
    }

    // Log what was extracted for debugging
    console.debug("Extracted metadata applied:", {
      documentType: extractedMetadata.document_type,
      partnershipType: extractedMetadata.partnership_type,
      partnerName: partner.name,
      partnerCountry: partner.country,
      dateSigned: extractedMetadata.date_signed,
      validityPeriod: extractedMetadata.validity_period,
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedMetadata]);

  // Effect to calculate Expiration Date based on datePupSigned and validityPeriod
  useEffect(() => {
    if (datePupSigned && validityPeriod) {
      const baseDate = new Date(datePupSigned);
      const yearsToAdd = parseInt(validityPeriod, 10);
      if (!isNaN(yearsToAdd) && yearsToAdd > 0) {
        baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
        const expiryCandidate = baseDate.toISOString().split("T")[0];
        
        // If MOA with related MOU, clamp to parent MOU expiry
        if (documentType === "MOA" && selectedRelatedAgreement?.date_expiry) {
          const parentExpiry = new Date(selectedRelatedAgreement.date_expiry);
          if (new Date(expiryCandidate) > parentExpiry) {
            alert(
              `MOA validity exceeds parent MOU expiry (${selectedRelatedAgreement.date_expiry}). Expiry will be clamped.`
            );
            setDateExpiry(selectedRelatedAgreement.date_expiry);
            return;
          }
        }
        setDateExpiry(expiryCandidate);
      }
    } else if (!datePupSigned || !validityPeriod) {
      // Only clear if user hasn't manually set an expiry from extraction
      if (!extractedMetadata?.date_expiry) {
        setDateExpiry("");
      }
    }
  }, [datePupSigned, validityPeriod, selectedRelatedAgreement, documentType, extractedMetadata]);

  // Submit handler - creates agreement and uploads file
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Get today's date for entry_date
      const today = new Date();
      const entryDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      // Build agreement data payload
      let agreementData = {
        source_unit: source,
        dts_number: dtsNumber,
        document_type: documentType,
        partnership_type: partnershipType,
        agreement_status: agreementStatus,
        entry_type: entryType,
        entry_date: entryDate,
        related_agreement_id:
          selectedRelatedAgreement?.value === "NA"
            ? null
            : selectedRelatedAgreement?.value || null,
        date_received: dateReceived || null,
        date_endorsed_to_ulco: dateEndorsed || null,
        date_ulco_approved: dateUlcoApproved || null,
        date_signed_by_pup: datePupSigned || null,
        date_signed: dateSigned || null,
        date_expiry: dateExpiry || null,
        validity_period: validityPeriod || null,
        event_info: eventInfo || null,
        signatories_list: signatories || null,
        hardcopy_location: hardcopyLocation || null,
        initial_remarks: remarks ? [{ remark_text: remarks }] : [],

        // Point persons array from state
        point_persons: pointPersons
          .filter((pp) => pp.name)
          .map((pp) => ({
            point_person_name: pp.name,
            point_person_position: pp.position || "",
            point_person_email: pp.email || "",
          })),

        // MOU to MOA link
        MOU_to_MOA_id:
          selectedRelatedAgreement?.value &&
          selectedRelatedAgreement?.value !== "NA"
            ? selectedRelatedAgreement.value
            : null,
      };

      // Handle partner differently for existing vs new
      if (partnerEntryType === "Existing") {
        agreementData.partner_id = selectedPartner?.value || null;
      } else {
        agreementData.partner_data = {
          name: partnerData.name,
          entity_type: partnerData.entityType,
          country: selectedCountry?.value || "",
          region: selectedRegion?.value || "",
          address: partnerData.address,
          website_url: partnerData.website || "",
          description: partnerData.description || "",
          logo_path: partnerData.logo || "",
          status: "active",
          contact_persons: contacts
            .filter((c) => c.name)
            .map((c) => ({
              contact_person_name: c.name,
              contact_person_position: c.position || "",
              contact_person_email: c.email || "",
            })),
        };
      }

      // Send request to backend to create agreement
      const response = await agreementService.createAgreement(agreementData);

      if (response.status === "duplicate") {
        setMessage(`Duplicate found:
         Partner: ${response.agreement.name}
         DTS No.: ${response.agreement.dts_number}
         Document Type: ${response.agreement.document_type}
         Partnership Type: ${response.agreement.partnership_type}`);
        return;
      }

      if (response.status === "created") {
        // Upload the file as document version if file exists
        let fileUploadSuccess = true;
        if (uploadedFile || uploadedFileName) {
          try {
            // Use the actual file if available, otherwise we can't upload
            if (uploadedFile && uploadedFile instanceof File) {
              await documentService.uploadVersion(
                dtsNumber,
                uploadedFile,
                versionComment || "Initial upload",
                agreementStatus
              );
            }
          } catch (uploadError) {
            console.warn("File upload failed:", uploadError);
            fileUploadSuccess = false;
          }
        }

        if (fileUploadSuccess) {
          setMessage("Entry created successfully!");
        } else {
          setMessage("Entry created successfully, but file upload failed. You can upload the document later from the tracking page.");
        }
        
        // Navigate to the tracking page after showing success message
        setTimeout(() => {
          navigate("/tracking");
        }, 2000);
      }
    } catch (error) {
      console.error("Full error:", error);
      setMessage("Error: " + (error.message || "Failed to create agreement"));
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerEntryTypeChange = (val) => setPartnerEntryType(val);
  const handleExistingPartnerChange = (opt) => setSelectedPartner(opt);

  const addPointPerson = () =>
    setPointPersons((p) => [...p, { position: "", name: "", email: "" }]);
  const removePointPerson = (idx) =>
    setPointPersons((p) => p.filter((_, i) => i !== idx));
  const handlePointPersonChange = (idx, field, value) =>
    setPointPersons((p) =>
      p.map((pp, i) => (i === idx ? { ...pp, [field]: value } : pp))
    );

  const addContact = () =>
    setContacts((c) => [...c, { position: "", name: "", email: "" }]);
  const removeContact = (idx) =>
    setContacts((c) => c.filter((_, i) => i !== idx));
  const handleContactChange = (idx, field, value) =>
    setContacts((c) =>
      c.map((ct, i) => (i === idx ? { ...ct, [field]: value } : ct))
    );

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result.split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });

  // Helper to get display file name
  const getDisplayFileName = () => {
    if (uploadedFile && uploadedFile.name) return uploadedFile.name;
    if (uploadedFileName) return uploadedFileName;
    return "No file uploaded";
  };

  // Helper to get display file size
  const getDisplayFileSize = () => {
    const size = uploadedFile?.size || uploadedFileSize;
    if (size) return `(${(size / 1024 / 1024).toFixed(2)} MB)`;
    return "";
  };

  return (
    <TopbarSidebar>
      <div className="moa-manual-container">
        <div className="moa-manual-content">
          <h1 className="moa-manual-form-title">Extracted Entry Form</h1>
          {/* Success/Error message display */}
          {message && message !== "manual" && message !== "extracted" && (
            <div
              style={{
                padding: "10px",
                margin: "10px 0",
                backgroundColor: message.includes("Error") || message.includes("Duplicate")
                  ? "#ffebee"
                  : "#e8f5e8",
                borderRadius: "8px",
                whiteSpace: "pre-line",
              }}
            >
              {message}
            </div>
          )}
          {message === "manual" && (
            <div
              className="moa-manual-form-group moa-manual-full-width"
              style={{
                background: "#fffbe8",
                border: "1px solid #eee",
                borderRadius: "10px",
                padding: "18px",
                marginBottom: "18px",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                  color: "#b8860b",
                  fontSize: "16px",
                  marginBottom: "8px",
                }}
              >
                <FiAlertCircle style={{ marginRight: "8px" }} />
                No extracted metadata available. Please fill the form manually.
              </span>
            </div>
          )}

          {/* Populated Metadata Message moved inside the form below */}

          <form className="manual-entry-form" onSubmit={handleSubmit}>
            {/* Populated Metadata Message (inside form) */}
            {hasMeaningfulExtractedMetadata(extractedMetadata) && (
              <div
                className="moa-manual-form-group moa-manual-full-width"
                style={{
                  background: "#fafafa",
                  border: "1px solid #eee",
                  borderRadius: "10px",
                  padding: "18px",
                  marginBottom: "18px",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 600,
                    color: "#07ca4fff",
                    fontSize: "16px",
                    marginBottom: "8px",
                  }}
                >
                  <FiCheckCircle style={{ marginRight: "8px" }} />
                  Form populated with extracted metadata!
                </span>
                <span style={{ color: "#444", fontSize: "14px" }}>
                  Please review and edit any fields below as needed.
                </span>
              </div>
            )}
            {/* DISPLAY UPLOADED FILE */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="uploadedFile" className="moa-manual-form-title">
                <FiFileText className="moa-manual-label-icon" /> Uploaded File:
              </label>
              <input
                id="uploadedFile"
                type="text"
                value={`${getDisplayFileName()} ${getDisplayFileSize()}`}
                readOnly
                style={{ backgroundColor: "#f5f5f5" }}
              />
            </div>

            {/* VERSION COMMENTS */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="versionComment">
                <FiMessageCircle className="moa-manual-label-icon" /> File
                Comments:
              </label>
              <textarea
                id="versionComment"
                value={versionComment}
                onChange={(e) => setVersionComment(e.target.value)}
              />
            </div>

            {/* Document Type */}
            <div className="moa-manual-form-group">
              <label htmlFor="docType">
                <FiFileText className="moa-manual-label-icon" /> Document Type:*
              </label>
              <Select
                inputId="docType"
                name="docType_select"
                options={docTypeOptions}
                value={
                  documentType
                    ? { value: documentType, label: documentType }
                    : null
                }
                onChange={(opt) => setDocumentType(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Document Type"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="docType" value={documentType} />
            </div>

            {/* Related MOU/MOA */}
            <div className="moa-manual-form-group">
              <label htmlFor="relatedAgreement">
                {documentType === "MOA"
                  ? "Related MOU"
                  : documentType === "MOU"
                  ? "Related MOA"
                  : "Related MOU/MOA"}
                :
              </label>
              <Select
                inputId="relatedAgreement"
                name="relatedAgreement_select"
                options={relatedAgreements}
                value={selectedRelatedAgreement}
                onChange={setSelectedRelatedAgreement}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Related Agreement"
                isDisabled={!documentType}
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input
                type="hidden"
                name="relatedAgreement"
                value={selectedRelatedAgreement?.value || ""}
              />
            </div>

            {/* AGREEMENT STATUS */}
            <div className="moa-manual-form-group">
              <label htmlFor="status">
                <FiCheckCircle className="moa-manual-label-icon" /> Agreement
                Status:*
              </label>
              <Select
                inputId="status"
                name="status_select"
                options={statusOptions}
                value={
                  agreementStatus
                    ? {
                        value: agreementStatus,
                        label: statusOptions.find(
                          (s) => s.value === agreementStatus
                        )?.label,
                      }
                    : null
                }
                onChange={(opt) => setAgreementStatus(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Status"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="status" value={agreementStatus} />
            </div>

            {/* AGREEMENT ENTRY TYPE */}
            <div className="moa-manual-form-group">
              <label htmlFor="entryType">
                <FiTag className="moa-manual-label-icon" /> Agreement Entry
                Type:*
              </label>
              <Select
                inputId="entryType"
                name="entryType_select"
                options={entryTypeOptions}
                value={
                  entryType ? { value: entryType, label: entryType } : null
                }
                onChange={(opt) => setEntryType(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Entry Type"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="entryType" value={entryType} />
            </div>

            {/* RENEWED AGREEMENT */}
            <div className="moa-manual-form-group">
              <label htmlFor="renewedFrom">
                Renewed Agreement from (DTS Number Format):
              </label>
              <input
                id="renewedFrom"
                name="renewedFrom"
                type="text"
                placeholder="DT2025123456"
              />
            </div>

            {/* VALIDITY PERIOD*/}
            <div className="moa-manual-form-group">
              <label htmlFor="validity">
                <FiClock className="moa-manual-label-icon" /> Validity Period:
              </label>
              <Select
                inputId="validity"
                name="validity_select"
                options={validityOptions}
                value={
                  validityPeriod
                    ? { value: validityPeriod, label: validityPeriod }
                    : null
                }
                onChange={(opt) => setValidityPeriod(opt ? opt.value : "")}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Period"
                isClearable
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="validity" value={validityPeriod} />
            </div>

            {/* DTS No. */}
            <div className="moa-manual-form-group">
              <label htmlFor="dtsNo">
                <FiHash className="moa-manual-label-icon" /> DTS No.:*
              </label>
              <input
                id="dtsNo"
                name="dtsNo"
                type="text"
                required
                value={dtsNumber}
                onChange={(e) => setDtsNumber(e.target.value)}
                placeholder="DT2025123456"
              />
            </div>

            {/* SOURCE UNIT */}
            <div className="moa-manual-form-group">
              <label htmlFor="source">
                <FiHome className="moa-manual-label-icon" /> Source
                (Campus/College Dept):*
              </label>
              <input
                id="source"
                name="source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </div>

            {/* PARTNERSHIP TYPE */}
            <div className="moa-manual-form-group">
              <label htmlFor="partnershipType">Partnership Type:*</label>
              <Select
                options={partnershipTypeOptions}
                name="partnershipType"
                id="partnershipType"
                required
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select Partnership Type"
                value={
                  partnershipTypeOptions.find(
                    (o) => o.value === partnershipType
                  ) || null
                }
                onChange={(opt) => setPartnershipType(opt?.value || "")}
                isSearchable={partnershipTypeOptions.length > 5}
              />
            </div>

            {/* Partner Entry Type */}
            <div className="moa-manual-form-group">
              <label htmlFor="partnerEntryType">
                <FiTag className="moa-manual-label-icon" /> Partner Entry Type:*
              </label>
              <select
                id="partnerEntryType"
                value={partnerEntryType}
                onChange={(e) => handlePartnerEntryTypeChange(e.target.value)}
                className="moa-manual-select"
              >
                <option value="New">New</option>
                <option value="Existing">Existing</option>
              </select>
            </div>

            {/* Partner Fields */}
            <div className="moa-manual-form-group">
              <label>Partner Name:*</label>
              {partnerEntryType === "New" ? (
                <input
                  type="text"
                  value={partnerData.name}
                  onChange={(e) =>
                    setPartnerData({ ...partnerData, name: e.target.value })
                  }
                  required
                />
              ) : (
                <Select
                  value={selectedPartner}
                  onChange={handleExistingPartnerChange}
                  options={existingPartners}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select Existing Partner"
                />
              )}
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiTag className="moa-manual-label-icon" />
                Entity Type:*
              </label>
              <input
                type="text"
                value={partnerData.entityType}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, entityType: e.target.value })
                }
                required
                readOnly={partnerEntryType === "Existing"}
                placeholder="e.g., University, Company, NGO"
              />
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiGlobe className="moa-manual-label-icon" />
                Country:*
              </label>
              {partnerEntryType === "New" ? (
                <Select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  options={countryOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select Country"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={selectedCountry?.label || ""}
                  readOnly
                />
              )}
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiGlobe className="moa-manual-label-icon" />
                Region:*
              </label>
              {partnerEntryType === "New" ? (
                <Select
                  value={selectedRegion}
                  onChange={setSelectedRegion}
                  options={regionOptions}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select Region"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={selectedRegion?.label || ""}
                  readOnly
                />
              )}
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiMapPin className="moa-manual-label-icon" />
                Address:
              </label>
              <input
                type="text"
                value={partnerData.address}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, address: e.target.value })
                }
                readOnly={partnerEntryType === "Existing"}
              />
            </div>

            <div className="moa-manual-form-group moa-manual-logo-field">
              <label>
                <FiImage className="moa-manual-label-icon" />
                Logo:
              </label>
              <div className="moa-manual-logo-preview-container">
                {partnerData.logo && typeof partnerData.logo === "string" && (
                  <img
                    src={`data:image/png;base64,${partnerData.logo}`}
                    alt="Partner Logo"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert("Logo too large. Maximum size is 2MB.");
                      return;
                    }

                    try {
                      const base64 = await toBase64(file);
                      setPartnerData({ ...partnerData, logo: base64 });
                    } catch (err) {
                      console.error("Base64 conversion failed:", err);
                      alert("Failed to process image.");
                    }
                  }}
                  disabled={partnerEntryType === "Existing"}
                />
              </div>
            </div>

            <div className="moa-manual-form-group">
              <label>
                <FiLink className="moa-manual-label-icon" />
                Website:
              </label>
              <input
                type="url"
                value={partnerData.website}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, website: e.target.value })
                }
                readOnly={partnerEntryType === "Existing"}
              />
            </div>

            <div className="moa-manual-form-group moa-manual-full-width">
              <label>
                <FiFileText className="moa-manual-label-icon" />
                Partner Description:
              </label>
              <textarea
                value={partnerData.description}
                onChange={(e) =>
                  setPartnerData({
                    ...partnerData,
                    description: e.target.value,
                  })
                }
                readOnly={partnerEntryType === "Existing"}
              />
            </div>

            {/* SIGNATORIES - bind to state */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="signatories">
                <FiEdit className="moa-manual-label-icon" /> Signatories:
              </label>
              <input 
                id="signatories" 
                name="signatories" 
                type="text"
                value={signatories}
                onChange={(e) => setSignatories(e.target.value)}
                placeholder="Enter signatories separated by commas"
              />
            </div>

            {/* POINT PERSON */}
            <div className="moa-manual-form-section compact-section">
              <label>
                <FiUser className="moa-manual-label-icon moa-point-icon" />{" "}
                Point Persons
              </label>
              {pointPersons.map((pp, index) => (
                <div key={index} className="moa-manual-contact-row">
                  <input
                    type="text"
                    placeholder="Position"
                    value={pp.position}
                    onChange={(e) =>
                      handlePointPersonChange(index, "position", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={pp.name}
                    onChange={(e) =>
                      handlePointPersonChange(index, "name", e.target.value)
                    }
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={pp.email}
                    onChange={(e) =>
                      handlePointPersonChange(index, "email", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="moa-manual-btn-icon add"
                    onClick={addPointPerson}
                    title="Add Point Person"
                  >
                    <FiPlus />
                  </button>
                  <button
                    type="button"
                    className="moa-manual-btn-icon remove"
                    onClick={() => removePointPerson(index)}
                    disabled={pointPersons.length === 1}
                    title="Remove this Point Person"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            {/* CONTACT PERSON */}
            <div className="moa-manual-form-section compact-section">
              <label>
                <FiUser className="moa-manual-label-icon moa-contact-icon" />{" "}
                Contact Person
              </label>
              {contacts.map((contact, index) => (
                <div key={index} className="moa-manual-contact-row">
                  <input
                    type="text"
                    placeholder="Position"
                    value={contact.position}
                    onChange={(e) =>
                      handleContactChange(index, "position", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) =>
                      handleContactChange(index, "name", e.target.value)
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={contact.email}
                    onChange={(e) =>
                      handleContactChange(index, "email", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="moa-manual-btn-icon add"
                    onClick={addContact}
                    title="Add Contact Person"
                  >
                    <FiPlus />
                  </button>
                  <button
                    type="button"
                    className="moa-manual-btn-icon remove"
                    onClick={() => removeContact(index)}
                    disabled={contacts.length === 1}
                    title="Remove this Contact Person"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>

            {/* DATE RECEIVED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateReceived">
                <FiCalendar className="moa-manual-label-icon" /> Date Received:*
              </label>
              <input
                id="dateReceived"
                name="dateReceived"
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                required
              />
            </div>

            {/* DATE EXPIRY */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateExpiry">
                <FiClock className="moa-manual-label-icon" /> Date Expiry:
              </label>
              <input
                id="dateExpiry"
                name="dateExpiry"
                type="date"
                value={dateExpiry}
                onChange={(e) => setDateExpiry(e.target.value)}
              />
            </div>

            {/* DATE PUP SIGNED */}
            <div className="moa-manual-form-group">
              <label htmlFor="datePupSigned">
                <FiEdit className="moa-manual-label-icon" /> Date PUP Signed:
              </label>
              <input
                id="datePupSigned"
                name="datePupSigned"
                type="date"
                value={datePupSigned}
                onChange={(e) => setDatePupSigned(e.target.value)}
              />
            </div>

            {/* DATE SIGNED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateSigned">
                <FiCalendar className="moa-manual-label-icon" /> Date/Year of
                Signing:
              </label>
              <input
                id="dateSigned"
                name="dateSigned"
                type="date"
                value={dateSigned}
                onChange={(e) => setDateSigned(e.target.value)}
              />
            </div>

            {/* DATE ENDORSED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateEndorsed">
                <FiCalendar className="moa-manual-label-icon" /> Date Endorsed
                to ULCO:
              </label>
              <input 
                id="dateEndorsed" 
                name="dateEndorsed" 
                type="date"
                value={dateEndorsed}
                onChange={(e) => setDateEndorsed(e.target.value)}
              />
            </div>

            {/* DATE ULCO APPROVED */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateUlcoApproved">
                <FiCheck className="moa-manual-label-icon" />
                Date ULCO Approved:
              </label>
              <input
                id="dateUlcoApproved"
                name="dateUlcoApproved"
                type="date"
                value={dateUlcoApproved}
                onChange={(e) => setDateUlcoApproved(e.target.value)}
              />
            </div>

            {/* HARDCOPY LOCATOR - bind to state */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="locator">
                <FiMapPin className="moa-manual-label-icon" /> Hardcopy Locator:
              </label>
              <input 
                id="locator" 
                name="locator" 
                type="text"
                value={hardcopyLocation}
                onChange={(e) => setHardcopyLocation(e.target.value)}
              />
            </div>

            {/* EVENT INFO - bind to state */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="eventInfo">
                <FiAward className="moa-manual-label-icon" /> Event Info:
              </label>
              <textarea 
                id="eventInfo" 
                name="eventInfo"
                value={eventInfo}
                onChange={(e) => setEventInfo(e.target.value)}
              />
            </div>

            {/* REMARKS */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="remarks">
                <FiMessageCircle className="moa-manual-label-icon" /> Remarks:
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="moa-manual-form-actions">
              <button
                type="submit"
                className="moa-manual-publish-button"
                disabled={loading}
              >
                {loading ? "Creating..." : "Publish"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TopbarSidebar>
  );
};

export default ExtractedEntryMOA;
