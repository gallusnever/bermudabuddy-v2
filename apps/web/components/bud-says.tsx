"use client";
import React, { useEffect, useState } from 'react';
import { cn } from '@bermuda/ui/lib/cn';

interface BudSaysProps {
  category?: keyof typeof budTips;
  message?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  children?: React.ReactNode;
  className?: string;
}

export default function BudSays({ category = 'general', message, variant, children, className }: BudSaysProps) {
  // Avoid hydration mismatch: render a deterministic tip on SSR, randomize after mount
  const [tipIndex, setTipIndex] = useState(0);
  const tips = budTips[category];
  const currentTip = children || message || tips[tipIndex];
  useEffect(() => {
    if (!children && !message) {
      setTipIndex(Math.floor(Math.random() * tips.length));
    }
    // Re-randomize when category changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);
  
  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % tips.length);
  };
  
  const prevTip = () => {
    setTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };
  
  return (
    <div className={cn("flex gap-3 items-start bb-card p-3 border-l-4 border-emerald-700/50", className)}>
      <img 
        src="/bud-close.png" 
        alt="Bud" 
        className="w-10 h-10 rounded-full flex-shrink-0 border border-emerald-700/30"
      />
      <div className="flex-1">
        <div className="text-xs font-medium text-emerald-400 mb-1">Bud says:</div>
        <div className="text-sm text-muted leading-relaxed">{currentTip}</div>
      </div>
      {!children && !message && (
        <div className="flex flex-col gap-1">
          <button 
            onClick={prevTip}
            className="text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
            aria-label="Previous tip"
          >
            ↑
          </button>
          <button 
            onClick={nextTip}
            className="text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
            aria-label="Next tip"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}

// Collection of Bud's wisdom - Hank Hill style dad humor
// "I tell you what" energy throughout
export const budTips = {
  login: [
    // Tough Love Edition
    "Back already, sport? Good—your lawn's been waiting like a disappointed father at curfew.",
    "Oh look who decided to show up. Your grass has been growing while you've been slacking, chief.",
    "Welcome back to the only app that'll tell you the truth: your lawn looks terrible and we both know it.",
    "Another day, another chance to prove you're not completely hopeless at this, buddy.",
    "You again? At least you're persistent—that's more than I can say for your fertilizing schedule.",
    "First time here? Congratulations on finally admitting you need help, son.",
    "New to this? Don't worry, I've seen worse—though not by much.",
    "So you finally realized YouTube videos weren't gonna save that disaster you call a yard, huh?",
    "Welcome, rookie. Time to learn why everything you think you know about grass is wrong.",
    "Sign up now before your neighbors start leaving passive-aggressive notes about property values.",
    "Wrong password AGAIN? Your memory's worse than your edging technique, and that's saying something.",
    "Can't remember your login? No wonder your lawn's a mess—you can't even remember to water it.",
    "Password incorrect, genius. Try using something other than 'password123' this time.",
    "Listen up, buttercup: grass doesn't care about your excuses, and neither do I.",
    "You know what separates good lawns from great ones? People who actually log in and do the work.",
    "Stop procrastinating, chief. Your dandelions are multiplying faster than your excuses.",
    "Every minute you waste here is another minute your crabgrass is plotting world domination.",
    "I've seen lawns recover from nuclear winter that looked better than yours. Let's fix that.",
    "You treat your lawn like you treat this app—sporadically and without commitment. We're changing that TODAY.",
    "Quit staring at the screen and let's go, sport. That patchy embarrassment isn't gonna fix itself.",
    // Dad Humor & Puns Edition
    "Welcome back! I'm rooting for you—and so should your grass be.",
    "Hey there, lawn ranger! Ready to raise the bar... and lower the blade?",
    "Look who's back for some grass-class education!",
    "Return of the sod-i? May the fescue be with you!",
    "Welcome back! Time to get down to grass tacks.",
    "New here? Don't worry, we'll help you grow into this.",
    "First timer? Seed you later, bad lawn—hello, paradise!",
    "Welcome aboard! This is where good lawns go to become lawn-gendary.",
    "New to Bermuda Buddy? You've made a grass-tastic decision!",
    "Just signed up? That's what I call using your shed!",
    "Forgot your password? Guess it wasn't deep-rooted in your memory!",
    "Having login troubles? Don't let it weigh you down like wet clippings.",
    "Password hint: It's not 'ILoveMulch'... though it should be.",
    "What do you call a grumpy lawn expert? Me, before coffee and after seeing your yard.",
    "Why don't lawns ever win at poker? Too many tells in the grass!",
    "I used to hate lawn care, but then it grew on me. Like your moss problem.",
    "What's a lawn's favorite music? Bluegrass, obviously!",
    "Why did the lawn break up with the gardener? He was always bringing up old mulch.",
    "I'm reading a book about anti-gravity lawn care. It's impossible to put down!",
    "Remember: Life's short, but your grass shouldn't be. Unless we're talking about height, then absolutely."
  ],
  dashboard: [
    "That lawn ain't gonna mow itself, but at least you can track when to feed it.",
    "A well-maintained Bermuda lawn is like a good propane tank - reliable and always ready.",
    "Remember: measure twice, spray once. Nobody likes a double-dosed lawn.",
    "Yep, that's your grass growing. Better check those numbers before it gets away from you.",
    "I've seen a lot of lawns in my day. This dashboard helps you not mess yours up.",
    "Weather data's like a fishing report - it changes, but patterns don't lie.",
    "If your soil's colder than your beer, your grass ain't growing.",
    "Those numbers ain't just for show. They're telling you what your grass needs.",
    "A dashboard without data is like a grill without propane - useless.",
    "Check this every morning with your coffee. Consistency beats perfection.",
    "Red numbers mean trouble. Green numbers mean you're doing something right.",
    "That forecast ain't a guarantee. Weather changes faster than my neighbor's excuses.",
    "Soil moisture matters more than you think. Dry soil won't absorb chemicals properly.",
    "Watch those GDD numbers climb. Your grass is keeping score even if you ain't.",
  ],
  pgr: [
    "PGR is like telling your grass to take it easy for a bit. Sometimes we all need that.",
    "When that gauge hits red, it's time. Don't make me come over there.",
    "I tell you what - proper PGR timing is the difference between a lawn and a putting green.",
    "GDD stands for Growing Degree Days. It's how grass measures time, like dog years but for turf.",
    "That gauge ain't for show. When it says reapply, you reapply. Trust the science.",
    "Skip PGR and you'll be mowing twice a week. I got better things to do, don't you?",
    "T-Nex is like cruise control for your grass. Set it and forget it.",
    "200 GDD between apps keeps things tight. Like a military haircut for your lawn.",
    "PGR in the heat of summer? That's asking for trouble. Cool mornings only.",
    "Double-dosing PGR is like double-dating - sounds good in theory, disaster in practice.",
    "Missing a PGR app is like missing a haircut appointment. You'll regret it in a week.",
    "That regulation gauge ain't a suggestion. It's science, and science don't lie.",
    "PGR makes grass thicker than my neighbor's skull. Use it wisely.",
    "Trinexapac-ethyl - try saying that three times fast. I just call it T-Nex.",
  ],
  spray: [
    "Wind over 10mph? That's a no from me, chief. Save your chemicals for a calmer day.",
    "Early morning or late evening - that's when the magic happens. Noon spraying is for amateurs.",
    "Rain in the forecast? Hold your horses there, partner. Give it 24 hours minimum.",
    "Temperature inversions are real, and they'll make your spray drift like a tumbleweed. Check the dewpoint.",
    "If you can't explain what you're spraying to your neighbor, you probably shouldn't be spraying it.",
    "3-10 mph is the sweet spot. Too calm and droplets hang, too windy and they travel.",
    "That yellow flag means caution for a reason. It ain't a suggestion.",
    "Spray when the dew's on if you want. Just know you're wasting half your product.",
    "Check wind at boom height, not your weather app. Big difference.",
    "If you see your spray drifting, stop. Your neighbor's roses didn't sign up for this.",
  ],
  mix: [
    "Always add chemicals to water, not water to chemicals. It's like beer - pour it wrong and you'll have a mess.",
    "A clean sprayer is a happy sprayer. Rinse it like your mother-in-law is watching.",
    "Label rates aren't suggestions, they're the law. Don't be that guy who thinks he knows better.",
    "Jar test first if you're mixing products. Better to ruin a mason jar than your whole lawn.",
    "PPE ain't optional. I don't care if it's hot - wear your gloves and long sleeves.",
    "Mix order matters: water, then dry, then liquid. Like making pancakes.",
    "That foam ain't good. Add some defoamer before you look like a bubble bath.",
    "Calculate twice, mix once. Math errors kill grass.",
    "If it looks like cottage cheese in the jar, it'll clog your sprayer. Guaranteed.",
    "Never mix what you can't spray today. Chemical soup don't keep overnight.",
  ],
  weather: [
    "Soil temp below 65°F? Your Bermuda's taking a nap. Let it sleep.",
    "That dewpoint tells you more than you'd think. High humidity means slow drying and happy fungus.",
    "ET rate's high? Your grass is thirstier than me at a Texas Rangers game in July.",
    "Wind gusts are the sneaky ones. Your spray can says 10mph max, that includes the gusts.",
    "Precip probability over 30%? That's a maybe, which in lawn care means no.",
  ],
  general: [
    "The best fertilizer is the homeowner's footprints. Get out there and inspect.",
    "Bermuda grass is tough, but it ain't invincible. Treat it with respect.",
    "If it ain't in the soil test, you're just guessing. And guessing ain't lawn care.",
    "A dull mower blade tears grass like a bad breakup. Keep it sharp.",
    "Water deep and infrequent. Your grass needs roots, not a drinking problem.",
    "Bermuda likes it hot. If you don't, maybe consider astroturf.",
    "That brown patch ain't always fungus. Sometimes it's just dog pee.",
    "Stripe patterns are nice, but healthy grass is nicer. Priorities, people.",
    "Your lawn's only as good as your weakest zone. Fix problems, don't hide 'em.",
    "If you're not taking pictures of your grass, are you even trying?",
  ],
  technical: [
    "ET0 means evapotranspiration - fancy word for how much water your grass sweats out.",
    "GDD is like a speedometer for grass growth. Higher the number, faster it's growing.",
    "That soil temp is measured at root level. It's what your grass actually feels.",
    "PPM means parts per million. Think of it like drops of food coloring in a swimming pool.",
    "Dew point is when the air can't hold any more water. Like a sponge that's full.",
    "Micronutrients are like vitamins for grass. You don't need much, but without 'em, things go south.",
    "Soil pH affects everything. Too high or low and your grass can't eat, no matter how much you feed it.",
    "CEC is your soil's ability to hold nutrients. Sandy soil is like a leaky bucket.",
    "N-P-K: Nitrogen for green, Phosphorus for roots, Potassium for drought tolerance. Simple as that.",
    "Pre-emergent works like birth control for weeds. Timing is everything.",
  ],
  application: [
    "Log every application. The EPA ain't known for their sense of humor.",
    "Print your garage sheets. When something goes wrong, you'll want proof you did it right.",
    "Date, rate, and weather conditions. Document like your neighbor's lawyer is watching.",
    "Keep labels for 2 years minimum. It's not paranoia if they're really checking.",
    "Batch applications save time. Single apps give you more control. Choose wisely.",
    "Never apply the same product back-to-back without checking the label interval.",
    "Track your nitrogen. Too much and you'll be mowing every other day.",
    "Rain within 24 hours? That application might as well be money down the drain.",
    "Temperature matters. Some products don't work below 60°F. Physics doesn't care about your schedule.",
    "If you didn't write it down, it didn't happen. Trust me on this one.",
  ],
  equipment: [
    "Clean your sprayer after every use. Herbicide residue is how you get dead spots.",
    "Calibrate yearly minimum. Sprayer tips wear out like everything else.",
    "TeeJet nozzles ain't cheap, but they're cheaper than redoing your whole lawn.",
    "Battery sprayers are convenient. Pump sprayers are reliable. CO2 is for professionals.",
    "Check your filters. A clogged filter means uneven application.",
    "Mark your mixing bucket 'CHEMICALS ONLY' unless you want a real interesting salad.",
    "Store chemicals in a locked cabinet. Kids and pets don't read labels.",
    "That foam in your tank ain't good. Get some defoamer before you look like a car wash.",
    "Replace your hoses every few years. Chemical degradation is real.",
    "A good spreader is worth its weight in gold. A bad one will stripe your lawn like a zebra.",
  ]
};

// Get a random tip from a category
export function getRandomTip(category: keyof typeof budTips): string {
  const tips = budTips[category];
  return tips[Math.floor(Math.random() * tips.length)];
}

// State-specific tips for when users enter their location
export const stateBudTips: Record<string, string[]> = {
  TX: [
    "Everything's bigger in Texas, including the Bermuda grass problems. Y'all ready for this?",
    "TifTuf was developed at UGA, but Texas A&M's Tifway 419 still covers Kyle Field. Gig 'em!",
    "Celebration Bermuda was bred right here in Texas. It's tougher than a two-dollar steak.",
    "If your grass can survive a Texas summer, it can survive anything. Even your neighbor's jealousy.",
    "DFW gets 37 inches of rain a year. Houston gets that in a weekend. Plan accordingly.",
    "Remember the Alamo, and remember to water deep and infrequent. Texas roots run deep.",
    "Hook 'em or Gig 'em, we can all agree: St. Augustine is for quitters.",
    "Cowboys Stadium has Matrix Helix turf. Your backyard has potential. Let's close that gap.",
    "Texas has 5 climate zones. Your grass doesn't care about any of 'em when it's 105°F.",
    "From Amarillo to Brownsville, if it ain't Bermuda, it ain't trying hard enough."
  ],
  OK: [
    "Tahoma 31 was invented at Oklahoma State. Too bad they don't play championships on it.",
    "Boomer Sooner, but your Bermuda grows faster. At least something's winning consistently.",
    "Oklahoma: where the wind comes sweeping down the plain... and dries out your grass.",
    "OSU developed Latitude 36, the most cold-hardy Bermuda. Pistol Pete would be proud.",
    "Red River Showdown uses Tifway 419. Your lawn can handle the same drama, minus the flags.",
    "Oklahoma invented parking meters and shopping carts. Also, some damn fine Bermuda cultivars.",
    "If your grass survives an Oklahoma ice storm, it deserves a medal. Or at least some nitrogen.",
    "Norman gets 38 inches of rain. Stillwater gets 36. Your sprinkler makes up the difference.",
    "The Dust Bowl taught us: bare soil is the enemy. Keep that Bermuda thick.",
    "Oklahoma State turfgrass program is world-class. Your lawn should show some respect."
  ],
  AL: [
    "Roll Tide or War Eagle, we can all agree: Bermuda grass is king in Alabama.",
    "Bryant-Denny Stadium uses Tifway 419. If it's good enough for Saban, it's good enough for you.",
    "Alabama humidity: where your grass grows faster than Auburn's excuses.",
    "TifGrand was developed at Tifton, but Alabama perfected growing it. Trust the process.",
    "Iron Bowl grass takes a beating. Your lawn just has to survive the kids.",
    "Mobile invented Mardi Gras, and your Bermuda invented ways to survive 100% humidity.",
    "From Muscle Shoals to Mobile Bay, if it ain't green, you ain't trying.",
    "Alabama red clay: harder to work with than Saban's playbook, but worth it.",
    "Bear Bryant said 'Defense wins championships.' I say 'Pre-emergent prevents championships... for weeds.'",
    "Gulf Shores has the beaches, but your Bermuda can be just as pristine. Almost."
  ],
  MS: [
    "Mississippi State cowbells can't wake up dormant Bermuda. Only warm soil temps can do that.",
    "Hotty Toddy! Your grass needs a toddy too - mix up some liquid fertilizer.",
    "The Grove at Ole Miss is Kentucky Bluegrass. Rebels gonna rebel, but Bermuda's still better.",
    "Mississippi: where the humidity is made up and the rain gauge don't matter.",
    "Egg Bowl rivalry is intense, but not as intense as your Bermuda vs. the summer heat.",
    "Delta blues and Bermuda grass - both Mississippi originals that spread everywhere.",
    "From Tupelo to Biloxi, if Elvis were alive, he'd have Bermuda at Graceland.",
    "Mississippi River's mighty, but your Bermuda's root system goes deeper.",
    "State motto: 'Virtute et Armis'. Your lawn motto: 'Nitrogen and Iron'.",
    "Southern Miss Golden Eagles fly high. Your Bermuda should stay low - mow often."
  ],
  GA: [
    "UGA's had Bermuda since before Uga I. That's 10 bulldogs and counting.",
    "TifTuf, TifGrand, TifEagle - Georgia's given more to golf than Tiger Woods.",
    "Augusta National: where Bermuda goes to show off. Your lawn: where it goes to work.",
    "Between the hedges grows Tifway 419. Between your hedges should too.",
    "Sanford Stadium's grass has seen glory. Your lawn's seen... well, let's work on that.",
    "The Masters uses 'Augusta' Bermuda on tees. You use whatever Home Depot had on sale.",
    "Georgia red clay: proof that God has a sense of humor about soil conditions.",
    "From Savannah to Atlanta, if it's green and tough, it's probably Bermuda.",
    "Peach State? More like Bermuda State. Those peaches need good grass underneath.",
    "Tech's field is artificial. Real champions grow Bermuda. Go Dawgs!"
  ],
  FL: [
    "Florida Bermuda deals with things Arkansas Bermuda can't even spell. Like hurricanes.",
    "The Swamp has Celebration Bermuda. Your swamp... er, yard... should too.",
    "St. Augustine is Florida's favorite, but Bermuda's tougher. Like comparing Tebow to Spurrier.",
    "From the Panhandle to the Keys, if it survives salt spray, it's championship material.",
    "Disney World's Bermuda is perfect. Of course, they also have a staff of 500.",
    "Florida State's field is immaculate. Your field has that one spot the dog likes. We'll work with it.",
    "Miami hurricanes are temporary. Your Bermuda is forever. Well, till the HOA complains.",
    "Doak Campbell Stadium: Latitude 36 Bermuda. Your latitude: probably needs different grass.",
    "Florida humidity is just the air giving your grass a drink. You're welcome.",
    "Gators, Seminoles, Hurricanes - they all play on Bermuda. Because it's the GOAT."
  ],
  LA: [
    "LSU's Tiger Stadium: Celebration Bermuda. Death Valley never looked so good.",
    "Louisiana: where your grass grows faster than a Cajun can say 'Geaux Tigers'.",
    "Mardi Gras beads are temporary. Your Bermuda should be permanent.",
    "New Orleans jazz is improvisation. Your lawn care should not be. Stick to the schedule.",
    "From Shreveport to the Big Easy, if it handles humidity, it's probably thriving.",
    "Bayou Bermuda hits different. Literally - it grows different in all this moisture.",
    "Louisiana hot sauce has nothing on August's effect on your grass. Both make you sweat.",
    "Saints' Superdome is artificial. Real Who Dats grow Bermuda at home.",
    "If your Bermuda survives a Louisiana summer, it could survive nuclear winter.",
    "Crawfish boils on the lawn are tradition. Pre-emergent the next day should be too."
  ],
  AR: [
    "Razorback Stadium has Bermuda tougher than a $2 steak from Texarkana.",
    "Woo Pig Sooie! But keep those pigs off the Bermuda. It's not that tough.",
    "Arkansas: where the Ozarks meet the Delta, and your Bermuda meets reality.",
    "From Fayetteville to Little Rock, if it's green in July, you're doing something right.",
    "Natural State, natural grass. Keep it Bermuda, keep it beautiful.",
    "Diamond Hogs play on Bermuda. Your backyard diamond should too.",
    "Arkansas weather: four seasons, sometimes in one day. Your Bermuda just deals with it.",
    "Walmart started here. So did your neighbor's dandelion problem. Pre-emergent, people!",
    "Buffalo River's beautiful, but your Bermuda should be the real attraction.",
    "If it's good enough for Jerry Jones' childhood home, it's good enough for you."
  ],
  NC: [
    "Duke, UNC, State - they fight on the court but agree on Bermuda for their fields.",
    "Tobacco Road's gone, but your Bermuda's here to stay. Times change, grass doesn't.",
    "Panthers' Bank of America Stadium: Bermuda. Your bank account after lawn care: different story.",
    "From Outer Banks to Asheville, elevation changes but Bermuda dedication shouldn't.",
    "North Carolina: First in Flight, first to realize Bermuda beats Fescue every time.",
    "Research Triangle's smart, but not smart enough to find a better grass than Bermuda.",
    "Charlotte humidity makes your grass grow like Duke's championship banners. Consistently.",
    "Pinehurst #2 has Bermuda greens. Your yard has... potential. Let's work on that.",
    "Blue Ridge Parkway's pretty, but have you seen properly striped Bermuda? Poetry.",
    "ACC headquarters knows: when it comes to grass, Bermuda runs this conference."
  ],
  SC: [
    "Clemson's Death Valley: Bermuda so nice, it makes the rock jealous.",
    "South Carolina knows: Palmetto trees are the state tree, but Bermuda's the state grass.",
    "From Myrtle Beach to Greenville, if it's tough enough for tourists, it's Bermuda.",
    "Gamecocks and Tigers agree on nothing except this: Bermuda beats everything else.",
    "Fort Sumter started the Civil War. Your unmowed Bermuda might start one with the HOA.",
    "Charleston's older than your country. Your Bermuda's older than your problems.",
    "Hilton Head golf courses: where Bermuda goes to retire and look fantastic doing it.",
    "South Carolina humidity: proof that air can be a liquid and grass can be a jungle.",
    "Your Bermuda's tougher than Carolina Reaper peppers and twice as likely to spread.",
    "If it survives a Myrtle Beach spring break, it can survive your backyard barbecue."
  ],
  TN: [
    "Neyland Stadium's Bermuda has seen more victories than your fantasy football team.",
    "Nashville's Music City, but your Bermuda's singing the real tune of the South.",
    "From Memphis to Knoxville, if Elvis and Dolly agree on it, it's gotta be Bermuda.",
    "Vanderbilt's smart enough to know: Bermuda's the SEC's real MVP.",
    "Tennessee whiskey's smooth, but not as smooth as fresh-cut Bermuda at sunrise.",
    "Smoky Mountains are gorgeous, but your striped Bermuda could compete for views.",
    "Rocky Top's a classic. So is properly maintained Tifway 419.",
    "Your Bermuda's tougher than moonshine and spreads faster than Nashville hot chicken's reputation.",
    "Titans' Nissan Stadium: Bermuda. Your backyard: should be Bermuda. See the pattern?",
    "If it's orange, it better be Tennessee. If it's green, it better be Bermuda."
  ]
};

// Get state-specific tips
export function getStateTip(stateCode: string): string | null {
  const tips = stateBudTips[stateCode.toUpperCase()];
  if (!tips || tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}
