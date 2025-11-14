
import jsPDF from 'jspdf';

// A helper function to add a header to the PDF
const addHeader = (doc, barangayName) => {
  // doc.addImage(logo, 'PNG', 10, 10, 20, 20); // Add your logo here
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Republic of the Philippines`, 105, 20, null, null, 'center');
  doc.text(`Province of [Your Province]`, 105, 30, null, null, 'center');
  doc.text(`Municipality of [Your Municipality]`, 105, 40, null, null, 'center');
  doc.setFontSize(18);
  doc.text(`Barangay ${barangayName}`, 105, 50, null, null, 'center');
  doc.setLineWidth(0.5);
  doc.line(10, 60, 200, 60);
};

// A helper function to add a footer
const addFooter = (doc, captainName) => {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('______________________', 40, 250);
  doc.text(`${captainName}`, 45, 260);
  doc.setFont('helvetica', 'bold');
  doc.text('Punong Barangay', 48, 265);
};

const getCurrentDate = () => new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

export const generateIndigencyCertificate = (data, barangayName, captainName) => {
  const doc = new jsPDF();
  addHeader(doc, barangayName);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF INDIGENCY', 105, 80, null, null, 'center');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('TO WHOM IT MAY CONCERN:', 15, 100);
  const body = `This is to certify that ${data.fullName}, of legal age, a resident of ${data.address}, is one of the indigents in our barangay.\n\nThis certification is issued upon the request of the above-named person for ${data.purpose}.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
  doc.text(body, 15, 120, { maxWidth: 180, align: 'justify' });
  addFooter(doc, captainName);
  doc.save(`Indigency_Certificate_${data.fullName}.pdf`);
};

export const generateResidencyCertificate = (data, barangayName, captainName) => {
  const doc = new jsPDF();
  addHeader(doc, barangayName);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF RESIDENCY', 105, 80, null, null, 'center');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('TO WHOM IT MAY CONCERN:', 15, 100);
  const body = `This is to certify that ${data.fullName}, a resident of ${data.address}, has been residing in this barangay since ${data.periodOfResidency}.\n\nThis certification is issued for ${data.purpose}.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
  doc.text(body, 15, 120, { maxWidth: 180, align: 'justify' });
  addFooter(doc, captainName);
  doc.save(`Residency_Certificate_${data.fullName}.pdf`);
};

export const generateBarangayCertification = (data, barangayName, captainName) => {
    const doc = new jsPDF();
    addHeader(doc, barangayName);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BARANGAY CERTIFICATION', 105, 80, null, null, 'center');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('TO WHOM IT MAY CONCERN:', 15, 100);
    const body = `This is to certify that ${data.fullName}, of ${data.address}, has been a resident of this barangay for ${data.lengthOfStay}.\n\nThis certification is issued for the purpose of ${data.purpose}.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
    doc.text(body, 15, 120, { maxWidth: 180, align: 'justify' });
    addFooter(doc, captainName);
    doc.save(`Barangay_Certification_${data.fullName}.pdf`);
};

export const generateBarangayClearance = (data, barangayName, captainName) => {
    const doc = new jsPDF();
    addHeader(doc, barangayName);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BARANGAY CLEARANCE', 105, 80, null, null, 'center');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('TO WHOM IT MAY CONCERN:', 15, 100);
    const body = `This is to certify that ${data.fullName}, born on ${data.dateOfBirth}, residing at ${data.address}, has no pending case filed against him/her in this barangay.\n\nThis clearance is issued for ${data.purpose}.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
    doc.text(body, 15, 120, { maxWidth: 180, align: 'justify' });
    addFooter(doc, captainName);
    doc.save(`Barangay_Clearance_${data.fullName}.pdf`);
};

export const generateBusinessClearance = (data, barangayName, captainName) => {
    const doc = new jsPDF();
    addHeader(doc, barangayName);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('BUSINESS CLEARANCE', 105, 80, null, null, 'center');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('TO WHOM IT MAY CONCERN:', 15, 100);
    const body = `This is to certify that the business "${data.businessName}", owned by ${data.ownerName} and located at ${data.businessAddress}, is hereby granted clearance to operate within this barangay.\n\nThis clearance is issued for the purpose of registering or renewing the business permit.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
    doc.text(body, 15, 120, { maxWidth: 180, align: 'justify' });
    addFooter(doc, captainName);
    doc.save(`Business_Clearance_${data.businessName}.pdf`);
};

export const generateOathOfUndertaking = (data, barangayName, captainName) => {
    const doc = new jsPDF();
    addHeader(doc, barangayName);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('OATH OF UNDERTAKING', 105, 80, null, null, 'center');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const body = `I, ${data.fullName}, of ${data.address}, do hereby solemnly swear and undertake the following:\n\n${data.statement}\n\nI am executing this affidavit to attest to the truth of the foregoing facts and for whatever legal purpose it may serve.\n\nIN WITNESS WHEREOF, I have hereunto set my hand this ${getCurrentDate()} at ${barangayName}.`;
    doc.text(body, 15, 100, { maxWidth: 180, align: 'justify' });
    addFooter(doc, captainName);
    doc.save(`Oath_Of_Undertaking_${data.fullName}.pdf`);
};

export const generateGoodMoral = (data, barangayName, captainName) => {
    const doc = new jsPDF();
    addHeader(doc, barangayName);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF GOOD MORAL CHARACTER', 105, 80, null, null, 'center');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('TO WHOM IT MAY CONCERN:', 15, 100);
    const body = `This is to certify that ${data.fullName}, born on ${data.dateOfBirth}, a resident of ${data.address}, is a person of good moral character and has no derogatory record in this barangay.\n\nThis certification is issued upon the request of the interested party for ${data.purpose}.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
    doc.text(body, 15, 120, { maxWidth: 180, align: 'justify' });
    addFooter(doc, captainName);
    doc.save(`Good_Moral_Certificate_${data.fullName}.pdf`);
};

export const generateLowIncomeCertificate = (data, barangayName, captainName) => {
    const doc = new jsPDF();
    addHeader(doc, barangayName);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF LOW INCOME', 105, 80, null, null, 'center');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('TO WHOM IT MAY CONCERN:', 15, 100);
    const body = `This is to certify that ${data.fullName}, of ${data.address}, belongs to a low-income family with an estimated monthly income of PHP ${data.monthlyIncome}.\n\nThis certification is issued upon the request of ${data.fullName} for ${data.purpose}.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
    doc.text(body, 15, 120, { maxWidth: 180, align: 'justify' });
    addFooter(doc, captainName);
    doc.save(`Low_Income_Certificate_${data.fullName}.pdf`);
};

export const generateBirthCertificate = (data, barangayName, captainName) => {
    const doc = new jsPDF();
    addHeader(doc, barangayName);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF LIVE BIRTH', 105, 80, null, null, 'center');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const body = `This is to certify the birth of ${data.childFullName}, born on ${data.dateOfBirth} at ${data.placeOfBirth}.\n\nParents: ${data.fatherFullName} and ${data.motherFullName}\nNationality: ${data.parentsNationality}\nAddress at time of birth: ${data.parentsAddress}\n\nThis certification is a true copy of the original record on file in this office.\n\nIssued this ${getCurrentDate()} at ${barangayName}.`;
    doc.text(body, 15, 100, { maxWidth: 180, align: 'justify' });
    addFooter(doc, captainName);
    doc.save(`Birth_Certificate_${data.childFullName}.pdf`);
};

