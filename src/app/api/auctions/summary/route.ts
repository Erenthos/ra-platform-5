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

    // Fetch auction details with bids, suppliers, and items
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          include: {
            supplier: true, // 👈 ensures supplier details (name, email, company)
            auctionItem: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auction Summary");

    // Header info
    sheet.addRow(["AUCTION SUMMARY REPORT"]);
    sheet.addRow([]);
    sheet.addRow(["Title", auction.title]);
    sheet.addRow(["Description", auction.description || ""]);
    sheet.addRow(["Ends At", new Date(auction.endsAt).toLocaleString()]);
    sheet.addRow([]);
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

    // Add bid data
    auction.bids.forEach((b) => {
      sheet.addRow([
        b.supplierId,
        b.supplier?.name || "",
        b.supplier?.companyName || "-", // 👈 added company name
        b.supplier?.email || "-",       // 👈 added email
        b.auctionItem?.name || "",
        b.auctionItem?.quantity || "",
        b.auctionItem?.uom || "",
        b.bidValue || "",
      ]);
    });

    // Style header row
    sheet.getRow(7).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" }, // blue header background
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    // Buffer output
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Auction_Summary_${auction.title}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("❌ summary error:", err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
