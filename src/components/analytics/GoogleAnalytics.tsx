import Script from 'next/script'

const measurementId = 'G-2H44Z5Z7S3'

export default function GoogleAnalytics() {
  return <>
    <Script id="site-ga-init">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_location: window.location.href,
        page_referrer: document.referrer,
        page_title: document.title
      });
    `}</Script>
    <Script id="site-ga" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="lazyOnload" />
  </>
}
