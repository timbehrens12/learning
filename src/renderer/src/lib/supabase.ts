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
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      // If no record exists, return default (should be created by trigger, but handle gracefully)
      const credits = data?.credits_remaining ?? 25;

      return {
        credits: credits,
        plan: 'free' // We're using credit-based system, not subscriptions
      };
    } catch (error) {
      console.error('Failed to get credits:', error);
      // Return default for new users
      return { credits: 25, plan: 'free' };
    }
  },

  async canMakeRequest(userId: string): Promise<boolean> {
    try {
      const credits = await this.getCredits(userId);
      return credits.credits > 0;
    } catch (error) {
      console.error('Failed to check credits:', error);
      // Fail-safe: allow request if check fails
      return true;
    }
  },

  async deductCredits(userId: string, amount: number): Promise<void> {
    try {
      // Get current credits
      const { data, error: fetchError } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const currentCredits = data?.credits_remaining ?? 25;
      const newCredits = Math.max(0, currentCredits - amount);

      // Update credits using upsert to handle cases where record doesn't exist
      const { error: updateError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          credits_remaining: newCredits,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      console.log(`Deducted ${amount} credits. Remaining: ${newCredits}`);

    } catch (error) {
      console.error('Failed to deduct credits:', error);
      throw error;
    }
  }
};


