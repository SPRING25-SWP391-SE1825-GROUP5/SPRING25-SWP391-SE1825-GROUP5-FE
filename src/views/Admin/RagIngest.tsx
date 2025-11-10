import { useEffect, useMemo, useState } from 'react'
import { ragService, type DocumentItem } from '@/services/ragService'
import './RagIngest.scss'

type TabKey = 'url' | 'sitemap' | 'files' | 'images' | 'documents'

type MessageType = 'success' | 'error' | 'info'

const TABS: Array<{ key: TabKey; label: string; description: string }> = [
  { key: 'url', label: 'URL', description: 'Crawl một trang đơn lẻ' },
  { key: 'sitemap', label: 'Sitemap', description: 'Crawl toàn bộ sitemap.xml' },
  { key: 'files', label: 'Tệp tài liệu', description: 'Nhập PDF, DOCX, HTML, TXT, ZIP' },
  { key: 'images', label: 'Hình ảnh', description: 'OCR hình ảnh trước khi ingest' },
  { key: 'documents', label: 'Tài liệu đã ingest', description: 'Danh sách tài liệu hiện có' }
]

export default function RagIngest() {
  const [active, setActive] = useState<TabKey>('url')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<MessageType>('info')

  const [metadataJson, setMetadataJson] = useState<string>('')
  const [createdBy, setCreatedBy] = useState<string>('')

  const [url, setUrl] = useState<string>('')
  const [sitemapUrl, setSitemapUrl] = useState<string>('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [images, setImages] = useState<FileList | null>(null)

  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [docBusy, setDocBusy] = useState(false)
  const [filters, setFilters] = useState({ status: '', role_access: '', center_id: '', lang: '' })

  const parsedMetadata = useMemo(() => {
    try {
      if (!metadataJson.trim()) return undefined
      JSON.parse(metadataJson)
      return metadataJson
    } catch {
      return undefined
    }
  }, [metadataJson])

  useEffect(() => {
    if (active === 'documents') {
      refreshDocuments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const setMessageWithType = (text: string, type: MessageType) => {
    setMessage(text)
    setMessageType(type)
  }

  const handleIngestUrl = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await ragService.ingestUrl({ url, metadata_json: parsedMetadata, created_by: createdBy })
      setMessageWithType(`Đã ingest ${res.ingested ?? 0} trang.`, 'success')
      setUrl('')
    } catch (e: any) {
      setMessageWithType(e?.userMessage || e?.message || 'Lỗi ingest URL', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleIngestSitemap = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await ragService.ingestSitemap({ url: sitemapUrl, metadata_json: parsedMetadata, created_by: createdBy })
      setMessageWithType(`Đã ingest ${res.ingested_from_sitemap ?? 0} trang từ sitemap.`, 'success')
      setSitemapUrl('')
    } catch (e: any) {
      setMessageWithType(e?.userMessage || e?.message || 'Lỗi ingest sitemap', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleIngestFiles = async () => {
    if (!files || files.length === 0) {
      setMessageWithType('Vui lòng chọn ít nhất một tệp.', 'error')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const res = await ragService.ingestFiles(Array.from(files), parsedMetadata, createdBy)
      setMessageWithType(`Đã ingest ${res.ingested_files ?? 0} tệp.`, 'success')
      setFiles(null)
    } catch (e: any) {
      setMessageWithType(e?.userMessage || e?.message || 'Lỗi ingest tệp', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleIngestImages = async () => {
    if (!images || images.length === 0) {
      setMessageWithType('Vui lòng chọn ít nhất một hình ảnh.', 'error')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const res = await ragService.ingestImages(Array.from(images), parsedMetadata, createdBy)
      setMessageWithType(`Đã ingest ${res.ingested_images ?? 0} ảnh.`, 'success')
      setImages(null)
    } catch (e: any) {
      setMessageWithType(e?.userMessage || e?.message || 'Lỗi ingest ảnh', 'error')
    } finally {
      setBusy(false)
    }
  }

  const refreshDocuments = async () => {
    setDocBusy(true)
    try {
      const params: any = {}
      if (filters.status) params.status = filters.status
      if (filters.role_access) params.role_access = filters.role_access
      if (filters.center_id) params.center_id = Number(filters.center_id)
      if (filters.lang) params.lang = filters.lang
      const res = await ragService.listDocuments({ ...params, limit: 50, offset: 0 })
      setDocs(res.documents || [])
    } catch (e: any) {
      setMessageWithType(e?.userMessage || e?.message || 'Không thể tải danh sách tài liệu', 'error')
    } finally {
      setDocBusy(false)
    }
  }

  const statusTagClass = (status?: string) => {
    if (!status) return ''
    if (status.toUpperCase() === 'ARCHIVED') return 'is-archived'
    if (status.toUpperCase() === 'DELETED') return 'is-deleted'
    return ''
  }

  const humanizeStatus = (status?: string) => {
    if (!status) return '--'
    const map: Record<string, string> = {
      ACTIVE: 'Hoạt động',
      ARCHIVED: 'Đang lưu trữ',
      DELETED: 'Đã xoá',
      PENDING: 'Chờ xử lý'
    }
    return map[status.toUpperCase()] ?? status
  }

  const renderActivePanel = () => {
    switch (active) {
      case 'url':
        return (
          <div className="rag-ingest__panel-content">
            <div className="form-field">
              <label>URL</label>
              <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" />
              <span className="form-hint">Hệ thống sẽ crawl nội dung trang và index vào knowledge base.</span>
            </div>
            <div className="rag-ingest__actions">
              <button className="btn btn-primary" onClick={handleIngestUrl} disabled={busy || !url.trim()}>
                {busy ? 'Đang ingest...' : 'Ingest URL'}
              </button>
            </div>
          </div>
        )
      case 'sitemap':
        return (
          <div className="rag-ingest__panel-content">
            <div className="form-field">
              <label>Sitemap URL</label>
              <input className="input" value={sitemapUrl} onChange={(e) => setSitemapUrl(e.target.value)} placeholder="https://example.com/sitemap.xml" />
              <span className="form-hint">Hỗ trợ sitemap dạng XML. Hệ thống sẽ giới hạn theo cấu hình ingestion.</span>
            </div>
            <div className="rag-ingest__actions">
              <button className="btn btn-primary" onClick={handleIngestSitemap} disabled={busy || !sitemapUrl.trim()}>
                {busy ? 'Đang ingest...' : 'Ingest sitemap'}
              </button>
            </div>
          </div>
        )
      case 'files':
        return (
          <div className="rag-ingest__panel-content">
            <div className="form-field file-input">
              <label>Tệp tài liệu</label>
              <input type="file" multiple onChange={(e) => setFiles(e.target.files)} />
              <span className="form-hint">Hỗ trợ PDF, DOCX, MD, HTML, TXT, ZIP. Mỗi tệp tối đa 10MB.</span>
              {files && files.length > 0 && (
                <span className="file-input__meta">{files.length} tệp được chọn.</span>
              )}
            </div>
            <div className="rag-ingest__actions">
              <button className="btn btn-primary" onClick={handleIngestFiles} disabled={busy || !files || files.length === 0}>
                {busy ? 'Đang tải lên...' : 'Tải lên & ingest'}
              </button>
              {files && files.length > 0 && (
                <button className="btn btn-ghost" type="button" onClick={() => setFiles(null)} disabled={busy}>
                  Xoá lựa chọn
                </button>
              )}
            </div>
          </div>
        )
      case 'images':
        return (
          <div className="rag-ingest__panel-content">
            <div className="form-field file-input">
              <label>Hình ảnh</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} />
              <span className="form-hint">Hỗ trợ JPEG, PNG, WEBP... Hệ thống sẽ OCR trước khi ingest.</span>
              {images && images.length > 0 && (
                <span className="file-input__meta">{images.length} hình ảnh được chọn.</span>
              )}
            </div>
            <div className="rag-ingest__actions">
              <button className="btn btn-primary" onClick={handleIngestImages} disabled={busy || !images || images.length === 0}>
                {busy ? 'Đang xử lý...' : 'Tải lên & ingest'}
              </button>
              {images && images.length > 0 && (
                <button className="btn btn-ghost" type="button" onClick={() => setImages(null)} disabled={busy}>
                  Xoá lựa chọn
                </button>
              )}
            </div>
          </div>
        )
      case 'documents':
        return (
          <div className="rag-ingest__panel-content">
            <div className="rag-ingest__filters">
              <div className="form-field">
                <label>Trạng thái</label>
                <input className="input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} placeholder="ACTIVE" />
              </div>
              <div className="form-field">
                <label>Role access</label>
                <input className="input" value={filters.role_access} onChange={(e) => setFilters((f) => ({ ...f, role_access: e.target.value }))} placeholder="STAFF" />
              </div>
              <div className="form-field">
                <label>Center ID</label>
                <input className="input" value={filters.center_id} onChange={(e) => setFilters((f) => ({ ...f, center_id: e.target.value }))} placeholder="VD: 1" />
              </div>
              <div className="form-field">
                <label>Ngôn ngữ</label>
                <input className="input" value={filters.lang} onChange={(e) => setFilters((f) => ({ ...f, lang: e.target.value }))} placeholder="vi" />
              </div>
              <button className="btn btn-secondary" type="button" onClick={refreshDocuments} disabled={docBusy}>
                {docBusy ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>

            <div className="rag-ingest__table-wrapper">
              <table className="rag-ingest__table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Nguồn</th>
                    <th>Trạng thái</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="rag-ingest__empty">Chưa có tài liệu nào hoặc không khớp bộ lọc.</td>
                    </tr>
                  )}
                  {docs.map((d) => (
                    <tr key={d.id}>
                      <td>{d.title || '--'}</td>
                      <td>{d.source || '--'}</td>
                      <td>
                        <span className={`rag-ingest__status-tag ${statusTagClass(d.status)}`}>
                          {humanizeStatus(d.status)}
                        </span>
                      </td>
                      <td className="rag-ingest__url-cell">
                        {d.url ? (
                          <a href={d.url} target="_blank" rel="noreferrer" className="rag-ingest__link">
                            {d.url}
                          </a>
                        ) : (
                          '--'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="rag-ingest">
      <header className="rag-ingest__header">
        <div>
          <h1>RAG Ingest</h1>
          <p>Quản lý ingestion cho AI knowledge base. Cấu hình metadata, ingest tài liệu đa dạng và theo dõi dữ liệu đã được index.</p>
        </div>
      </header>

      {message && (
        <div className={`rag-ingest__message rag-ingest__message--${messageType}`}>
          {message}
        </div>
      )}

      <section className="rag-ingest__card rag-ingest__card--metadata">
        <div className="rag-ingest__card-header">
          <h2>Thông tin chung</h2>
          <p>Thông tin này sẽ được áp dụng cho tất cả tài liệu ingest trong phiên hiện tại.</p>
        </div>
        <div className="rag-ingest__form-grid">
          <div className="form-field">
            <label>Created by</label>
            <input className="input" value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} placeholder="admin@example.com" />
            <span className="form-hint">Lưu lại người đã ingest để phục vụ audit.</span>
          </div>
          <div className="form-field">
            <label>Metadata JSON</label>
            <textarea
              className={`textarea ${metadataJson && !parsedMetadata ? 'is-error' : ''}`}
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              placeholder='{"role_access":["STAFF"],"lang":"vi"}'
              rows={5}
            />
            <span className="form-hint">Dùng để giới hạn quyền truy cập (role_access, center_id, lang...). Để trống nếu tài liệu dùng chung.</span>
            {metadataJson && !parsedMetadata && <span className="form-error">Metadata JSON không hợp lệ.</span>}
          </div>
        </div>
      </section>

      <section className="rag-ingest__card">
        <div className="rag-ingest__card-header rag-ingest__card-header--tabs">
          <div>
            <h2>Phương thức ingest</h2>
            <p>{TABS.find((t) => t.key === active)?.description}</p>
          </div>
        </div>
        <div className="rag-ingest__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`rag-ingest__tab ${active === tab.key ? 'is-active' : ''}`}
              onClick={() => setActive(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rag-ingest__panel">
          {renderActivePanel()}
        </div>
      </section>
    </div>
  )
}
