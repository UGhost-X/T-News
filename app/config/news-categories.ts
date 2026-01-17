import { 
  Globe, TrendingUp, Cpu, Clapperboard, Medal, Users, ShieldAlert, Palette, Heart, Coffee, GraduationCap, MoreHorizontal 
} from 'lucide-vue-next'

export const newsCategories = [
  { id: 'politics', name: '时政', icon: Globe, description: '政治、政策、国际关系等' },
  { id: 'economy', name: '财经', icon: TrendingUp, description: '经济、金融、股市、商业等' },
  { id: 'tech', name: '科技', icon: Cpu, description: '科技、互联网、数码、AI等' },
  { id: 'entertainment', name: '娱乐', icon: Clapperboard, description: '明星、电影、音乐、综艺等' },
  { id: 'sports', name: '体育', icon: Medal, description: '体育赛事、运动员等' },
  { id: 'society', name: '社会', icon: Users, description: '社会事件、民生、法律等' },
  { id: 'military', name: '军事', icon: ShieldAlert, description: '军事、国防、武器等' },
  { id: 'culture', name: '文化', icon: Palette, description: '艺术、文学、历史等' },
  { id: 'health', name: '健康', icon: Heart, description: '医疗、养生、心理等' },
  { id: 'life', name: '生活', icon: Coffee, description: '美食、旅游、家居、情感等' },
  { id: 'education', name: '教育', icon: GraduationCap, description: '教育、考试、校园等' },
  { id: 'other', name: '其他', icon: MoreHorizontal, description: '未归类内容' },
]
