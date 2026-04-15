export interface ScheduledBus {
  arrivalTime: string;
  busNumber: string;
}

// Ensure the local time conceptually matches Zhetisay time (UTC+5),
// though using the client's local time is standard for offline PWAs.
// We'll operate in minutes since midnight (e.g. 08:30 -> 510) and then format back.
function toGlobalMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getScheduledEta(routeId: string, stopId: string, nowMs: number): ScheduledBus | null {
  const now = new Date(nowMs);
  const nowMin = toGlobalMinutes(now);

  if (routeId === '1') {
    // Route 1 (2 buses)
    // Departures from Базар every 15 minutes starting from 08:00 until 18:30.
    // Bus 1 at :00, :30
    // Bus 2 at :15, :45
    const startMin = 8 * 60; // 08:00
    const endMin = 18 * 60 + 30; // 18:30

    const offsets: Record<string, number> = {
      'r1-bazaar': 0, // treating r1-bazaar as start stop initially
      'bazaar': 0,
      'trimugol': 8, // Using a fallback ID for custom waypoints if needed
      'pedkol': 14,
      'polyclinic': 18,
      'nurai': 20,
    };

    // If stop id is just string name for now
    let offset = 0;
    const lowerStop = stopId.toLowerCase()
    if (lowerStop.includes('базар')) offset = 0;
    else if (lowerStop.includes('тримугол')) offset = 8;
    else if (lowerStop.includes('пед')) offset = 14;
    else if (lowerStop.includes('поли')) offset = 18;
    else if (lowerStop.includes('нурай')) offset = 20;

    let nextDepartureMin = Math.ceil((nowMin - offset) / 15) * 15;
    if (nextDepartureMin < startMin) nextDepartureMin = startMin;
    if (nextDepartureMin > endMin) return null; // No more buses today

    const arrivalTimeMin = nextDepartureMin + offset;
    
    // Determine Bus Number based on departure minute
    // 0 or 30 past the hour -> Bus 1
    // 15 or 45 past the hour -> Bus 2
    const isBus1 = (nextDepartureMin % 60 === 0) || (nextDepartureMin % 60 === 30);
    const busNumber = isBus1 ? '1' : '2';

    return {
      arrivalTime: formatTime(arrivalTimeMin),
      busNumber
    };
  }

  if (routeId === '2') {
    // Route 2 (3 buses)
    // Northbound limits
    const nbStartMin = 8 * 60;
    const nbEndMin = 19 * 60 + 40;
    // Southbound limits
    const sbStartMin = 9 * 60; // 09:00
    
    // Determine if the stop belongs to the Northbound or Southbound phase based on current UI.
    // Since we don't have a strict directional UI toggle for offline waits, we can infer by trying both
    // and taking the earliest arrival! Since it's a loop.
    
    const nbOffsets: Record<string, number> = {
      'зигзаг': 0,
      'мектеп': 6,
      'аурухана': 13,
      'базар': 18,
      'поли': 23,
    };
    
    const sbOffsets: Record<string, number> = {
      'базар': 0,
      'аурухана': 5,
      'мектеп': 12,
      'зигзаг': 20, // To ЗигЗаг
    };

    const lowerStop = stopId.toLowerCase();
    
    let nbDepartureMin = Math.ceil((nowMin - (nbOffsets[lowerStop] ?? 0)) / 20) * 20;
    if (nbDepartureMin < nbStartMin) nbDepartureMin = nbStartMin;
    
    let sbDepartureMin = Math.ceil((nowMin - (sbOffsets[lowerStop] ?? 0)) / 20) * 20;
    if (sbDepartureMin < sbStartMin) sbDepartureMin = sbStartMin;

    // Both legs are possible arrivals. If a stop is on both (e.g. bazaar), pick the sooner one.
    // Wait, Poly-ка is only NB, ЗигЗаг is only depart NB / arrive SB.
    let bestArrival = Infinity;
    let nextDeparture = 0;
    
    // Can it be visited Northbound?
    if ('зигзаг' in nbOffsets && lowerStop.includes('зигзаг')) {
       // if we are waiting at zigzag, are we waiting for a northbound departure or southbound arrival?
       // Usually departure.
       if (nbDepartureMin <= nbEndMin) {
           bestArrival = nbDepartureMin + 0;
           nextDeparture = nbDepartureMin;
       }
    } else {
       // Check NB
       let hasNb = false;
       let hasSb = false;
       for (const k in nbOffsets) {
           if (lowerStop.includes(k)) {
               const arrival = nbDepartureMin + nbOffsets[k];
               if (nbDepartureMin <= nbEndMin && arrival < bestArrival) {
                   bestArrival = arrival;
                   nextDeparture = nbDepartureMin;
                   hasNb = true;
               }
           }
       }
       // Check SB
       for (const k in sbOffsets) {
           if (lowerStop.includes(k)) {
               const arrival = sbDepartureMin + sbOffsets[k];
               if (arrival < bestArrival) {
                   bestArrival = arrival;
                   nextDeparture = sbDepartureMin; // Note: SB departure is from Bazaar
                   hasSb = true;
               }
           }
       }
    }

    if (bestArrival === Infinity) return null;

    // Determine Bus Number based on departure minute 
    // Departures from ЗигЗаг (NB) OR Базар (SB) are exactly: :00, :20, :40
    // Based on the timetable at ЗигЗаг:
    // Bus 1: :00
    // Bus 2: :20
    // Bus 3: :40
    // And for SB departures from Базар:
    // Bus 2: :00
    // Bus 3: :20
    // Bus 1: :40
    let busNumber = '';
    const minuteOff = nextDeparture % 60;
    
    // We need to know if the bestArrival came from an NB offset or SB offset to assign bus correctly.
    // But since ЗигЗаг depart and Базар depart are offset by exact times, let's just use the minute slot logic.
    let isSb = false;
    for (const k in sbOffsets) {
        if (lowerStop.includes(k) && bestArrival === nextDeparture + sbOffsets[k]) isSb = true;
    }

    if (!isSb) {
      if (minuteOff === 0) busNumber = '1';
      else if (minuteOff === 20) busNumber = '2';
      else if (minuteOff === 40) busNumber = '3';
    } else {
      if (minuteOff === 0) busNumber = '2';
      else if (minuteOff === 20) busNumber = '3';
      else if (minuteOff === 40) busNumber = '1';
    }

    return {
      arrivalTime: formatTime(bestArrival),
      busNumber
    };
  }

  return null;
}
