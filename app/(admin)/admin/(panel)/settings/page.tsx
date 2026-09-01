import type { Metadata } from 'next'
import Link from 'next/link'

import AdminTitle from '@/components/admin/AdminTitle'
import CvCard from '@/components/admin/CvCard'
import ProfilePhotoCard from '@/components/admin/ProfilePhotoCard'
import SavedNotice from '@/components/admin/SavedNotice'
import SettingsForm from '@/components/admin/SettingsForm'
import { storageUrl } from '@/lib/data'
import { contentMenu } from '@/lib/content-types'
import { settingTab, SETTING_TABS } from '@/lib/settings-schema'
import { readObject } from '@/lib/store'
import type { Settings } from '@/lib/types'

export const metadata: Metadata = { title: 'Site Settings — Admin' }
export const dynamic = 'force-dynamic'

/** Ported from resources/views/admin/settings.blade.php. */
export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string }>
}) {
  const { tab: requestedTab, saved } = await searchParams
  const settings = await readObject<Settings>('settings')
  const tab = settingTab(requestedTab ?? 'profile')

  return (
    <>
      <AdminTitle>Site Settings</AdminTitle>
      <SavedNotice saved={saved} />

      <div className="settings-layout">
        {/* ── TAB RAIL ── */}
        <nav className="settings-tabs" aria-label="Settings sections">
          {SETTING_TABS.map((entry) => (
            <Link
              href={`/admin/settings?tab=${entry.key}`}
              className={`settings-tab ${tab.key === entry.key ? 'active' : ''}`}
              key={entry.key}
            >
              <i className={entry.icon} aria-hidden="true"></i>
              <span>{entry.label}</span>
            </Link>
          ))}

          <div className="settings-tab-divider"></div>

          {contentMenu().map((entry) => (
            <Link href={`/admin/content/${entry.key}`} className="settings-tab" key={entry.key}>
              <i className={entry.icon} aria-hidden="true"></i>
              <span>{entry.label}</span>
            </Link>
          ))}
        </nav>

        <div className="settings-panel">
          {tab.key === 'profile' && (
            <>
              <ProfilePhotoCard
                currentUrl={settings.profile_image ? storageUrl(settings.profile_image) : null}
              />
              <CvCard cvPath={settings.cv_file ?? ''} />
            </>
          )}

          <SettingsForm tab={tab} settings={settings} />
        </div>
      </div>
    </>
  )
}
