const mongoose = require('mongoose');
const dns = require('node:dns');

// Use Google public DNS so SRV lookups work even when the local
// router DNS does not support SRV records.
dns.setServers(['8.8.8.8', '8.8.4.4']);

let _memServer = null;

async function connectDB() {
  let uri = process.env.MONGODB_URI;

  // Try the configured URI first; fall back to in-memory if it fails
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected:', uri.split('@')[1] || uri);
    return;
  } catch (err) {
    console.warn('Remote MongoDB unavailable:', err.message);
    console.log('Starting in-memory MongoDB fallback...');
  }

  // In-memory fallback using mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    _memServer = await MongoMemoryServer.create();
    const memUri = _memServer.getUri();
    await mongoose.connect(memUri);
    console.log('✅ Using in-memory MongoDB (data resets on restart)');

    // Auto-seed when using in-memory DB
    await autoSeed();
  } catch (memErr) {
    console.error('In-memory MongoDB also failed:', memErr.message);
    process.exit(1);
  }
}

async function autoSeed() {
  try {
    const bcrypt = require('bcryptjs');
    const User = require('../models/User');
    const Scheme = require('../models/Scheme');
    const Campaign = require('../models/Campaign');

    // Admin user
    const adminHash = await bcrypt.hash('Admin@123', 12);
    await User.findOneAndUpdate(
      { email: 'admin@empowerher.org' },
      { name: 'Admin User', email: 'admin@empowerher.org', passwordHash: adminHash, role: 'admin' },
      { upsert: true, new: true }
    );

    // Donor user
    const donorHash = await bcrypt.hash('Donor@123', 12);
    await User.findOneAndUpdate(
      { email: 'donor@test.com' },
      { name: 'Test Donor', email: 'donor@test.com', passwordHash: donorHash, role: 'donor' },
      { upsert: true, new: true }
    );

    const allDistricts = ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Rewa','Satna','Chhindwara'];

    // SCH-014 Widow Pension
    await Scheme.findOneAndUpdate(
      { title_en: 'Widow Pension Scheme' },
      {
        title_hi: 'विधवा पेंशन योजना', title_en: 'Widow Pension Scheme',
        description_hi: 'मध्यप्रदेश सरकार की विधवा पेंशन योजना के अंतर्गत पात्र महिलाओं को ₹600 प्रति माह की आर्थिक सहायता दी जाती है।',
        description_en: 'Financial assistance of ₹600/month for eligible widows under MP state scheme.',
        aiDraft_hi: 'यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।', aiDraftApproved: false,
        need: 'pension', state: 'Madhya Pradesh', districts: allDistricts,
        eligibilityCriteria: [
          { field: 'maritalStatus', operator: 'eq', value: 'widowed' },
          { field: 'age', operator: 'gte', value: 18 },
          { field: 'age', operator: 'lte', value: 79 },
          { field: 'bplCard', operator: 'bool', value: true },
        ],
        benefits: '₹600 per month direct bank transfer',
        documents: ['Widow certificate', 'BPL card', 'Aadhaar card', 'Bank passbook'],
        applicationProcess: 'Apply at Janpad Panchayat office or online at mpedistrict.gov.in',
        officialUrl: 'https://mpedistrict.gov.in', lastCheckedAt: new Date('2026-09-12'),
        helpCentre: 'Janpad Panchayat Office, District Headquarters',
        status: 'published', updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // SCH-022 SHG Loan
    await Scheme.findOneAndUpdate(
      { title_en: 'SHG Loan Support Scheme' },
      {
        title_hi: 'SHG ऋण सहायता योजना', title_en: 'SHG Loan Support Scheme',
        description_hi: 'स्व-सहायता समूह की सदस्य महिलाओं को ₹3 लाख तक का सब्सिडी ऋण।',
        description_en: 'Subsidised loan up to ₹3 lakh for SHG member women.',
        aiDraft_hi: 'यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।', aiDraftApproved: false,
        need: 'livelihood', state: 'Madhya Pradesh', districts: allDistricts,
        eligibilityCriteria: [{ field: 'shmMember', operator: 'bool', value: true }],
        benefits: 'Subsidised loan up to ₹3,00,000',
        documents: ['SHG membership certificate', 'Aadhaar card', 'Bank passbook'],
        applicationProcess: 'Apply through SHG group leader to Block Development Officer',
        officialUrl: 'https://mpshg.mp.gov.in', lastCheckedAt: new Date('2026-08-30'),
        helpCentre: 'Block Development Office', status: 'published', updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // SCH-031 Maternity
    await Scheme.findOneAndUpdate(
      { title_en: 'Maternity Cash Benefit Scheme' },
      {
        title_hi: 'मातृत्व नकद लाभ योजना', title_en: 'Maternity Cash Benefit Scheme',
        description_hi: 'पहले जीवित बच्चे के जन्म पर गर्भवती महिलाओं को ₹5,000 की एकमुश्त सहायता।',
        description_en: '₹5,000 one-time cash benefit for pregnant women on first live birth.',
        aiDraft_hi: 'यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।', aiDraftApproved: false,
        need: 'maternity', state: 'Madhya Pradesh', districts: allDistricts,
        eligibilityCriteria: [{ field: 'pregnant', operator: 'bool', value: true }],
        benefits: '₹5,000 one-time payment to bank account',
        documents: ['Pregnancy registration card', 'Aadhaar card', 'Bank passbook'],
        applicationProcess: 'Register at nearest Anganwadi centre or Health Sub-Centre',
        officialUrl: 'https://pmmvy.nic.in', lastCheckedAt: new Date('2026-10-05'),
        helpCentre: 'Anganwadi Centre / Health Sub-Centre', status: 'published', updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Campaigns
    await Campaign.findOneAndUpdate(
      { title: 'Annual Health Camp 2026' },
      { title: 'Annual Health Camp 2026', description: 'Annual health camp for women in rural Madhya Pradesh', targetAmount: 50000000, raisedAmount: 18500000, status: 'active' },
      { upsert: true, new: true }
    );
    await Campaign.findOneAndUpdate(
      { title: 'Girl Child Education Drive' },
      { title: 'Girl Child Education Drive', description: 'Education support for girls across 9 districts of MP', targetAmount: 30000000, raisedAmount: 9200000, status: 'active' },
      { upsert: true, new: true }
    );

    console.log('✅ Auto-seed complete — admin@empowerher.org / Admin@123 | donor@test.com / Donor@123');
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

module.exports = connectDB;
