import prisma from '../prisma';

/**
 * Automatically removes unpaid reservations and makes their tickets available again.
 * - Deletes reservations that are PENDING and expired (24+ hours old)
 * - Cleans up old EXPIRED reservations (7+ days old)
 * - Releases all associated tickets back to AVAILABLE status
 */
export async function releaseExpiredReservations() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalReleased = 0;
  let totalCleaned = 0;

  // 1. Handle PENDING reservations that have expired (24+ hours)
  const expiredPendingReservations = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lt: now
      }
    },
    select: { id: true, tickets: { select: { id: true } } }
  });

  if (expiredPendingReservations.length > 0) {
    const reservationIds = expiredPendingReservations.map(r => r.id);
    const ticketIds = expiredPendingReservations.flatMap(r => r.tickets.map(t => t.id));

    // Update tickets to AVAILABLE and remove reservation connection
    await prisma.ticket.updateMany({
      where: {
        id: { in: ticketIds }
      },
      data: {
        status: 'AVAILABLE',
        reservationId: null
      }
    });

    // Delete the expired pending reservations
    await prisma.reservation.deleteMany({
      where: {
        id: { in: reservationIds }
      }
    });

    totalReleased = reservationIds.length;
  }

  // 2. Clean up old EXPIRED reservations (7+ days old)
  const oldExpiredReservations = await prisma.reservation.findMany({
    where: {
      status: 'EXPIRED',
      updatedAt: {
        lt: sevenDaysAgo
      }
    },
    select: { id: true }
  });

  if (oldExpiredReservations.length > 0) {
    const oldReservationIds = oldExpiredReservations.map(r => r.id);

    // Delete old expired reservations
    await prisma.reservation.deleteMany({
      where: {
        id: { in: oldReservationIds }
      }
    });

    totalCleaned = oldReservationIds.length;
  }

  return {
    releasedCount: totalReleased,
    cleanedCount: totalCleaned,
    totalProcessed: totalReleased + totalCleaned
  };
}
