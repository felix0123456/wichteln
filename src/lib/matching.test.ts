import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkFeasibility,
  generateWichtelMatching,
  isValidMatching,
  ParticipantForMatching,
} from "./matching";

describe("Wichteln Matching Algorithm", () => {
  it("rejects less than 3 participants", () => {
    const participants: ParticipantForMatching[] = [
      { id: "1", name: "Anna", subgroupId: "g1" },
      { id: "2", name: "Ben", subgroupId: "g2" },
    ];
    const res = checkFeasibility(participants);
    assert.strictEqual(res.feasible, false);
    assert.match(res.reason!, /Mindestens 3/);
  });

  it("rejects when one subgroup has more than half of the participants", () => {
    const participants: ParticipantForMatching[] = [
      { id: "1", name: "A", subgroupId: "family1" },
      { id: "2", name: "B", subgroupId: "family1" },
      { id: "3", name: "C", subgroupId: "family1" },
      { id: "4", name: "D", subgroupId: "family2" },
    ];
    const res = checkFeasibility(participants);
    assert.strictEqual(res.feasible, false);
    assert.match(res.reason!, /mehr als die Hälfte/);
  });

  it("successfully generates matching for realistic family with 4 subgroups", () => {
    const participants: ParticipantForMatching[] = [
      // Family Müller (3 members)
      { id: "m1", name: "Papa Müller", subgroupId: "mueller" },
      { id: "m2", name: "Mama Müller", subgroupId: "mueller" },
      { id: "m3", name: "Kind Müller", subgroupId: "mueller" },

      // Family Schmidt (4 members)
      { id: "s1", name: "Onkel Schmidt", subgroupId: "schmidt" },
      { id: "s2", name: "Tante Schmidt", subgroupId: "schmidt" },
      { id: "s3", name: "Cousin 1", subgroupId: "schmidt" },
      { id: "s4", name: "Cousin 2", subgroupId: "schmidt" },

      // Family Weber (3 members)
      { id: "w1", name: "Felix Weber", subgroupId: "weber" },
      { id: "w2", name: "Laura Weber", subgroupId: "weber" },
      { id: "w3", name: "Tim Weber", subgroupId: "weber" },

      // Oma & Opa (2 members)
      { id: "o1", name: "Oma", subgroupId: "grosseltern" },
      { id: "o2", name: "Opa", subgroupId: "grosseltern" },
    ];

    const partMap = new Map(participants.map((p) => [p.id, p]));
    const result = generateWichtelMatching(participants);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.assignments.size, participants.length);

    // Verify all rules
    assert.strictEqual(isValidMatching(result.assignments, partMap), true);

    for (const [giverId, receiverId] of result.assignments.entries()) {
      const giver = partMap.get(giverId)!;
      const receiver = partMap.get(receiverId)!;

      // No self-gifting
      assert.notStrictEqual(giverId, receiverId);

      // No subgroup gifting
      assert.notStrictEqual(giver.subgroupId, receiver.subgroupId);

      // No 2-person reciprocal swaps
      assert.notStrictEqual(result.assignments.get(receiverId), giverId);
    }
  });

  it("passes 100 randomized runs without violating any constraint", () => {
    const groups = ["A", "B", "C", "D", "E"];
    const participants: ParticipantForMatching[] = [];
    let idCounter = 1;

    for (const g of groups) {
      const size = 2 + Math.floor(Math.random() * 3); // 2 to 4 people per group
      for (let i = 0; i < size; i++) {
        participants.push({
          id: `p_${idCounter}`,
          name: `Person ${idCounter}`,
          subgroupId: g,
        });
        idCounter++;
      }
    }

    const partMap = new Map(participants.map((p) => [p.id, p]));

    for (let run = 0; run < 100; run++) {
      const result = generateWichtelMatching(participants);
      assert.strictEqual(result.success, true, `Run ${run} should succeed`);
      assert.strictEqual(
        isValidMatching(result.assignments, partMap),
        true,
        `Run ${run} must be completely valid`
      );

      for (const [giverId, receiverId] of result.assignments.entries()) {
        const giver = partMap.get(giverId)!;
        const receiver = partMap.get(receiverId)!;
        assert.notStrictEqual(giver.subgroupId, receiver.subgroupId);
        assert.notStrictEqual(result.assignments.get(receiverId), giverId);
      }
    }
  });
});
