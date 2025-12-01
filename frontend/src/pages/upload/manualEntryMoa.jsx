import React, { useState, useEffect } from "react";
import Select from "react-select";
import {
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiHome,
  FiTag,
  FiGlobe,
  FiUsers,
  FiMapPin,
  FiImage,
  FiLink,
  FiEdit,
  FiUser,
  FiCalendar,
  FiCheck,
  FiAward,
  FiMessageCircle,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import TopbarSidebar from "../../components/topbarSidebar";
import { agreementService } from "../../services/agreementService";

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

const partnerOriginOptions = [
  { value: "Local", label: "Local" },
  { value: "International", label: "International" },
];

const partnerEntryTypeOptions = [
  { value: "New", label: "New" },
  { value: "Existing", label: "Existing" },
];

const ManualEntryMOA = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [partnershipType, setPartnershipType] = useState("");
  const [partnerOrigin, setPartnerOrigin] = useState("");
  const [dtsNumber, setDtsNumber] = useState("");
  const [source, setSource] = useState("");
  const [dateUlcoApproved, setDateUlcoApproved] = useState("");
  const [remarks, setRemarks] = useState("");
  const [agreementStatus, setAgreementStatus] = useState("");
  const [entryType, setEntryType] = useState("");

  // Partner state
  const [partnerEntryType, setPartnerEntryType] = useState("New");
  const [existingPartners, setExistingPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerData, setPartnerData] = useState({
    name: "",
    entityType: "",
    address: "",
    website: "",
    description: "",
    logo: null,
  });

  // Country and region states
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Related agreements for MOA selection
  const [relatedAgreements, setRelatedAgreements] = useState([]);
  const [selectedRelatedAgreement, setSelectedRelatedAgreement] =
    useState(null);

  // Contacts & point persons
  const [contacts, setContacts] = useState([
    { position: "", name: "", email: "" },
  ]);
  const [pointPersons, setPointPersons] = useState([
    { position: "", name: "", email: "" },
  ]);

  // Date states
  const [entryDate, setEntryDate] = useState("");
  const [dateSigned, setDateSigned] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("");
  const [dateExpiry, setDateExpiry] = useState("");
  const [datePupSigned, setDatePupSigned] = useState("");

  // Contact functions
  const addContact = () =>
    setContacts([...contacts, { position: "", name: "", email: "" }]);
  const handleContactChange = (i, field, val) => {
    const updated = [...contacts];
    updated[i][field] = val;
    setContacts(updated);
  };
  const removeContact = (i) =>
    setContacts(contacts.filter((_, idx) => idx !== i));

  // Point person functions
  const addPointPerson = () =>
    setPointPersons([...pointPersons, { position: "", name: "", email: "" }]);
  const handlePointPersonChange = (i, field, val) => {
    const updated = [...pointPersons];
    updated[i][field] = val;
    setPointPersons(updated);
  };
  const removePointPerson = (i) =>
    setPointPersons(pointPersons.filter((_, idx) => idx !== i));

  // Handle country selection with auto-fill region
  const handleCountryChange = (selectedCountryOption) => {
    setSelectedCountry(selectedCountryOption);
    if (selectedCountryOption && selectedCountryOption.region) {
      const autoRegion = regionOptions.find(
        (r) => r.value === selectedCountryOption.region
      );
      if (autoRegion) {
        setSelectedRegion(autoRegion);
      }
    } else {
      setSelectedRegion(null);
    }
  };

  // Set entry date to today automatically
  useEffect(() => {
    const today = new Date();
    const localDate = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];
    setEntryDate(localDate);
  }, []);

  // Effect to calculate Expiration Date (now respects parent MOU expiry when MOA)
  useEffect(() => {
    if (datePupSigned && validityPeriod) {
      const baseDate = new Date(datePupSigned);
      const yearsToAdd = parseInt(validityPeriod, 10);
      if (!isNaN(yearsToAdd)) {
        baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
        const expiryCandidate = baseDate.toISOString().split("T")[0];
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
      setDateExpiry("");
    }
  }, [
    datePupSigned,
    validityPeriod,
    selectedRelatedAgreement,
    documentType,
    partnerOrigin,
  ]);

  // Fetch existing partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await agreementService.getPartners();
        const options = response.map((p) => ({
          value: p.partner_id,
          label: p.name,
          ...p,
        }));
        setExistingPartners(options);
      } catch (error) {
        console.error("Failed to load partners", error);
      }
    };
    fetchPartners();
  }, []);

  // Related agreements fetch: run on mount and whenever documentType or partnerOrigin change.
  // This fetch populates the Select so it is visible even before a document type is chosen.
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const agreements = await agreementService.getAgreements();
        // determine which related document types to show depending on selected documentType
        const allowedTypes =
          documentType === "MOA"
            ? ["MOU"]
            : documentType === "MOU"
            ? ["MOA"]
            : ["MOU", "MOA"];

        const today = new Date();
        const filteredByType = agreements.filter((a) =>
          allowedTypes.includes(a.document_type)
        );

        const filtered = filteredByType.filter((a) => {
          const isActive = a.agreement_status === "Active";
          const hasExpiry = !!a.date_expiry;
          const expiryValid = hasExpiry
            ? new Date(a.date_expiry) >= today
            : false;
          const isOriginMatch = partnerOrigin
            ? partnerOrigin === "Local"
              ? a.country === "Philippines"
              : a.country !== "Philippines"
            : true;

          if (partnerOrigin === "Local") {
            return isActive && expiryValid && isOriginMatch;
          }
          if (partnerOrigin === "International") {
            return isActive && isOriginMatch;
          }
          // when partnerOrigin not selected yet, include active agreements
          return isActive;
        });

        const options = filtered.map((a) => ({
          value: a.agreement_id,
          label: `${a.dts_number} – ${a.name}`,
          partner_id: a.partner_id,
          partner_name: a.name,
          partner_country: a.country,
          partner_region: a.region,
          partner_address: a.address,
          partner_website: a.website_url,
          partner_entity_type: a.entity_type,
          partner_description: a.description,
          partner_logo: a.logo_path,
          date_expiry: a.date_expiry,
          document_type: a.document_type,
        }));

        // For International partner origin, allow explicit N/A option
        if (partnerOrigin === "International") {
          options.unshift({ value: "NA", label: "N/A" });
        }

        setRelatedAgreements(options);
        setSelectedRelatedAgreement(
          partnerOrigin === "International" && options.length > 0
            ? options[0]
            : null
        );
      } catch (err) {
        setRelatedAgreements([{ value: "NA", label: "N/A" }]);
        setSelectedRelatedAgreement({ value: "NA", label: "N/A" });
      }
    };
    fetchRelated();
  }, [documentType, partnerOrigin]);

  // When a Related MOU is selected -> autofill partner and lock to Existing
  const handleRelatedMouSelect = (opt) => {
    setSelectedRelatedAgreement(opt);
    if (documentType === "MOA" && opt && opt.value !== "NA") {
      setPartnerEntryType("Existing");
      setSelectedPartner({ value: opt.partner_id, label: opt.partner_name });
      setPartnerData({
        name: opt.partner_name,
        entityType: opt.partner_entity_type,
        address: opt.partner_address,
        website: opt.partner_website,
        description: opt.partner_description,
        logo: opt.partner_logo,
      });
      setSelectedCountry({
        value: opt.partner_country,
        label: opt.partner_country,
      });
      setSelectedRegion({
        value: opt.partner_region,
        label: opt.partner_region,
      });
    } else if (opt && opt.value === "NA") {
      // Allow choosing New partner for International MOA when NA selected
      setPartnerEntryType("New");
      setSelectedPartner(null);
    }
  };

  useEffect(() => {
    if (partnerOrigin === "International" && documentType === "MOA") {
      setPartnerEntryType("New");
    }
  }, [partnerOrigin, documentType]);

  // Lock partnerEntryType to Existing for Local MOA
  useEffect(() => {
    if (documentType === "MOA" && partnerOrigin === "Local") {
      setPartnerEntryType("Existing");
    }
  }, [documentType, partnerOrigin]);

  // Handle selecting an existing partner
  const handleExistingPartnerChange = (opt) => {
    setSelectedPartner(opt);
    if (opt) {
      setPartnerData({
        name: opt.name,
        entityType: opt.entity_type,
        address: opt.address,
        website: opt.website_url,
        description: opt.description,
        logo: opt.logo_path || null,
      });
      const countryOption = countryOptions.find((c) => c.value === opt.country);
      if (countryOption) {
        setSelectedCountry(countryOption);
        const regionOption = regionOptions.find((r) => r.value === opt.region);
        if (regionOption) {
          setSelectedRegion(regionOption);
        }
      } else {
        setSelectedCountry({ value: opt.country, label: opt.country });
        setSelectedRegion({ value: opt.region, label: opt.region });
      }
    }
  };

  // Convert file to base64 string
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result.split(",")[1]; // remove 'data:image/...;base64,'
        console.log("✅ Base64 string preview:", result.slice(0, 80) + "..."); // to verify
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });

  // Submit handler — attach MOU_to_MOA_id and enforce Local MOA requirement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // validate Local MOA requires Related MOU
      if (documentType === "MOA" && partnerOrigin === "Local") {
        if (
          !selectedRelatedAgreement ||
          selectedRelatedAgreement.value === "NA" ||
          selectedRelatedAgreement.value == null
        ) {
          setMessage("Local MOA requires selecting a Related MOU.");
          setLoading(false);
          return;
        }
      }

      const form = new FormData(e.target);
      const data = Object.fromEntries(form);

      let agreementData = {
        source_unit: data.source,
        dts_number: dtsNumber,
        document_type: documentType,
        partnership_type: partnershipType,
        agreement_status: data.status,
        entry_type: data.entryType,
        entry_date: entryDate,
        related_agreement_id:
          selectedRelatedAgreement?.value === "NA"
            ? null
            : selectedRelatedAgreement?.value || null,
        date_received: data.dateReceived || null,
        date_endorsed_to_ulco: data.dateEndorsed || null,
        date_ulco_approved: data.dateUlcoApproved || null,
        date_signed_by_pup: datePupSigned || null,
        date_signed: dateSigned || null,
        date_expiry: dateExpiry || null,
        validity_period: validityPeriod || null,
        event_info: data.eventInfo || null,
        signatories_list: data.signatories || null,

        // Point persons array from state
        point_persons: pointPersons
          .filter((pp) => pp.name)
          .map((pp) => ({
            point_person_name: pp.name,
            point_person_position: pp.position || "",
            point_person_email: pp.email || "",
          })),

        // Timer data
        timer: {
          deadline: data.deadlineDate || null,
          days: parseInt(data.days) || 0,
          hours: parseInt(data.hours) || 0,
          minutes: parseInt(data.minutes) || 0,
        },

        hardcopy_location: data.locator || null,
        renewed_from_agreement_id: data.renewedFrom
          ? String(data.renewedFrom)
          : null,
        initial_remarks: data.remarks ? [{ remark_text: data.remarks }] : [],
      };

      // pass partner MOU id to backend if applicable
      agreementData.MOU_to_MOA_id =
        selectedRelatedAgreement?.value &&
        selectedRelatedAgreement?.value !== "NA"
          ? selectedRelatedAgreement.value
          : null;

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

      // Send request to backend
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
        setMessage("Entry created successfully!");
        e.target.reset();
        setSelectedCountry(null);
        setSelectedRegion(null);
        setDtsNumber("");
        setSource("");
        setDateUlcoApproved("");
        setRemarks("");
        setDocumentType("");
        setPartnershipType("");
        setPartnerEntryType("New");
        setSelectedPartner(null);
        setPartnerData({
          name: "",
          entityType: "",
          address: "",
          website: "",
          description: "",
          logo: null,
        });
        setSelectedRelatedAgreement(null);
        setRelatedAgreements([]);
        setPointPersons([{ name: "", position: "", email: "" }]);
        setContacts([{ name: "", position: "", email: "" }]);
        setEntryDate("");
        setDateSigned("");
        setValidityPeriod("");
        setDateExpiry("");
        setDatePupSigned("");
      }
    } catch (error) {
      console.error("Full error:", error);
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerEntryTypeChange = (type) => {
    setPartnerEntryType(type);
    if (type === "New") {
      setSelectedPartner(null);
      setPartnerData({
        name: "",
        entityType: "",
        address: "",
        website: "",
        description: "",
        logo: null,
      });
      setSelectedCountry(null);
      setSelectedRegion(null);
    }
  };

  return (
    <TopbarSidebar>
      <div className="manual-entry-wrapper">
        <div className="manual-entry-container">
          <h2 className="moa-manual-form-title">Manual Entry Form</h2>
          {message && (
            <div
              style={{
                padding: "10px",
                margin: "10px 0",
                backgroundColor: message.includes("Error")
                  ? "#ffebee"
                  : "#e8f5e8",
              }}
            >
              {message}
            </div>
          )}
          <form className="manual-entry-form" onSubmit={handleSubmit}>
            {/* Document Type */}
            <div className="moa-manual-form-group">
              <label htmlFor="docType">
                <FiFileText className="moa-manual-label-icon" />
                Document Type:*
              </label>
              <Select
                inputId="docType"
                className="react-select-container"
                classNamePrefix="react-select"
                name="docType_select"
                options={docTypeOptions}
                value={
                  documentType
                    ? { value: documentType, label: documentType }
                    : null
                }
                onChange={(opt) => setDocumentType(opt ? opt.value : "")}
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

            {/* Related Agreement: always visible (label adapts to selected document type) */}
            <div className="moa-manual-form-group">
              <label htmlFor="relatedAgreement">
                <FiFileText className="moa-manual-label-icon" />
                {documentType === "MOA"
                  ? "Related MOU"
                  : documentType === "MOU"
                  ? "Related MOA"
                  : "Related MOU/MOA"}
                :
              </label>
              <Select
                inputId="relatedAgreement"
                className="react-select-container"
                classNamePrefix="react-select"
                name="relatedAgreement_select"
                options={relatedAgreements}
                value={selectedRelatedAgreement}
                onChange={(opt) => handleRelatedMouSelect(opt)}
                isDisabled={!documentType || relatedAgreements.length === 0}
                placeholder={
                  !documentType
                    ? "Please select Document Type first"
                    : partnerOrigin === "Local"
                    ? "Select Related Local MOU"
                    : "Select Related MOU/MOA (optional)"
                }
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
                <FiCheckCircle className="moa-manual-label-icon" />
                Agreement Status:*
              </label>
              <Select
                inputId="status"
                className="react-select-container"
                classNamePrefix="react-select"
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

            {/* Agreement Entry Type */}
            <div className="moa-manual-form-group">
              <label htmlFor="entryType">
                <FiCheckCircle className="moa-manual-label-icon" />
                Agreement Entry Type:*
              </label>
              <Select
                inputId="entryType"
                className="react-select-container"
                classNamePrefix="react-select"
                name="entryType_select"
                options={entryTypeOptions}
                value={
                  entryType ? { value: entryType, label: entryType } : null
                }
                onChange={(opt) => setEntryType(opt ? opt.value : "")}
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
                <FiFileText className="moa-manual-label-icon" />
                Renewed Agreement from (DTS Number Format):
              </label>
              <input
                id="renewedFrom"
                name="renewedFrom"
                type="text"
                placeholder="DT2025123456"
              />
            </div>

            {/* Validity Period */}
            <div className="moa-manual-form-group">
              <label htmlFor="validity">
                <FiClock className="moa-manual-label-icon" />
                Validity Period:
              </label>
              <Select
                inputId="validity"
                className="react-select-container"
                classNamePrefix="react-select"
                name="validity_select"
                options={validityOptions}
                value={
                  validityPeriod
                    ? { value: validityPeriod, label: validityPeriod }
                    : null
                }
                onChange={(opt) => setValidityPeriod(opt ? opt.value : "")}
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
                <FiHash className="moa-manual-label-icon" />
                DTS No.:*
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
                <FiHome className="moa-manual-label-icon" />
                Source (Campus/College Dept):*
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
              <label htmlFor="partnershipType">
                <FiTag className="moa-manual-label-icon" />
                Partnership Type:*
              </label>
              <Select
                inputId="partnershipType"
                className="react-select-container"
                classNamePrefix="react-select"
                name="partnershipType_select"
                options={partnershipTypeOptions}
                value={
                  partnershipType
                    ? { value: partnershipType, label: partnershipType }
                    : null
                }
                onChange={(opt) => setPartnershipType(opt ? opt.value : "")}
                placeholder="Select Partnership Type"
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
                name="partnershipType"
                value={partnershipType}
              />
            </div>

            {/* Partner Origin */}
            <div className="moa-manual-form-group">
              <label htmlFor="partnerOrigin">
                <FiGlobe className="moa-manual-label-icon" />
                Partner Origin:*
              </label>
              <Select
                inputId="partnerOrigin"
                className="react-select-container"
                classNamePrefix="react-select"
                name="partnerOrigin_select"
                options={partnerOriginOptions}
                value={
                  partnerOrigin
                    ? { value: partnerOrigin, label: partnerOrigin }
                    : null
                }
                onChange={(opt) => setPartnerOrigin(opt ? opt.value : "")}
                placeholder="Select Origin"
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
              <input type="hidden" name="partnerOrigin" value={partnerOrigin} />
            </div>

            {/* Partner Entry Type */}
            <div className="moa-manual-form-group">
              <label htmlFor="partnerEntryType">
                <FiTag className="moa-manual-label-icon" />
                Partner Entry Type:*
              </label>
              <Select
                inputId="partnerEntryType"
                className="react-select-container"
                classNamePrefix="react-select"
                name="partnerEntryType_select"
                options={partnerEntryTypeOptions}
                value={
                  partnerEntryType
                    ? { value: partnerEntryType, label: partnerEntryType }
                    : null
                }
                onChange={(opt) =>
                  handlePartnerEntryTypeChange(opt ? opt.value : "")
                }
                isDisabled={documentType === "MOA" && partnerOrigin === "Local"}
                placeholder="Select Entry Type"
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
                name="partnerEntryType"
                value={partnerEntryType}
              />
            </div>

            {/* Partner Fields */}
            <div className="moa-manual-form-group">
              <label>
                <FiUsers className="moa-manual-label-icon" />
                Partner Name:*
              </label>
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
                  isDisabled={
                    documentType === "MOA" && partnerOrigin === "Local"
                  }
                  isSearchable={existingPartners.length > 5}
                  menuPlacement="bottom"
                  menuPosition="fixed"
                  menuShouldScrollIntoView={false}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
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
                <>
                  <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    inputId="country"
                    name="country_select"
                    options={countryOptions}
                    value={selectedCountry}
                    onChange={(opt) => handleCountryChange(opt)}
                    placeholder="Select country..."
                    menuPlacement="bottom"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                  <input
                    type="hidden"
                    name="country"
                    value={selectedCountry?.value || ""}
                  />
                </>
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
                <FiMapPin className="moa-manual-label-icon" />
                Region:*
              </label>
              {partnerEntryType === "New" ? (
                <>
                  <Select
                    className="react-select-container"
                    classNamePrefix="react-select"
                    inputId="region"
                    name="region_select"
                    options={regionOptions}
                    value={selectedRegion}
                    onChange={(opt) => setSelectedRegion(opt)}
                    placeholder="Select region..."
                    menuPlacement="bottom"
                    menuPosition="fixed"
                    menuShouldScrollIntoView={false}
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                  <input
                    type="hidden"
                    name="region"
                    value={selectedRegion?.value || ""}
                  />
                </>
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

            {/* SIGNATORIES */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="signatories">
                <FiEdit className="moa-manual-label-icon" />
                Signatories:
              </label>
              <input id="signatories" name="signatories" type="text" />
            </div>

            {/* POINT PERSON */}
            <div className="moa-manual-form-section compact-section">
              <label>
                <FiUser className="moa-manual-label-icon moa-point-icon" />
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
                <FiUser className="moa-manual-label-icon moa-contact-icon" />
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
                <FiCalendar className="moa-manual-label-icon" />
                Date Received:*
              </label>
              <input
                id="dateReceived"
                name="dateReceived"
                type="date"
                required
              />
            </div>

            {/* DATE EXPIRY */}
            <div className="moa-manual-form-group">
              <label htmlFor="dateExpiry">
                <FiClock className="moa-manual-label-icon" />
                Date Expiry:
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
                <FiEdit className="moa-manual-label-icon" />
                Date PUP Signed:
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
                <FiCalendar className="moa-manual-label-icon" />
                Date/Year of Signing:
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
                <FiCalendar className="moa-manual-label-icon" />
                Date Endorsed to ULCO:
              </label>
              <input id="dateEndorsed" name="dateEndorsed" type="date" />
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

            {/* HARDCOPY LOCATOR */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="locator">
                <FiMapPin className="moa-manual-label-icon" />
                Hardcopy Locator:
              </label>
              <input id="locator" name="locator" type="text" />
            </div>

            {/* EVENT INFO */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="eventInfo">
                <FiAward className="moa-manual-label-icon" />
                Event Info:
              </label>
              <textarea id="eventInfo" name="eventInfo" />
            </div>

            {/* REMARKS */}
            <div className="moa-manual-form-group moa-manual-full-width">
              <label htmlFor="remarks">
                <FiMessageCircle className="moa-manual-label-icon" />
                Remarks:
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

export default ManualEntryMOA;
