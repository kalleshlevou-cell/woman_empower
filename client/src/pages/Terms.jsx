import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-bold text-primaryText mb-6">
            उपयोग की शर्तें / Terms of Use
          </h1>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5 text-sm text-gray-700 leading-relaxed">
            <section>
              <h2 className="font-semibold text-gray-900 mb-2">1. स्वीकृति / Acceptance</h2>
              <p>
                इस पोर्टल का उपयोग करके आप इन शर्तों को स्वीकार करते हैं।
                By using this portal you accept these terms.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">2. दान / Donations</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>सभी दान परीक्षण (sandbox) मोड में हैं — कोई वास्तविक धनराशि नहीं कटती / All donations are in test mode — no real money is charged.</li>
                <li>80G प्रमाण पत्र केवल प्रदर्शन के लिए हैं / 80G certificates are for demonstration purposes only.</li>
                <li>विदेशी दान स्वीकार नहीं किए जाते (FCRA आवश्यक) / Foreign donations are not accepted (FCRA required).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">3. योजना जानकारी / Scheme Information</h2>
              <p>
                पात्रता जानकारी केवल सूचनात्मक है — यह आधिकारिक स्वीकृति नहीं है।
                हमेशा आधिकारिक स्रोत से सत्यापन करें।
              </p>
              <p className="mt-1">
                Eligibility information is informational only — not an official approval.
                Always verify with the official source.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">4. जिम्मेदारी सीमा / Limitation of Liability</h2>
              <p>
                EmpowerHer portal किसी भी त्रुटि, चूक, या योजना जानकारी में बदलाव के लिए
                उत्तरदायी नहीं है।
                The EmpowerHer portal is not liable for any errors, omissions, or changes in scheme information.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-900 mb-2">5. संपर्क / Contact</h2>
              <p>
                <strong>help@empowerher.org</strong> | +91-755-0000000<br />
                123 MP Nagar, Bhopal 462011, Madhya Pradesh
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
