import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Database configuration - hardcoded for simplicity
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // XAMPP default
  database: 'barangay_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const sitios = ['Batia Proper', 'Northville 5', 'St. Martha', 'AFP/PNP'];
const incidentTypes = [
  'Physical Injury', 'Unjust Vexation', 'Grave Threats', 'Alarming and Scandal',
  'Theft (Petty)', 'Malicious Mischief', 'Estafa (Swindling)', 'Trespassing',
  'Curfew Violation', 'Noise Barrage', 'Waste Management', 'Stray Animals',
  'Collection of Sum of Money', 'Ejectment', 'Boundary Dispute', 'Family Dispute'
];

const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Jose', 'Rosa', 'Miguel', 'Elena', 'Carlos', 'Sofia'];
const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Martinez', 'Lopez', 'Torres', 'Rodriguez', 'Ramirez', 'Gonzalez'];

function generateRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateCaseNumber(index) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sequence = String(index + 1).padStart(4, '0');
  return `BLOT-${year}-${month}-${sequence}`;
}

function generateResidentId() {
  return `RES-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

function generateCertificateNumber(index) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sequence = String(index + 1).padStart(4, '0');
  return `CERT-${year}-${month}-${sequence}`;
}

// Generate realistic blotter data for AI patrol suggestions
async function generateBlotterData() {
  console.log('🔄 Generating comprehensive blotter data for AI training...');

  const blotterData = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date();

  // Generate 500 blotter records over the past year for better AI training
  for (let i = 0; i < 500; i++) {
    const incidentDate = generateRandomDate(startDate, endDate);
    const sitio = sitios[Math.floor(Math.random() * sitios.length)];
    const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];

    // Generate realistic complainant details
    const complainantDetails = {
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      address: `Block ${Math.floor(Math.random() * 20) + 1}, Lot ${Math.floor(Math.random() * 50) + 1}, ${sitio}`,
      contact: `09${Math.floor(Math.random() * 900000000) + 100000000}`,
      age: Math.floor(Math.random() * 60) + 18
    };

    // Sometimes add respondent details (70% chance)
    let respondentDetails = null;
    if (Math.random() > 0.3) {
      respondentDetails = {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        address: `Block ${Math.floor(Math.random() * 20) + 1}, Lot ${Math.floor(Math.random() * 50) + 1}, ${sitios[Math.floor(Math.random() * sitios.length)]}`,
        contact: `09${Math.floor(Math.random() * 900000000) + 100000000}`,
        age: Math.floor(Math.random() * 60) + 18
      };
    }

    // Generate detailed narrative based on incident type
    const narratives = {
      'Physical Injury': [
        'Complainant was physically assaulted during an argument over parking space',
        'Respondent punched complainant in the face during a heated discussion',
        'Victim suffered bruises and lacerations from physical altercation',
        'Complainant was slapped and pushed by respondent without provocation'
      ],
      'Unjust Vexation': [
        'Respondent continuously harasses complainant with threatening phone calls',
        'Neighbor repeatedly insults and threatens complainant daily',
        'Respondent spreads false rumors and gossips about complainant',
        'Continuous verbal abuse and intimidation through social media'
      ],
      'Theft (Petty)': [
        'Personal belongings stolen from unlocked motorcycle',
        'Wallet containing cash and IDs taken from unattended bag',
        'Mobile phone snatched while complainant was walking',
        'Personal items stolen from complainant\'s residence'
      ],
      'Noise Barrage': [
        'Loud music from neighbor\'s house disturbing peace until midnight',
        'Construction work causing excessive noise during prohibited hours',
        'Partying and loud celebration keeping residents awake',
        'Motorcycle with loud exhaust disturbing neighborhood peace'
      ],
      'Family Dispute': [
        'Domestic dispute between husband and wife over financial matters',
        'Parent-child conflict over curfew and household rules',
        'Sibling dispute over inheritance and property division',
        'Extended family conflict over living arrangements'
      ],
      'Grave Threats': [
        'Respondent threatened to kill complainant during a heated argument',
        'Death threats sent via text message to the complainant',
        'Respondent brandished a bladed weapon while shouting threats',
        'Verbal threats of physical harm made in front of witnesses'
      ],
      'Alarming and Scandal': [
        'Drunken behavior causing public disturbance in the neighborhood',
        'Shouting matches in the street late at night disturbing residents',
        'Respondent creating a scene at the barangay hall',
        'Public intoxication and disorderly conduct reported'
      ],
      'Malicious Mischief': [
        'Car tires slashed by respondent while parked',
        'Vandalism on complainant\'s perimeter wall',
        'Respondent threw stones at complainant\'s window causing breakage',
        'Deliberate damage to complainant\'s garden and plants'
      ],
      'Estafa (Swindling)': [
        'Failure to pay debt after repeated demands and promises',
        'Complainant was scammed in an online transaction by respondent',
        'Issuance of bounced check for payment of goods',
        'Failure to deliver paid items in a buy-and-sell transaction'
      ],
      'Trespassing': [
        'Respondent entered complainant\'s yard without permission',
        'Squatting on private property despite warnings',
        'Refusal to leave premises after being asked by the owner',
        'Unauthorize entry into a fenced property'
      ],
      'Curfew Violation': [
        'Minors caught roaming streets past 10 PM curfew',
        'Drinking in public places during curfew hours',
        'Group of teenagers loitering in the park after curfew',
        'Violation of barangay curfew ordinance by minors'
      ],
      'Waste Management': [
        'Burning of garbage in the backyard causing smoke',
        'Throwing trash in the river/creek',
        'Failure to segregate waste as required by ordinance',
        'Dumping of construction debris in public area'
      ],
      'Stray Animals': [
        'Dog roaming freely and chasing passersby',
        'Stray cats causing mess in neighbor\'s property',
        'Unleashed dog defecating in public spaces',
        'Chicken/Rooster noise and smell complaint'
      ]
    };

    const defaultNarratives = [
      `Incident involving ${incidentType.toLowerCase()} reported by complainant`,
      `Complainant seeks assistance regarding ${incidentType.toLowerCase()}`,
      `Disturbance of peace involving ${incidentType.toLowerCase()}`,
      `Immediate intervention requested for ${incidentType.toLowerCase()} incident`
    ];

    const typeNarratives = narratives[incidentType] || defaultNarratives;
    const narrative = typeNarratives[Math.floor(Math.random() * typeNarratives.length)];

    // Status distribution: more recent cases are pending, older ones resolved
    const daysOld = (new Date() - incidentDate) / (1000 * 60 * 60 * 24);
    let status;
    if (daysOld < 7) {
      status = Math.random() > 0.2 ? 'Pending' : 'Ongoing'; // 80% pending for recent cases
    } else if (daysOld < 30) {
      status = Math.random() > 0.5 ? 'Ongoing' : 'Pending'; // Mix for month-old cases
    } else {
      status = Math.random() > 0.3 ? 'Resolved' : 'Dismissed'; // Mostly resolved for old cases
    }

    blotterData.push({
      case_number: generateCaseNumber(i),
      complainant_details: JSON.stringify(complainantDetails),
      respondent_details: respondentDetails ? JSON.stringify(respondentDetails) : null,
      incident_type: incidentType,
      narrative: narrative,
      date_time_incident: incidentDate.toISOString().slice(0, 19).replace('T', ' '),
      location_sitio: sitio,
      status: status,
      created_at: incidentDate.toISOString().slice(0, 19).replace('T', ' ')
    });
  }

  return blotterData;
}

// Generate resident data for analytics
async function generateResidentData(db) {
  console.log('🏠 Generating resident data for analytics...');

  const residents = [];

  // Generate 200 residents across different sitios
  for (let i = 0; i < 200; i++) {
    const sitio = sitios[Math.floor(Math.random() * sitios.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const birthdate = generateRandomDate(new Date('1950-01-01'), new Date('2005-01-01'));
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';

    // Create household if needed
    const householdId = `H-${Date.now()}-${i}`;

    const resident = {
      resident_id: generateResidentId(),
      household_id: householdId,
      first_name: firstName,
      last_name: lastName,
      birthdate: birthdate.toISOString().split('T')[0],
      gender: gender,
      civil_status: ['Single', 'Married', 'Widowed', 'Separated'][Math.floor(Math.random() * 4)],
      mobile_number: `09${Math.floor(Math.random() * 900000000) + 100000000}`,
      residency_status: 'Active',
      sitio: sitio
    };

    residents.push(resident);
  }

  // Insert residents in batches
  for (let i = 0; i < residents.length; i += 50) {
    const batch = residents.slice(i, i + 50);
    const values = batch.map(r => [
      r.resident_id, r.household_id, r.first_name, r.last_name, r.birthdate,
      r.gender, r.civil_status, r.mobile_number, r.residency_status
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');

    try {
      await db.execute(`
        INSERT INTO residents (
          Resident_ID, Household_ID, First_Name, Last_Name, Birthdate,
          Gender, Civil_Status, Mobile_Number, Residency_Status
        ) VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
          First_Name = VALUES(First_Name),
          Last_Name = VALUES(Last_Name)
      `, values.flat());
    } catch (error) {
      console.error('Error inserting resident batch:', error.message);
    }
  }

  console.log(`✅ Inserted ${residents.length} residents`);
  return residents;
}

// Generate certificate requests for analytics
async function generateCertificateData(db) {
  console.log('📄 Generating certificate request data...');

  const certificates = [];

  // Get existing residents
  const [residents] = await db.execute('SELECT Resident_ID FROM residents LIMIT 100');

  if (residents.length === 0) {
    console.log('⚠️ No residents found, skipping certificate generation');
    return;
  }

  const certificateTypes = ['Barangay Clearance', 'Certificate of Indigency', 'Business Permit', 'Good Moral'];

  for (let i = 0; i < 150; i++) {
    const residentId = residents[Math.floor(Math.random() * residents.length)].Resident_ID;
    const certType = certificateTypes[Math.floor(Math.random() * certificateTypes.length)];
    const issueDate = generateRandomDate(new Date('2024-01-01'), new Date());
    const status = Math.random() > 0.2 ? 'Released' : 'Pending';

    certificates.push({
      control_no: generateCertificateNumber(i),
      resident_id: residentId,
      certificate_type: certType,
      purpose: 'General requirement',
      date_issued: issueDate.toISOString().split('T')[0],
      status: status
    });
  }

  for (const cert of certificates) {
    try {
      await db.execute(`
        INSERT INTO certificates_log (
          control_no, resident_id, certificate_type, purpose, date_issued, status
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status)
      `, [
        cert.control_no, cert.resident_id, cert.certificate_type,
        cert.purpose, cert.date_issued, cert.status
      ]);
    } catch (error) {
      console.error('Error inserting certificate:', error.message);
    }
  }

  console.log(`✅ Inserted ${certificates.length} certificate records`);
}

// Generate community programs data
async function generateCommunityPrograms(db) {
  console.log('🎪 Generating community programs data...');

  const programs = [];
  const programTypes = ['Health Program', 'Educational Seminar', 'Sports Activity', 'Environmental Cleanup', 'Senior Citizen Program'];

  for (let i = 0; i < 20; i++) {
    const programDate = new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000); // Next 60 days
    const sitio = sitios[Math.floor(Math.random() * sitios.length)];
    const programType = programTypes[Math.floor(Math.random() * programTypes.length)];

    programs.push({
      program_name: `${programType} - ${sitio}`,
      description: `Community ${programType.toLowerCase()} for residents of ${sitio}`,
      program_date: programDate.toISOString().split('T')[0],
      sitio_id: sitio,
      status: Math.random() > 0.3 ? 'Planned' : 'Completed',
      organizer: 'Barangay Council',
      budget_allocated: Math.floor(Math.random() * 10000) + 1000,
      participants_count: Math.floor(Math.random() * 50) + 10
    });
  }

  for (const program of programs) {
    try {
      await db.execute(`
        INSERT INTO community_programs (
          program_name, description, program_date, sitio_id, status,
          organizer, budget_allocated, participants_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        program.program_name, program.description, program.program_date,
        program.sitio_id, program.status, program.organizer,
        program.budget_allocated, program.participants_count
      ]);
    } catch (error) {
      console.error('Error inserting community program:', error.message);
    }
  }

  console.log(`✅ Inserted ${programs.length} community programs`);
}

