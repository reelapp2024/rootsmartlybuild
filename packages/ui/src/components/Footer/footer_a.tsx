'use client';

import React, { useEffect, useState, useCallback } from 'react';

export type FooterProps = {
  projectId?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  __studio?: {
    selectedEl?: { nodeId: string; elId: string } | null;
    selectElement?: (nodeId: string, elId: string, type: string) => void;
    getElementStyle?: (elId: string) => React.CSSProperties;
    getElementProps?: (elId: string) => any;
  };
  __nodeId?: string;
};

export const defaultProps = {
  logo: { url: '', alt: 'Logo' },
  menu: [],
  contactDetails: {},
};

export const template = { ...defaultProps };

export const uniqueId = "footer_a";

type FooterApiData = {
  logo?: {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
    style?: any;
  };
  menu?: Array<{
    id: string;
    name: string;
    url: string;
    icon?: string;
    target?: string;
    order?: number;
    style?: any;
    children?: Array<any>;
  }>;
  contactDetails?: {
    phone?: {
      enabled?: boolean;
      number?: string;
      label?: string;
      style?: any;
    };
    email?: {
      enabled?: boolean;
      address?: string;
      label?: string;
      style?: any;
    };
    address?: {
      enabled?: boolean;
      text?: string;
      label?: string;
      style?: any;
    };
  };
  style?: any;
  settings?: {
    sticky?: boolean;
    transparent?: boolean;
    showOnMobile?: boolean;
    showOnTablet?: boolean;
    showOnDesktop?: boolean;
  };
};

