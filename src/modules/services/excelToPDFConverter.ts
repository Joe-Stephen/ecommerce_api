const ExcelJS = require("exceljs");
const { PDFDocument, StandardFonts } = require("pdf-lib");
import fs from "fs";

export const convertExcelToPDF = async (excelFilePath:string, pdfFilePath:string) => {
  // Loading Excel workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelFilePath);

  // Loading the first worksheet
  const worksheet = workbook.getWorksheet(1);

  // Createing PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  // Setting font and font size for PDF
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontSize = 12;
  page.setFont(font);
  page.setFontSize(fontSize);

  // Writing Excel data to PDF
  let y = page.getHeight() - fontSize;
  worksheet.eachRow((row:any, rowNum:any) => {
    let x = 0;
    row.eachCell((cell:any, colNum:any) => {
      page.drawText(cell.text, {
        x: x + 50,
        y: y - rowNum * fontSize,
      });
      x += 150;
    });
    y -= fontSize;
  });

  // Saving PDF to file
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfFilePath, pdfBytes);
};
