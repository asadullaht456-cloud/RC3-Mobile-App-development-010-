import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme';
import { Avatar } from './Avatar';

interface MemberChipProps {
  id: string;
  name: string;
  active: boolean;
  onPress: () => void;
}

export const MemberChip: React.FC<MemberChipProps> = ({
  id,
  name,
  active,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select member ${name}`}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.line,
        },
      ]}
    >
      <Avatar name={name} memberId={id} size={24} />
      <Text
        style={[
          typography.bodySm,
          {
            color: active ? colors.onPrimary : colors.text,
            marginLeft: 8,
          },
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
});
