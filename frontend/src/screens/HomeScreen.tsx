import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
          <Text style={[typography.caption, { color: colors.muted, marginBottom: 10 }]}>
            VIEWING AS
          </Text>
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
});
