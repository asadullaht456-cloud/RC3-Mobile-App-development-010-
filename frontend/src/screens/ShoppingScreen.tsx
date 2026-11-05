import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  Tag,
  IconButton,
  MemberChip,
} from '../components';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { ShoppingItem, ShoppingUnit, Member } from '../types';
import { formatPKR } from '../utils/currency';
import { typography, spacing, radii } from '../theme';

const UNITS: ShoppingUnit[] = ['pack', 'dozen', 'bottle', 'bag'];

export const ShoppingScreen: React.FC = () => {
  const { colors } = useTheme();

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Bought'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Add Item Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUnit, setNewUnit] = useState<ShoppingUnit>('bottle');
  const [newQty, setNewQty] = useState('1');
  const [addLoading, setAddLoading] = useState(false);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [totalPaid, setTotalPaid] = useState('');
  const [payerId, setPayerId] = useState<string>('M01');
  const [splitMembers, setSplitMembers] = useState<string[]>(['M01', 'M02', 'M03']);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [shoppingData, membersData] = await Promise.all([
        api.getShopping(),
        api.getMembers(),
      ]);
      setItems(shoppingData);
      setMembers(membersData);
    } catch (err) {
      console.warn('Failed loading shopping items', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddItem = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Item title cannot be empty');
      return;
    }
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Requested quantity must be at least 1');
      return;
    }

    setAddLoading(true);
    try {
      const created = await api.addShoppingItem({
        title: newTitle.trim(),
        unit: newUnit,
        requested_qty: qty,
      });
      setItems((prev) => [created, ...prev]);
      setNewTitle('');
      setNewQty('1');
      setIsAddOpen(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add item');
    } finally {
      setAddLoading(false);
    }
  };

  const handleCheckout = async () => {
    const cost = parseFloat(totalPaid);
    if (isNaN(cost) || cost <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0');
      return;
    }
    if (splitMembers.length === 0) {
      Alert.alert('Validation Error', 'Select at least one member to split with');
      return;
    }

    setCheckoutLoading(true);
    try {
      await api.checkout({
        item_ids: selectedIds,
        total_paid: cost,
        payer_id: payerId,
        split_members: splitMembers,
      });

      setSelectedIds([]);
      setTotalPaid('');
      setIsCheckoutOpen(false);
      await loadData();
      Alert.alert('Checkout Complete', 'Items marked Bought and expense recorded!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'All') return true;
    return item.status === filter;
  });

  const selectedCount = selectedIds.length;
  const perPersonCost =
    totalPaid && !isNaN(parseFloat(totalPaid)) && splitMembers.length > 0
      ? (parseFloat(totalPaid) / splitMembers.length).toFixed(2)
      : '0.00';

  return (
    <Screen>
      <Header
        title="Shopping"
        caption="HOUSEHOLD GROCERIES"
        rightAction={
          <IconButton
            name="add"
            accessibilityLabel="Add Item"
            onPress={() => setIsAddOpen(true)}
            style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
            color={colors.onPrimary}
          />
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Pending', 'Bought'] as const).map((tab) => {
          const active = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: active ? colors.primaryBg : colors.surface,
                  borderColor: active ? colors.primary : colors.line,
                },
              ]}
            >
              <Text
                style={[
                  typography.tag,
                  { color: active ? colors.primary : colors.muted },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Item List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          const isPending = item.status === 'Pending';

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => isPending && toggleSelect(item.id)}
            >
              <Card
                style={[
                  styles.itemCard,
                  isSelected && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryBg,
                  },
                ]}
              >
                <View style={styles.itemRow}>
                  {isPending ? (
                    <TouchableOpacity
                      onPress={() => toggleSelect(item.id)}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isSelected ? colors.primary : colors.line,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: colors.line, backgroundColor: colors.surface2 },
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.muted} />
                    </View>
                  )}

                  <View style={styles.itemDetails}>
                    <Text
                      style={[
                        typography.body,
                        {
                          color: colors.text,
                          textDecorationLine:
                            item.status === 'Bought' ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.muted }]}>
                      Qty: {item.requested_qty} {item.unit}
                    </Text>
                  </View>

                  <Tag
                    label={item.status}
                    variant={item.status === 'Pending' ? 'pending' : 'bought'}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={48} color={colors.muted} />
            <Text style={[typography.body, { color: colors.muted, marginTop: 12 }]}>
              No items in this list
            </Text>
          </View>
        }
      />

      {/* Selected Action Bottom Bar */}
      {selectedCount > 0 && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.line,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View>
            <Text style={[typography.sectionTitle, { color: colors.text }]}>
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </Text>
            <Text style={[typography.caption, { color: colors.muted }]}>
              Ready for checkout
            </Text>
          </View>
          <Button
            label="Checkout"
            icon="card-outline"
            onPress={() => setIsCheckoutOpen(true)}
            style={{ minHeight: 44, paddingHorizontal: 16 }}
          />
        </View>
      )}

      {/* Add Item Modal */}
      <Modal visible={isAddOpen} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.sectionTitle, { color: colors.text }]}>
                Add Shopping Item
              </Text>
              <IconButton
                name="close"
                accessibilityLabel="Close"
                size={18}
                onPress={() => setIsAddOpen(false)}
              />
            </View>

            <Input
              label="Item Name"
              placeholder="e.g. Cooking Oil"
              value={newTitle}
              onChangeText={setNewTitle}
              icon="basket-outline"
            />

            <Input
              label="Quantity"
              placeholder="1"
              value={newQty}
              onChangeText={setNewQty}
              keyboardType="number-pad"
              icon="calculator-outline"
            />

            <Text style={[typography.caption, { color: colors.muted, marginBottom: 8 }]}>
              Unit
            </Text>
            <View style={styles.unitRow}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setNewUnit(u)}
                  style={[
                    styles.unitChip,
                    {
                      backgroundColor: newUnit === u ? colors.primary : colors.surface2,
                      borderColor: newUnit === u ? colors.primary : colors.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.tag,
                      { color: newUnit === u ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              label="Add to List"
              icon="add-circle-outline"
              loading={addLoading}
              onPress={handleAddItem}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={isCheckoutOpen} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.sectionTitle, { color: colors.text }]}>
                Checkout ({selectedCount} items)
              </Text>
              <IconButton
                name="close"
                accessibilityLabel="Close"
                size={18}
                onPress={() => setIsCheckoutOpen(false)}
              />
            </View>

            <Input
              label="Total Cost (PKR)"
              placeholder="e.g. 1200.00"
              value={totalPaid}
              onChangeText={setTotalPaid}
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
              Split Equally Among
            </Text>
            <View style={styles.chipsRow}>
              {members.map((m) => {
                const isIncluded = splitMembers.includes(m.id);
                return (
                  <MemberChip
                    key={m.id}
                    id={m.id}
                    name={m.name}
                    active={isIncluded}
                    onPress={() => {
                      setSplitMembers((prev) =>
                        prev.includes(m.id)
                          ? prev.filter((id) => id !== m.id)
                          : [...prev, m.id]
                      );
                    }}
                  />
                );
              })}
            </View>

            {/* Split Preview */}
            <View
              style={[
                styles.splitPreview,
                { backgroundColor: colors.primaryBg, borderColor: colors.line },
              ]}
            >
              <Text style={[typography.caption, { color: colors.primary }]}>
                Per person share: {formatPKR(parseFloat(perPersonCost))}
              </Text>
            </View>

            <Button
              label="Confirm Purchase"
              icon="checkmark-circle-outline"
              loading={checkoutLoading}
              onPress={handleCheckout}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 100,
  },
  itemCard: {
    marginBottom: 10,
    padding: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  splitPreview: {
    padding: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 10,
  },
});
