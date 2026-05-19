import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SummonerScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-gold text-xl font-bold">{name}</Text>
    </View>
  );
}
