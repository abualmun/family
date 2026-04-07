import { createClient } from '@/lib/supabase/server'
import TreeLayout from '@/components/tree/TreeLayout'

export default async function EditPage() {
  const supabase = await createClient()

  // Fetch all data server-side for initial render (SSR)
  const [
    { data: roots },
    { data: people },
    { data: partnerships },
    { data: parentChild },
  ] = await Promise.all([
    supabase.from('roots').select('*').order('created_at'),
    supabase.from('people').select('*'),
    supabase.from('partnerships').select('*'),
    supabase.from('parent_child').select('*'),
  ])

  return (
    <TreeLayout
      isEditable={true}
      initialRoots={roots ?? []}
      initialPeople={people ?? []}
      initialPartnerships={partnerships ?? []}
      initialParentChild={parentChild ?? []}
    />
  )
}