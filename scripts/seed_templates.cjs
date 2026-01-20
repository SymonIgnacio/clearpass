const fs = require("fs");
const path = require("path");
// Load environment variables from server directory
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

const knexConfig =
  require("../server/knexfile")[process.env.NODE_ENV || "development"];
const knex = require("knex")(knexConfig);
// Try to require pizzip from root or server
let PizZip;
try {
  PizZip = require("pizzip");
} catch (e) {
  PizZip = require("../server/node_modules/pizzip");
}

const TEMPLATE_DIR = path.join(__dirname, "../Certificate Templates");

const FILE_MAPPING = {
  barangay_clearance: "1 bgy clearance.docx",
  bonafide_certificate: "1 bonafide blank.docx",
  building_permit: "1 building blank.docx",
  business_closure: "1 closed biz blank.docx",
  cohabitation_certificate: "1 cohabitation blank.docx",
  excavation_permit: "1 excavation blank.docx",
  fencing_permit: "1 fencing blank.docx",
  good_moral_certificate: "good moral_1.docx",
  indigency_certificate: "CUSTOM INDIGENCY_1.docx",
  late_registration: "1 late registration.docx",
  ojt_certification: "certification OJT.docx",
  low_income_housing: "low income HOUSING 2 (Repaired).docx",
  medico_legal: "MEDICO-LEGAL CERTIFICATE.docx",
};

const SYSTEM_FIELDS = [
  "resident_name",
  "first_name",
  "last_name",
  "middle_name",
  "address",
  "age",
  "civil_status",
  "gender",
  "place_of_birth",
  "date_of_birth",
  "control_number",
  "date_issued",
  "valid_until",
  "captain_name",
  "secretary_name",
  "issued_on",
  "issued_at",
  "municipality_name",
  "province_name",
  "barangay_name",
];

const extractPlaceholders = (buffer) => {
  try {
    const zip = new PizZip(buffer);
    const contentXml = zip.files["word/document.xml"].asText();
    const plainText = contentXml.replace(/<[^>]+>/g, "");
    const matches = plainText.match(/\{[^}]+\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
  } catch (e) {
    console.error("Error extracting placeholders:", e.message);
    return [];
  }
};

const seedTemplates = async () => {
  console.log("Seeding templates...");

  try {
    await knex.raw("SET GLOBAL max_allowed_packet=67108864"); // 64MB
    console.log("Increased max_allowed_packet to 64MB");
  } catch (e) {
    console.warn(
      "Could not set max_allowed_packet (might need root privileges):",
      e.message,
    );
  }

  for (const [type, filename] of Object.entries(FILE_MAPPING)) {
    const filePath = path.join(TEMPLATE_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filename}`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const placeholders = extractPlaceholders(buffer);

    const requiredFields = placeholders
      .filter((ph) => !SYSTEM_FIELDS.includes(ph))
      .map((ph) => ({
        key: ph,
        label: ph.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        type: "text",
        required: true,
      }));

    console.log(
      `Processing ${type}: found ${requiredFields.length} user fields. File size: ${buffer.length} bytes`,
    );

    const existing = await knex("document_templates")
      .where("document_type", type)
      .first();

    const templateData = {
      template_name: type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      display_name: type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      document_type: type,
      file_data: buffer,
      file_encoding:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      is_active: true,
      is_custom: false,
      required_fields: JSON.stringify(requiredFields),
      updated_at: knex.fn.now(),
    };

    try {
      if (existing) {
        await knex("document_templates")
          .where("id", existing.id)
          .update(templateData);
        console.log(`Updated ${type}`);
      } else {
        await knex("document_templates").insert(templateData);
        console.log(`Inserted ${type}`);
      }
    } catch (dbError) {
      console.error(`Failed to save ${type}:`, dbError.message);
    }
  }

  console.log("Seeding complete.");
  await knex.destroy(); // Ensure connection is closed
  process.exit(0);
};

seedTemplates().catch((err) => {
  console.error(err);
  process.exit(1);
});
