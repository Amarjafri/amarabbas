'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { saveContentItem, type ActionState } from '@/app/actions/admin'
import AdminFormStatus from './AdminFormStatus'
import SubmitButton from './SubmitButton'
import type { ContentTypeConfig } from '@/lib/content-types'

type Row = Record<string, unknown> & { id: number; sort_order: number; active: boolean }

/**
 * Ported from resources/views/admin/content/form.blade.php — one form driven by
 * the field list in lib/content-types.ts, shared by all seven content types.
 */
export default function ContentForm({
  config,
  row,
}: {
  config: ContentTypeConfig
  row: Row | null
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveContentItem, {
    status: 'idle',
  })

  const value = (field: string) => (row?.[field] ?? '') as string
  const checked = (field: string, fallback: boolean) =>
    row ? Boolean(row[field]) : fallback

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/admin/content/${config.key}`} className="btn btn-outline-sm">
          ← Back to {config.label}
        </Link>
      </div>

      <AdminFormStatus state={state} />

      <div className="admin-form-card" style={{ maxWidth: '820px' }}>
        <form action={formAction}>
          <input type="hidden" name="type" value={config.key} />
          {row && <input type="hidden" name="id" value={row.id} />}

          {chunkByWidth(config).map((group, groupIndex) =>
            group.length === 2 ? (
              <div className="form-row-2" key={groupIndex}>
                {group.map(([name, spec]) => (
                  <Field key={name} name={name} spec={spec} value={value(name)} checked={checked} />
                ))}
              </div>
            ) : (
              <Field
                key={groupIndex}
                name={group[0][0]}
                spec={group[0][1]}
                value={value(group[0][0])}
                checked={checked}
              />
            )
          )}

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="sort_order">Sort Order</label>
              <input
                id="sort_order"
                type="number"
                name="sort_order"
                defaultValue={row?.sort_order ?? 0}
              />
              <small className="field-hint">Lowest number is shown first.</small>
            </div>

            <div className="form-group">
              <label className="form-check" style={{ marginTop: '2rem' }}>
                <input
                  type="checkbox"
                  name="active"
                  value="1"
                  defaultChecked={row ? row.active : true}
                />
                <span>Show on the site</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <SubmitButton>
              {row ? `Update ${config.singular}` : `Create ${config.singular}`}
            </SubmitButton>
            <Link href={`/admin/content/${config.key}`} className="btn btn-outline-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}

/** Pairs consecutive half-width fields so they share a row, as Blade did. */
function chunkByWidth(config: ContentTypeConfig) {
  const entries = Object.entries(config.fields)
  const groups: Array<Array<(typeof entries)[number]>> = []

  for (let i = 0; i < entries.length; i++) {
    const current = entries[i]
    const next = entries[i + 1]

    if (current[1].width === 'half' && next?.[1].width === 'half') {
      groups.push([current, next])
      i++
    } else {
      groups.push([current])
    }
  }

  return groups
}

function Field({
  name,
  spec,
  value,
  checked,
}: {
  name: string
  spec: ContentTypeConfig['fields'][string]
  value: string
  checked: (field: string, fallback: boolean) => boolean
}) {
  if (spec.type === 'checkbox') {
    return (
      <div className="form-group">
        <label className="form-check">
          <input
            type="checkbox"
            name={name}
            value="1"
            defaultChecked={checked(name, spec.default ?? false)}
          />
          <span>{spec.label}</span>
        </label>
        {spec.hint && <small className="field-hint">{spec.hint}</small>}
      </div>
    )
  }

  if (spec.type === 'textarea') {
    return (
      <div className="form-group">
        <label htmlFor={name}>
          {spec.label} {spec.required && '*'}
        </label>
        <textarea
          id={name}
          name={name}
          rows={spec.rows ?? 4}
          required={spec.required}
          placeholder={spec.placeholder}
          defaultValue={value}
        />
        {spec.hint && <small className="field-hint">{spec.hint}</small>}
      </div>
    )
  }

  return (
    <div className="form-group">
      <label htmlFor={name}>
        {spec.label} {spec.required && '*'}
      </label>
      <input
        id={name}
        type={spec.type === 'number' ? 'number' : 'text'}
        name={name}
        required={spec.required}
        maxLength={spec.max}
        placeholder={spec.placeholder}
        defaultValue={value}
      />
      {spec.type === 'icon' && (
        <small className="field-hint">
          Any Font Awesome 6 class, e.g. <code>fas fa-code</code> or <code>fab fa-laravel</code>.
        </small>
      )}
      {spec.hint && <small className="field-hint">{spec.hint}</small>}
    </div>
  )
}
