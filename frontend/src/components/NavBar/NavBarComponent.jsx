import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/NavBar/NavigationMenu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";


const NavBarComponent = ({ logo, menu, authButtons }) => {
  return (
    <section className="py-4 w-full">
      <div className="w-full px-5">
        {/* Desktop Menu */}
        <nav className="hidden w-full justify-between lg:flex px-[2vw]">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a href={logo.url} className="flex items-center justify-center">
              <img src={logo.src} className={"h-" + logo.size + " dark:invert"} alt={logo.alt} />
            </a>

            {/* Main Section */}
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => RenderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* User/Login Section */}
          {authButtons?.[0]?.items
            ? <div className="flex items-center">
                <NavigationMenu className='w-48'>
                  <NavigationMenuList className='w-48'>
                    {authButtons.map((item) => RenderMenuItem(item))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            : <div className="flex gap-2">
                {authButtons.map(({ title, url, variant }, idx) => (
                  <Button asChild key={idx} variant={variant}>
                    <Link to={url}>{title}</Link>
                  </Button>
                ))}
              </div>
          }
        </nav>

        {/* Mobile Menu */}
        <div className="block sticky lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={logo.url} className="flex items-center gap-2">
              <img src={logo.src} className={"h-" + logo.size + " dark:invert mt-1"} alt={logo.alt} />
            </Link>

            {/* Mobile Side Panel */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="mx-4">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    {/* <a href={logo.url} className={`flex items-center gap-2 size-${logo.size} `}> */}
                      <img src={logo.src} className={"h-" + logo.size + " dark:invert mt-2"} alt={logo.alt} />
                    {/* </a> */}
                  </SheetTitle>
                  <SheetDescription />
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                    {menu.map((item) => RenderMobileMenuItem(item))}
                  </Accordion>

                  {/* User/Login Section - Mobile */}
                  {authButtons?.[0]?.items 
                    ? // If user is logged in, show the mobile buttons from authUser items
                      authButtons[0].items.map((button, id) => 
                        button.function ? (
                          <Button key={id} variant={button.variant} onClick={button.function}>
                            {button.titleMobile}
                          </Button>
                        ) : (
                          <Button asChild key={id} variant={button.variant}>
                            <Link to={button.url}>{button.titleMobile}</Link>
                          </Button>
                        )
                      )
                    : // If user is not logged in, show login/signup buttons
                      authButtons.map(({ title, url, variant }, idx) => (
                        <Button asChild key={idx} variant={variant}>
                          <Link to={url}>{title}</Link>
                        </Button>
                      ))
                  }
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const RenderMenuItem = (item) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className="bg-popover text-popover-foreground">
          {item.items.map((subItem) =>
            subItem.isButton ? (
              <Button key={subItem.title} onClick={subItem.function} variant="ghost" 
                className={cn("flex flex-row gap-4 !py-6 w-full rounded-sm p-3",
                              "leading-none text-sm font-semibold justify-start")}>
                <span className="text-foreground">{subItem.icon}</span>
                <span>{subItem.title}</span>
              </Button>
            ) : (
              <SubMenuLink key={subItem.title} item={subItem} />
            )
          )}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink asChild className={cn(
          "bg-background hover:bg-muted hover:text-accent-foreground group inline-flex",
          "h-10 w-max items-center justify-center rounded-sm px-4 py-2 text-sm font-medium transition-colors"
        )}>
        <Link to={item.url}>{item.title}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const RenderMobileMenuItem = (item) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => 
            subItem.isButton ? (
              <Button key={subItem.title} onClick={subItem.function} variant="ghost" 
                className={cn("flex flex-row gap-4 !py-6 w-full rounded-sm p-3",
                              "leading-none text-sm font-semibold justify-start")}>
                <span className="text-foreground">{subItem.icon}</span>
                <span>{subItem.title}</span>
              </Button>
            ) : (
              <SubMenuLink key={subItem.title} item={subItem} />
            )
          )}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link key={item.title} to={item.url} className="text-md font-semibold">
      {item.title}
    </Link>
  );
};

const SubMenuLink = ({ item }) => {
  if (item.onClick) {
    return (
      <button
        onClick={item.onClick}
        className={cn("hover:bg-muted hover:text-accent-foreground flex min-w-80 select-none",
                      "flex-row gap-4 rounded-sm p-3 leading-none no-underline outline-none transition-colors text-left w-full")}>
        <div className="text-foreground">{item.icon}</div>
        <div>
          <div className="text-sm font-semibold">{item.title}</div>
          {item.description && (
            <p className="text-muted-foreground text-sm leading-snug">
              {item.description}
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <Link to={item.url} className={cn("hover:bg-muted hover:text-accent-foreground flex min-w-80 select-none",
                    "flex-row gap-4 rounded-sm p-3 leading-none no-underline outline-none transition-colors")}>
      <div className="text-foreground">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-muted-foreground text-sm leading-snug">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export { NavBarComponent };