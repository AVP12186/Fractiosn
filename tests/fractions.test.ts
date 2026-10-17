import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRoom, getCardsForDifficulty, getStageDifficulty, FINAL_FLOOR } from '../src/data/dungeonLevels';
import { addFractions, areFractionsEqual, damageEnemy, toggleSpellCard, type Difficulty, type Fraction } from '../src/types/game';

const difficulties: Difficulty[] = ['apprentice', 'journeyman', 'grandmaster'];
function solution(difficulty: Difficulty, target: Fraction) {
  const deck = getCardsForDifficulty(difficulty);
  for (const a of deck) {
    if (areFractionsEqual(a.fraction, target)) return [a.id];
    for (const b of deck) if (areFractionsEqual(addFractions(a.fraction, b.fraction), target)) return [a.id, b.id];
  }
  return null;
}

test('equivalent fractions match exactly and invalid denominators never match', () => {
  assert.ok(areFractionsEqual({ n: 2, d: 4 }, { n: 1, d: 2 }));
  assert.ok(areFractionsEqual(addFractions({ n: 1, d: 3 }, { n: 1, d: 2 }), { n: 5, d: 6 }));
  assert.deepEqual(addFractions({ n: 1, d: 5 }, { n: 2, d: 5 }), { n: 3, d: 5 });
  assert.equal(areFractionsEqual({ n: 1, d: 0 }, { n: 2, d: 0 }), false);
  assert.equal(areFractionsEqual({ n: NaN, d: 2 }, { n: 1, d: 2 }), false);
});

test('both card selectors can duplicate a card but never exceed the two-card limit', () => {
  let selected: string[] = [];
  for (const id of ['a', 'b', 'a', 'a', 'b', 'b', 'c', 'd', 'd', 'd']) {
    selected = toggleSpellCard(selected, id);
    assert.ok(selected.length <= 2);
  }
  assert.deepEqual(toggleSpellCard(['a'], 'a'), ['a', 'a']);
  assert.deepEqual(toggleSpellCard(['a', 'a'], 'a'), []);
  assert.deepEqual(toggleSpellCard(['a', 'b'], 'a'), ['b', 'a']);
});

for (const difficulty of difficulties) {
  test(`${difficulty}: every enemy and boss-phase shield on floors 1–21 is solvable with at most two cards`, () => {
    for (let floor = 1; floor <= FINAL_FLOOR; floor++) {
      for (let sample = 0; sample < 5; sample++) {
        const room = generateRoom(floor, difficulty);
        for (const enemy of room.enemies) {
          if (enemy.shield) assert.ok(solution(difficulty, enemy.shield), `${floor}: ${enemy.name}`);
          if (enemy.isBoss) {
            const phase2 = damageEnemy({ ...enemy, shield: null }, Math.ceil(enemy.maxHp / 3));
            assert.equal(phase2.bossPhase, 2);
            assert.ok(solution(difficulty, phase2.shield!));
            const phase3 = damageEnemy({ ...phase2, shield: null }, Math.ceil(enemy.maxHp / 3));
            assert.equal(phase3.bossPhase, 3);
            assert.ok(solution(difficulty, phase3.shield!));
            assert.equal(damageEnemy({ ...phase3, shield: null }, 1).shield, null, 'no repeated phase barrier');
          }
        }
        if (floor < FINAL_FLOOR) assert.ok(room.stairs, `stairs on floor ${floor}`);
      }
    }
  });
  test(`${difficulty}: stage ratings stay within the requested bands and stats stop escalating at 8`, () => {
    for (let floor = 1; floor <= 30; floor++) {
      const rating = getStageDifficulty(floor, difficulty);
      const [min, max] = floor <= 3 ? [3, 4] : floor <= 5 ? [5, 6] : [7, 8];
      assert.ok(rating >= min && rating <= max);
      for (const enemy of generateRoom(floor, difficulty).enemies) {
        assert.equal(enemy.hp, enemy.maxHp);
        assert.ok(enemy.maxHp <= 17 && enemy.attackCooldown >= 7 && enemy.attackPower <= 4);
      }
    }
  });
}

test('Grandmaster final boss can be beaten, including all three fraction barriers', () => {
  let boss = generateRoom(FINAL_FLOOR, 'grandmaster').enemies[0];
  assert.ok(boss.isBoss);
  const phases = new Set<number>();
  for (let turn = 0; turn < 40 && boss.hp > 0; turn++) {
    phases.add(boss.bossPhase!);
    if (boss.shield) { assert.ok(solution('grandmaster', boss.shield)); boss = { ...boss, shield: null }; }
    else boss = damageEnemy(boss, 2);
  }
  assert.equal(boss.hp, 0);
  assert.deepEqual([...phases], [1, 2, 3]);
});
