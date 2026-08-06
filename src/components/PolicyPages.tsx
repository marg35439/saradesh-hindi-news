import React, { useState, useEffect } from "react";
import { ArrowLeft, ShieldCheck, Scale, CheckSquare, Building, Mail, Phone, MapPin, Send, AlertCircle, FileText, Lock, Users, ShieldAlert, Globe, Award, Sparkles, CheckCircle2 } from "lucide-react";
import { fetchSiteSettingsClient } from "../lib/newsClient";
import { SiteSettings } from "../types";

interface PolicyPagesProps {
  pageType: "editorial-policy" | "corrections-policy" | "fact-check-policy" | "publisher-info" | "about-us" | "contact-us" | "privacy-policy" | "terms-and-conditions" | "disclaimer" | "editorial-team";
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
                यदि आपको किसी खबर में कोई त्रुटि मिलती है, तो आप <strong>bst490@gmail.com</strong> पर ईमेल करके सूचित कर सकते हैं। हमारी डेस्क 24 घंटे के भीतर कार्रवाई करती है।
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
                    <span className="text-neutral-500 font-bold">संपादकीय एवं प्रबंधन प्रमुख:</span>
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
                <p className="font-bold text-amber-900 text-base">प्रकाशक जानकारी (Publisher Information)</p>
                <p className="text-xs text-neutral-600">
                  सारादेश डिजिटल समाचार सेवा भारत से संचालित एक स्वतंत्र हिंदी समाचार पोर्टल है। संपर्क: bst490@gmail.com
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

