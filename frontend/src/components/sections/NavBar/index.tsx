"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuiz } from "@/contexts/QuizContext";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const { isQuizInProgress, endQuiz } = useQuiz();
  const router = useRouter();

  // Reset quiz state when navigating to dashboard
  useEffect(() => {
    if (pathname === "/dashboard") {
      endQuiz();
    }
  }, [pathname, endQuiz]);

  const handleNavigation = (path: string) => {
    if (!isQuizInProgress || path === "/dashboard") {
      router.push(path);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 border-b bg-background z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="relative w-8 h-8">
            <Image
              src="/placeholder-logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant={pathname === "/" ? "default" : "outline"}
              onClick={() => handleNavigation("/")}
              disabled={isQuizInProgress}
            >
              New Quiz
            </Button>

            <Button
              variant={pathname === "/dashboard" ? "default" : "outline"}
              onClick={() => handleNavigation("/dashboard")}
              disabled={isQuizInProgress}
            >
              Dashboard
            </Button>

            {/* Theme Toggle */}
            <ModeToggle />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-4">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem
                  onClick={() => handleNavigation("/")}
                  disabled={isQuizInProgress}
                >
                  New Quiz
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigation("/dashboard")}
                  disabled={isQuizInProgress}
                >
                  Dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under the navbar */}
      <div className="h-16" />
    </>
  );
}
