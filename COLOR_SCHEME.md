# 🎨 AlignOps Color Scheme - Natural & Professional

## New Color Palette

자연스럽고 전문적인 느낌을 주는 색상 조합으로 완전히 재설계되었습니다.

### Primary Colors

```
🌿 Sage Green (Primary)
#A5C89E - 버튼, 주요 액션, 성공 상태
RGB: 165, 200, 158
용도: 주요 버튼, 링크, 액티브 상태

🌲 Forest Green (Hover/Dark)
#6B8E68 - Sage의 hover 상태, 강조 텍스트
RGB: 107, 142, 104

🍦 Soft Cream
#FFF7CD - 배경, 보조 요소
RGB: 255, 247, 205
용도: 경고 배경, 부드러운 하이라이트

🌸 Soft Coral
#FB9B8F - 경고, 삭제, 블록 상태
RGB: 251, 155, 143
용도: 오류 메시지, BLOCK 상태

☁️ Sky Blue
#9CCFFF - 정보, 보조 액션
RGB: 156, 207, 255
용도: 정보 카드, VALIDATING 상태

🍑 Soft Peach
#FFD4CC - 섬세한 하이라이트
RGB: 255, 212, 204
용도: 미묘한 강조, 배경 그라데이션
```

## Usage Guide

### ✅ DO: 권장 사용법

```typescript
// 주요 버튼 (Sage Green)
<Button className="bg-brand-sage hover:bg-brand-forest">
  Create Dataset
</Button>

// 성공 상태 (Sage)
<StatusBadge className="bg-brand-sage/20 text-brand-forest border-brand-sage" />

// 경고 (Cream + Coral)
<Alert className="bg-brand-cream border-brand-coral/30">
  <AlertTriangle className="text-brand-coral" />
</Alert>

// 정보 카드 (Sky Blue)
<Card className="bg-brand-sky/10 border-brand-sky/30">
  <CardTitle className="text-blue-700">Info</CardTitle>
</Card>

// 그라데이션 배경
<div className="bg-gradient-to-br from-brand-sky/10 to-brand-sage/5">
```

### ❌ DON'T: 사용하지 말 것

```typescript
// ❌ 보라색 (#685AFF) 절대 사용 금지!
// ❌ 특히 버튼에 보라색 사용 금지

// ❌ 잘못된 예시
<Button className="bg-brand-purple">  // 제거됨!
```

## Component-Specific Colors

### Buttons
- **Primary Action**: `bg-brand-sage hover:bg-brand-forest text-white`
- **Secondary**: `bg-brand-cream hover:bg-brand-cream/80 text-slate-900`
- **Destructive**: `bg-brand-coral hover:bg-destructive/90 text-white`

### Status Badges
- **PASS**: Sage green background with forest text
- **WARN**: Cream background with amber text
- **BLOCK**: Soft coral background
- **VALIDATING**: Sky blue background
- **PENDING**: Neutral gray

### Cards & Containers
- **Default**: White with subtle gray border
- **Info**: Sky blue tint (`bg-brand-sky/10`)
- **Success**: Sage green tint (`bg-brand-sage/20`)
- **Warning**: Cream tint (`bg-brand-cream`)
- **Error**: Soft coral tint (`bg-brand-coral/10`)

### Text Colors
- **Primary Text**: `text-slate-900`
- **Secondary Text**: `text-slate-600`
- **Muted Text**: `text-slate-500`
- **Accent Text**: `text-brand-forest` (green) or `text-blue-700` (blue)

## Design Principles

### 1. Natural & Calming
자연에서 영감을 받은 색상으로 사용자에게 편안함을 줍니다.

### 2. Professional & Clean
과하지 않은 채도로 전문적이고 깔끔한 인상을 제공합니다.

### 3. Accessible
WCAG AA 기준을 충족하는 대비율을 유지합니다.

### 4. Consistent
모든 UI 요소에서 일관된 색상 사용 규칙을 따릅니다.

## Before & After

### Before (Old Palette)
```
❌ #685AFF - 보라색 (제거됨!)
✓ #FF5B5B - 밝은 코랄 → #FB9B8F (Soft Coral)
✓ #F0FFC3 - 밝은 그린 크림 → #FFF7CD (Soft Cream)
✓ #9CCFFF - Sky Blue (유지)
```

### After (New Palette)
```
✓ #A5C89E - Sage Green (새 Primary!)
✓ #6B8E68 - Forest Green (Hover)
✓ #FFF7CD - Soft Cream
✓ #FB9B8F - Soft Coral
✓ #9CCFFF - Sky Blue
✓ #FFD4CC - Soft Peach (새 보조색)
```

## Tailwind Configuration

```typescript
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: "#A5C89E", // Sage green
    foreground: "#1a3a1a",
  },
  secondary: {
    DEFAULT: "#FFF7CD", // Soft cream
  },
  destructive: {
    DEFAULT: "#FB9B8F", // Soft coral
  },
  brand: {
    sage: "#A5C89E",
    cream: "#FFF7CD",
    coral: "#FB9B8F",
    sky: "#9CCFFF",
    forest: "#6B8E68",
    peach: "#FFD4CC",
  },
}
```

## Implementation Complete! ✅

모든 UI 컴포넌트에서 보라색이 제거되고 새로운 Natural & Professional 팔레트가 적용되었습니다.
