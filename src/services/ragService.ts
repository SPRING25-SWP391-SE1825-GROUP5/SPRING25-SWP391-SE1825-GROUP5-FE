import api from './api'

export interface IngestResult {
  ingested?: number
  ingested_images?: number
  ingested_files?: number
  ingested_from_sitemap?: number
}

export interface DocumentItem {
  id: string
  source?: string
  title?: string
  url?: string
  status?: string
  metadata?: any
  created_at?: string
}

export const ragService = {
  ingestUrl(form: { url?: string; metadata_json?: string; created_by?: string }) {
    const data = new FormData()
    if (form.url) data.append('url', form.url)
    if (form.metadata_json) data.append('metadata_json', form.metadata_json)
    if (form.created_by) data.append('created_by', form.created_by)
    return api.post<IngestResult>('/admin/rag/ingest', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  ingestSitemap(params: { url: string; metadata_json?: string; created_by?: string }) {
    return api.post<IngestResult>('/admin/rag/ingest-sitemap', null, { params }).then(r => r.data)
  },

  ingestFiles(files: File[], metadata_json?: string, created_by?: string) {
    const data = new FormData()
    files.forEach(f => data.append('files', f))
    if (metadata_json) data.append('metadata_json', metadata_json)
    if (created_by) data.append('created_by', created_by)
    return api.post<IngestResult>('/admin/rag/ingest-files', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  ingestImages(files: File[], metadata_json?: string, created_by?: string) {
    const data = new FormData()
    files.forEach(f => data.append('files', f))
    if (metadata_json) data.append('metadata_json', metadata_json)
    if (created_by) data.append('created_by', created_by)
    return api.post<IngestResult>('/admin/rag/ingest-images', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  listDocuments(query: { status?: string; role_access?: string; center_id?: number; lang?: string; limit?: number; offset?: number } = {}) {
    return api.get<{ documents: DocumentItem[]; count: number }>('/admin/rag/documents', { params: query }).then(r => r.data)
  },

  getDocument(id: string) {
    return api.get<DocumentItem>(`/admin/rag/documents/${id}`).then(r => r.data)
  },

  updateDocument(id: string, body: any, updatedBy?: string) {
    return api.put(`/admin/rag/documents/${id}`, body, { headers: updatedBy ? { 'X-Updated-By': updatedBy } : undefined }).then(r => r.data)
  },

  deleteDocument(id: string, deletedBy?: string) {
    return api.delete(`/admin/rag/documents/${id}`, { headers: deletedBy ? { 'X-Deleted-By': deletedBy } : undefined }).then(r => r.data)
  },

  restoreDocument(id: string, updatedBy?: string) {
    return api.post(`/admin/rag/documents/${id}/restore`, null, { headers: updatedBy ? { 'X-Updated-By': updatedBy } : undefined }).then(r => r.data)
  },
}
