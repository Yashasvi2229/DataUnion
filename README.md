<div align="center">

# 🤝 DataUnion

### *Building a Transparent, Consent-Driven AI Data Economy*

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[🚀 Live Demo](#getting-started) • [📐 Technical Docs](TECHNICAL.md) • [📊 Research](RESEARCH.md) • [🔮 Roadmap](ROADMAP.md)

</div>

---

## 🎯 The Problem

The AI industry is built on a **broken data foundation**:

- 🚨 AI companies scrape data without consent, facing **billion-dollar lawsuits**
- 💸 Individuals whose data powers AI models receive **zero compensation**
- 🔒 No transparency in how personal data is used for training
- ⚖️ Legal battles costing millions (NYT vs OpenAI, Getty vs Stability AI)
- � Poor data quality from unverified, untracked sources

**The current system exploits contributors and puts AI companies at legal risk.**

---

## 💡 Our Solution

**DataUnion** creates a **consent-first marketplace** where everyone benefits:

| Stakeholder | Benefit |
|-------------|---------|
| 👥 **Contributors** | Own your data, control usage rights, earn fair compensation |
| 🏢 **AI Companies** | Access legally-licensed, high-quality datasets with full transparency |
| 🌍 **Society** | Ethical AI development with traceable, consented data |

### How We're Different:

- ✅ **Explicit consent** at every step with granular permissions
- ✅ **Full traceability** through immutable audit trails
- ✅ **Fair compensation** automatically distributed based on actual usage
- ✅ **Quality-verified** data through AI validation engine

---

## ✨ Core Features

<table>
<tr>
<td width="50%">

### 🔐 For Contributors
- Upload data with full ownership
- Set granular usage permissions
- Track every transaction in real-time
- Receive automatic payouts
- Revoke consent anytime

</td>
<td width="50%">

### 🏪 For AI Companies
- Browse verified datasets
- Transparent pricing & licensing
- Quality scores for every dataset
- Immutable usage logs
- Compliant with regulations

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

**Frontend:** Next.js 16.1 (App Router) • TypeScript • Tailwind CSS v4 • Framer Motion  
**Backend:** Supabase (PostgreSQL + Auth) • Next.js API Routes  
**Infrastructure:** Vercel • Supabase Cloud

> 📐 **For detailed architecture, diagrams, and technical deep-dive:** [See TECHNICAL.md](TECHNICAL.md)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account ([create free account](https://supabase.com))

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/DataUnion.git
cd DataUnion

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env.local
# Add your Supabase credentials to .env.local

# 4. Initialize database
# - Go to your Supabase project SQL Editor
# - Run supabase/schema.sql
# - Run supabase/seed.sql (optional demo data)

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## � Documentation

| Document | Description |
|----------|-------------|
| **[📐 TECHNICAL.md](TECHNICAL.md)** | System architecture, diagrams, database schema, technical flows |
| **[📊 RESEARCH.md](RESEARCH.md)** | Problem analysis, regulations, market impact, statistics |
| **[🚀 ROADMAP.md](ROADMAP.md)** | Round 2 improvements and future features |

---

## 🎬 User Flows

### Contributor Journey:
1. **Sign up** → Create account and verify email
2. **Upload data** → Submit with consent preferences
3. **Get validated** → AI engine assigns quality score
4. **Track usage** → See which companies licensed your data
5. **Earn rewards** → Automatic payouts when data is used

### Company Journey:
1. **Browse marketplace** → Discover verified datasets
2. **Review metrics** → Check quality scores and samples
3. **Purchase license** → Transparent pricing, instant access
4. **Use ethically** → Full audit trail of data usage
5. **Stay compliant** → GDPR-friendly, consent-backed data

---

## 📊 Why This Matters

The AI data economy is worth **billions**, but it's built on questionable foundations.

**DataUnion fixes this by:**
- Creating **legal certainty** for AI companies
- Ensuring **fair compensation** for data contributors
- Establishing **transparency** in the AI supply chain
- Building **trust** through verifiable consent

> 📊 **For detailed market analysis, regulatory landscape, and impact statistics:** [See RESEARCH.md](RESEARCH.md)

---

## 🎖️ Hackathon Submission

**Track:** S8 - Open Innovation  
**Why Open Innovation?** DataUnion doesn't fit traditional categories—we're building fundamental infrastructure for the AI era.

---

## 👥 Team

| Name | Role | Contribution |
|------|------|--------------|
| **[Your Name]** | Full-Stack Developer | System architecture, backend development, main README, roadmap |
| **[Friend 1 Name]** | Technical Architect | System diagrams, database design, technical documentation |
| **[Friend 2 Name]** | Research Analyst | Market research, regulatory analysis, impact assessment |

---

## 🔮 What's Next?

This prototype demonstrates the core concept. For Round 2, we're planning:

- 🔐 Production authentication with OAuth
- 🤖 Advanced ML-powered data quality scoring
- ⛓️ Blockchain integration for immutable audit trails
- 💳 Real payment processing (Stripe + crypto)
- 📱 Mobile apps (iOS & Android)
- 🌍 API marketplace for third-party integrations

> 🚀 **See complete roadmap:** [ROADMAP.md](ROADMAP.md)

---

## � Project Structure

```
DataUnion/
├── app/                   # Next.js app router
│   ├── page.tsx          # Landing page
│   ├── contributor/      # Contributor dashboard
│   ├── company/          # Company marketplace
│   └── walkthrough/      # Interactive demo
├── components/           # Reusable UI components
├── lib/                  # Utilities & Supabase client
├── supabase/            # Database schema & seed data
├── docs/                # Additional documentation
├── TECHNICAL.md         # Architecture & diagrams
├── RESEARCH.md          # Market analysis
└── ROADMAP.md           # Future plans
```

---

## � License

This project is licensed under the MIT License.

---

## 🙌 Acknowledgments

Built for **Hack the Winter - The Second Wave (Angry Bird Edition)**  
Powered by Next.js, Supabase, and the open-source community

---

<div align="center">

### 🌟 Building an Ethical AI Future, One Dataset at a Time 🌟

**Questions?** Check our [Technical Docs](TECHNICAL.md) • [Research](RESEARCH.md) • [Roadmap](ROADMAP.md)

</div>
