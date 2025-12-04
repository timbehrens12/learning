import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY');
  console.error('The app will not function properly without these variables.');
}

// Create client with fallback to prevent crashes (but it won't work without real credentials)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

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

      // Try UPDATE first (works with RLS UPDATE policy)
      const { data: updateData, error: updateError } = await supabase
        .from('user_credits')
        .update({
          credits_remaining: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      // If UPDATE fails because record doesn't exist, try INSERT
      if (updateError || !updateData || updateData.length === 0) {
        console.log('Update failed or no rows affected, trying INSERT...');
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            credits_remaining: newCredits,
            subscription_plan: 'free',
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          // If INSERT also fails, it might be RLS - log and throw
          console.error('Both UPDATE and INSERT failed:', insertError);
          throw insertError;
        }
      }

      console.log(`✅ Deducted ${amount} credits. Remaining: ${newCredits}`);

    } catch (error) {
      console.error('Failed to deduct credits:', error);
      throw error;
    }
  }
};


