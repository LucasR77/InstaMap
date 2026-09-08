import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured, type DbFolder, type DbMap } from '../lib/supabase'
import { useAuth } from './useAuth'
import { SAMPLE_DOCUMENTS } from '../samples/sampleData'

export interface BreadcrumbItem {
  id: string | null
  name: string
}

export interface MapMeta {
  id: string
  folder_id: string | null
  mastered_node_ids: string[] | null
}

export function useDashboardState() {
  const { user } = useAuth()
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<DbFolder[]>([])
  const [allFolders, setAllFolders] = useState<DbFolder[]>([])
  const [maps, setMaps] = useState<DbMap[]>([])
  const [allMapsMeta, setAllMapsMeta] = useState<MapMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Load all folders and current view data
  const refreshData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setFolders([])
      setAllFolders([])
      setMaps([])
      setAllMapsMeta([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. Fetch all user folders for breadcrumbs and move modals
      const { data: allFoldersData } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      const loadedAllFolders = (allFoldersData as DbFolder[]) || []
      setAllFolders(loadedAllFolders)

      // 2. Fetch all user maps metadata (id, folder_id, mastered_node_ids) for accurate folder counts and stats
      const { data: mapsMetaData } = await supabase
        .from('maps')
        .select('id, folder_id, mastered_node_ids')
        .eq('user_id', user.id)

      const loadedMapsMeta = (mapsMetaData as MapMeta[]) || []
      setAllMapsMeta(loadedMapsMeta)

      // 3. Fetch subfolders in current folder
      const filteredFolders = currentFolderId
        ? loadedAllFolders.filter((f) => f.parent_id === currentFolderId)
        : loadedAllFolders.filter((f) => f.parent_id === null)
      setFolders(filteredFolders)

      // 4. Fetch maps in current folder
      let mapsQuery = supabase
        .from('maps')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (currentFolderId) {
        mapsQuery = mapsQuery.eq('folder_id', currentFolderId)
      } else {
        mapsQuery = mapsQuery.is('folder_id', null)
      }

      const { data: mapsData, error } = await mapsQuery
      if (!error && mapsData) {
        setMaps(mapsData as DbMap[])
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [user, currentFolderId])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Build breadcrumbs path
  const breadcrumbs: BreadcrumbItem[] = [{ id: null, name: 'Mis Mapas' }]
  if (currentFolderId && allFolders.length > 0) {
    const path: DbFolder[] = []
    let curr: DbFolder | undefined = allFolders.find((f) => f.id === currentFolderId)
    while (curr) {
      path.unshift(curr)
      curr = curr.parent_id ? allFolders.find((f) => f.id === curr!.parent_id) : undefined
    }
    path.forEach((f) => breadcrumbs.push({ id: f.id, name: f.name }))
  }

  // Create folder
  const createFolder = async (name: string, color = '#6366f1') => {
    if (!user) return null
    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        parent_id: currentFolderId,
        name: name.trim() || 'Nueva Carpeta',
        color
      })
      .select()
      .single()

    if (!error && data) {
      await refreshData()
      return data as DbFolder
    }
    return null
  }

  // Delete folder
  const deleteFolder = async (folderId: string) => {
    if (!user) return
    await supabase.from('folders').delete().eq('id', folderId).eq('user_id', user.id)
    await refreshData()
  }

  // Create map
  const createMap = async (
    title = 'Documento sin título',
    initialMarkdown?: string,
    folderId?: string | null
  ): Promise<DbMap | null> => {
    if (!user) return null

    const defaultMarkdown = initialMarkdown || SAMPLE_DOCUMENTS[0].markdown

    const { data, error } = await supabase
      .from('maps')
      .insert({
        user_id: user.id,
        folder_id: folderId !== undefined ? folderId : currentFolderId,
        title: title.trim() || 'Documento sin título',
        raw_markdown: defaultMarkdown,
        mastered_node_ids: [],
        layout_direction: 'BILATERAL',
        is_public: false
      })
      .select()
      .single()

    if (!error && data) {
      await refreshData()
      return data as DbMap
    }
    return null
  }

  // Delete map
  const deleteMap = async (mapId: string) => {
    if (!user) return
    await supabase.from('maps').delete().eq('id', mapId).eq('user_id', user.id)
    await refreshData()
  }

  // Move map
  const moveMap = async (mapId: string, targetFolderId: string | null) => {
    if (!user) return
    await supabase
      .from('maps')
      .update({ folder_id: targetFolderId, updated_at: new Date().toISOString() })
      .eq('id', mapId)
      .eq('user_id', user.id)
    await refreshData()
  }

  // Rename map
  const renameMap = async (mapId: string, newTitle: string) => {
    if (!user) return
    await supabase
      .from('maps')
      .update({ title: newTitle.trim(), updated_at: new Date().toISOString() })
      .eq('id', mapId)
      .eq('user_id', user.id)
    await refreshData()
  }

  // Duplicate map
  const duplicateMap = async (mapId: string) => {
    if (!user) return
    const target = maps.find((m) => m.id === mapId)
    if (!target) return
    await createMap(`${target.title} (Copia)`, target.raw_markdown, target.folder_id)
  }

  // Calculate map count for a folder (including any nested subfolders)
  const getFolderMapCount = useCallback(
    (folderId: string): number => {
      const folderIds = new Set<string>([folderId])
      let added = true
      while (added) {
        added = false
        for (const f of allFolders) {
          if (f.parent_id && folderIds.has(f.parent_id) && !folderIds.has(f.id)) {
            folderIds.add(f.id)
            added = true
          }
        }
      }
      return allMapsMeta.filter((m) => m.folder_id && folderIds.has(m.folder_id)).length
    },
    [allFolders, allMapsMeta]
  )

  // Search filtered items
  const filteredFolders = searchQuery.trim()
    ? folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders

  const filteredMaps = searchQuery.trim()
    ? maps.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : maps

  return {
    currentFolderId,
    setCurrentFolderId,
    breadcrumbs,
    folders: filteredFolders,
    allFolders,
    maps: filteredMaps,
    allMapsMeta,
    getFolderMapCount,
    loading,
    searchQuery,
    setSearchQuery,
    createFolder,
    deleteFolder,
    createMap,
    deleteMap,
    moveMap,
    renameMap,
    duplicateMap,
    refreshData
  }
}
