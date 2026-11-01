export interface ParticipantForMatching {
  id: string;
  name: string;
  subgroupId: string;
}

export interface MatchingResult {
  success: boolean;
  assignments: Map<string, string>; // giverId -> receiverId
  error?: string;
}

/**
 * Validates whether the given subgroup sizes can theoretically allow a valid assignment.
 * Necessary condition: For every subgroup S, |S| <= N - |S| => 2 * |S| <= N.
 */
export function checkFeasibility(participants: ParticipantForMatching[]): {
  feasible: boolean;
  reason?: string;
} {
  const n = participants.length;
  if (n < 3) {
    return {
      feasible: false,
      reason: `Mindestens 3 Teilnehmer sind erforderlich (aktuell: ${n}).`,
    };
  }

  const countsBySubgroup = new Map<string, number>();
  for (const p of participants) {
    countsBySubgroup.set(p.subgroupId, (countsBySubgroup.get(p.subgroupId) || 0) + 1);
  }

  if (countsBySubgroup.size < 2) {
    return {
      feasible: false,
      reason: "Es müssen mindestens 2 verschiedene Untergruppen vorhanden sein.",
    };
  }

  for (const [subgroupId, count] of countsBySubgroup.entries()) {
    if (count > n - count) {
      return {
        feasible: false,
        reason: `Eine Gruppe hat ${count} von ${n} Teilnehmern. Das ist mehr als die Hälfte aller Teilnehmer – ein Wichteln ohne Gruppenschnittmenge ist mathematisch unmöglich!`,
      };
    }
  }

  return { feasible: true };
}

/**
 * Generates a valid Wichteln assignment satisfying:
 * 1. Derangement: giver != receiver
 * 2. Subgroup exclusion: subgroup(giver) != subgroup(receiver)
 * 3. No 2-person swaps: receiver(receiver(giver)) != giver
 * 4. Every person gives 1 gift and receives 1 gift
 */
export function generateWichtelMatching(
  participants: ParticipantForMatching[],
  maxTries: number = 250
): MatchingResult {
  const feasibility = checkFeasibility(participants);
  if (!feasibility.feasible) {
    return {
      success: false,
      assignments: new Map(),
      error: feasibility.reason,
    };
  }

  const n = participants.length;
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  for (let attempt = 0; attempt < maxTries; attempt++) {
    // Shuffle giver order for randomness
    const givers = [...participants].sort(() => Math.random() - 0.5);
    const assignedReceivers = new Set<string>();
    const currentAssignments = new Map<string, string>(); // giverId -> receiverId

    let backtrackSuccess = solveBacktracking(
      0,
      givers,
      currentAssignments,
      assignedReceivers,
      participantMap
    );

    if (backtrackSuccess) {
      // Final sanity validation
      if (isValidMatching(currentAssignments, participantMap)) {
        return {
          success: true,
          assignments: currentAssignments,
        };
      }
    }
  }

  return {
    success: false,
    assignments: new Map(),
    error:
      "Es konnte keine gültige Wichtel-Kombination ohne gegenseitige 2er-Tausche gefunden werden. Bitte Gruppen überprüfen.",
  };
}

function solveBacktracking(
  index: number,
  givers: ParticipantForMatching[],
  assignments: Map<string, string>,
  usedReceivers: Set<string>,
  participantMap: Map<string, ParticipantForMatching>
): boolean {
  if (index === givers.length) {
    return true;
  }

  const giver = givers[index];

  // Candidates: any participant not in same subgroup and not already receiving
  const candidates: ParticipantForMatching[] = [];
  for (const p of participantMap.values()) {
    if (p.id === giver.id) continue;
    if (p.subgroupId === giver.subgroupId) continue;
    if (usedReceivers.has(p.id)) continue;

    // Avoid 2-cycle: If candidate p already gave to giver, then giver cannot give to p
    if (assignments.get(p.id) === giver.id) {
      continue;
    }

    candidates.push(p);
  }

  // Shuffle candidates to ensure variety
  candidates.sort(() => Math.random() - 0.5);

  for (const candidate of candidates) {
    assignments.set(giver.id, candidate.id);
    usedReceivers.add(candidate.id);

    if (
      solveBacktracking(
        index + 1,
        givers,
        assignments,
        usedReceivers,
        participantMap
      )
    ) {
      return true;
    }

    // Backtrack
    assignments.delete(giver.id);
    usedReceivers.delete(candidate.id);
  }

  return false;
}

/**
 * Validates all business rules on a completed assignment map
 */
export function isValidMatching(
  assignments: Map<string, string>,
  participantMap: Map<string, ParticipantForMatching>
): boolean {
  const givers = Array.from(assignments.keys());
  const receivers = Array.from(assignments.values());

  if (givers.length !== participantMap.size) return false;
  if (new Set(receivers).size !== participantMap.size) return false;

  for (const [giverId, receiverId] of assignments.entries()) {
    const giver = participantMap.get(giverId);
    const receiver = participantMap.get(receiverId);
    if (!giver || !receiver) return false;

    // 1. No self-assignment
    if (giverId === receiverId) return false;

    // 2. No same subgroup
    if (giver.subgroupId === receiver.subgroupId) return false;

    // 3. No 2-person mutual swap
    const receiverGivesTo = assignments.get(receiverId);
    if (receiverGivesTo === giverId) return false;
  }

  return true;
}
