import React from 'react';

interface StepWizardProps {
  currentStep: number;
  setStep: (step: number) => void;
}

const steps = [
  { id: 1, label: 'SELECT' },
  { id: 2, label: 'TARGET' },
  { id: 3, label: 'CONFIGURE' },
  { id: 4, label: 'DEPLOY' },
];

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, setStep }) => {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="relative mb-8 px-4 md:px-12 w-full max-w-4xl mx-auto z-30">
        <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full -z-20"></div>
            
            {/* Active Progress Line */}
            <div 
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-orange-600 rounded-full -z-10 transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
            ></div>

            {steps.map((step) => {
                const isActive = step.id <= currentStep;
                const isCurrent = step.id === currentStep;
                
                return (
                    <div 
                        key={step.id} 
                        className={`flex flex-col items-center cursor-pointer group ${step.id < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={() => step.id < currentStep && setStep(step.id)}
                    >
                        <div 
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 border-2 transition-all duration-300
                                ${isActive 
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                                    : 'bg-slate-800 text-slate-500 border-slate-600'
                                }
                                ${isCurrent ? 'scale-110' : ''}
                            `}
                        >
                            {step.id < currentStep ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                step.id
                            )}
                        </div>
                        <span 
                            className={`
                                text-[10px] md:text-xs font-bold mt-2 uppercase tracking-wide transition-colors duration-300
                                ${isActive ? 'text-orange-500' : 'text-slate-600'}
                            `}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    </div>
  );
};
