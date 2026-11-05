import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { memberColors } from '../theme/colors';

interface AvatarProps {
  name: string;
  size?: number;
  memberId?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 36, memberId }) => {
  const initial = (name ? name.charAt(0) : '?').toUpperCase();
  const bgColor = (memberId && memberColors[memberId]) || memberColors[name] || '#0F766E';

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.44,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
