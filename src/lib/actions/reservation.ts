import prisma from '../prisma';

/**
 * Marks reservations older than 24 hours (unpaid) as EXPIRED,
 * and frees up their tickets to AVAILABLE.
 */
export async function releaseExpiredReservations() {
  const now = new Date();

  // Find all reservations that are expired and still PENDING
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lt: now
      }
    },
    select: { id: true, tickets: { select: { id: true } } }
  });

  if (expiredReservations.length === 0) return { releasedCount: 0 };

  const reservationIds = expiredReservations.map(r => r.id);
  const ticketIds = expiredReservations.flatMap(r => r.tickets.map(t => t.id));

  // 1. Update Tickets to AVAILABLE and remove reservation connection
  await prisma.ticket.updateMany({
    where: {
      id: { in: ticketIds }
    },
    data: {
      status: 'AVAILABLE',
      reservationId: null
    }
  });

  // 2. Mark Reservations as EXPIRED
  await prisma.reservation.updateMany({
    where: {
      id: { in: reservationIds }
    },
    data: {
      status: 'EXPIRED'
    }
  });

  return { releasedCount: reservationIds.length };
}
