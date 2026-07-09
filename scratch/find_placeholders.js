import fs from "fs";
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRawStream, decodePDFRawStream } from "pdf-lib";

// A simple script to search for the word "مثال" or other placeholders in the PDF content stream
// and print the text instructions along with their transformation matrices (Tm).

function bytesToLatin1(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]);
  }
  return s;
}

async function findPlaceholders() {
  const fileBytes = fs.readFileSync("new.pdf");
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();
  console.log(`PDF loaded. Pages: ${pages.length}`);

  // Enumerate all content streams
  for (const [ref, obj] of pdfDoc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream) {
      let decoded: Uint8Array;
      try {
        decoded = decodePDFRawStream(obj).decode();
      } catch (e) {
        continue;
      }
      const streamText = bytesToLatin1(decoded);
      if (streamText.includes("BT")) {
        // We found a text content stream! Let's parse the text drawing commands.
        // We look for patterns like:
        // [matrix] Tm
        // (text) Tj or [ (text) ] TJ
        const lines = streamText.split(/\r?\n/);
        let currentMatrix = [1, 0, 0, 1, 0, 0];
        let currentText = "";
        
        console.log(`--- Content Stream Object ${ref.objectNumber} ---`);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.endsWith("Tm")) {
            const parts = line.split(/\s+/);
            if (parts.length >= 7) {
              currentMatrix = parts.slice(0, 6).map(Number);
            }
          } else if (line.endsWith("Tj")) {
            // e.g. (text) Tj or <hex> Tj
            if (line.startsWith("(")) {
              const textMatch = line.match(/^\((.*)\)\s*Tj$/);
              if (textMatch) {
                const txt = textMatch[1];
                console.log(`At x=${currentMatrix[4].toFixed(1)}, y=${currentMatrix[5].toFixed(1)}: Tj (${txt})`);
              }
            } else if (line.startsWith("<")) {
              const hexMatch = line.match(/^<(.*)>\s*Tj$/);
              if (hexMatch) {
                const hex = hexMatch[1];
                let decodedStr = "";
                for (let j = 0; j < hex.length; j += 4) {
                  const charCode = parseInt(hex.substr(j, 4), 16);
                  decodedStr += String.fromCharCode(charCode);
                }
                console.log(`At x=${currentMatrix[4].toFixed(1)}, y=${currentMatrix[5].toFixed(1)}: Tj <hex> (${decodedStr})`);
              }
            }
          } else if (line.endsWith("TJ")) {
            // Array of strings and numbers, e.g. [ (text) -10 (text) ] TJ
            // Let's extract all strings in parentheses
            const matches = line.match(/\(([^)]*)\)/g);
            if (matches) {
              const combined = matches.map(m => m.slice(1, -1)).join("");
              console.log(`At x=${currentMatrix[4].toFixed(1)}, y=${currentMatrix[5].toFixed(1)}: TJ [${combined}]`);
            } else {
              // Try hex arrays
              const hexMatches = line.match(/<([^>]*)>[-0-9\s]*/g);
              if (hexMatches) {
                const combinedHex = hexMatches.map(m => {
                  const h = m.match(/<([^>]*)>/)?.[1] || "";
                  let decodedStr = "";
                  for (let j = 0; j < h.length; j += 4) {
                    const charCode = parseInt(h.substr(j, 4), 16);
                    decodedStr += String.fromCharCode(charCode);
                  }
                  return decodedStr;
                }).join("");
                console.log(`At x=${currentMatrix[4].toFixed(1)}, y=${currentMatrix[5].toFixed(1)}: TJ <hex> [${combinedHex}]`);
              }
            }
          }
        }
      }
    }
  }
}

findPlaceholders().catch(console.error);
