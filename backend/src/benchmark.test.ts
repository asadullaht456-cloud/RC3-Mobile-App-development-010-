import { seedBenchmarkData } from './db/seedBenchmark.js';
import { initializeDatabase } from './db/schema.js';
import { calculateBalances, calculateBudget, calculateEqualSplit } from './services/financialEngine.js';
import { pkrToPaisa, paisaToPkr } from './utils/money.js';
import { db } from './db/connection.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runBenchmarkTests() {
  console.log('\n=============================================');
  console.log('🧪 RUNNING MASTER BENCHMARK VERIFICATION SUITE');
  console.log('=============================================\n');

  // Step 1: Initialize & Seed Benchmark
  initializeDatabase();
  seedBenchmarkData();

  // Step 2: Verify Initial Spending & Budget Status
  const initialBudget = calculateBudget();
  console.log('📊 Initial Budget Check:', initialBudget);
  assert(initialBudget.total_spent === 4200.0, 'Total spent must be exactly PKR 4,200.00');
  assert(initialBudget.budget_limit === 5000.0, 'Budget limit must be PKR 5,000.00');
  assert(initialBudget.remaining === 800.0, 'Remaining must be PKR 800.00');
  assert(initialBudget.spent_percentage === 84.0, 'Spent percentage must be exactly 84.0%');
  assert(initialBudget.status === 'Near Limit', 'Status must be "Near Limit"');

  // Step 3: Verify Initial Net Balances
  const initialBalances = calculateBalances();
  console.log('💰 Initial Balances Check:', initialBalances);
  const ali = initialBalances.balances.find((b) => b.member_id === 'M01');
  const ayesha = initialBalances.balances.find((b) => b.member_id === 'M02');
  const bilal = initialBalances.balances.find((b) => b.member_id === 'M03');

  assert(ali?.net_balance === 250.0, 'Ali net balance must be +PKR 250.00');
  assert(ayesha?.net_balance === -450.0, 'Ayesha net balance must be -PKR 450.00');
  assert(bilal?.net_balance === 200.0, 'Bilal net balance must be +PKR 200.00');
  assert(initialBalances.total_net_sum === 0.0, 'Sum of all balances must be exactly 0.00');

  // Step 4: Verify Equal Split Rounding (1,000.00 between M01, M02, M03)
  console.log('\n🔢 Testing 1 paisa remainder distribution:');
  const split1000 = calculateEqualSplit(100000, ['M01', 'M02', 'M03']);
  console.log('Splits for 1,000.00 PKR:', split1000);
  assert(split1000[0].owed_paisa === 33334, 'M01 must receive 33,334 paisa (333.34 PKR)');
  assert(split1000[1].owed_paisa === 33333, 'M02 must receive 33,333 paisa (333.33 PKR)');
  assert(split1000[2].owed_paisa === 33333, 'M03 must receive 33,333 paisa (333.33 PKR)');
  const splitSum = split1000.reduce((acc, s) => acc + s.owed_paisa, 0);
  assert(splitSum === 100000, 'Sum of splits must equal 100,000 paisa exactly');

  // Step 5: Execute Settlements: Ayesha pays Ali 250.00 and Ayesha pays Bilal 200.00
  console.log('\n🤝 Testing Settlement Transactions:');
  const insertSettlement = db.prepare(`
    INSERT INTO settlements (id, sender_id, recipient_id, amount, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertSettlement.run('settle_test_1', 'M02', 'M01', pkrToPaisa(250), new Date().toISOString());
  insertSettlement.run('settle_test_2', 'M02', 'M03', pkrToPaisa(200), new Date().toISOString());

  // Step 6: Verify Post-Settlement Balances & Spending Invariant
  const postBalances = calculateBalances();
  console.log('✨ Post-Settlement Balances:', postBalances);
  const aliPost = postBalances.balances.find((b) => b.member_id === 'M01');
  const ayeshaPost = postBalances.balances.find((b) => b.member_id === 'M02');
  const bilalPost = postBalances.balances.find((b) => b.member_id === 'M03');

  assert(aliPost?.net_balance === 0.0, 'Ali net balance must be 0.00 after settlement');
  assert(ayeshaPost?.net_balance === 0.0, 'Ayesha net balance must be 0.00 after settlement');
  assert(bilalPost?.net_balance === 0.0, 'Bilal net balance must be 0.00 after settlement');
  assert(postBalances.total_net_sum === 0.0, 'Total net sum must remain 0.00');

  const postBudget = calculateBudget();
  assert(postBudget.total_spent === 4200.0, 'Settlements must NOT change total household spending (must remain 4,200.00)');

  // Step 7: Reset to clean benchmark state
  seedBenchmarkData();

  console.log('\n🎉 ALL MASTER BENCHMARK VERIFICATION TESTS PASSED PERFECTLY!\n');
}

runBenchmarkTests();
