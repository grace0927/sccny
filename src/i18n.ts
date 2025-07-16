import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {locales} from './config';
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as typeof locales[number])) notFound();
 
  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'America/New_York'
  };
});
