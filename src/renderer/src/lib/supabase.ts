import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Credit management service
export const userCredits = {
  async getCredits(userId: string): Promise<{ credits: number; plan: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits, subscription_status')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        credits: data.credits || 0,
        plan: data.subscription_status === 'free' ? 'free' : 'unlimited'
      };
    } catch (error) {
      console.error('Failed to get credits:', error);
      // Return default for new users
      return { credits: 25, plan: 'free' };
    }
  },

  async deductCredits(userId: string, amount: number): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const currentCredits = data.credits || 0;

      const { error: updateError } = await supabase
        .from('users')
        .update({ credits: Math.max(0, currentCredits - amount) })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the usage
      await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          feature_used: 'ai_scan',
          credits_spent: amount
        });

    } catch (error) {
      console.error('Failed to deduct credits:', error);
      throw error;
    }
  }
};


