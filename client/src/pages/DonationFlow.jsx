import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import ReceiptDownload from '../components/ReceiptDownload';
import { getCampaigns, getCampaignById } from '../api/campaignsApi';
import { createOrder, verifyPayment } from '../api/donationsApi';
import { useAuth } from '../context/AuthContext';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const donorSchema = z.object({
  name: z.string().min(1, 'नाम आवश्यक है / Name is required'),
  email: z.string().email('वैध ईमेल दर्ज करें / Enter valid email'),
  phone: z
    .string()
    .regex(/^\d{10}$/, '10 अंकों का मोबाइल नंबर / 10-digit mobile number'),
  pan: z
    .string()
    .regex(PAN_REGEX, 'PAN format: AAAAA0000A')
    .or(z.literal(''))
    .optional(),
  address: z.string().min(1, 'पता आवश्यक है / Address is required'),
  acceptedPrivacyPolicy: z
    .boolean()
    .refine((v) => v === true, {
      message: 'गोपनीयता नीति स्वीकार करना अनिवार्य है / Privacy policy acceptance is required',
    }),
});

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

function StepIndicator({ step }) {
  const steps = [
    { num: 1, hi: 'अभियान', en: 'Campaign' },
    { num: 2, hi: 'विवरण', en: 'Details' },
    { num: 3, hi: 'भुगतान', en: 'Payment' },
  ];
  return (
    <div className="flex items-center justify-center mb-8 gap-0" role="list" aria-label="Donation steps">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center" role="listitem">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step === s.num
                ? 'bg-secondary text-white'
                : step > s.num
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
            aria-current={step === s.num ? 'step' : undefined}
          >
            {step > s.num ? '✓' : s.num}
          </div>
          <div className="flex flex-col ml-1 mr-1">
            <span className="text-xs font-medium text-gray-700 leading-none">{s.hi}</span>
            <span className="text-xs text-gray-400 leading-none">{s.en}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-8 ${step > s.num ? 'bg-green-500' : 'bg-gray-200'}`} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function DonationFlow() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || '');
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Step 3 state
  const [orderData, setOrderData] = useState(null);
  const [donorData, setDonorData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [foreignCardError, setForeignCardError] = useState(false);
  const [completedDonation, setCompletedDonation] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(donorSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      pan: user?.pan || '',
      address: user?.address || '',
      acceptedPrivacyPolicy: false,
    },
  });

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        const list = res.data?.data || [];
        setCampaigns(list);
        if (!selectedCampaignId && list.length > 0) {
          setSelectedCampaignId(list[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCampaigns(false));
  }, []);

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
      setValue('pan', user.pan || '');
      setValue('address', user.address || '');
    }
  }, [user, setValue]);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const handleStep1Next = () => {
    if (!selectedCampaignId) return;
    setStep(2);
  };

  const onStep2Submit = async (data) => {
    try {
      const res = await createOrder({
        campaignId: selectedCampaignId,
        amount: finalAmount * 100, // paise
        donorName: data.name,
        donorEmail: data.email,
        donorPhone: data.phone,
        pan: data.pan || undefined,
        address: data.address,
        acceptedPrivacyPolicy: data.acceptedPrivacyPolicy,
      });
      setOrderData(res.data?.data);
      setDonorData(data);
      setStep(3);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Order creation failed. Please retry.';
      alert(`त्रुटि / Error: ${errMsg}`);
    }
  };

  const handlePayNow = async () => {
    setPaymentError('');
    setPaymentLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPaymentError('Razorpay could not load. Please check your internet connection.');
      setPaymentLoading(false);
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'EmpowerHer NGO',
      description: '🔴 TEST MODE — परीक्षण लेनदेन',
      order_id: orderData.orderId,
      prefill: {
        name: donorData?.name,
        email: donorData?.email,
        contact: donorData?.phone,
      },
      theme: { color: '#2D7D46' },
      handler: async (response) => {
        try {
          const verifyRes = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            donationId: orderData.donationId,
          });
          setCompletedDonation(verifyRes.data?.data);
          setPaymentSuccess(true);
        } catch (err) {
          const msg = err.response?.data?.error || '';
          if (msg.includes('विदेशी') || msg.includes('international') || err.response?.status === 400) {
            setForeignCardError(true);
          } else {
            setPaymentError(msg || 'Verification failed. Please contact support.');
          }
        }
        setPaymentLoading(false);
      },
      modal: {
        ondismiss: () => setPaymentLoading(false),
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setPaymentLoading(false);
        const errCode = response.error?.code || '';
        if (errCode.includes('INTERNATIONAL') || response.error?.description?.toLowerCase().includes('international')) {
          setForeignCardError(true);
        } else {
          setPaymentError(response.error?.description || 'Payment failed.');
        }
      });
      rzp.open();
    } catch {
      setPaymentError('Could not open payment window.');
      setPaymentLoading(false);
    }
  };

  const selectedCampaign = campaigns.find((c) => c._id === selectedCampaignId);

  return (
    <div className="min-h-screen flex flex-col font-devanagari">
      <Navbar />
      <main role="main" className="flex-1 pt-14 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-bold text-primaryText text-center mb-4">
            दान करें / Donate
          </h1>

          <StepIndicator step={step} />

          {/* ===== STEP 1: Campaign + Amount ===== */}
          {step === 1 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
              <h2 className="font-semibold text-gray-800">अभियान चुनें / Select Campaign</h2>

              {loadingCampaigns ? (
                <LoadingSpinner />
              ) : campaigns.length > 0 ? (
                <div className="space-y-2">
                  {campaigns.map((c) => (
                    <label
                      key={c._id}
                      htmlFor={`campaign-${c._id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedCampaignId === c._id
                          ? 'border-secondary bg-green-50'
                          : 'border-gray-200 hover:border-secondary'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`campaign-${c._id}`}
                        name="campaign"
                        value={c._id}
                        checked={selectedCampaignId === c._id}
                        onChange={() => setSelectedCampaignId(c._id)}
                        className="accent-secondary"
                      />
                      <span className="text-sm font-medium text-gray-800">{c.title}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">कोई अभियान उपलब्ध नहीं।</p>
              )}

              {/* Amount selector */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  राशि चुनें / Choose Amount (₹)
                </p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => { setAmount(a); setCustomAmount(''); }}
                      className={`py-2 rounded border text-sm font-semibold transition-colors ${
                        amount === a && !customAmount
                          ? 'bg-secondary text-white border-secondary'
                          : 'border-gray-300 text-gray-700 hover:border-secondary'
                      }`}
                    >
                      ₹{a.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="custom-amount" className="block text-xs text-gray-500 mb-1">
                    अन्य राशि / Custom Amount (₹)
                  </label>
                  <input
                    id="custom-amount"
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                    placeholder="₹ enter amount"
                  />
                </div>
              </div>

              {/* One-time / Monthly toggle */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">दान प्रकार / Donation Type</p>
                <div className="flex gap-3">
                  <label htmlFor="type-once" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      id="type-once"
                      name="donationType"
                      checked={!isMonthly}
                      onChange={() => setIsMonthly(false)}
                      className="accent-secondary"
                    />
                    <span className="text-sm text-gray-700">एकमुश्त / One-time</span>
                  </label>
                  <label htmlFor="type-monthly" className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      id="type-monthly"
                      name="donationType"
                      checked={isMonthly}
                      onChange={() => setIsMonthly(true)}
                      className="accent-secondary"
                    />
                    <span className="text-sm text-gray-700">मासिक / Monthly</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded p-3">
                <span>कुल राशि / Total:</span>
                <span className="font-bold text-primaryText text-lg">
                  ₹{(finalAmount || 0).toLocaleString('en-IN')}
                  {isMonthly && <span className="text-xs font-normal">/माह</span>}
                </span>
              </div>

              <button
                onClick={handleStep1Next}
                disabled={!selectedCampaignId || !finalAmount}
                className="w-full bg-secondary text-white py-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                आगे बढ़ें / Continue
              </button>
            </div>
          )}

          {/* ===== STEP 2: Donor Details ===== */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit(onStep2Submit)}
              noValidate
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4"
            >
              <h2 className="font-semibold text-gray-800">दाता विवरण / Donor Details</h2>

              {selectedCampaign && (
                <div className="text-sm text-gray-600 bg-green-50 rounded p-2">
                  अभियान: <strong>{selectedCampaign.title}</strong> |
                  राशि: <strong>₹{(finalAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="donor-name" className="block text-sm font-medium text-gray-700 mb-1">
                  पूरा नाम / Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="donor-name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                  placeholder="आपका नाम"
                />
                {errors.name && (
                  <p id="name-error" role="alert" className="text-red-600 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="donor-email" className="block text-sm font-medium text-gray-700 mb-1">
                  ईमेल / Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="donor-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-red-600 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="donor-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  मोबाइल नंबर / Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="donor-phone"
                  type="tel"
                  autoComplete="tel"
                  {...register('phone')}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                  placeholder="10-digit mobile"
                />
                {errors.phone && (
                  <p id="phone-error" role="alert" className="text-red-600 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* PAN */}
              <div>
                <label htmlFor="donor-pan" className="block text-sm font-medium text-gray-700 mb-1">
                  PAN (80G रसीद के लिए / for 80G receipt)
                </label>
                <input
                  id="donor-pan"
                  type="text"
                  autoComplete="off"
                  maxLength={10}
                  {...register('pan')}
                  aria-describedby="pan-hint"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-primaryText"
                  placeholder="AAAAA0000A"
                />
                <p id="pan-hint" className="text-xs text-gray-400 mt-0.5">
                  Format: AAAAA0000A
                </p>
                {errors.pan && (
                  <p role="alert" className="text-red-600 text-xs mt-1">
                    {errors.pan.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="donor-address" className="block text-sm font-medium text-gray-700 mb-1">
                  पता / Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="donor-address"
                  rows={2}
                  {...register('address')}
                  aria-describedby={errors.address ? 'address-error' : undefined}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primaryText"
                  placeholder="पूरा पता / Full address"
                />
                {errors.address && (
                  <p id="address-error" role="alert" className="text-red-600 text-xs mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* Privacy policy — REQUIRED */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-3">
                  <strong>गोपनीयता नीति / Privacy Notice:</strong> आपका नाम, ईमेल, फ़ोन नंबर और PAN दान रसीद
                  जारी करने और कानूनी अनुपालन (Income Tax Act, Section 80G) के लिए एकत्र किया जाता है।
                  डेटा तीसरे पक्ष को नहीं बेचा जाएगा।
                  <br />
                  Your name, email, phone and PAN are collected for issuing donation receipts and legal compliance
                  (IT Act Section 80G). Data will not be sold to third parties.
                </p>
                <label htmlFor="privacy-checkbox" className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="privacy-checkbox"
                    {...register('acceptedPrivacyPolicy')}
                    aria-describedby={errors.acceptedPrivacyPolicy ? 'privacy-error' : undefined}
                    className="mt-0.5 accent-secondary"
                  />
                  <span className="text-sm text-gray-700">
                    मैं गोपनीयता नीति और उपयोग की शर्तें स्वीकार करता/करती हूँ।{' '}
                    <span className="text-red-500">*</span>
                    <br />
                    I accept the Privacy Policy and Terms of Use.
                  </span>
                </label>
                {errors.acceptedPrivacyPolicy && (
                  <p id="privacy-error" role="alert" className="text-red-600 text-xs mt-1">
                    {errors.acceptedPrivacyPolicy.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                >
                  ← वापस / Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-secondary text-white py-2.5 rounded font-semibold hover:bg-green-700 transition-colors"
                >
                  आगे बढ़ें / Proceed to Payment
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 3: Payment ===== */}
          {step === 3 && (
            <div className="space-y-4">
              {/* RED TEST MODE BANNER — ALWAYS VISIBLE, NEVER CONDITIONAL */}
              <div
                role="alert"
                className="w-full bg-red-600 text-white text-center py-3 px-4 rounded font-bold text-sm"
              >
                🔴 TEST MODE — परीक्षण लेनदेन / This is a test transaction. No real money will be charged.
              </div>

              {paymentSuccess && completedDonation ? (
                <div className="bg-white rounded-lg border border-green-300 shadow-sm p-6 text-center space-y-4">
                  <div className="text-5xl">🎉</div>
                  <h2 className="text-xl font-bold text-green-700">
                    दान सफल! / Donation Successful!
                  </h2>
                  <p className="text-sm text-gray-600">
                    धन्यवाद, <strong>{donorData?.name}</strong>! आपका दान प्राप्त हो गया।
                    <br />
                    Thank you! Your donation has been received.
                  </p>
                  {completedDonation.receiptNumber && (
                    <p className="text-xs text-gray-500">
                      Receipt No: <strong>{completedDonation.receiptNumber}</strong>
                    </p>
                  )}
                  <ReceiptDownload
                    donationId={completedDonation.donationId}
                    receiptNumber={completedDonation.receiptNumber}
                  />
                  <button
                    onClick={() => navigate('/')}
                    className="mt-2 text-sm text-secondary hover:underline"
                  >
                    होमपेज पर जाएँ / Back to Home
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                  <h2 className="font-semibold text-gray-800">भुगतान / Payment</h2>

                  <div className="bg-gray-50 rounded p-4 space-y-1 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>अभियान:</span>
                      <span className="font-medium">{selectedCampaign?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>दाता:</span>
                      <span className="font-medium">{donorData?.name}</span>
                    </div>
                    <div className="flex justify-between font-bold text-primaryText">
                      <span>राशि / Amount:</span>
                      <span>₹{(finalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
                      {paymentError}
                    </div>
                  )}

                  <button
                    onClick={handlePayNow}
                    disabled={paymentLoading}
                    className="w-full bg-secondary text-white py-3 rounded font-bold hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {paymentLoading ? 'प्रसंस्करण… / Processing…' : 'अभी भुगतान करें / Pay Now'}
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={paymentLoading}
                      className="text-sm text-gray-500 hover:underline disabled:opacity-50"
                    >
                      ← वापस / Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Foreign card error modal */}
      {foreignCardError && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foreign card not accepted"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="text-3xl">⚠️</div>
            <h2 className="font-bold text-gray-900">
              विदेशी कार्ड स्वीकार नहीं किए जाते
            </h2>
            <p className="text-sm text-gray-700">
              कृपया भारतीय कार्ड या UPI का उपयोग करें।
              <br />
              Foreign cards are not accepted. Please use an Indian card or UPI.
            </p>
            <button
              onClick={() => setForeignCardError(false)}
              className="px-6 py-2 bg-secondary text-white rounded font-medium hover:bg-green-700"
            >
              ठीक है / OK
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
