"use client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Tooltip, Icons } from '@bermuda/ui';
import BudSays, { getStateTip } from '../../components/bud-says';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/auth-context';

// Step 1: User Profile & Experience Level
export function UserProfileStep({ onNext }: { onNext: (data: any) => void }) {
  const [userLevel, setUserLevel] = useState('');
  const [productSource, setProductSource] = useState('');
  const [applicationMethod, setApplicationMethod] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  
  const handleNext = () => {
    if (!userLevel || !productSource || !applicationMethod) {
      alert('Please fill in all fields');
      return;
    }
    onNext({ userLevel, productSource, applicationMethod, goals });
  };

  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.Gauge /> About You
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            Let's figure out what kind of lawn warrior you are. No judgment here - we all started somewhere.
          </BudSays>
          
          <div>
            <label className="block text-sm mb-2 font-medium">Experience Level</label>
            <Select value={userLevel} onChange={(e) => setUserLevel(e.target.value)}>
              <option value="">Select your experience...</option>
              <option value="beginner">Beginner - Just trying to keep it green</option>
              <option value="intermediate">Intermediate - I know the basics, want to level up</option>
              <option value="advanced">Advanced - I calculate GDD in my sleep</option>
              <option value="obsessed">Obsessed - My neighbors think I'm crazy (they're right)</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Where do you get products?</label>
            <Select value={productSource} onChange={(e) => setProductSource(e.target.value)}>
              <option value="">Select your source...</option>
              <option value="big-box">Big box stores (Home Depot, Lowe's)</option>
              <option value="local">Local garden centers</option>
              <option value="siteone">SiteOne or other professional suppliers</option>
              <option value="online">Online retailers (DoMyOwn, Yard Mastery, etc.)</option>
              <option value="mixed">Mix of everything above</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Application Method</label>
            <Select value={applicationMethod} onChange={(e) => setApplicationMethod(e.target.value)}>
              <option value="">Select your method...</option>
              <option value="granular-only">Granular only - spreader and done</option>
              <option value="liquid-curious">Liquid curious - thinking about spraying</option>
              <option value="liquid-beginner">Liquid beginner - pump sprayer warrior</option>
              <option value="liquid-advanced">Liquid advanced - battery backpack life</option>
              <option value="liquid-pro">Liquid pro - I have spray rig envy</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Goals (check all that apply)</label>
            <div className="space-y-2">
              {[
                { id: 'stripes', label: 'Perfect stripes' },
                { id: 'weed-free', label: 'Weed-free lawn' },
                { id: 'thick', label: 'Thick, dense turf' },
                { id: 'low-maintenance', label: 'Low maintenance' },
                { id: 'golf-green', label: 'Golf course quality' },
                { id: 'beat-neighbors', label: "Better than the neighbor's" },
                { id: 'learn', label: 'Just want to learn' },
              ].map(goal => (
                <label key={goal.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={goals.includes(goal.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGoals([...goals, goal.id]);
                      } else {
                        setGoals(goals.filter(g => g !== goal.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleNext} className="w-full">Next: Current Issues</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 2: Current Lawn Issues
export function LawnIssuesStep({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [lawnIssues, setLawnIssues] = useState<string[]>([]);
  const [otherIssue, setOtherIssue] = useState('');

  const issues = [
    { id: 'weeds', label: 'Weeds', tip: 'Pre-emergent timing is everything' },
    { id: 'disease', label: 'Disease/Fungus', tip: 'Fungicide rotation is key' },
    { id: 'thin', label: 'Thin/Bare spots', tip: 'Could be compaction or shade' },
    { id: 'shade', label: 'Shade problems', tip: 'Bermuda needs 6+ hours of sun' },
    { id: 'compaction', label: 'Soil compaction', tip: 'Core aeration helps' },
    { id: 'thatch', label: 'Thatch buildup', tip: 'Dethatch or verticut needed' },
    { id: 'grubs', label: 'Grubs/Insects', tip: 'Check for army worms in fall' },
    { id: 'animals', label: 'Animal damage', tip: 'Dogs, moles, or armadillos?' },
    { id: 'drainage', label: 'Drainage issues', tip: 'Standing water kills Bermuda' },
    { id: 'color', label: 'Poor color', tip: 'Usually nitrogen or iron deficiency' },
    { id: 'growth', label: 'Slow growth', tip: 'Check soil temps and pH' },
    { id: 'none', label: 'No major issues', tip: "Lucky you! Let's keep it that way" },
  ];

  const handleNext = () => {
    onNext({ lawnIssues, otherIssue });
  };

  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.AlertTriangle /> Current Lawn Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            Every lawn has problems. Admitting them is the first step. Check all that apply - I won't judge.
          </BudSays>

          <div>
            <label className="block text-sm mb-3 font-medium">What are you battling?</label>
            <div className="space-y-2">
              {issues.map(issue => (
                <label key={issue.id} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lawnIssues.includes(issue.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLawnIssues([...lawnIssues, issue.id]);
                      } else {
                        setLawnIssues(lawnIssues.filter(i => i !== issue.id));
                      }
                    }}
                    className="rounded mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{issue.label}</span>
                    <span className="text-xs text-muted block">{issue.tip}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 font-medium">Other issues?</label>
            <Input 
              placeholder="Describe any other problems..." 
              value={otherIssue}
              onChange={(e) => setOtherIssue(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={handleNext} className="flex-1">Next: Legal Stuff</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3: Legal Disclaimer
export function DisclaimerStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const handleNext = () => {
    if (!accepted || !understood) {
      alert('You must accept the disclaimer and confirm understanding to continue');
      return;
    }
    onNext();
  };

  return (
    <Card className="bb-clay">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.AlertTriangle /> Legal Disclaimer & Waiver
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <BudSays>
            I'm about to get serious for a minute. This is important - read it all.
          </BudSays>

          <div className="bg-black/20 rounded-lg p-4 space-y-4 text-sm">
            <h3 className="font-semibold text-base">IMPORTANT DISCLAIMER</h3>
            
            <div className="space-y-3">
              <p>
                <strong>INFORMATIONAL PURPOSES ONLY:</strong> Bermuda Buddy provides information and recommendations for educational purposes only. All product applications, mixing instructions, and lawn care advice are suggestions based on general best practices.
              </p>
              
              <p>
                <strong>YOUR RESPONSIBILITY:</strong> You are solely responsible for:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Reading and following all product labels (THE LABEL IS THE LAW)</li>
                <li>Complying with federal, state, and local regulations</li>
                <li>Obtaining necessary licenses or certifications for restricted-use products</li>
                <li>Proper use of personal protective equipment (PPE)</li>
                <li>Safe storage and disposal of chemicals</li>
                <li>Any damage to your property, lawn, or surrounding environment</li>
              </ul>

              <p>
                <strong>NO WARRANTIES:</strong> Information is provided "as is" without warranties of any kind. Environmental conditions, application errors, product quality, and other factors beyond our control can affect results.
              </p>

              <p>
                <strong>CHEMICAL SAFETY:</strong> Many lawn care products are hazardous. Always:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Keep out of reach of children and pets</li>
                <li>Never mix products unless labels specifically allow</li>
                <li>Follow re-entry intervals after applications</li>
                <li>Consider environmental impacts on pollinators, waterways, and wildlife</li>
              </ul>

              <p>
                <strong>LIMITATION OF LIABILITY:</strong> Bermuda Buddy, its creators, and contributors shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this application or following its recommendations.
              </p>

              <p>
                <strong>PROFESSIONAL CONSULTATION:</strong> When in doubt, consult with local extension services, certified agronomists, or licensed lawn care professionals.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="rounded mt-0.5"
              />
              <span className="text-sm">
                I accept this disclaimer and understand that I am solely responsible for my actions and any consequences thereof.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                className="rounded mt-0.5"
              />
              <span className="text-sm">
                I understand that THE LABEL IS THE LAW and I will always read and follow product labels.
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button onClick={handleNext} className="flex-1" disabled={!accepted || !understood}>
              I Understand - Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}