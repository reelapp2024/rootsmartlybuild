
import React, { useState, useEffect } from 'react';
import { Section } from '../../../types';

interface FooterApiProps {
  section: Section;
  readOnly?: boolean;
}

export const FooterApi: React.FC<FooterApiProps> = ({ section, readOnly = true }) => {
  const [footerData, setFooterData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Get projectId from section content, window global, or environment
  const projectId = section.content.projectId 
    || (typeof window !== 'undefined' ? (window as any).__PROJECT_ID__ : null) 
    || (typeof window !== 'undefined' && (window as any).process?.env?.NEXT_PUBLIC_PROJECT_ID)
    || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PROJECT_ID : null);

  useEffect(() => {
    if (!projectId || !readOnly) return; // Only fetch in read-only mode

    setLoading(true);
    let apiUrl = 'http://localhost:1111';

    // Get API URL from environment
    if (typeof window !== 'undefined') {
      if ((window as any).__API_URL__) {
        apiUrl = (window as any).__API_URL__;
      } else if (process.env.NEXT_PUBLIC_API_URL) {
        apiUrl = process.env.NEXT_PUBLIC_API_URL;
      }
    }

    apiUrl = apiUrl.replace(/\/$/, '').replace(/\/admin\/v1\/?$/, '');
    const endpoint = apiUrl.includes('/admin/v1') 
      ? `/footer/active/${projectId}` 
      : `/admin/v1/footer/active/${projectId}`;

    fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: any) => {
        if (data?.success && data?.data) {
          const normalizeMenuItems = (items: any[], defaultOrder: number = 0): any[] => {
            if (!items || !Array.isArray(items)) return [];
            return items.map((item: any, index: number) => ({
              ...item,
              id: item.id || `menu-item-${index}`,
              name: item.name || '',
              url: item.url || '#',
              order: item.order !== undefined && item.order !== null ? Number(item.order) : defaultOrder + index,
              children: item.children && Array.isArray(item.children) && item.children.length > 0
                ? normalizeMenuItems(item.children, (defaultOrder + index) * 100)
                : [],
            }));
          };
          setFooterData({
            ...data.data,
            menu: normalizeMenuItems(data.data.menu || []),
          });
        }
      })
      .catch((error) => {
        console.error('[FooterApi] Error fetching footer data:', error);
      })
      .finally(() => setLoading(false));
  }, [projectId, readOnly]);

  const resolvedData = {
    logo: footerData?.logo || section.content.logoImageUrl ? { url: section.content.logoImageUrl } : null,
    menu: footerData?.menu && Array.isArray(footerData.menu) && footerData.menu.length > 0 
      ? footerData.menu 
      : section.content.links || [],
    contactDetails: footerData?.contactDetails || {},
    style: footerData?.style || {},
  };

  const footerStyle: React.CSSProperties = {
    backgroundColor: section.styles.backgroundColor || '#1f2937',
    color: section.styles.textColor || '#ffffff',
    padding: resolvedData.style?.padding || '48px 0',
    borderTop: resolvedData.style?.borderTop || '1px solid #374151',
  };

  const renderMenuItems = (menuItems: any[], level: number = 0) => {
    if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) return null;

    const sortedMenu = [...menuItems].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
      return orderA - orderB;
    });

    return (
      <nav className="flex flex-col gap-3">
        {sortedMenu.map((item) => {
          const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
          const sortedChildren = hasChildren 
            ? [...item.children].sort((a: any, b: any) => {
                const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
                const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
                return orderA - orderB;
              })
            : [];

          return (
            <div key={item.id} style={{ marginLeft: level > 0 ? `${level * 16}px` : '0' }}>
              <a
                href={item.url || '#'}
                target={item.target || '_self'}
                className="opacity-60 hover:opacity-100 transition-opacity"
                style={{ 
                  color: 'inherit', 
                  textDecoration: 'none',
                  display: 'block',
                  padding: level === 0 ? '4px 0' : '2px 0',
                  fontSize: level > 0 ? '14px' : '16px',
                  ...item.style 
                }}
              >
                {item.icon && <i className={item.icon} style={{ marginRight: '8px' }} />}
                {item.name}
              </a>
              {hasChildren && (
                <div style={{ marginTop: '8px', marginLeft: '16px' }}>
                  {renderMenuItems(sortedChildren, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

  const renderContactDetails = () => {
    const { phone, email, address } = resolvedData.contactDetails;
    const contactItems = [];

    if (phone?.enabled && phone?.number) {
      contactItems.push(
        <div
          key="phone"
          className="flex items-center gap-2 mb-3"
          style={phone.style}
        >
          <i className="fas fa-phone" />
          <a href={`tel:${phone.number}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {phone.label || phone.number}
          </a>
        </div>
      );
    }

    if (email?.enabled && email?.address) {
      contactItems.push(
        <div
          key="email"
          className="flex items-center gap-2 mb-3"
          style={email.style}
        >
          <i className="fas fa-envelope" />
          <a href={`mailto:${email.address}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {email.label || email.address}
          </a>
        </div>
      );
    }

    if (address?.enabled && address?.text) {
      contactItems.push(
        <div
          key="address"
          className="flex items-start gap-2 mb-3"
          style={address.style}
        >
          <i className="fas fa-map-marker-alt mt-1" />
          <span>{address.label || address.text}</span>
        </div>
      );
    }

    if (contactItems.length === 0) return null;

    return <div className="flex flex-col">{contactItems}</div>;
  };

  if (loading) {
    return (
      <footer style={footerStyle}>
        <div className="max-w-7xl mx-auto px-6">
          <div>Loading...</div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={footerStyle}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
          {/* Logo Section */}
          <div className="md:col-span-2 space-y-4 flex flex-col items-center md:items-start">
            {resolvedData.logo?.url ? (
              <img
                src={resolvedData.logo.url}
                alt={resolvedData.logo.alt || 'Logo'}
                className="h-10 w-auto object-contain mb-4"
                style={{ maxHeight: '60px', ...resolvedData.logo.style }}
              />
            ) : (
              <h3 className="text-2xl font-bold mb-4" style={{ color: section.styles.titleColor || 'inherit' }}>
                {section.content.brand || section.content.title || 'Logo'}
              </h3>
            )}
            {section.content.description && (
              <p className="opacity-60 max-w-sm leading-relaxed text-center md:text-left">
                {section.content.description}
              </p>
            )}
          </div>

          {/* Menu Section */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-wider opacity-80">Quick Links</h4>
            {resolvedData.menu && resolvedData.menu.length > 0 ? (
              renderMenuItems(resolvedData.menu)
            ) : null}
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-wider opacity-80">Contact Us</h4>
            {renderContactDetails()}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6 text-center text-sm opacity-80">
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
