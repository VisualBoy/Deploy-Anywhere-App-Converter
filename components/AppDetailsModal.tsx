import React, { useRef, useState, useEffect } from 'react';
import { AppDefinition } from '../types';
import { X, Youtube, BookOpen, User, Code, Tag, Activity, ArrowRight, Globe, Github, LifeBuoy, ChevronLeft, ChevronRight, ImageIcon, ZoomIn } from 'lucide-react';

interface AppDetailsModalProps {
  app: AppDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onConvert: () => void;
}

export const AppDetailsModal: React.FC<AppDetailsModalProps> = ({ app, isOpen, onClose, onConvert }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // Reset lightbox when modal closes or app changes
  useEffect(() => {
    if (!isOpen) setLightboxImage(null);
  }, [isOpen, app]);

  if (!app) return null;

  const ensureAbsoluteUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const renderLinkField = (label: string, value: string | undefined, type: 'version' | 'author' | 'developer', icon: React.ReactNode, preferredLink?: string) => {
    const text = value || 'N/A';
    const isAvailable = text !== 'N/A' && text !== 'Community' && text !== 'Unknown';

    if (!isAvailable) {
        return (
            <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 text-xs flex items-center gap-1.5">{icon} {label}</span>
                <span className="text-slate-400 text-xs">{text}</span>
            </div>
        );
    }

    let href = text.startsWith('http') ? text : preferredLink;
    href = ensureAbsoluteUrl(href);

    if (type === 'version') {
        return (
            <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 text-xs flex items-center gap-1.5">{icon} {label}</span>
                {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-slate-200 text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded hover:bg-slate-700 transition-colors">
                        {text}
                    </a>
                ) : (
                    <span className="text-slate-200 text-xs font-mono bg-slate-800 px-1.5 py-0.5 rounded">{text}</span>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 text-xs flex items-center gap-1.5">{icon} {label}</span>
            {href ? (
                <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-all text-xs text-right truncate max-w-[140px] inline-flex items-center gap-1 justify-end"
                >
                    {text.startsWith('http') ? 'View Info' : text}
                </a>
            ) : (
                <span className="text-slate-300 text-xs text-right truncate max-w-[140px]">{text}</span>
            )}
        </div>
    );
  };

  const hasScreenshots = app.screenshots && app.screenshots.length > 0;

  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        <div className={`
          relative bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col transition-all duration-300
          ${isOpen ? 'scale-100' : 'scale-95'}
        `}>
          
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-850">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                <img src={app.image} alt={app.name} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-white leading-tight truncate">{app.name}</h2>
                <p className="text-orange-500 font-medium text-sm">{app.category}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all shrink-0">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 items-start">
              
              <div className="md:col-span-2 space-y-8">
                {/* Screenshot Carousel */}
                {hasScreenshots && (
                  <div className="relative group">
                    <div 
                      ref={scrollRef}
                      className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-4"
                    >
                      {app.screenshots?.map((src, idx) => (
                        <div 
                            key={idx} 
                            className="flex-shrink-0 w-[85%] md:w-[260px] aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 snap-start shadow-lg relative group/item cursor-zoom-in"
                            onClick={() => setLightboxImage(src)}
                        >
                          <img 
                            src={src} 
                            alt={`${app.name} screenshot ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/1280x720/1e293b/475569?text=Screenshot+${idx+1}`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/item:opacity-100">
                              <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Navigation Buttons */}
                    <button 
                      onClick={() => scroll('left')}
                      className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => scroll('right')}
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="flex justify-start gap-1 mt-1 px-1">
                      {app.screenshots?.map((_, idx) => (
                          <div key={idx} className="w-1 h-1 rounded-full bg-slate-800" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {app.tagline && (
                    <p className="text-xl font-bold text-slate-100 leading-tight border-l-4 border-orange-500 pl-4 py-1">
                      {app.tagline}
                    </p>
                  )}
                  
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                      About this app
                    </h3>
                    <p className="text-slate-400 leading-relaxed whitespace-pre-wrap text-sm">
                      {app.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {app.website && (
                      <a href={ensureAbsoluteUrl(app.website)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md hover:bg-slate-700 transition-all text-xs font-medium">
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    {app.repo_link && (
                      <a href={ensureAbsoluteUrl(app.repo_link)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md hover:bg-slate-700 transition-all text-xs font-medium">
                        <Github className="w-3.5 h-3.5" /> Source
                      </a>
                    )}
                    {app.support_link && (
                      <a href={ensureAbsoluteUrl(app.support_link)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md hover:bg-slate-700 transition-all text-xs font-medium">
                        <LifeBuoy className="w-3.5 h-3.5" /> Support
                      </a>
                    )}
                    {app.youtube && (
                      <a href={ensureAbsoluteUrl(app.youtube)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-md hover:bg-red-600 hover:text-white transition-all text-xs font-medium">
                        <Youtube className="w-3.5 h-3.5" /> Video
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Columns - Fixed Top Aligned */}
              <div className="space-y-6 self-start md:sticky md:top-0">
                <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 space-y-6 shadow-xl">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-3">
                    Specifications
                  </h3>
                  <div className="space-y-4">
                    {renderLinkField('Version', app.version, 'version', <Tag className="w-3.5 h-3.5" />, app.repo_link)}
                    {renderLinkField('Author', app.author, 'author', <User className="w-3.5 h-3.5" />, app.website)}
                    {renderLinkField('Developer', app.developer, 'developer', <Code className="w-3.5 h-3.5" />, app.website)}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1.5 font-bold uppercase tracking-tight"><Activity className="w-3.5 h-3.5" /> Port Map</span>
                      <span className="text-slate-200 text-xs font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{app.port_map || 'Dynamic'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5">
                  <p className="text-[9px] text-orange-400 font-black uppercase mb-2 tracking-widest">Conversion Ready</p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Convert this stack into a customized deployment script for Proxmox or a cleaned Docker Compose.
                  </p>
                </div>
                
                <div className="pt-2">
                  <button 
                      onClick={onConvert}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white px-6 py-4 rounded-xl font-bold shadow-2xl shadow-orange-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                  >
                      Convert Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-center text-[9px] text-slate-600 uppercase tracking-widest font-black">
             App Metadata & Reference Viewer
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div 
            className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fade-in"
            onClick={() => setLightboxImage(null)}
        >
            <button 
                className="absolute top-6 right-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors z-50 border border-slate-700"
                onClick={() => setLightboxImage(null)}
            >
                <X className="w-8 h-8" />
            </button>
            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                <img 
                    src={lightboxImage} 
                    alt="Fullscreen preview" 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-slate-800" 
                />
            </div>
        </div>
      )}
    </>
  );
};