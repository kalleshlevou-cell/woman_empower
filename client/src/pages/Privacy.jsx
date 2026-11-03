import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-bold text-primaryText mb-6">
            गोपनीयता नीति / Privacy Policy
          </h1>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-semibold text-gray-900 mb-2">1. डेटा संग्रह / Data We Collect</h2>
              <p>
                हम आपका नाम, ईमेल, फ़ोन नंबर, पता और PAN नंबर दान रसीद जारी करने और
                Income Tax Act की धारा 80G के अनुपालन के लिए एकत्र करते हैं।
              </p>
              <p className="mt-1">
                We collect your name, email, phone number, address and PAN for issuing donation
                receipts and compliance under Income Tax Act Section 80G.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">2. डेटा उपयोग / How We Use Your Data</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>दान रसीद और 80G प्रमाण पत्र जारी करना / Issuing donation receipts and 80G certificates</li>
                <li>दान की पुष्टि ईमेल भेजना / Sending donation confirmation emails</li>
                <li>आयकर अनुपालन (Form 10BD) / Income Tax compliance (Form 10BD)</li>
                <li>योजना जानकारी प्रदान करना / Providing scheme information</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">3. DPDP Act 2023 अनुपालन</h2>
              <p>
                हम Digital Personal Data Protection Act 2023 का पालन करते हैं। आपका
                व्यक्तिगत डेटा तृतीय पक्षों को नहीं बेचा जाएगा।
              </p>
              <p className="mt-1">
                We comply with the Digital Personal Data Protection Act 2023. Your personal data
                will not be sold to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">4. डेटा प्रतिधारण / Data Retention</h2>
              <p>
                80G दान रिकॉर्ड Income Tax Act के अनुसार 7 वर्षों तक सुरक्षित रखे जाते हैं।
                अन्य व्यक्तिगत डेटा खाता बंद होने पर हटाया जा सकता है।
              </p>
              <p className="mt-1">
                Donation records under 80G are retained for 7 years as required by the Income
                Tax Act. Other personal data may be deleted upon account closure.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">5. कोई विज्ञापन ट्रैकर नहीं / No Ad Trackers</h2>
              <p>
                हमारी योजना पृष्ठों पर कोई विज्ञापन ट्रैकर या तृतीय पक्ष analytics नहीं हैं।
                Our scheme pages carry no advertising trackers or third-party analytics.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">6. संपर्क / Contact</h2>
              <p>
                गोपनीयता से संबंधित किसी भी प्रश्न के लिए:<br />
                For any privacy-related queries:<br />
                <strong>help@empowerher.org</strong> | +91-755-0000000
              </p>
            </section>

            <p className="text-xs text-gray-400 border-t pt-4">
              अंतिम अपडेट / Last updated: November 2026
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
