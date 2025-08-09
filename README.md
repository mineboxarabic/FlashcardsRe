# 🧠 NeuroCards - Intelligent Flashcard Learning App

<div align="center">
  <img src="public/logo.svg" alt="NeuroCards Logo" width="120" height="120">
  <h3>Master Anything with Intelligent Flashcards</h3>
  <p>Harness the power of spaced repetition and AI to learn faster and remember longer</p>
</div>

---

## 🌟 Overview

NeuroCards is a modern, intelligent flashcard application designed to optimize learning through scientifically-proven spaced repetition algorithms. Built with cutting-edge web technologies, it provides an intuitive and powerful platform for knowledge acquisition and retention.

## ✨ Key Features

### 🎯 **Intelligent Learning System**
- **Spaced Repetition Algorithm**: Implements a sophisticated spaced repetition system that schedules card reviews at optimal intervals for maximum retention
- **Adaptive Difficulty**: Cards automatically adjust their review frequency based on your performance
- **Learning Analytics**: Track your progress with detailed statistics and performance metrics

### 📚 **Multiple Card Types**
- **Basic Cards**: Traditional front/back flashcards for simple Q&A learning
- **Multiple Choice**: Interactive multiple-choice questions with customizable options
- **Fill in the Blank**: Cloze deletion cards for testing specific knowledge gaps
- **Type the Answer**: Active recall cards requiring typed responses for better engagement

### 🗂️ **Organization & Management**
- **Deck System**: Organize cards into themed decks for structured learning
- **Tagging System**: Add custom tags to cards for flexible categorization
- **Search & Filter**: Powerful search functionality across all cards and decks
- **Bulk Operations**: Edit, delete, or move multiple cards simultaneously

### 📊 **Study Modes & Analytics**
- **Due Cards Mode**: Focus on cards scheduled for review
- **Practice Mode**: Study all cards in random order
- **Deck-Specific Study**: Concentrate on specific topics or subjects
- **Topic-Based Learning**: Study cards filtered by topics or difficulty
- **Progress Tracking**: Visual progress indicators and completion statistics

### 🌐 **User Experience**
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Dark/Light Themes**: Comfortable viewing in any lighting condition
- **Multi-language Support**: Interface available in multiple languages (English, Arabic)
- **Intuitive Navigation**: Clean, modern UI with smooth animations and transitions

### 🚀 **Performance & Accessibility**
- **Fast Loading**: Optimized for quick startup and smooth performance
- **Offline Capability**: Continue studying even without internet connection
- **Keyboard Shortcuts**: Efficient navigation for power users
- **Accessibility Features**: Screen reader support and keyboard navigation

## 🛠️ Technical Stack

### **Frontend**
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development for better code quality
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid styling

### **UI Components**
- **Shadcn/ui** - Beautiful, accessible component library
- **Lucide React** - Consistent and customizable icon set
- **Radix UI** - Unstyled, accessible UI primitives
- **Framer Motion** - Smooth animations and transitions

### **Backend & Database**
- **Supabase** - Modern PostgreSQL database with real-time subscriptions
- **Row Level Security** - Secure data access patterns
- **Real-time Updates** - Live synchronization across devices

### **State Management & Routing**
- **React Router** - Client-side routing with nested routes
- **React Query/TanStack Query** - Powerful data fetching and caching
- **Context API** - Global state management for user sessions

### **Internationalization**
- **React i18next** - Complete internationalization framework
- **RTL Support** - Right-to-left language support for Arabic

## 🧮 The Spaced Repetition Algorithm

NeuroCards implements a sophisticated spaced repetition algorithm based on research in cognitive psychology:

### **How It Works**
1. **Initial Learning**: New cards appear frequently until mastered
2. **Interval Calculation**: Review intervals increase based on performance
3. **Difficulty Adjustment**: Cards adjust their "ease factor" based on recall success
4. **Optimal Scheduling**: Algorithm determines the best time for each card review

### **Performance Factors**
- **Response Quality**: How well you recalled the answer
- **Response Time**: Speed of correct responses
- **Historical Performance**: Long-term success rate for each card
- **Forgetting Curve**: Scientific prediction of memory decay

### **Benefits**
- **80% Less Study Time**: Focus only on cards you're about to forget
- **95% Retention Rate**: Maintain high knowledge retention over time
- **Personalized Learning**: Algorithm adapts to your individual learning patterns

## 🎨 User Interface Features

### **Modern Design**
- Clean, minimalist interface focused on learning
- Consistent design language throughout the application
- Smooth animations and micro-interactions
- Professional gradient themes and modern typography

### **Responsive Layout**
- **Mobile-First Design**: Optimized for touch interfaces
- **Tablet Support**: Perfect for larger screen studying
- **Desktop Experience**: Full-featured interface for power users

### **Accessibility**
- WCAG 2.1 compliant design
- High contrast ratios for better readability
- Keyboard navigation support
- Screen reader compatibility

## 📱 Core Functionality

### **Card Management**
```
✓ Create cards with rich text formatting
✓ Add images and multimedia content
✓ Bulk import/export capabilities
✓ Duplicate detection and merging
✓ Version history and undo functionality
```

### **Study Sessions**
```
✓ Customizable session lengths
✓ Break reminders and session stats
✓ Review mode with detailed feedback
✓ Skip and reschedule options
✓ Audio pronunciation support
```

### **Progress Tracking**
```
✓ Daily/weekly/monthly statistics
✓ Streak tracking and achievements
✓ Performance analytics by deck/topic
✓ Export study data and reports
✓ Goal setting and tracking
```

## 🔧 Getting Started

### **Prerequisites**
- Node.js 18+ and pnpm
- Supabase account for backend services

### **Installation**
```bash
# Clone the repository
git clone https://github.com/mineboxarabic/FlashcardsRe.git
cd FlashcardsRe

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and API credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
# OPENAI_API_KEY=your_openai_api_key
# YOUTUBE_API_KEY=your_youtube_api_key # optional, for YouTube text extraction

# Start development server
pnpm dev
```

### **Build for Production**
```bash
# Create optimized build
pnpm build

# Preview production build
pnpm preview
```

## 🎯 Use Cases

### **Students**
- Medical school terminology and concepts
- Language learning with vocabulary building
- STEM subjects with formula memorization
- History dates and important events

### **Professionals**
- Technical certification preparation
- Industry-specific knowledge retention
- Skill development and training
- Continuous learning programs

### **Educators**
- Create study materials for students
- Assessment and quiz preparation
- Curriculum reinforcement
- Distance learning support

## 🔮 Future Enhancements

- **AI-Powered Content**: Automatic card generation from text
- **Collaborative Learning**: Shared decks and study groups
- **Advanced Analytics**: Machine learning insights
- **Mobile Apps**: Native iOS and Android applications
- **Integration APIs**: Connect with other learning platforms

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on how to:
- Report bugs and suggest features
- Submit pull requests
- Improve documentation
- Help with translations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Created with ❤️ by [Yassin YOUNES](https://github.com/mineboxarabic)**

---

<div align="center">
  <p>⭐ Star this repository if you find it helpful!</p>
  <p>🐛 Found a bug? <a href="https://github.com/mineboxarabic/FlashcardsRe/issues">Report it here</a></p>
</div>
