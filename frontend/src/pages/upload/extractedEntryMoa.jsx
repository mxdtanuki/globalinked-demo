import React, { useState,useEffect } from 'react';
import TopbarSidebar from '../../components/topbarSidebar';
import Select from 'react-select';
import { agreementService } from '../../services/agreementService';
import './globalUpload.css';
import { useLocation } from 'react-router-dom';
  
const countryOptions = [
  { value: "Afghanistan", label: "Afghanistan", region: "Southern Asia" },
  { value: "Albania", label: "Albania", region: "Southern Europe" },
  { value: "Algeria", label: "Algeria", region: "Northern Africa" },
  { value: "Andorra", label: "Andorra", region: "Southern Europe" },
  { value: "Angola", label: "Angola", region: "Middle Africa" },
  { value: "Antigua and Barbuda", label: "Antigua and Barbuda", region: "Caribbean" },
  { value: "Argentina", label: "Argentina", region: "South America" },
  { value: "Armenia", label: "Armenia", region: "Western Asia" },
  { value: "Australia", label: "Australia", region: "Oceania" },
  { value: "Austria", label: "Austria", region: "Western Europe" },
  { value: "Azerbaijan", label: "Azerbaijan", region: "Western Asia" },
  { value: "Bahamas", label: "Bahamas", region: "Caribbean" },
  { value: "Bahrain", label: "Bahrain", region: "Western Asia" },
  { value: "Bangladesh", label: "Bangladesh", region: "Southern Asia" },
  { value: "Barbados", label: "Barbados", region: "Caribbean" },
  { value: "Belarus", label: "Belarus", region: "Eastern Europe" },
  { value: "Belgium", label: "Belgium", region: "Western Europe" },
  { value: "Belize", label: "Belize", region: "Central America" },
  { value: "Benin", label: "Benin", region: "Western Africa" },
  { value: "Bhutan", label: "Bhutan", region: "Southern Asia" },
  { value: "Bolivia", label: "Bolivia", region: "South America" },
  { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina", region: "Southern Europe" },
  { value: "Botswana", label: "Botswana", region: "Southern Africa" },
  { value: "Brazil", label: "Brazil", region: "South America" },
  { value: "Brunei", label: "Brunei", region: "South-Eastern Asia" },
  { value: "Bulgaria", label: "Bulgaria", region: "Eastern Europe" },
  { value: "Burkina Faso", label: "Burkina Faso", region: "Western Africa" },
  { value: "Burundi", label: "Burundi", region: "Eastern Africa" },
  { value: "Cabo Verde", label: "Cabo Verde", region: "Western Africa" },
  { value: "Cambodia", label: "Cambodia", region: "South-Eastern Asia" },
  { value: "Cameroon", label: "Cameroon", region: "Middle Africa" },
  { value: "Canada", label: "Canada", region: "North America" },
  { value: "Central African Republic", label: "Central African Republic", region: "Middle Africa" },
  { value: "Chad", label: "Chad", region: "Middle Africa" },
  { value: "Chile", label: "Chile", region: "South America" },
  { value: "China", label: "China", region: "Eastern Asia" },
  { value: "Colombia", label: "Colombia", region: "South America" },
  { value: "Comoros", label: "Comoros", region: "Eastern Africa" },
  { value: "Congo (Congo-Brazzaville)", label: "Congo (Congo-Brazzaville)", region: "Middle Africa" },
  { value: "Costa Rica", label: "Costa Rica", region: "Central America" },
  { value: "Croatia", label: "Croatia", region: "Southern Europe" },
  { value: "Cuba", label: "Cuba", region: "Caribbean" },
  { value: "Cyprus", label: "Cyprus", region: "Western Asia" },
  { value: "Czechia", label: "Czechia", region: "Eastern Europe" },
  { value: "Democratic Republic of the Congo", label: "Democratic Republic of the Congo", region: "Middle Africa" },
  { value: "Denmark", label: "Denmark", region: "Northern Europe" },
  { value: "Djibouti", label: "Djibouti", region: "Eastern Africa" },
  { value: "Dominica", label: "Dominica", region: "Caribbean" },
  { value: "Dominican Republic", label: "Dominican Republic", region: "Caribbean" },
  { value: "Ecuador", label: "Ecuador", region: "South America" },
  { value: "Egypt", label: "Egypt", region: "Northern Africa" },
  { value: "El Salvador", label: "El Salvador", region: "Central America" },
  { value: "Equatorial Guinea", label: "Equatorial Guinea", region: "Middle Africa" },
  { value: "Eritrea", label: "Eritrea", region: "Eastern Africa" },
  { value: "Estonia", label: "Estonia", region: "Northern Europe" },
  { value: "Eswatini", label: "Eswatini", region: "Southern Africa" },
  { value: "Ethiopia", label: "Ethiopia", region: "Eastern Africa" },
  { value: "Fiji", label: "Fiji", region: "Oceania" },
  { value: "Finland", label: "Finland", region: "Northern Europe" },
  { value: "France", label: "France", region: "Western Europe" },
  { value: "Gabon", label: "Gabon", region: "Middle Africa" },
  { value: "Gambia", label: "Gambia", region: "Western Africa" },
  { value: "Georgia", label: "Georgia", region: "Western Asia" },
  { value: "Germany", label: "Germany", region: "Western Europe" },
  { value: "Ghana", label: "Ghana", region: "Western Africa" },
  { value: "Greece", label: "Greece", region: "Southern Europe" },
  { value: "Grenada", label: "Grenada", region: "Caribbean" },
  { value: "Guatemala", label: "Guatemala", region: "Central America" },
  { value: "Guinea", label: "Guinea", region: "Western Africa" },
  { value: "Guinea-Bissau", label: "Guinea-Bissau", region: "Western Africa" },
  { value: "Guyana", label: "Guyana", region: "South America" },
  { value: "Haiti", label: "Haiti", region: "Caribbean" },
  { value: "Honduras", label: "Honduras", region: "Central America" },
  { value: "Hungary", label: "Hungary", region: "Eastern Europe" },
  { value: "Iceland", label: "Iceland", region: "Northern Europe" },
  { value: "India", label: "India", region: "Southern Asia" },
  { value: "Indonesia", label: "Indonesia", region: "South-Eastern Asia" },
  { value: "Iran", label: "Iran", region: "Southern Asia" },
  { value: "Iraq", label: "Iraq", region: "Western Asia" },
  { value: "Ireland", label: "Ireland", region: "Northern Europe" },
  { value: "Israel", label: "Israel", region: "Western Asia" },
  { value: "Italy", label: "Italy", region: "Southern Europe" },
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
  { value: "North Macedonia", label: "North Macedonia", region: "Southern Europe" },
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
  { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis", region: "Caribbean" },
  { value: "Saint Lucia", label: "Saint Lucia", region: "Caribbean" },
  { value: "Saint Vincent and the Grenadines", label: "Saint Vincent and the Grenadines", region: "Caribbean" },
  { value: "Samoa", label: "Samoa", region: "Oceania" },
  { value: "San Marino", label: "San Marino", region: "Southern Europe" },
  { value: "Sao Tome and Principe", label: "Sao Tome and Principe", region: "Middle Africa" },
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
  { value: "Trinidad and Tobago", label: "Trinidad and Tobago", region: "Caribbean" },
  { value: "Tunisia", label: "Tunisia", region: "Northern Africa" },
  { value: "Turkey", label: "Turkey", region: "Western Asia" },
  { value: "Turkmenistan", label: "Turkmenistan", region: "Central Asia" },
  { value: "Tuvalu", label: "Tuvalu", region: "Oceania" },
  { value: "Uganda", label: "Uganda", region: "Eastern Africa" },
  { value: "Ukraine", label: "Ukraine", region: "Eastern Europe" },
  { value: "United Arab Emirates", label: "United Arab Emirates", region: "Western Asia" },
  { value: "United Kingdom", label: "United Kingdom", region: "Northern Europe" },
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
  // Special regions/entities if needed:
  { value: "HongKong", label: "HongKong", region: "Eastern Asia" },
  { value: "Macao", label: "Macao", region: "Eastern Asia" }
];

const regionOptions = [
  { value: 'Central Asia', label: 'Central Asia' },
  { value: 'Eastern Asia', label: 'Eastern Asia' },
  { value: 'Southern Asia', label: 'Southern Asia' },
  { value: 'South-Eastern Asia', label: 'South-Eastern Asia' },
  { value: 'Western Asia', label: 'Western Asia' },
  { value: 'Northern Europe', label: 'Northern Europe' },
  { value: 'Western Europe', label: 'Western Europe' },
  { value: 'Eastern Europe', label: 'Eastern Europe' },
  { value: 'Southern Europe', label: 'Southern Europe' },
  { value: 'North America', label: 'North America' },
  { value: 'Caribbean', label: 'Caribbean' },
  { value: 'Central America', label: 'Central America' },
  { value: 'South America', label: 'South America' },
  { value: 'Oceania', label: 'Oceania' },
  { value: 'Eastern Africa', label: 'Eastern Africa' },
  { value: 'Middle Africa', label: 'Middle Africa' },
  { value: 'Northern Africa', label: 'Northern Africa' },
  { value: 'Southern Africa', label: 'Southern Africa' },
  { value: 'Western Africa', label: 'Western Africa' },
];

const partnershipTypeOptions = [
  { value: 'Agreement', label: 'Agreement' },
  { value: 'Contract Agreement', label: 'Contract Agreement' },
  { value: 'Cooperation Agreement', label: 'Cooperation Agreement' },
  { value: 'Implementation Agreement', label: 'Implementation Agreement' },
  { value: 'Online Study Tour Agreement', label: 'Online Study Tour Agreement' },
  { value: 'License and Cooperation Agreement', label: 'License and Cooperation Agreement' },
  { value: 'Agreement of International Faculty Exchanges for Academic Training Program', label: 'Agreement of International Faculty Exchanges for Academic Training Program' },
  { value: 'Due Diligence', label: 'Due Diligence' },
  { value: 'Joint Education Programs and Training Cooperation', label: 'Joint Education Programs and Training Cooperation' },
  { value: 'MOA on Academic Exchange', label: 'MOA on Academic Exchange' },
  { value: 'MOA on Faculty Exchange', label: 'MOA on Faculty Exchange' },
  { value: 'MOA on Student Exchange', label: 'MOA on Student Exchange' },
  { value: 'MOA on Cultural Exchange', label: 'MOA on Cultural Exchange' },
  { value: 'MOA on Research', label: 'MOA on Research' },
  { value: 'MOA on Internship', label: 'MOA on Internship' },
  { value: 'MOA on Training and Research Collaboration', label: 'MOA on Training and Research Collaboration' },
  { value: 'MOA on Conferences', label: 'MOA on Conferences' },
  { value: 'MOA on International Competition', label: 'MOA on International Competition' },
  { value: 'MOA Global Leadership', label: 'MOA Global Leadership' },
  { value: 'MOA for Donation', label: 'MOA for Donation' },
  { value: 'MOA on English Class', label: 'MOA on English Class' },
  { value: 'MOA on English Camp', label: 'MOA on English Camp' },
  { value: 'MOA on Academic Partnership', label: 'MOA on Academic Partnership' },
  { value: 'MOA (RMO)', label: 'MOA (RMO)' },
  { value: 'MOA (VPRED)', label: 'MOA (VPRED)' },
  { value: 'MOA with PUP Sta.Rosa', label: 'MOA with PUP Sta.Rosa' },
  { value: 'MOA with PACA', label: 'MOA with PACA' },
  { value: 'MOA CITAA', label: 'MOA CITAA' },
  { value: 'MOA CAH', label: 'MOA CAH' },
  { value: 'MOA with College of Science', label: 'MOA with College of Science' },
  { value: 'MOA with College of Engineering', label: 'MOA with College of Engineering' },
  { value: 'MOA on Career Orientation Services', label: 'MOA on Career Orientation Services' },
  { value: 'MOA on International Educational Cooperation', label: 'MOA on International Educational Cooperation' },
  { value: 'MOA on Promotion and Collaboration on International Academic and Research', label: 'MOA on Promotion and Collaboration on International Academic and Research' },
  { value: 'MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents', label: 'MOA for Academic Exchange: Joint Development Agreement for Railway-Related Programs Academic Documents' },
  { value: 'MOA on Extension Project', label: 'MOA on Extension Project' },
  { value: 'MOA Tripartite', label: 'MOA Tripartite' },
  { value: 'MOA on English and Cultural Program', label: 'MOA on English and Cultural Program' },
  { value: 'MOA on Student Competition', label: 'MOA on Student Competition' },
  { value: 'MOA on Faculty and Student Exchange', label: 'MOA on Faculty and Student Exchange' }
];

const ExtractedEntryMOA = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [dtsNumber, setDtsNumber] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [partnershipType, setPartnershipType] = useState("");

  // Additional form states for initial data
  const [source, setSource] = useState("");
  const [dtsStatus, setDtsStatus] = useState("");
  const [dateUlcoApproved, setDateUlcoApproved] = useState("");
  const [remarks, setRemarks] = useState("");
 
  const location = useLocation();  
  const uploadedFile = location.state?.uploadedFile;  // Retrieve file
  const formData = location.state?.formData;  // Retrieve form data
  const initialPointPersons = location.state?.pointPersons;  // Retrieve point persons
  const extractedMetadata = location.state?.extractedMetadata;  // Retrieve extracted metadata
  const [versionComment, setVersionComment] = useState("");

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

  // Contacts & point persons
  const [contacts, setContacts] = useState([{ position: "", name: "", email: "" }]);
  const [pointPersons, setPointPersons] = useState([{ position: "", name: "", email: "" }]);

  // Date states
  const [entryDate, setEntryDate] = useState("");
  const [dateSigned, setDateSigned] = useState("");
  const [validityPeriod, setValidityPeriod] = useState("");
  const [dateExpiry, setDateExpiry] = useState("");
   const [datePupSigned, setDatePupSigned] = useState("");


  // Contact functions
  const addContact = () => setContacts([...contacts, { position: "", name: "", email: "" }]);
  const handleContactChange = (i, field, val) => {
    const updated = [...contacts];
    updated[i][field] = val;
    setContacts(updated);
  };
  const removeContact = (i) => setContacts(contacts.filter((_, idx) => idx !== i));

  // Point person functions
  const addPointPerson = () => setPointPersons([...pointPersons, { position: "", name: "", email: "" }]);
  const handlePointPersonChange = (i, field, val) => {
    const updated = [...pointPersons];
    updated[i][field] = val;
    setPointPersons(updated);
  };
  const removePointPerson = (i) => setPointPersons(pointPersons.filter((_, idx) => idx !== i));

  // Handle country selection with auto-fill region
  const handleCountryChange = (selectedCountryOption) => {
    setSelectedCountry(selectedCountryOption);
    if (selectedCountryOption && selectedCountryOption.region) {
      const autoRegion = regionOptions.find(r => r.value === selectedCountryOption.region);
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
  const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  setEntryDate(localDate);
}, []);

// Effect to calculate Expiration Date
useEffect(() => {
  if (datePupSigned && validityPeriod) {
    const baseDate = new Date(datePupSigned);
    const yearsToAdd = parseInt(validityPeriod, 10);
    if (!isNaN(yearsToAdd)) {
      baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
      setDateExpiry(baseDate.toISOString().split('T')[0]);
    }
  } else if (!datePupSigned || !validityPeriod) {
    setDateExpiry("");
  }
}, [datePupSigned, validityPeriod]);

  // Fetch existing partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await agreementService.getPartners();
        const options = response.map(p => ({
          value: p.partner_id,
          label: p.name,
          ...p
        }));
        setExistingPartners(options);
      } catch (error) {
        console.error("Failed to load partners", error);
      }
    };
    fetchPartners();
  }, []);

  // Set initial data from location state
  useEffect(() => {
    if (formData) {
      setSource(formData.source || "");
      setDtsNumber(formData.dtsNo || "");
      setDtsStatus(formData.dtsStatus || "");
      setDatePupSigned(formData.pupSignedDate || "");
      setDateUlcoApproved(formData.ulcoApprovalDate || "");
      setRemarks(formData.remarks || "");
    }
    if (initialPointPersons && initialPointPersons.length > 0) {
      setPointPersons(initialPointPersons.map(pp => ({
        position: pp.point_person_position || "",
        name: pp.point_person_name || "",
        email: pp.point_person_email || ""
      })));
    }
  }, [formData, initialPointPersons]);

  // Populate form with extracted metadata
  useEffect(() => {
    if (extractedMetadata) {
      setMessage("Using extracted metadata from document...");

      // Populate form with extracted data
      if (extractedMetadata.partner_data) {
        setPartnerData({
          name: extractedMetadata.partner_data.name || "",
          entityType: extractedMetadata.partner_data.entity_type || "",
          address: extractedMetadata.partner_data.address || "",
          website: extractedMetadata.partner_data.website_url || "",
          description: extractedMetadata.partner_data.description || "",
          logo: null,
        });
        // Set country and region
        if (extractedMetadata.partner_data.country) {
          const countryOpt = countryOptions.find(c => c.value === extractedMetadata.partner_data.country);
          if (countryOpt) {
            setSelectedCountry(countryOpt);
            setSelectedRegion(regionOptions.find(r => r.value === countryOpt.region) || null);
          }
        }
      }

      setDocumentType(extractedMetadata.document_type || "");
      setPartnershipType(extractedMetadata.partnership_type || "");
      setDateSigned(extractedMetadata.date_signed || "");
      setValidityPeriod(extractedMetadata.validity_period || "");
      setDateExpiry(extractedMetadata.date_expiry || "");

      // Set dates
      setEntryDate(extractedMetadata.entry_date || entryDate);
      setDatePupSigned(extractedMetadata.date_pup_signed || datePupSigned);
      setDateUlcoApproved(extractedMetadata.date_ulco_approved || dateUlcoApproved);

      // Set DTS info
      setDtsNumber(extractedMetadata.dts_number || dtsNumber);
      //setDtsStatus(extractedMetadata.dts_status || dtsStatus);

      // Set contacts and point persons
      if (extractedMetadata.contact_persons && extractedMetadata.contact_persons.length > 0) {
        setContacts(extractedMetadata.contact_persons.map(c => ({
          position: c.contact_person_position || "",
          name: c.contact_person_name || "",
          email: c.contact_person_email || ""
        })));
      }

      if (extractedMetadata.point_persons && extractedMetadata.point_persons.length > 0) {
        setPointPersons(extractedMetadata.point_persons.map(p => ({
          position: p.point_person_position || "",
          name: p.point_person_name || "",
          email: p.point_person_email || ""
        })));
      }

      setRemarks(extractedMetadata.initial_remarks?.[0]?.remark_text || remarks);

      setMessage("Form populated with extracted metadata!");
    } else if (uploadedFile) {
      setMessage("No extracted metadata available. Please fill the form manually.");
    }
  }, [extractedMetadata, uploadedFile]);

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
      const countryOption = countryOptions.find(c => c.value === opt.country);
      if (countryOption) {
        setSelectedCountry(countryOption);
        const regionOption = regionOptions.find(r => r.value === opt.region);
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


  // Submit handler
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");

  try {
    const form = new FormData(e.target);
    const data = Object.fromEntries(form);

    let agreementData = {
      source_unit: data.source,
      dts_number: dtsNumber,
     // dts_status: data.dtsStatus,
      document_type: documentType,
      partnership_type: partnershipType,
      agreement_status: data.status,
      entry_type: data.entryType,
      entry_date: entryDate || null, // not from form
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
      initial_remarks: data.remarks
        ? [{ remark_text: data.remarks }]
        : [],
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
        logo_path: partnerData.logo || "", // <-- send the base64 string
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
      setMessage(
        `Duplicate found:
         Partner: ${response.agreement.name}
         DTS No.: ${response.agreement.dts_number}
         Document Type: ${response.agreement.document_type}
         Partnership Type: ${response.agreement.partnership_type}`
      );
      return;
    }

    if (response.status === "created") {
      setMessage("Entry created successfully!");

      // Upload version if file is provided
      if (uploadedFile) {
        try {
          const formData = new FormData();
          formData.append("file", uploadedFile);
          formData.append("version_comment", versionComment);
          formData.append("status_at_upload", agreementData.agreement_status);

          const res = await fetch(
            `/documents/${agreementData.dts_number}/versions`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!res.ok) {
            throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
          }

          setMessage("Entry created and version uploaded successfully!");
        } catch (err) {
          console.error("Version upload failed:", err);
          setMessage("Entry created, but version upload failed.");
        }
      }

      // reset form state
      e.target.reset();
      setSelectedCountry(null);
      setSelectedRegion(null);
      setDtsNumber("");
      setDocumentType("");
      setDtsStatus(""); 
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
      setSource("");
      setDtsStatus("");
      setDatePupSigned("");
      setDateUlcoApproved("");
      setRemarks("");
      setPointPersons([{ name: "", position: "", email: "" }]);
      setContacts([{ name: "", position: "", email: "" }]);
      setVersionComment("");
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

  const [relatedAgreements, setRelatedAgreements] = useState([]);
  const [selectedRelatedAgreement, setSelectedRelatedAgreement] = useState(null);

  // Fetch related agreements based on documentType
useEffect(() => {
  const fetchRelated = async () => {
    if (!documentType) {
      setRelatedAgreements([]);
      setSelectedRelatedAgreement(null);
      return;
    }
    try {
      // Opposite type
      const typeToFetch = documentType === "MOA" ? "MOU" : "MOA";
      // Fetch all agreements of the opposite type
      const agreements = await agreementService.getAgreements({
        document_type: typeToFetch
      });
      // Filter out Withdrawn
      const filtered = agreements.filter(
        a => a.document_type === typeToFetch && a.agreement_status !== "Withdrawn"
      );
      const options = filtered.map(a => ({
        value: a.agreement_id,
        label: a.dts_number,
        dts_number: a.dts_number
      }));
      options.unshift({ value: "NA", label: "N/A" });
      setRelatedAgreements(options);
      setSelectedRelatedAgreement(options[0]);
    } catch (err) {
      setRelatedAgreements([{ value: "NA", label: "N/A" }]);
      setSelectedRelatedAgreement({ value: "NA", label: "N/A" });
    }
  };
  fetchRelated();
}, [documentType]);

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
        <h2 className="form-title">Extracted Entry Form</h2>
        {message && (
          <div
            style={{
              padding: "10px",
              margin: "10px 0",
              backgroundColor: message.includes("Error")
                ? "#ffebee"
                : "#e8f5e8"
            }}
          >
            {message}
          </div>
        )}
        <form className="manual-entry-form" onSubmit={handleSubmit}>

          {/* DISPLAY UPLOADED FILE */}
            <div className="form-group">
              <label>Uploaded File:</label>
              <input
                type="text"
                value={uploadedFile ? uploadedFile.name : "No file uploaded"}
                readOnly
              />
            </div>

          {/* VERSION COMMENTS */}
          <div className="form-group full-width">
            <label>File Comments:</label>
            <textarea 
              value={versionComment}
              onChange={(e) => setVersionComment(e.target.value)}
            />
          </div>

          {/* Document Type */}
          <div className="form-group">
          <label htmlFor="docType">Document Type:*</label>
          <select
            id="docType"
            name="docType"
            required
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="" disabled>
              Select Document Type
            </option>
            <option value="MOA">MOA</option>
            <option value="MOU">MOU</option>
          </select>
          </div>

          {/* Related MOU/MOA */}
          <div className="form-group">
            <label htmlFor="relatedAgreement">
              {documentType === "MOA"
                ? "Related MOU"
                : documentType === "MOU"
                ? "Related MOA"
                : "Related MOU/MOA"}
              :
            </label>
            <Select
              id="relatedAgreement"
              name="relatedAgreement"
              options={relatedAgreements}
              value={selectedRelatedAgreement}
              onChange={setSelectedRelatedAgreement}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Related Agreement"
              isDisabled={!documentType}
            />
          </div>

          {/* AGREEMENT STATUS */}
          <div className="form-group">
          <label htmlFor="status">Agreement Status:*</label>
          <select id="status" name="status" required>
            <option value="">Select Status</option>
            <option value="InitialReview">Initial Review</option>
            <option value="Endorse">Endorse to ULCO for Review and Approval</option>
            <option value="Revert">Revert To Initiator with Comments</option>
            <option value="Consultation">For Consultation</option>
            <option value="Replication">Replication of Copies (8 sets)</option>
            <option value="SignituresPUP">For Signatures of PUP Officials</option>
            <option value="SignedPUP">Signed by PUP Officials</option>
            <option value="SignituresPartner">For Signatures of Partner</option>
            <option value="SignedPartner">Signed by Partner Institution</option>
            <option value="Complete">Completely Signed</option>
            <option value="Notary">For Notary</option>
            <option value="FFUPCopy">FFUP Copy From College/Campus</option>
            <option value="Active">Active</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
          </div>

          {/* AGREEMENT ENTRY TYPE */}
          <div className="form-group">
          <label htmlFor="entryType">Agreement Entry Type:*</label>
          <select id="entryType" name="entryType" required>
            <option value="">Select Entry Type</option>
            <option value="Renewal">Renewal</option>
            <option value="New">New</option>
            <option value="Other">Other</option>
          </select>
          </div>

          {/* RENEWED AGREEMENT */}
          <div className="form-group">
            <label htmlFor="renewedFrom">Renewed Agreement from (DTS Number Format):</label>
            <input id="renewedFrom" name="renewedFrom" type="text" />
          </div>
            
          {/* VALIDITY PERIOD*/}
          <div className="form-group">
          <label htmlFor="validity">Validity Period:</label>
          <select
            id="validity"
            name="validity"
            value={validityPeriod}
            onChange={(e) => setValidityPeriod(e.target.value)}
          >
            <option value="">Select Period</option>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
          </div>

          {/* DTS No. */}
          <div className="form-group">
          <label htmlFor="dtsNo">DTS No.:*</label>
          <input
            id="dtsNo"
            name="dtsNo"
            type="text"
            required
            value={dtsNumber}
            onChange={(e) => setDtsNumber(e.target.value) }
            placeholder="DT2025123456"
          />
          </div>

          {/* DTS STATUS */}
          <div className="form-group">
            <label htmlFor="dtsStatus">DTS Status:*</label>
            <select 
              id="dtsStatus" 
              name="dtsStatus" 
              value={dtsStatus}
              onChange={(e) => setDtsStatus(e.target.value)}
              required
            >
              <option value="">Select Status</option>
              <option value="Open - OIA">OPEN</option>
              <option value="Open - Other Office">CLOSE</option>
            </select>
          </div>

          {/* SOURCE UNIT */}
          <div className="form-group">
            <label htmlFor="source">Source (Campus/College Dept):*</label>
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
          <div className="form-group">
            <label htmlFor="partnershipType">Partnership Type:*</label>
            <Select
              options={partnershipTypeOptions}
              name="partnershipType"
              id="partnershipType"
              required
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select Partnership Type"
              value={partnershipTypeOptions.find(o => o.value === partnershipType) || null}
              onChange={(opt) => setPartnershipType(opt?.value || "")}
            />
          </div>

          {/* Partner Entry Type */}
          <div className="form-group">
            <label htmlFor="partnerEntryType">Partner Entry Type:*</label>
            <select
              id="partnerEntryType"
              value={partnerEntryType}
              onChange={(e) => handlePartnerEntryTypeChange(e.target.value)}
            >
              <option value="New">New</option>
              <option value="Existing">Existing</option>
            </select>
          </div>

          {/* Partner Fields */}
          <div className="form-group">
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

          <div className="form-group">
            <label>Entity Type:*</label>
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

          <div className="form-group">
            <label>Country:*</label>
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
              <input type="text" value={selectedCountry?.label || ""} readOnly />
            )}
          </div>

          <div className="form-group">
            <label>Region:*</label>
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
              <input type="text" value={selectedRegion?.label || ""} readOnly />
            )}
          </div>

          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              value={partnerData.address}
              onChange={(e) =>
                setPartnerData({ ...partnerData, address: e.target.value })
              }
              readOnly={partnerEntryType === "Existing"}
            />
          </div>

          <div className="form-group">
            <label>Logo:</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {partnerData.logo && typeof partnerData.logo === "string" && (
                <img
                  src={`data:image/png;base64,${partnerData.logo}`}
                  alt="Partner Logo"
                  style={{ width: "120px", height: "120px", objectFit: "contain", border: "1px solid #ccc" }}
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
          
          <div className="form-group">
            <label>Website:</label>
            <input
              type="url"
              value={partnerData.website}
              onChange={(e) =>
                setPartnerData({ ...partnerData, website: e.target.value })
              }
              readOnly={partnerEntryType === "Existing"}
            />
          </div>

          <div className="form-group full-width">
            <label>Partner Description:</label>
            <textarea
              value={partnerData.description}
              onChange={(e) =>
                setPartnerData({ ...partnerData, description: e.target.value })
              }
              readOnly={partnerEntryType === "Existing"}
            />
          </div>

          {/* SIGNATORIES */}
          <div className="form-group full-width">
          <label htmlFor="signatories">Signatories:</label>
          <input id="signatories" name="signatories" type="text" />
          </div>

          {/* POINT PERSON */}
          <div className="form-section">
            <label>Point Persons</label>
            {pointPersons.map((pp, index) => (
              <div key={index} className="contact-row">
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
                  className="remove-btn"
                  onClick={() => removePointPerson(index)}
                >
                  ❌
                </button>
              </div>
            ))}

            <button
              type="button"
              className="add-contact-btn"
              onClick={addPointPerson}
            >
              ➕ Add Point Person
            </button>
          </div>

           {/* CONTACT PERSON */}
            <div className="form-section">
              <label>Contact Person</label>
              {contacts.map((contact, index) => (
                <div key={index} className="contact-row">
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
                    className="remove-btn"
                    onClick={() => removeContact(index)}
                  >
                    ❌
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-contact-btn"
                onClick={addContact}
              >
                ➕ Add Contact
              </button>
            </div>

          
          {/* DATE RECEIVED */}
          <div className="form-group">
          <label htmlFor="dateReceived">Date Received:*</label>
          <input id="dateReceived" name="dateReceived" type="date" required />
          </div>

          {/* DATE EXPIRY */}
          <div className="form-group">
          <label htmlFor="dateExpiry">Date Expiry:</label>
          <input
            id="dateExpiry"
            name="dateExpiry"
            type="date"
            value={dateExpiry}
            onChange={(e) => setDateExpiry(e.target.value)}
            required
          />
          </div>

          {/* DATE PUP SIGNED */}
          <div className="form-group">
          <label htmlFor="datePupSigned">Date PUP Signed:</label>
          <input 
            id="datePupSigned" 
            name="datePupSigned" 
            type="date" 
            value={datePupSigned}
            onChange={(e) => setDatePupSigned(e.target.value)}
          />
          </div>

           {/* DATE SIGNED */}
          <div className="form-group">
          <label htmlFor="dateSigned">Date/Year of Signing:</label>
          <input
            id="dateSigned"
            name="dateSigned"
            type="date"
            value={dateSigned}
            onChange={(e) => setDateSigned(e.target.value)}
          />
          </div>

          {/* DATE ENDORSED */}
          <div className="form-group">
          <label htmlFor="dateEndorsed">Date Endorsed to ULCO:</label>
          <input id="dateEndorsed" name="dateEndorsed" type="date" />
          </div>

          {/* DATE ULCO APPROVED */}
          <div className="form-group">
          <label htmlFor="dateUlcoApproved">Date ULCO Approved:</label>
          <input 
            id="dateUlcoApproved" 
            name="dateUlcoApproved" 
            type="date" 
            value={dateUlcoApproved}
            onChange={(e) => setDateUlcoApproved(e.target.value)}
          />
          </div>

          {/* HARDCOPY LOCATOR */}
          <div className="form-group full-width">
          <label htmlFor="locator">Hardcopy Locator:</label>
          <input id="locator" name="locator" type="text" />
          </div>

          {/* EVENT INFO */}
          <div className="form-group full-width">
          <label htmlFor="eventInfo">Event Info:</label>
          <textarea
            id="eventInfo"
            name="eventInfo"
            defaultValue={extractedMetadata?.event_info || ""}
          />
          </div>  

          {/* REMARKS */}
          <div className="form-group full-width">
          <label htmlFor="remarks">Remarks:</label>
          <textarea 
            id="remarks" 
            name="remarks" 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          </div>

          <div className="form-actions">
            <button type="submit" className="publish-button" disabled={loading}>
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
