import { useState } from 'react';
import { MapPin, ChevronRight, Sparkles, Clock, Target, CheckCircle2 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWeatherStore } from '@/stores/weatherStore';

type OnboardingStep = 'welcome' | 'name' | 'location' | 'complete';

const STEPS: OnboardingStep[] = ['welcome', 'name', 'location', 'complete'];

export function Onboarding() {
  const { onboardingComplete, userName, setUserName, completeOnboarding } = useSettingsStore();
  const { loadWeather } = useWeatherStore();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [nameInput, setNameInput] = useState(userName);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  // Don't show if onboarding is complete
  if (onboardingComplete) {
    return null;
  }

  const currentStepIndex = STEPS.indexOf(currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      goToNextStep();
    }
  };

  const handleRequestLocation = async () => {
    setIsRequestingLocation(true);
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
        });
      });

      // Fetch weather with the location
      await loadWeather();
      setLocationGranted(true);

      // Auto-advance after a brief delay
      setTimeout(() => {
        goToNextStep();
      }, 1000);
    } catch {
      // User denied or error - just move on
      goToNextStep();
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleSkipLocation = () => {
    goToNextStep();
  };

  const handleComplete = () => {
    completeOnboarding();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to Hour One
            </h1>
            <p className="text-lg text-white/70 max-w-md mx-auto mb-8">
              Your new tab, redesigned to help you focus on what matters most.
            </p>

            <button
              onClick={goToNextStep}
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-full transition-all hover:scale-105 shadow-lg shadow-accent/25"
            >
              Get Started
              <ChevronRight size={20} />
            </button>
          </div>
        );

      case 'name':
        return (
          <div className="text-center">
            <div className="mb-6">
              <span className="text-6xl">👋</span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              What's your name?
            </h2>
            <p className="text-white/60 mb-8">
              We'll use this to personalize your greeting
            </p>

            <div className="max-w-sm mx-auto mb-6">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Enter your name"
                autoFocus
                className="w-full px-6 py-4 text-xl text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>

            <button
              onClick={handleNameSubmit}
              disabled={!nameInput.trim()}
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-full transition-all hover:scale-105 shadow-lg shadow-accent/25 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight size={20} />
            </button>
          </div>
        );

      case 'location':
        return (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                locationGranted
                  ? 'bg-green-500/20'
                  : 'bg-white/10'
              }`}>
                {locationGranted ? (
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                ) : (
                  <MapPin className="w-10 h-10 text-white/80" />
                )}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Enable Weather?
            </h2>
            <p className="text-white/60 mb-8 max-w-sm mx-auto">
              Allow location access to see local weather on your dashboard
            </p>

            {locationGranted ? (
              <div className="text-green-400 font-medium mb-6">
                Location enabled! Loading weather...
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-xs mx-auto">
                <button
                  onClick={handleRequestLocation}
                  disabled={isRequestingLocation}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-full transition-all hover:scale-105 shadow-lg shadow-accent/25 disabled:opacity-50"
                >
                  {isRequestingLocation ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <MapPin size={20} />
                      Enable Location
                    </>
                  )}
                </button>
                <button
                  onClick={handleSkipLocation}
                  className="px-6 py-2 text-white/60 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
              </div>
            )}
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <Target className="w-10 h-10 text-green-400" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              You're all set, {userName || 'friend'}!
            </h2>
            <p className="text-white/60 mb-8 max-w-sm mx-auto">
              Your personalized dashboard is ready. Start each day with clarity and focus.
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8 text-sm">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-white/70">Time & Date</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <Target className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-white/70">Daily Focus</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <Sparkles className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-white/70">Inspiration</p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-full transition-all hover:scale-105 shadow-lg shadow-accent/25"
            >
              Start Using Hour One
              <ChevronRight size={20} />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-accent/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-4 px-8 py-12">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-12">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStepIndex
                  ? 'w-8 bg-accent'
                  : index < currentStepIndex
                  ? 'w-4 bg-white/40'
                  : 'w-4 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step content with fade animation */}
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animation: 'fadeSlideIn 400ms ease-out' }}
        >
          {renderStepContent()}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
