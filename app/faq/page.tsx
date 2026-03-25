'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle, MessageCircle } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "What is Whitespace?",
    answer: "Whitespace is Nigeria's central coordination intelligence platform for civil society. We map NGO programmes across all 774 LGAs to identify service gaps, prevent duplication of efforts, and optimize humanitarian resource allocation."
  },
  {
    question: "How do I register my NGO?",
    answer: "To register, click the 'Register NGO' button on the home page or go to the Auth page. You will need to provide your CAC registration details, institutional information, and a summary of your active programmes."
  },
  {
    question: "Is the data on Whitespace verified?",
    answer: "Yes. Every organisation on our platform undergoes a verification process that includes CAC documentation checks and institutional vetting. We also use field reports and partner data to validate programme information."
  },
  {
    question: "What is a 'Gap Score'?",
    answer: "A Gap Score is a metric from 0 to 100 that indicates the level of underserved need in a specific LGA. A score of 100 means there are no recorded interventions relative to the estimated population need in that sector."
  },
  {
    question: "How can donors use this platform?",
    answer: "Donors can use our Intelligence dashboard to identify high-impact funding opportunities in regions with high Gap Scores. This ensures that funding is directed where it is most needed and avoids over-funding areas that are already saturated."
  },
  {
    question: "Is there a cost to use Whitespace?",
    answer: "Basic registration and access to the NGO Registry are free for verified civil society organisations. Advanced intelligence reports and strategic coordination tools may require a partnership agreement or subscription."
  }
];

function FAQItem({ question, answer, index }: { question: string, answer: string, index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-slate-200 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-emerald-600' : 'text-slate-900 group-hover:text-emerald-600'}`}>
          {question}
        </span>
        <div className={`shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-emerald-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-slate-600 leading-relaxed text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <HelpCircle size={14} /> Frequently Asked Questions
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Everything you need to know</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Find answers to common questions about the Whitespace platform, NGO registration, and our intelligence methodology.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-sm mb-20">
            <div className="divide-y divide-slate-100">
              {faqs.map((faq, idx) => (
                <FAQItem key={idx} question={faq.question} answer={faq.answer} index={idx} />
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <MessageCircle size={120} />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
              </p>
              <a href="mailto:support@whitespace.org" className="inline-block bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20">
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
