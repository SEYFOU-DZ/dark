import fs from "fs";
import { PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";

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
        const lines = streamText.split(/\r?\n/);
        let currentMatrix = [1, 0, 0, 1, 0, 0];
        
        console.log(`--- Content Stream Object ${ref.objectNumber} ---`);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.endsWith("Tm")) {
            const parts = line.split(/\s+/);
            if (parts.length >= 7) {
              currentMatrix = parts.slice(0, 6).map(Number);
            }
          } else if (line.endsWith("Tj")) {
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
            const matches = line.match(/\(([^)]*)\)/g);
            if (matches) {
              const combined = matches.map(m => m.slice(1, -1)).join("");
              console.log(`At x=${currentMatrix[4].toFixed(1)}, y=${currentMatrix[5].toFixed(1)}: TJ [${combined}]`);
            } else {
              const hexMatches = line.match(/<([^>]*)>/g);
              if (hexMatches) {
                const combinedHex = hexMatches.map(h => {
                  const hex = h.slice(1, -1);
                  let decodedStr = "";
                  for (let j = 0; j < hex.length; j += 4) {
                    const charCode = parseInt(hex.substr(j, 4), 16);
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
