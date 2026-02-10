// Avatar icons from MaterialCommunityIcons
export const AVATAR_ICONS = [
  'account-cowboy-hat',
  'ninja',
  'robot',
  'alien',
  'pirate',
  'crown',
  'wizard-hat',
  'emoticon-devil',
  'cat',
  'dog',
  'owl',
  'penguin',
  'fish',
  'elephant',
  'spider',
  'unicorn',
  'ghost',
  'skull-crossbones',
  'shield',
  'sword',
  'chess-knight',
  'cards-spade',
  'diamond-stone',
  'star-four-points',
] as const;

export type AvatarIcon = typeof AVATAR_ICONS[number];
