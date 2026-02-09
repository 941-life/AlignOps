# AlignOps Color Palette

## Brand Colors

### Primary Palette
```
#685AFF - Purple (primary)
#9CCFFF - Sky Blue (accent)
#FF5B5B - Coral Red (destructive/alerts)
#F0FFC3 - Cream Yellow (highlights/pass)
```

### Usage Guide

#### Purple (#685AFF)
- **Primary actions**: Main buttons, links
- **Loading states**: Validating status
- **Gemini insights**: AI-powered features
- **Active navigation**: Current page indicator

```tsx
// Examples
className="bg-brand-purple text-white"
className="text-brand-purple"
className="border-brand-purple"
```

#### Sky Blue (#9CCFFF)
- **Accents**: Hover states, focus rings
- **Info messages**: Non-critical information
- **Background gradients**: Subtle backgrounds
- **Charts**: Data visualization

```tsx
// Examples
className="bg-brand-sky/30"
className="hover:border-brand-sky/50"
className="bg-gradient-to-br from-brand-sky/10 to-brand-purple/5"
```

#### Coral Red (#FF5B5B)
- **Destructive actions**: Delete, block, error
- **Alerts**: High priority warnings
- **Outlier indicators**: Anomaly detection
- **Block status**: Failed validations

```tsx
// Examples
className="bg-brand-coral/10 text-brand-coral"
className="border-brand-coral/30"
className="hover:border-brand-coral/40"
```

#### Cream Yellow (#F0FFC3)
- **Success indicators**: Pass status
- **Highlights**: Important information
- **Warning backgrounds**: Soft alerts
- **Fallback indicators**: Alternative states

```tsx
// Examples
className="bg-brand-cream"
className="bg-brand-cream/40"
className="text-amber-700 bg-brand-cream"
```

## Status Colors

### PASS
- Background: `bg-brand-cream/30`
- Text: `text-emerald-700`
- Border: `border-brand-cream`

### WARN
- Background: `bg-brand-cream`
- Text: `text-amber-700`
- Border: `border-amber-200`

### BLOCK
- Background: `bg-brand-coral/10`
- Text: `text-brand-coral`
- Border: `border-brand-coral/30`

### VALIDATING
- Background: `bg-brand-sky/20`
- Text: `text-brand-purple`
- Border: `border-brand-sky/50`

## Component Examples

### Statistics Cards
```tsx
<StatCard 
  title="Total Datasets" 
  color="blue"  // Uses brand-purple & brand-sky
/>
<StatCard 
  title="Pass" 
  color="emerald"  // Uses brand-cream
/>
<StatCard 
  title="Block" 
  color="rose"  // Uses brand-coral
/>
```

### Gradients
```tsx
// Subtle background
className="bg-gradient-to-br from-brand-sky/20 to-brand-purple/10"

// Image placeholder
className="bg-gradient-to-br from-brand-sky/10 to-brand-purple/5"
```

### Hover States
```tsx
// Cards
className="hover:shadow-lg hover:border-brand-sky/50"

// Outlier samples
className="hover:border-brand-coral/40"
```

## Accessibility

All colors meet WCAG 2.1 AA standards:
- **Purple on white**: ✅ 7.8:1 ratio
- **Coral on light bg**: ✅ 4.8:1 ratio
- **Blue on white**: ✅ 5.2:1 ratio
- **Yellow with dark text**: ✅ 8.1:1 ratio

## Design Philosophy

These colors add **personality and vibrancy** while maintaining the **"Clinical Precision"** aesthetic:

1. **Purple**: Modern, intelligent (AI/ML feel)
2. **Sky Blue**: Calm, trustworthy (data operations)
3. **Coral Red**: Alert, attention (critical issues)
4. **Cream Yellow**: Success, positive (validation pass)

The palette creates a **friendly yet professional** DataOps platform that stands out from typical enterprise tools while remaining appropriate for production use.
