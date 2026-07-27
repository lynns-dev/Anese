import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/images/anese-favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/images/anese-favicon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/images/anese-favicon-192.png" />
        {/* Without this, a phone/browser set to dark mode auto-styles
            native, unstyled form controls (the checkout state <select>,
            checkboxes) with dark backgrounds and light text — independent
            of the page's own explicitly light-themed CSS — since nothing
            here otherwise tells the browser this page only supports a
            light color scheme. */}
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Figtree:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          *{margin:0;padding:0;box-sizing:border-box}
          html{scroll-behavior:smooth;color-scheme:light}
          body{background:#F4EDE3;color:#2E2620;font-family:'Figtree',sans-serif;font-weight:400;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
          a{color:inherit;text-decoration:none}
          img{display:block;max-width:100%}
          ::selection{background:#2E2620;color:#F4EDE3}
        `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
