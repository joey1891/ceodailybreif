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
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-primary/10 text-primary",
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
  return (
    <NavigationMenu className="flex justify-center py-2">
      <NavigationMenuList className="space-x-0.5">
        {Array.from(categoryOptions.values()).map((category) => {
          if (!category.items.length) {
            return (
              <NavigationMenuItem key={category.title}>
                <Link
                  href={
                    category.href ||
                    `/${category.title.toLowerCase().replace(/\s/g, "-")}`
                  }
                  className="text-sm font-medium text-primary hover:text-primary/80 px-2 py-2"
                >
                  {category.title}
                </Link>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={category.title} className="relative">
              <NavigationMenuTrigger className="text-sm font-medium text-primary hover:text-primary/80 bg-transparent hover:bg-transparent px-2">
                {category.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="absolute left-0 bg-white">
                <ul className="grid w-[400px] gap-2 p-4 grid-cols-2">
                  {category.items.map((item) => {
                    const href = `${category.base}/${item.slug}`;
                    return (
                      <ListItem key={href} href={href} title={item.title} />
                    );
                  })}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}

        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger className="text-sm font-medium text-primary hover:text-primary/80 bg-transparent hover:bg-transparent px-2">
            주요일정
          </NavigationMenuTrigger>
          <NavigationMenuContent className="absolute left-0 bg-white">
            <ul className="grid w-[400px] gap-2 p-4 grid-cols-2">
              {keyScheduleItems.map((item) => (
                <ListItem key={item.href} href={item.href} title={item.title} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