// Enhanced chatbot data generation
async function generateChatbotData(db) {
  console.log('🤖 Generating enhanced chatbot conversation data...');

  const conversations = [];
  const intents = ['certificate_inquiry', 'appointment_request', 'blotter_inquiry', 'general_inquiry', 'faq', 'complaint'];

  const messageTemplates = {
    certificate_inquiry: [
      'I need a barangay clearance certificate',
      'How do I get a certificate of indigency?',
      'Can you help me with a business permit?',
      'What documents do I need for a certificate?'
    ],
    appointment_request: [
      'I want to schedule an appointment',
      'Can I make an appointment for tomorrow?',
      'What time can I come to the office?',
      'I need to speak with the barangay captain'
    ],
    blotter_inquiry: [
      'I want to file a blotter report',
      'Someone stole my property, what should I do?',
      'How do I report a crime?',
      'I need to file a complaint'
    ],
    general_inquiry: [
      'What services do you offer?',
      'How can you help me?',
      'What is the barangay office address?',
      'Who can I contact for assistance?'
    ],
    faq: [
      'What are your office hours?',
      'How much do certificates cost?',
      'Do you have online services?',
      'What is the barangay website?'
    ],
    complaint: [
      'There is too much noise in my area',
      'Illegal dumping in the streets',
      'Street lights are not working',
      'Neighbor is causing disturbance'
    ]
  };

  const responseTemplates = {
    certificate_inquiry: [
      'I can help you with certificate requests. You\'ll need valid ID and proof of residency.',
      'For certificates, please bring your cedula and barangay clearance fee.',
      'Certificate applications require ID verification and proper documentation.'
    ],
    appointment_request: [
      'I can help schedule your appointment. What type of service do you need?',
      'Please specify the date and purpose of your visit for appointment scheduling.',
      'Appointments are available Monday-Friday. What time works best for you?'
    ],
    blotter_inquiry: [
      'For blotter reports, please come to the office with your valid ID and any evidence.',
      'I can assist you with filing a blotter. Please provide incident details.',
      'Blotter reports require complainant details and incident description.'
    ],
    general_inquiry: [
      'We offer certificate issuance, blotter filing, community programs, and resident services.',
      'Our barangay office provides various services including certificates, permits, and complaints.',
      'You can contact us for certificates, appointments, and community assistance.'
    ],
    faq: [
      'Office hours are Monday-Friday 8AM-5PM, Saturday 8AM-12NN.',
      'Certificate fees vary by type. Please check with our office for current rates.',
      'We offer both online and in-person services for your convenience.'
    ],
    complaint: [
      'We take community complaints seriously. Please provide specific details.',
      'Your complaint will be addressed promptly. Thank you for reporting.',
      'We appreciate residents reporting issues for community improvement.'
    ]
  };

  for (let i = 0; i < 200; i++) {
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const sessionId = `session_${Date.now()}_${i}`;

    const userMessage = messageTemplates[intent][Math.floor(Math.random() * messageTemplates[intent].length)];
    const botResponse = responseTemplates[intent][Math.floor(Math.random() * responseTemplates[intent].length)];

    conversations.push({
      session_id: sessionId,
      user_message: userMessage,
      bot_response: botResponse,
      intent_detected: intent,
      confidence_score: Math.random() * 0.4 + 0.6, // 0.6-1.0 for better confidence
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
    });
  }

  for (const conv of conversations) {
    try {
      await db.execute(`
        INSERT INTO ai_chatbot_conversations (
          session_id, user_message, bot_response, intent_detected, confidence_score, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        conv.session_id, conv.user_message, conv.bot_response,
        conv.intent_detected, conv.confidence_score, conv.created_at
      ]);
    } catch (error) {
      console.error('Error inserting chatbot conversation:', error.message);
    }
  }

  console.log(`✅ Inserted ${conversations.length} chatbot conversations`);
}

async function runComprehensiveDataGeneration() {
  let db;

  try {
    console.log('🚀 Starting comprehensive AI data generation...');
    console.log('=' .repeat(50));

    db = await mysql.createPool(dbConfig);

    // 1. Generate blotter data (foundation for patrol suggestions)
    console.log('\n📊 PHASE 1: Generating blotter records for AI patrol suggestions...');
    const [existingBlotter] = await db.execute('SELECT COUNT(*) as count FROM blotter');
    console.log(`Existing blotter records: ${existingBlotter[0].count}`);

    // Always generate more data to improve accuracy
    // if (existingBlotter[0].count < 100) {
      const blotterData = await generateBlotterData();
      console.log(`Generated ${blotterData.length} blotter records`);

      for (const record of blotterData) {
        try {
          await db.execute(`
            INSERT INTO blotter (
              Case_Number, Complainant_Details, Respondent_Details, Incident_Type,
              Narrative, DateTime_Incident, Location_Sitio, Status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              Status = VALUES(Status)
          `, [
            record.case_number, record.complainant_details, record.respondent_details,
            record.incident_type, record.narrative, record.date_time_incident,
            record.location_sitio, record.status, record.created_at
          ]);
        } catch (error) {
          console.error(`Error inserting blotter ${record.case_number}:`, error.message);
        }
      }
      console.log('✅ Blotter data inserted successfully');
    // } else {
    //   console.log('ℹ️ Sufficient blotter data exists');
    // }

    // 2. Generate resident data for analytics
    console.log('\n👥 PHASE 2: Generating resident data for analytics...');
    const [existingResidents] = await db.execute('SELECT COUNT(*) as count FROM residents');
    console.log(`Existing residents: ${existingResidents[0].count}`);

    if (existingResidents[0].count < 50) {
      await generateResidentData(db);
    } else {
      console.log('ℹ️ Sufficient resident data exists');
    }

    // 3. Generate certificate data
    console.log('\n📄 PHASE 3: Generating certificate request data...');
    const [existingCertificates] = await db.execute('SELECT COUNT(*) as count FROM certificates_log');
    console.log(`Existing certificates: ${existingCertificates[0].count}`);

    if (existingCertificates[0].count < 50) {
      await generateCertificateData(db);
    } else {
      console.log('ℹ️ Sufficient certificate data exists');
    }

    // 4. Generate community programs
    console.log('\n🎪 PHASE 4: Generating community programs data...');
    const [existingPrograms] = await db.execute('SELECT COUNT(*) as count FROM community_programs');
    console.log(`Existing programs: ${existingPrograms[0].count}`);

    if (existingPrograms[0].count < 10) {
      await generateCommunityPrograms(db);
    } else {
      console.log('ℹ️ Sufficient program data exists');
    }

    // 5. Generate enhanced chatbot data
    console.log('\n🤖 PHASE 5: Generating enhanced chatbot conversation data...');
    try {
      const [existingChatbot] = await db.execute('SELECT COUNT(*) as count FROM ai_chatbot_conversations');
      console.log(`Existing chatbot conversations: ${existingChatbot[0].count}`);

      if (existingChatbot[0].count < 50) {
        await generateChatbotData(db);
      } else {
        console.log('ℹ️ Sufficient chatbot data exists');
      }
    } catch (error) {
      console.log('⚠️ AI chatbot tables not found, skipping chatbot data generation');
    }

    console.log('\n🎉 COMPREHENSIVE AI DATA GENERATION COMPLETED!');
    console.log('=' .repeat(50));
    console.log('📊 Data Summary:');
    console.log('- Blotter records for patrol AI');
    console.log('- Resident data for analytics');
    console.log('- Certificate requests');
    console.log('- Community programs');
    console.log('- Chatbot conversations');
    console.log('');
    console.log('🤖 Your AI Hub should now show real data instead of samples!');
    console.log('🔄 Refresh your browser to see the updated AI dashboard');

  } catch (error) {
    console.error('❌ Error during comprehensive data generation:', error);
    console.error(error.stack);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the comprehensive data generation
runComprehensiveDataGeneration().catch(console.error);
