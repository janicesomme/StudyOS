import { useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addActivity, createProfile, updateActivity } from '../lib/profiles.js'
import { ACTIVITY_CATEGORIES, type ActivityCategory, type PmActivity, type PmProfile } from '../lib/schemas.js'

type Props = {
  supabase: SupabaseClient
  userId: string
  profile: PmProfile | null
  activities: PmActivity[]
  onChange: () => void | Promise<void>
}

function zodMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && Array.isArray((err as { issues?: unknown }).issues)) {
    const issues = (err as { issues: { path: (string | number)[]; message: string }[] }).issues
    return issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
  }
  return err instanceof Error ? err.message : String(err)
}

function ProfileForm({ supabase, userId, profile, onChange }: Omit<Props, 'activities'>) {
  const [gpa, setGpa] = useState(profile?.gpa_cum?.toString() ?? '')
  const [mcat, setMcat] = useState(profile?.mcat_total?.toString() ?? '')
  const [state, setState] = useState(profile?.state_residence ?? '')
  const [gradYear, setGradYear] = useState(profile?.grad_year?.toString() ?? '')
  const [gapYears, setGapYears] = useState(profile?.gap_years?.toString() ?? '0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createProfile(supabase, {
        user_id: userId,
        gpa_cum: gpa === '' ? null : Number(gpa),
        mcat_total: mcat === '' ? null : Number(mcat),
        state_residence: state === '' ? null : state,
        grad_year: gradYear === '' ? null : Number(gradYear),
        gap_years: gapYears === '' ? 0 : Number(gapYears),
      })
      await onChange()
    } catch (err) {
      setError(zodMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
      <div>
        <label htmlFor="pm-gpa" className="block text-xs font-medium text-gray-700 mb-1">GPA</label>
        <input id="pm-gpa" type="number" step="0.01" min="0" max="4" value={gpa} onChange={e => setGpa(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="pm-mcat" className="block text-xs font-medium text-gray-700 mb-1">MCAT</label>
        <input id="pm-mcat" type="number" step="1" min="472" max="528" value={mcat} onChange={e => setMcat(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="pm-state" className="block text-xs font-medium text-gray-700 mb-1">State</label>
        <input id="pm-state" type="text" value={state} onChange={e => setState(e.target.value)} placeholder="e.g. LA" className={inputClass} />
      </div>
      <div>
        <label htmlFor="pm-grad-year" className="block text-xs font-medium text-gray-700 mb-1">Grad year</label>
        <input id="pm-grad-year" type="number" step="1" value={gradYear} onChange={e => setGradYear(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="pm-gap-years" className="block text-xs font-medium text-gray-700 mb-1">Gap years</label>
        <input id="pm-gap-years" type="number" step="1" min="0" value={gapYears} onChange={e => setGapYears(e.target.value)} className={inputClass} />
      </div>
      <div className="col-span-2 md:col-span-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : profile ? 'Update profile' : 'Create profile'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </form>
  )
}

function ActivityRow({ supabase, activity, onChange }: { supabase: SupabaseClient; activity: PmActivity; onChange: () => void | Promise<void> }) {
  const [completed, setCompleted] = useState(activity.hours_completed.toString())
  const [planned, setPlanned] = useState(activity.hours_planned.toString())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateActivity(supabase, activity.id, {
        hours_completed: Number(completed),
        hours_planned: Number(planned),
      })
      await onChange()
    } catch (err) {
      setError(zodMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-1.5 pr-2 text-sm text-gray-900">{activity.category.replace(/_/g, ' ')}</td>
      <td className="py-1.5 px-2">
        <input
          type="number"
          min="0"
          value={completed}
          onChange={e => setCompleted(e.target.value)}
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </td>
      <td className="py-1.5 px-2">
        <input
          type="number"
          min="0"
          value={planned}
          onChange={e => setPlanned(e.target.value)}
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </td>
      <td className="py-1.5 pl-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs text-indigo-600 font-medium hover:underline disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
      </td>
    </tr>
  )
}

function AddActivityRow({ supabase, profileId, onChange }: { supabase: SupabaseClient; profileId: string; onChange: () => void | Promise<void> }) {
  const [category, setCategory] = useState<ActivityCategory>('clinical_volunteer')
  const [completed, setCompleted] = useState('0')
  const [planned, setPlanned] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    setSaving(true)
    setError(null)
    try {
      await addActivity(supabase, {
        profile_id: profileId,
        category,
        hours_completed: Number(completed),
        hours_planned: Number(planned),
      })
      setCompleted('0')
      setPlanned('0')
      await onChange()
    } catch (err) {
      setError(zodMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 mt-3 pt-3 border-t border-gray-100">
      <div>
        <label htmlFor="pm-new-category" className="block text-xs font-medium text-gray-700 mb-1">Category</label>
        <select
          id="pm-new-category"
          value={category}
          onChange={e => setCategory(e.target.value as ActivityCategory)}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
        >
          {ACTIVITY_CATEGORIES.map(c => (
            <option key={c} value={c}>
              {c.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="pm-new-completed" className="block text-xs font-medium text-gray-700 mb-1">Hours completed</label>
        <input id="pm-new-completed" type="number" min="0" value={completed} onChange={e => setCompleted(e.target.value)} className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
      </div>
      <div>
        <label htmlFor="pm-new-planned" className="block text-xs font-medium text-gray-700 mb-1">Hours planned</label>
        <input id="pm-new-planned" type="number" min="0" value={planned} onChange={e => setPlanned(e.target.value)} className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
      </div>
      <button
        onClick={handleAdd}
        disabled={saving}
        className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Adding...' : '+ Add activity'}
      </button>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
    </div>
  )
}

export function ProfileIntakePanel({ supabase, userId, profile, activities, onChange }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
      <ProfileForm supabase={supabase} userId={userId} profile={profile} onChange={onChange} />

      {profile && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Activities</h3>
          {activities.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-1 pr-2">Category</th>
                  <th className="pb-1 px-2">Completed</th>
                  <th className="pb-1 px-2">Planned</th>
                  <th className="pb-1 pl-2"></th>
                </tr>
              </thead>
              <tbody>
                {activities.map(a => (
                  <ActivityRow key={a.id} supabase={supabase} activity={a} onChange={onChange} />
                ))}
              </tbody>
            </table>
          )}
          <AddActivityRow supabase={supabase} profileId={profile.id} onChange={onChange} />
        </div>
      )}
    </section>
  )
}
