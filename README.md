# Generador de Contratos ADP

Aplicacion web de Solutions & Payroll para generar automaticamente contratos de obra o labor a partir de un archivo Excel con datos de empleados.

## Funcionamiento

1. El usuario sube un archivo Excel (`Formato Reporte de Ingresos.xlsx`) con los datos de las personas
2. La aplicacion lee cada fila y determina si la persona tiene **bono incentivo** (columna `BONO CONTRATO DE TRABAJO` con valor diferente a vacio o 0)
3. Segun el caso, se usa una de dos plantillas Word:
   - **Con bono**: `Contrato Obra o Labor con Bono Incentivo Adicional.docx`
   - **Sin bono**: `Contrato Obra o Labor sin Bono Incentivo.docx`
4. Se reemplazan las etiquetas `@@TAG@@` en la plantilla con los datos correspondientes del Excel
5. Se genera un archivo Word por cada persona, descargable individualmente o en lote (ZIP)

## Etiquetas reemplazadas

| Etiqueta en Word | Columna en Excel |
|---|---|
| `@@NOMBRECOMPLETO@@` | APELLIDOS Y NOMBRES |
| `@@ID@@` | ID |
| `@@EDAD@@` | EDAD |
| `@@ESTADOCIVIL@@` | ESTADO CIVIL |
| `@@NACIONALIDAD@@` | NACIONALIDAD |
| `@@PROFESION@@` | PROFESION |
| `@@DIRECCION@@` | DIRECCION |
| `@@CARGO@@` | CARGO |
| `@@FECHAINGRESO@@` | FECHA DE INGRESO |
| `@@FECHAFINAL@@` | FECHA FINAL DE LA OBRA |
| `@@TIEMPOCONTRATO@@` | TIEMPO O PORCENTAJE DE CONTRATO |
| `@@SALARIO@@` | SALARIO |
| `@@SALARIOENLETRAS@@` | SALARIO EN LETRAS |
| `@@BONOCONTRATO@@` | BONO CONTRATO DE TRABAJO |
| `@@BONOCONTRATOENLETRAS@@` | BONO EN LETRAS |
| `@@FUNCIONES@@` | FUNCIONES |

## Archivos de plantilla

Las plantillas Word deben ubicarse en `public/templates/`. Los archivos incluidos son:

- `Contrato Obra o Labor con Bono Incentivo Adicional (1).docx`
- `Contrato Obra o Labor sin Bono Incentivo (1).docx`

Para modificar las plantillas: editalas en Word, agrega nuevas etiquetas `@@TAG@@` donde necesites, y actualiza el mapeo en `src/utils/contractGenerator.js`.

## Estructura del proyecto

```
├── public/
│   ├── Logo syp.png
│   └── templates/
│       ├── Formato Reporte de Ingresos.xlsx
│       ├── Contrato Obra o Labor con Bono Incentivo Adicional (1).docx
│       └── Contrato Obra o Labor sin Bono Incentivo (1).docx
├── src/
│   ├── utils/
│   │   └── contractGenerator.js   # Logica de procesamiento
│   ├── App.jsx                    # Componente principal
│   ├── App.css                    # Estilos
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Tecnologias

- **React 18** + **Vite 5**
- **xlsx** - Lectura de archivos Excel
- **docxtemplater** + **pizzip** - Manipulacion y reemplazo de etiquetas en DOCX
- **file-saver** - Descarga de archivos en el navegador

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para produccion
npm run build
```

## Como agregar un nuevo tag

1. Edita la plantilla Word y escribe `@@NUEVOTAG@@` donde corresponda
2. En `src/utils/contractGenerator.js`, agrega la entrada al `TAG_TO_EXCEL`:
   ```js
   NUEVOTAG: 'NOMBRE COLUMNA EN EXCEL',
   ```
3. Asegurate de que el Excel tenga esa columna con el nombre exacto

## Notas importantes

- La columna `BONO CONTRATO DE TRABAJO` determina que plantilla se usa: si tiene un valor distinto de vacio y 0, va al template con bono; de lo contrario al sin bono
- Los tags en Word deben escribirse exactamente como `@@NOMBRETAG@@` (dos arrobas al inicio y al final)
- `docxtemplater` maneja automaticamente los casos donde Word parte las etiquetas en multiples fragmentos XML al editar, preservando el formato original (negritas, fuentes, etc.)

---

(c) 2026 Solutions & Payroll. Uso interno.
