'use client'

import { useState } from 'react'
import { SettingsSidebar, SettingsSection } from './settings-sidebar'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Import Sections
import { ProfileSettings } from './sections/ProfileSettings'
import { AccountSettings } from './sections/AccountSettings'
import { NotificationSettings } from './sections/NotificationSettings'
import { PrivacySettings } from './sections/PrivacySettings'
import { AppearanceSettings } from './sections/AppearanceSettings'
import { AISettings } from './sections/AISettings'
import { ImmersionSettings } from './sections/ImmersionSettings'
import { RoomDefaultsSettings } from './sections/RoomDefaultsSettings'
import { SecuritySettings } from './sections/SecuritySettings'
import { DataSettings } from './sections/DataSettings'
import { AudioSettings } from './sections/AudioSettings'
import { SystemSettings } from './sections/SystemSettings'
import { AccessibilitySettings } from './sections/AccessibilitySettings'
import { PreferencesSettings } from './sections/PreferencesSettings'
import { LanguageRegionSettings } from './sections/LanguageRegionSettings'
import { DeveloperSettings } from './sections/DeveloperSettings'

interface Profile {
  full_name: string | null
  date_of_birth: string | null
  username: string | null
  avatar_url: string | null
  banner_url?: string | null
  bio?: string | null
  status_text?: string | null
  status_emoji?: string | null
  social_links?: Record<string, unknown>
}

interface UserSettings {
  font_family?: string
  border_radius?: string
  high_contrast?: boolean
  room_default_mic?: boolean
  room_default_camera?: boolean
  room_autoplay?: boolean
  room_low_bandwidth?: boolean
  activity_visibility?: boolean
  privacy_profile_visibility?: string
  ui_sounds?: boolean
  glass_opacity?: number
  language?: string
  timezone?: string
  reduced_motion?: boolean
  font_scale?: number
  primary_accent?: string
  layout_density?: string
  glass_blur_intensity?: string
  ghost_mode?: boolean
  smart_away_trigger?: string
  spatial_audio?: boolean
  ai_voice_isolation?: boolean
  colorblind_mode?: string
  clock_format?: string
  data_sharing?: boolean
  ai_features_enabled?: boolean
  auto_captions?: boolean
  ai_session_summaries?: boolean
  screen_reader_opt?: boolean
  push_notifications?: boolean
  email_notifications?: boolean
  marketing_notifications?: boolean
  tray_notifications?: boolean
}

export function SettingsClient({
  profile,
  settings,
  email,
  blockedUsers,
  initialSessions,
  initialFactorId
}: {
  profile: Profile
  settings: UserSettings | null
  email?: string
  blockedUsers?: Record<string, unknown>[]
  initialSessions?: Record<string, unknown>[]
  initialFactorId?: string
}): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const navigate = useNavigate()

  const handleClose = (): void => {
    navigate(-1) // Or to a specific dashboard route depending on how settings is mounted
  }

  return (
    <div className="flex w-full h-full bg-background overflow-hidden font-sans text-foreground selection:bg-primary/20">
      {/* Ambient backgrounds integrated to the window context */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10"
        style={{ animationDelay: '-3s' }}
      />

      {/* Left Sidebar */}
      <aside className="w-[300px] flex-shrink-0 bg-background/80 backdrop-blur-xl border-r border-border/50 relative z-10 flex flex-col h-full window-drag">
        <div className="mb-6 p-6 pt-10 px-8">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        </div>
        <div className="px-5 pb-6 flex-1 overflow-y-auto window-no-drag no-scrollbar">
          <SettingsSidebar
            activeSection={activeSection}
            onNavigate={(s) => setActiveSection(s)}
          />
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 relative flex flex-col h-full bg-background/50 backdrop-blur-3xl overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-border/50">
        
        {/* Top bar with Close button */}
        <div className="absolute top-0 right-0 p-6 z-20 window-no-drag">
          <button
            onClick={handleClose}
            className="p-2.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50 backdrop-blur-sm"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-16 pb-24 px-8 lg:px-16 window-no-drag">
          <div className="max-w-3xl mx-auto w-full relative min-h-full">
            
            {/* Header */}
            <div className="mb-10 pb-6 border-b border-border/40">
              <motion.h1
                layoutId="section-title"
                className="text-3xl font-semibold tracking-tight text-foreground"
              >
                {activeSection === 'room_defaults' ? 'Room Defaults' : 
                 activeSection === 'profile' ? 'My Profile' :
                 activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
              </motion.h1>
            </div>

            {/* Sections */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="relative z-10 space-y-8"
              >
                {activeSection === 'profile' && <ProfileSettings profile={profile} />}
                {activeSection === 'account' && <AccountSettings email={email} />}
                {activeSection === 'security' && (
                  <SecuritySettings
                    initialBlocked={blockedUsers}
                    initialSessions={initialSessions}
                    initialFactorId={initialFactorId}
                  />
                )}
                {activeSection === 'appearance' && (
                  <AppearanceSettings
                    initialFont={settings?.font_family}
                    initialRadius={settings?.border_radius}
                    initialContrast={settings?.high_contrast}
                    initialAccent={settings?.primary_accent}
                    initialDensity={settings?.layout_density}
                    initialBlur={settings?.glass_blur_intensity}
                  />
                )}
                {activeSection === 'preferences' && (
                  <PreferencesSettings
                    initialReducedMotion={settings?.reduced_motion}
                    initialFontScale={settings?.font_scale}
                  />
                )}
                {activeSection === 'language_region' && (
                  <LanguageRegionSettings
                    initialLanguage={settings?.language}
                    initialTimezone={settings?.timezone}
                  />
                )}
                {activeSection === 'room_defaults' && (
                  <RoomDefaultsSettings
                    initialMic={settings?.room_default_mic}
                    initialCam={settings?.room_default_camera}
                    initialAutoplay={settings?.room_autoplay}
                    initialBandwidth={settings?.room_low_bandwidth}
                  />
                )}
                {activeSection === 'notifications' && (
                  <NotificationSettings
                    initialPush={settings?.push_notifications}
                    initialEmail={settings?.email_notifications}
                    initialMarketing={settings?.marketing_notifications}
                    initialTray={settings?.tray_notifications}
                  />
                )}
                {activeSection === 'privacy' && (
                  <PrivacySettings
                    initialActivity={settings?.activity_visibility}
                    initialProfile={settings?.privacy_profile_visibility}
                    initialGhostMode={settings?.ghost_mode}
                    initialSmartAway={settings?.smart_away_trigger}
                  />
                )}
                {activeSection === 'data' && <DataSettings />}
                {activeSection === 'ai' && (
                  <AISettings
                    initialSummaries={settings?.ai_session_summaries}
                    initialVoiceIsolation={settings?.ai_voice_isolation}
                  />
                )}
                {activeSection === 'accessibility' && (
                  <AccessibilitySettings
                    initialColorblind={settings?.colorblind_mode}
                    initialScreenReader={settings?.screen_reader_opt}
                    initialAutoCaptions={settings?.auto_captions}
                  />
                )}
                {activeSection === 'audio' && <AudioSettings />}
                {activeSection === 'system' && <SystemSettings />}
                {activeSection === 'developer' && <DeveloperSettings />}
                {activeSection === 'immersion' && (
                  <ImmersionSettings
                    initialSounds={settings?.ui_sounds}
                    initialOpacity={settings?.glass_opacity}
                    initialSpatialAudio={settings?.spatial_audio}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            
          </div>
        </div>
      </main>
    </div>
  )
}


