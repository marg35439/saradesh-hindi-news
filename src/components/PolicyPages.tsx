import React, { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, Scale, CheckSquare, Building, Mail, Phone, MapPin, Send, AlertCircle, FileText } from "lucide-react";
import { fetchSiteSettingsClient } from "../lib/newsClient";
import { SiteSettings } from "../types";

interface PolicyPagesProps {
  pageType: "editorial-policy" | "corrections-policy" | "fact-check-policy" | "publisher-info" | "about-us" | "contact-us";
  onBack: () => void;
}

export const PolicyPages: React.FC<PolicyPagesProps> = ({ pageType, onBack }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchSiteSettingsClient().then((s) => setSiteSettings(s));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const pub = siteSettings?.publisherInfo;
  const con = siteSettings?.contactUs;

  const hasPubInfo = pub && (pub.publisherName || pub.cinNumber || pub.chiefEditor || pub.address || pub.ownershipDetails);

  const renderContent = () => {
    switch (pageType) {
      case "editorial-policy":

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <Scale className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">संपादकीय नीति (Editorial Policy)</h1>
            </div>
            <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
              अंतिम अद्यतन: 1 अगस्त 2026 | प्रेस काउंसिल ऑफ इंडिया (PCI) और डिजिटल मीडिया आचार संहिता के तहत
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-900">1. निष्पक्षता और सत्यनिष्ठा (Accuracy and Neutrality)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                सारादेश (Saradesh.in) किसी भी राजनीतिक, धार्मिक या व्यापारिक दबाव से पूरी तरह मुक्त होकर समाचार प्रस्तुत करता है। हमारे सभी रिपोर्टर और संपादक केवल प्रामाणिक तथ्यों के आधार पर खबर लिखते हैं।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-900">2. स्रोतों का सत्यापन (Source Verification)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                किसी भी खबर को प्रकाशित करने से पहले कम से कम दो स्वतंत्र और आधिकारिक स्रोतों से उसकी पुष्टि की जाती है। यदि स्रोत गोपनीय है, तो वरिष्ठ संपादक की सहमति आवश्यक होती है।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-900">3. हितों का टकराव (Conflict of Interest)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                हमारे पत्रकारों को किसी भी वित्तीय या व्यक्तिगत लाभ के लिए खबरों को प्रभावित करने की सख्त मनाही है। प्रायोजित या विज्ञापनों को स्पष्ट रूप से "विज्ञापन" या "प्रायोजित" के रूप में चिह्नित किया जाता है।
              </p>
            </section>
          </div>
        );

      case "corrections-policy":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">सुधार एवं संशोधन नीति (Corrections Policy)</h1>
            </div>
            <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
              पारदर्शिता और नैतिक पत्रकारिता के प्रति हमारी प्रतिबद्धता
            </p>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-900">1. त्रुटियों की स्वीकारोक्ति (Acknowledging Errors)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                यदि हमारे किसी लेख या वीडियो में कोई तथ्य संबंधी त्रुटि पाई जाती है, तो हम उसे छिपाने के बजाय तुरंत सही करते हैं और पाठकों को सूचित करते हैं।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-900">2. सुधार की प्रक्रिया (Correction Workflow)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                सुधार किए गए लेख के निचले भाग में एक स्पष्ट नोट जोड़ा जाता है: <strong>"संशोधन नोट: [दिनांक] - इस लेख में त्रुटिवश गलत तथ्य दिया गया था जिसे सुधार लिया गया है।"</strong>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-900">3. शिकायत दर्ज करें (Report an Error)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                यदि आपको किसी खबर में कोई त्रुटि मिलती है, तो आप <strong>corrections@saradesh.in</strong> पर ईमेल करके सूचित कर सकते हैं। हमारी डेस्क 24 घंटे के भीतर कार्रवाई करती है।
              </p>
            </section>
          </div>
        );

      case "fact-check-policy":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <CheckSquare className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">फैक्ट चेक नीति (Fact-Check Policy)</h1>
            </div>
            <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
              भ्रामक खबरों व अफवाहों के खिलाफ हमारी 5-चरणीय सत्यापन प्रक्रिया
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-800 text-sm block mb-1">चरण 1: दावा पहचान</span>
                <p className="text-xs text-neutral-700">सोशल मीडिया या पब्लिक डोमेन में वायरल हो रहे दावों की पहचान करना।</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-800 text-sm block mb-1">चरण 2: प्राथमिक दस्तावेज़</span>
                <p className="text-xs text-neutral-700">सरकारी गजट, आधिकारिक बयानों और मूल डेटा सेट से मिलान।</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-800 text-sm block mb-1">चरण 3: विशेषज्ञ परामर्श</span>
                <p className="text-xs text-neutral-700">संबद्ध विषय विशेषज्ञों और अधिकारियों से सीधा साक्षात्कार।</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-800 text-sm block mb-1">चरण 4: डिजिटल फॉरेंसिक</span>
                <p className="text-xs text-neutral-700">रिवर्स इमेज सर्च और वीडियो मेटाडेटा विश्लेषण।</p>
              </div>
            </div>
          </div>
        );

      case "publisher-info":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <Building className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">प्रकाशक एवं स्वामित्व जानकारी (Publisher Information)</h1>
            </div>
            <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
              कंपनी पंजीकरण, स्वामित्व और पारदर्शी विवरण
            </p>

            {hasPubInfo ? (
              <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200 space-y-4 text-sm">
                {pub?.publisherName && (
                  <div className="flex flex-col sm:flex-row justify-between border-b pb-2 gap-1">
                    <span className="text-neutral-500 font-bold">प्रकाशक संस्था:</span>
                    <span className="font-bold text-neutral-900">{pub.publisherName}</span>
                  </div>
                )}
                {pub?.cinNumber && (
                  <div className="flex flex-col sm:flex-row justify-between border-b pb-2 gap-1">
                    <span className="text-neutral-500 font-bold">कॉरपोरेट पहचान / पंजीयन संख्या (CIN):</span>
                    <span className="font-bold text-neutral-900">{pub.cinNumber}</span>
                  </div>
                )}
                {pub?.chiefEditor && (
                  <div className="flex flex-col sm:flex-row justify-between border-b pb-2 gap-1">
                    <span className="text-neutral-500 font-bold">प्रधान संपादक / निदेशक:</span>
                    <span className="font-bold text-neutral-900">{pub.chiefEditor}</span>
                  </div>
                )}
                {pub?.address && (
                  <div className="flex flex-col sm:flex-row justify-between border-b pb-2 gap-1">
                    <span className="text-neutral-500 font-bold">मुख्यालय / कार्यालय पता:</span>
                    <span className="font-bold text-neutral-900">{pub.address}</span>
                  </div>
                )}
                {pub?.ownershipDetails && (
                  <div className="flex flex-col sm:flex-row justify-between pt-1 gap-1">
                    <span className="text-neutral-500 font-bold">स्वामित्व व वित्तीय विवरण:</span>
                    <span className="font-semibold text-neutral-800">{pub.ownershipDetails}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-8 text-center text-neutral-600 space-y-2">
                <p className="font-bold text-amber-900 text-base">प्रकाशक जानकारी वर्तमान में खाली (blank) है।</p>
                <p className="text-xs text-neutral-500">
                  एडमिन पैनल के <strong>"साइट व ऑथर सेटिंग्स"</strong> ब्लॉक से प्रकाशक संस्था, CIN व संपादक विवरण दर्ज करने पर वह स्वतः यहाँ प्रदर्शित होगा।
                </p>
              </div>
            )}
          </div>
        );

      case "about-us":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <FileText className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">हमारे बारे में (About Us)</h1>
            </div>

            <p className="text-neutral-700 leading-relaxed text-base">
              <strong>सारादेश (Saradesh.in)</strong> भारत का प्रमुख डिजिटल हिंदी समाचार पोर्टल है जो देश और दुनिया की ताज़ा, सटीक और निष्पक्ष खबरें सबसे पहले पाठकों तक पहुँचाने के लिए प्रतिबद्ध है।
            </p>

            <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-md">
              <h3 className="font-black text-lg mb-2">हमारा मिशन (Our Mission)</h3>
              <p className="text-sm leading-relaxed opacity-95">
                हिंदी भाषी पाठकों को डिजिटल युग में बिना किसी सनसनीखेज प्रचार के केवल सत्य, तथ्य और राष्ट्रहित से जुड़ी प्रामाणिक खबरें उपलब्ध कराना।
              </p>
            </div>
          </div>
        );

      case "contact-us":
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <Mail className="w-8 h-8 text-amber-600" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">संपर्क करें (Contact Us)</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
                  <Mail className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-xs uppercase text-amber-800 tracking-wider block mb-1">संपादकीय एवं आधिकारिक ईमेल (Official Email):</span>
                    {con?.editorialEmail && (
                      <p className="text-sm text-neutral-900 font-bold">{con.editorialEmail}</p>
                    )}
                    {con?.supportEmail && (
                      <p className="text-sm text-neutral-800 font-semibold">{con.supportEmail}</p>
                    )}
                    {con?.phone && (
                      <p className="text-sm text-neutral-800 font-semibold pt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>{con.phone}</span>
                      </p>
                    )}
                    {con?.address && (
                      <p className="text-xs text-neutral-700 pt-1 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{con.address}</span>
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 mt-2">किसी भी समाचार, विज्ञापन या प्रतिक्रिया के लिए हमें ईमेल करें। हमारी टीम 24 घंटे के भीतर जवाब देती है।</p>
                  </div>
                </div>
              </div>


              {/* Feedback Form */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <h2 className="text-lg font-black text-neutral-900 mb-4">संदेश भेजें / प्रतिक्रिया दें</h2>
                {formSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center text-sm font-semibold">
                    ✓ आपका संदेश सफलतापूर्वक प्राप्त हुआ। हमारी संपादकीय टीम जल्द आपसे संपर्क करेगी।
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">आपका नाम *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">ईमेल पता *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">विषय *</label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">संदेश *</label>
                      <textarea
                        rows={3}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>संदेश भेजें</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-lg border border-amber-200 transition-all mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>मुख्य पृष्ठ पर लौटें</span>
      </button>

      <div className="bg-white rounded-2xl p-6 md:p-10 border border-neutral-200 shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};
