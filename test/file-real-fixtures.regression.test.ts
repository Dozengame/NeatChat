import JSZip from "jszip";
import { readAttachmentFile } from "../app/utils/file";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function createDocxFixture(paragraphs: string[]) {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="${DOCX_MIME}.main+xml"/>
</Types>`,
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.folder("word")?.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs
      .map(
        (text) =>
          `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`,
      )
      .join("")}
    <w:sectPr/>
  </w:body>
</w:document>`,
  );

  return zip.generateAsync({ type: "uint8array" });
}

describe("real attachment fixture regression", () => {
  test("parses a generated docx file through readAttachmentFile", async () => {
    const marker = "NEATCHAT_DOCX_DYNAMIC_IMPORT_REGRESSION_20260513";
    const fixture = await createDocxFixture([
      marker,
      "Word parser real file regression content.",
    ]);
    const file = new File([fixture], "sample.docx", { type: DOCX_MIME });

    const result = await readAttachmentFile(file);

    expect(result.name).toBe("sample.docx");
    expect(result.type).toBe(DOCX_MIME);
    expect(result.content).toContain(marker);
    expect(result.content).toContain("Word parser real file regression content.");
  });
});
