Copy'use client';

// 메인 화면의 검색창과 뉴스레터 구독 폼 (입력이 필요한 부분만 클라이언트)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/news?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} role="search" className="flex w-full sm:w-auto">
      <input
        type="search"
        name="search"
        aria-label="Search news"
        placeholder="Search news..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="px-3 py-1.5 border rounded-l-md text-black focus:outline-none w-full sm:w-48"
      />
      <button type="submit" className="bg-blue-950 text-white px-3 py-1.5 rounded-r-md hover:bg-blue-800">Search</button>
    </form>
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const { error } = await supabase.from('subscribers').insert([{ email }]);
      if (error) alert(error.code === '23505' ? 'This email is already subscribed.' : 'Error: ' + error.message);
      else { alert(`Successfully subscribed with ${email}!`); setEmail(''); }
    } catch {
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        aria-label="Email address"
        placeholder="Your email address"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border rounded text-black focus:outline-none"
      />
      <button type="submit" className="bg-blue-950 text-white px-6 py-2 rounded font-bold uppercase text-xs">Subscribe</button>
    </form>
  );
}








