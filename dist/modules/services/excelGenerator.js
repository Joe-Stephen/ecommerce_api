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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcel = void 0;
const Excel = require("exceljs");
const generateExcel = (report) => __awaiter(void 0, void 0, void 0, function* () {
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet("Sales Report");
    worksheet.columns = [
        { header: "Product", key: "Product.name" },
        { header: "Sales", key: "total_sales" },
    ];
    worksheet.getRow(1).font = { bold: true };
    // Giving all data to Excel
    report.forEach((e, index) => {
        // row 1 is the header.
        const rowIndex = index + 2;
        worksheet.addRow(Object.assign({}, e));
    });
    yield workbook.xlsx.writeFile("Sales Report.xlsx");
    return true;
});
exports.generateExcel = generateExcel;
