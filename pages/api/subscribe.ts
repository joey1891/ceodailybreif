import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    // Email validation
    if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    // Use service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabase
      .from('subscribers')
      .insert([{ email }])
      .select();
      
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already subscribed' });
      }
      throw error;
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Subscription failed' });
  }
} 