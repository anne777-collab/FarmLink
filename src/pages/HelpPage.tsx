import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { HelpCircle, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HelpPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const guides = [
    {
      title: "For Farmers / किसानों के लिए",
      steps: [
        "Sign up and choose 'I am a Farmer'.",
        "Press '📍 Sync GPS Location' to find workers in your local district.",
        "Browse nearby profiles. Call or WhatsApp workers directly to finalise crop schedules.",
        "Post job requests to notify surrounding workers automatically."
      ],
      hiSteps: [
        "साइन अप करें और 'मैं एक किसान हूँ' चुनें।",
        "अपने स्थानीय जिले में मजदूरों को खोजने के लिए 'जीपीएस लोकेशन सिंक करें' दबाएं।",
        "आसपास के मजदूरों की प्रोफाइल देखें और सीधे फोन या व्हाट्सएप करें।",
        "आसपास के मजदूरों को तुरंत सूचित करने के लिए कृषि कार्य पोस्ट करें।"
      ]
    },
    {
      title: "For Workers / मजदूरों के लिए",
      steps: [
        "Register as an 'Agricultural Worker' with your mobile number.",
        "Add your special skills (Harvesting, Wheat cutting, Tractor driving).",
        "Press '📍 Refresh Live Location' to set your current village placement.",
        "Farmers will reach out to you directly for work. Keep 100% of your daily wage!"
      ],
      hiSteps: [
        "अपने मोबाइल नंबर के साथ 'कृषि मजदूर' के रूप में पंजीकरण करें।",
        "अपना विशेष कौशल (फसल कटाई, गेहूं की कटाई, ट्रैक्टर चलाना) जोड़ें।",
        "अपने वर्तमान गाँव की लोकेशन सेट करने के लिए 'लाइव लोकेशन अपडेट करें' दबाएं।",
        "किसान सीधे आपसे संपर्क करेंगे। अपनी पूरी मजदूरी अपने पास रखें!"
      ]
    }
  ];

  const helpTopics = [
    {
      q: t("q1"),
      a: t("a1")
    },
    {
      q: t("q2"),
      a: t("a2")
    },
    {
      q: t("q3"),
      a: t("a3")
    },
    {
      q: t("q4"),
      a: t("a4")
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-slate-950 transition-colors duration-300">
      <div className="mx-auto max-w-4xl px-4 space-y-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 shadow-md">
            <HelpCircle className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {t("helpTitle")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("helpSub")}
          </p>
        </div>

        {/* Quick Hotline Call Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl p-8 text-white text-center space-y-4 shadow-xl shadow-emerald-500/10">
          <Phone className="h-8 w-8 text-white mx-auto animate-bounce-short" />
          <h2 className="text-2xl font-black">24/7 Rural Support / सहायता केंद्र</h2>
          <p className="text-xs text-emerald-100 max-w-md mx-auto leading-relaxed">
            Struggling to sign up or locate GPS matches? Dial our local customer support. We can register your profile over the phone!
          </p>
          <p className="text-xl font-bold bg-white/10 py-3 px-6 rounded-2xl inline-block">
            {t("helpline")}
          </p>
        </div>

        {/* Guides Accordion Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {guides.map((guide, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                {guide.title}
              </h3>
              <ul className="space-y-4 text-xs text-slate-500 dark:text-slate-400">
                {guide.steps.map((step, sIdx) => (
                  <li key={sIdx} className="space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Step {sIdx + 1}: {step}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      चरण {sIdx + 1}: {guide.hiSteps[sIdx]}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            {t("faqTitle")} / अक्सर पूछे जाने वाले प्रश्न
          </h3>

          <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
            {helpTopics.map((topic, index) => (
              <div key={index} className={index > 0 ? "pt-6 space-y-2" : "space-y-2"}>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {topic.q}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {topic.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Safety standards */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 text-center">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
          <span>FarmLink commits to direct peer matches. We take 0% middle contractor fee.</span>
        </div>

      </div>
    </div>
  );
};
export default HelpPage;
