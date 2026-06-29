'use client';

import React, { useEffect, useState, useCallback } from 'react';

export type HeaderProps = {
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

export const uniqueId = "header_a";

type HeaderApiData = {
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

export default function HeaderA(props: HeaderProps) {
  const { projectId, style, __studio, __nodeId } = props;
  const [headerData, setHeaderData] = useState<HeaderApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const fetchHeaderData = React.useCallback(() => {
    if (!projectId) {
      console.warn('[Header] No projectId provided');
      setLoading(false);
      return;
    }

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
      ? `/header/active/${projectId}` 
      : `/admin/v1/header/active/${projectId}`;

    fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => {
        if (!r.ok) {
          console.error('[Header] Response not OK:', r.status, r.statusText);
          return null;
        }
        return r.json();
      })
      .then((data: any) => {
        if (data?.success && data?.data) {
          
          // Recursively normalize menu items with order and children
          const normalizeMenuItems = (items: any[], defaultOrder: number = 0): any[] => {
            if (!items || !Array.isArray(items)) {
              return [];
            }
            
            const normalized = items.map((item: any, index: number) => {
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
            
            return normalized;
          };
          
          const normalizedMenu = normalizeMenuItems(data.data.menu || []);
          
          const finalData = {
            ...data.data,
            menu: normalizedMenu,
          };
          
          setHeaderData(finalData);
        } else {
          console.warn('[Header] No header data found in response:', data);
          setHeaderData(null);
        }
      })
      .catch((error) => {
        console.error('[Header] Error fetching header data:', error);
        setHeaderData(null);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    // Fetch data only once on mount
    fetchHeaderData();
    
    // Listen for header updates from other components (only when explicitly triggered)
    const handleHeaderUpdate = () => {
      fetchHeaderData();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('headerFooterUpdated', handleHeaderUpdate);
      
      return () => {
        window.removeEventListener('headerFooterUpdated', handleHeaderUpdate);
      };
    }
  }, [fetchHeaderData]);

  // Check if mobile view
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use menu from headerData if available, otherwise empty array (don't use defaultProps.menu)
  const resolvedData = {
    logo: headerData?.logo || defaultProps.logo,
    menu: headerData?.menu && Array.isArray(headerData.menu) && headerData.menu.length > 0 
      ? headerData.menu 
      : [],
    contactDetails: headerData?.contactDetails || defaultProps.contactDetails,
    style: headerData?.style || {},
    settings: headerData?.settings || {},
  };

  const mobileMenuEnabled = resolvedData.settings?.mobileMenuEnabled !== false;
  
  // Debug logging disabled for performance
  // console.log('[Header] ===== RESOLVED DATA =====');
  // console.log('[Header] headerData exists:', !!headerData);
  // console.log('[Header] headerData.menu:', headerData?.menu);
  // console.log('[Header] headerData.menu is array:', Array.isArray(headerData?.menu));
  // console.log('[Header] headerData.menu length:', headerData?.menu?.length || 0);
  // console.log('[Header] resolvedData.menu:', resolvedData.menu);
  // console.log('[Header] resolvedData.menu length:', resolvedData.menu?.length || 0);
  // console.log('[Header] Loading state:', loading);
  // 
  // console.log('[Header] Resolved data menu:', resolvedData.menu);
  // console.log('[Header] Menu length:', resolvedData.menu?.length);

  // Check if transparent mode is enabled
  const isTransparent = resolvedData.settings?.transparent === true;
  
  // Build header style - ensure transparent mode overrides everything
  const baseStyle: React.CSSProperties = {
    padding: resolvedData.style?.padding || '16px 0',
    position: resolvedData.settings?.sticky ? 'sticky' : 'relative',
    top: resolvedData.settings?.sticky ? 0 : undefined,
    zIndex: resolvedData.settings?.sticky ? 1000 : undefined,
  };

  // Apply transparent or normal background
  if (isTransparent) {
    baseStyle.backgroundColor = 'transparent';
    baseStyle.background = 'rgba(255, 255, 255, 0.05)';
    baseStyle.backdropFilter = 'blur(10px) saturate(180%)';
    baseStyle.WebkitBackdropFilter = 'blur(10px) saturate(180%)';
    baseStyle.borderBottom = 'none';
    baseStyle.color = resolvedData.style?.color || '#ffffff';
  } else {
    baseStyle.backgroundColor = resolvedData.style?.backgroundColor || '#ffffff';
    baseStyle.color = resolvedData.style?.color || '#000000';
    baseStyle.borderBottom = resolvedData.style?.borderBottom || '1px solid #e5e7eb';
  }

  // Merge with style prop, but transparent mode takes priority
  const headerStyle: React.CSSProperties = {
    ...style,
    ...baseStyle,
    // Force transparent background if transparent mode is enabled
    ...(isTransparent ? { 
      backgroundColor: 'transparent',
      background: 'rgba(255, 255, 255, 0.05)',
    } : {}),
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

    if (level === 0) {
      // Main menu items - horizontal layout with dropdown support
      // Use a component with state for dropdowns
      const MenuItemWithDropdown = ({ item }: { item: any }) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
        const sortedChildren = hasChildren 
          ? [...item.children].sort((a: any, b: any) => {
              const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
              const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
              const result = orderA - orderB;
              return result;
            })
          : [];

        return (
          <div 
            key={item.id} 
            style={{ position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => {
              if (hasChildren) {
                setIsOpen(true);
              }
            }}
            onMouseLeave={() => {
              // Small delay to allow moving to dropdown
              setTimeout(() => setIsOpen(false), 100);
            }}
          >
            <a
              href={item.url || '#'}
              target={item.target || '_self'}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                ...item.style,
              }}
            >
              {item.icon && <i className={item.icon} style={{ marginRight: '4px' }} />}
              {item.name}
              {hasChildren && <i className="fas fa-chevron-down" style={{ marginLeft: '4px', fontSize: '10px' }} />}
            </a>
            {hasChildren && isOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: resolvedData.style?.backgroundColor || '#ffffff',
                  minWidth: '200px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '4px',
                  padding: '8px 0',
                  marginTop: '4px',
                  zIndex: 1000,
                }}
                onMouseEnter={() => {
                  setIsOpen(true);
                }}
                onMouseLeave={() => {
                  setIsOpen(false);
                }}
              >
                {renderMenuItems(sortedChildren, level + 1)}
              </div>
            )}
          </div>
        );
      };

      return (
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
          {sortedMenu.map((item) => (
            <MenuItemWithDropdown key={item.id} item={item} />
          ))}
        </nav>
      );
    } else {
      // Nested menu items - vertical layout
      return (
        <>
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
              <div key={item.id} style={{ position: 'relative' }}>
                <a
                  href={item.url || '#'}
                  target={item.target || '_self'}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                    padding: '8px 16px',
                    paddingLeft: `${16 + (level * 16)}px`,
                    transition: 'background-color 0.2s',
                    ...item.style,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {item.icon && <i className={item.icon} style={{ marginRight: '8px' }} />}
                  {item.name}
                  {hasChildren && <i className="fas fa-chevron-right" style={{ marginLeft: '8px', fontSize: '10px', float: 'right' }} />}
                </a>
                {hasChildren && (
                  <div style={{ marginLeft: '16px' }}>
                    {renderMenuItems(sortedChildren, level + 1)}
                  </div>
                )}
              </div>
            );
          })}
        </>
      );
    }
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
        <a
          key={`phone-${idx}`}
          href={`tel:${tel}`}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            ...phone?.style,
          }}
        >
          <i className="fas fa-phone" />
          {idx === 0 && phone?.label ? phone.label : number}
        </a>
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
        <a
          key={`email-${idx}`}
          href={`mailto:${addr}`}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            ...email?.style,
          }}
        >
          <i className="fas fa-envelope" />
          {idx === 0 && email?.label ? email.label : addr}
        </a>
      );
    });

    if (address?.enabled && address?.text) {
      contactItems.push(
        <div
          key="address"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            ...address.style,
          }}
        >
          <i className="fas fa-map-marker-alt" />
          {address.label || address.text}
        </div>
      );
    }

    if (contactItems.length === 0) return null;

    return (
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        {contactItems}
      </div>
    );
  };

  if (loading) {
    return (
      <header
        style={headerStyle}
        data-el-id="header"
        onClick={(e) => {
          if (e.target === e.currentTarget && __nodeId && __studio?.selectElement) {
            __studio.selectElement(__nodeId, 'header', 'header');
          }
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      style={headerStyle}
      data-el-id="header"
      onClick={(e) => {
        if (e.target === e.currentTarget && __nodeId && __studio?.selectElement) {
          __studio.selectElement(__nodeId, 'header', 'header');
        }
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {resolvedData.logo?.url ? (
              <img
                src={resolvedData.logo.url}
                alt={resolvedData.logo.alt || 'Logo'}
                width={resolvedData.logo.width || 150}
                height={resolvedData.logo.height || 50}
                style={{
                  maxHeight: '60px',
                  objectFit: 'contain',
                  ...resolvedData.logo.style,
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'inherit',
                }}
              >
                Logo
              </div>
            )}
          </div>

          {/* Desktop Menu or Mobile Menu (when hamburger is disabled) */}
          {(!isMobile || !mobileMenuEnabled) && (
            <>
              {resolvedData.menu && resolvedData.menu.length > 0 ? (
                renderMenuItems(resolvedData.menu)
              ) : loading ? (
                <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <span>Loading menu...</span>
                </nav>
              ) : (
                <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <span style={{ color: '#999', fontSize: '14px' }}>No menu items</span>
                </nav>
              )}

              {/* Contact Details */}
              {renderContactDetails()}
            </>
          )}

          {/* Mobile Hamburger Menu Button (only when hamburger is enabled) */}
          {isMobile && mobileMenuEnabled && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Toggle mobile menu"
            >
              <div
                style={{
                  width: '24px',
                  height: '2px',
                  backgroundColor: resolvedData.style?.color || '#000000',
                  transition: 'all 0.3s',
                  transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
                }}
              />
              <div
                style={{
                  width: '24px',
                  height: '2px',
                  backgroundColor: resolvedData.style?.color || '#000000',
                  transition: 'all 0.3s',
                  opacity: isMobileMenuOpen ? 0 : 1,
                }}
              />
              <div
                style={{
                  width: '24px',
                  height: '2px',
                  backgroundColor: resolvedData.style?.color || '#000000',
                  transition: 'all 0.3s',
                  transform: isMobileMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none',
                }}
              />
            </button>
          )}

          {/* Mobile Contact Details (when hamburger menu is open) */}
          {isMobile && mobileMenuEnabled && !isMobileMenuOpen && renderContactDetails()}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobile && mobileMenuEnabled && isMobileMenuOpen && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            {resolvedData.menu && resolvedData.menu.length > 0 ? (
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {renderMenuItems(resolvedData.menu)}
              </nav>
            ) : (
              <div style={{ color: '#999', fontSize: '14px', padding: '8px 0' }}>
                No menu items
              </div>
            )}
            <style>{`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        )}
      </div>
      {props.children}
    </header>
  );
}

