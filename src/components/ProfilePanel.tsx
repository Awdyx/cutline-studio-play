import { useCallback, useRef, useEffect, useLayoutEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, CreditCard, HelpCircle, LogOut } from 'lucide-react'
import { useIsPhoneLayout } from '../hooks/useLayoutProfile'
import { CHROME_FROSTED_MENU_CLASS, CHROME_PRESERVE_CASE_CLASS, chromeFrostedMenuStyle, font, menuDividerStyle, phoneMenuDividerStyle } from '../styles/tokens'
import {
  phonePanelSheetStyle,
  phoneTopMenuMaxHeight,
  phoneTopPanelSlideMotion,
  phoneTopPanelTransformOrigin,
  PHONE_TOP_PANEL_SCALE,
} from '../styles/phoneChrome'
import { useProfileStore } from '../profile/profileStore'
import type { UserProfile } from '../profile/types'
import { isProfileFilePickerOpen } from '../profile/profileFilePickerSession'
import { useShortcutUiStore } from '../shortcuts/shortcutUiStore'
import ProfileBannerHeader from './ProfileBannerHeader'
import ProfileIdentityTags from './ProfileIdentityTags'
import ProfileSocialPills from './ProfileSocialPills'
import ProfileSubmenu from './ProfileSubmenu'
import SubscriptionSubmenu from './SubscriptionSubmenu'
import { MenuRow } from './MenuRow'
import { SubmenuSoundScope } from './SubmenuSoundScope'
import { useMenuOutsideDismiss } from './useMenuOutsideDismiss'
import { useVisualViewportOffset } from '../platform/useVisualViewportOffset'

type ProfileDestination = 'profile' | 'subscription' | 'help'
type ProfileSubmenuId = 'profile' | 'subscription'

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (destination: ProfileDestination) => void
  onSignOut: () => void
  onManageBilling?: () => void
  onChangePlan?: () => void
}

const PROFILE_PANEL_TOP = 64

const cardBase: React.CSSProperties = {
  position: 'fixed',
  top: PROFILE_PANEL_TOP,
  right: 16,
  width: 280,
  ...chromeFrostedMenuStyle,
  fontFamily: font.family,
  color: font.colorPrimary,
  zIndex: 30,
  overflow: 'hidden',
}

const NAV_ITEMS: {
  icon: React.ElementType
  label: string
  destination: ProfileDestination
}[] = [
  { icon: User, label: 'Profile', destination: 'profile' },
  { icon: CreditCard, label: 'Subscription', destination: 'subscription' },
  { icon: HelpCircle, label: 'Help & support', destination: 'help' },
]

