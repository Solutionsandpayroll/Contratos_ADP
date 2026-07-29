import { useState, useRef, useCallback } from 'react'
import './App.css'
import { processAll, downloadContract, downloadContractPdf, downloadAllAsZip } from './utils/contractGenerator'

const TEMPLATES_BASE = '/templates'
const CON_BONO_FILE = 'Contrato Obra o Labor con Bono Incentivo Adicional (1).docx'
const SIN_BONO_FILE = 'Contrato Obra o Labor sin Bono Incentivo (1).docx'

function App() {
  const [isHelpExpanded, setIsHelpExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' })
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [excelFile, setExcelFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [pdfLoadingIdx, setPdfLoadingIdx] = useState(null)
  const fileInputRef = useRef(null)

  async function fetchTemplate(name) {
    const url = `${TEMPLATES_BASE}/${encodeURIComponent(name)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`No se pudo cargar la plantilla: ${name}`)
    return res.arrayBuffer()
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Error al leer el archivo Excel'))
      reader.readAsArrayBuffer(file)
    })
  }

  function handleFileSelect(file) {
    if (!file) return
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    const validExt = /\.(xlsx|xls)$/i
    if (!validTypes.includes(file.type) && !validExt.test(file.name)) {
      setError('El archivo debe ser un Excel (.xlsx o .xls)')
      return
    }
    setError(null)
    setResults(null)
    setExcelFile(file)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleRemoveFile() {
    setExcelFile(null)
    setResults(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [])

  async function handleGenerate() {
    if (!excelFile) return
    setLoading(true)
    setError(null)
    setResults(null)
    setProgress({ current: 0, total: 0, name: '' })

    try {
      const [excelBuffer, conBonoBuffer, sinBonoBuffer] = await Promise.all([
        readFileAsArrayBuffer(excelFile),
        fetchTemplate(CON_BONO_FILE),
        fetchTemplate(SIN_BONO_FILE),
      ])

      const generated = await processAll(
        excelBuffer,
        conBonoBuffer,
        sinBonoBuffer,
        (current, total, name) => setProgress({ current, total, name })
      )

      setResults(generated)
    } catch (err) {
      setError(err.message || 'Error al procesar los contratos')
    } finally {
      setLoading(false)
    }
  }

  function handleDownloadOne(result) {
    downloadContract(result)
  }

  async function handleDownloadPdf(result, idx) {
    setPdfLoadingIdx(idx)
    try {
      await downloadContractPdf(result)
    } finally {
      setPdfLoadingIdx(null)
    }
  }

  function handleDownloadAll() {
    if (!results || results.length === 0) return
    downloadAllAsZip(results)
  }

  const conBono = results ? results.filter(r => r.withBonus).length : 0
  const sinBono = results ? results.filter(r => !r.withBonus).length : 0

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo-container">
              <div className="logo">
                <img
                  src="/Logo syp.png"
                  alt="Solutions & Payroll Logo"
                  width="60"
                  height="60"
                />
              </div>
              <div className="header-text">
                <h1>Solutions & Payroll</h1>
                <p className="subtitle">Generador de Contratos</p>
              </div>
            </div>
            <div className="welcome-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Bienvenido, Usuario</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">

          <div className="help-section">
            <button
              className="help-toggle"
              onClick={() => setIsHelpExpanded(!isHelpExpanded)}
              aria-expanded={isHelpExpanded}
            >
              <div className="help-toggle-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span>Como usar esta aplicacion</span>
              </div>
              <svg
                className={`chevron ${isHelpExpanded ? 'expanded' : ''}`}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div className={`help-content ${isHelpExpanded ? 'expanded' : ''}`}>
              <ol className="help-list">
                <li>
                  <span className="step-number">1</span>
                  <div>
                    <strong>Sube el archivo Excel</strong>
                    <p>Arrastra o selecciona el archivo "Formato Reporte de Ingresos.xlsx" con los datos de las personas.</p>
                  </div>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <div>
                    <strong>Genera los contratos</strong>
                    <p>Presiona el boton "Generar Contratos". Las personas con bono iran al template con bono, las demas al template sin bono.</p>
                  </div>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <div>
                    <strong>Descarga</strong>
                    <p>Descarga contratos en Word o PDF. El PDF se genera via backend y es identico al Word. La primera vez puede tardar ~30s (el servidor se despierta).</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Generador de Contratos</h2>
              <p className="description">
                Genera contratos de obra o labor a partir del archivo Excel, usando las plantillas Word con y sin bono incentivo.
              </p>
            </div>

            <div className="card-body">
              <div className="form-section">

                {!excelFile ? (
                  <div
                    className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="drop-zone-content">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="12" y2="12"/>
                        <line x1="15" y1="15" x2="12" y2="12"/>
                      </svg>
                      <div className="drop-zone-text">
                        <span className="drop-zone-title">Arrastra tu archivo Excel aqui</span>
                        <span className="drop-zone-subtitle">o haz clic para seleccionarlo</span>
                      </div>
                      <span className="drop-zone-hint">Formatos aceptados: .xlsx, .xls</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="file-input"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="file-preview">
                    <div className="file-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="file-details">
                      <span className="file-name">{excelFile.name}</span>
                      <span className="file-size">{(excelFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button className="btn-remove" onClick={handleRemoveFile} title="Quitar archivo">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <button
                    className="btn-primary"
                    onClick={handleGenerate}
                    disabled={loading || !excelFile}
                  >
                    {loading ? (
                      <>
                        <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Generando...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        Generar Contratos
                      </>
                    )}
                  </button>
                </div>

                {loading && progress.total > 0 && (
                  <div className="progress-container">
                    <div className="progress-info">
                      <span>Procesando {progress.current} de {progress.total}</span>
                      <span className="progress-name">{progress.name}</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="error-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {results && results.length > 0 && (
                  <div className="results-section">
                    <div className="results-header">
                      <div className="results-summary">
                        <span className="summary-badge badge-total">{results.length} contratos</span>
                        <span className="summary-badge badge-bono">{conBono} con bono</span>
                        <span className="summary-badge badge-sinbono">{sinBono} sin bono</span>
                      </div>
                      <button className="btn-download-all" onClick={handleDownloadAll}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Descargar Todo (ZIP)
                      </button>
                    </div>

                    <div className="results-table-wrapper">
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Tipo</th>
                            <th>Accion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r, i) => (
                            <tr key={i} className={r.withBonus ? 'row-bono' : 'row-sinbono'}>
                              <td className="col-num">{i + 1}</td>
                              <td className="col-name">{r.nombre}</td>
                              <td>
                                <span className={`type-badge ${r.withBonus ? 'type-con-bono' : 'type-sin-bono'}`}>
                                  {r.withBonus ? 'Con Bono' : 'Sin Bono'}
                                </span>
                              </td>
                              <td className="col-actions">
                                <button className="btn-download-one" onClick={() => handleDownloadOne(r)}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                  </svg>
                                  Word
                                </button>
                                <button
                                  className="btn-download-pdf"
                                  onClick={() => handleDownloadPdf(r, i)}
                                  disabled={pdfLoadingIdx === i}
                                >
                                  {pdfLoadingIdx === i ? (
                                    <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                    </svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                      <polyline points="14 2 14 8 20 8"/>
                                      <line x1="12" y1="18" x2="12" y2="9"/>
                                      <polyline points="9 13 12 16 15 13"/>
                                    </svg>
                                  )}
                                  PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Solutions & Payroll. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
