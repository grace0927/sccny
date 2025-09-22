# SCCNY Website - Project Specification

## Overview

The SCCNY (Suffolk Chinese Christian Church of New York) website is a modern, multilingual web application built as a Turborepo monorepo. This specification document provides a comprehensive overview of the project architecture, technical decisions, features, and implementation details.

## Project Structure

```
sccny-monorepo/
├── apps/sccny/              # Main Next.js application
│   ├── src/                 # Application source code
│   ├── public/              # Static assets
│   ├── prisma/              # Database schema and migrations
│   └── package.json         # App-specific dependencies
├── turbo.json               # Turborepo configuration
├── package.json             # Root workspace configuration
└── doc/                     # Documentation
```

## Technical Architecture

### Core Framework

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Build Tool**: Turborepo for monorepo management
- **Runtime**: Node.js 18+

### Frontend Architecture

- **Styling**: Tailwind CSS v4
- **Component Library**: Flowbite (primary), shadcn/ui (secondary)
- **Icons**: Heroicons, Lucide React
- **Fonts**: Geist Sans & Geist Mono (Google Fonts)

### Component Library Strategy

#### 1. Flowbite Components (Primary Choice)

- **Rationale**: Comprehensive component library with Tailwind CSS integration
- **Features**: Accessibility built-in, responsive design patterns
- **Installation**: `npm install flowbite`
- **JavaScript**: Requires `initFlowbite()` initialization for interactive components

#### 2. Component Selection Hierarchy

1. **Flowbite** - Primary choice for UI components
2. **shadcn/ui** - Secondary choice when Flowbite doesn't provide needed functionality
3. **Headless UI** - For complex interactive components
4. **Custom components** - Only when none of the above provide needed functionality

#### 3. Implementation Guidelines

- Use Flowbite's data attributes for interactive functionality
- Initialize Flowbite JavaScript in useEffect hooks
- Use `cn()` utility for conditional styling when combining libraries
- Maintain consistency with Flowbite's design system

### Internationalization (i18n)

#### Supported Locales

- **English** (`en`) - Secondary language
- **Chinese** (`zh`) - Primary language (default)

#### Implementation

- **Library**: next-intl v4.3.4
- **Message Files**: Located in `src/messages/`
- **Routing**: Dynamic locale routing with `[locale]` segments
- **Time Zone**: America/New_York (UTC-4:00)

#### Features

- Automatic locale detection
- SEO-friendly URLs with locale prefixes
- Message translation with fallback support
- Date/time localization

## Database Architecture

### Database Provider

- **Type**: PostgreSQL
- **Provider**: Neon (serverless PostgreSQL)
- **ORM**: Prisma v6.16.2

### Schema Design

#### Sermon Model

```prisma
model Sermon {
  id          String     @id @default(cuid())
  title       String
  speaker     String
  date        DateTime
  type        SermonType @default(SERMON)
  series      String?
  scripture   String?
  videoUrl    String?
  audioUrl    String?
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@map("sermons")
}

enum SermonType {
  SERMON           // Main sermon recordings
  SUNDAY_SCHOOL    // Sunday school teachings
  RETREAT_MESSAGE  // Special retreat messages
  BAPTISM_CLASS    // Baptism preparation classes
}
```

#### Database Features

- **Indexes**: Optimized for date, speaker, and type filtering
- **Constraints**: Unique constraint on title + date to prevent duplicates
- **Migrations**: Automated with Prisma migration system
- **Connection**: Environment-based configuration with DATABASE_URL

## API Architecture

### REST API Endpoints

#### Sermon Management (`/api/sermons`)

- **GET** `/api/sermons` - List sermons with pagination and filtering
- **GET** `/api/sermons/[id]` - Get single sermon
- **POST** `/api/sermons` - Create new sermon
- **PUT** `/api/sermons/[id]` - Update sermon
- **DELETE** `/api/sermons/[id]` - Delete sermon

#### Task Management (`/api/tasks`)

- **POST** `/api/tasks/sync-sermons` - Trigger sermon synchronization

### API Features

