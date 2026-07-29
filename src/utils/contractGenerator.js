import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const TAG_TO_EXCEL = {
  NOMBRECOMPLETO: 'APELLIDOS Y NOMBRES',
  ID: 'ID',
  EDAD: 'EDAD',
  ESTADOCIVIL: 'ESTADO CIVIL',
  NACIONALIDAD: 'NACIONALIDAD',
  PROFESION: 'PROFESIÓN',
  DIRECCION: 'DIRECCIÓN',
  CARGO: 'CARGO',
  FECHAINGRESO: 'FECHA DE INGRESO',
  FECHAFINAL: 'FECHA FINAL DE LA OBRA',
  TIEMPOCONTRATO: 'TIEMPO O PORCENTAJE DE CONTRATO',
  SALARIO: 'SALARIO',
  SALARIOENLETRAS: 'SALARIO EN LETRAS',
  BONOCONTRATO: 'BONO CONTRATO DE TRABAJO',
  BONOCONTRATOENLETRAS: 'BONO EN LETRAS',
  FUNCIONES: 'FUNCIONES',
};

const BONO_FIELD = 'BONO CONTRATO DE TRABAJO';

export function readExcel(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

export function hasBonus(row) {
  const value = row[BONO_FIELD];
  if (value === undefined || value === null || value === '') return false;
  const num = Number(value);
  return isNaN(num) || num !== 0;
}

function buildTagData(row) {
  const data = {};
  for (const [tag, excelField] of Object.entries(TAG_TO_EXCEL)) {
    const raw = row[excelField];
    data[tag] = raw !== undefined && raw !== null ? String(raw) : '';
  }
  return data;
}

export function generateContractBlob(row, templateArrayBuffer) {
  const zip = new PizZip(templateArrayBuffer);
  const doc = new Docxtemplater(zip, {
    delimiters: { start: '@@', end: '@@' },
    paragraphLoop: false,
    linebreaks: false,
  });
  doc.render(buildTagData(row));
  return doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export async function processAll(excelBuffer, templateConBonoBuffer, templateSinBonoBuffer, onProgress) {
  const rows = readExcel(excelBuffer);
  const results = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const withBonus = hasBonus(row);
    const template = withBonus ? templateConBonoBuffer : templateSinBonoBuffer;
    const nombreCompleto = String(row['APELLIDOS Y NOMBRES'] || `persona-${i + 1}`).trim();
    const blob = generateContractBlob(row, template);

    results.push({ blob, nombre: nombreCompleto, withBonus, row });

    if (onProgress) {
      onProgress(i + 1, rows.length, nombreCompleto);
    }
  }

  return results;
}

export function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*]+/g, '').replace(/\s+/g, ' ').trim() || 'contrato';
}

export function downloadContract(result) {
  const tipo = result.withBonus
    ? 'Contrato Obra o Labor con Bono Incentivo'
    : 'Contrato Obra o Labor sin Bono Incentivo';
  const fileName = `${tipo} - ${sanitizeFileName(result.nombre)}.docx`;
  saveAs(result.blob, fileName);
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function downloadContractPdf(result) {
  const formData = new FormData();
  formData.append('file', result.blob, 'contrato.docx');

  const response = await fetch(`${API_URL}/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al generar el PDF');
  }

  const pdfBlob = await response.blob();
  const tipo = result.withBonus
    ? 'Contrato Obra o Labor con Bono Incentivo'
    : 'Contrato Obra o Labor sin Bono Incentivo';
  const fileName = `${tipo} - ${sanitizeFileName(result.nombre)}.pdf`;
  saveAs(pdfBlob, fileName);
}

export function downloadAllAsZip(results) {
  const zip = new PizZip();

  const addedNames = new Map();

  for (const result of results) {
    const tipo = result.withBonus
      ? 'Contrato Obra o Labor con Bono Incentivo'
      : 'Contrato Obra o Labor sin Bono Incentivo';
    let baseName = sanitizeFileName(result.nombre);
    const key = `${baseName}_${tipo}`;

    if (addedNames.has(key)) {
      const count = addedNames.get(key) + 1;
      addedNames.set(key, count);
      baseName = `${baseName} (${count})`;
    } else {
      addedNames.set(key, 0);
    }

    const fileName = `${tipo} - ${baseName}.docx`;
    zip.file(fileName, result.blob);
  }

  const zipBlob = zip.generate({
    type: 'blob',
    mimeType: 'application/zip',
  });
  saveAs(zipBlob, 'Contratos Generados.zip');
}
