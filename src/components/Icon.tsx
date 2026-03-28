import {
  Home, Building, UtensilsCrossed, ShoppingBag, Briefcase, Box,
  Target, Sparkles, Search, Unlink, Rocket,
  PlusCircle, AlertTriangle, ArrowUpCircle, Smartphone,
  File, Files, LayoutGrid, HelpCircle,
  Calendar, Globe, Image, MessageCircle, ClipboardList, Star, MapPin,
  Minus, Zap, Leaf, Flame, Palette,
  CalendarDays, Clock, Eye,
  Monitor, ShoppingCart, RefreshCw, Users, Award, TrendingUp,
  Layers, Share2, Lock, CreditCard, Link, Settings, BarChart,
  Cpu, Compass, Circle, CircleDot, Disc, Gem,
  FileText, Camera, BookOpen, Puzzle,
  type LucideProps
} from 'lucide-react';

const iconMap: Record<string, React.FC<LucideProps>> = {
  'home': Home,
  'building': Building,
  'utensils-crossed': UtensilsCrossed,
  'shopping-bag': ShoppingBag,
  'briefcase': Briefcase,
  'box': Box,
  'target': Target,
  'sparkles': Sparkles,
  'search': Search,
  'unlink': Unlink,
  'rocket': Rocket,
  'plus-circle': PlusCircle,
  'alert-triangle': AlertTriangle,
  'arrow-up-circle': ArrowUpCircle,
  'smartphone': Smartphone,
  'file': File,
  'files': Files,
  'layout-grid': LayoutGrid,
  'help-circle': HelpCircle,
  'calendar': Calendar,
  'globe': Globe,
  'image': Image,
  'message-circle': MessageCircle,
  'clipboard-list': ClipboardList,
  'star': Star,
  'map-pin': MapPin,
  'minus': Minus,
  'zap': Zap,
  'leaf': Leaf,
  'flame': Flame,
  'palette': Palette,
  'calendar-days': CalendarDays,
  'clock': Clock,
  'eye': Eye,
  'monitor': Monitor,
  'shopping-cart': ShoppingCart,
  'refresh-cw': RefreshCw,
  'users': Users,
  'award': Award,
  'trending-up': TrendingUp,
  'layers': Layers,
  'share-2': Share2,
  'lock': Lock,
  'credit-card': CreditCard,
  'link': Link,
  'settings': Settings,
  'bar-chart': BarChart,
  'cpu': Cpu,
  'compass': Compass,
  'circle': Circle,
  'circle-dot': CircleDot,
  'disc': Disc,
  'gem': Gem,
  'file-text': FileText,
  'camera': Camera,
  'book-open': BookOpen,
  'puzzle': Puzzle,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 20, className }: Props) {
  const Component = iconMap[name];
  if (!Component) return null;
  return <Component size={size} strokeWidth={1.75} className={className} />;
}