- **Validation**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error responses with proper HTTP codes
- **Pagination**: Configurable page size with metadata
- **Filtering**: By speaker, series, type, and date range
- **Sorting**: By date, title, or speaker (ascending/descending)

### Data Synchronization

#### Web Scraping System

- **Sources**: 4 different sermon content types from church website
- **Technology**: Cheerio for HTML parsing, Axios for HTTP requests
- **Schedule**: Daily cron job at 2:00 AM UTC
- **Language Support**: Automatic Chinese and English content parsing

#### Cron Job Configuration

```json
{
  "crons": [
    {
      "path": "/api/tasks/sync-sermons",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Application Features

### Core Pages

- **Home** (`/`) - Main landing page
- **About** (`/about`) - Church information
  - Confession of Faith
  - Historic Creeds
  - Ministries
  - Vision
- **Contact** (`/contact`) - Contact information
- **Meeting Times** (`/meeting-times`) - Service schedules
- **Messages** (`/messages`) - Sermon content
  - Sermon Recordings
  - Baptism Class
  - Special Gathering
  - Sunday School
- **Pastoral Search** (`/pastoral-search`) - Pastoral search information

### Advanced Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **SEO Optimization**: Next.js metadata API and structured data
- **Performance**: Image optimization and code splitting
- **Accessibility**: ARIA labels and keyboard navigation support
- **Progressive Web App**: Service worker and offline capabilities

## Development Workflow

### Environment Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Development Tools

- **ESLint**: Code linting and formatting
- **TypeScript**: Type checking and IntelliSense
- **PostCSS**: CSS processing and optimization
- **Tailwind CSS**: Utility-first CSS framework

### Code Organization

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations
├── messages/            # Internationalization messages
├── generated/           # Generated files (Prisma client)
└── config.ts           # Application configuration
```

## Deployment & Infrastructure

### Deployment Platform

- **Platform**: Vercel
- **Configuration**: Automated deployments from Git
- **Environment**: Production and preview environments
- **Domains**: Automatic domain assignment

