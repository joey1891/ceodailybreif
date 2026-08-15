// app/subscribe/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: email }]);

      if (error) {
        if (error.code === '23505') { 
          alert('This email is already subscribed.');
        } else {
          alert('An error occurred during subscription: ' + error.message);
        }
      } else {
        alert('Welcome! You have successfully subscribed to CEO Daily Brief.');
        router.push('/'); // 구독 완료 후 메인 페이지로 이동
      }
    } catch (err) {
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-sans text-black px-4">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 text-center">
        <h1 className="text-3xl md:text-4xl font-black font-serif uppercase tracking-tighter mb-4">
          CEO Daily Brief
        </h1>
        <p className="text-gray-500 font-bold mb-8 text-sm md:text-base leading-relaxed">
          The Executive's Window into South Korea's Markets, Policy, and Industry Intelligence.
          <br /><br />
          Get the core insights into the South Korean market delivered directly to your inbox every morning.
        </p>

        <form onSubmit={handleSubscribe} className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Your email address" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 border border-gray-300 rounded-lg text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-center text-lg"
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-950 text-white px-6 py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'PROCESSING...' : 'SUBSCRIBE NOW'}
          </button>
        </form>

        <div className="mt-8 text-sm">
          <Link href="/" className="text-gray-400 hover:text-black transition-colors font-bold tracking-wider">
            &larr; Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
