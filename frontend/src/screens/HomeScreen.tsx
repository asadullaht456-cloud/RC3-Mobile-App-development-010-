import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {
  Screen,
  Header,
  HeroCard,
  Card,
  Avatar,
  MemberChip,
  ProgressBar,
  Tag,
  IconButton,
  CountUpText,
  Button,
  Input,
} from '../components';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Member, BalancesResponse, BudgetResponse, ShoppingItem } from '../types';
import { formatPKR, formatPKRAbs } from '../utils/currency';
import { typography, spacing } from '../theme';

const ACTIVE_MEMBER_KEY = 'active_member_id';

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [members, setMembers] = useState<Member[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('M01');
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [budget, setBudget] = useState<BudgetResponse | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setAddMemberError('Please enter member name');
      return;
    }
    if (!newMemberEmail.trim()) {
      setAddMemberError('Please enter member email');
      return;
    }
    setAddMemberError(null);
    setAddingMember(true);
    try {
      const created = await api.addMember({
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
      });
      await loadData();
      setActiveMemberId(created.id);
      setShowAddMemberModal(false);
      setNewMemberName('');
      setNewMemberEmail('');
      Toast.show({
        type: 'success',
        text1: 'Housemate Added',
        text2: `${created.name} is now a member of this house!`,
      });
    } catch (err: any) {
      setAddMemberError(err?.response?.data?.error || err?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [membersData, balancesData, budgetData, shoppingData] = await Promise.all([
        api.getMembers(),
        api.getBalances(),
        api.getBudget(),
        api.getShopping(),
      ]);

      setMembers(membersData);
      setBalances(balancesData);
      setBudget(budgetData);
      setShoppingItems(shoppingData);
    } catch (err) {
      console.warn('Failed loading dashboard data', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(ACTIVE_MEMBER_KEY);
        if (saved) {
          setActiveMemberId(saved);
        } else if (user?.id) {
          setActiveMemberId(user.id);
        }
      } catch (err) {
        console.warn('Failed loading active member', err);
      }
    })();
    loadData();
  }, [loadData, user]);

  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    try {
      await AsyncStorage.setItem(ACTIVE_MEMBER_KEY, id);
    } catch (err) {
      console.warn('Failed saving active member', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeBalance = balances?.balances.find((b) => b.member_id === activeMemberId);
  const netBalance = activeBalance?.net_balance ?? 0;
  const isOwed = netBalance >= 0;

  const pendingCount = shoppingItems.filter((i) => i.status === 'Pending').length;

  return (
    <Screen>
      <Header
        title="Ghar"
        caption="SHARED LIVING"
        rightAction={
          <IconButton
            name="notifications-outline"
            accessibilityLabel="Notifications"
            badge={budget?.status === 'Near Limit' || budget?.status === 'Exceeded'}
            onPress={() => {}}
            style={{ marginLeft: 6 }}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Member Selector Row */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[typography.caption, { color: colors.muted }]}>
              HOUSEMATES (VIEWING AS)
            </Text>
            {/* Direct Add Member Button Beside Users */}
            <TouchableOpacity
              style={[
                styles.addMemberBtn,
                {
                  backgroundColor: colors.primaryBg,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => {
                setAddMemberError(null);
                setShowAddMemberModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={12} color={colors.primary} />
              <Text style={[styles.addMemberBtnText, { color: colors.primary }]}>
                + Add Member
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {members.map((m) => (
              <MemberChip
                key={m.id}
                id={m.id}
                name={m.name}
                active={m.id === activeMemberId}
                onPress={() => handleSelectMember(m.id)}
              />
            ))}
            <TouchableOpacity
              style={[
                styles.inlineAddChip,
                {
                  borderColor: colors.line,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => {
                setAddMemberError(null);
                setShowAddMemberModal(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[typography.tag, { color: colors.primary, marginLeft: 4 }]}>
                New Housemate
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Hero Card: Net Balance */}
        <HeroCard style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={[typography.bodySm, { color: 'rgba(4, 47, 46, 0.75)' }]}>
              {isOwed ? 'YOU ARE OWED' : 'YOU OWE'}
            </Text>
            <View style={styles.heroBadge}>
              <Ionicons
                name={isOwed ? 'arrow-down-circle' : 'arrow-up-circle'}
                size={16}
                color={colors.onPrimary}
              />
              <Text style={[typography.tag, { color: colors.onPrimary, marginLeft: 4 }]}>
                {isOwed ? 'Credit' : 'Debt'}
              </Text>
            </View>
          </View>

          <CountUpText
            value={netBalance}
            style={[typography.heroAmount, { color: colors.onPrimary, marginVertical: 8 }]}
          />

          <Text style={[typography.caption, { color: 'rgba(4, 47, 46, 0.8)' }]}>
            {isOwed
              ? 'Household members owe you for shared expenses'
              : 'You owe household members for shared expenses'}
          </Text>
        </HeroCard>

        {/* Monthly Budget Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[typography.sectionTitle, { color: colors.text }]}>
                Monthly Budget
              </Text>
              <Text style={[typography.caption, { color: colors.muted }]}>
                PKR 5,000.00 Limit
              </Text>
            </View>
            {budget && (
              <Tag
                label={budget.status}
                variant={
                  budget.status === 'Safe'
                    ? 'safe'
                    : budget.status === 'Near Limit'
                    ? 'near_limit'
                    : 'exceeded'
                }
              />
            )}
          </View>

          <View style={styles.budgetRow}>
            <Text style={[typography.cardAmount, { color: colors.text }]}>
              {formatPKR(budget?.total_spent ?? 4200)}
            </Text>
            <Text style={[typography.bodySm, { color: colors.muted }]}>
              {budget?.spent_percentage ?? 84}% spent
            </Text>
          </View>

          <ProgressBar
            percentage={budget?.spent_percentage ?? 84}
            status={budget?.status ?? 'Near Limit'}
          />

          <View style={styles.budgetFooter}>
            <Text style={[typography.caption, { color: colors.muted }]}>
              Remaining: {formatPKR(budget?.remaining ?? 800)}
            </Text>
          </View>
        </Card>

        {/* Pending Items Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Shopping')}
        >
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.row}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: colors.primaryBg, borderColor: colors.line },
                  ]}
                >
                  <Ionicons name="cart-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={[typography.sectionTitle, { color: colors.text }]}>
                    Shopping List
                  </Text>
                  <Text style={[typography.caption, { color: colors.muted }]}>
                    {pendingCount} items pending purchase
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>

      {/* Sign Up New Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}>
                <Ionicons name="people" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[typography.sectionTitle, { color: colors.text }]}>
                  Sign Up Housemate
                </Text>
                <Text style={[typography.caption, { color: colors.muted }]}>
                  Add a new member to this household
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddMemberModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Input
              label="Full Name"
              icon="person-outline"
              value={newMemberName}
              onChangeText={(t) => {
                setNewMemberName(t);
                setAddMemberError(null);
              }}
              placeholder="e.g. Danish or Zainab"
              autoCapitalize="words"
            />

            <Input
              label="Email Address"
              icon="mail-outline"
              value={newMemberEmail}
              onChangeText={(t) => {
                setNewMemberEmail(t);
                setAddMemberError(null);
              }}
              placeholder="e.g. danish@demo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {addMemberError ? (
              <Text style={[typography.tag, { color: colors.danger, marginBottom: 12 }]}>
                {addMemberError}
              </Text>
            ) : null}

            <View style={styles.modalButtonsRow}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setShowAddMemberModal(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                label="Sign Up Member"
                icon="checkmark-outline"
                loading={addingMember}
                disabled={addingMember}
                onPress={handleAddMember}
                style={{ flex: 1.6 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  addMemberBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginRight: 8,
  },
  chipsRow: {
    paddingVertical: 4,
  },
  heroCard: {
    marginBottom: spacing.cardGap,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  card: {
    marginBottom: spacing.cardGap,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 10,
  },
  budgetFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
});
