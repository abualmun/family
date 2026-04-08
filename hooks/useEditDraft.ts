'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  PersonRow, RootRow, PartnershipRow, ParentChildRow,
  InsertPerson, UpdatePerson,
} from '@/lib/supabase/types'

type PendingOp =
  | { type: 'addRoot'; tempId: string; name: string }
  | { type: 'addPerson'; tempId: string; data: InsertPerson }
  | { type: 'addPartnership'; tempId: string; personAId: string; personBId: string }
  | { type: 'removePartnership'; id: string }
  | { type: 'addParentChild'; parentId: string; childId: string }
  | { type: 'updatePerson'; id: string; updates: UpdatePerson }
  | { type: 'deletePerson'; id: string }

function makeTempId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `temp_${crypto.randomUUID()}`
  }
  // Fallback for non-secure contexts (e.g. HTTP on local network)
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * Manages all edit-mode state locally without writing to the DB until
 * saveChanges() is called. Operations return immediately with temp IDs
 * so the UI stays responsive.
 */
export function useEditDraft(
  initialRoots: RootRow[],
  initialPeople: PersonRow[],
  initialPartnerships: PartnershipRow[],
  initialParentChild: ParentChildRow[],
) {
  const [roots, setRoots] = useState<RootRow[]>(initialRoots)
  const [people, setPeople] = useState<PersonRow[]>(initialPeople)
  const [partnerships, setPartnerships] = useState<PartnershipRow[]>(initialPartnerships)
  const [parentChildRows, setParentChildRows] = useState<ParentChildRow[]>(initialParentChild)
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Mutable ref — never needs to trigger re-renders
  const pendingPhotos = useRef<Map<string, { file: File; blobUrl: string }>>(new Map())

  const supabase = createClient()

  // ── addRoot ─────────────────────────────────────────────────
  const addRoot = useCallback(async (name: string): Promise<RootRow | null> => {
    const tempId = makeTempId()
    const t = new Date().toISOString()
    const temp: RootRow = { id: tempId, name, canvas_x: 0, canvas_y: 0, created_at: t, updated_at: t }
    setRoots(prev => [...prev, temp])
    setPendingOps(prev => [...prev, { type: 'addRoot', tempId, name }])
    return temp
  }, [])

  // ── addPerson ───────────────────────────────────────────────
  const addPerson = useCallback(async (data: InsertPerson): Promise<PersonRow | null> => {
    const tempId = makeTempId()
    const t = new Date().toISOString()
    const temp: PersonRow = {
      id: tempId,
      name: data.name,
      nickname: data.nickname ?? null,
      birth_date: data.birth_date ?? null,
      bio: data.bio ?? null,
      photo_url: data.photo_url ?? null,
      mother_id: data.mother_id ?? null,
      gender: data.gender ?? null,
      root_id: data.root_id,
      is_shortcut: data.is_shortcut ?? false,
      original_person_id: data.original_person_id ?? null,
      canvas_x: data.canvas_x ?? 0,
      canvas_y: data.canvas_y ?? 0,
      created_at: t,
      updated_at: t,
    }
    setPeople(prev => [...prev, temp])
    setPendingOps(prev => [...prev, { type: 'addPerson', tempId, data }])
    return temp
  }, [])

  // ── addPartnership ──────────────────────────────────────────
  const addPartnership = useCallback(async (
    personAId: string,
    personBId: string,
  ): Promise<PartnershipRow | null> => {
    const [a, b] = [personAId, personBId].sort()
    const tempId = makeTempId()
    const temp: PartnershipRow = {
      id: tempId,
      person_a_id: a,
      person_b_id: b,
      created_at: new Date().toISOString(),
    }
    setPartnerships(prev => [...prev, temp])
    setPendingOps(prev => [...prev, { type: 'addPartnership', tempId, personAId: a, personBId: b }])
    return temp
  }, [])

  // ── removePartnership ───────────────────────────────────────
  const removePartnership = useCallback(async (id: string): Promise<boolean> => {
    setPartnerships(prev => prev.filter(p => p.id !== id))
    if (id.startsWith('temp_')) {
      // Cancel the matching addPartnership pending op instead of writing a delete
      setPendingOps(prev => prev.filter(op => !(op.type === 'addPartnership' && op.tempId === id)))
    } else {
      setPendingOps(prev => [...prev, { type: 'removePartnership', id }])
    }
    return true
  }, [])

  // ── addParentChild ──────────────────────────────────────────
  const addParentChild = useCallback(async (
    parentId: string,
    childId: string,
  ): Promise<ParentChildRow | null> => {
    const temp: ParentChildRow = {
      id: makeTempId(),
      parent_id: parentId,
      child_id: childId,
      created_at: new Date().toISOString(),
    }
    setParentChildRows(prev => [...prev, temp])
    setPendingOps(prev => [...prev, { type: 'addParentChild', parentId, childId }])
    return temp
  }, [])

  // ── updatePerson ────────────────────────────────────────────
  const updatePerson = useCallback(async (
    id: string,
    updates: UpdatePerson,
  ): Promise<boolean> => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    setPendingOps(prev => {
      // If this person was added in this session, merge into the addPerson op
      const addIdx = prev.findIndex(op => op.type === 'addPerson' && op.tempId === id)
      if (addIdx !== -1) {
        const ops = [...prev]
        const addOp = ops[addIdx] as Extract<PendingOp, { type: 'addPerson' }>
        ops[addIdx] = { ...addOp, data: { ...addOp.data, ...updates } }
        return ops
      }
      // Merge into an existing updatePerson op for this id
      const updateIdx = prev.findIndex(op => op.type === 'updatePerson' && op.id === id)
      if (updateIdx !== -1) {
        const ops = [...prev]
        const updateOp = ops[updateIdx] as Extract<PendingOp, { type: 'updatePerson' }>
        ops[updateIdx] = { ...updateOp, updates: { ...updateOp.updates, ...updates } }
        return ops
      }
      return [...prev, { type: 'updatePerson', id, updates }]
    })
    return true
  }, [])

  // ── uploadPhoto — deferred, returns a blob URL for preview ──
  const uploadPhoto = useCallback(async (
    personId: string,
    file: File,
  ): Promise<string | null> => {
    const prev = pendingPhotos.current.get(personId)
    if (prev) URL.revokeObjectURL(prev.blobUrl)
    const blobUrl = URL.createObjectURL(file)
    pendingPhotos.current.set(personId, { file, blobUrl })
    return blobUrl
  }, [])

  // ── deletePerson ────────────────────────────────────────────
  const deletePerson = useCallback(async (id: string): Promise<boolean> => {
    setPeople(prev => prev.filter(p => p.id !== id))
    if (id.startsWith('temp_')) {
      // Cancel all pending ops for this temp person and clean up
      setPendingOps(prev => prev.filter(op => {
        if (op.type === 'addPerson' && op.tempId === id) return false
        if (op.type === 'addPartnership' && (op.personAId === id || op.personBId === id)) return false
        if (op.type === 'addParentChild' && (op.parentId === id || op.childId === id)) return false
        if (op.type === 'updatePerson' && op.id === id) return false
        return true
      }))
      const entry = pendingPhotos.current.get(id)
      if (entry) { URL.revokeObjectURL(entry.blobUrl); pendingPhotos.current.delete(id) }
      setPartnerships(prev => prev.filter(p => p.person_a_id !== id && p.person_b_id !== id))
      setParentChildRows(prev => prev.filter(r => r.parent_id !== id && r.child_id !== id))
    } else {
      // Real person: cancel any pending ops that reference them, clean local state
      setPendingOps(prev => {
        const filtered = prev.filter(op => {
          if (op.type === 'updatePerson' && op.id === id) return false
          if (op.type === 'addPartnership' && (op.personAId === id || op.personBId === id)) return false
          if (op.type === 'addParentChild' && op.childId === id) return false
          return true
        })
        return [...filtered, { type: 'deletePerson', id }]
      })
      setPartnerships(prev => prev.filter(p => p.person_a_id !== id && p.person_b_id !== id))
      setParentChildRows(prev => prev.filter(r => r.child_id !== id))
      const entry = pendingPhotos.current.get(id)
      if (entry) { URL.revokeObjectURL(entry.blobUrl); pendingPhotos.current.delete(id) }
    }
    return true
  }, [])

  // ── hasConnections helper ───────────────────────────────────
  const hasConnections = useCallback((
    personId: string,
    ps: { person_a_id: string; person_b_id: string }[],
    pc: { parent_id: string; child_id: string }[],
  ): boolean => {
    return ps.some(p => p.person_a_id === personId || p.person_b_id === personId)
      || pc.some(r => r.parent_id === personId || r.child_id === personId)
  }, [])

  // ── saveChanges — flush all pending ops to Supabase ─────────
  const saveChanges = useCallback(async (): Promise<boolean> => {
    setIsSaving(true)
    setSaveError(null)

    const tempToReal = new Map<string, string>()
    const resolve = (id: string) => tempToReal.get(id) ?? id
    const photos = pendingPhotos.current

    try {
      for (const op of pendingOps) {
        switch (op.type) {

          case 'addRoot': {
            const { data, error } = await supabase
              .from('roots')
              .insert({ name: op.name, canvas_x: 0, canvas_y: 0 })
              .select().single()
            if (error) throw new Error(error.message)
            tempToReal.set(op.tempId, data.id)
            setRoots(prev => prev.map(r => r.id === op.tempId ? { ...r, id: data.id } : r))
            break
          }

          case 'addPerson': {
            const photoEntry = photos.get(op.tempId)
            const { data, error } = await supabase
              .from('people')
              .insert({
                ...op.data,
                root_id: resolve(op.data.root_id),
                mother_id: op.data.mother_id ? resolve(op.data.mother_id) : null,
                original_person_id: op.data.original_person_id
                  ? resolve(op.data.original_person_id) : null,
                // Never persist a blob URL — photo uploaded separately below
                photo_url: photoEntry || op.data.photo_url?.startsWith('blob:')
                  ? null
                  : (op.data.photo_url ?? null),
              })
              .select().single()
            if (error) throw new Error(error.message)
            tempToReal.set(op.tempId, data.id)
            setPeople(prev => prev.map(p => p.id === op.tempId ? { ...p, id: data.id } : p))

            if (photoEntry) {
              const realId = data.id
              const ext = photoEntry.file.name.split('.').pop()
              const path = `${realId}.${ext}`
              const { error: upErr } = await supabase.storage
                .from('avatars').upload(path, photoEntry.file, { upsert: true })
              if (upErr) throw new Error(upErr.message)
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
              await supabase.from('people').update({ photo_url: urlData.publicUrl }).eq('id', realId)
              setPeople(prev => prev.map(p =>
                p.id === realId ? { ...p, photo_url: urlData.publicUrl } : p
              ))
            }
            break
          }

          case 'addPartnership': {
            const { error } = await supabase
              .from('partnerships')
              .insert({ person_a_id: resolve(op.personAId), person_b_id: resolve(op.personBId) })
            if (error) throw new Error(error.message)
            break
          }

          case 'removePartnership': {
            const { error } = await supabase
              .from('partnerships')
              .delete()
              .eq('id', op.id)
            if (error) throw new Error(error.message)
            break
          }

          case 'addParentChild': {
            const { error } = await supabase
              .from('parent_child')
              .insert({ parent_id: resolve(op.parentId), child_id: resolve(op.childId) })
            if (error) throw new Error(error.message)
            break
          }

          case 'updatePerson': {
            const realId = resolve(op.id)
            const photoEntry = photos.get(op.id)
            let updates = { ...op.updates }

            if (photoEntry) {
              const ext = photoEntry.file.name.split('.').pop()
              const path = `${realId}.${ext}`
              const { error: upErr } = await supabase.storage
                .from('avatars').upload(path, photoEntry.file, { upsert: true })
              if (upErr) throw new Error(upErr.message)
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
              updates = { ...updates, photo_url: urlData.publicUrl }
              setPeople(prev => prev.map(p =>
                p.id === realId || p.id === op.id
                  ? { ...p, photo_url: urlData.publicUrl }
                  : p
              ))
            } else if (updates.photo_url?.startsWith('blob:')) {
              // Blob URL with no matching file — drop the field to avoid persisting it
              const { photo_url: _dropped, ...rest } = updates
              updates = rest
            }

            const { error } = await supabase.from('people').update(updates).eq('id', realId)
            if (error) throw new Error(error.message)
            break
          }

          case 'deletePerson': {
            await supabase.from('partnerships').delete()
              .or(`person_a_id.eq.${op.id},person_b_id.eq.${op.id}`)
            await supabase.from('parent_child').delete().eq('child_id', op.id)
            const { error } = await supabase.from('people').delete().eq('id', op.id)
            if (error) throw new Error(error.message)
            break
          }
        }
      }

      // Replace any remaining temp IDs in relationship rows
      setPartnerships(prev => prev.map(p => ({
        ...p,
        person_a_id: resolve(p.person_a_id),
        person_b_id: resolve(p.person_b_id),
      })))
      setParentChildRows(prev => prev.map(r => ({
        ...r,
        parent_id: resolve(r.parent_id),
        child_id: resolve(r.child_id),
      })))

      photos.forEach(({ blobUrl }) => URL.revokeObjectURL(blobUrl))
      photos.clear()
      setPendingOps([])
      return true

    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unknown error saving changes')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [pendingOps, supabase])

  return {
    roots, people, partnerships, parentChildRows,
    addRoot, addPerson, addPartnership, removePartnership, addParentChild,
    updatePerson, uploadPhoto, deletePerson, hasConnections,
    saveChanges,
    isSaving,
    saveError,
    hasPendingChanges: pendingOps.length > 0,
  }
}
