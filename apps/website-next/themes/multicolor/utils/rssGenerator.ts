
interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}

export const generateRSSFeed = (): string => {
  const baseUrl = window.location.origin;
  const currentDate = new Date().toUTCString();
  
  const items: RSSItem[] = [
    {
      title: "Emergency Plumbing Services Available 24/7",
      description: "Professional emergency plumbing services with fast response time guarantee. Licensed and insured plumbers for all your urgent plumbing needs.",
      link: `${baseUrl}/`,
      pubDate: currentDate,
      guid: `${baseUrl}/emergency-plumbing-services`
    },
    {
      title: "Professional Drain Cleaning Services",
      description: "Expert drain cleaning solutions to keep your pipes flowing smoothly. Professional equipment and techniques for all drain blockages.",
      link: `${baseUrl}/services/drain-cleaning`,
      pubDate: currentDate,
      guid: `${baseUrl}/services/drain-cleaning`
    },
    {
      title: "Comprehensive Plumbing Services",
      description: "Full range of plumbing services including repairs, installations, and maintenance. Quality workmanship guaranteed.",
      link: `${baseUrl}/services`,
      pubDate: currentDate,
      guid: `${baseUrl}/services`
    }
  ];

  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Emergency Plumbing Service</title>
    <description>Professional 24/7 emergency plumbing services with fast response time guarantee</description>
    <link>${baseUrl}</link>
    <language>en-US</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <guid isPermaLink="false">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
    </item>`).join('')}
  </channel>
</rss>`;

  return rssContent;
};
