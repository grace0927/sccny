# Project Rules

## Component Library Preference

### 1. Use shadcn/ui Components First

- **Primary Choice**: Always prefer shadcn/ui components when available
- **Rationale**: Consistent design system, accessibility built-in, customizable with Tailwind CSS
- **Installation**: Use `npx shadcn@latest add [component-name]` to add new components
- **Documentation**: Reference https://ui.shadcn.com/docs/components for implementation details

### 2. Component Selection Hierarchy

1. **shadcn/ui** - Primary choice for UI components
2. **Headless UI** - For complex interactive components not available in shadcn
3. **Custom components** - Only when neither shadcn nor Headless UI provide the needed functionality
4. **Other libraries** - Last resort, requires justification

### 3. Implementation Guidelines

- Import shadcn components from `@/components/ui/[component-name]`
- Follow shadcn's composition patterns and styling conventions
- Maintain consistency with the existing design system
- Use the `cn()` utility for conditional styling

### 4. Current shadcn Components Available

- navigation-menu
- (Add new components here as they are installed)

### 5. Migration Strategy

- When updating existing components, prioritize migrating to shadcn equivalents
- Ensure backward compatibility during transitions
- Update documentation and examples accordingly
