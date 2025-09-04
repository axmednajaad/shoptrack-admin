import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import DatabaseSetupCheck from '@/components/setup/DatabaseSetupCheck';

const outfit = Outfit({
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent common browser extension attributes from causing hydration issues
              (function() {
                try {
                  // List of common browser extension attributes that cause hydration issues
                  var extensionAttributes = [
                    'data-new-gr-c-s-check-loaded',
                    'data-gr-ext-installed',
                    'data-new-gr-c-s-loaded',
                    'data-gramm',
                    'data-gramm_editor',
                    'data-wrs_editor',
                    'spellcheck'
                  ];

                  // Function to clean extension attributes
                  function cleanExtensionAttributes() {
                    var body = document.body;
                    if (body) {
                      extensionAttributes.forEach(function(attr) {
                        if (body.hasAttribute(attr)) {
                          body.removeAttribute(attr);
                        }
                      });
                    }
                  }

                  // Clean attributes immediately
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', cleanExtensionAttributes);
                  } else {
                    cleanExtensionAttributes();
                  }

                  // Also clean after a short delay to catch late-loading extensions
                  setTimeout(cleanExtensionAttributes, 100);
                  setTimeout(cleanExtensionAttributes, 500);
                } catch (e) {
                  // Silently fail if anything goes wrong
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${outfit.className}`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <DatabaseSetupCheck>
            <AuthProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </AuthProvider>
          </DatabaseSetupCheck>
        </ThemeProvider>
      </body>
    </html>
  );
}
