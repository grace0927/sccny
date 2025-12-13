declare module '@heroicons/react/24/outline' {
  import * as React from 'react';
  type IconComponent = React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string, titleId?: string } & React.RefAttributes<SVGSVGElement>>;
  
  export const MagnifyingGlassIcon: IconComponent;
  export const BookOpenIcon: IconComponent;
}
