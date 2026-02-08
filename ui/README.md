# AlignOps Frontend

A modern, accessible web interface for the AlignOps dataset validation platform.

## Features

- **Light Mode Design**: Clean "Clinical Precision" theme optimized for data visibility
- **Accessible**: Full keyboard navigation, ARIA labels, and screen reader support
- **Responsive**: Mobile-first design that works on all screen sizes
- **Real-time Data**: TanStack Query for efficient data fetching and caching
- **Mock Development**: MSW (Mock Service Worker) for development without backend

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React
- **Mocking**: MSW (Mock Service Worker)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
cd ui
npm install
```

### Development

Run with mock data (no backend required):

```bash
npm run dev
```

The application will be available at http://localhost:3000

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=true  # Set to false to use real API
```

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
ui/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Dashboard (dataset overview)
│   ├── datasets/[id]/
│   │   ├── page.tsx            # Version timeline
│   │   └── v/[version]/
│   │       ├── audit/page.tsx  # Semantic audit report
│   │       └── lineage/page.tsx # Lineage & RCA
│   └── control-plane/page.tsx  # Control plane actions
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── status-badge.tsx         # Status indicator component
│   └── providers.tsx            # Query client provider
├── lib/
│   ├── api-client.ts           # API functions
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
└── mocks/
    ├── handlers.ts             # MSW request handlers
    └── browser.ts              # MSW browser worker
```

## Accessibility Features

This application follows WCAG 2.1 AA standards and implements:

### Keyboard Navigation
- Full keyboard support for all interactive elements
- Visible focus rings (`:focus-visible`)
- Logical tab order
- Skip links for main content

### Screen Readers
- Semantic HTML (`<nav>`, `<main>`, `<header>`)
- ARIA labels on icon-only buttons
- Descriptive link text
- Breadcrumb navigation with `aria-label`

### Visual
- High contrast text (APCA compliant)
- Color-blind friendly status indicators (icon + color + text)
- Large touch targets (≥36px)
- Scalable interface (supports browser zoom)

### Motion
- Respects `prefers-reduced-motion`
- Optional animations only

## Design System

### Colors

Status colors follow the light-mode "Clinical Precision" theme:

- **PASS**: `bg-emerald-100 text-emerald-700` with CheckCircle icon
- **WARN**: `bg-amber-100 text-amber-700` with AlertTriangle icon
- **BLOCK**: `bg-rose-100 text-rose-700` with XCircle icon
- **PENDING**: `bg-slate-100 text-slate-700` with Clock icon
- **VALIDATING**: `bg-blue-100 text-blue-700` with Loader icon

### Typography

- **Font**: Inter (system fallback)
- **Body**: `text-slate-900`
- **Secondary**: `text-slate-500`
- **Numbers**: `font-variant-numeric: tabular-nums` for alignment

### Spacing

Consistent 4px/8px grid system using Tailwind spacing scale.

## API Integration

The frontend communicates with the AlignOps API:

- `GET /datasets/` - List all datasets
- `GET /datasets/{id}` - Get dataset versions
- `POST /datasets/` - Create dataset version
- `PATCH /datasets/{id}/v/{version}/validate-l1` - Update L1 validation
- `PATCH /datasets/{id}/v/{version}/audit-l2` - Update L2 audit
- `POST /datasets/{id}/v/{version}/trigger-l2` - Trigger L2 analysis

See `docs/API_SPEC.md` for complete API documentation.

## Development with Mocks

MSW provides realistic mock data for development:

1. Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`
2. Run `npm run dev`
3. Mock data includes 3 sample datasets with various statuses

To disable mocks and use the real API:
1. Set `NEXT_PUBLIC_USE_MOCKS=false`
2. Ensure the backend API is running on `http://localhost:8000`

## Testing

The application has been tested for:
- ✅ Keyboard-only navigation
- ✅ Screen reader compatibility (NVDA, VoiceOver)
- ✅ Mobile responsiveness (320px - 2560px)
- ✅ Browser zoom (50% - 200%)
- ✅ Color contrast (APCA)
- ✅ Reduced motion preferences

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance

- Skeleton loading states prevent layout shift
- Code splitting via Next.js dynamic imports
- Optimized images with Next.js Image component
- Efficient re-renders with React Query caching

## Contributing

When adding new features:

1. Follow the existing component patterns
2. Ensure accessibility (keyboard, screen reader, contrast)
3. Use TypeScript types from `lib/types.ts`
4. Add appropriate loading and error states
5. Test on mobile viewports
6. Check with `prefers-reduced-motion` enabled

## License

Copyright © 2026 AlignOps

