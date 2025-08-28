// NOTE: Nickname generation now goes through our backend (/api/nickname).
// Remove hardcoded keys from client code.

export interface NicknameContext {
  firstName: string;
  state: string;
  grassType?: string;
  mower?: string;
  hoc?: number;
  sprayer?: string;
  city?: string;
  monthlyBudget?: number;
  issues?: string[];
}

import config from './config';

export async function generateBudNickname(context: NicknameContext): Promise<string> {
  try {
    const apiBase = config.apiBase;
    console.log('[Nickname] Using API base:', apiBase);
    
    // Add timeout to prevent hanging forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const url = `${apiBase}/api/nickname`;
    console.log('[Nickname] Calling:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn('[Nickname] API returned error:', response.status, response.statusText);
      throw new Error(`Nickname API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Nickname] API response:', data);
    const nickname = (data?.nickname || '').toString().trim().replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
    
    if (nickname) {
      console.log('[Nickname] Using API nickname:', nickname);
      return nickname;
    } else {
      console.log('[Nickname] No nickname in response, using fallback');
      return generateFallbackNickname(context.firstName, context.state, context.hoc);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[Nickname] Request timed out after 5s, using fallback');
    } else {
      console.error('[Nickname] Request failed:', error.message);
    }
    const fallback = generateFallbackNickname(context.firstName, context.state, context.hoc);
    console.log('[Nickname] Using fallback nickname:', fallback);
    return fallback;
  }
}

function generateFallbackNickname(firstName: string, state: string, hoc?: number): string {
  const insults = [
    'CantStripe',
    'ScalpsDaily',
    'BrownSpots',
    'WeedPatch',
    'FungusAmongUs',
    'YellowLawn',
    'NeverSprays',
    'DullBlades',
    'PatchyGrass',
    'CrabgrassKing'
  ];
  
  const hocInsults: { [key: string]: string[] } = {
    'high': ['CutsTooHigh', 'TwoInchTerror', 'TallGrass'],
    'low': ['ScalpMaster', 'DirtShower', 'BaldSpots']
  };
  
  // Determine HOC category
  let hocCategory = '';
  if (hoc && hoc > 1.5) hocCategory = 'high';
  else if (hoc && hoc < 0.5) hocCategory = 'low';
  
  // Pick appropriate insult
  let suffix: string;
  if (hocCategory && Math.random() > 0.3) {
    const hocOptions = hocInsults[hocCategory];
    suffix = hocOptions[Math.floor(Math.random() * hocOptions.length)];
  } else {
    suffix = insults[Math.floor(Math.random() * insults.length)];
  }
  
  return firstName + suffix;
}

// Check if nickname is unique in database
export async function checkNicknameUniqueness(nickname: string): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
      .single();
    
    // If no data found, nickname is unique
    return !data;
  } catch (error) {
    // Error means no match found, so it's unique
    return true;
  }
}

// Generate unique nickname with retries
export async function generateUniqueNickname(context: NicknameContext): Promise<string> {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    const nickname = await generateBudNickname(context);
    const isUnique = await checkNicknameUniqueness(nickname);
    
    if (isUnique) {
      return nickname;
    }
    
    // Add number suffix if not unique
    const numberedNickname = `${nickname}${attempts + 1}`;
    const isNumberedUnique = await checkNicknameUniqueness(numberedNickname);
    
    if (isNumberedUnique) {
      return numberedNickname;
    }
    
    attempts++;
  }
  
  // Ultimate fallback - timestamp based
  return `${context.firstName}Mows${Date.now().toString().slice(-6)}`;
}
