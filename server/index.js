const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post('/api/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibio ningun archivo' });
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx2pdf-'));
  const inputPath = path.join(tempDir, 'input.docx');

  try {
    fs.writeFileSync(inputPath, req.file.buffer);

    await new Promise((resolve, reject) => {
      execFile('libreoffice', [
        '--headless',
        '--norestore',
        '--convert-to', 'pdf',
        '--outdir', tempDir,
        inputPath,
      ], { timeout: 30000 }, (error) => {
        if (error) reject(new Error('Error al convertir con LibreOffice: ' + error.message));
        else resolve();
      });
    });

    const pdfPath = path.join(tempDir, 'input.pdf');
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({ error: 'La conversion a PDF no genero ningun archivo' });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    res.set('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: err.message || 'Error en la conversion' });
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Servidor de conversion PDF corriendo en puerto ' + PORT);
});
