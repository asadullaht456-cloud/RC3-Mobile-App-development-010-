import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Header,
  Card,
  Button,
  Input,
  MemberChip,
  Avatar,
  IconButton,
} from '../components';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Member,
  BalancesResponse,
  Expense,
  SplitType,
} from '../types';
import { formatPKR, formatPKRAbs } from '../utils/currency';
import { typography, spacing, radii } from '../theme';

export const ExpensesScreen: React.FC = () => {
  const { colors } = useTheme();

  const [members, setMembers] = useState<Member[]>([]);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Settle Up Modal State
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [senderId, setSenderId] = useState('M02'); // Default Ayesha (owes)
  const [recipientId, setRecipientId] = useState('M01'); // Default Ali (owed)
  const [settleAmount, setSettleAmount] = useState('250.00');
  const [settleLoading, setSettleLoading] = useState(false);

  // Add Expense Modal State
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('M01');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({
    M01: '',
    M02: '',
    M03: '',
  });
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [membersData, balancesData, expensesData] = await Promise.all([
        api.getMembers(),
        api.getBalances(),
        api.getExpenses(),
      ]);
      setMembers(membersData);
      setBalances(balancesData);
      setExpenses(expensesData);
    } catch (err) {
      console.warn('Failed loading expenses data', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSettle = async () => {
    const parsedAmount = parseFloat(settleAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Amount must be greater than 0');
      return;
    }
    if (senderId === recipientId) {
      Alert.alert('Validation Error', 'Sender and recipient cannot be the same member');
      return;
    }

    setSettleLoading(true);
    try {
      await api.settle({
        sender_id: senderId,
        recipient_id: recipientId,
        amount: parsedAmount,
      });

      setIsSettleOpen(false);
      await loadData();
      Alert.alert('Settled', `Recorded payment of ${formatPKR(parsedAmount)}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record settlement');
    } finally {
      setSettleLoading(false);
    }
  };

  const handleAddExpense = async () => {
    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Expense title is required');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Amount must be greater than 0');
      return;
    }

    let splitsPayload: { member_id: string; amount?: number; owed_amount?: number }[] = [];

    if (splitType === 'EQUAL') {
      splitsPayload = members.map((m) => ({ member_id: m.id }));
    } else {
      // Validate custom sum
      let sum = 0;
      for (const m of members) {
        const val = parseFloat(customSplits[m.id] || '0');
        sum += isNaN(val) ? 0 : val;
        splitsPayload.push({ member_id: m.id, amount: val });
      }

      if (Math.abs(sum - parsedAmount) > 0.01) {
        Alert.alert(
          'Split Mismatch',
          `Custom split total (${formatPKR(sum)}) must exactly equal expense amount (${formatPKR(parsedAmount)})`
        );
        return;
      }
    }

    setAddExpenseLoading(true);
    try {
      await api.addExpense({
        title: title.trim(),
        category,
        amount: parsedAmount,
        payer_id: payerId,
        split_type: splitType,
        date: new Date().toISOString().split('T')[0],
        splits: splitsPayload,
      });

      setTitle('');
      setAmount('');
      setIsExpenseOpen(false);
      await loadData();
      Alert.alert('Expense Added', 'Successfully added expense and updated balances!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add expense');
    } finally {
      setAddExpenseLoading(false);
    }
  };

  return (
    <Screen>
      <Header title="Expenses" caption="SETTLEMENTS & SPLITS" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balances Summary Table Card */}
        <Card style={styles.card}>
          <Text style={[typography.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
            Household Balances
          </Text>

          {balances?.balances.map((b) => {
            const isOwed = b.net_balance >= 0;
            const balanceColor =
              b.net_balance === 0
                ? colors.muted
                : isOwed
                ? colors.success
                : colors.danger;

            return (
              <View
                key={b.member_id}
                style={[styles.balanceRow, { borderBottomColor: colors.line }]}
              >
                <View style={styles.memberInfo}>
                  <Avatar name={b.name} memberId={b.member_id} size={32} />
                  <Text style={[typography.body, { color: colors.text, marginLeft: 10 }]}>
                    {b.name}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[typography.body, { color: balanceColor }]}>
                    {b.net_balance === 0
                      ? 'Settled (0.00)'
                      : isOwed
                      ? `+${formatPKRAbs(b.net_balance)}`
                      : `-${formatPKRAbs(b.net_balance)}`}
                  </Text>
                  <Text style={[typography.tag, { color: colors.muted }]}>
                    {b.net_balance === 0 ? 'All clear' : isOwed ? 'is owed' : 'owes'}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Mathematical Invariant: Total Net Sum = 0.00 */}
          <View style={styles.totalRow}>
            <Text style={[typography.caption, { color: colors.muted }]}>
              Net Total (Invariant)
            </Text>
            <Text style={[typography.caption, { color: colors.muted }]}>
              {formatPKR(balances?.total_net_sum ?? 0)}
            </Text>
          </View>
        </Card>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <Button
            label="Settle Up"
            icon="swap-horizontal-outline"
            onPress={() => setIsSettleOpen(true)}
            style={{ flex: 1 }}
          />
          <Button
            label="Add Expense"
            variant="outline"
            icon="add-outline"
            onPress={() => setIsExpenseOpen(true)}
            style={{ flex: 1 }}
          />
        </View>

        {/* Recent Expenses List */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.sectionTitle, { color: colors.text }]}>
            Recent Expenses
          </Text>
          <Text style={[typography.caption, { color: colors.muted }]}>
            {expenses.length} recorded
          </Text>
        </View>

        {expenses.map((exp) => (
          <Card key={exp.id} style={styles.expenseCard}>
            <View style={styles.expenseRow}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: colors.primaryBg, borderColor: colors.line },
                ]}
              >
                <Ionicons
                  name={
                    exp.category === 'Groceries'
                      ? 'cart-outline'
                      : exp.category === 'Utilities'
                      ? 'flash-outline'
                      : 'receipt-outline'
                  }
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.body, { color: colors.text }]}>
                  {exp.title}
                </Text>
                <Text style={[typography.caption, { color: colors.muted }]}>
                  Paid by {members.find((m) => m.id === exp.payer_id)?.name || exp.payer_id} •{' '}
                  {exp.date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[typography.body, { color: colors.text }]}>
                  {formatPKR(exp.amount)}
                </Text>
                <Text style={[typography.tag, { color: colors.muted }]}>
                  {exp.split_type}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Settle Up Modal */}
      <Modal visible={isSettleOpen} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.sectionTitle, { color: colors.text }]}>
                Settle Up Debt
              </Text>
              <IconButton
                name="close"
                accessibilityLabel="Close"
                size={18}
                onPress={() => setIsSettleOpen(false)}
              />
            </View>

            <Text style={[typography.caption, { color: colors.muted, marginBottom: 8 }]}>
              Payer (Who is sending payment)
            </Text>
            <View style={styles.chipsRow}>
              {members.map((m) => (
                <MemberChip
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  active={m.id === senderId}
                  onPress={() => setSenderId(m.id)}
                />
              ))}
            </View>

            <Text
              style={[
                typography.caption,
                { color: colors.muted, marginTop: 12, marginBottom: 8 },
              ]}
            >
              Recipient (Who is receiving payment)
            </Text>
            <View style={styles.chipsRow}>
              {members.map((m) => (
                <MemberChip
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  active={m.id === recipientId}
                  onPress={() => setRecipientId(m.id)}
                />
              ))}
            </View>

            <Input
              label="Amount to Settle (PKR)"
              placeholder="e.g. 250.00"
              value={settleAmount}
              onChangeText={setSettleAmount}
              keyboardType="decimal-pad"
              icon="cash-outline"
              containerStyle={{ marginTop: 14 }}
            />

            <Button
              label="Record Payment"
              icon="checkmark-circle-outline"
              loading={settleLoading}
              onPress={handleSettle}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* Add Expense Modal */}
      <Modal visible={isExpenseOpen} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.sectionTitle, { color: colors.text }]}>
                Add Manual Expense
              </Text>
              <IconButton
                name="close"
                accessibilityLabel="Close"
                size={18}
                onPress={() => setIsExpenseOpen(false)}
              />
            </View>

            <Input
              label="Expense Title"
              placeholder="e.g. Internet Bill"
              value={title}
              onChangeText={setTitle}
              icon="document-text-outline"
            />

            <Input
              label="Amount (PKR)"
              placeholder="e.g. 3000.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              icon="cash-outline"
            />

            <Text style={[typography.caption, { color: colors.muted, marginBottom: 8 }]}>
              Paid By
            </Text>
            <View style={styles.chipsRow}>
              {members.map((m) => (
                <MemberChip
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  active={m.id === payerId}
                  onPress={() => setPayerId(m.id)}
                />
              ))}
            </View>

            <Text
              style={[
                typography.caption,
                { color: colors.muted, marginTop: 12, marginBottom: 8 },
              ]}
            >
              Split Strategy
            </Text>
            <View style={styles.splitStrategyRow}>
              <TouchableOpacity
                onPress={() => setSplitType('EQUAL')}
                style={[
                  styles.strategyButton,
                  {
                    backgroundColor:
                      splitType === 'EQUAL' ? colors.primary : colors.surface2,
                    borderColor: splitType === 'EQUAL' ? colors.primary : colors.line,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.tag,
                    {
                      color: splitType === 'EQUAL' ? colors.onPrimary : colors.text,
                    },
                  ]}
                >
                  Equal Split (3-Way)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSplitType('CUSTOM')}
                style={[
                  styles.strategyButton,
                  {
                    backgroundColor:
                      splitType === 'CUSTOM' ? colors.primary : colors.surface2,
                    borderColor: splitType === 'CUSTOM' ? colors.primary : colors.line,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.tag,
                    {
                      color: splitType === 'CUSTOM' ? colors.onPrimary : colors.text,
                    },
                  ]}
                >
                  Custom Split
                </Text>
              </TouchableOpacity>
            </View>

            {splitType === 'CUSTOM' && (
              <View style={{ marginTop: 12 }}>
                {members.map((m) => (
                  <Input
                    key={m.id}
                    label={`${m.name}'s Share (PKR)`}
                    placeholder="0.00"
                    value={customSplits[m.id]}
                    onChangeText={(val) =>
                      setCustomSplits((prev) => ({ ...prev, [m.id]: val }))
                    }
                    keyboardType="decimal-pad"
                  />
                ))}
              </View>
            )}

            <Button
              label="Save Expense"
              icon="save-outline"
              loading={addExpenseLoading}
              onPress={handleAddExpense}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 40,
  },
  card: {
    marginBottom: spacing.cardGap,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseCard: {
    marginBottom: 10,
    padding: 14,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii.bottomSheet,
    borderTopRightRadius: radii.bottomSheet,
    padding: spacing.xl,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  splitStrategyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  strategyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    alignItems: 'center',
  },
});
