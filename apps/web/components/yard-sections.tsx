"use client";
import { useState, useRef, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@bermuda/ui';
import Image from 'next/image';

interface YardSection {
  id: string;
  name: string;
  area: number;
  lastPhoto?: string;
  photos: string[];
}

export function YardSections() {
  const [sections, setSections] = useState<YardSection[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [selectedSection, setSelectedSection] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);

  // Load sections from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bb_yard_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSections(parsed);
      } else {
        // Load from onboarding zones if available
        const onboardingData = localStorage.getItem('bb_onboarding');
        if (onboardingData) {
          const data = JSON.parse(onboardingData);
          if (data.location?.zones && data.location.zones.length > 0) {
            setSections(data.location.zones.map((zone: any) => ({
              id: zone.id || Math.random().toString(36),
              name: zone.name,
              area: zone.area,
              photos: []
            })));
          }
        }
      }
    } catch {}
  }, []);

  const handlePhotoUpload = (sectionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const photoUrl = reader.result as string;
      
      setSections(prev => {
        const updated = prev.map(section => {
          if (section.id === sectionId) {
            // Keep only last 20 photos
            const photos = [photoUrl, ...section.photos].slice(0, 20);
            return {
              ...section,
              lastPhoto: photoUrl,
              photos
            };
          }
          return section;
        });
        
        // Save to localStorage
        try {
          localStorage.setItem('bb_yard_sections', JSON.stringify(updated));
        } catch {}
        
        return updated;
      });
    };
    
    reader.readAsDataURL(file);
    setUploadingSection(null);
  };

  if (sections.length === 0) {
    return (
      <Card className="bb-clay">
        <CardHeader>
          <CardTitle>My Yard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted">
            <p className="mb-4">No yard sections mapped yet.</p>
            <p className="text-sm">Complete onboarding to map your yard sections</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bb-clay">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Yard</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'single' ? 'default' : 'ghost'}
              onClick={() => setViewMode('single')}
            >
              Single View
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              All Sections
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'single' ? (
          <div className="space-y-4">
            {/* Section selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sections.map((section, idx) => (
                <Button
                  key={section.id}
                  size="sm"
                  variant={selectedSection === idx ? 'default' : 'ghost'}
                  onClick={() => setSelectedSection(idx)}
                  className="whitespace-nowrap"
                >
                  {section.name}
                  <span className="ml-2 text-xs opacity-70">
                    {section.area.toLocaleString()} ft²
                  </span>
                </Button>
              ))}
            </div>

            {/* Selected section display */}
            <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
              {sections[selectedSection]?.lastPhoto ? (
                <img
                  src={sections[selectedSection].lastPhoto}
                  alt={sections[selectedSection].name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted mb-2">No photo yet</p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setUploadingSection(sections[selectedSection].id);
                        fileInputRef.current?.click();
                      }}
                    >
                      Upload Photo
                    </Button>
                  </div>
                </div>
              )}
              
              {sections[selectedSection]?.lastPhoto && (
                <Button
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => {
                    setUploadingSection(sections[selectedSection].id);
                    fileInputRef.current?.click();
                  }}
                >
                  Update Photo
                </Button>
              )}
            </div>

            {/* Photo history */}
            {sections[selectedSection]?.photos.length > 1 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">History ({sections[selectedSection].photos.length} photos)</div>
                <div className="flex gap-2 overflow-x-auto">
                  {sections[selectedSection].photos.slice(1, 6).map((photo, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 bg-black/10 rounded flex-shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#00ff00]"
                      onClick={() => {
                        setSections(prev => prev.map(s => 
                          s.id === sections[selectedSection].id 
                            ? { ...s, lastPhoto: photo }
                            : s
                        ));
                      }}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sections.map(section => (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{section.name}</span>
                  <span className="text-xs text-muted">{section.area.toLocaleString()} ft²</span>
                </div>
                <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
                  {section.lastPhoto ? (
                    <img
                      src={section.lastPhoto}
                      alt={section.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setUploadingSection(section.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        Add Photo
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (uploadingSection) {
              handlePhotoUpload(uploadingSection, e);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}