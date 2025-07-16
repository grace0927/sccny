# Project Rules

## Component Library Preference

### 1. Use Flowbite Components First

- **Primary Choice**: Always prefer Flowbite components when available
- **Rationale**: Comprehensive component library with Tailwind CSS, accessibility built-in, responsive design patterns
- **Installation**: Use `npm install flowbite` and configure in tailwind.config.js
- **Documentation**: Reference https://flowbite.com/docs/components for implementation details
- **JavaScript**: Include Flowbite JS for interactive components: `import { initFlowbite } from 'flowbite'`

### 2. Component Selection Hierarchy

1. **Flowbite** - Primary choice for UI components
2. **shadcn/ui** - Secondary choice when Flowbite doesn't provide the needed component
3. **Headless UI** - For complex interactive components not available in Flowbite or shadcn
4. **Custom components** - Only when none of the above provide the needed functionality
5. **Other libraries** - Last resort, requires justification

### 3. Implementation Guidelines

- Import Flowbite components using standard HTML structure with Flowbite CSS classes
- Use Flowbite's data attributes for interactive functionality (e.g., `data-collapse-toggle`, `data-dropdown-toggle`)
- Initialize Flowbite JavaScript for interactive components: `initFlowbite()` in useEffect
- For shadcn components, import from `@/components/ui/[component-name]`
- Use the `cn()` utility for conditional styling when combining libraries
- Maintain consistency with Flowbite's design system as primary

### 4. Current Components Available

**Flowbite Components:**

- navbar (with dropdown, multi-level dropdown, sticky, search, CTA button, language dropdown, user menu)
- footer (with logo, social media icons, sitemap links, sticky footer)
- (Add new Flowbite components here as they are used)

**shadcn Components:**

- navigation-menu
- (Add new shadcn components here as they are installed)

### 5. Migration Strategy

- When updating existing components, prioritize migrating to Flowbite equivalents first
- If Flowbite doesn't provide the needed functionality, consider shadcn/ui
- Ensure backward compatibility during transitions
- Update documentation and examples accordingly
- Test interactive components with Flowbite JS initialization
