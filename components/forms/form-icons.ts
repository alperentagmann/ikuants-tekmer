import {
    User, Mail, Phone, Building2, GraduationCap, FileText, Users, ClipboardList, Target, Rocket,
    Lightbulb, Globe, Award, Calendar, MapPin, Linkedin, Briefcase, Sparkles, PenTool, TrendingUp,
    Clock, Monitor, Milestone, Scaling, Timer, Link as LinkIcon, PieChart, DollarSign, Upload,
    HelpCircle, MessageSquare, Hash, Info, ShieldCheck, Layers, Heart, Star, BookOpen, type LucideIcon,
} from 'lucide-react';

/** Icons available to form questions and sections (uiConfig.icon). */
export const FORM_ICONS: Record<string, LucideIcon> = {
    User, Mail, Phone, Building2, GraduationCap, FileText, Users, ClipboardList, Target, Rocket,
    Lightbulb, Globe, Award, Calendar, MapPin, Linkedin, Briefcase, Sparkles, PenTool, TrendingUp,
    Clock, Monitor, Milestone, Scaling, Timer, Link: LinkIcon, PieChart, DollarSign, Upload,
    HelpCircle, MessageSquare, Hash, Info, ShieldCheck, Layers, Heart, Star, BookOpen,
};

export const FORM_ICON_NAMES = Object.keys(FORM_ICONS);
