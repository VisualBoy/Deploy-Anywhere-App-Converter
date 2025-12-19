import React, { useState } from 'react';
import { StepWizard } from './components/StepWizard';
import { AppLibrary } from './components/AppLibrary';
import { YamlInput } from './components/YamlInput';
import { SettingsPanel } from './components/SettingsPanel';
import { AppDetailsModal } from './components/AppDetailsModal';
import { TargetSelector } from './components/TargetSelector';
import { Configurator } from './components/Configurator';
import { DeploymentResult } from './components/DeploymentResult';
import { AppDefinition } from './types';
import { useRepoManager } from './hooks/useRepoManager';
import { useDeploymentManager } from './hooks/useDeploymentManager';
import { Settings, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedApp, setSelectedApp] = useState<AppDefinition | null>(null);
  const [isManualInput, setIsManualInput] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Business Logic Hooks
  const { 
    repositories, 
    isSyncingGlobal, 
    syncStatus, 
    syncRepos, 
    addRepo, 
    removeRepo 
  } = useRepoManager();

  const {
    config,
    target,
    updateConfig,
    initializeConfigForApp,
    handleTargetSelect,
    startDeployment,
    downloadScript,
    deploymentLog,
    deploying,
    deployed
  } = useDeploymentManager();

  const handleAppSelect = (app: AppDefinition) => {
    setSelectedApp(app);
    setIsDetailsModalOpen(true);
  };

  const handleProceedToConvert = () => {
    if (!selectedApp) return;
    setIsDetailsModalOpen(false);
    initializeConfigForApp(selectedApp);
    setCurrentStep(2);
  };

  const renderContent = () => {
      if (isManualInput) {
          return (
            <YamlInput 
                onBack={() => setIsManualInput(false)} 
                onNext={(app) => { setIsManualInput(false); setSelectedApp(app); setIsDetailsModalOpen(true); }} 
            />
          );
      }

      switch(currentStep) {
          case 1:
              return (
                  <AppLibrary 
                    repositories={repositories}
                    onSelectApp={handleAppSelect} 
                    onManualYaml={() => setIsManualInput(true)} 
                    onSync={() => syncRepos(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    isSyncing={isSyncingGlobal}
                    syncStatus={syncStatus}
                  />
              );
          
          case 2:
              return (
                  <TargetSelector 
                    selectedApp={selectedApp} 
                    target={target || config.target} 
                    onTargetSelect={handleTargetSelect} 
                    onBack={() => setCurrentStep(1)} 
                    onNext={() => setCurrentStep(3)} 
                  />
              );

          case 3:
              return (
                <Configurator 
                    selectedApp={selectedApp}
                    config={config}
                    setConfig={updateConfig}
                    onBack={() => setCurrentStep(2)}
                    onGenerate={() => { setCurrentStep(4); startDeployment(); }}
                />
              );

          case 4:
              return (
                  <DeploymentResult 
                    deployed={deployed}
                    deploying={deploying}
                    deploymentLog={deploymentLog}
                    config={config}
                    onStartOver={() => setCurrentStep(1)}
                    onDownload={downloadScript}
                  />
              );
          default:
              return null;
      }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-900 text-slate-200">
        <nav className="bg-slate-950 border-b border-slate-800 h-16 flex items-center justify-between px-6 shrink-0 z-50 shadow-md">
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ArrowRight className="w-6 h-6 rotate-45" /></div>
                <div><h1 className="text-lg font-bold text-white">Deploy Anywhere</h1><p className="text-[10px] text-orange-500 font-bold uppercase">App Converter</p></div>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"><Settings className="w-4 h-4 text-slate-400" /></button>
        </nav>
        
        <SettingsPanel 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            repositories={repositories} 
            onAddRepo={addRepo} 
            onRemoveRepo={removeRepo} 
            onSync={() => syncRepos(true)} 
            isSyncingExternal={isSyncingGlobal} 
            syncStatus={syncStatus}
        />

        <AppDetailsModal 
            app={selectedApp} 
            isOpen={isDetailsModalOpen} 
            onClose={() => setIsDetailsModalOpen(false)} 
            onConvert={handleProceedToConvert} 
        />

        {!isManualInput && <StepWizard currentStep={currentStep} setStep={setCurrentStep} />}
        
        <main className="flex-grow flex flex-col relative overflow-hidden">{renderContent()}</main>
    </div>
  );
}

export default App;