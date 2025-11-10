import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const auctionId = searchParams.get("auctionId");

    if (!auctionId) {
      return NextResponse.json({ error: "Missing auctionId" }, { status: 400 });
    }

    // ✅ Fetch auction data (supplier+items)
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          include: {
            supplier: true, // we’ll safely read fields from here
            auctionItem: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // ✅ Create workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auction Summary");

    // --- Header Info ---
    sheet.addRow(["AUCTION SUMMARY REPORT"]);
    sheet.addRow([]);
    sheet.addRow(["Title", auction.title]);
    sheet.addRow(["Description", auction.description || ""]);
    sheet.addRow(["Ends At", new Date(auction.endsAt).toLocaleString()]);
    sheet.addRow([]);

    // --- Column Headings ---
    sheet.addRow([
      "Supplier ID",
      "Supplier Name",
      "Company Name",
      "Email",
      "Item Name",
      "Qty",
      "UOM",
      "Bid Value (₹)",
    ]);

    // --- Add bid rows safely ---
    for (const b of auction.bids) {
      const supplier: any = b.supplier || {};

      // Safe fallback extraction
      const company =
        supplier.companyName ||
        supplier.company ||
        supplier.organization ||
        "-";
      const email = supplier.email || "-";

      sheet.addRow([
        b.supplierId || "",
        supplier.name || "",
        company,
        email,
        b.auctionItem?.name || "",
        b.auctionItem?.quantity || "",
        b.auctionItem?.uom || "",
        b.bidValue || "",
      ]);
    }

    // --- Styling Header Row ---
    const headerRow = sheet.getRow(7);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    sheet.columns.forEach((col) => (col.width = 20));

    // ✅ Export buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Auction_Summary_${auction.title}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error("❌ Auction summary generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate summary", details: err.message },
      { status: 500 }
    );
  }
}