      case "privacy-policy":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <Lock className="w-8 h-8 text-amber-600 shrink-0" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">गोपनीयता नीति (Privacy Policy)</h1>
            </div>
            <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
              अंतिम अद्यतन: 6 अगस्त 2026 | आधिकारिक वेबसाइट: <a href="https://www.saradesh.in" className="text-amber-700 underline font-semibold">https://www.saradesh.in</a> | भारतीय आईटी अधिनियम 2000 एवं डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023) अनुपालित
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">1. परिचय एवं उद्देश्य (Introduction & Scope)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                <strong>सारादेश (Saradesh)</strong>, जो डिजिटल समाचार पोर्टल <a href="https://www.saradesh.in" className="text-amber-700 underline">https://www.saradesh.in</a> द्वारा संचालित है, अपने पाठकों और उपयोगकर्ताओं की निजता और गोपनीयता का पूर्ण सम्मान करता है। यह गोपनीयता नीति विस्तार से स्पष्ट करती है कि जब आप हमारी वेबसाइट या सेवाओं का उपयोग करते हैं, तो हम आपकी व्यक्तिगत एवं गैर-व्यक्तिगत जानकारी को किस प्रकार एकत्र, उपयोग, संसाधित और सुरक्षित रखते हैं।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">2. हम कौन-सी जानकारी एकत्र करते हैं (Information We Collect)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                हम अपने पाठकों से निम्नलिखित दो प्रकार की जानकारी एकत्र कर सकते हैं:
              </p>
              <div className="space-y-2 pl-4 border-l-2 border-amber-500">
                <h3 className="text-base font-bold text-neutral-900">2.1 व्यक्तिगत पहचान योग्य जानकारी (Personal Data):</h3>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  जब आप हमारे पोर्टल पर न्यूज़लेटर सब्सक्राइब करते हैं, फीडबैक फॉर्म भरते हैं, या किसी प्रतिक्रिया/कमेंट में भाग लेते हैं, तब हम आपका नाम, ईमेल पता, मोबाइल नंबर या अन्य स्वैच्छिक जानकारी एकत्र कर सकते हैं।
                </p>
                <h3 className="text-base font-bold text-neutral-900 mt-2">2.2 गैर-व्यक्तिगत एवं तकनीकी डेटा (Non-Personal & Technical Data):</h3>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  वेबसाइट नेविगेशन के दौरान आपका आईपी एड्रेस (IP Address), इंटरनेट सेवा प्रदाता (ISP), ब्राउज़र प्रकार, डिवाइस मॉडल, ऑपरेटिंग सिस्टम, भाषा प्राथमिकता और वेबसाइट पर बिताया गया समय स्वतः लॉग फाइलों में दर्ज हो सकता है।
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">3. कुकीज़ एवं ट्रैकिंग तकनीकें (Cookies & Tracking Technologies)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                <a href="https://www.saradesh.in" className="text-amber-700 underline">https://www.saradesh.in</a> यूजर एक्सपीरियंस को अधिक सुचारू और व्यक्तिगत बनाने के लिए कुकीज़ (Cookies), वेब बीकन (Web Beacons) और स्थानीय स्टोरेज का उपयोग करता है।
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700">
                <li><strong>आवश्यक कुकीज़:</strong> वेबसाइट के मूलभूत कार्यों एवं सुरक्षा के लिए अनिवार्य।</li>
                <li><strong>विश्लेषणात्मक कुकीज़:</strong> पाठकों की संख्या और लोकप्रिय खबरों का सांख्यिकीय अध्ययन करने के लिए।</li>
                <li><strong>विज्ञापन कुकीज़:</strong> उपयोगकर्ताओं की रुचियों के अनुसार प्रासंगिक विज्ञापन प्रदर्शित करने के लिए।</li>
              </ul>
              <p className="text-xs text-neutral-500 mt-1">
                नोट: आप अपने वेब ब्राउज़र की सेटिंग्स में जाकर किसी भी समय कुकीज़ को ब्लॉक या डिलीट कर सकते हैं।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">4. गूगल एडसेंस एवं थर्ड-पार्टी सेवाएं (Google AdSense & Third-Party Services)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                हमारी वेबसाइट <strong>गूगल एडसेंस (Google AdSense)</strong> और नेटवर्क विज्ञापन भागीदारों के माध्यम से विज्ञापन प्रसारित करती है।
              </p>
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-sm">
                <p className="text-neutral-800">
                  • <strong>DART कुकीज़:</strong> गूगल एक तृतीय-पक्ष विक्रेता के रूप में हमारी साइट पर विज्ञापन दिखाने के लिए कुकीज़ का उपयोग करता है।
                </p>
                <p className="text-neutral-800">
                  • पाठक गूगल विज्ञापन और कंटेंट नेटवर्क गोपनीयता नीति पर जाकर DART कुकी के उपयोग को ऑप्ट-आउट कर सकते हैं।
                </p>
                <p className="text-neutral-800">
                  • हम <strong>Google Analytics</strong> का उपयोग वेबसाइट ट्रैफिक मापने के लिए करते हैं।
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">5. डेटा सुरक्षा एवं साझाकरण नीति (Data Protection & Security)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                सारादेश आपकी निजी जानकारी को कभी भी किसी व्यावसायिक कंपनी को बेचता या व्यापार के लिए साझा नहीं करता है।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">6. उपयोगकर्ताओं के अधिकार (User Rights under DPDP Act 2023)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                डिजिटल व्यक्तिगत डेटा संरक्षण कानून के अंतर्गत उपयोगकर्ताओं को डेटा एक्सेस, सुधार और विलोपन का पूर्ण अधिकार है।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">7. शिकायत निवारण अधिकारी व संपर्क (Grievance Redressal Officer)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                भारतीय सूचना प्रौद्योगिकी नियम 2021 के अनुसार, यदि आपकी कोई निजता या डेटा शिकायत है, तो हमारे शिकायत अधिकारी से संपर्क करें:
              </p>
              <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs space-y-1 text-sm font-medium">
                <p className="text-neutral-900 font-bold">शिकायत अधिकारी (Grievance Officer) - सारादेश</p>
                <p className="text-neutral-700">ईमेल: <span className="text-amber-800 font-bold">bst490@gmail.com</span></p>
                <p className="text-neutral-700">वेबसाइट: <a href="https://www.saradesh.in" className="text-amber-700 underline font-bold">https://www.saradesh.in</a></p>
              </div>
            </section>
          </div>
        );

      case "terms-and-conditions":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <Scale className="w-8 h-8 text-amber-600 shrink-0" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">नियम एवं शर्तें (Terms & Conditions)</h1>
            </div>
            <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
              अंतिम अद्यतन: 6 अगस्त 2026 | कानूनी समझौते की वेबसाइट: <a href="https://www.saradesh.in" className="text-amber-700 underline font-semibold">https://www.saradesh.in</a>
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">1. शर्तों की स्वीकृति (Acceptance of Terms)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                <a href="https://www.saradesh.in" className="text-amber-700 underline">https://www.saradesh.in</a> का उपयोग करने के साथ ही आप इन नियमों एवं शर्तों का पालन करने के लिए कानूनी रूप से बाध्य होते हैं।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">2. कॉपीराइट एवं बौद्धिक संपदा अधिकार (Copyright & Intellectual Property Rights)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                भारतीय कॉपीराइट अधिनियम 1957 के तहत, वेबसाइट पर प्रकाशित समस्त सामग्री सारादेश की अनन्य संपत्ति है।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">3. स्वीकार्य उपयोग (Acceptable Use)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                उपयोगकर्ता वेबसाइट का उपयोग केवल वैध उद्देश्यों के लिए करेंगे।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">4. कानूनी संपर्क जानकारी (Legal Contact Details)</h2>
              <p className="text-sm font-semibold text-neutral-800">
                ईमेल: <span className="text-amber-800 font-bold">bst490@gmail.com</span> | आधिकारिक डोमेन: <a href="https://www.saradesh.in" className="text-amber-700 underline font-bold">https://www.saradesh.in</a>
              </p>
            </section>
          </div>
        );

      case "disclaimer":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-amber-700 mb-2">
              <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0" />
              <h1 className="text-2xl md:text-3xl font-black text-neutral-900">अस्वीकरण (Disclaimer)</h1>
            </div>
            <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
              अंतिम अद्यतन: 6 अगस्त 2026 | आधिकारिक पोर्टल: <a href="https://www.saradesh.in" className="text-amber-700 underline font-semibold">https://www.saradesh.in</a>
            </p>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">1. सामान्य समाचार सटीकता अस्वीकरण (General News Accuracy Disclaimer)</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                <a href="https://www.saradesh.in" className="text-amber-700 underline">https://www.saradesh.in</a> पर प्रकाशित सभी समाचार और जानकारी केवल सामान्य जन-जागरूकता हेतु प्रस्तुत की जाती हैं।
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-neutral-900">2. वित्तीय व स्वास्थ्य संबंधी चेतावनी</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                व्यापार, शेयर बाजार और स्वास्थ्य संबंधी जानकारी केवल समाचार और शैक्षणिक उद्देश्यों के लिए है। यह पेशेवर वित्तीय या चिकित्सा सलाह नहीं है।
              </p>
            </section>
          </div>
        );

      case "editorial-team":
        return (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 text-amber-700 mb-2">
                <Users className="w-8 h-8 text-amber-600 shrink-0" />
                <h1 className="text-2xl md:text-3xl font-black text-neutral-900">Editorial Team (संपादकीय टीम)</h1>
              </div>
              <p className="text-sm text-neutral-500 font-medium border-b border-neutral-200 pb-3">
                सत्य, निष्पक्षता और उच्च E-E-A-T मानकों के साथ पत्रकारिता | <a href="https://www.saradesh.in" className="text-amber-700 underline font-semibold">https://www.saradesh.in</a>
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-900 border-l-4 border-amber-600 pl-3">Editorial Team</h2>
              <p className="text-neutral-700 leading-relaxed text-sm md:text-base">
                डिजिटल समाचार पोर्टल <strong>सारादेश (Saradesh)</strong> की समस्त संपादकीय और रिपोर्टिंग गतिविधियाँ <strong>सारादेश संपादकीय टीम (Saradesh Editorial Team)</strong> द्वारा प्रबंधित की जाती हैं। हमारी टीम निष्पक्ष, प्रामाणिक और तथ्य-आधारित हिंदी समाचार तैयार कर देश-दुनिया के पाठकों तक पहुँचाने के लिए प्रतिबद्ध है।
              </p>
            </section>

            {/* Specialized Desks Grid */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-900 border-l-4 border-amber-600 pl-3">विशेषज्ञ संपादकीय डेस्क (Specialized Desks)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* News Desk */}
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 hover:border-amber-300 transition-all">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
                    <Globe className="w-5 h-5 text-amber-600" />
                    <span>News Desk (समाचार डेस्क)</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    राष्ट्रीय, प्रादेशिक, राजनीतिक एवं प्रशासनिक खबरों का त्वरित, निष्पक्ष और सटीक संपादन एवं प्रकाशन।
                  </p>
                </div>

                {/* Technology Desk */}
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 hover:border-amber-300 transition-all">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <span>Technology Desk (तकनीकी डेस्क)</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    स्मार्टफोन, आर्टिफिशियल इंटेलिजेंस, गैजेट्स, टेक लीक्स और डिजिटल दुनिया की प्रामाणिक जानकारियां।
                  </p>
                </div>

                {/* Sports Desk */}
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 hover:border-amber-300 transition-all">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
                    <Award className="w-5 h-5 text-orange-600" />
                    <span>Sports Desk (खेल डेस्क)</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    भारतीय क्रिकेट, आईपीएल, विश्व कप, हॉकी, ओलंपिक और अंतरराष्ट्रीय खेल प्रतियोगिताओं का विस्तृत कवरेज।
                  </p>
                </div>

                {/* Business Desk */}
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 hover:border-amber-300 transition-all">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
                    <Scale className="w-5 h-5 text-purple-600" />
                    <span>Business Desk (बिजनेस व अर्थशास्त्र डेस्क)</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    शेयर बाजार, अर्थव्यवस्था, बजट, व्यक्तिगत वित्त, स्टार्टअप और बाजार नीतियों का विश्लेषणात्मक कवरेज।
                  </p>
                </div>

                {/* Fact Check Desk */}
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-2 hover:border-amber-300 transition-all md:col-span-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Fact Check Desk (फैक्ट चेक डेस्क)</span>
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    इंटरनेट और सोशल मीडिया पर वायरल होने वाले भ्रामक दावों, फर्जी खबरों और एडिटेड तस्वीरों की डिजिटल फॉरेंसिक व आधिकारिक प्राथमिक दस्तावेजों से सत्यता जांच।
                  </p>
                </div>

              </div>
            </section>

            {/* Contact Editorial */}
            <section className="space-y-3 bg-neutral-900 text-white p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-amber-400">संपादकीय संपर्क (Editorial Contact)</h2>
              <p className="text-xs text-neutral-300 leading-relaxed">
                संपादकीय प्रश्न, सुझाव, प्रेस विज्ञप्ति या समाचार सूचना के लिए केवल निम्नलिखित आधिकारिक ईमेल पर संपर्क करें:
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono">
                <span className="bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700 text-amber-300">📧 bst490@gmail.com</span>
                <span className="bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-300">🌐 https://www.saradesh.in</span>
              </div>
            </section>
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
                    <p className="text-sm text-neutral-900 font-bold">bst490@gmail.com</p>
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