### Environment Variables

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_BASE_URL="https://sccny.vercel.app"
```

### Build Process

- **Triggers**: Git push to main branch
- **Steps**:
  1. Install dependencies
  2. Run Prisma migrations
  3. Build Next.js application
  4. Deploy to Vercel edge network

### Monitoring & Analytics

- **Performance**: Vercel Analytics
- **Errors**: Vercel Error Tracking
- **Database**: Prisma query monitoring
- **Cron Jobs**: Vercel Cron monitoring

## Security Considerations

### Current Implementation

- **Database**: Environment-based credentials
- **API**: Input validation with Zod schemas
- **Dependencies**: Regular security updates
- **HTTPS**: Automatic with Vercel deployment

### Future Enhancements

- API authentication and authorization
- Rate limiting for API endpoints
- Content Security Policy (CSP)
- Input sanitization for rich text content

## Performance Optimization

### Current Optimizations

- **Images**: Next.js Image component with automatic optimization
- **Fonts**: Google Fonts with display=swap for better loading
- **Code Splitting**: Automatic code splitting by Next.js
- **Caching**: Vercel edge caching for static content

### Bundle Analysis

- **Tool**: Next.js bundle analyzer
- **Strategy**: Tree shaking and dead code elimination
- **Monitoring**: Regular bundle size monitoring

## Testing Strategy

### Unit Tests

- **Framework**: Jest with React Testing Library
- **Coverage**: API endpoints, utility functions, components
- **Mocks**: Database connections and external API calls

### Integration Tests

- **API Testing**: Full request/response cycles
- **Database Testing**: Migration and query testing
- **E2E Testing**: Critical user paths

### Manual Testing

- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Responsive**: Mobile, tablet, desktop breakpoints
- **Accessibility**: Screen readers and keyboard navigation
- **Internationalization**: Both English and Chinese content

## Future Roadmap

### Phase 1 (Current)

- ✅ Sermon API implementation
- ✅ Database schema and migrations
- ✅ Web scraping and cron jobs
- ✅ Internationalization setup

### Phase 2 (Next)

- [ ] User authentication system
- [ ] Admin dashboard for content management
- [ ] Advanced search and filtering
- [ ] Sermon series organization
- [ ] Analytics and reporting

### Phase 3 (Future)

- [ ] Mobile application
- [ ] Live streaming integration
- [ ] Event management system
- [ ] Donation/payment processing
- [ ] Multi-church network support

## Maintenance & Support

### Regular Tasks

- **Dependencies**: Monthly security updates
- **Database**: Regular backup verification
- **Performance**: Monthly performance audits
- **SEO**: Quarterly content and metadata review

### Monitoring

- **Uptime**: Vercel uptime monitoring
- **Performance**: Core Web Vitals tracking
- **Errors**: Error rate monitoring and alerting
- **Analytics**: User engagement metrics

### Documentation

- **API Documentation**: OpenAPI/Swagger documentation
- **Component Library**: Storybook for component documentation
- **Deployment Guide**: Step-by-step deployment procedures
- **Troubleshooting**: Common issues and solutions

## Feature Development Process

### Design-Implementation Pattern

For new feature development, follow this established pattern to ensure consistency and maintainability:

#### 1. Analysis Phase

- **Current State Assessment**: Analyze existing codebase, APIs, and infrastructure
- **Requirements Gathering**: Document functional and non-functional requirements
- **Gap Analysis**: Identify what exists vs. what needs to be built
- **Technical Feasibility**: Assess integration points and potential challenges

#### 2. Documentation Phase

- **Feature Specification**: Create detailed implementation plan in `/doc/features/`
- **Component Architecture**: Define component structure and responsibilities
- **API Integration Strategy**: Document how the feature will integrate with existing APIs
- **UI/UX Design**: Specify user interface patterns and responsive design approach
- **Testing Strategy**: Outline unit, integration, and manual testing approaches

#### 3. Implementation Phase

- **Incremental Development**: Build features step-by-step with regular updates
- **Component-First Approach**: Develop reusable components following established patterns
- **Integration Testing**: Test integration with existing systems at each step
- **Documentation Updates**: Update feature documentation after each implementation step

#### 4. Quality Assurance Phase

- **Code Review**: Follow established coding standards and patterns
- **Testing**: Execute comprehensive testing strategy
- **Performance**: Ensure feature meets performance requirements
- **Accessibility**: Verify ARIA compliance and keyboard navigation

#### 5. Deployment Phase

- **Documentation**: Update user-facing documentation
- **Monitoring**: Set up monitoring and analytics for the new feature
- **Feedback Loop**: Establish process for user feedback and iteration

#### Example Implementation: Message Pages Feature

- **Location**: `/doc/features/message-pages-implementation.md`
- **Pattern**: Analysis → Documentation → Incremental Implementation → Updates
- **Components**: SermonList, SermonCard, SermonDetail, MediaPlayer, etc.
- **Integration**: Uses existing sermon API and Flowbite UI components

### Component Development Guidelines

#### Reusable Component Standards

- **Flowbite Integration**: Use Flowbite components as primary choice
- **TypeScript**: Full type safety with proper interfaces
- **Internationalization**: Support both English and Chinese languages
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: ARIA labels and keyboard navigation support

#### State Management

- **Server State**: Use SWR for API data fetching and caching
- **Local State**: React useState for UI state management
- **Global State**: Context API for shared state across components
- **URL State**: Next.js router for shareable URLs

#### Performance Considerations

- **Code Splitting**: Lazy load components and routes
- **Image Optimization**: Use Next.js Image component
- **Bundle Analysis**: Monitor bundle size and tree shaking
- **Caching**: Implement appropriate caching strategies

---

## Conclusion

This specification document provides a comprehensive overview of the SCCNY website project, covering its architecture, technical decisions, features, and implementation details. The project represents a modern, scalable web application built with best practices in mind, featuring a robust sermon management system, internationalization support, and automated content synchronization.

The architecture is designed to be maintainable, performant, and extensible, with clear separation of concerns and adherence to modern web development standards. The project is well-positioned for future enhancements and scaling as the church's needs evolve.
