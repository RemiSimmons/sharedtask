# SharedTask - Collaborative Task Management Platform

A modern, full-stack task management application built with Next.js, Supabase, and Stripe for seamless collaboration and project management.

## 🚀 Features

- **Task Management**: Create, assign, and track tasks with real-time updates
- **Team Collaboration**: Invite team members and manage project access
- **Subscription System**: 4-tier pricing with 14-day free trials
- **Real-time Updates**: Live task updates and notifications
- **Admin Dashboard**: Comprehensive analytics and user management
- **Mobile Responsive**: Works seamlessly on all devices

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account
- Resend account (for emails)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sharedtask.git
   cd sharedtask
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables (see Environment Setup below)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Resend (Email)
RESEND_API_KEY=your_resend_api_key

# App Configuration
NODE_ENV=development
```

## 📊 Database Setup

1. **Create Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and keys

2. **Run database migrations**
   ```bash
   # Apply the main schema
   psql -h your-db-host -U postgres -d postgres -f database-schema.sql
   
   # Apply subscription schema
   psql -h your-db-host -U postgres -d postgres -f subscription-schema.sql
   
   # Apply production RLS policies
   psql -h your-db-host -U postgres -d postgres -f production-rls-policies.sql
   ```

## 💳 Stripe Setup

1. **Create Stripe products**
   - Free: $0/month
   - Basic: $9/month  
   - Pro: $29/month
   - Team: $99/month

2. **Configure webhooks**
   - Endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

## 📧 Email Setup (Resend)

1. **Create Resend account**
   - Go to [resend.com](https://resend.com)
   - Verify your domain
   - Get your API key

2. **Configure email templates**
   - Trial reminder emails (Day 10 and Day 14)
   - Subscription welcome emails
   - Cancellation confirmations

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables**
   - Add all production environment variables in Vercel dashboard
   - Update `NEXTAUTH_URL` to your production domain

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📁 Project Structure

```
sharedtask/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   └── ...
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...
├── lib/                  # Utility functions
├── types/                # TypeScript definitions
├── hooks/                # Custom React hooks
├── contexts/             # React contexts
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🔒 Security Features

- Row Level Security (RLS) policies
- Rate limiting
- Input validation
- CSRF protection
- Secure authentication
- Environment variable protection

## 📈 Monitoring & Analytics

- Error tracking
- Performance monitoring
- User analytics
- Admin dashboard metrics
- Structured logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: Check the `/docs` folder
- Issues: GitHub Issues
- Email: support@sharedtask.ai

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Third-party integrations
- [ ] White-label solutions
- [ ] Advanced automation

---

Built with ❤️ using Next.js, Supabase, and Stripe
