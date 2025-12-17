import React, { useState } from 'react';
import { AppDefinition } from '../types';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import yaml from 'js-yaml';

interface YamlInputProps {
    onBack: () => void;
    onNext: (app: AppDefinition) => void;
}

export const YamlInput: React.FC<YamlInputProps> = ({ onBack, onNext }) => {
    const [content, setContent] = useState('');
    const [name, setName] = useState('');

    const handleContinue = () => {
        if (!content || !name) return;
        
        let detectedPorts = "8080:80"; 
        let detectedVolume = "";
        let detectedEnv: Record<string, string> = {};

        try {
            const doc = yaml.load(content) as any;
            if (doc && doc.services) {
                // Iterate services to find configurations
                for (const key of Object.keys(doc.services)) {
                    const svc = doc.services[key];
                    
                    // 1. Detect Ports (First valid found)
                    if (svc.ports && Array.isArray(svc.ports) && svc.ports.length > 0 && detectedPorts === "8080:80") {
                        const portEntry = svc.ports[0];
                        let portStr = '';
                        
                        if (typeof portEntry === 'string' || typeof portEntry === 'number') {
                             portStr = portEntry.toString();
                        } else if (typeof portEntry === 'object' && portEntry.published && portEntry.target) {
                             portStr = `${portEntry.published}:${portEntry.target}`;
                        }

                        if (portStr) {
                            const parts = portStr.split(':');
                            if (parts.length >= 2) {
                                detectedPorts = `${parts[parts.length-2]}:${parts[parts.length-1]}`;
                            } else {
                                detectedPorts = `${parts[0]}:${parts[0]}`;
                            }
                        }
                    }

                    // 2. Detect Volumes (First valid path found)
                    if (svc.volumes && Array.isArray(svc.volumes) && !detectedVolume) {
                        for (const volEntry of svc.volumes) {
                            let volStr = '';
                            if (typeof volEntry === 'string') {
                                volStr = volEntry;
                            } else if (typeof volEntry === 'object' && volEntry.source) {
                                volStr = volEntry.source;
                            }

                            if (volStr) {
                                // Extract host path (left side of :)
                                const parts = volStr.split(':');
                                if (parts.length > 0 && (parts[0].startsWith('/') || parts[0].startsWith('.'))) {
                                    detectedVolume = parts[0];
                                    break; // Found a valid volume
                                }
                            }
                        }
                    }

                    // 3. Detect Environment Variables (Merge all)
                    if (svc.environment) {
                        if (Array.isArray(svc.environment)) {
                            // Handle ["KEY=VAL", ...]
                            svc.environment.forEach((env: string) => {
                                const parts = env.split('=');
                                const k = parts[0];
                                const v = parts.slice(1).join('=');
                                if (k) detectedEnv[k] = v;
                            });
                        } else if (typeof svc.environment === 'object') {
                            // Handle { KEY: VAL }
                            Object.assign(detectedEnv, svc.environment);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("YAML Parse error:", e);
        }

        const customApp: AppDefinition = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            description: 'Custom imported YAML application',
            image: 'https://picsum.photos/seed/custom/200/200', // Placeholder
            category: 'Custom',
            compose: content,
            port_map: detectedPorts,
            volume_map: detectedVolume || './data',
            env_vars: detectedEnv
        };
        onNext(customApp);
    };

    return (
        <div className="flex-grow p-6 md:p-10 bg-slate-900 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">Import YAML</h2>
                <p className="text-slate-400 mb-8">Paste your docker-compose.yml content directly.</p>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Application Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg focus:border-orange-500 focus:outline-none"
                            placeholder="My Custom App"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Docker Compose YAML</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-96 bg-slate-900 border border-slate-600 text-slate-300 font-mono text-sm p-4 rounded-lg focus:border-orange-500 focus:outline-none"
                            placeholder={"version: '3'\nservices:\n  ..."}
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-8">
                    <button onClick={onBack} className="px-6 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors flex items-center">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </button>
                    <button 
                        onClick={handleContinue}
                        disabled={!name || !content}
                        className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center"
                    >
                        Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};