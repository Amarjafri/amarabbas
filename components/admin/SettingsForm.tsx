'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { saveSettings, type ActionState } from '@/app/actions/admin'
import AdminFormStatus from './AdminFormStatus'
import SubmitButton from './SubmitButton'
import type { SettingTab } from '@/lib/settings-schema'
import type { Settings } from '@/lib/types'

/** The field list for one settings tab — ported from admin/settings.blade.php. */
export default function SettingsForm({
  tab,
  settings,
}: {
  tab: SettingTab
  settings: Settings
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveSettings, {
    status: 'idle',
  })

  return (
    <>
      <AdminFormStatus state={state} />

      <form action={formAction} className="admin-form-card">
        <input type="hidden" name="tab" value={tab.key} />

        <h3 className="card-heading">{tab.label}</h3>

        {tab.fields.map((field) => {
          const value = settings[field.name] ?? ''
          const id = `s-${field.name}`

          if (field.type === 'toggle') {
            return (
              <div className="form-group" key={field.name}>
                {/* Paired hidden input so an unchecked box still posts a value. */}
                <input type="hidden" name={field.name} value="0" />
                <label className="form-check">
                  <input
                    type="checkbox"
                    name={field.name}
                    value="1"
                    defaultChecked={String(value) === '1'}
                  />
                  <span>{field.label}</span>
                </label>
                {field.hint && <small className="field-hint">{field.hint}</small>}
              </div>
            )
          }

          if (field.type === 'textarea' || field.type === 'rich') {
            return (
              <div className="form-group" key={field.name}>
                <label htmlFor={id}>{field.label}</label>
                <textarea
                  id={id}
                  name={field.name}
                  rows={field.type === 'rich' ? 3 : 4}
                  defaultValue={value}
                />
                {field.hint && (
                  <small className="field-hint" dangerouslySetInnerHTML={{ __html: field.hint }} />
                )}
              </div>
            )
          }

          return (
            <div className="form-group" key={field.name}>
              <label htmlFor={id}>{field.label}</label>
              <input
                id={id}
                type={['email', 'url', 'number'].includes(field.type) ? field.type : 'text'}
                name={field.name}
                defaultValue={value}
              />
              {field.hint && (
                <small className="field-hint" dangerouslySetInnerHTML={{ __html: field.hint }} />
              )}
            </div>
          )
        })}

        <div className="form-actions">
          <SubmitButton>Save {tab.label}</SubmitButton>
          <Link href="/" target="_blank" rel="noopener" className="btn btn-outline-sm">
            Preview Site ↗
          </Link>
        </div>
      </form>
    </>
  )
}
