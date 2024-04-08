const Excel = require("exceljs");

export const generateExcel = async (report: any) => {
  let workbook = new Excel.Workbook();
  let worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Product", key: "Product.name" },
    { header: "Sales", key: "total_sales" },
  ];

  worksheet.getRow(1).font = { bold: true };

  // Giving all data to Excel
  report.forEach((e: any, index: any) => {
    // row 1 is the header.
    const rowIndex = index + 2;

    worksheet.addRow({
      ...e,
    });
  });

  await workbook.xlsx.writeFile("Sales Report.xlsx");
  return true;
};