import {
  IconApple,
  IconBowl,
  IconBowlSpoon,
  IconBread,
  IconCake,
  IconCarrot,
  IconCheese,
  IconCoffee,
  IconCookie,
  IconCup,
  IconDroplet,
  IconEgg,
  IconFish,
  IconGlassFull,
  IconIceCream,
  IconMeat,
  IconPizza,
  IconPlant2,
  IconSalad,
  IconSoup,
  IconToolsKitchen2,
} from "@tabler/icons-react"

type TaskIcon = typeof IconBowl

export type TaskIconEntry = {
  keywords: string[]
  icon: TaskIcon
}

// First match wins. More specific / distinctive terms come first so
// "pasta salad" hits salad (not pasta) and "ice cream" hits ice cream
// (not the supplies "ice"). Generic drink and kitchen-supply words are last.
export const TASK_ICON_MAP: TaskIconEntry[] = [
  { keywords: ["salad", "lettuce", "slaw"], icon: IconSalad },
  { keywords: ["soup", "stew", "chili", "broth"], icon: IconSoup },
  { keywords: ["bread", "roll", "sandwich", "bun"], icon: IconBread },
  { keywords: ["cake", "dessert", "pie", "brownie"], icon: IconCake },
  { keywords: ["cookie", "biscuit"], icon: IconCookie },
  { keywords: ["pizza"], icon: IconPizza },
  { keywords: ["ice cream", "gelato"], icon: IconIceCream },
  { keywords: ["fruit", "apple", "berry", "melon"], icon: IconApple },
  { keywords: ["veggie tray", "carrot", "celery"], icon: IconCarrot },
  { keywords: ["greens", "kale", "collard", "spinach"], icon: IconPlant2 },
  { keywords: ["cheese", "mac and cheese", "queso"], icon: IconCheese },
  { keywords: ["chicken", "beef", "meat", "turkey"], icon: IconMeat },
  { keywords: ["fish", "salmon", "tuna"], icon: IconFish },
  { keywords: ["egg", "deviled"], icon: IconEgg },
  { keywords: ["pasta", "noodle", "spaghetti"], icon: IconBowlSpoon },
  { keywords: ["rice", "grain", "beans"], icon: IconBowl },
  { keywords: ["coffee"], icon: IconCoffee },
  { keywords: ["tea", "lemonade", "punch", "juice"], icon: IconCup },
  { keywords: ["drink", "soda", "beverage"], icon: IconGlassFull },
  { keywords: ["water"], icon: IconDroplet },
  {
    keywords: ["plate", "napkin", "utensil", "cup", "fork", "supplies", "ice"],
    icon: IconToolsKitchen2,
  },
]

const FALLBACK_ICON: TaskIcon = IconBowl

export function getTaskIcon(taskName: string): { icon: TaskIcon; matched: boolean } {
  const haystack = taskName.toLowerCase()
  for (const entry of TASK_ICON_MAP) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      return { icon: entry.icon, matched: true }
    }
  }
  return { icon: FALLBACK_ICON, matched: false }
}
