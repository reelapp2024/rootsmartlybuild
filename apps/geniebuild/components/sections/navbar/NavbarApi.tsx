
import React, { useState, useEffect } from 'react';
import { Section } from '../../../types';

interface NavbarApiProps {
  section: Section;
  readOnly?: boolean;
}

export const NavbarApi: React.FC<NavbarApiProps> = ({ section, readOnly = true }) => {
  const [headerData, setHeaderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      ? `/header/active/${projectId}` 
      : `/admin/v1/header/active/${projectId}`;

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
          setHeaderData({
            ...data.data,
            menu: normalizeMenuItems(data.data.menu || []),
          });
        }
      })
      .catch((error) => {
        console.error('[NavbarApi] Error fetching header data:', error);
      })
      .finally(() => setLoading(false));
  }, [projectId, readOnly]);

  const resolvedData = {
    logo: headerData?.logo || section.content.logoImageUrl ? { url: section.content.logoImageUrl } : null,
    menu: headerData?.menu && Array.isArray(headerData.menu) && headerData.menu.length > 0 
      ? headerData.menu 
      : section.content.links || [],
    contactDetails: headerData?.contactDetails || {},
    style: headerData?.style || {},
    settings: headerData?.settings || {},
  };

  const isTransparent = resolvedData.settings?.transparent === true;
  const isSticky = resolvedData.settings?.sticky === true;

  const baseStyle: React.CSSProperties = {
    padding: resolvedData.style?.padding || '16px 0',
    position: isSticky ? 'sticky' : 'relative',
    top: isSticky ? 0 : undefined,
    zIndex: isSticky ? 1000 : undefined,
    backgroundColor: isTransparent ? 'transparent' : (section.styles.backgroundColor || '#ffffff'),
    color: section.styles.textColor || (isTransparent ? '#ffffff' : '#000000'),
    borderBottom: isTransparent ? 'none' : (resolvedData.style?.borderBottom || '1px solid #e5e7eb'),
  };

  if (isTransparent) {
    baseStyle.background = 'rgba(255, 255, 255, 0.05)';
    baseStyle.backdropFilter = 'blur(10px) saturate(180%)';
  }

  const renderMenuItems = (menuItems: any[], level: number = 0) => {
    if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) return null;

    const sortedMenu = [...menuItems].sort((a, b) => {
      const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
      const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
      return orderA - orderB;
    });

    if (level === 0) {
      const MenuItemWithDropdown = ({ item }: { item: any }) => {
        const [isOpen, setIsOpen] = useState(false);
        const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
        const sortedChildren = hasChildren 
          ? [...item.children].sort((a: any, b: any) => {
              const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999;
              const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999;
              return orderA - orderB;
            })
          : [];

        return (
          <div 
            key={item.id} 
            className="relative inline-block"
            onMouseEnter={() => hasChildren && setIsOpen(true)}
            onMouseLeave={() => setTimeout(() => setIsOpen(false), 100)}
          >
            <a
              href={item.url || '#'}
              target={item.target || '_self'}
              className="flex items-center gap-1 px-3 py-2 rounded transition-colors hover:bg-black/5"
              style={{ color: 'inherit', textDecoration: 'none', ...item.style }}
            >
              {item.icon && <i className={item.icon} />}
              {item.name}
              {hasChildren && <i className="fas fa-chevron-down text-xs ml-1" />}
            </a>
            {hasChildren && isOpen && (
              <div
                className="absolute top-full left-0 bg-white dark:bg-gray-800 min-w-[200px] shadow-lg rounded p-2 mt-1 z-1000"
                style={{ backgroundColor: section.styles.backgroundColor || '#ffffff' }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
              >
                {renderMenuItems(sortedChildren, level + 1)}
              </div>
            )}
          </div>
        );
      };

      return (
        <nav className="flex gap-6 items-center flex-wrap relative">
          {sortedMenu.map((item) => (
            <MenuItemWithDropdown key={item.id} item={item} />
          ))}
        </nav>
      );
    } else {
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
              <div key={item.id} className="relative">
                <a
                  href={item.url || '#'}
                  target={item.target || '_self'}
                  className="block px-4 py-2 transition-colors hover:bg-black/5 rounded"
                  style={{ 
                    color: 'inherit', 
                    textDecoration: 'none',
                    paddingLeft: `${16 + (level * 16)}px`,
                    ...item.style 
                  }}
                >
                  {item.icon && <i className={item.icon} style={{ marginRight: '8px' }} />}
                  {item.name}
                  {hasChildren && <i className="fas fa-chevron-right text-xs ml-2 float-right" />}
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
    const { phone, email, address } = resolvedData.contactDetails;
    const contactItems = [];

    if (phone?.enabled && phone?.number) {
      contactItems.push(
        <a
          key="phone"
          href={`tel:${phone.number}`}
          className="flex items-center gap-2"
          style={{ color: 'inherit', textDecoration: 'none', ...phone.style }}
        >
          <i className="fas fa-phone" />
          {phone.label || phone.number}
        </a>
      );
    }

    if (email?.enabled && email?.address) {
      contactItems.push(
        <a
          key="email"
          href={`mailto:${email.address}`}
          className="flex items-center gap-2"
          style={{ color: 'inherit', textDecoration: 'none', ...email.style }}
        >
          <i className="fas fa-envelope" />
          {email.label || email.address}
        </a>
      );
    }

    if (address?.enabled && address?.text) {
      contactItems.push(
        <div
          key="address"
          className="flex items-center gap-2"
          style={address.style}
        >
          <i className="fas fa-map-marker-alt" />
          {address.label || address.text}
        </div>
      );
    }

    if (contactItems.length === 0) return null;

    return <div className="flex gap-4 items-center flex-wrap">{contactItems}</div>;
  };

  if (loading) {
    return (
      <nav className="relative z-50" style={baseStyle}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div>Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="relative z-50" style={baseStyle}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20 gap-6 flex-wrap">
        {/* Logo */}
        <div className="shrink-0">
          {resolvedData.logo?.url ? (
            <img
              src={resolvedData.logo.url}
              alt={resolvedData.logo.alt || 'Logo'}
              className="h-8 md:h-10 w-auto object-contain"
              style={{ maxHeight: '60px', ...resolvedData.logo.style }}
            />
          ) : (
            <div className="font-bold text-xl md:text-2xl" style={{ color: section.styles.titleColor || 'inherit' }}>
              {section.content.logo || 'Logo'}
            </div>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {resolvedData.menu && resolvedData.menu.length > 0 ? (
            renderMenuItems(resolvedData.menu)
          ) : null}
          {renderContactDetails()}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20">
          <div className="flex flex-col items-center gap-8 px-6">
            {resolvedData.menu && resolvedData.menu.length > 0 ? (
              <nav className="flex flex-col gap-4 w-full">
                {renderMenuItems(resolvedData.menu)}
              </nav>
            ) : null}
            {renderContactDetails()}
          </div>
        </div>
      )}
    </nav>
  );
};
