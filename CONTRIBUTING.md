# Contributing to Market Intelligence Platform

Kami sangat menghargai kontribusi dari komunitas! Berikut adalah panduan untuk memulai.

## Cara Berkontribusi

### 1. Melaporkan Bug
Jika Anda menemukan bug, silakan buka issue dengan template berikut:

```markdown
**Bug Description**
Deskripsi singkat tentang bug

**Steps to Reproduce**
1. Pergi ke '...'
2. Klik pada '....'
3. Scroll sampai '....'
4. Lihat error

**Expected Behavior**
Apa yang seharusnya terjadi

**Screenshots**
Jika applicable, tambahkan screenshot

**Environment:**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 95.0]
- Version: [e.g. 22]
```

### 2. Meminta Fitur
Untuk request fitur baru, gunakan template:

```markdown
**Is your feature request related to a problem?**
Jelaskan masalah yang ingin diselesaikan

**Describe the solution you'd like**
Deskripsi solusi yang diinginkan

**Describe alternatives you've considered**
Alternatif lain yang sudah dipertimbangkan

**Additional context**
Screenshot atau mockup jika applicable
```

## Development Setup

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- Git

### Quick Start
```bash
git clone https://github.com/your-org/market-intelligence.git
cd market-intelligence
pnpm install
pnpm dev
```

### Backend Setup
```bash
cd backend/
supabase init
supabase start
```

## Code Style Guidelines

### Frontend (React + TypeScript)

#### Components
- Gunakan functional components dengan hooks
- Naming: PascalCase untuk components
- Props interface wajib didefinisikan
- Import urutan: React → external libs → internal components → utils

```typescript
// ✅ Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant, 
  children, 
  onClick 
}) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

#### Hooks
- Custom hooks dimulai dengan `use`
- Dependency array harus accurate
- Error handling di dalam hooks

```typescript
// ✅ Good
export const useMarketData = (token: string) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook logic here
  
  return { data, loading, error };
};
```

#### Styling
- Gunakan TailwindCSS classes
- Hindari inline styles untuk styling consistency
- Buat component variants dengan classes

```typescript
// ✅ Good
const Button = ({ variant = 'primary' }) => (
  <button className={`
    px-4 py-2 rounded-md font-medium
    ${variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}
    hover:opacity-90 transition-opacity
  `}>
    Click me
  </button>
);
```

### Backend (Supabase Edge Functions)

#### Structure
```typescript
// ✅ Good
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Logic here
    const result = await processRequest(req);
    
    return new Response(
      JSON.stringify({ data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
```

#### Error Handling
- Always handle errors gracefully
- Return proper HTTP status codes
- Include meaningful error messages

#### API Design
- Consistent response format
- Proper HTTP methods
- Input validation
- Rate limiting considerations

## Testing

### Frontend Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Testing Guidelines
- Test user interactions, not implementation
- Use realistic test data
- Mock external API calls
- Test error scenarios

```typescript
// ✅ Good
describe('MarketData component', () => {
  it('should display loading state', () => {
    render(<MarketData token="bitcoin" loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<MarketData token="invalid" error="Token not found" />);
    expect(screen.getByText('Token not found')).toBeInTheDocument();
  });
});
```

## Pull Request Process

### 1. Branch Naming
- Feature: `feature/description`
- Bug fix: `fix/description`
- Hotfix: `hotfix/description`
- Documentation: `docs/description`

### 2. Commit Messages
Format: `<type>(<scope>): <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi colons, etc
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

```bash
feat(frontend): add probability chart component
fix(api): handle null token parameter
docs(readme): update setup instructions
```

### 3. PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that causes existing functionality to not work as expected)
- [ ] This change requires a documentation update

## Testing
- [ ] I have tested the changes locally
- [ ] New integration tests pass
- [ ] Existing tests pass

## Screenshots (if applicable)
Before and after screenshots

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## Performance Guidelines

### Frontend
- Lazy load components
- Optimize bundle size
- Use React.memo for expensive components
- Implement proper caching strategies

### Backend
- Minimize API calls
- Implement caching for frequent queries
- Use proper indexes in database
- Monitor function execution time

## Security Guidelines

### Frontend
- Never expose API keys
- Validate all user inputs
- Use HTTPS in production
- Implement proper CORS policies

### Backend
- Validate all inputs
- Use proper authentication
- Implement rate limiting
- Sanitize database queries

## Documentation

### Code Documentation
- JSDoc for complex functions
- Inline comments for business logic
- README updates for new features

### API Documentation
- Update API.md for endpoint changes
- Include request/response examples
- Document error codes

## Getting Help

- 📚 Check existing documentation
- 🔍 Search existing issues
- 💬 Join our Discord community
- 📧 Email: support@marketintel.io

## Recognition

Kami akan mengakui kontributor di:
- README.md Contributors section
- Release notes
- Annual contributors appreciation post

Terima kasih atas kontribusi Anda! 🚀