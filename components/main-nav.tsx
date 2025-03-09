"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { categoryOptions } from "@/lib/category-options";
import { Menu, X } from "lucide-react";

const keyScheduleItems = [
  { title: "연간일정", href: "/schedule/annual" },
  { title: "월간일정", href: "/schedule/monthly" },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none rounded-md p-3 md:p-4 leading-none no-underline outline-none transition-colors hover:bg-primary/10 text-primary",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          {children && (
            <p className="line-clamp-2 text-sm leading-snug text-primary/80 mt-1">
              {children}
            </p>
          )}
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export function MainNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const renderMobileMenu = () => {
    return (
      <div
        className={`
          fixed inset-0 z-50 md:hidden
          ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          transition-opacity duration-200
        `}
      >
        <div className="absolute inset-0 bg-black/25" onClick={() => setIsMobileMenuOpen(false)} />
        
        <div className="absolute left-0 top-0 h-full w-3/4 max-w-sm bg-white p-3 space-y-5 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold">메뉴</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {Array.from(categoryOptions.values()).map((category) => (
            <div key={category.title} className="space-y-2">
              {!category.items.length ? (
                <Link
                  href={
                    category.href ||
                    `/${category.title.toLowerCase().replace(/\s/g, "-")}`
                  }
                  className="block text-base font-semibold text-primary py-3 px-1 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.title}
                </Link>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-primary">{category.title}</h3>
                  <div className="pl-3 space-y-2 border-l border-primary/20">
                    {category.items.map((item) => {
                      const href = `${category.base}/${item.slug}`;
                      return (
                        <Link
                          key={href}
                          href={href}
                          className="block py-3 px-1 text-sm font-medium text-primary/80 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
          
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-primary">주요일정</h3>
            <div className="pl-3 space-y-2 border-l border-primary/20">
              {keyScheduleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-3 px-1 text-sm font-medium text-primary/80 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="md:hidden flex justify-start p-3">
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="메뉴 열기"
        >
          <Menu className="h-6 w-6 text-primary" />
        </button>
      </div>
      
      {renderMobileMenu()}
      
      <NavigationMenu className="hidden md:flex justify-center py-2">
        <NavigationMenuList className="space-x-1">
          {Array.from(categoryOptions.values()).map((category) => {
            if (!category.items.length) {
              return (
                <NavigationMenuItem key={category.title}>
                  <Link
                    href={
                      category.href ||
                      `/${category.title.toLowerCase().replace(/\s/g, "-")}`
                    }
                    className="text-sm font-medium text-primary hover:text-primary/80 px-3 md:px-4 py-3 block transition-colors rounded-md hover:bg-gray-50"
                  >
                    {category.title}
                  </Link>
                </NavigationMenuItem>
              );
            }

            return (
              <NavigationMenuItem key={category.title} className="relative">
                <NavigationMenuTrigger className="text-sm font-medium text-primary hover:text-primary/80 bg-transparent hover:bg-gray-50 px-3 md:px-4 py-3 rounded-md select-none">
                  {category.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="relative bg-white rounded-md shadow-lg border border-gray-100">
                  <ul className="grid gap-2 p-3 md:p-4 w-auto min-w-[220px] sm:min-w-[320px] md:min-w-[400px] sm:grid-cols-2">
                    {category.items.map((item) => {
                      const href = `${category.base}/${item.slug}`;
                      return (
                        <ListItem key={href} href={href} title={item.title} className="select-none" />
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          })}

          <NavigationMenuItem className="relative">
            <NavigationMenuTrigger className="text-sm font-medium text-primary hover:text-primary/80 bg-transparent hover:bg-gray-50 px-3 md:px-4 py-3 rounded-md select-none">
              주요일정
            </NavigationMenuTrigger>
            <NavigationMenuContent className="relative bg-white rounded-md shadow-lg border border-gray-100">
              <ul className="grid gap-2 p-3 md:p-4 w-auto min-w-[220px] sm:min-w-[320px] md:min-w-[400px] sm:grid-cols-2">
                {keyScheduleItems.map((item) => (
                  <ListItem key={item.href} href={item.href} title={item.title} className="select-none" />
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
}
