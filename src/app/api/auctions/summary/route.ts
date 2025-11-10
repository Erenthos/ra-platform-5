import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function POST(req: Request) {
  try {
    const { auctionId } = await req.json();
    if (!auctionId)
      return NextResponse.json({ error: "auctionId required" }, { status: 400 });

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: true,
        bids: { include: { supplier: true } },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auction Summary");

    sheet.addRow(["AUCTION SUMMARY REPORT"]);
    sheet.addRow([]);
    sheet.addRow(["Title", auction.title]);
    sheet.addRow(["Description", auction.description]);
    sheet.addRow(["Ends At", auction.endsAt.toLocaleString()]);
    sheet.addRow([]);
    sheet.addRow([
      "Supplier ID",
      "Supplier Name",
      "Item Name",
      "Qty",
      "UOM",
      "Bid Value (₹)",
    ]);

    for (const bid of auction.bids) {
      const item = auction.items.find((it) => it.id === bid.auctionItemId);
      if (!item) continue;
      sheet.addRow([
        bid.supplierId,
        bid.supplier?.name || "",
        item.name,
        item.quantity,
        item.uom,
        bid.bidValue,
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename=Auction_${auction.title}_Summary.xlsx`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err) {
    console.error("❌ Error generating summary:", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
