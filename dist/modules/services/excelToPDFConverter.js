"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertExcelToPDF = void 0;
const ExcelJS = require("exceljs");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const fs_1 = __importDefault(require("fs"));
const convertExcelToPDF = (excelFilePath, pdfFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    // Loading Excel workbook
    const workbook = new ExcelJS.Workbook();
    yield workbook.xlsx.readFile(excelFilePath);
    // Loading the first worksheet
    const worksheet = workbook.getWorksheet(1);
    // Createing PDF document
    const pdfDoc = yield PDFDocument.create();
    const page = pdfDoc.addPage();
    // Setting font and font size for PDF
    const font = yield pdfDoc.embedFont(StandardFonts.Courier);
    const fontSize = 12;
    page.setFont(font);
    page.setFontSize(fontSize);
    // Writing Excel data to PDF
    let y = page.getHeight() - fontSize;
    worksheet.eachRow((row, rowNum) => {
        let x = 0;
        row.eachCell((cell, colNum) => {
            page.drawText(cell.text, {
                x: x + 50,
                y: y - rowNum * fontSize,
            });
            x += 150;
        });
        y -= fontSize;
    });
    // Saving PDF to file
    const pdfBytes = yield pdfDoc.save();
    fs_1.default.writeFileSync(pdfFilePath, pdfBytes);
});
exports.convertExcelToPDF = convertExcelToPDF;
