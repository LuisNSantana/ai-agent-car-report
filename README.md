# Zynk AI Agent

<div align="center">
  <img src="public/logo.png" alt="Zynk Logo" width="200" />
  <p><strong>Your intelligent AI assistant for car reports and more</strong></p>
</div>

![Zynk Dashboard](public/dashboard-preview.png)

## Overview

Zynk is a powerful AI assistant platform built with Next.js, Convex, and Clerk, designed to help users with car reports, data analysis, and general assistance. The application features a modern, responsive UI with real-time chat capabilities, document analysis, and personalized insights.

### Key Features

- Real-time Chat Interface: Engage in natural conversations with the AI assistant
- Car Reports: Generate and analyze vehicle data and reports
- Data Analysis: Process and visualize information from various sources
- Secure Authentication: User management powered by Clerk
- Responsive Design: Beautiful UI that works across all devices
- Real-time Database: Powered by Convex for instant updates

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- Convex account
- Clerk account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/LuisNSantana/ai-agent-car-report.git
   cd ai-agent-car-report
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. In a separate terminal, start the Convex development server:
   ```bash
   pnpm convex dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
zynk-ai-agent/
├── app/                    # Next.js app directory
│   ├── dashboard/          # Dashboard and chat interface
│   ├── api/                # API routes
│   └── page.tsx            # Landing page
├── components/             # Reusable React components
│   ├── ui/                 # UI components (buttons, cards, etc.)
│   ├── ChatInterface.tsx   # Main chat interface
│   ├── MessageBubble.tsx   # Chat message component
│   └── Sidebar.tsx         # Application sidebar
├── convex/                 # Convex backend
│   ├── chats.ts            # Chat-related queries and mutations
│   ├── messages.ts         # Message-related queries and mutations
│   └── schema.ts           # Database schema
├── lib/                    # Utility functions and helpers
│   ├── context/            # React context providers
│   └── utils.ts            # General utility functions
├── public/                 # Static assets
└── types/                  # TypeScript type definitions
```

## Technologies Used

- Frontend:
  - [Next.js 14](https://nextjs.org/) - React framework
  - [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
  - [shadcn/ui](https://ui.shadcn.com/) - UI component library
  - [Lucide React](https://lucide.dev/) - Icon library

- Backend:
  - [Convex](https://www.convex.dev/) - Backend development platform
  - [Clerk](https://clerk.dev/) - Authentication and user management

- Development Tools:
  - [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
  - [ESLint](https://eslint.org/) - Code linting
  - [Prettier](https://prettier.io/) - Code formatting

## Features in Detail

### Dashboard

The dashboard provides an overview of your activity, recent conversations, and account information. It displays:

- Total chats and activity metrics
- Recent conversations with preview of the last message
- User profile information
- Beta plan usage status

### Chat Interface

The chat interface allows you to:

- Start new conversations
- Continue existing chats
- View chat history
- Receive real-time responses from the AI

### Car Reports

Generate detailed reports about vehicles including:

- Performance metrics
- Maintenance history
- Market value analysis
- Comparison with similar models

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Luis N. Santana - [GitHub](https://github.com/LuisNSantana)

Project Link: [https://github.com/LuisNSantana/ai-agent-car-report](https://github.com/LuisNSantana/ai-agent-car-report)

---

<div align="center">
  <p>Built with ❤️ using Next.js, Convex, and Clerk</p>
</div>