export default function FooterA(props: FooterProps) {
  const { projectId, style, __studio, __nodeId } = props;
  const [footerData, setFooterData] = useState<FooterApiData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFooterData = React.useCallback(() => {
    if (!projectId) return;

    setLoading(true);
    let apiUrl = 'http://localhost:1111';

    // Try to get API URL from various sources
    if (typeof window !== 'undefined') {
      if ((window as any).__API_URL__) {
        apiUrl = (window as any).__API_URL__;
      } else if ((window as any).__ENV__?.VITE_API_URL) {
        apiUrl = (window as any).__ENV__.VITE_API_URL;
      } else if (typeof (window as any).process !== 'undefined' && (window as any).process.env?.NEXT_PUBLIC_API_URL) {
        apiUrl = (window as any).process.env.NEXT_PUBLIC_API_URL;
      }
    }

    // Remove trailing slash
    apiUrl = apiUrl.replace(/\/$/, '');
    // Remove /admin/v1 if it exists in the base URL
    apiUrl = apiUrl.replace(/\/admin\/v1\/?$/, '');

    // Check if base URL already includes /admin/v1
    const hasAdminV1 = apiUrl.includes('/admin/v1');
    const endpoint = hasAdminV1 
      ? `/footer/active/${projectId}` 
      : `/admin/v1/footer/active/${projectId}`;

    fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.success && data?.data) {
          
          // Recursively normalize menu items with order and children
          const normalizeMenuItems = (items: any[], defaultOrder: number = 0): any[] => {
            if (!items || !Array.isArray(items)) return [];
            
            return items.map((item: any, index: number) => {
              const normalizedItem = {
                ...item,
                id: item.id || `menu-item-${index}`,
                name: item.name || '',
                url: item.url || '#',
                order: item.order !== undefined && item.order !== null ? Number(item.order) : defaultOrder + index,
                children: item.children && Array.isArray(item.children) && item.children.length > 0
                  ? normalizeMenuItems(item.children, (defaultOrder + index) * 100)
                  : [],
              };
              
              return normalizedItem;
            });
          };
          
          const normalizedMenu = normalizeMenuItems(data.data.menu || []);
          
          setFooterData({
            ...data.data,
            menu: normalizedMenu,
          });
        } else {
          console.warn('[Footer] No footer data found');
          setFooterData(null);
        }
      })
      .catch((error) => {
        console.error('[Footer] Error fetching footer data:', error);
        setFooterData(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    // Fetch data only once on mount
    fetchFooterData();
    
    // Listen for footer updates from other components (only when explicitly triggered)
    const handleFooterUpdate = () => {
      fetchFooterData();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('headerFooterUpdated', handleFooterUpdate);
      
      return () => {
        window.removeEventListener('headerFooterUpdated', handleFooterUpdate);
      };
    }
  }, [fetchFooterData]);

  // Use menu from footerData if available, otherwise empty array (don't use defaultProps.menu)
  const resolvedData = {
    logo: footerData?.logo || defaultProps.logo,
    menu: footerData?.menu && Array.isArray(footerData.menu) && footerData.menu.length > 0 
      ? footerData.menu 
      : [],
    contactDetails: footerData?.contactDetails || defaultProps.contactDetails,
    style: footerData?.style || {},
    settings: footerData?.settings || {},
  };
  

  const footerStyle: React.CSSProperties = {
    backgroundColor: resolvedData.style?.backgroundColor || '#1f2937',
    color: resolvedData.style?.color || '#ffffff',
    padding: resolvedData.style?.padding || '48px 0',
    borderTop: resolvedData.style?.borderTop || '1px solid #374151',
    ...style,
  };

  const renderMenuItems = (menuItems: typeof resolvedData.menu, level: number = 0) => {
    if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
      // Don't show fallback menu - return null if no menu items
      return null;
    }

    // Sort by order (ensure numeric comparison)
    const sortedMenu = [...menuItems].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
      const result = orderA - orderB;
      return result;
    });

    return (
      <nav style={{ display: 'flex', flexDirection: 'column', gap: level === 0 ? '12px' : '8px' }}>
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
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  padding: level === 0 ? '4px 0' : '2px 0',
                  fontSize: level > 0 ? '14px' : '16px',
                  opacity: level > 0 ? 0.9 : 1,
                  ...item.style,
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
    const { phone, email, address } = resolvedData.contactDetails as any;
    const contactItems: React.ReactNode[] = [];

    const phoneRows =
      phone?.enabled && Array.isArray(phone?.items) && phone.items.length
        ? phone.items
        : phone?.enabled && phone?.number
          ? [{ value: phone.number }]
          : [];

    phoneRows.forEach((row: { value?: string }, idx: number) => {
      const number = row?.value || '';
      if (!number) return;
      const tel = number.replace(/[^\d+]/g, '');
      contactItems.push(
        <div
          key={`phone-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            ...phone?.style,
          }}
        >
          <i className="fas fa-phone" />
          <a href={`tel:${tel}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {idx === 0 && phone?.label ? phone.label : number}
          </a>
        </div>
      );
    });

    const emailRows =
      email?.enabled && Array.isArray(email?.items) && email.items.length
        ? email.items
        : email?.enabled && email?.address
          ? [{ value: email.address }]
          : [];

    emailRows.forEach((row: { value?: string }, idx: number) => {
      const addr = row?.value || '';
      if (!addr) return;
      contactItems.push(
        <div
          key={`email-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            ...email?.style,
          }}
        >
          <i className="fas fa-envelope" />
          <a href={`mailto:${addr}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {idx === 0 && email?.label ? email.label : addr}
          </a>
        </div>
      );
    });

    if (address?.enabled && address?.text) {
      contactItems.push(
        <div
          key="address"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '12px',
            ...address.style,
          }}
        >
          <i className="fas fa-map-marker-alt" style={{ marginTop: '4px' }} />
          <span>{address.label || address.text}</span>
        </div>
      );
    }

    if (contactItems.length === 0) return null;

    return <div style={{ display: 'flex', flexDirection: 'column' }}>{contactItems}</div>;
  };

  if (loading) {
    return (
      <footer
        style={footerStyle}
        data-el-id="footer"
        onClick={(e) => {
          if (e.target === e.currentTarget && __nodeId && __studio?.selectElement) {
            __studio.selectElement(__nodeId, 'footer', 'footer');
          }
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div>Loading...</div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      style={footerStyle}
      data-el-id="footer"
      onClick={(e) => {
        if (e.target === e.currentTarget && __nodeId && __studio?.selectElement) {
          __studio.selectElement(__nodeId, 'footer', 'footer');
        }
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            marginBottom: '32px',
          }}
        >
          {/* Logo Section */}
          <div>
            {resolvedData.logo?.url ? (
              <img
                src={resolvedData.logo.url}
                alt={resolvedData.logo.alt || 'Logo'}
                width={resolvedData.logo.width || 150}
                height={resolvedData.logo.height || 50}
                style={{
                  maxHeight: '60px',
                  objectFit: 'contain',
                  marginBottom: '16px',
                  ...resolvedData.logo.style,
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'inherit',
                  marginBottom: '16px',
                }}
              >
                Logo
              </div>
            )}
          </div>

          {/* Menu Section */}
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Quick Links</h3>
            {resolvedData.menu && resolvedData.menu.length > 0 ? (
              renderMenuItems(resolvedData.menu)
            ) : loading ? (
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span>Loading menu...</span>
              </nav>
            ) : (
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ color: '#999', fontSize: '14px' }}>No menu items</span>
              </nav>
            )}
          </div>

          {/* Contact Section */}
          <div>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Contact Us</h3>
            {renderContactDetails()}
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            opacity: 0.8,
          }}
        >
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
      {props.children}
    </footer>
  );
}

