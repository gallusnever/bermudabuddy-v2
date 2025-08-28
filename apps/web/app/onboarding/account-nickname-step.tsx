"use client";
import { useState } from 'react';
import { Button, Input } from '@bermuda/ui';
import BudSays from '../../components/bud-says';
import { supabase } from '../../lib/supabase';
import { generateUniqueNickname, NicknameContext } from '../../lib/nickname-generator';
import { useAuth } from '../../contexts/auth-context';

interface AccountNicknameStepProps {
  locationData: any;
  equipmentData: any;
  statusData: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AccountNicknameStep({ 
  locationData, 
  equipmentData, 
  statusData,
  onUpdate, 
  onNext, 
  onBack 
}: AccountNicknameStepProps) {
  const { refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [stage, setStage] = useState<'name' | 'nickname' | 'account'>('name');

  const handleNameSubmit = async () => {
    if (!firstName || !lastName) {
      setErrors({ name: 'I need your full name, partner' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Generate nickname based on all context including issues!
      const context: NicknameContext = {
        firstName,
        state: locationData.state,
        city: locationData.city,
        grassType: equipmentData.grassType,
        mower: equipmentData.mower,
        hoc: parseFloat(equipmentData.hoc),
        sprayer: equipmentData.sprayer,
        monthlyBudget: parseInt(equipmentData.monthlyBudget),
        issues: statusData?.issues || []
      };

      const generatedNickname = await generateUniqueNickname(context);
      setNickname(generatedNickname);
      setStage('nickname');
    } catch (error) {
      console.error('Nickname generation failed:', error);
      setErrors({ nickname: 'Failed to generate nickname, trying again...' });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountCreation = async () => {
    // Validate
    const newErrors: { [key: string]: string } = {};
    
    if (!email || !email.includes('@')) {
      newErrors.email = 'Need a valid email address';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords don\'t match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Create account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            nickname: nickname
          }
        }
      });

      if (authError) throw authError;

      // Update profile with all data
      if (authData.user) {
        console.log('[Profile] Saving profile for user:', authData.user.id);
        console.log('[Profile] Location data:', locationData);
        console.log('[Profile] Equipment data:', equipmentData);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            nickname: nickname,
            full_name: `${firstName} ${lastName}`,
            city: locationData.city,
            state: locationData.state,
            zip: locationData.zip,
            address: locationData.address,
            lat: locationData.lat || locationData.latitude,
            lon: locationData.lon || locationData.lng || locationData.longitude,
            area_sqft: locationData.area || locationData.area_sqft,
            grass_type: equipmentData.grassType || equipmentData.grass_type,
            hoc: equipmentData.hoc ? parseFloat(equipmentData.hoc) : null,
            mower: equipmentData.mower,
            sprayer: equipmentData.sprayer,
            irrigation: equipmentData.irrigation,
            age_verified: true,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('[Profile] Save failed:', profileError);
          throw new Error(`Failed to save profile: ${profileError.message}`);
        }
        
        console.log('[Profile] Successfully saved profile with coordinates:', {
          lat: locationData.lat || locationData.latitude,
          lon: locationData.lon || locationData.lng || locationData.longitude
        });

        // Refresh the profile in auth context to get the saved data
        await refreshProfile();
        
        // Pass data forward ONLY if profile saved successfully
        const accountData = {
          firstName,
          lastName,
          email,
          nickname,
          userId: authData.user?.id
        };
        
        onUpdate(accountData);
        onNext(accountData);
      } else {
        throw new Error('No user ID available after authentication');
      }
    } catch (error: any) {
      console.error('Account creation failed:', error);
      setErrors({ 
        general: error.message || 'Failed to create account. Try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {stage === 'name' && (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-4">Alright, Who Are You?</h2>
            <p className="text-gray-600">
              I've learned about your lawn. Now tell me about YOU.
            </p>
          </div>

          <BudSays 
            message="Alright, I need your real name for the paperwork. But between you and me? I'm gonna call you something else based on what I've learned about your lawn situation. And before you ask - no, you don't get to pick it."
            variant="info"
          />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                disabled={loading}
              />
            </div>

            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack} disabled={loading}>
              Back
            </Button>
            <Button onClick={handleNameSubmit} disabled={loading || !firstName || !lastName}>
              {loading ? 'Thinking of a nickname...' : 'Submit Name'}
            </Button>
          </div>
        </>
      )}

      {stage === 'nickname' && (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Alright {firstName}, let me size you up...
            </h2>
          </div>

          <div className="bg-gray-700 border-2 border-green-600 rounded-lg p-6">
            <p className="text-lg mb-4 text-green-400">Here's what I know about you:</p>
            <div className="space-y-2 text-gray-300 mb-4">
              <p>• Lives in {locationData.state} (that explains a lot)</p>
              <p>• Cuts at {equipmentData.hoc}" {parseFloat(equipmentData.hoc) > 1.5 ? '(way too high, son)' : parseFloat(equipmentData.hoc) < 0.5 ? '(scalping it, I see)' : '(decent height)'}</p>
              <p>• Uses a {equipmentData.mower} {equipmentData.mower?.includes('reel') ? '(fancy pants)' : '(basic but it works)'}</p>
              <p>• Growing {equipmentData.grassType} {equipmentData.grassType?.includes('bermuda') ? '(good choice)' : '(interesting choice...)'}</p>
              {equipmentData.sprayer === 'none' ? 
                <p>• No sprayer (granular warrior, eh?)</p> : 
                <p>• Has a {equipmentData.sprayer} sprayer (at least you can spray)</p>
              }
              {statusData?.issues?.length > 0 && (
                <p className="text-red-400">• Current problems: {statusData.issues.join(', ')} (yikes!)</p>
              )}
            </div>
            
            <div className="border-t border-gray-600 pt-4">
              <p className="text-xl font-bold text-green-400">
                Your permanent nickname is:
              </p>
              <p className="text-4xl font-black text-green-300 mt-3 text-center py-4">
                {nickname || 'GeneratingNickname...'}
              </p>
              <p className="text-sm text-gray-400 mt-4 text-center">
                That's what I'm calling you from now on. Deal with it.
              </p>
            </div>
          </div>

          <BudSays 
            message={`Look ${nickname}, I call 'em like I see 'em. This nickname is based on your actual lawn situation. And notice there's no back button - once you get a nickname, that's it. Now quit whining and let's get your account set up before your grass gets any worse.`}
            variant="warning"
          />

          <div className="text-center">
            <Button onClick={() => setStage('account')} size="lg">
              Fine, Set Up My Account
            </Button>
            <p className="text-xs text-gray-500 mt-2">No going back now!</p>
          </div>
        </>
      )}

      {stage === 'account' && (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-4">Create Your Account</h2>
            <p className="text-gray-600">
              Username: <span className="font-bold text-green-700">{nickname}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={loading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={loading}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type it again"
                disabled={loading}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleAccountCreation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Account...' : 'Create Account & Continue'}
          </Button>
        </>
      )}
    </div>
  );
}