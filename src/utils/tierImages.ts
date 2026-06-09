import { ImageSourcePropType } from 'react-native';

const TIER_IMAGES: Record<string, ImageSourcePropType> = {
  iron:        require('../../assets/images/tiers/iron.png'),
  bronze:      require('../../assets/images/tiers/bronze.png'),
  silver:      require('../../assets/images/tiers/silver.png'),
  gold:        require('../../assets/images/tiers/gold.png'),
  platinum:    require('../../assets/images/tiers/platinum.png'),
  diamond:     require('../../assets/images/tiers/diamond.png'),
  master:      require('../../assets/images/tiers/master.png'),
  grandmaster: require('../../assets/images/tiers/grandmaster.png'),
  challenger:  require('../../assets/images/tiers/challenger.png'),
};

export function getTierImage(imageKey: string): ImageSourcePropType | null {
  return TIER_IMAGES[imageKey] ?? null;
}