export default function ProfilePanel({
  isOpen,
  onClose,
  onNavigate,
  onSignOut,
  onManageBilling,
  onChangePlan,
}: ProfilePanelProps) {
  const isPhone = useIsPhoneLayout()
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [phoneContentFillScale, setPhoneContentFillScale] = useState(1)
  const [openSubmenu, setOpenSubmenu] = useState<ProfileSubmenuId | null>(null)
  const [profileDraft, setProfileDraft] = useState<UserProfile | null>(null)
  const profile = useProfileStore((s) => s.profile)
  const visualViewportOffsetTop = useVisualViewportOffset()

  const closeProfileSubmenu = useCallback(() => {
    setProfileDraft(null)
    setOpenSubmenu((current) => (current === 'profile' ? null : current))
  }, [])

  const closeAllSubmenus = useCallback(() => {
    setProfileDraft(null)
    setOpenSubmenu(null)
  }, [])

  useEffect(() => {
    if (!isOpen) closeAllSubmenus()
  }, [closeAllSubmenus, isOpen])

  useEffect(() => {
    useShortcutUiStore.getState().registerProfileMenu({ closeSubmenus: closeAllSubmenus })
    return () => useShortcutUiStore.getState().registerProfileMenu(null)
  }, [closeAllSubmenus])

  useLayoutEffect(() => {
    if (!isPhone || !isOpen) return

    const panel = panelRef.current
    const content = contentRef.current
    if (!panel || !content) return

    const updateFillScale = () => {
      const targetHeight = panel.clientHeight
      const naturalHeight = content.scrollHeight
      if (targetHeight <= 0 || naturalHeight <= 0) return

      const nextScale = targetHeight / naturalHeight
      setPhoneContentFillScale((prev) =>
        Math.abs(prev - nextScale) < 0.004 ? prev : nextScale,
      )
    }

    updateFillScale()
    const observer = new ResizeObserver(updateFillScale)
    observer.observe(panel)
    observer.observe(content)
    return () => observer.disconnect()
  }, [
    isOpen,
    isPhone,
    profile.displayName,
    profile.handle,
    profile.studentCohort,
  ])

  const dismissFromOutside = useCallback(
    (target: Element) => {
      if (target.closest('[data-panel-trigger]')) {
        closeAllSubmenus()
        return
      }
      if (openSubmenu === 'profile' && target.closest('[data-profile-panel-header]')) {
        return
      }
      if (panelRef.current?.contains(target)) {
        closeAllSubmenus()
        return
      }
      closeAllSubmenus()
      onClose()
    },
    [closeAllSubmenus, onClose, openSubmenu],
  )

  useMenuOutsideDismiss({
    active: isOpen,
    panelRef,
    onDismiss: dismissFromOutside,
    isInside: (target) =>
      isProfileFilePickerOpen() ||
      !!target.closest('[data-profile-submenu]') ||
      !!target.closest('[data-phone-chrome-modal-scrim]') ||
      !!target.closest('[data-profile-save-bubble]') ||
      !!target.closest('[data-subscription-submenu]'),
    dismissInsidePanel: openSubmenu !== null,
  })

  const handleNav = (destination: ProfileDestination) => {
    if (destination === 'profile') {
      setOpenSubmenu((current) => {
        if (current === 'profile') {
          setProfileDraft(null)
          return null
        }
        return 'profile'
      })
      return
    }
    if (destination === 'subscription') {
      setOpenSubmenu((current) => (current === 'subscription' ? null : 'subscription'))
      return
    }
    setOpenSubmenu(null)
    onNavigate(destination)
  }


  return (
    <>
      <motion.div
        ref={panelRef}
        className={`theme-surface ${CHROME_FROSTED_MENU_CLASS}`}
        style={{
          ...(isPhone
            ? {
                ...phonePanelSheetStyle(
                  {
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    height: phoneTopMenuMaxHeight(PHONE_TOP_PANEL_SCALE),
                  },
                  'right',
                  PHONE_TOP_PANEL_SCALE,
                ),
                transformOrigin: phoneTopPanelTransformOrigin,
              }
            : { ...cardBase, top: PROFILE_PANEL_TOP + visualViewportOffsetTop }),
          ...chromeFrostedMenuStyle,
          fontFamily: font.family,
          color: font.colorPrimary,
          zIndex: 30,
          overflow: 'hidden',
        }}
        {...(isPhone ? phoneTopPanelSlideMotion : {
          initial: { opacity: 0, scale: 0.96, y: -4 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.96, y: -4 },
          transition: { duration: 0.18, ease: 'easeOut' },
        })}
      >
        <div
          ref={contentRef}
          style={
            isPhone
              ? {
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: `${100 / phoneContentFillScale}%`,
                  transform: `scale(${phoneContentFillScale})`,
                  transformOrigin: phoneTopPanelTransformOrigin,
                }
              : undefined
          }
        >
        <div data-profile-panel-header>
          <ProfileBannerHeader
            bannerImageUrl={profileDraft?.bannerImageUrl ?? profile.bannerImageUrl}
            bannerFrame={profileDraft?.bannerFrame ?? profile.bannerFrame}
            displayName={profileDraft?.displayName ?? profile.displayName}
            avatarColor={profile.avatarColor}
            avatarImageUrl={profileDraft?.avatarImageUrl ?? profile.avatarImageUrl}
            avatarFrame={profileDraft?.avatarFrame ?? profile.avatarFrame}
            bannerHeight={isPhone ? 48 : undefined}
            avatarSize={isPhone ? 32 : undefined}
            contentGap={isPhone ? 4 : undefined}
            contentPaddingBottom={isPhone ? 6 : undefined}
            edgeToEdge
          >
            <div className={CHROME_PRESERVE_CASE_CLASS}>
              <ProfileIdentityTags
                displayName={profileDraft?.displayName ?? profile.displayName}
                handle={profileDraft?.handle ?? profile.handle}
                studentCohort={profile.studentCohort}
                compact={isPhone}
              />
              {!isPhone && (profileDraft?.bio ?? profile.bio) && (
                <p
                  style={{
                    margin: '16px 0 0',
                    fontSize: 12,
                    color: font.colorFaint,
                    lineHeight: 1.45,
                  }}
                >
                  {profileDraft?.bio ?? profile.bio}
                </p>
              )}
              {!isPhone && (
                <ProfileSocialPills socials={profileDraft?.socials ?? profile.socials} centered />
              )}
            </div>
          </ProfileBannerHeader>
        </div>

        <div style={isPhone ? phoneMenuDividerStyle : menuDividerStyle} />

        <SubmenuSoundScope>
          <div style={{ padding: isPhone ? '2px 0' : '4px 0' }}>
            {NAV_ITEMS.map(({ icon, label, destination }) => (
              <MenuRow
                key={destination}
                icon={icon}
                label={label}
                inset
                compact={isPhone}
                onClick={() => handleNav(destination)}
              />
            ))}
          </div>

          <div style={isPhone ? phoneMenuDividerStyle : menuDividerStyle} />

          <div style={{ padding: isPhone ? '2px 0 6px' : '4px 0 8px' }}>
            <MenuRow
              icon={LogOut}
              label="Sign out"
              inset
              compact={isPhone}
              destructive
              onClick={onSignOut}
            />
          </div>
        </SubmenuSoundScope>
        </div>
      </motion.div>

      <AnimatePresence>
        {openSubmenu === 'profile' && (
          <ProfileSubmenu
            key="profile-submenu"
            panelRef={panelRef}
            onClose={closeProfileSubmenu}
            onDraftChange={setProfileDraft}
          />
        )}
        {openSubmenu === 'subscription' && (
          <SubscriptionSubmenu
            key="subscription-submenu"
            panelRef={panelRef}
            onClose={() => setOpenSubmenu(null)}
            onManageBilling={onManageBilling}
            onChangePlan={onChangePlan}
          />
        )}
      </AnimatePresence>
    </>
  )
}
