import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } },
) {
  try {
    const roomId = params.roomId;

    const transactions = await db.transaction.findMany({
      where: { gameId: roomId },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
        fromPlayer: {
          select: {
            id: true,
            name: true,
          },
        },
        toPlayer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 transactions
    });

    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      fromPlayer: transaction.fromPlayer?.name,
      toPlayer: transaction.toPlayer?.name,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
      playerName: transaction.player?.name,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}

